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

type Step = "upload" | "extracting" | "review" | "saving";

export default function AddInvoicePage() {
  return (
    <Suspense fallback={<div className="p-6">Зареждане...</div>}>
      <AddInvoiceContent />
    </Suspense>
  );
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
  const [invoiceType, setInvoiceType] = useState<"income" | "expense">("income");
  const [invoiceVatRate, setInvoiceVatRate] = useState<20 | 0>(20);
  const [extractedData, setExtractedData] =
    useState<ExtractedInvoiceData | null>(null);
  const [editableData, setEditableData] = useState({
    documentNumber: "",
    issueDate: "",
    amount: "",
  });
  const [credits, setCredits] = useState<UserCredits | null>(null);
  const [creditsLoading, setCreditsLoading] = useState(true);

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
      toast.error("Моля качете PDF файл");
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
        throw new Error(data.error || "Грешка при извличане на данни");
      }

      setExtractedData(data);
      setEditableData({
        documentNumber: data.documentNumber,
        issueDate: data.issueDate,
        amount: data.amount.toString(),
      });
      setStep("review");
      toast.success("Данните са извлечени успешно");
    } catch (error) {
      toast.error(
        "Грешка при извличане на данни: " +
          (error instanceof Error ? error.message : "Неизвестна грешка")
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
      toast.error("Моля изберете протокол");
      return;
    }

    setStep("saving");

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Не сте влезли в системата");
      setStep("review");
      return;
    }

    const section = invoiceType === "income" ? "A" : "B";

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
      document_type: "Фактура",
      document_number: editableData.documentNumber,
      issue_date: editableData.issueDate,
      amount: parseFloat(editableData.amount),
      invoice_category: invoiceType,
      vat_rate: vatRate,
      user_id: user.id,
    });

    if (error) {
      toast.error("Грешка при запис: " + error.message);
      setStep("review");
    } else {
      toast.success("Фактурата е добавена успешно");
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
                <h3 className="text-lg font-semibold">Започнете безплатен тест</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  За да добавяте фактури, започнете 7-дневен безплатен тестов период.
                  Не ви таксуваме през първите 7 дни.
                </p>
              </div>
              <Link
                href="/settings"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-violet-600 px-8 py-3 text-sm font-medium text-white hover:bg-violet-700 transition-colors"
              >
                <Zap className="h-4 w-4" />
                Започни 7-дневен безплатен тест
              </Link>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Съществуващите фактури остават достъпни
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
        <h1 className="text-3xl font-bold">Добави фактура</h1>
        <p className="text-muted-foreground">
          Качете PDF фактура и я добавете към протокол
        </p>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-2">
        <Badge variant={step === "upload" ? "default" : "secondary"}>
          1. Качване
        </Badge>
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
        <Badge
          variant={
            step === "extracting" || step === "review" ? "default" : "secondary"
          }
        >
          2. Извличане
        </Badge>
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
        <Badge variant={step === "saving" ? "default" : "secondary"}>
          3. Запис
        </Badge>
      </div>

      {/* Step 1: Upload */}
      {step === "upload" && (
        <Card>
          <CardHeader>
            <CardTitle>Качете PDF фактура</CardTitle>
            <CardDescription>
              AI софтуер ще извлече номер, дата и стойност от фактурата
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
                <p className="text-lg">Пуснете файла тук...</p>
              ) : (
                <>
                  <p className="text-lg">
                    Плъзнете PDF файл тук или кликнете за избор
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Поддържа се само PDF формат
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
            <p className="text-lg">Извличане на данни с AI софтуер...</p>
            <p className="text-sm text-muted-foreground">
              Моля изчакайте
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
                Извлечени данни
              </CardTitle>
              <CardDescription>
                Проверете и коригирайте данните при нужда
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>№ на документа</Label>
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
                  <Label>Дата на издаване</Label>
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
                  <Label>Стойност (EUR)</Label>
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Настройки</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Протокол</Label>
                <Select
                  value={selectedProtocolId}
                  onValueChange={setSelectedProtocolId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Изберете протокол" />
                  </SelectTrigger>
                  <SelectContent>
                    {protocols.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        №{p.protocol_number} - {p.supplier_name} (
                        {p.protocol_type === "eu"
                          ? "в ЕС"
                          : p.protocol_type === "non_eu"
                          ? "извън ЕС"
                          : p.protocol_type === "mixed"
                          ? "Смесен"
                          : p.protocol_type === "commission"
                          ? "Комисионен"
                          : "Стандартен"}
                        )
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Тип фактура</Label>
                <Select
                  value={invoiceType}
                  onValueChange={(v: "income" | "expense") => setInvoiceType(v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">
                      Приходна (Раздел А - получени суми)
                    </SelectItem>
                    <SelectItem value="expense">
                      Разходна (Раздел Б - платени суми)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* VAT rate selector — only for mixed protocols */}
              {protocols.find((p) => p.id === selectedProtocolId)?.protocol_type === "mixed" && (
                <div className="space-y-2">
                  <Label>ДДС ставка</Label>
                  <Select
                    value={String(invoiceVatRate)}
                    onValueChange={(v) => setInvoiceVatRate(Number(v) as 20 | 0)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="20">в ЕС — 20%</SelectItem>
                      <SelectItem value="0">извън ЕС — 0%</SelectItem>
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
                    Записване...
                  </>
                ) : (
                  "Добави фактура"
                )}
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
