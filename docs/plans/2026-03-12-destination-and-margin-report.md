# Destination Field + Справка за марж Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add an optional `destination` field to protocols and build an Excel margin report that summarises all protocols for a selected tax period.

**Architecture:** DB migration adds nullable `destination` column. The field threads through ProtocolForm (create + edit), ProtocolDetail (read + edit), and the print page. A new client component `MarginReportButton` lives on the Protocols list page: the user picks month + year, the component fetches protocols with their invoices from Supabase, computes VAT per protocol using the existing `calculateVat` util, and generates an ExcelJS workbook that matches the reference справка format.

**Tech Stack:** React useState, Supabase JS client, ExcelJS (already installed), shadcn/ui Input/Select/Button, date-fns.

---

### Task 1: DB migration + type update

**Files:**
- Create: `supabase/destination_migration.sql`
- Modify: `src/types/index.ts`

**Step 1: Create migration file**

Create `supabase/destination_migration.sql` with this content:

```sql
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS destination TEXT;
```

**Step 2: Run migration in Supabase dashboard**

Go to Supabase → SQL editor → paste and run the migration. Verify the column appears in the `protocols` table schema.

**Step 3: Update Protocol type**

In `src/types/index.ts`, add `destination` after `reference_number`:

```ts
export interface Protocol {
  id: string;
  protocol_number: number;
  linked_protocol_number: number | null;
  supplier_name: string;
  supplier_vat_id: string;
  creation_date: string;
  tax_event_date: string;
  reference_number: string | null;
  destination: string | null;          // ← add this line
  protocol_type: "eu" | "non_eu" | "mixed" | "standard" | "commission";
  tax_rate: number;
  compiled_by: string | null;
  approved_by: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
  invoices?: Invoice[];
}
```

**Step 4: TypeScript check**

```bash
cd "C:\Users\mariy\Documents\Projects\Invoice Extractor\invoice-extractor"
npx tsc --noEmit
```

Expected: no errors (new nullable field is backward compatible).

**Step 5: Commit**

```bash
git add supabase/destination_migration.sql src/types/index.ts
git commit -m "feat: add destination field to Protocol type + migration"
```

---

### Task 2: ProtocolForm — destination field + supplier template autofill

**Files:**
- Modify: `src/components/protocols/ProtocolForm.tsx`

**Context — current file structure:**
- `SupplierTemplate` interface already has: `supplier_name`, `supplier_vat_id`, `protocol_type`, `compiled_by`, `approved_by`
- `formData` state has the same fields plus dates, reference_number, linked_protocol_number
- `fetchTemplates()` queries protocols ordered by `created_at DESC`, deduplicates by `supplier_vat_id`
- The form grid has reference_number + linked_protocol_number in one `md:grid-cols-2` row
- `initialData` prop contains all editable protocol fields

**Step 1: Read the current file before editing**

Read `src/components/protocols/ProtocolForm.tsx` fully to confirm the current state.

**Step 2: Add destination to SupplierTemplate interface**

Change:
```tsx
interface SupplierTemplate {
  supplier_name: string;
  supplier_vat_id: string;
  protocol_type: "eu" | "non_eu" | "mixed";
  compiled_by: string | null;
  approved_by: string | null;
}
```
To:
```tsx
interface SupplierTemplate {
  supplier_name: string;
  supplier_vat_id: string;
  protocol_type: "eu" | "non_eu" | "mixed";
  compiled_by: string | null;
  approved_by: string | null;
  destination: string | null;
}
```

**Step 3: Add destination to ProtocolFormProps.initialData**

Change `initialData?:` to include `destination: string;`:
```tsx
  initialData?: {
    supplier_name: string;
    supplier_vat_id: string;
    creation_date: string;
    tax_event_date: string;
    reference_number: string;
    protocol_type: "eu" | "non_eu" | "mixed";
    linked_protocol_number: string;
    compiled_by: string;
    approved_by: string;
    destination: string;    // ← add
  };
```

**Step 4: Add destination to formData state**

In the `useState` initializer, add after `approved_by`:
```tsx
    destination: initialData?.destination ?? "",
```

**Step 5: Update fetchTemplates to include destination**

In the Supabase `.select(...)` call inside `fetchTemplates`, add `destination` to the select string:
```tsx
      const { data } = await supabase
        .from("protocols")
        .select("supplier_name, supplier_vat_id, protocol_type, compiled_by, approved_by, destination, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
```

In the deduplication loop, add `destination` to the pushed object:
```tsx
          unique.push({
            supplier_name: row.supplier_name,
            supplier_vat_id: row.supplier_vat_id,
            protocol_type: row.protocol_type as "eu" | "non_eu" | "mixed",
            compiled_by: row.compiled_by,
            approved_by: row.approved_by,
            destination: row.destination,
          });
```

**Step 6: Update template autofill onValueChange**

In the Select's `onValueChange`, add `destination`:
```tsx
                  setFormData((prev) => ({
                    ...prev,
                    supplier_name: tpl.supplier_name,
                    supplier_vat_id: tpl.supplier_vat_id,
                    protocol_type: tpl.protocol_type,
                    compiled_by: tpl.compiled_by ?? "",
                    approved_by: tpl.approved_by ?? "",
                    destination: tpl.destination ?? "",
                  }));
```

**Step 7: Add destination field to form JSX**

Find the existing `reference_number` / `linked_protocol_number` grid section and replace it with a 3-field layout — destination on its own row, then reference_number + linked_protocol_number below:

```tsx
          <div className="space-y-2">
            <Label htmlFor="destination">Дестинация (незадължително)</Label>
            <Input
              id="destination"
              value={formData.destination}
              onChange={(e) =>
                setFormData({ ...formData, destination: e.target.value })
              }
              placeholder="напр. Италия, Гърция"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="reference_number">
                Референция № (незадължително)
              </Label>
              <Input
                id="reference_number"
                value={formData.reference_number}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    reference_number: e.target.value,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="linked_protocol_number">
                Към протокол № (коригиращ, незадължително)
              </Label>
              <Input
                id="linked_protocol_number"
                type="number"
                value={formData.linked_protocol_number}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    linked_protocol_number: e.target.value,
                  })
                }
              />
            </div>
          </div>
```

Place the destination field immediately **before** the reference_number / linked_protocol_number grid.

**Step 8: Add destination to insert payload (create mode)**

In the `.insert({...})` call, add:
```tsx
        destination: formData.destination || null,
```

**Step 9: Add destination to update payload (edit mode)**

In the `.update({...})` call, add:
```tsx
        destination: formData.destination || null,
```

**Step 10: TypeScript check**

```bash
npx tsc --noEmit
```

**Step 11: Commit**

```bash
git add src/components/protocols/ProtocolForm.tsx
git commit -m "feat: destination field in ProtocolForm with template autofill"
```

---

### Task 3: ProtocolDetail — destination in read/edit mode

**Files:**
- Modify: `src/components/protocols/ProtocolDetail.tsx`

**Context:**
- `headerDraft` state currently has: supplier_name, supplier_vat_id, creation_date, tax_event_date, reference_number, protocol_type, linked_protocol_number, compiled_by, approved_by
- Read-only card renders a `md:grid-cols-4` layout showing dates, reference_number, linked_protocol_number
- Edit card renders all fields as Inputs/Selects
- The `handleSave` function calls `supabase.from("protocols").update({...})`

**Step 1: Read the current file before editing**

Read `src/components/protocols/ProtocolDetail.tsx` fully.

**Step 2: Add destination to headerDraft**

In both the initial `useState` and the `handleCancel` reset, add `destination`:
```tsx
  const [headerDraft, setHeaderDraft] = useState({
    supplier_name: protocol.supplier_name,
    supplier_vat_id: protocol.supplier_vat_id,
    creation_date: protocol.creation_date,
    tax_event_date: protocol.tax_event_date,
    reference_number: protocol.reference_number ?? "",
    destination: protocol.destination ?? "",          // ← add
    protocol_type: (protocol.protocol_type as "eu" | "non_eu" | "mixed") ?? "eu",
    linked_protocol_number: protocol.linked_protocol_number?.toString() ?? "",
    compiled_by: protocol.compiled_by ?? "",
    approved_by: protocol.approved_by ?? "",
  });
```

Do the same in `handleCancel`:
```tsx
      destination: protocol.destination ?? "",
```

**Step 3: Add destination to read-only card**

In the read-only `<Card>` content, add a destination cell after reference_number:
```tsx
            <div>
              <p className="text-sm text-muted-foreground">Дестинация</p>
              <p className="font-medium">
                {protocol.destination || "-"}
              </p>
            </div>
```

**Step 4: Add destination input to edit card**

In the edit `<Card>`, add a destination Input field before the reference_number row:
```tsx
            <div className="space-y-2">
              <Label>Дестинация (незадължително)</Label>
              <Input
                value={headerDraft.destination}
                onChange={(e) =>
                  setHeaderDraft({ ...headerDraft, destination: e.target.value })
                }
                placeholder="напр. Италия, Гърция"
              />
            </div>
```

**Step 5: Add destination to update payload in handleSave**

In the `.update({...})` call, add:
```tsx
        destination: headerDraft.destination || null,
```

**Step 6: TypeScript check**

```bash
npx tsc --noEmit
```

**Step 7: Commit**

```bash
git add src/components/protocols/ProtocolDetail.tsx
git commit -m "feat: destination field in ProtocolDetail read/edit mode"
```

---

### Task 4: Print page — show destination

**Files:**
- Modify: `src/app/protocols/[id]/print/page.tsx`

**Context:** The print page fetches `protocol` from Supabase (with `*` select so `destination` is already returned). It renders an HTML table header section with supplier name, dates, and reference number.

**Step 1: Read the current file**

Read `src/app/protocols/[id]/print/page.tsx` fully.

**Step 2: Add destination row to the print header**

Find the section where `protocol.reference_number` is displayed and add a destination row nearby. The exact location will be visible after reading the file. Add something like:

```tsx
{protocol.destination && (
  <tr>
    <td style={{ fontWeight: 600, paddingRight: 16 }}>Дестинация:</td>
    <td>{protocol.destination}</td>
  </tr>
)}
```

Place it next to or after the reference_number row.

**Step 3: TypeScript check + Commit**

```bash
npx tsc --noEmit
git add "src/app/protocols/[id]/print/page.tsx"
git commit -m "feat: show destination in protocol print page"
```

---

### Task 5: MarginReportButton component

**Files:**
- Create: `src/components/protocols/MarginReportButton.tsx`

**Context:**
- ExcelJS is already in package.json — import dynamically like `ExcelExport.tsx` does
- `calculateVat(invoices, taxRate)` from `@/lib/utils/vat-calculator` returns `{ margin, taxBase, taxRate, vatAmount }`
- Reference Excel format: 8 columns A–H, merged C:D, header row, column-number row, data rows, totals row
- Period column value: format as "MM.YYYY" string (e.g. "02.2026")

**Step 1: Create the component**

Create `src/components/protocols/MarginReportButton.tsx`:

```tsx
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { calculateVat } from "@/lib/utils/vat-calculator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import type { Invoice } from "@/types";

interface ProtocolRow {
  protocol_number: number;
  destination: string | null;
  tax_rate: number;
  tax_event_date: string;
  invoices: Pick<Invoice, "section" | "amount" | "vat_rate">[];
}

export function MarginReportButton() {
  const supabase = createClient();
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [month, setMonth] = useState(
    String(new Date().getMonth() + 1).padStart(2, "0")
  );
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    const y = parseInt(year, 10);
    const m = parseInt(month, 10);
    if (!y || m < 1 || m > 12) {
      toast.error("Въведете валиден период");
      return;
    }

    setLoading(true);

    // Date range for the selected month
    const startDate = `${y}-${String(m).padStart(2, "0")}-01`;
    const lastDay = new Date(y, m, 0).getDate();
    const endDate = `${y}-${String(m).padStart(2, "0")}-${lastDay}`;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Не сте влезли в системата");
      setLoading(false);
      return;
    }

    const { data: protocols, error } = await supabase
      .from("protocols")
      .select("protocol_number, destination, tax_rate, tax_event_date, invoices(section, amount, vat_rate)")
      .eq("user_id", user.id)
      .gte("tax_event_date", startDate)
      .lte("tax_event_date", endDate)
      .order("protocol_number", { ascending: true });

    if (error) {
      toast.error("Грешка при зареждане: " + error.message);
      setLoading(false);
      return;
    }

    if (!protocols || protocols.length === 0) {
      toast.error("Няма протоколи за избрания период");
      setLoading(false);
      return;
    }

    const ExcelJS = (await import("exceljs")).default;
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Справка марж");

    // Column widths
    ws.columns = [
      { width: 7 },   // A: №
      { width: 16 },  // B: ПРОТОКОЛ №
      { width: 18 },  // C: Дестинация (merged with D)
      { width: 6 },   // D: (merged)
      { width: 16 },  // E: Данъчна Основа
      { width: 8 },   // F: ДДС %
      { width: 14 },  // G: ДДС
      { width: 14 },  // H: Данъчен период
    ];

    // Row 1 — headers
    const headerRow = ws.addRow([
      "№ по ред",
      "ПРОТОКОЛ №",
      "Дестинация",
      null,
      "Данъчна Основа",
      "ДДС %",
      "ДДС",
      "Данъчен период",
    ]);
    headerRow.font = { bold: true };
    headerRow.alignment = { horizontal: "center", vertical: "middle" };
    ws.mergeCells("C1:D1");

    // Row 2 — column numbers (standard BG accounting table)
    const numRow = ws.addRow([1, 2, 3, null, 5, 6, 7, null]);
    numRow.alignment = { horizontal: "center" };
    ws.mergeCells("C2:D2");

    const periodLabel = `${String(m).padStart(2, "0")}.${y}`;

    let totalTaxBase = 0;
    let totalVat = 0;

    protocols.forEach((p: ProtocolRow, idx: number) => {
      const vat = calculateVat(p.invoices as Invoice[], p.tax_rate);
      totalTaxBase += vat.taxBase;
      totalVat += vat.vatAmount;

      const dataRow = ws.addRow([
        idx + 1,
        p.protocol_number,
        p.destination || "",
        null,
        Math.round(vat.taxBase * 100) / 100,
        vat.taxRate,
        Math.round(vat.vatAmount * 1000) / 1000,
        periodLabel,
      ]);
      ws.mergeCells(`C${dataRow.number}:D${dataRow.number}`);
      (dataRow.getCell(5) as ExcelJS.Cell).numFmt = "#,##0.00";
      (dataRow.getCell(7) as ExcelJS.Cell).numFmt = "#,##0.000";
    });

    // Totals row
    const totalsRow = ws.addRow([
      "обща Сума",
      null,
      null,
      null,
      Math.round(totalTaxBase * 100) / 100,
      null,
      Math.round(totalVat * 1000) / 1000,
      null,
    ]);
    totalsRow.font = { bold: true };
    ws.mergeCells(`C${totalsRow.number}:D${totalsRow.number}`);
    (totalsRow.getCell(5) as ExcelJS.Cell).numFmt = "#,##0.00";
    (totalsRow.getCell(7) as ExcelJS.Cell).numFmt = "#,##0.000";

    // Download
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `spravka-marzh-${String(m).padStart(2, "0")}-${y}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);

    setLoading(false);
    toast.success(`Справката е изтеглена (${protocols.length} протокола)`);
  };

  return (
    <div className="flex items-end gap-2">
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Месец</Label>
        <Input
          type="number"
          min={1}
          max={12}
          value={month}
          onChange={(e) => setMonth(e.target.value.padStart(2, "0"))}
          className="w-20"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Година</Label>
        <Input
          type="number"
          min={2020}
          max={2099}
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="w-24"
        />
      </div>
      <Button variant="outline" onClick={handleExport} disabled={loading}>
        <FileSpreadsheet className="mr-2 h-4 w-4" />
        {loading ? "Генериране..." : "Справка за марж"}
      </Button>
    </div>
  );
}
```

**Step 2: TypeScript check**

```bash
npx tsc --noEmit
```

Fix any issues:
- If `ExcelJS.Cell` import is needed: `import type ExcelJS from "exceljs"` — but since ExcelJS is imported dynamically, cast the cell differently. Alternative: `(dataRow.getCell(5) as { numFmt: string }).numFmt = "#,##0.00"` — or just skip the numFmt cast and use the row directly.
- If `protocols` typing is inferred as `any[]`, that's fine for Supabase dynamic queries.

**Step 3: Commit**

```bash
git add src/components/protocols/MarginReportButton.tsx
git commit -m "feat: MarginReportButton — справка за марж Excel export"
```

---

### Task 6: Wire MarginReportButton into protocols page

**Files:**
- Modify: `src/app/(dashboard)/protocols/page.tsx`

**Context — current file (read it first):**
The page has a header section:
```tsx
<div className="flex items-center justify-between">
  <div>
    <h1>Протоколи</h1>
    <p>Управление на протоколи по ЗДДС</p>
  </div>
  <Button asChild>
    <Link href="/protocols/new">
      <Plus /> Нов протокол
    </Link>
  </Button>
</div>
```

**Step 1: Read the full page file**

Read `src/app/(dashboard)/protocols/page.tsx`.

**Step 2: Import MarginReportButton**

Add import at the top of the file:
```tsx
import { MarginReportButton } from "@/components/protocols/MarginReportButton";
```

**Step 3: Add MarginReportButton to the header**

Change the header `flex` row to accommodate both the report button and the "Нов протокол" button. Replace the existing button-only right side with:

```tsx
        <div className="flex items-end gap-3">
          <MarginReportButton />
          <Button asChild>
            <Link href="/protocols/new">
              <Plus className="mr-2 h-4 w-4" />
              Нов протокол
            </Link>
          </Button>
        </div>
```

**Step 4: TypeScript check**

```bash
npx tsc --noEmit
```

**Step 5: Commit**

```bash
git add "src/app/(dashboard)/protocols/page.tsx"
git commit -m "feat: add MarginReportButton to protocols page"
```

---

### Manual test checklist

- [ ] Run migration → `destination` column appears in Supabase table editor
- [ ] Create new protocol → "Дестинация" input appears (optional, can be left blank)
- [ ] Fill destination, submit → visible in protocol detail and print page
- [ ] Select existing supplier from template dropdown → destination autofills from previous protocol
- [ ] Edit existing protocol → destination field editable, saved correctly
- [ ] Protocols page → month/year inputs + "Справка за марж" button visible
- [ ] Select period with no protocols → toast "Няма протоколи за избрания период"
- [ ] Select period with protocols → Excel downloaded, rows match protocol data, totals row correct
- [ ] Destination column in Excel shows the protocol's destination (or blank if not set)
