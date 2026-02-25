import { NextResponse } from "next/server";
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

export async function GET() {
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const adminSupabase = getAdminSupabase();

  // Get all users from auth
  const {
    data: { users },
    error: usersError,
  } = await adminSupabase.auth.admin.listUsers();

  if (usersError) {
    console.error("Error fetching users:", usersError);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }

  // Get all subscriptions
  const { data: subscriptions } = await adminSupabase
    .from("subscriptions")
    .select("*");

  // Merge users with their subscriptions
  const usersWithSubs = users.map((user) => {
    const sub = subscriptions?.find((s) => s.user_id === user.id);
    return {
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      subscription: sub || null,
    };
  });

  return NextResponse.json({ users: usersWithSubs });
}
