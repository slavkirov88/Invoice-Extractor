import { Mistral } from "@mistralai/mistralai";
import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `Ти си виртуален асистент на TravelInvoices (www.travelinvoices.com) — AI-базиран инструмент за управление на фактури и ДДС протоколи по маржов метод, създаден специално за туристически агенции в България.

Основна информация за продукта:
- Качвате PDF фактура, специализираният ни софтуер извлича данните (номер, дата, стойност)
- Автоматично генерираме протоколи по ЗДДС маржов метод (Раздел А, Б и В)
- Маржът, данъчната основа и ДДС се изчисляват автоматично
- Експорт в Excel и PDF
- Данните се съхраняват сигурно в ЕС
- GDPR съвместим, 256-bit SSL криптиране

Ценови планове:
- Безплатен: 1 месец, до 10 протокола или 20 фактури, без кредитна карта
- Професионален: 50€/месец — до 500 фактури, неограничени протоколи, приоритетна поддръжка
- Бизнес: 100€/месец — неограничени фактури и протоколи, VIP поддръжка, API достъп, множество потребители

Ключови предимства:
- Спестява 20+ часа месечно
- 99% точност на AI извличането
- От PDF до протокол за 30 секунди
- Лесен отказ по всяко време, без дългосрочни договори
- Създаден специално за българския ЗДДС маржов метод

Отговаряй кратко, полезно и на български. Ако не знаеш отговора, насочи към support@travelinvoices.com. Бъди приветлив и професионален. Целта ти е да помогнеш на потенциални клиенти да разберат продукта и да ги мотивираш да започнат безплатния тестов период.`;

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { message: "Чатът е временно недостъпен. Моля, опитайте по-късно." },
        { status: 200 }
      );
    }

    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { message: "Невалидна заявка." },
        { status: 400 }
      );
    }

    const client = new Mistral({ apiKey });

    const response = await client.chat.complete({
      model: "mistral-small-latest",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages.slice(-10).map((m: { role: string; content: string }) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      ],
      maxTokens: 500,
      temperature: 0.7,
    });

    const assistantMessage =
      response.choices?.[0]?.message?.content || "Съжалявам, не можах да генерирам отговор.";

    return NextResponse.json({ message: assistantMessage });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      {
        message:
          "Съжалявам, възникна грешка. Моля, опитайте отново или ни пишете на support@travelinvoices.com",
      },
      { status: 200 }
    );
  }
}
