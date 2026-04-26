-- Migration: Selective attachment download
-- Run manually in Supabase SQL Editor after deploy

ALTER TABLE email_attachments
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'downloaded')),
  ADD COLUMN IF NOT EXISTS imap_uid BIGINT,
  ADD COLUMN IF NOT EXISTS imap_part TEXT;

ALTER TABLE email_attachments
  ALTER COLUMN storage_path DROP NOT NULL;

-- Existing rows are already downloaded
UPDATE email_attachments
  SET status = 'downloaded'
  WHERE storage_path IS NOT NULL;
