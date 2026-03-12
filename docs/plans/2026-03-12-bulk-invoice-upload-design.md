# Bulk Invoice Upload — Design Document

**Date:** 2026-03-12

## Goal

Allow users to upload multiple PDF invoices at once, scan them all with Mistral OCR, and save them directly to a protocol without a per-file review step.

## Architecture

New page `/invoices/bulk` with a 3-step flow: configure (protocol + type) → upload files → sequential processing with per-file status. Uses the existing `/api/extract-invoice` endpoint unchanged. On completion, redirects to the protocol detail page.

## Design

### Page: `/invoices/bulk`

**Step 1 — Settings (always visible):**
- Protocol dropdown (same as add page)
- Invoice type: Приходна (Section A) / Разходна (Section B)
- VAT rate selector — only shown for mixed protocols

**Step 2 — File selection:**
- Dropzone accepts multiple PDFs (no file count limit)
- Lists selected filenames with file size
- "Сканирай и запиши" button (disabled until protocol selected and files chosen)

**Step 3 — Processing (replaces dropzone):**
- Each file gets a status row: filename + status badge
  - `pending` → `scanning` → `saved` or `error`
- Files processed sequentially (Mistral rate limits)
- On error for a file: show error message, continue with remaining
- After all done: summary toast "X от Y фактури добавени"
- "Виж протокола" button → `/protocols/[id]`

### Entry points
- `ProtocolDetail` top bar: "Добави фактури" button (Files icon) links to `/invoices/bulk?protocol=[id]`
- Sidebar navigation (existing "Добави фактура" can stay as-is)

## Data Flow

1. User selects protocol, type, files
2. Click "Сканирай и запиши"
3. For each file sequentially:
   a. POST to `/api/extract-invoice` with the file
   b. On success: INSERT into `invoices` (same logic as add page)
   c. Update per-file status in UI
4. Show completion summary

## Error Handling

- Per-file errors are shown inline but don't stop processing
- Credits check: same gate as add page (paywall if no subscription)
- File type validation: PDF only, max 10MB per file

## Components

- `src/app/(dashboard)/invoices/bulk/page.tsx` — new page (single file, client component)
- Update `src/components/protocols/ProtocolDetail.tsx` — add bulk upload link
