# Supplier Templates — Design Document

**Date:** 2026-03-12

## Goal

When creating a new protocol, the user can pick a previously used supplier from a dropdown to auto-fill the form fields — no new database table required.

## Architecture

No new DB table or migration. At form load, query `protocols` table for distinct suppliers (by `supplier_vat_id`) belonging to the current user, ordered by most recently created. User selects from dropdown → fields are pre-filled. All fields remain editable.

## Design

### ProtocolForm changes (create mode only)

**New dropdown at the top of the form:**
- Label: "Избери доставчик (по предишен протокол)"
- Options: `— Нов доставчик —` + one entry per unique supplier: `{supplier_name} ({supplier_vat_id})`
- Ordered by most recent `created_at` DESC
- Only shown in create mode (not when `protocolId` is passed)

**On selection:**
- Auto-fills: `supplier_name`, `supplier_vat_id`, `protocol_type`, `compiled_by`, `approved_by`
- Does NOT fill: `creation_date`, `tax_event_date`, `reference_number`, `linked_protocol_number`
- Selecting "— Нов доставчик —" clears the auto-filled fields

**Query:**
```sql
SELECT DISTINCT ON (supplier_vat_id)
  supplier_name, supplier_vat_id, protocol_type, compiled_by, approved_by
FROM protocols
WHERE user_id = :user_id
ORDER BY supplier_vat_id, created_at DESC
```
Then sort results by `created_at DESC` in JS for display order.

## Files to change

- `src/components/protocols/ProtocolForm.tsx` — add supplier dropdown + auto-fill logic
