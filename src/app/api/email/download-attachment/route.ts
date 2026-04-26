import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { ImapFlow } from "imapflow";
import { decryptPassword } from "@/lib/email/encryption";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function getAdminSupabase() {
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

  const { attachmentIds } = await request.json();
  if (!Array.isArray(attachmentIds) || attachmentIds.length === 0) {
    return NextResponse.json({ error: "Липсват attachmentIds" }, { status: 400 });
  }

  const admin = getAdminSupabase();

  // Fetch records that belong to this user and have IMAP metadata
  const { data: records, error: fetchError } = await admin
    .from("email_attachments")
    .select("id, account_id, filename, mime_type, imap_uid, imap_part")
    .in("id", attachmentIds)
    .eq("user_id", user.id)
    .not("imap_uid", "is", null);

  if (fetchError) {
    return NextResponse.json({ error: "Грешка при четене на DB" }, { status: 500 });
  }

  if (!records || records.length === 0) {
    return NextResponse.json({ downloaded: 0, errors: [] });
  }

  // Group by account_id to reuse IMAP connections
  const byAccount = new Map<string, typeof records>();
  for (const rec of records) {
    if (!byAccount.has(rec.account_id)) byAccount.set(rec.account_id, []);
    byAccount.get(rec.account_id)!.push(rec);
  }

  let downloaded = 0;
  const errors: { id: string; filename: string; error: string }[] = [];

  for (const [accountId, attachments] of byAccount) {
    // Fetch account credentials
    const { data: account, error: accErr } = await admin
      .from("email_accounts")
      .select("*")
      .eq("id", accountId)
      .eq("user_id", user.id)
      .single();

    if (accErr || !account) {
      for (const att of attachments) {
        errors.push({ id: att.id, filename: att.filename, error: "Акаунтът не е намерен" });
      }
      continue;
    }

    let password: string;
    try {
      password = decryptPassword(account.encrypted_password);
    } catch {
      for (const att of attachments) {
        errors.push({ id: att.id, filename: att.filename, error: "Грешка при декриптиране" });
      }
      continue;
    }

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

    try {
      await client.connect();
      const lock = await client.getMailboxLock("INBOX");

      try {
        for (const att of attachments) {
          if (!att.imap_uid || !att.imap_part) {
            errors.push({ id: att.id, filename: att.filename, error: "Липсват imap_uid или imap_part" });
            continue;
          }

          try {
            const partData = await client.fetchOne(
              String(att.imap_uid),
              { bodyParts: [att.imap_part] },
              { uid: true }
            );

            if (!partData) {
              errors.push({ id: att.id, filename: att.filename, error: "fetchOne върна null" });
              continue;
            }

            const bpMap = (partData as unknown as { bodyParts?: Map<string, Buffer> }).bodyParts;
            const rawBuf = bpMap?.get(att.imap_part);
            // ImapFlow returns raw base64-encoded content — decode it
            const buf = rawBuf && rawBuf.length > 0
              ? Buffer.from(rawBuf.toString("ascii").replace(/[\r\n]/g, ""), "base64")
              : null;

            if (!buf || buf.length === 0) {
              errors.push({ id: att.id, filename: att.filename, error: "Празен буфер" });
              continue;
            }

            // Sanitize filename for storage path
            const safeFilename = att.filename
              .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
              .replace(/[^\x00-\x7F]/g, "_")
              .replace(/[^a-zA-Z0-9._-]/g, "_")
              .replace(/_+/g, "_")
              .replace(/^_|_$/g, "") || "attachment.bin";

            const storagePath = `${user.id}/${att.id}/${safeFilename}`;

            const { error: uploadError } = await admin.storage
              .from("email-attachments")
              .upload(storagePath, buf, {
                contentType: att.mime_type || "application/octet-stream",
                upsert: true,
              });

            if (uploadError) {
              errors.push({ id: att.id, filename: att.filename, error: `Storage: ${uploadError.message}` });
              continue;
            }

            const { error: updateError } = await admin
              .from("email_attachments")
              .update({
                status: "downloaded",
                storage_path: storagePath,
                file_size: buf.length,
              })
              .eq("id", att.id);

            if (updateError) {
              errors.push({ id: att.id, filename: att.filename, error: `DB update: ${updateError.message}` });
            } else {
              downloaded++;
            }
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            errors.push({ id: att.id, filename: att.filename, error: msg });
          }
        }
      } finally {
        lock.release();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      for (const att of attachments) {
        errors.push({ id: att.id, filename: att.filename, error: `IMAP: ${msg}` });
      }
    } finally {
      try { await client.logout(); } catch { /* ignore */ }
    }
  }

  return NextResponse.json({ downloaded, errors });
}

// GET /api/email/download-attachment?id=<attachmentId>
// Streams the file directly to the browser (no signed URL needed)
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const id = request.nextUrl.searchParams.get("id");
  if (!id) return new NextResponse("Missing id", { status: 400 });

  const admin = getAdminSupabase();

  const { data: att, error: attErr } = await admin
    .from("email_attachments")
    .select("id, account_id, filename, mime_type, storage_path, imap_uid, imap_part")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (attErr || !att) return new NextResponse("Not found", { status: 404 });

  let buf: Buffer | null = null;

  // Try Storage first
  if (att.storage_path) {
    const { data: fileData } = await admin.storage
      .from("email-attachments")
      .download(att.storage_path);
    if (fileData) buf = Buffer.from(await fileData.arrayBuffer());
  }

  // Fallback: fetch from IMAP
  if (!buf && att.imap_uid && att.imap_part && att.account_id) {
    const { data: account } = await admin
      .from("email_accounts")
      .select("*")
      .eq("id", att.account_id)
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
            String(att.imap_uid),
            { bodyParts: [att.imap_part] },
            { uid: true }
          );
          const bpMap = (partData as unknown as { bodyParts?: Map<string, Buffer> }).bodyParts;
          const rawFetched = bpMap?.get(att.imap_part);
          // ImapFlow returns raw base64-encoded content — decode it
          const fetched = rawFetched && rawFetched.length > 0
            ? Buffer.from(rawFetched.toString("ascii").replace(/[\r\n]/g, ""), "base64")
            : null;
          if (fetched && fetched.length > 0) {
            buf = fetched;
            // Cache in Storage
            const safe = att.filename
              .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
              .replace(/[^\x00-\x7F]/g, "_")
              .replace(/[^a-zA-Z0-9._-]/g, "_")
              .replace(/_+/g, "_")
              .replace(/^_|_$/g, "") || "attachment.bin";
            const storagePath = `${user.id}/${id}/${safe}`;
            const { error: upErr } = await admin.storage
              .from("email-attachments")
              .upload(storagePath, buf, { contentType: att.mime_type || "application/octet-stream", upsert: true });
            if (!upErr) {
              await admin.from("email_attachments")
                .update({ status: "downloaded", storage_path: storagePath, file_size: buf.length })
                .eq("id", id);
            }
          }
        } finally { lock.release(); }
        try { await client.logout(); } catch { /* ignore */ }
      } catch { /* IMAP failed */ }
    }
  }

  if (!buf) return new NextResponse("File not available", { status: 404 });

  const safeFilename = encodeURIComponent(att.filename);
  const mimeType = att.mime_type || "application/octet-stream";
  // Use ReadableStream for reliable binary streaming
  const copy = Uint8Array.from(buf);
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(copy);
      controller.close();
    },
  });
  return new NextResponse(stream, {
    headers: {
      "Content-Type": mimeType,
      "Content-Disposition": `attachment; filename*=UTF-8''${safeFilename}`,
      "Content-Length": String(buf.length),
    },
  });
}
