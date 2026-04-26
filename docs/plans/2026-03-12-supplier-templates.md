# Supplier Templates Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a supplier dropdown to the new-protocol form that auto-fills fields from the user's previously created protocols.

**Architecture:** Single file change — `ProtocolForm.tsx`. In create mode, fetch distinct suppliers from the `protocols` table ordered by most recent `created_at`. A new dropdown at the top of the form lets the user pick a supplier; selecting one populates `supplier_name`, `supplier_vat_id`, `protocol_type`, `compiled_by`, `approved_by`. All fields remain editable. No new DB table or migration needed.

**Tech Stack:** React useState/useEffect, Supabase JS client, shadcn/ui Select.

---

### Task 1: Add supplier template dropdown to ProtocolForm

**Files:**
- Modify: `src/components/protocols/ProtocolForm.tsx`

**Context — current file structure:**
- Props: `onSuccess?`, `protocolId?`, `initialData?`, `onCancel?`
- State: `loading`, `credits`, `creditsLoading`, `formData`
- `useEffect` fetches credits on mount
- Create mode = no `protocolId` prop
- Form renders inside a `<Card>` with `<CardTitle>Данни на протокола</CardTitle>`

**Step 1: Read the current file**

Read `src/components/protocols/ProtocolForm.tsx` to confirm current state before editing.

**Step 2: Add the `SupplierTemplate` type and state**

After the existing imports, add this type inside the file (before the component):

```tsx
interface SupplierTemplate {
  supplier_name: string;
  supplier_vat_id: string;
  protocol_type: "eu" | "non_eu" | "mixed";
  compiled_by: string | null;
  approved_by: string | null;
}
```

Inside the component function, after the existing state declarations, add:

```tsx
const [templates, setTemplates] = useState<SupplierTemplate[]>([]);
```

**Step 3: Fetch templates in useEffect (create mode only)**

Modify the existing `useEffect` to also fetch supplier templates when in create mode (`!protocolId`). Append this inside the `fetchCredits` function (or add a separate `fetchTemplates` call):

```tsx
useEffect(() => {
  async function fetchCredits() {
    try {
      const res = await fetch("/api/credits");
      if (res.ok) setCredits(await res.json());
    } catch {
      // allow form on error
    } finally {
      setCreditsLoading(false);
    }
  }

  async function fetchTemplates() {
    if (protocolId) return; // edit mode — skip
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch most recent protocol per unique supplier_vat_id
    const { data } = await supabase
      .from("protocols")
      .select("supplier_name, supplier_vat_id, protocol_type, compiled_by, approved_by, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!data) return;

    // Deduplicate by supplier_vat_id (keep first = most recent)
    const seen = new Set<string>();
    const unique: SupplierTemplate[] = [];
    for (const row of data) {
      if (!seen.has(row.supplier_vat_id)) {
        seen.add(row.supplier_vat_id);
        unique.push({
          supplier_name: row.supplier_name,
          supplier_vat_id: row.supplier_vat_id,
          protocol_type: row.protocol_type as "eu" | "non_eu" | "mixed",
          compiled_by: row.compiled_by,
          approved_by: row.approved_by,
        });
      }
    }
    setTemplates(unique);
  }

  fetchCredits();
  fetchTemplates();
}, []);
```

**Step 4: Add the supplier dropdown to the form JSX**

Inside the `<form>` element, add this block as the **first child** (before the existing `supplier_name` / `supplier_vat_id` grid), but only when in create mode and templates exist:

```tsx
{!protocolId && templates.length > 0 && (
  <div className="space-y-2">
    <Label>Избери доставчик (по предишен протокол)</Label>
    <Select
      value=""
      onValueChange={(vatId) => {
        if (!vatId) return;
        const tpl = templates.find((t) => t.supplier_vat_id === vatId);
        if (!tpl) return;
        setFormData((prev) => ({
          ...prev,
          supplier_name: tpl.supplier_name,
          supplier_vat_id: tpl.supplier_vat_id,
          protocol_type: tpl.protocol_type,
          compiled_by: tpl.compiled_by ?? "",
          approved_by: tpl.approved_by ?? "",
        }));
      }}
    >
      <SelectTrigger>
        <SelectValue placeholder="— Избери съществуващ доставчик —" />
      </SelectTrigger>
      <SelectContent>
        {templates.map((t) => (
          <SelectItem key={t.supplier_vat_id} value={t.supplier_vat_id}>
            {t.supplier_name} ({t.supplier_vat_id})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
    <p className="text-xs text-muted-foreground">
      Изборът ще попълни полетата автоматично — можете да ги промените след това.
    </p>
  </div>
)}
```

**Important:** The `value=""` on the Select is intentional — it always shows the placeholder text so the user can pick the same supplier multiple times without the Select appearing "selected". The real state lives in `formData`, not in the Select's value.

**Step 5: TypeScript check**

```bash
cd "C:\Users\mariy\Documents\Projects\Invoice Extractor\invoice-extractor"
npx tsc --noEmit
```

Fix any errors. Common issues:
- `protocol_type` cast: `data` from Supabase is loosely typed; the cast `as "eu" | "non_eu" | "mixed"` handles this
- Missing `supabase` in `fetchTemplates` — it's already declared in the component scope, no issue

**Step 6: Manual test checklist**

- [ ] Navigate to `/protocols/new` with NO existing protocols → dropdown does NOT appear (only shown when templates.length > 0)
- [ ] Navigate to `/protocols/new` WITH existing protocols → dropdown appears above the form fields
- [ ] Select a supplier from dropdown → supplier_name, supplier_vat_id, protocol_type, compiled_by, approved_by are filled automatically
- [ ] Dates (creation_date, tax_event_date) are NOT changed by the selection
- [ ] reference_number and linked_protocol_number are NOT changed
- [ ] After auto-fill, all fields are still editable manually
- [ ] Selecting different supplier replaces the previous auto-fill
- [ ] Submit still works correctly (creates new protocol with fresh dates)
- [ ] Edit mode (`/protocols/[id]` → click Редактирай) → dropdown does NOT appear

**Step 7: Commit**

```bash
git add src/components/protocols/ProtocolForm.tsx
git commit -m "feat: supplier template dropdown in new protocol form"
```
