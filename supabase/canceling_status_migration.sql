-- Migration: Add "canceling" to subscriptions status CHECK constraint
-- Run this in Supabase SQL Editor

ALTER TABLE subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_status_check;

ALTER TABLE subscriptions
  ADD CONSTRAINT subscriptions_status_check
  CHECK (status IN ('trialing', 'active', 'past_due', 'canceled', 'canceling'));
