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
