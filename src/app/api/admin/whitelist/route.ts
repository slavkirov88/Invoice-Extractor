import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

const ADMIN_EMAIL = "slavkirov@abv.bg";

async function verifyAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) return null;
  return user;
}

function getAdminSupabase() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// GET — list all whitelisted emails
export async function GET() {
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const adminSupabase = getAdminSupabase();

  const { data, error } = await adminSupabase
    .from("whitelisted_emails")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching whitelist:", error);
    return NextResponse.json(
      { error: "Failed to fetch whitelist" },
      { status: 500 }
    );
  }

  // Get usage stats for whitelisted emails — count protocols and invoices
  const emails = data.map((w) => w.email);

  // Get all auth users to map email → user_id
  const {
    data: { users },
  } = await adminSupabase.auth.admin.listUsers();

  const whitelistWithStats = data.map((entry) => {
    const user = users?.find((u) => u.email === entry.email);
    return {
      ...entry,
      user_id: user?.id || null,
      registered: !!user,
      registered_at: user?.created_at || null,
    };
  });

  // Get protocol/invoice counts for registered users
  const registeredIds = whitelistWithStats
    .filter((w) => w.user_id)
    .map((w) => w.user_id!);

  let protocolCounts: Record<string, number> = {};
  let invoiceCounts: Record<string, number> = {};

  if (registeredIds.length > 0) {
    const { data: protocols } = await adminSupabase
      .from("protocols")
      .select("user_id")
      .in("user_id", registeredIds);

    const { data: invoices } = await adminSupabase
      .from("invoices")
      .select("user_id")
      .in("user_id", registeredIds);

    for (const p of protocols || []) {
      protocolCounts[p.user_id] = (protocolCounts[p.user_id] || 0) + 1;
    }
    for (const i of invoices || []) {
      invoiceCounts[i.user_id] = (invoiceCounts[i.user_id] || 0) + 1;
    }
  }

  const result = whitelistWithStats.map((w) => ({
    ...w,
    protocols_count: w.user_id ? protocolCounts[w.user_id] || 0 : 0,
    invoices_count: w.user_id ? invoiceCounts[w.user_id] || 0 : 0,
  }));

  return NextResponse.json({ whitelist: result });
}

// POST — add email to whitelist
export async function POST(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { email, months } = await request.json();

  if (!email || !email.includes("@")) {
    return NextResponse.json(
      { error: "Valid email is required" },
      { status: 400 }
    );
  }

  const adminSupabase = getAdminSupabase();

  const expiresAt = months
    ? new Date(Date.now() + months * 30 * 24 * 60 * 60 * 1000).toISOString()
    : null;

  const { error } = await adminSupabase.from("whitelisted_emails").upsert(
    {
      email: email.toLowerCase().trim(),
      plan: "professional",
      expires_at: expiresAt,
      added_by: admin.email,
    },
    { onConflict: "email" }
  );

  if (error) {
    console.error("Error adding to whitelist:", error);
    return NextResponse.json(
      { error: "Failed to add email" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}

// DELETE — remove email from whitelist
export async function DELETE(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { email } = await request.json();

  if (!email) {
    return NextResponse.json(
      { error: "Email is required" },
      { status: 400 }
    );
  }

  const adminSupabase = getAdminSupabase();

  const { error } = await adminSupabase
    .from("whitelisted_emails")
    .delete()
    .eq("email", email.toLowerCase().trim());

  if (error) {
    console.error("Error removing from whitelist:", error);
    return NextResponse.json(
      { error: "Failed to remove email" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
