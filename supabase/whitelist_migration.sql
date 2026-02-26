-- Whitelisted emails (beta testers) table
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard → SQL Editor → New Query

CREATE TABLE IF NOT EXISTS whitelisted_emails (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  plan TEXT NOT NULL DEFAULT 'professional' CHECK (plan IN ('professional', 'business')),
  expires_at TIMESTAMPTZ,
  added_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE whitelisted_emails ENABLE ROW LEVEL SECURITY;

-- Only service_role can manage (admin API uses service_role key, which bypasses RLS)
-- Authenticated users can check if their own email is whitelisted
CREATE POLICY "Users can check own whitelist status"
  ON whitelisted_emails FOR SELECT
  USING (auth.jwt() ->> 'email' = email);

-- Index for fast email lookups
CREATE INDEX idx_whitelisted_emails_email ON whitelisted_emails(email);
