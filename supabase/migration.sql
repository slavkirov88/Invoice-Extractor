-- Protocols table
CREATE TABLE IF NOT EXISTS protocols (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  protocol_number SERIAL,
  linked_protocol_number INTEGER,
  supplier_name TEXT NOT NULL,
  supplier_vat_id TEXT NOT NULL,
  creation_date DATE NOT NULL,
  tax_event_date DATE NOT NULL,
  reference_number TEXT,
  protocol_type TEXT NOT NULL DEFAULT 'standard' CHECK (protocol_type IN ('standard', 'commission')),
  tax_rate DECIMAL NOT NULL DEFAULT 20,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  protocol_id UUID NOT NULL REFERENCES protocols(id) ON DELETE CASCADE,
  section TEXT NOT NULL CHECK (section IN ('A', 'B')),
  sequence_number INTEGER NOT NULL,
  document_type TEXT NOT NULL DEFAULT 'Фактура',
  document_number TEXT NOT NULL,
  issue_date DATE NOT NULL,
  counterparty_vat_id TEXT,
  amount DECIMAL(12,2) NOT NULL,
  invoice_category TEXT NOT NULL CHECK (invoice_category IN ('income', 'expense', 'commission')),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- RLS Policies for protocols
CREATE POLICY "Users can view own protocols"
  ON protocols FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own protocols"
  ON protocols FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own protocols"
  ON protocols FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own protocols"
  ON protocols FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for invoices
CREATE POLICY "Users can view own invoices"
  ON invoices FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own invoices"
  ON invoices FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own invoices"
  ON invoices FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own invoices"
  ON invoices FOR DELETE
  USING (auth.uid() = user_id);

-- Updated_at trigger for protocols
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_protocols_updated_at
  BEFORE UPDATE ON protocols
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Indexes
CREATE INDEX idx_protocols_user_id ON protocols(user_id);
CREATE INDEX idx_invoices_protocol_id ON invoices(protocol_id);
CREATE INDEX idx_invoices_user_id ON invoices(user_id);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('trialing', 'active', 'past_due', 'canceled')),
  plan TEXT NOT NULL DEFAULT 'professional' CHECK (plan IN ('professional', 'business')),
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscription
CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Service role has full access (for webhooks and admin API)
-- Note: service_role key bypasses RLS by default

CREATE INDEX idx_subscriptions_status ON subscriptions(status);
