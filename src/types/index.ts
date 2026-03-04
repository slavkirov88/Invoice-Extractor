export interface Protocol {
  id: string;
  protocol_number: number;
  linked_protocol_number: number | null;
  supplier_name: string;
  supplier_vat_id: string;
  creation_date: string;
  tax_event_date: string;
  reference_number: string | null;
  protocol_type: "standard" | "commission";
  tax_rate: number;
  user_id: string;
  created_at: string;
  updated_at: string;
  invoices?: Invoice[];
}

export interface Invoice {
  id: string;
  protocol_id: string;
  section: "A" | "B";
  sequence_number: number;
  document_type: string;
  document_number: string;
  issue_date: string;
  counterparty_vat_id: string | null;
  amount: number;
  invoice_category: "income" | "expense" | "commission";
  user_id: string;
  created_at: string;
}

export interface ExtractedInvoiceData {
  documentNumber: string;
  issueDate: string;
  amount: number;
}

export interface VatCalculation {
  totalReceived: number;
  totalPaid: number;
  margin: number;
  taxBase: number;
  taxRate: number;
  vatAmount: number;
}

export interface EmailAccount {
  id: string;
  user_id: string;
  display_name: string;
  email_address: string;
  imap_host: string;
  imap_port: number;
  imap_secure: boolean;
  username: string;
  last_synced_at: string | null;
  created_at: string;
}

export interface EmailAttachment {
  id: string;
  user_id: string;
  account_id: string;
  email_subject: string | null;
  email_from: string | null;
  email_date: string | null;
  email_message_id: string;
  filename: string;
  file_size: number | null;
  mime_type: string | null;
  storage_path: string;
  created_at: string;
}

export interface Subscription {
  user_id: string;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  status: "trialing" | "active" | "past_due" | "canceled";
  plan: "professional" | "business";
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
}
