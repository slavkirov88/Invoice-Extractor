"use server";

import { Mistral } from "@mistralai/mistralai";
import type { ExtractedInvoiceData } from "@/types";

const mistral = new Mistral({ apiKey: process.env.MISTRAL_API_KEY! });

export async function extractInvoiceData(
  pdfBase64: string
): Promise<ExtractedInvoiceData> {
  const response = await mistral.chat.complete({
    model: "mistral-small-latest",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Анализирай тази фактура и извлечи следните данни:
1. Номер на документа (фактурата)
2. Дата на издаване (във формат YYYY-MM-DD)
3. Обща стойност в лева (само числото)

Върни отговора САМО като JSON обект в следния формат, без допълнителен текст:
{"documentNumber": "...", "issueDate": "YYYY-MM-DD", "amount": 0.00}`,
          },
          {
            type: "document_url",
            documentUrl: `data:application/pdf;base64,${pdfBase64}`,
          },
        ],
      },
    ],
  });

  const content = response.choices?.[0]?.message?.content;
  if (!content || typeof content !== "string") {
    throw new Error("Не можахме да извлечем данни от фактурата");
  }

  // Extract JSON from the response (handle markdown code blocks)
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Невалиден отговор от AI");
  }

  const parsed = JSON.parse(jsonMatch[0]);

  return {
    documentNumber: String(parsed.documentNumber || ""),
    issueDate: String(parsed.issueDate || ""),
    amount: Number(parsed.amount) || 0,
  };
}
