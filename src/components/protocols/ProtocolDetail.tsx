"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VatCalculation } from "./VatCalculation";
import { ExcelExport } from "@/components/export/ExcelExport";
import { PdfExport } from "@/components/export/PdfExport";
import { EditableInvoiceTable, type InvoiceDraft } from "./EditableInvoiceTable";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { Protocol, Invoice } from "@/types";
import Link from "next/link";
import { Plus, Pencil, X, Files } from "lucide-react";
import { useLocale } from "@/lib/i18n/context";

interface ProtocolWithInvoices extends Protocol {
  invoices: Invoice[];
}

function toDrafts(invoices: Invoice[]): InvoiceDraft[] {
  return invoices.map((inv) => ({
    id: inv.id,
    _clientId: inv.id,
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

export function ProtocolDetail({
  protocol,
}: {
  protocol: ProtocolWithInvoices;
}) {
  const supabase = createClient();
  const router = useRouter();

  const sectionA = protocol.invoices
    .filter((i) => i.section === "A")
    .sort((a, b) => a.sequence_number - b.sequence_number);
  const sectionB = protocol.invoices
    .filter((i) => i.section === "B")
    .sort((a, b) => a.sequence_number - b.sequence_number);
  const sectionCommission = protocol.invoices
    .filter((i) => i.section === "commission")
    .sort((a, b) => a.sequence_number - b.sequence_number);

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [headerDraft, setHeaderDraft] = useState({
    supplier_name: protocol.supplier_name,
    supplier_vat_id: protocol.supplier_vat_id,
    creation_date: protocol.creation_date,
    tax_event_date: protocol.tax_event_date,
    reference_number: protocol.reference_number ?? "",
    protocol_type: (protocol.protocol_type as "eu" | "non_eu" | "mixed" | "commission") ?? "eu",
    linked_protocol_number: protocol.linked_protocol_number?.toString() ?? "",
    compiled_by: protocol.compiled_by ?? "",
    approved_by: protocol.approved_by ?? "",
    destination: protocol.destination ?? "",
  });

  const [draftsA, setDraftsA] = useState<InvoiceDraft[]>(() => toDrafts(sectionA));
  const [draftsB, setDraftsB] = useState<InvoiceDraft[]>(() => toDrafts(sectionB));
  const [draftsCommission, setDraftsCommission] = useState<InvoiceDraft[]>(() => toDrafts(sectionCommission));

  const headerTaxRate = headerDraft.protocol_type === "non_eu" ? 0 : 20;

  function handleCancel() {
    // Reset all drafts back to original data
    setHeaderDraft({
      supplier_name: protocol.supplier_name,
      supplier_vat_id: protocol.supplier_vat_id,
      creation_date: protocol.creation_date,
      tax_event_date: protocol.tax_event_date,
      reference_number: protocol.reference_number ?? "",
      protocol_type: (protocol.protocol_type as "eu" | "non_eu" | "mixed" | "commission") ?? "eu",
      linked_protocol_number: protocol.linked_protocol_number?.toString() ?? "",
      compiled_by: protocol.compiled_by ?? "",
      approved_by: protocol.approved_by ?? "",
      destination: protocol.destination ?? "",
    });
    setDraftsA(toDrafts(sectionA));
    setDraftsB(toDrafts(sectionB));
    setDraftsCommission(toDrafts(sectionCommission));
    setIsEditing(false);
  }

  async function handleSaveInvoices(
    drafts: InvoiceDraft[],
    section: "A" | "B" | "commission",
    userId: string
  ): Promise<boolean> {
    const toDelete = drafts.filter((d) => d._deleted && d.id);
    const toUpdate = drafts.filter((d) => !d._deleted && d.id);
    const toInsert = drafts.filter((d) => !d._deleted && !d.id);

    for (const d of toDelete) {
      const { error } = await supabase.from("invoices").delete().eq("id", d.id!);
      if (error) return false;
    }

    for (let i = 0; i < toUpdate.length; i++) {
      const d = toUpdate[i];
      const { error } = await supabase
        .from("invoices")
        .update({
          document_type: d.document_type,
          document_number: d.document_number,
          issue_date: d.issue_date,
          counterparty_vat_id: d.counterparty_vat_id || null,
          amount: parseFloat(d.amount) || 0,
          vat_rate: d.vat_rate ? parseFloat(d.vat_rate) : null,
          sequence_number: i + 1,
        })
        .eq("id", d.id!);
      if (error) return false;
    }

    const insertOffset = toUpdate.length;
    for (let i = 0; i < toInsert.length; i++) {
      const d = toInsert[i];
      const { error } = await supabase.from("invoices").insert({
        protocol_id: protocol.id,
        section,
        sequence_number: insertOffset + i + 1,
        document_type: d.document_type,
        document_number: d.document_number,
        issue_date: d.issue_date,
        counterparty_vat_id: d.counterparty_vat_id || null,
        amount: parseFloat(d.amount) || 0,
        invoice_category: section === "A" ? "income" : section === "commission" ? "commission" : "expense",
        vat_rate: d.vat_rate ? parseFloat(d.vat_rate) : null,
        user_id: userId,
      });
      if (error) return false;
    }

    return true;
  }

  const { t } = useLocale();

  async function handleSave() {
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error(t.protocols.toastNotLoggedIn);
      setSaving(false);
      return;
    }

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
        tax_rate: headerTaxRate,
        linked_protocol_number: headerDraft.linked_protocol_number
          ? parseInt(headerDraft.linked_protocol_number, 10)
          : null,
        compiled_by: headerDraft.compiled_by,
        approved_by: headerDraft.approved_by,
        destination: headerDraft.destination || null,
      })
      .eq("id", protocol.id);

    if (protocolError) {
      toast.error(t.protocols.toastSaveError + ": " + protocolError.message);
      setSaving(false);
      return;
    }

    // 2. Update invoices
    const okA = await handleSaveInvoices(draftsA, "A", user.id);
    const okB = await handleSaveInvoices(draftsB, "B", user.id);
    const okC = protocol.protocol_type === "commission"
      ? await handleSaveInvoices(draftsCommission, "commission", user.id)
      : true;

    if (!okA || !okB || !okC) {
      toast.error(t.protocols.toastSaveInvoicesError);
      setSaving(false);
      return;
    }

    toast.success(t.protocols.toastUpdated);
    setSaving(false);
    setIsEditing(false);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">
              {t.protocols.protocolNumber}{protocol.protocol_number}
            </h1>
            <Badge
              variant={
                protocol.protocol_type === "non_eu"
                  ? "secondary"
                  : protocol.protocol_type === "mixed"
                  ? "outline"
                  : "default"
              }
            >
              {protocol.protocol_type === "eu"
                ? t.protocols.typeEU
                : protocol.protocol_type === "non_eu"
                ? t.protocols.typeNonEU
                : protocol.protocol_type === "mixed"
                ? t.protocols.typeMixed
                : protocol.protocol_type === "commission"
                ? t.protocols.typeCommission
                : t.protocols.typeStandard}
            </Badge>
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
                {t.common.edit}
              </Button>
              <Button asChild variant="outline">
                <Link href={`/invoices/bulk?protocol=${protocol.id}`}>
                  <Files className="mr-2 h-4 w-4" />
                  {t.protocols.addInvoices}
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={`/invoices/add?protocol=${protocol.id}`}>
                  <Plus className="mr-2 h-4 w-4" />
                  {t.protocols.addInvoice}
                </Link>
              </Button>
              <ExcelExport protocol={protocol} />
              <PdfExport protocol={protocol} />
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleCancel} disabled={saving}>
                <X className="mr-2 h-4 w-4" />
                {t.common.cancel}
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? t.common.saving : t.common.saveChanges}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Header: read-only info card or edit form */}
      {!isEditing ? (
        <Card>
          <CardContent className="grid gap-4 pt-6 md:grid-cols-4">
            <div>
              <p className="text-sm text-muted-foreground">{t.protocols.creationDate}</p>
              <p className="font-medium">
                {format(new Date(protocol.creation_date), "dd.MM.yyyy")}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {t.protocols.taxEventDate}
              </p>
              <p className="font-medium">
                {format(new Date(protocol.tax_event_date), "dd.MM.yyyy")}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t.protocols.referenceNumber}</p>
              <p className="font-medium">
                {protocol.reference_number || "-"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t.protocols.destination}</p>
              <p className="font-medium">
                {protocol.destination || "-"}
              </p>
            </div>
            {protocol.linked_protocol_number && (
              <div>
                <p className="text-sm text-muted-foreground">{t.protocols.linkedProtocol}</p>
                <p className="font-medium">{protocol.linked_protocol_number}</p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="border-violet-500/30">
          <CardHeader>
            <CardTitle>{t.protocols.protocolData}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>{t.protocols.supplierName}</Label>
                <Input
                  value={headerDraft.supplier_name}
                  onChange={(e) =>
                    setHeaderDraft({ ...headerDraft, supplier_name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>{t.protocols.vatId}</Label>
                <Input
                  value={headerDraft.supplier_vat_id}
                  onChange={(e) =>
                    setHeaderDraft({ ...headerDraft, supplier_vat_id: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>{t.protocols.creationDate}</Label>
                <Input
                  type="date"
                  value={headerDraft.creation_date}
                  onChange={(e) =>
                    setHeaderDraft({ ...headerDraft, creation_date: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>{t.protocols.taxEventDate}</Label>
                <Input
                  type="date"
                  value={headerDraft.tax_event_date}
                  onChange={(e) =>
                    setHeaderDraft({ ...headerDraft, tax_event_date: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>{t.protocols.protocolType}</Label>
                <Select
                  value={headerDraft.protocol_type}
                  onValueChange={(value: "eu" | "non_eu" | "mixed" | "commission") =>
                    setHeaderDraft({ ...headerDraft, protocol_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="eu">{t.protocols.typeEURate}</SelectItem>
                    <SelectItem value="non_eu">{t.protocols.typeNonEURate}</SelectItem>
                    <SelectItem value="mixed">{t.protocols.typeMixedOption}</SelectItem>
                    <SelectItem value="commission">{t.protocols.typeCommissionOption}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t.protocols.taxRate}</Label>
                <Input
                  value={headerDraft.protocol_type === "mixed" ? "20 / 0" : headerTaxRate}
                  disabled
                  className="text-muted-foreground"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t.protocols.destination}</Label>
              <Input
                value={headerDraft.destination}
                onChange={(e) =>
                  setHeaderDraft({ ...headerDraft, destination: e.target.value })
                }
                placeholder={t.protocols.destinationPlaceholder}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>{t.protocols.referenceNumber}</Label>
                <Input
                  value={headerDraft.reference_number}
                  onChange={(e) =>
                    setHeaderDraft({ ...headerDraft, reference_number: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>{t.protocols.linkedProtocol}</Label>
                <Input
                  type="number"
                  value={headerDraft.linked_protocol_number}
                  onChange={(e) =>
                    setHeaderDraft({ ...headerDraft, linked_protocol_number: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>{t.protocols.createdBy}</Label>
                <Input
                  value={headerDraft.compiled_by}
                  onChange={(e) =>
                    setHeaderDraft({ ...headerDraft, compiled_by: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>{t.protocols.approvedBy}</Label>
                <Input
                  value={headerDraft.approved_by}
                  onChange={(e) =>
                    setHeaderDraft({ ...headerDraft, approved_by: e.target.value })
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <EditableInvoiceTable
        title={t.protocols.sectionA}
        section="A"
        invoices={sectionA}
        isEditing={isEditing}
        showVatRate={protocol.protocol_type === "mixed"}
        drafts={draftsA}
        onDraftsChange={setDraftsA}
      />

      <EditableInvoiceTable
        title={t.protocols.sectionB}
        section="B"
        invoices={sectionB}
        isEditing={isEditing}
        showVatRate={protocol.protocol_type === "mixed"}
        drafts={draftsB}
        onDraftsChange={setDraftsB}
      />

      {protocol.protocol_type === "commission" && (
        <EditableInvoiceTable
          title={t.protocols.commission}
          section="commission"
          invoices={sectionCommission}
          isEditing={isEditing}
          showVatRate={false}
          drafts={draftsCommission}
          onDraftsChange={setDraftsCommission}
        />
      )}

      <VatCalculation
        invoices={protocol.invoices}
        taxRate={protocol.tax_rate}
        protocolType={protocol.protocol_type}
      />
    </div>
  );
}
