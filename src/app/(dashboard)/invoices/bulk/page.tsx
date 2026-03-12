"use client";

import { useState, useCallback, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
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
  XCircle,
  Loader2,
  Zap,
  AlertCircle,
  Files,
} from "lucide-react";
import Link from "next/link";
import type { Protocol } from "@/types";
import type { UserCredits } from "@/lib/credits";

type FileStatus = "pending" | "scanning" | "saved" | "error";

interface FileItem {
  file: File;
  status: FileStatus;
  error?: string;
}

export default function BulkInvoicePage() {
  return (
    <Suspense fallback={<div className="p-6">Зареждане...</div>}>
      <BulkInvoiceContent />
    </Suspense>
  );
}

function BulkInvoiceContent() {
  const searchParams = useSearchParams();
  const preselectedProtocol = searchParams.get("protocol");

  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [selectedProtocolId, setSelectedProtocolId] = useState(
    preselectedProtocol || ""
  );
  const [invoiceType, setInvoiceType] = useState<"income" | "expense">(
    "income"
  );
  const [invoiceVatRate, setInvoiceVatRate] = useState<20 | 0>(20);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [credits, setCredits] = useState<UserCredits | null>(null);
  const [creditsLoading, setCreditsLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    async function init() {
      try {
        const res = await fetch("/api/credits");
        if (res.ok) setCredits(await res.json());
      } catch {
        // allow page on error
      } finally {
        setCreditsLoading(false);
      }

      const { data } = await supabase
        .from("protocols")
        .select("*")
        .order("protocol_number", { ascending: false });
      if (data) setProtocols(data);
    }
    init();
  }, []);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (processing || done) return;
      const pdfs = acceptedFiles.filter((f) => f.type === "application/pdf");
      if (pdfs.length < acceptedFiles.length) {
        toast.warning(
          "Само PDF файлове са поддържани. Останалите са пропуснати."
        );
      }
      setFiles((prev) => [
        ...prev,
        ...pdfs.map((f) => ({ file: f, status: "pending" as FileStatus })),
      ]);
    },
    [processing, done]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    multiple: true,
    disabled: processing || done,
  });

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  const selectedProtocol = protocols.find((p) => p.id === selectedProtocolId);

  async function handleProcess() {
    if (!selectedProtocolId || files.length === 0) return;

    setProcessing(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Не сте влезли в системата");
      setProcessing(false);
      return;
    }

    const section = invoiceType === "income" ? "A" : "B";
    const vatRate =
      selectedProtocol?.protocol_type === "mixed" ? invoiceVatRate : null;

    // Get starting sequence number
    const { data: existing } = await supabase
      .from("invoices")
      .select("sequence_number")
      .eq("protocol_id", selectedProtocolId)
      .eq("section", section)
      .order("sequence_number", { ascending: false })
      .limit(1);

    let nextSeq =
      existing && existing.length > 0 ? existing[0].sequence_number + 1 : 1;

    let savedCount = 0;

    for (let i = 0; i < files.length; i++) {
      // Update status to scanning
      setFiles((prev) =>
        prev.map((f, idx) => (idx === i ? { ...f, status: "scanning" } : f))
      );

      try {
        const formData = new FormData();
        formData.append("file", files[i].file);

        const res = await fetch("/api/extract-invoice", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Грешка при извличане на данни");
        }

        const { error: insertError } = await supabase.from("invoices").insert({
          protocol_id: selectedProtocolId,
          section,
          sequence_number: nextSeq,
          document_type: "Фактура",
          document_number: String(data.documentNumber || ""),
          issue_date: String(
            data.issueDate || new Date().toISOString().split("T")[0]
          ),
          counterparty_vat_id: data.counterparty_vat_id || null,
          amount: Number(data.amount) || 0,
          invoice_category: invoiceType,
          vat_rate: vatRate,
          user_id: user.id,
        });

        if (insertError) throw new Error(insertError.message);

        nextSeq++;
        savedCount++;

        setFiles((prev) =>
          prev.map((f, idx) => (idx === i ? { ...f, status: "saved" } : f))
        );
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Неизвестна грешка";
        setFiles((prev) =>
          prev.map((f, idx) =>
            idx === i ? { ...f, status: "error", error: msg } : f
          )
        );
      }
    }

    setProcessing(false);
    setDone(true);

    if (savedCount === files.length) {
      toast.success(`${savedCount} фактури добавени успешно`);
    } else {
      toast.warning(
        `${savedCount} от ${files.length} фактури добавени. Проверете грешките.`
      );
    }
  }

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
                  За да добавяте фактури, започнете 14-дневен безплатен тестов период.
                </p>
              </div>
              <Link
                href="/settings"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-violet-600 px-8 py-3 text-sm font-medium text-white hover:bg-violet-700 transition-colors"
              >
                <Zap className="h-4 w-4" />
                Започни 14-дневен безплатен тест
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

  const canStart =
    !!selectedProtocolId && files.length > 0 && !processing && !done;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Добави фактури (bulk)</h1>
        <p className="text-muted-foreground">
          Качете няколко PDF фактури наведнъж — AI ще ги сканира и запише
          автоматично
        </p>
      </div>

      {/* Settings */}
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
              disabled={processing}
            >
              <SelectTrigger>
                <SelectValue placeholder="Изберете протокол" />
              </SelectTrigger>
              <SelectContent>
                {protocols.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    №{p.protocol_number} — {p.supplier_name} (
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
              disabled={processing}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="income">
                  Приходна (Раздел А — получени суми)
                </SelectItem>
                <SelectItem value="expense">
                  Разходна (Раздел Б — платени суми)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {selectedProtocol?.protocol_type === "mixed" && (
            <div className="space-y-2">
              <Label>ДДС ставка</Label>
              <Select
                value={String(invoiceVatRate)}
                onValueChange={(v) =>
                  setInvoiceVatRate(Number(v) as 20 | 0)
                }
                disabled={processing}
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
        </CardContent>
      </Card>

      {/* Dropzone + file list */}
      {!done && (
        <Card>
          <CardHeader>
            <CardTitle>PDF файлове</CardTitle>
            <CardDescription>
              Изберете или плъзнете няколко PDF фактури наведнъж
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              {...getRootProps()}
              className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${
                processing
                  ? "cursor-not-allowed opacity-50"
                  : isDragActive
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="mb-3 h-10 w-10 text-muted-foreground" />
              {isDragActive ? (
                <p>Пуснете файловете тук...</p>
              ) : (
                <>
                  <p className="text-center">
                    Плъзнете PDF файлове тук или кликнете за избор
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Можете да изберете много файлове наведнъж
                  </p>
                </>
              )}
            </div>

            {files.length > 0 && (
              <div className="space-y-2">
                {files.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-lg border px-3 py-2"
                  >
                    {item.status === "pending" && (
                      <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                    {item.status === "scanning" && (
                      <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
                    )}
                    {item.status === "saved" && (
                      <CheckCircle className="h-4 w-4 shrink-0 text-green-500" />
                    )}
                    {item.status === "error" && (
                      <XCircle className="h-4 w-4 shrink-0 text-destructive" />
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">{item.file.name}</p>
                      {item.status === "error" && item.error && (
                        <p className="text-xs text-destructive">{item.error}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-muted-foreground">
                        {(item.file.size / 1024).toFixed(0)} KB
                      </span>
                      {item.status === "pending" && !processing && (
                        <button
                          onClick={() => removeFile(i)}
                          className="text-muted-foreground hover:text-destructive transition-colors text-xs"
                        >
                          ✕
                        </button>
                      )}
                      {item.status === "scanning" && (
                        <Badge variant="secondary" className="text-xs">
                          Сканиране...
                        </Badge>
                      )}
                      {item.status === "saved" && (
                        <Badge className="text-xs bg-green-500/10 text-green-500 border-green-500/20">
                          Записана
                        </Badge>
                      )}
                      {item.status === "error" && (
                        <Badge variant="destructive" className="text-xs">
                          Грешка
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Button
              onClick={handleProcess}
              disabled={!canStart}
              className="w-full"
              size="lg"
            >
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Сканиране...
                </>
              ) : (
                <>
                  <Files className="mr-2 h-4 w-4" />
                  Сканирай и запиши ({files.length} {files.length === 1 ? "файл" : "файла"})
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Done state */}
      {done && (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-10">
            <CheckCircle className="h-12 w-12 text-green-500" />
            <div className="text-center">
              <p className="text-lg font-semibold">Готово!</p>
              <p className="text-sm text-muted-foreground">
                {files.filter((f) => f.status === "saved").length} от{" "}
                {files.length} фактури добавени
              </p>
            </div>
            {files.some((f) => f.status === "error") && (
              <div className="w-full space-y-1">
                {files
                  .filter((f) => f.status === "error")
                  .map((f, i) => (
                    <p key={i} className="text-xs text-destructive">
                      ✕ {f.file.name}: {f.error}
                    </p>
                  ))}
              </div>
            )}
            <Button asChild className="w-full">
              <Link href={`/protocols/${selectedProtocolId}`}>
                Виж протокола
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
