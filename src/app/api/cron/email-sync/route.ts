import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { syncEmailAccount } from "@/lib/email/imap";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function GET(request: NextRequest) {
  // Verify Vercel cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Fetch all email accounts across all users
  const { data: accounts, error } = await supabase
    .from("email_accounts")
    .select("id, user_id");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let totalNew = 0;
  const errors: string[] = [];

  for (const account of accounts || []) {
    const result = await syncEmailAccount(account.id, account.user_id);
    totalNew += result.newAttachments;
    if (result.error) {
      errors.push(`[${account.id}] ${result.error}`);
    }
  }

  console.log(`Cron email sync: ${totalNew} new attachments, ${errors.length} errors`);

  return NextResponse.json({
    synced: accounts?.length ?? 0,
    newAttachments: totalNew,
    errors,
  });
}
