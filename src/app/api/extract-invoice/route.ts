import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Mistral } from "@mistralai/mistralai";

export const dynamic = "force-dynamic";

const mistral = new Mistral({ apiKey: process.env.MISTRAL_API_KEY! });

export async function POST(request: NextRequest) {
  // Auth check
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "Не е качен файл" },
        { status: 400 }
      );
    }

    // Convert file to base64 on the server (no size limit issues)
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    const response = await mistral.chat.complete({
      model: "mistral-small-latest",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Анализирай този документ (фактура, протокол, или друг финансов документ) и извлечи следните данни:

1. Номер на документа (фактура №, Invoice No, Document No, и т.н.)
2. Дата на издаване (във формат YYYY-MM-DD)
3. Обща стойност/сума (само числото, без валута). Ако сумата е в EUR, конвертирай в BGN по курс 1.95583. Ако е в друга валута, върни оригиналната стойност.

ВАЖНО:
- Търси номера на документа в горната част на фактурата
- Датата може да е в различни формати (DD.MM.YYYY, DD/MM/YYYY, YYYY-MM-DD и т.н.) — винаги върни YYYY-MM-DD
- Стойността може да е означена като "Total", "Обща стойност", "Amount", "Сума", "ВСИЧКО", "Grand Total" и т.н.
- Ако документът е на чужд език, все пак извлечи данните

Върни отговора САМО като JSON обект в следния формат, без допълнителен текст:
{"documentNumber": "...", "issueDate": "YYYY-MM-DD", "amount": 0.00}`,
            },
            {
              type: "document_url",
              documentUrl: `data:application/pdf;base64,${base64}`,
            },
          ],
        },
      ],
    });

    const content = response.choices?.[0]?.message?.content;
    if (!content || typeof content !== "string") {
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
      error instanceof Error ? error.message : "Неизвестна грешка";

    // Provide user-friendly messages for common errors
    if (message.includes("too large") || message.includes("size")) {
      return NextResponse.json(
        { error: "Файлът е твърде голям. Максималният размер е 10MB." },
        { status: 413 }
      );
    }

    if (message.includes("API") || message.includes("401") || message.includes("403")) {
      return NextResponse.json(
        { error: "Грешка при свързване с AI услугата. Моля опитайте по-късно." },
        { status: 502 }
      );
    }

    return NextResponse.json(
      { error: "Грешка при обработка на документа: " + message },
      { status: 500 }
    );
  }
}
