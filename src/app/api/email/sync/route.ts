import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { syncEmailAccount } from '@/lib/email/imap';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// POST — trigger IMAP sync for one or all accounts
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let accountId: string | undefined;
  let force = false;
  try {
    const body = await request.json();
    accountId = body?.accountId;
    force = body?.force === true;
  } catch {
    // body is optional
  }

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
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    accountIds = (accounts || []).map((a: { id: string }) => a.id);
  }

  if (accountIds.length === 0) {
    return NextResponse.json({ newAttachments: 0, errors: [] });
  }

  let totalNew = 0;
  const errors: string[] = [];

  for (const id of accountIds) {
    const result = await syncEmailAccount(id, user.id, force);
    totalNew += result.newAttachments;
    if (result.error) {
      errors.push(result.error);
    }
  }

  return NextResponse.json({ newAttachments: totalNew, errors });
}
