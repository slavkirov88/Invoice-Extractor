import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { Mistral } from "@mistralai/mistralai";
import { withRetry } from "@/lib/mistral/with-retry";
import { ImapFlow } from "imapflow";
import { decryptPassword } from "@/lib/email/encryption";

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

  // Verify ownership — fetch all fields needed
  const admin = getAdminClient();
  const { data: attachment, error: attError } = await admin
    .from("email_attachments")
    .select("storage_path, filename, mime_type, imap_uid, imap_part, account_id")
    .eq("id", attachmentId)
    .eq("user_id", user.id)
    .single();

  if (attError || !attachment) {
    return NextResponse.json({ error: "Файлът не е намерен" }, { status: 404 });
  }

  if (attachment.mime_type !== "application/pdf") {
    return NextResponse.json(
      { error: "Поддържат се само PDF файлове" },
      { status: 422 }
    );
  }

  // Try to get file buffer — from Storage first, fall back to IMAP
  let fileBuffer: Buffer | null = null;

  if (attachment.storage_path) {
    const { data: fileData, error: downloadError } = await admin.storage
      .from("email-attachments")
      .download(attachment.storage_path);

    if (!downloadError && fileData) {
      fileBuffer = Buffer.from(await fileData.arrayBuffer());
    }
  }

  // If not in Storage but have IMAP metadata — fetch directly
  if (!fileBuffer && attachment.imap_uid && attachment.imap_part && attachment.account_id) {
    const { data: account } = await admin
      .from("email_accounts")
      .select("*")
      .eq("id", attachment.account_id)
      .single();

    if (account) {
      try {
        const password = decryptPassword(account.encrypted_password);
        const client = new ImapFlow({
          host: account.imap_host,
          port: Number(account.imap_port),
          secure: account.imap_secure,
          auth: { user: account.username, pass: password },
          logger: false,
          connectionTimeout: 30000,
          greetingTimeout: 15000,
          socketTimeout: 30000,
        });

        await client.connect();
        const lock = await client.getMailboxLock("INBOX");
        try {
          const partData = await client.fetchOne(
            String(attachment.imap_uid),
            { bodyParts: [attachment.imap_part] },
            { uid: true }
          );
          const bpMap = (partData as unknown as { bodyParts?: Map<string, Buffer> }).bodyParts;
          const rawBuf = bpMap?.get(attachment.imap_part);
          // ImapFlow returns raw base64-encoded content — decode it
          const buf = rawBuf && rawBuf.length > 0
            ? Buffer.from(rawBuf.toString("ascii").replace(/[\r\n]/g, ""), "base64")
            : null;
          if (buf && buf.length > 0) {
            fileBuffer = buf;

            // Upload to Storage for future use
            const safeFilename = attachment.filename
              .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
              .replace(/[^\x00-\x7F]/g, "_")
              .replace(/[^a-zA-Z0-9._-]/g, "_")
              .replace(/_+/g, "_")
              .replace(/^_|_$/g, "") || "attachment.bin";
            const storagePath = `${user.id}/${attachmentId}/${safeFilename}`;

            const { error: uploadErr } = await admin.storage
              .from("email-attachments")
              .upload(storagePath, buf, {
                contentType: attachment.mime_type || "application/octet-stream",
                upsert: true,
              });

            if (!uploadErr) {
              await admin
                .from("email_attachments")
                .update({ status: "downloaded", storage_path: storagePath, file_size: buf.length })
                .eq("id", attachmentId);
            }
          }
        } finally {
          lock.release();
        }
        try { await client.logout(); } catch { /* ignore */ }
      } catch {
        // IMAP fallback failed — fileBuffer stays null
      }
    }
  }

  if (!fileBuffer) {
    return NextResponse.json(
      { error: "Файлът не може да бъде изтеглен. Моля синхронизирайте имейлите отново." },
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
    const base64 = fileBuffer.toString("base64");

    // OCR extraction
    let ocrText = "";
    try {
      const ocrResponse = await withRetry(() => mistral.ocr.process({
        model: "mistral-ocr-latest",
        document: {
          type: "document_url",
          documentUrl: `data:application/pdf;base64,${base64}`,
        },
      }));
      ocrText = ocrResponse.pages?.map((p) => p.markdown).join("\n\n") || "";
    } catch {
      // fallback to vision
    }

    let content: string | null = null;

    if (ocrText) {
      const response = await withRetry(() => mistral.chat.complete({
        model: "mistral-small-latest",
        messages: [{
          role: "user",
          content: `Анализирай този текст от финансов документ и извлечи:
1. Номер на документа
2. Дата на издаване (YYYY-MM-DD)
3. Обща стойност в евро. Ако е в BGN, раздели на 1.95583.
4. ЕИК/VAT номер на ИЗДАТЕЛЯ (ЕИК, Булстат, VAT, ДДС №). С "BG" prefix ако е български. Ако няма — "999999999".

Върни САМО JSON: {"documentNumber": "...", "issueDate": "YYYY-MM-DD", "amount": 0.00, "counterparty_vat_id": "..."}

${ocrText}`,
        }],
      }));
      const raw = response.choices?.[0]?.message?.content;
      content = typeof raw === "string" ? raw : null;
    } else {
      const response = await withRetry(() => mistral.chat.complete({
        model: "mistral-small-latest",
        messages: [{
          role: "user",
          content: [
            { type: "text", text: 'Извлечи: номер, дата (YYYY-MM-DD), сума EUR, ЕИК на издателя (с "BG" prefix ако е български, иначе "999999999"). Върни САМО JSON: {"documentNumber":"...","issueDate":"YYYY-MM-DD","amount":0.00,"counterparty_vat_id":"..."}' },
            { type: "document_url", documentUrl: `data:application/pdf;base64,${base64}` },
          ],
        }],
      }));
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
      counterparty_vat_id: String(parsed.counterparty_vat_id || "999999999"),
    });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("429") || msg.includes("rate_limited") || msg.includes("Rate limit")) {
      return NextResponse.json(
        { error: "AI услугата е претоварена в момента. Изчакайте 30 секунди и опитайте отново." },
        { status: 429 }
      );
    }
    return NextResponse.json({ error: "Грешка при AI обработка: " + msg }, { status: 500 });
  }
}
