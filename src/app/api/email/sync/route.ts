import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { syncEmailAccount } from '@/lib/email/imap';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// POST — trigger IMAP sync for one or all accounts
export async function POST(request: NextRequest) {
  console.log('[SYNC] ▶ POST /api/email/sync called');

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (!user) {
    console.log('[SYNC] ✗ Auth failed:', authError?.message);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  console.log('[SYNC] ✓ Auth OK — userId:', user.id);

  let accountId: string | undefined;
  let force = false;
  try {
    const body = await request.json();
    accountId = body?.accountId;
    force = body?.force === true;
  } catch {
    // body is optional
  }
  console.log('[SYNC] params — accountId:', accountId ?? 'ALL', 'force:', force);

  // Determine which accounts to sync
  let accountIds: string[];

  if (accountId) {
    accountIds = [accountId];
  } else {
    const { data: accounts, error } = await supabase
      .from('email_accounts')
      .select('id')
      .eq('user_id', user.id);

    if (error) {
      console.error('[SYNC] ✗ Failed to fetch accounts:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    accountIds = (accounts || []).map((a: { id: string }) => a.id);
  }

  console.log('[SYNC] accounts to sync:', accountIds.length, accountIds);

  if (accountIds.length === 0) {
    console.log('[SYNC] no accounts — returning early');
    return NextResponse.json({ newAttachments: 0, errors: [] });
  }

  let totalNew = 0;
  const errors: string[] = [];

  for (const id of accountIds) {
    console.log('[SYNC] → syncing account:', id);
    const result = await syncEmailAccount(id, user.id, force);
    console.log('[SYNC] ← result for', id, '— newAttachments:', result.newAttachments, 'error:', result.error ?? 'none');
    totalNew += result.newAttachments;
    if (result.error) {
      errors.push(result.error);
    }
  }

  console.log('[SYNC] ✓ done — total new:', totalNew, 'errors:', errors.length);
  return NextResponse.json({ newAttachments: totalNew, errors });
}
