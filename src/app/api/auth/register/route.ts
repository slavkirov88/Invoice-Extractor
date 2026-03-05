import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// Admin client — uses service role key, bypasses RLS
function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(request: NextRequest) {
  let email: string;
  let password: string;

  try {
    const body = await request.json();
    email = body.email?.trim().toLowerCase();
    password = body.password;
  } catch {
    return NextResponse.json({ error: "Невалидни данни." }, { status: 400 });
  }

  if (!email || !password) {
    return NextResponse.json(
      { error: "Имейлът и паролата са задължителни." },
      { status: 400 }
    );
  }

  if (password.length < 6) {
    return NextResponse.json(
      { error: "Паролата трябва да е поне 6 символа." },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  // Check if user already exists using admin listUsers with filter
  const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();

  if (listError) {
    return NextResponse.json(
      { error: "Грешка при проверка на имейла." },
      { status: 500 }
    );
  }

  const emailTaken = existingUsers.users.some(
    (u) => u.email?.toLowerCase() === email
  );

  if (emailTaken) {
    return NextResponse.json(
      { error: "Вече съществува акаунт с този имейл адрес. Моля влезте или използвайте 'Забравена парола?'." },
      { status: 409 }
    );
  }

  // Create the user — sends confirmation email
  const { error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: false, // sends confirmation email
  });

  if (createError) {
    return NextResponse.json(
      { error: "Грешка при създаване на акаунт: " + createError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
