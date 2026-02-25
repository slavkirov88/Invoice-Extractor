import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Mistral } from "@mistralai/mistralai";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  // Auth check
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check API key
  if (!process.env.MISTRAL_API_KEY) {
    console.error("MISTRAL_API_KEY is not set");
    return NextResponse.json(
      { error: "AI услугата не е конфигурирана. Липсва MISTRAL_API_KEY." },
      { status: 500 }
    );
  }

  const mistral = new Mistral({ apiKey: process.env.MISTRAL_API_KEY });

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "Не е качен файл" },
        { status: 400 }
      );
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Файлът е твърде голям. Максималният размер е 10MB." },
        { status: 413 }
      );
    }

    // Convert file to base64 on the server
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    // Step 1: OCR — extract text from PDF
    let ocrText = "";
    try {
      const ocrResponse = await mistral.ocr.process({
        model: "mistral-ocr-latest",
        document: {
          type: "document_url",
          documentUrl: `data:application/pdf;base64,${base64}`,
        },
      });

      ocrText = ocrResponse.pages
        ?.map((page) => page.markdown)
        .join("\n\n") || "";
    } catch (ocrError) {
      console.error("OCR failed, falling back to direct chat:", ocrError);
    }

    let content: string | null = null;

    if (ocrText) {
      // Step 2a: Use extracted text with chat model (more reliable)
      const response = await mistral.chat.complete({
        model: "mistral-small-latest",
        messages: [
          {
            role: "user",
            content: `Анализирай този текст от финансов документ и извлечи:

1. Номер на документа (фактура №, Invoice No, Document No, и т.н.)
2. Дата на издаване (във формат YYYY-MM-DD)
3. Обща стойност/сума (само числото). Ако сумата е в EUR, конвертирай в BGN по курс 1.95583.

ВАЖНО:
- Датата може да е в различни формати — винаги върни YYYY-MM-DD
- Стойността може да е означена като "Total", "Обща стойност", "Amount", "Сума", "ВСИЧКО", "Grand Total" и т.н.
- Ако не можеш да намериш стойност, върни 0

Върни САМО JSON: {"documentNumber": "...", "issueDate": "YYYY-MM-DD", "amount": 0.00}

Текст на документа:
${ocrText}`,
          },
        ],
      });

      const rawContent = response.choices?.[0]?.message?.content;
      content = typeof rawContent === "string" ? rawContent : null;
    } else {
      // Step 2b: Fallback — send PDF directly to vision model
      const response = await mistral.chat.complete({
        model: "mistral-small-latest",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Анализирай този документ и извлечи:
1. Номер на документа
2. Дата на издаване (YYYY-MM-DD)
3. Обща стойност (число). EUR → BGN по курс 1.95583.

Върни САМО JSON: {"documentNumber": "...", "issueDate": "YYYY-MM-DD", "amount": 0.00}`,
              },
              {
                type: "document_url",
                documentUrl: `data:application/pdf;base64,${base64}`,
              },
            ],
          },
        ],
      });

      const rawContent = response.choices?.[0]?.message?.content;
      content = typeof rawContent === "string" ? rawContent : null;
    }

    if (!content) {
      return NextResponse.json(
        { error: "Не можахме да извлечем данни от документа. Моля опитайте с друг файл." },
        { status: 422 }
      );
    }

    // Extract JSON from the response (handle markdown code blocks)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("Mistral response without JSON:", content);
      return NextResponse.json(
        { error: "AI не върна валиден отговор. Моля опитайте отново." },
        { status: 422 }
      );
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return NextResponse.json({
      documentNumber: String(parsed.documentNumber || ""),
      issueDate: String(parsed.issueDate || ""),
      amount: Number(parsed.amount) || 0,
    });
  } catch (error) {
    console.error("Extract invoice error:", error);

    const message =
      error instanceof Error ? error.message : String(error);

    if (message.includes("too large") || message.includes("size")) {
      return NextResponse.json(
        { error: "Файлът е твърде голям. Максималният размер е 10MB." },
        { status: 413 }
      );
    }

    // Show actual error for debugging
    return NextResponse.json(
      { error: "Грешка при обработка: " + message },
      { status: 500 }
    );
  }
}
