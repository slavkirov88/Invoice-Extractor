"use client";

import { useState, useCallback, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Upload,
  FileText,
  CheckCircle,
  Loader2,
  ArrowRight,
  Zap,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import type { Protocol, ExtractedInvoiceData } from "@/types";
import type { UserCredits } from "@/lib/credits";
import { useLocale } from "@/lib/i18n/context";

type Step = "upload" | "extracting" | "review" | "saving";

export default function AddInvoicePage() {
  return (
    <Suspense fallback={<div className="p-6"><LoadingFallback /></div>}>
      <AddInvoiceContent />
    </Suspense>
  );
}

function LoadingFallback() {
  const { t } = useLocale();
  return <>{t.common.loading}</>;
}

function AddInvoiceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedProtocol = searchParams.get("protocol");

  const [step, setStep] = useState<Step>("upload");
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [selectedProtocolId, setSelectedProtocolId] = useState(
    preselectedProtocol || ""
  );
  const [invoiceType, setInvoiceType] = useState<"income" | "expense" | "commission">("income");
  const [invoiceVatRate, setInvoiceVatRate] = useState<20 | 0>(20);
  const [extractedData, setExtractedData] =
    useState<ExtractedInvoiceData | null>(null);
  const [editableData, setEditableData] = useState({
    documentNumber: "",
    issueDate: "",
    amount: "",
    counterparty_vat_id: "",
  });
  const [credits, setCredits] = useState<UserCredits | null>(null);
  const [creditsLoading, setCreditsLoading] = useState(true);

  const { t } = useLocale();
  const supabase = createClient();

  useEffect(() => {
    async function init() {
      // Fetch credits
      try {
        const res = await fetch("/api/credits");
        if (res.ok) setCredits(await res.json());
      } catch {
        // allow page on error
      } finally {
        setCreditsLoading(false);
      }

      // Fetch protocols
      const { data } = await supabase
        .from("protocols")
        .select("*")
        .order("protocol_number", { ascending: false });
      if (data) setProtocols(data);
    }
    init();
  }, []);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file || file.type !== "application/pdf") {
      toast.error(t.invoices.toastUploadPdf);
      return;
    }

    setStep("extracting");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/extract-invoice", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || t.invoices.toastExtractError);
      }

      setExtractedData(data);
      setEditableData({
        documentNumber: data.documentNumber,
        issueDate: data.issueDate,
        amount: data.amount.toString(),
        counterparty_vat_id: data.counterparty_vat_id || "",
      });
      setStep("review");
      toast.success(t.invoices.toastExtracted);
    } catch (error) {
      toast.error(
        t.invoices.toastExtractError + ": " +
          (error instanceof Error ? error.message : t.invoices.toastUnknownError)
      );
      setStep("upload");
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
  });

  const handleSave = async () => {
    if (!selectedProtocolId) {
      toast.error(t.invoices.toastSelectProtocol);
      return;
    }

    const amountNum = parseFloat(editableData.amount);
    if (!editableData.amount || isNaN(amountNum) || amountNum <= 0) {
      toast.error(t.invoices.toastAmountZero);
      return;
    }

    setStep("saving");

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error(t.invoices.toastNotLoggedIn);
      setStep("review");
      return;
    }

    const section = invoiceType === "income" ? "A" : invoiceType === "commission" ? "commission" : "B";

    // Get the next sequence number for this section
    const { data: existing } = await supabase
      .from("invoices")
      .select("sequence_number")
      .eq("protocol_id", selectedProtocolId)
      .eq("section", section)
      .order("sequence_number", { ascending: false })
      .limit(1);

    const nextSeq = existing && existing.length > 0
      ? existing[0].sequence_number + 1
      : 1;

    // Determine vat_rate for mixed protocols
    const selectedProtocol = protocols.find((p) => p.id === selectedProtocolId);
    const vatRate = selectedProtocol?.protocol_type === "mixed" ? invoiceVatRate : null;

    const { error } = await supabase.from("invoices").insert({
      protocol_id: selectedProtocolId,
      section,
      sequence_number: nextSeq,
      document_type: t.common.invoice,
      document_number: editableData.documentNumber,
      issue_date: editableData.issueDate,
      counterparty_vat_id: editableData.counterparty_vat_id || null,
      amount: parseFloat(editableData.amount),
      invoice_category: invoiceType,
      vat_rate: vatRate,
      user_id: user.id,
    });

    if (error) {
      toast.error(t.invoices.toastSaveError + ": " + error.message);
      setStep("review");
    } else {
      toast.success(t.invoices.toastAdded);
      router.push(`/protocols/${selectedProtocolId}`);
    }
  };

  if (creditsLoading) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (credits && !credits.isUnlimited) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-violet-500/10">
                <Zap className="h-8 w-8 text-violet-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">{t.invoices.upsellTitle}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {t.invoices.upsellText}
                </p>
              </div>
              <Link
                href="/settings"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-violet-600 px-8 py-3 text-sm font-medium text-white hover:bg-violet-700 transition-colors"
              >
                <Zap className="h-4 w-4" />
                {t.invoices.upsellCTA}
              </Link>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {t.invoices.upsellNote}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t.invoices.addTitle}</h1>
        <p className="text-muted-foreground">
          {t.invoices.addSubtitle}
        </p>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-2">
        <Badge variant={step === "upload" ? "default" : "secondary"}>
          {t.invoices.step1}
        </Badge>
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
        <Badge
          variant={
            step === "extracting" || step === "review" ? "default" : "secondary"
          }
        >
          {t.invoices.step2}
        </Badge>
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
        <Badge variant={step === "saving" ? "default" : "secondary"}>
          {t.invoices.step3}
        </Badge>
      </div>

      {/* Step 1: Upload */}
      {step === "upload" && (
        <Card>
          <CardHeader>
            <CardTitle>{t.invoices.uploadTitle}</CardTitle>
            <CardDescription>
              {t.invoices.uploadDescription}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              {...getRootProps()}
              className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 transition-colors ${
                isDragActive
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="mb-4 h-12 w-12 text-muted-foreground" />
              {isDragActive ? (
                <p className="text-lg">{t.invoices.dragActive}</p>
              ) : (
                <>
                  <p className="text-lg">
                    {t.invoices.dragIdle}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t.invoices.pdfOnly}
                  </p>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Extracting */}
      {step === "extracting" && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="mb-4 h-12 w-12 animate-spin text-primary" />
            <p className="text-lg">{t.invoices.extracting}</p>
            <p className="text-sm text-muted-foreground">
              {t.invoices.pleaseWait}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Review & Save */}
      {(step === "review" || step === "saving") && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                {t.invoices.extractedTitle}
              </CardTitle>
              <CardDescription>
                {t.invoices.extractedDescription}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>{t.invoices.documentNumber}</Label>
                  <Input
                    value={editableData.documentNumber}
                    onChange={(e) =>
                      setEditableData({
                        ...editableData,
                        documentNumber: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t.invoices.issueDate}</Label>
                  <Input
                    type="date"
                    value={editableData.issueDate}
                    onChange={(e) =>
                      setEditableData({
                        ...editableData,
                        issueDate: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t.invoices.amountEUR}</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editableData.amount}
                    onChange={(e) =>
                      setEditableData({
                        ...editableData,
                        amount: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t.invoices.counterpartyVatId}</Label>
                <Input
                  value={editableData.counterparty_vat_id}
                  onChange={(e) =>
                    setEditableData({
                      ...editableData,
                      counterparty_vat_id: e.target.value,
                    })
                  }
                  placeholder={t.invoices.counterpartyPlaceholder}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t.invoices.settingsTitle}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{t.invoices.protocol}</Label>
                <Select
                  value={selectedProtocolId}
                  onValueChange={setSelectedProtocolId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t.invoices.selectProtocol} />
                  </SelectTrigger>
                  <SelectContent>
                    {protocols.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        №{p.protocol_number} - {p.supplier_name} (
                        {p.protocol_type === "eu"
                          ? t.protocols.typeEU
                          : p.protocol_type === "non_eu"
                          ? t.protocols.typeNonEU
                          : p.protocol_type === "mixed"
                          ? t.protocols.typeMixed
                          : p.protocol_type === "commission"
                          ? t.protocols.typeCommission
                          : t.protocols.typeStandard}
                        )
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t.invoices.invoiceType}</Label>
                <Select
                  value={invoiceType}
                  onValueChange={(v: "income" | "expense" | "commission") => setInvoiceType(v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">
                      {t.invoices.income}
                    </SelectItem>
                    <SelectItem value="expense">
                      {t.invoices.expense}
                    </SelectItem>
                    {protocols.find((p) => p.id === selectedProtocolId)?.protocol_type === "commission" && (
                      <SelectItem value="commission">
                        {t.invoices.commissionType}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* VAT rate selector — only for mixed protocols */}
              {protocols.find((p) => p.id === selectedProtocolId)?.protocol_type === "mixed" && (
                <div className="space-y-2">
                  <Label>{t.invoices.vatRate}</Label>
                  <Select
                    value={String(invoiceVatRate)}
                    onValueChange={(v) => setInvoiceVatRate(Number(v) as 20 | 0)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="20">{t.invoices.vatEU}</SelectItem>
                      <SelectItem value="0">{t.invoices.vatNonEU}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Button
                onClick={handleSave}
                disabled={step === "saving" || !selectedProtocolId}
                className="w-full"
                size="lg"
              >
                {step === "saving" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t.common.saving}
                  </>
                ) : (
                  t.invoices.addTitle
                )}
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
