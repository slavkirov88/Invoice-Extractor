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
        : new Date(Math.max(
            new Date(account.last_synced_at).getTime() - 2 * 24 * 60 * 60 * 1000,
            Date.now() - 30 * 24 * 60 * 60 * 1000
          ));

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

          // Skip already-synced messages (only if they have imap_uid)
          const { data: existing } = await supabase
            .from('email_attachments')
            .select('id, imap_uid')
            .eq('account_id', accountId)
            .eq('email_message_id', messageId);

          if (existing && existing.length > 0) {
            const allHaveImapUid = existing.every((r: { imap_uid: number | null }) => r.imap_uid);
            if (allHaveImapUid) continue;
            // Delete old records without imap_uid and re-sync
            const idsToDelete = existing
              .filter((r: { imap_uid: number | null }) => !r.imap_uid)
              .map((r: { id: string }) => r.id);
            if (idsToDelete.length > 0) {
              await supabase.from('email_attachments').delete().in('id', idsToDelete);
            }
          }

          // Save attachment metadata only (no download yet)
          for (const part of attachmentParts) {
            if (!part.part) continue;

            const filename = getFilename(part) || 'attachment.bin';

            const { error: insertError } = await supabase
              .from('email_attachments')
              .insert({
                id: crypto.randomUUID(),
                user_id: userId,
                account_id: accountId,
                email_subject: message.envelope?.subject || null,
                email_from: message.envelope?.from?.[0]?.address || null,
                email_date: message.envelope?.date?.toISOString() || null,
                email_message_id: messageId,
                filename,
                file_size: (part as unknown as { size?: number }).size || null,
                mime_type: part.type || null,
                storage_path: null,
                status: 'pending',
                imap_uid: message.uid,
                imap_part: part.part,
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
