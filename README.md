# TravelInvoices

Production SaaS for Bulgarian tourism agencies to manage VAT margin protocols for travel services. Upload PDF invoices, get AI-extracted structured data, and generate compliant VAT margin reports.

**Live:** [travelinvoices.com](https://www.travelinvoices.com)

---

## What it does

Bulgarian tour operators are required by law (ЗДДС) to maintain VAT margin protocols for travel services — manually inputting hundreds of supplier invoices per month into spreadsheets. This app automates the workflow:

1. Drag-and-drop a PDF supplier invoice
2. AI extracts document number, date, amount, supplier VAT ID
3. Invoice is classified (income / expense / commission) and assigned to a protocol
4. VAT margin is calculated automatically (Section A revenue minus Section B costs)
5. Export to Excel or PDF for accounting submission

---

## Tech Stack

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript 5
- **Styling:** TailwindCSS 4 + shadcn/ui (dark theme by default)
- **Backend:** Supabase (PostgreSQL + Auth + Storage + RLS)
- **AI:** Mistral API for PDF data extraction
- **Payments:** Stripe (subscription tiers + trial flow)
- **Email:** Resend (transactional)
- **Deployment:** Vercel (frontend) + Supabase Edge (background workers)
- **i18n:** next-intl (Bulgarian + English)

---

## Architecture

```
src/
├── app/
│   ├── (dashboard)/         # Authenticated routes
│   │   ├── protocols/       # CRUD + detail views
│   │   └── invoices/        # Upload + categorize
│   └── api/                 # Stripe webhooks, AI extraction
├── components/
│   ├── protocols/           # ProtocolList, VatCalculation, MarginReport
│   ├── invoices/            # InvoiceUpload, InvoiceTypeSelector
│   └── ui/                  # shadcn primitives
├── lib/
│   ├── supabase/            # Client / server / middleware
│   ├── mistral/             # extract-invoice.ts
│   └── utils/               # vat-calculator, excel-export, pdf-export
└── types/                   # Database types from Supabase

imap-worker/                  # Background worker for email-based invoice ingestion
supabase/                     # Migrations, RLS policies, edge functions
```

---

## Data Model (key tables)

**`protocols`** — Each protocol represents a VAT reporting period for a destination
- `protocol_number` (serial), `tax_event_date`, `destination`, `protocol_type` (standard / commission)

**`invoices`** — Individual invoices grouped under protocols
- `protocol_id`, `section` (A income / B expense), `document_number`, `issue_date`, `amount`, `counterparty_vat_id`, `invoice_category`

**Row-level security**: every table is RLS-locked to `auth.uid()`. No cross-tenant data leaks possible.

---

## Key features implemented

- Social login (Google + Apple OAuth via Supabase)
- AI extraction from PDF with confidence-scored fallback to manual entry
- Multi-tier Stripe subscriptions with trial flow + payment-method-required-on-trial
- Automated VAT margin calculation (Section B revenue − Section A cost, gross-up to tax base)
- Excel export with Bulgarian tax-authority-compliant format
- PDF protocol generation
- IMAP worker for inbox-based invoice ingestion (suppliers email invoices, system parses and files them)
- Bulgarian + English UI
- Legal pages (Terms, Privacy, Cookies) and company info compliant with Bulgarian commerce law

---

## Status

Live and in production with paying Bulgarian tourism agencies. Active development.

---

## License

Proprietary. Code shown publicly for portfolio review purposes.
