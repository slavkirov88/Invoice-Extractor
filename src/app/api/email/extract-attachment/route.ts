import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { Mistral } from "@mistralai/mistralai";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { attachmentId } = await request.json();
  if (!attachmentId) {
    return NextResponse.json({ error: "Липсва attachmentId" }, { status: 400 });
  }

  // Verify ownership
  const { data: attachment, error: attError } = await supabase
    .from("email_attachments")
    .select("storage_path, filename, mime_type")
    .eq("id", attachmentId)
    .eq("user_id", user.id)
    .single();

  if (attError || !attachment) {
    return NextResponse.json({ error: "Файлът не е намерен" }, { status: 404 });
  }

  // Download file from Supabase Storage using admin client
  const admin = getAdminClient();
  const { data: fileData, error: downloadError } = await admin.storage
    .from("email-attachments")
    .download(attachment.storage_path);

  if (downloadError || !fileData) {
    return NextResponse.json(
      { error: "Грешка при изтегляне на файла от Storage" },
      { status: 500 }
    );
  }

  if (!process.env.MISTRAL_API_KEY) {
    return NextResponse.json(
      { error: "AI услугата не е конфигурирана" },
      { status: 500 }
    );
  }

  const mistral = new Mistral({ apiKey: process.env.MISTRAL_API_KEY });

  try {
    const arrayBuffer = await fileData.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    // OCR extraction
    let ocrText = "";
    try {
      const ocrResponse = await mistral.ocr.process({
        model: "mistral-ocr-latest",
        document: {
          type: "document_url",
          documentUrl: `data:application/pdf;base64,${base64}`,
        },
      });
      ocrText = ocrResponse.pages?.map((p) => p.markdown).join("\n\n") || "";
    } catch {
      // fallback to vision
    }

    let content: string | null = null;

    if (ocrText) {
      const response = await mistral.chat.complete({
        model: "mistral-small-latest",
        messages: [{
          role: "user",
          content: `Анализирай този текст от финансов документ и извлечи:
1. Номер на документа
2. Дата на издаване (YYYY-MM-DD)
3. Обща стойност в евро. Ако е в BGN, раздели на 1.95583.

Върни САМО JSON: {"documentNumber": "...", "issueDate": "YYYY-MM-DD", "amount": 0.00}

${ocrText}`,
        }],
      });
      const raw = response.choices?.[0]?.message?.content;
      content = typeof raw === "string" ? raw : null;
    } else {
      const response = await mistral.chat.complete({
        model: "mistral-small-latest",
        messages: [{
          role: "user",
          content: [
            { type: "text", text: 'Извлечи: номер, дата (YYYY-MM-DD), сума EUR. Върни САМО JSON: {"documentNumber":"...","issueDate":"YYYY-MM-DD","amount":0.00}' },
            { type: "document_url", documentUrl: `data:application/pdf;base64,${base64}` },
          ],
        }],
      });
      const raw = response.choices?.[0]?.message?.content;
      content = typeof raw === "string" ? raw : null;
    }

    if (!content) {
      return NextResponse.json({ error: "AI не върна резултат" }, { status: 422 });
    }

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "AI не върна валиден JSON" }, { status: 422 });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json({
      documentNumber: String(parsed.documentNumber || ""),
      issueDate: String(parsed.issueDate || ""),
      amount: Number(parsed.amount) || 0,
    });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "Грешка при AI обработка: " + msg }, { status: 500 });
  }
}
