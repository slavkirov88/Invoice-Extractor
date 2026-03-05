import { ImapFlow } from 'imapflow';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { decryptPassword } from './encryption';

function getAdminSupabase() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// imapflow body structure object
interface ImapPart {
  part?: string;
  type?: string;
  parameters?: Record<string, string>;
  disposition?: string;
  dispositionParameters?: Record<string, string>;
  childNodes?: ImapPart[];
}

// Extract filename from imapflow part (checks all possible locations)
function getFilename(part: ImapPart): string | null {
  return (
    part.dispositionParameters?.filename ||
    part.dispositionParameters?.['filename*']?.replace(/^[^']*''/, '') ||
    part.parameters?.name ||
    part.parameters?.['name*']?.replace(/^[^']*''/, '') ||
    null
  );
}

// Recursively collect all attachment parts
function getAttachmentParts(part: ImapPart, result: ImapPart[] = []): ImapPart[] {
  const filename = getFilename(part);
  const disposition = part.disposition?.toLowerCase();
  const type = part.type?.toLowerCase() || '';

  const isAttachment = disposition === 'attachment';
  const hasFilename = !!filename;
  const isBinaryType = type.startsWith('application/') || type.startsWith('image/');

  if (hasFilename && (isAttachment || isBinaryType)) {
    result.push(part);
  }

  if (part.childNodes) {
    for (const child of part.childNodes) {
      getAttachmentParts(child, result);
    }
  }
  return result;
}

export async function syncEmailAccount(
  accountId: string,
  userId: string,
  force = false
): Promise<{ newAttachments: number; error?: string }> {
  const supabase = getAdminSupabase();

  const { data: account, error: accountError } = await supabase
    .from('email_accounts')
    .select('*')
    .eq('id', accountId)
    .eq('user_id', userId)
    .single();

  if (accountError || !account) {
    return { newAttachments: 0, error: 'Акаунтът не е намерен' };
  }

  let password: string;
  try {
    password = decryptPassword(account.encrypted_password);
  } catch {
    return { newAttachments: 0, error: 'Грешка при декриптиране на паролата' };
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

  let newAttachments = 0;

  try {
    await client.connect();
    const lock = await client.getMailboxLock('INBOX');

    try {
      const sinceDate = force || !account.last_synced_at
        ? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        : new Date(account.last_synced_at);

      console.log(`[IMAP sync] account=${accountId} force=${force} sinceDate=${sinceDate.toISOString()}`);

      const searchResult = await client.search({ since: sinceDate }, { uid: true });
      const uidList: number[] = !searchResult || (searchResult as unknown) === false ? [] : (searchResult as number[]);

      console.log(`[IMAP sync] found ${uidList.length} messages since ${sinceDate.toISOString()}`);

      if (uidList.length > 0) {
        const messages = await client.fetchAll(
          uidList,
          { envelope: true, bodyStructure: true, uid: true },
          { uid: true }
        );

        for (const message of messages) {
          const messageId = message.envelope?.messageId || `uid-${message.uid}`;
          const bodyStructure = message.bodyStructure as ImapPart | undefined;
          if (!bodyStructure) continue;

          const attachmentParts = getAttachmentParts(bodyStructure);
          console.log(`[IMAP sync] msg=${messageId} subject="${message.envelope?.subject}" attachmentParts=${attachmentParts.length} bodyStructure=${JSON.stringify(bodyStructure)}`);
          if (attachmentParts.length === 0) continue;

          // Skip already-synced messages
          const { data: existing } = await supabase
            .from('email_attachments')
            .select('id')
            .eq('account_id', accountId)
            .eq('email_message_id', messageId)
            .limit(1);

          if (existing && existing.length > 0) continue;

          for (const part of attachmentParts) {
            if (!part.part) continue;

            const filename = getFilename(part) || 'attachment.bin';
            // Sanitize for Supabase Storage path (ASCII only, no spaces/special chars)
            const safeFilename = filename
              .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove diacritics
              .replace(/[^\x00-\x7F]/g, '_')                   // replace non-ASCII
              .replace(/[^a-zA-Z0-9._-]/g, '_')                // replace special chars
              .replace(/_+/g, '_')                              // collapse multiple _
              .replace(/^_|_$/g, '');                           // trim leading/trailing _

            // Fetch the binary data for this part
            const partData = await client.fetchOne(
              String(message.uid),
              { bodyParts: [part.part] },
              { uid: true }
            );
            if (!partData) continue;

            const bpMap = (partData as unknown as { bodyParts?: Map<string, Buffer> }).bodyParts;
            if (!bpMap) continue;

            const buf = bpMap.get(part.part);
            if (!buf || buf.length === 0) continue;

            const attachmentId = crypto.randomUUID();
            const storagePath = `${userId}/${attachmentId}/${safeFilename || 'attachment.bin'}`;

            const { error: uploadError } = await supabase.storage
              .from('email-attachments')
              .upload(storagePath, buf, {
                contentType: part.type || 'application/octet-stream',
                upsert: false,
              });

            if (uploadError) {
              console.error('Upload error:', uploadError.message);
              continue;
            }

            const { error: insertError } = await supabase
              .from('email_attachments')
              .insert({
                id: attachmentId,
                user_id: userId,
                account_id: accountId,
                email_subject: message.envelope?.subject || null,
                email_from: message.envelope?.from?.[0]?.address || null,
                email_date: message.envelope?.date?.toISOString() || null,
                email_message_id: messageId,
                filename,
                file_size: buf.length,
                mime_type: part.type || null,
                storage_path: storagePath,
              });

            if (!insertError) newAttachments++;
          }
        }
      }
    } finally {
      lock.release();
    }

    await supabase
      .from('email_accounts')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('id', accountId);

  } catch (err) {
    const errObj = err as Record<string, unknown>;
    const response = errObj?.response as string | undefined;
    const command = errObj?.command as string | undefined;
    const base = err instanceof Error ? err.message : String(err);
    const detail = [command && `команда: ${command}`, response && `отговор: ${response}`]
      .filter(Boolean).join(', ');
    const errorMsg = detail ? `${base} (${detail})` : base;
    console.error('IMAP sync error:', errorMsg);
    return { newAttachments, error: `IMAP грешка: ${errorMsg}` };
  } finally {
    try { await client.logout(); } catch { /* ignore */ }
  }

  return { newAttachments };
}
