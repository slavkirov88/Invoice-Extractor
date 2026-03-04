-- Email integration tables for IMAP sync
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS email_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  email_address TEXT NOT NULL,
  imap_host TEXT NOT NULL,
  imap_port INT NOT NULL DEFAULT 993,
  imap_secure BOOLEAN NOT NULL DEFAULT true,
  username TEXT NOT NULL,
  encrypted_password TEXT NOT NULL,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS email_attachments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES email_accounts(id) ON DELETE CASCADE,
  email_subject TEXT,
  email_from TEXT,
  email_date TIMESTAMPTZ,
  email_message_id TEXT NOT NULL,
  filename TEXT NOT NULL,
  file_size INT,
  mime_type TEXT,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE email_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own email accounts" ON email_accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own email accounts" ON email_accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own email accounts" ON email_accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own email accounts" ON email_accounts FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own email attachments" ON email_attachments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own email attachments" ON email_attachments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own email attachments" ON email_attachments FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_email_accounts_user_id ON email_accounts(user_id);
CREATE INDEX idx_email_attachments_user_id ON email_attachments(user_id);
CREATE INDEX idx_email_attachments_account_id ON email_attachments(account_id);
CREATE INDEX idx_email_attachments_message_id ON email_attachments(account_id, email_message_id);
