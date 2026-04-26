"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { AlertCircle, Zap } from "lucide-react";
import Link from "next/link";
import type { UserCredits } from "@/lib/credits";
import { useLocale } from "@/lib/i18n/context";

interface SupplierTemplate {
  supplier_name: string;
  supplier_vat_id: string;
  protocol_type: "eu" | "non_eu" | "mixed";
  compiled_by: string | null;
  approved_by: string | null;
  destination: string | null;
}

interface ProtocolFormProps {
  onSuccess?: (id: string) => void;
  // Optional props for edit mode
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
    destination: string;
  };
  onCancel?: () => void;
}

export function ProtocolForm({ onSuccess, protocolId, initialData, onCancel }: ProtocolFormProps) {
  const { t } = useLocale();
  const [loading, setLoading] = useState(false);
  const [credits, setCredits] = useState<UserCredits | null>(null);
  const [creditsLoading, setCreditsLoading] = useState(true);
  const [templates, setTemplates] = useState<SupplierTemplate[]>([]);
  const [formData, setFormData] = useState({
    supplier_name: initialData?.supplier_name ?? "",
    supplier_vat_id: initialData?.supplier_vat_id ?? "",
    creation_date: initialData?.creation_date ?? new Date().toISOString().split("T")[0],
    tax_event_date: initialData?.tax_event_date ?? new Date().toISOString().split("T")[0],
    reference_number: initialData?.reference_number ?? "",
    protocol_type: (initialData?.protocol_type ?? "eu") as "eu" | "non_eu" | "mixed" | "commission",
    linked_protocol_number: initialData?.linked_protocol_number ?? "",
    compiled_by: initialData?.compiled_by ?? "",
    approved_by: initialData?.approved_by ?? "",
    destination: initialData?.destination ?? "",
  });

  // Auto tax_rate based on protocol type
  const taxRate = formData.protocol_type === "non_eu" ? 0 : 20;

  const supabase = createClient();

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

      const { data } = await supabase
        .from("protocols")
        .select("supplier_name, supplier_vat_id, protocol_type, compiled_by, approved_by, destination, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!data) return;

      // Deduplicate by supplier_vat_id (keep first = most recent)
      const seen = new Set<string>();
      const unique: SupplierTemplate[] = [];
      for (const row of data) {
        if (row.supplier_vat_id && !seen.has(row.supplier_vat_id)) {
          seen.add(row.supplier_vat_id);
          unique.push({
            supplier_name: row.supplier_name,
            supplier_vat_id: row.supplier_vat_id,
            protocol_type: row.protocol_type as "eu" | "non_eu" | "mixed",
            compiled_by: row.compiled_by,
            approved_by: row.approved_by,
            destination: row.destination,
          });
        }
      }
      setTemplates(unique);
    }

    fetchCredits();
    fetchTemplates();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Re-check subscription before submit — only for create
    if (!protocolId) {
      try {
        const res = await fetch("/api/credits");
        if (res.ok) {
          const latest: UserCredits = await res.json();
          if (!latest.isUnlimited) {
            toast.error(t.protocols.toastNoSubscription);
            setCredits(latest);
            setLoading(false);
            return;
          }
        }
      } catch {
        // proceed on error
      }
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error(t.protocols.toastNotLoggedIn);
      setLoading(false);
      return;
    }

    if (protocolId) {
      // Edit mode — do update
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
            ? parseInt(formData.linked_protocol_number, 10)
            : null,
          compiled_by: formData.compiled_by,
          approved_by: formData.approved_by,
          destination: formData.destination || null,
        })
        .eq("id", protocolId);

      if (error) {
        toast.error(t.protocols.toastSaveError + ": " + error.message);
      } else {
        toast.success(t.protocols.toastUpdated);
        onSuccess?.(protocolId);
      }
      setLoading(false);
      return;
    }

    // Calculate next protocol number per supplier
    const { data: maxResult } = await supabase
      .from("protocols")
      .select("protocol_number")
      .eq("user_id", user.id)
      .eq("supplier_vat_id", formData.supplier_vat_id)
      .order("protocol_number", { ascending: false })
      .limit(1)
      .single();

    const nextProtocolNumber = (maxResult?.protocol_number ?? 0) + 1;

    const { data, error } = await supabase
      .from("protocols")
      .insert({
        protocol_number: nextProtocolNumber,
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
        destination: formData.destination || null,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      toast.error(t.protocols.toastCreateError + ": " + error.message);
    } else {
      toast.success(
        `${t.protocols.protocolNumber}${data.protocol_number} ${t.protocols.toastCreated}`
      );
      onSuccess?.(data.id);
    }

    setLoading(false);
  };

  if (!protocolId && creditsLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
        </CardContent>
      </Card>
    );
  }

  if (!protocolId && credits && !credits.isUnlimited) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-violet-500/10">
              <Zap className="h-8 w-8 text-violet-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">{t.protocols.upsellTitle}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {t.protocols.upsellText}
              </p>
            </div>
            <Link
              href="/settings"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-violet-600 px-8 py-3 text-sm font-medium text-white hover:bg-violet-700 transition-colors"
            >
              <Zap className="h-4 w-4" />
              {t.protocols.upsellCTA}
            </Link>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {t.protocols.upsellNote}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.protocols.protocolData}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!protocolId && templates.length > 0 && (
            <div className="space-y-2">
              <Label>{t.protocols.selectSupplier}</Label>
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
                    destination: tpl.destination ?? "",
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t.protocols.selectSupplierDefault} />
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
                {t.protocols.supplierAutoFillHint}
              </p>
            </div>
          )}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="supplier_name">{t.protocols.supplierName}</Label>
              <Input
                id="supplier_name"
                value={formData.supplier_name}
                onChange={(e) =>
                  setFormData({ ...formData, supplier_name: e.target.value })
                }
                placeholder={t.protocols.supplierNamePlaceholder}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplier_vat_id">{t.protocols.vatId}</Label>
              <Input
                id="supplier_vat_id"
                value={formData.supplier_vat_id}
                onChange={(e) =>
                  setFormData({ ...formData, supplier_vat_id: e.target.value })
                }
                placeholder={t.protocols.vatIdPlaceholder}
                required
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="creation_date">{t.protocols.creationDate}</Label>
              <Input
                id="creation_date"
                type="date"
                value={formData.creation_date}
                onChange={(e) =>
                  setFormData({ ...formData, creation_date: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tax_event_date">{t.protocols.taxEventDate}</Label>
              <Input
                id="tax_event_date"
                type="date"
                value={formData.tax_event_date}
                onChange={(e) =>
                  setFormData({ ...formData, tax_event_date: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="protocol_type">{t.protocols.protocolType}</Label>
              <Select
                value={formData.protocol_type}
                onValueChange={(value: "eu" | "non_eu" | "mixed" | "commission") =>
                  setFormData({ ...formData, protocol_type: value })
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
                value={formData.protocol_type === "mixed" ? "20 / 0" : taxRate}
                disabled
                className="text-muted-foreground"
              />
              {formData.protocol_type === "mixed" && (
                <p className="text-xs text-muted-foreground">
                  {t.protocols.taxRatePerInvoiceHint}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="destination">{t.protocols.destination}</Label>
            <Input
              id="destination"
              value={formData.destination}
              onChange={(e) =>
                setFormData({ ...formData, destination: e.target.value })
              }
              placeholder={t.protocols.destinationPlaceholder}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="reference_number">
                {t.protocols.referenceNumber}
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
                {t.protocols.linkedProtocol}
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

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="compiled_by">{t.protocols.createdBy}</Label>
              <Input
                id="compiled_by"
                value={formData.compiled_by}
                onChange={(e) =>
                  setFormData({ ...formData, compiled_by: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="approved_by">{t.protocols.approvedBy}</Label>
              <Input
                id="approved_by"
                value={formData.approved_by}
                onChange={(e) =>
                  setFormData({ ...formData, approved_by: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="flex gap-2">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} disabled={loading} className="flex-1">
                {t.common.cancel}
              </Button>
            )}
            <Button type="submit" disabled={loading} className={onCancel ? "flex-1" : "w-full"}>
              {loading
                ? (protocolId ? t.common.saving : t.common.creating)
                : (protocolId ? t.common.saveChanges : t.protocols.createProtocol)}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
