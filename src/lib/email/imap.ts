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
  console.log(`[IMAP] ▶ syncEmailAccount start — accountId=${accountId} userId=${userId} force=${force}`);

  const supabase = getAdminSupabase();

  // 1. Fetch account
  console.log('[IMAP] 1/7 fetching account from DB...');
  const { data: account, error: accountError } = await supabase
    .from('email_accounts')
    .select('*')
    .eq('id', accountId)
    .eq('user_id', userId)
    .single();

  if (accountError || !account) {
    console.error('[IMAP] ✗ Account not found:', accountError?.message);
    return { newAttachments: 0, error: 'Акаунтът не е намерен' };
  }
  console.log(`[IMAP] ✓ Account found — email=${account.email_address} host=${account.imap_host}:${account.imap_port} secure=${account.imap_secure}`);

  // 2. Decrypt password
  console.log('[IMAP] 2/7 decrypting password...');
  let password: string;
  try {
    password = decryptPassword(account.encrypted_password);
    console.log('[IMAP] ✓ Password decrypted OK');
  } catch (e) {
    console.error('[IMAP] ✗ Decryption failed:', e);
    return { newAttachments: 0, error: 'Грешка при декриптиране на паролата' };
  }

  // 3. Create IMAP client
  console.log(`[IMAP] 3/7 creating IMAP client — ${account.imap_host}:${account.imap_port} secure=${account.imap_secure}`);
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
    // 4. Connect
    console.log('[IMAP] 4/7 connecting...');
    await client.connect();
    console.log('[IMAP] ✓ Connected to IMAP server');

    const lock = await client.getMailboxLock('INBOX');
    console.log('[IMAP] ✓ INBOX locked');

    try {
      const sinceDate = force || !account.last_synced_at
        ? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        : new Date(Math.max(
            new Date(account.last_synced_at).getTime() - 2 * 24 * 60 * 60 * 1000,
            Date.now() - 30 * 24 * 60 * 60 * 1000
          ));

      console.log(`[IMAP] 5/7 searching messages since ${sinceDate.toISOString()} (force=${force}, last_synced=${account.last_synced_at ?? 'never'})`);

      // 5. Search
      const searchResult = await client.search({ since: sinceDate }, { uid: true });
      const uidList: number[] = !searchResult || (searchResult as unknown) === false ? [] : (searchResult as number[]);
      console.log(`[IMAP] ✓ Search done — ${uidList.length} messages found`);

      if (uidList.length === 0) {
        console.log('[IMAP] No messages to process — done');
      } else {
        // 6. Fetch messages
        console.log(`[IMAP] 6/7 fetching envelopes + body structure for ${uidList.length} messages...`);
        const messages = await client.fetchAll(
          uidList,
          { envelope: true, bodyStructure: true, uid: true },
          { uid: true }
        );
        console.log(`[IMAP] ✓ Fetched ${messages.length} messages`);

        for (const message of messages) {
          const messageId = message.envelope?.messageId || `uid-${message.uid}`;
          const subject = message.envelope?.subject ?? '(no subject)';
          const bodyStructure = message.bodyStructure as ImapPart | undefined;

          if (!bodyStructure) {
            console.log(`[IMAP] msg="${subject}" — no bodyStructure, skipping`);
            continue;
          }

          const attachmentParts = getAttachmentParts(bodyStructure);
          console.log(`[IMAP] msg="${subject}" id=${messageId} — ${attachmentParts.length} attachment(s)`);

          if (attachmentParts.length === 0) continue;

          // Check duplicate
          const { data: existing } = await supabase
            .from('email_attachments')
            .select('id, imap_uid')
            .eq('account_id', accountId)
            .eq('email_message_id', messageId);

          if (existing && existing.length > 0) {
            const allHaveImapUid = existing.every((r: { imap_uid: number | null }) => r.imap_uid);
            if (allHaveImapUid) {
              console.log(`[IMAP] msg="${subject}" — already synced with imap_uid, skipping`);
              continue;
            }
            // Old records without imap_uid — delete and re-sync
            const idsToDelete = existing
              .filter((r: { imap_uid: number | null }) => !r.imap_uid)
              .map((r: { id: string }) => r.id);
            if (idsToDelete.length > 0) {
              console.log(`[IMAP] msg="${subject}" — deleting ${idsToDelete.length} old record(s) without imap_uid`);
              await supabase.from('email_attachments').delete().in('id', idsToDelete);
            }
          }

          // 7. Save attachment metadata (no download yet)
          for (const part of attachmentParts) {
            if (!part.part) continue;

            const filename = getFilename(part) || 'attachment.bin';
            console.log(`[IMAP] 7/7 saving metadata for "${filename}" (part=${part.part} type=${part.type})`);

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

            if (insertError) {
              console.error(`[IMAP] ✗ DB insert failed for "${filename}":`, insertError.message);
            } else {
              console.log(`[IMAP] ✓ Metadata saved: "${filename}"`);
              newAttachments++;
            }
          }
        }
      }
    } finally {
      lock.release();
      console.log('[IMAP] INBOX lock released');
    }

    // Update last_synced_at
    await supabase
      .from('email_accounts')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('id', accountId);
    console.log('[IMAP] ✓ last_synced_at updated');

  } catch (err) {
    const errObj = err as Record<string, unknown>;
    const response = errObj?.response as string | undefined;
    const command = errObj?.command as string | undefined;
    const base = err instanceof Error ? err.message : String(err);

    console.error('[IMAP] ✗ FATAL ERROR:', base, { command, response });

    if (base.includes('packet length too long') || base.includes('tls_get_more_records') || base.includes('wrong version number')) {
      return { newAttachments, error: 'SSL грешка: сървърът не очаква криптирана връзка. Изтрийте акаунта и го добавете отново с "STARTTLS / Без (143)" вместо SSL/TLS.' };
    }
    if (base.includes('ETIMEDOUT') || base.includes('ECONNREFUSED') || base.includes('ENOTFOUND')) {
      return { newAttachments, error: 'Неуспешна връзка: проверете IMAP хоста и порта.' };
    }

    const detail = [command && `команда: ${command}`, response && `отговор: ${response}`]
      .filter(Boolean).join(', ');
    const errorMsg = detail ? `${base} (${detail})` : base;
    return { newAttachments, error: `IMAP грешка: ${errorMsg}` };
  } finally {
    try { await client.logout(); } catch { /* ignore */ }
    console.log(`[IMAP] ■ syncEmailAccount end — newAttachments=${newAttachments}`);
  }

  return { newAttachments };
}
