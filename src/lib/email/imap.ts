import { ImapFlow } from 'imapflow';
import { createClient } from '@/lib/supabase/server';
import { decryptPassword } from './encryption';

interface BodyStructure {
  disposition?: string;
  filename?: string;
  type?: string;
  childNodes?: BodyStructure[];
  part?: string;
}

function getAttachmentParts(bodyStructure: BodyStructure, parts: BodyStructure[] = []): BodyStructure[] {
  if (bodyStructure.disposition?.toLowerCase() === 'attachment' && bodyStructure.filename) {
    parts.push(bodyStructure);
  }
  // Also catch inline PDFs without explicit disposition
  if (!bodyStructure.disposition && bodyStructure.filename) {
    parts.push(bodyStructure);
  }
  if (bodyStructure.childNodes) {
    for (const child of bodyStructure.childNodes) {
      getAttachmentParts(child, parts);
    }
  }
  return parts;
}

export async function syncEmailAccount(accountId: string, userId: string): Promise<{ newAttachments: number; error?: string }> {
  const supabase = await createClient();

  // Load account
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
    auth: {
      user: account.username,
      pass: password,
    },
    logger: false,
    // Increase timeout for slow connections
    connectionTimeout: 30000,
    greetingTimeout: 15000,
    socketTimeout: 30000,
  });

  let newAttachments = 0;

  try {
    await client.connect();

    const lock = await client.getMailboxLock('INBOX');
    try {
      // Search from last_synced_at or last 30 days
      const sinceDate = account.last_synced_at
        ? new Date(account.last_synced_at)
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      // Search returns sequence numbers (or UIDs if uid:true)
      const searchResult = await client.search({ since: sinceDate }, { uid: true });
      const uidList: number[] = searchResult === false ? [] : searchResult;

      if (uidList.length > 0) {
        // Use fetchAll instead of fetch loop to avoid streaming issues
        const messages = await client.fetchAll(
          uidList,
          { envelope: true, bodyStructure: true, uid: true },
          { uid: true }
        );

        for (const message of messages) {
          const messageId = message.envelope?.messageId || `uid-${message.uid}`;
          const bodyStructure = message.bodyStructure as BodyStructure | undefined;

          if (!bodyStructure) continue;

          const attachmentParts = getAttachmentParts(bodyStructure);
          if (attachmentParts.length === 0) continue;

          // Check for existing message to avoid duplicates
          const { data: existing } = await supabase
            .from('email_attachments')
            .select('id')
            .eq('account_id', accountId)
            .eq('email_message_id', messageId)
            .limit(1);

          if (existing && existing.length > 0) continue;

          for (const part of attachmentParts) {
            if (!part.part) continue;

            // Fetch the actual attachment data
            const partData = await client.fetchOne(
              String(message.uid),
              { bodyParts: [part.part] },
              { uid: true }
            );

            if (!partData) continue;

            // imapflow returns bodyParts as a Map
            const bpMap = (partData as unknown as { bodyParts?: Map<string, Buffer> }).bodyParts;
            if (!bpMap) continue;

            const attachmentBuffer = bpMap.get(part.part);
            if (!attachmentBuffer || attachmentBuffer.length === 0) continue;

            const filename = part.filename || 'attachment.bin';
            const attachmentId = crypto.randomUUID();
            const storagePath = `${userId}/${attachmentId}/${filename}`;

            // Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
              .from('email-attachments')
              .upload(storagePath, attachmentBuffer, {
                contentType: part.type || 'application/octet-stream',
                upsert: false,
              });

            if (uploadError) {
              console.error('Storage upload error:', uploadError.message);
              continue;
            }

            // Save attachment record
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
                file_size: attachmentBuffer.length,
                mime_type: part.type || null,
                storage_path: storagePath,
              });

            if (!insertError) {
              newAttachments++;
            }
          }
        }
      }
    } finally {
      lock.release();
    }

    // Update last_synced_at
    await supabase
      .from('email_accounts')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('id', accountId);

  } catch (err) {
    // Extract detailed error info from imapflow
    const errObj = err as Record<string, unknown>;
    const responseText = errObj?.response as string | undefined;
    const command = errObj?.command as string | undefined;
    const baseMsg = err instanceof Error ? err.message : String(err);

    const detail = [
      command ? `команда: ${command}` : null,
      responseText ? `отговор: ${responseText}` : null,
    ].filter(Boolean).join(', ');

    const errorMsg = detail ? `${baseMsg} (${detail})` : baseMsg;
    console.error('IMAP sync error:', errorMsg);
    return { newAttachments, error: `IMAP грешка: ${errorMsg}` };
  } finally {
    try {
      await client.logout();
    } catch {
      // ignore logout errors
    }
  }

  return { newAttachments };
}
