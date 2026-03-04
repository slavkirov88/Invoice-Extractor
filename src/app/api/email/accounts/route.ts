import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { encryptPassword } from '@/lib/email/encryption';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const CreateAccountSchema = z.object({
  display_name: z.string().min(1, 'Задайте наименование'),
  email_address: z.string().email('Невалиден имейл адрес'),
  imap_host: z.string().min(1, 'Задайте IMAP хост'),
  imap_port: z.number().int().min(1).max(65535),
  imap_secure: z.boolean(),
  username: z.string().min(1, 'Задайте потребителско име'),
  password: z.string().min(1, 'Задайте парола'),
});

// GET — list accounts (never return encrypted_password)
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('email_accounts')
    .select('id, display_name, email_address, imap_host, imap_port, imap_secure, username, last_synced_at, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST — create account
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Невалиден JSON' }, { status: 400 });
  }

  const parsed = CreateAccountSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { password, ...rest } = parsed.data;

  let encrypted: string;
  try {
    encrypted = encryptPassword(password);
  } catch (err) {
    console.error('Encryption error:', err);
    return NextResponse.json({ error: 'Грешка при криптиране на паролата' }, { status: 500 });
  }

  const { data, error } = await supabase
    .from('email_accounts')
    .insert({
      ...rest,
      encrypted_password: encrypted,
      user_id: user.id,
    })
    .select('id, display_name, email_address, imap_host, imap_port, imap_secure, username, last_synced_at, created_at')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

// DELETE — remove account by ?id=
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const id = request.nextUrl.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Липсва id параметър' }, { status: 400 });
  }

  const { error } = await supabase
    .from('email_accounts')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
