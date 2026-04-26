-- Allow 'commission' as a section value for commission invoices
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_section_check;
ALTER TABLE invoices ADD CONSTRAINT invoices_section_check CHECK (section IN ('A', 'B', 'commission'));
