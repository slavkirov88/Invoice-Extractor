-- Migration: Add vat_rate column to invoices (for mixed protocol type)
-- Run this in Supabase SQL Editor

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS vat_rate DECIMAL(5,2) DEFAULT NULL;
