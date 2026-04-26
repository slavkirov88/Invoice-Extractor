# Protocol Inline Edit Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add full inline edit mode to the protocol detail page — header fields and invoice rows become editable in-place with a single "Редактирай" toggle button.

**Architecture:** `ProtocolDetail` gains an `isEditing` state flag. When true, header fields render as inputs and invoice rows render as editable table rows. On save, the component fires parallel Supabase calls: `UPDATE protocols`, bulk `UPDATE`/`DELETE`/`INSERT` on invoices. `ProtocolForm` is refactored to accept an optional `initialData + protocolId` so the same field logic is reused for create and edit.

**Tech Stack:** React state (useState), Supabase JS client, shadcn/ui Input/Select/Button, sonner toast, lucide-react icons.

---

### Task 1: Refactor ProtocolForm to support edit mode

**Files:**
- Modify: `src/components/protocols/ProtocolForm.tsx`

The form currently only does `insert`. We extend it to accept `protocolId` + `initialData` props. When provided, it does `update` instead of `insert` and skips the credits check.

**Step 1: Update props interface**

```tsx
interface ProtocolFormProps {
  onSuccess?: (id: string) => void;
  // New optional props for edit mode
  protocolId?: string;
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
  };
  onCancel?: () => void;
}
```

**Step 2: Initialise formData from initialData when provided**

Change the `useState` initialiser:
```tsx
const [formData, setFormData] = useState({
  supplier_name: initialData?.supplier_name ?? "",
  supplier_vat_id: initialData?.supplier_vat_id ?? "",
  creation_date: initialData?.creation_date ?? new Date().toISOString().split("T")[0],
  tax_event_date: initialData?.tax_event_date ?? new Date().toISOString().split("T")[0],
  reference_number: initialData?.reference_number ?? "",
  protocol_type: (initialData?.protocol_type ?? "eu") as "eu" | "non_eu" | "mixed",
  linked_protocol_number: initialData?.linked_protocol_number ?? "",
  compiled_by: initialData?.compiled_by ?? "",
  approved_by: initialData?.approved_by ?? "",
});
```

**Step 3: Branch handleSubmit for create vs edit**

In `handleSubmit`, after the user check:
```tsx
if (protocolId) {
  // Edit mode — skip credits check, do update
  const { error } = await supabase
    .from("protocols")
    .update({
      supplier_name: formData.supplier_name,
      supplier_vat_id: formData.supplier_vat_id,
      creation_date: formData.creation_date,
      tax_event_date: formData.tax_event_date,
      reference_number: formData.reference_number || null,
      protocol_type: formData.protocol_type,
      tax_rate: taxRate,
      linked_protocol_number: formData.linked_protocol_number
        ? parseInt(formData.linked_protocol_number)
        : null,
      compiled_by: formData.compiled_by,
      approved_by: formData.approved_by,
    })
    .eq("id", protocolId);

  if (error) {
    toast.error("Грешка при запис: " + error.message);
  } else {
    toast.success("Протоколът е обновен успешно");
    onSuccess?.(protocolId);
  }
  setLoading(false);
  return;
}
// ... existing insert logic below
```

**Step 4: Add Cancel button in edit mode**

At the bottom of the form, add a Cancel button when `onCancel` is provided:
```tsx
<div className="flex gap-2">
  {onCancel && (
    <Button type="button" variant="outline" onClick={onCancel} disabled={loading} className="flex-1">
      Откажи
    </Button>
  )}
  <Button type="submit" disabled={loading} className={onCancel ? "flex-1" : "w-full"}>
    {loading ? (protocolId ? "Запазване..." : "Създаване...") : (protocolId ? "Запази промените" : "Създай протокол")}
  </Button>
</div>
```

**Step 5: Skip credits gate in edit mode**

Wrap the credits gate block:
```tsx
if (!protocolId && credits && !credits.isUnlimited) {
  // existing paywall JSX
}
```

**Step 6: Manual test**
- Navigate to `/protocols/new` — form should work exactly as before.
- No automated test needed for this step; verify visually.

**Step 7: Commit**
```bash
git add src/components/protocols/ProtocolForm.tsx
git commit -m "feat: support edit mode in ProtocolForm (update vs insert)"
```

---

### Task 2: Build EditableInvoiceTable component

**Files:**
- Create: `src/components/protocols/EditableInvoiceTable.tsx`

This component renders invoice rows as editable inputs when in edit mode, and as a read-only table when not. It also allows adding new rows and deleting existing ones.

**Step 1: Create the file with types**

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Plus } from "lucide-react";
import { format } from "date-fns";
import type { Invoice } from "@/types";

export interface InvoiceDraft {
  id?: string;          // undefined = new row not yet saved
  section: "A" | "B";
  sequence_number: number;
  document_type: string;
  document_number: string;
  issue_date: string;
  counterparty_vat_id: string;
  amount: string;       // string for input binding, parsed on save
  vat_rate: string;     // string for input binding
  _deleted?: boolean;   // mark for deletion on save
}

interface EditableInvoiceTableProps {
  title: string;
  section: "A" | "B";
  invoices: Invoice[];
  isEditing: boolean;
  showVatRate?: boolean;
  drafts: InvoiceDraft[];
  onDraftsChange: (drafts: InvoiceDraft[]) => void;
}
```

**Step 2: Implement the component body**

```tsx
export function EditableInvoiceTable({
  title, section, invoices, isEditing, showVatRate = false,
  drafts, onDraftsChange,
}: EditableInvoiceTableProps) {
  const visibleDrafts = drafts.filter((d) => !d._deleted);
  const total = visibleDrafts.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);
  const colSpan = showVatRate ? 6 : 5;

  function updateDraft(index: number, field: keyof InvoiceDraft, value: string) {
    const next = [...drafts];
    // Find actual index in full drafts array (including deleted)
    const allIndex = drafts.indexOf(visibleDrafts[index]);
    next[allIndex] = { ...next[allIndex], [field]: value };
    onDraftsChange(next);
  }

  function deleteDraft(index: number) {
    const next = [...drafts];
    const allIndex = drafts.indexOf(visibleDrafts[index]);
    if (next[allIndex].id) {
      // Existing invoice — mark for deletion
      next[allIndex] = { ...next[allIndex], _deleted: true };
    } else {
      // New unsaved row — just remove
      next.splice(allIndex, 1);
    }
    onDraftsChange(next);
  }

  function addRow() {
    const nextSeq = visibleDrafts.length + 1;
    const today = new Date().toISOString().split("T")[0];
    onDraftsChange([
      ...drafts,
      {
        section,
        sequence_number: nextSeq,
        document_type: "Фактура",
        document_number: "",
        issue_date: today,
        counterparty_vat_id: "",
        amount: "",
        vat_rate: "",
      },
    ]);
  }

  if (!isEditing) {
    // Read-only view (same as current InvoiceTable)
    return (
      <Card>
        <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
        <CardContent>
          {visibleDrafts.length === 0 ? (
            <p className="py-4 text-center text-muted-foreground">Няма добавени фактури</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">№</TableHead>
                  <TableHead>Вид документ</TableHead>
                  <TableHead>№ на документа</TableHead>
                  <TableHead>Дата на издаване</TableHead>
                  <TableHead>ИД на контрагента</TableHead>
                  {showVatRate && <TableHead className="text-center">ДДС ставка</TableHead>}
                  <TableHead className="text-right">Стойност EUR</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleDrafts.map((d, i) => (
                  <TableRow key={d.id ?? i}>
                    <TableCell>{d.sequence_number}</TableCell>
                    <TableCell>{d.document_type}</TableCell>
                    <TableCell className="font-mono">{d.document_number}</TableCell>
                    <TableCell>
                      {d.issue_date ? format(new Date(d.issue_date), "dd.MM.yyyy") : "-"}
                    </TableCell>
                    <TableCell>{d.counterparty_vat_id || "-"}</TableCell>
                    {showVatRate && <TableCell className="text-center">{d.vat_rate ? `${d.vat_rate}%` : "-"}</TableCell>}
                    <TableCell className="text-right font-mono">{parseFloat(d.amount || "0").toFixed(2)}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-bold">
                  <TableCell colSpan={colSpan}>
                    Общ размер на {section === "A" ? "получените" : "платените"} суми
                  </TableCell>
                  <TableCell className="text-right font-mono">{total.toFixed(2)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    );
  }

  // Edit mode
  return (
    <Card className="border-violet-500/30">
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">№</TableHead>
              <TableHead>Вид</TableHead>
              <TableHead>№ документ</TableHead>
              <TableHead>Дата</TableHead>
              <TableHead>ИД контрагент</TableHead>
              {showVatRate && <TableHead className="w-20">ДДС %</TableHead>}
              <TableHead className="text-right w-28">Стойност</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleDrafts.map((d, i) => (
              <TableRow key={d.id ?? i}>
                <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                <TableCell>
                  <Input
                    value={d.document_type}
                    onChange={(e) => updateDraft(i, "document_type", e.target.value)}
                    className="h-8 min-w-[90px]"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={d.document_number}
                    onChange={(e) => updateDraft(i, "document_number", e.target.value)}
                    className="h-8 font-mono min-w-[100px]"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="date"
                    value={d.issue_date}
                    onChange={(e) => updateDraft(i, "issue_date", e.target.value)}
                    className="h-8 min-w-[130px]"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={d.counterparty_vat_id}
                    onChange={(e) => updateDraft(i, "counterparty_vat_id", e.target.value)}
                    className="h-8 min-w-[100px]"
                  />
                </TableCell>
                {showVatRate && (
                  <TableCell>
                    <Input
                      type="number"
                      value={d.vat_rate}
                      onChange={(e) => updateDraft(i, "vat_rate", e.target.value)}
                      className="h-8 w-16"
                    />
                  </TableCell>
                )}
                <TableCell>
                  <Input
                    type="number"
                    value={d.amount}
                    onChange={(e) => updateDraft(i, "amount", e.target.value)}
                    className="h-8 text-right font-mono min-w-[90px]"
                  />
                </TableCell>
                <TableCell>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => deleteDraft(i)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Button type="button" variant="outline" size="sm" onClick={addRow} className="w-full">
          <Plus className="mr-2 h-4 w-4" />
          Добави ред
        </Button>
      </CardContent>
    </Card>
  );
}
```

**Step 3: Manual test**
- Component not yet wired — will be verified in Task 3.

**Step 4: Commit**
```bash
git add src/components/protocols/EditableInvoiceTable.tsx
git commit -m "feat: add EditableInvoiceTable component for inline invoice editing"
```

---

### Task 3: Rewire ProtocolDetail with edit mode

**Files:**
- Modify: `src/components/protocols/ProtocolDetail.tsx`

**Step 1: Add state and helpers at top of ProtocolDetail**

```tsx
import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Pencil, X } from "lucide-react";
import { EditableInvoiceTable, type InvoiceDraft } from "./EditableInvoiceTable";
import { ProtocolForm } from "./ProtocolForm";

// Inside component:
const [isEditing, setIsEditing] = useState(false);
const [saving, setSaving] = useState(false);

// Convert Invoice[] to InvoiceDraft[]
function toDrafts(invoices: Invoice[]): InvoiceDraft[] {
  return invoices.map((inv) => ({
    id: inv.id,
    section: inv.section,
    sequence_number: inv.sequence_number,
    document_type: inv.document_type,
    document_number: inv.document_number,
    issue_date: inv.issue_date,
    counterparty_vat_id: inv.counterparty_vat_id ?? "",
    amount: String(inv.amount),
    vat_rate: inv.vat_rate != null ? String(inv.vat_rate) : "",
  }));
}

const [draftsA, setDraftsA] = useState<InvoiceDraft[]>(() => toDrafts(sectionA));
const [draftsB, setDraftsB] = useState<InvoiceDraft[]>(() => toDrafts(sectionB));
const supabase = createClient();
```

**Step 2: Implement handleSaveInvoices helper**

```tsx
async function handleSaveInvoices(
  drafts: InvoiceDraft[],
  section: "A" | "B",
  userId: string
) {
  const toDelete = drafts.filter((d) => d._deleted && d.id);
  const toUpdate = drafts.filter((d) => !d._deleted && d.id);
  const toInsert = drafts.filter((d) => !d._deleted && !d.id);

  const promises: Promise<unknown>[] = [];

  // Delete
  for (const d of toDelete) {
    promises.push(supabase.from("invoices").delete().eq("id", d.id!));
  }

  // Update
  for (let i = 0; i < toUpdate.length; i++) {
    const d = toUpdate[i];
    promises.push(
      supabase.from("invoices").update({
        document_type: d.document_type,
        document_number: d.document_number,
        issue_date: d.issue_date,
        counterparty_vat_id: d.counterparty_vat_id || null,
        amount: parseFloat(d.amount) || 0,
        vat_rate: d.vat_rate ? parseFloat(d.vat_rate) : null,
        sequence_number: i + 1,
      }).eq("id", d.id!)
    );
  }

  // Insert
  const insertCount = toUpdate.length;
  for (let i = 0; i < toInsert.length; i++) {
    const d = toInsert[i];
    promises.push(
      supabase.from("invoices").insert({
        protocol_id: protocol.id,
        section,
        sequence_number: insertCount + i + 1,
        document_type: d.document_type,
        document_number: d.document_number,
        issue_date: d.issue_date,
        counterparty_vat_id: d.counterparty_vat_id || null,
        amount: parseFloat(d.amount) || 0,
        invoice_category: section === "A" ? "income" : "expense",
        vat_rate: d.vat_rate ? parseFloat(d.vat_rate) : null,
        user_id: userId,
      })
    );
  }

  const results = await Promise.all(promises);
  const errors = results.filter((r: any) => r?.error).map((r: any) => r.error);
  return errors;
}
```

**Step 3: Implement handleSave (called when user clicks "Запази")**

The header save is delegated to `ProtocolForm` via its `onSuccess` callback. After the header is saved, we save invoices, then reload the page.

```tsx
async function handleSave() {
  // Header save is triggered by ProtocolForm submit button.
  // Invoice save happens here triggered by a top-level "Save" button.
  setSaving(true);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { toast.error("Не сте влезли"); setSaving(false); return; }

  const errorsA = await handleSaveInvoices(draftsA, "A", user.id);
  const errorsB = await handleSaveInvoices(draftsB, "B", user.id);

  if ([...errorsA, ...errorsB].length > 0) {
    toast.error("Грешка при запис на фактури");
  } else {
    toast.success("Протоколът е обновен успешно");
    setIsEditing(false);
    // Refresh page to get updated data from server
    window.location.reload();
  }
  setSaving(false);
}
```

**Step 4: Restructure JSX — header area**

Replace the static header and info card with conditional rendering:

```tsx
{/* Top bar */}
<div className="flex items-start justify-between">
  <div>
    <div className="flex items-center gap-3">
      <h1 className="text-3xl font-bold">Протокол №{protocol.protocol_number}</h1>
      <Badge ...>{/* existing badge */}</Badge>
    </div>
    {!isEditing && (
      <p className="text-muted-foreground">
        {protocol.supplier_name} ({protocol.supplier_vat_id})
      </p>
    )}
  </div>
  <div className="flex gap-2">
    {!isEditing ? (
      <>
        <Button variant="outline" onClick={() => setIsEditing(true)}>
          <Pencil className="mr-2 h-4 w-4" />
          Редактирай
        </Button>
        <Button asChild variant="outline">
          <Link href={`/invoices/add?protocol=${protocol.id}`}>
            <Plus className="mr-2 h-4 w-4" />
            Добави фактура
          </Link>
        </Button>
        <ExcelExport protocol={protocol} />
        <PdfExport protocol={protocol} />
      </>
    ) : (
      <>
        <Button variant="outline" onClick={() => { setIsEditing(false); setDraftsA(toDrafts(sectionA)); setDraftsB(toDrafts(sectionB)); }}>
          <X className="mr-2 h-4 w-4" />
          Откажи
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Запазване..." : "Запази промените"}
        </Button>
      </>
    )}
  </div>
</div>

{/* Header form or info card */}
{isEditing ? (
  <ProtocolForm
    protocolId={protocol.id}
    initialData={{
      supplier_name: protocol.supplier_name,
      supplier_vat_id: protocol.supplier_vat_id,
      creation_date: protocol.creation_date,
      tax_event_date: protocol.tax_event_date,
      reference_number: protocol.reference_number ?? "",
      protocol_type: protocol.protocol_type as "eu" | "non_eu" | "mixed",
      linked_protocol_number: protocol.linked_protocol_number?.toString() ?? "",
      compiled_by: protocol.compiled_by ?? "",
      approved_by: protocol.approved_by ?? "",
    }}
    onSuccess={() => handleSave()}
    onCancel={() => setIsEditing(false)}
  />
) : (
  <Card>
    <CardContent className="grid gap-4 pt-6 md:grid-cols-4">
      {/* existing read-only info */}
    </CardContent>
  </Card>
)}
```

**Important:** When using `ProtocolForm` in edit mode inside `ProtocolDetail`, we need to separate header save from invoice save. The cleanest approach: the "Запази промените" button at the top saves **both** header and invoices. The `ProtocolForm` is used only for its field rendering, but its submit is triggered programmatically.

**Revised approach** — simpler: render the header fields inline in `ProtocolDetail` directly (duplicate the inputs from ProtocolForm), and avoid the complexity of syncing two form submissions. This keeps the save flow clean: one button → one `handleSave` that updates protocol header + all invoice changes.

**Step 5: Implement inline header fields directly in ProtocolDetail**

Add state for header draft:
```tsx
const [headerDraft, setHeaderDraft] = useState({
  supplier_name: protocol.supplier_name,
  supplier_vat_id: protocol.supplier_vat_id,
  creation_date: protocol.creation_date,
  tax_event_date: protocol.tax_event_date,
  reference_number: protocol.reference_number ?? "",
  protocol_type: protocol.protocol_type as "eu" | "non_eu" | "mixed",
  linked_protocol_number: protocol.linked_protocol_number?.toString() ?? "",
  compiled_by: protocol.compiled_by ?? "",
  approved_by: protocol.approved_by ?? "",
});
const taxRate = headerDraft.protocol_type === "non_eu" ? 0 : 20;
```

Render the edit header as a Card with a grid of Input/Select fields (same layout as ProtocolForm but without the submit button):
```tsx
{isEditing && (
  <Card className="border-violet-500/30">
    <CardHeader><CardTitle>Данни на протокола</CardTitle></CardHeader>
    <CardContent>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Име на доставчика</Label>
          <Input value={headerDraft.supplier_name} onChange={(e) => setHeaderDraft({...headerDraft, supplier_name: e.target.value})} />
        </div>
        <div className="space-y-2">
          <Label>ЕИК / ДДС номер</Label>
          <Input value={headerDraft.supplier_vat_id} onChange={(e) => setHeaderDraft({...headerDraft, supplier_vat_id: e.target.value})} />
        </div>
        {/* ... rest of fields: creation_date, tax_event_date, protocol_type, reference_number, linked_protocol_number, compiled_by, approved_by */}
      </div>
    </CardContent>
  </Card>
)}
```

**Step 6: Implement unified handleSave**

```tsx
async function handleSave() {
  setSaving(true);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { toast.error("Не сте влезли"); setSaving(false); return; }

  // 1. Update protocol header
  const { error: protocolError } = await supabase
    .from("protocols")
    .update({
      supplier_name: headerDraft.supplier_name,
      supplier_vat_id: headerDraft.supplier_vat_id,
      creation_date: headerDraft.creation_date,
      tax_event_date: headerDraft.tax_event_date,
      reference_number: headerDraft.reference_number || null,
      protocol_type: headerDraft.protocol_type,
      tax_rate: headerDraft.protocol_type === "non_eu" ? 0 : 20,
      linked_protocol_number: headerDraft.linked_protocol_number
        ? parseInt(headerDraft.linked_protocol_number)
        : null,
      compiled_by: headerDraft.compiled_by,
      approved_by: headerDraft.approved_by,
    })
    .eq("id", protocol.id);

  if (protocolError) {
    toast.error("Грешка при запис на протокола: " + protocolError.message);
    setSaving(false);
    return;
  }

  // 2. Update invoices
  const errorsA = await handleSaveInvoices(draftsA, "A", user.id);
  const errorsB = await handleSaveInvoices(draftsB, "B", user.id);

  if ([...errorsA, ...errorsB].length > 0) {
    toast.error("Грешка при запис на фактури");
    setSaving(false);
    return;
  }

  toast.success("Протоколът е обновен успешно");
  setIsEditing(false);
  window.location.reload();
  setSaving(false);
}
```

**Step 7: Replace InvoiceTable with EditableInvoiceTable**

Replace the two `<InvoiceTable ...>` usages with:
```tsx
<EditableInvoiceTable
  title="Раздел А. Получени суми по туристическата услуга"
  section="A"
  invoices={sectionA}
  isEditing={isEditing}
  showVatRate={protocol.protocol_type === "mixed"}
  drafts={draftsA}
  onDraftsChange={setDraftsA}
/>

<EditableInvoiceTable
  title="Раздел Б. Платени суми по туристическата услуга"
  section="B"
  invoices={sectionB}
  isEditing={isEditing}
  showVatRate={protocol.protocol_type === "mixed"}
  drafts={draftsB}
  onDraftsChange={setDraftsB}
/>
```

**Step 8: Remove old InvoiceTable function** (no longer needed — EditableInvoiceTable handles both modes)

**Step 9: Manual test checklist**
- [ ] Open a protocol — shows "Редактирай" button, no edit inputs visible
- [ ] Click "Редактирай" — header fields appear as inputs, invoice rows become editable, export buttons hidden
- [ ] Edit supplier name, change a date, modify an invoice amount
- [ ] Click "Запази промените" — toast success, page reloads with updated data
- [ ] Click "Редактирай" then "Откажи" — reverts to original data (no save)
- [ ] Add a new invoice row, fill it, save — new row persists after reload
- [ ] Delete an invoice row, save — row gone after reload
- [ ] Verify VatCalculation section still shows correct values

**Step 10: Commit**
```bash
git add src/components/protocols/ProtocolDetail.tsx src/components/protocols/EditableInvoiceTable.tsx
git commit -m "feat: inline edit mode for protocol detail page"
```

---

### Task 4: Smoke test full flow

**Step 1: Start dev server**
```bash
npm run dev
```

**Step 2: Manual smoke test**
- Create a new protocol at `/protocols/new` — verify still works
- Open the protocol detail — verify "Редактирай" button present
- Edit header + invoice rows + add row + delete row → save
- Verify data persists after reload
- Verify cancel restores original data

**Step 3: Commit if any small fixes needed**
```bash
git add -p
git commit -m "fix: inline edit polish"
```
