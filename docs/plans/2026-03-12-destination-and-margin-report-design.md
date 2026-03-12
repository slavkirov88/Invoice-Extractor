# Destination Field + Справка за марж — Design Document

**Date:** 2026-03-12

## Goal

Two linked features:
1. Add optional `destination` field to protocols (used in forms, templates, detail view, print)
2. Excel справка за марж — cross-protocol summary filtered by данъчен период

---

## Feature 1: Destination field

### DB

```sql
ALTER TABLE protocols ADD COLUMN destination TEXT;
```

No default, nullable. No RLS changes needed.

### ProtocolForm changes

- New optional input field "Дестинация" added alongside the existing reference_number field
- Included in supplier template autofill (fetched + applied with other template fields)
- Included in edit mode (initialData + update payload)

### ProtocolDetail changes

- Show `destination` in the header info section (next to reference_number)

### Print page changes

- Show `destination` in the printed protocol header

---

## Feature 2: Справка за марж Excel

### Reference format (from справка марж.xlsx)

8 columns, A–H:

| А | В | С–D (merged) | Е | F | G | Н |
|---|---|---|---|---|---|---|
| № по ред | ПРОТОКОЛ № | Дестинация | Данъчна Основа | ДДС % | ДДС | Данъчен период |
| 1 | 2 | 3–4 | 5 | 6 | 7 | (repeat) |
| 1 | 2000002487 | Италия | 3336.64 | 20 | 667.37 | 02.2026 |
| … | | | | | | |
| **обща Сума** | | | SUM | | SUM | |

Row 2 is a column-numbering row (standard Bulgarian accounting table format).
Last row is totals: "обща Сума" + SUM of Данъчна Основа + SUM of ДДС.

### Filter

- Month + year picker (данъчен период)
- Filters by `tax_event_date` within the selected month
- Includes ALL protocol types: eu, non_eu, mixed

### Calculations per protocol

Same formula as Section C (VatCalculation):
- Марж = SUM(section='A' invoices) − SUM(section='B' invoices)
- Данъчна основа = Марж / (1 + tax_rate/100)  → i.e. Марж * 100 / (100 + tax_rate)
- ДДС = Данъчна основа × tax_rate / 100

### UI placement

New client component `MarginReportButton` on the Protocols list page, displayed next to "Нов протокол" button. Opens a small inline form (no modal needed — just a row with month/year inputs + download button).

### Data fetching

Client-side: fetch protocols with their invoices for the selected period, compute in-browser, generate Excel with ExcelJS (same pattern as existing ExcelExport).

API call: Supabase query — `protocols` with nested `invoices(section, amount)` filtered by `tax_event_date` range (start of month → end of month), ordered by `protocol_number` ASC.

### Excel generation

- Use ExcelJS (already installed)
- Match reference format: merged C:D, column-numbering row 2, styled header row, data rows, totals row
- Filename: `spravka-marzh-MM-YYYY.xlsx`

---

## Files to change

1. `supabase/` — new migration SQL file
2. `src/components/protocols/ProtocolForm.tsx` — add destination field + template autofill
3. `src/components/protocols/ProtocolDetail.tsx` — show destination
4. `src/app/protocols/[id]/print/page.tsx` — show destination in print
5. `src/types/index.ts` — add destination to Protocol type
6. `src/components/protocols/MarginReportButton.tsx` — new component (picker + Excel export)
7. `src/app/(dashboard)/protocols/page.tsx` — add MarginReportButton
