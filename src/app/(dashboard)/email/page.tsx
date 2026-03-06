"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Inbox,
  Plus,
  Trash2,
  RefreshCw,
  Download,
  Loader2,
  Mail,
  Paperclip,
  FolderOpen,
  ChevronDown,
  ChevronRight,
  FileText,
  FilePlus,
  Eye,
  EyeOff,
} from "lucide-react";
import type { EmailAccount, EmailAttachment, Protocol } from "@/types";

// ── Provider presets ────────────────────────────────────────────────────────
type ProviderId = "gmail" | "abv" | "mail_bg" | "outlook" | "yahoo" | "other";

const PROVIDERS: Record<ProviderId, { label: string; imap_host: string; imap_port: number; imap_secure: boolean }> = {
  gmail:   { label: "Gmail",       imap_host: "imap.gmail.com",            imap_port: 993, imap_secure: true },
  abv:     { label: "Abv.bg",      imap_host: "imap.abv.bg",               imap_port: 993, imap_secure: true },
  mail_bg: { label: "Mail.bg",     imap_host: "imap.mail.bg",              imap_port: 993, imap_secure: true },
  outlook: { label: "Outlook",     imap_host: "outlook.office365.com",     imap_port: 993, imap_secure: true },
  yahoo:   { label: "Yahoo",       imap_host: "imap.mail.yahoo.com",       imap_port: 993, imap_secure: true },
  other:   { label: "Друг",        imap_host: "",                          imap_port: 993, imap_secure: true },
};

// ── Schemas ────────────────────────────────────────────────────────────────
// (used only for "Друг" provider — others are auto-filled)
const AccountSchema = z.object({
  display_name: z.string().min(1, "Задайте наименование"),
  email_address: z.string().email("Невалиден имейл адрес"),
  imap_host: z.string().min(1, "Задайте IMAP хост"),
  imap_port: z.number().int().min(1).max(65535),
  imap_secure: z.boolean(),
  username: z.string().min(1, "Задайте потребителско име"),
  password: z.string().min(1, "Задайте парола"),
});
type AccountFormData = z.infer<typeof AccountSchema>;

// ── Helpers ────────────────────────────────────────────────────────────────
function formatBytes(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("bg-BG", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function monthLabel(dateStr: string | null): string {
  if (!dateStr) return "Без дата";
  const d = new Date(dateStr);
  return d.toLocaleDateString("bg-BG", { month: "long", year: "numeric" });
}

function monthKey(dateStr: string | null): string {
  if (!dateStr) return "0000-00";
  return dateStr.slice(0, 7); // "2026-02"
}

function senderLabel(from: string | null): string {
  if (!from) return "Неизвестен подател";
  // Extract name from "Name <email>" format
  const match = from.match(/^(.+?)\s*</);
  return match ? match[1].trim() : from;
}

// Group attachments: sender → monthKey → attachments
function groupAttachments(attachments: EmailAttachment[]) {
  const groups: Record<string, Record<string, EmailAttachment[]>> = {};
  for (const att of attachments) {
    const sender = att.email_from || "Неизвестен подател";
    const month = monthKey(att.email_date);
    if (!groups[sender]) groups[sender] = {};
    if (!groups[sender][month]) groups[sender][month] = [];
    groups[sender][month].push(att);
  }
  return groups;
}

// ── Add to Protocol Dialog ─────────────────────────────────────────────────
interface ExtractedData {
  documentNumber: string;
  issueDate: string;
  amount: string;
}

function AddToProtocolDialog({
  attachment,
  protocols,
  onClose,
  onSuccess,
}: {
  attachment: EmailAttachment;
  protocols: Protocol[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [extracting, setExtracting] = useState(true);
  const [saving, setSaving] = useState(false);
  const [extracted, setExtracted] = useState<ExtractedData>({
    documentNumber: "",
    issueDate: "",
    amount: "",
  });
  const [protocolId, setProtocolId] = useState("");
  const [invoiceType, setInvoiceType] = useState<"income" | "expense">("income");
  const [vatRate, setVatRate] = useState<20 | 0>(20);
  const supabase = createClient();

  useEffect(() => {
    async function extract() {
      try {
        const res = await fetch("/api/email/extract-attachment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ attachmentId: attachment.id }),
        });
        const data = await res.json();
        if (res.ok) {
          setExtracted({
            documentNumber: data.documentNumber,
            issueDate: data.issueDate,
            amount: String(data.amount),
          });
        } else {
          toast.error(data.error || "Грешка при извличане на данни");
        }
      } catch {
        toast.error("Грешка при свързване");
      } finally {
        setExtracting(false);
      }
    }
    extract();
  }, [attachment.id]);

  const selectedProtocol = protocols.find((p) => p.id === protocolId);
  const isMixed = selectedProtocol?.protocol_type === "mixed";

  const handleSave = async () => {
    if (!protocolId) {
      toast.error("Изберете протокол");
      return;
    }
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Не сте влезли"); setSaving(false); return; }

    const section = invoiceType === "income" ? "A" : "B";

    const { data: existing } = await supabase
      .from("invoices")
      .select("sequence_number")
      .eq("protocol_id", protocolId)
      .eq("section", section)
      .order("sequence_number", { ascending: false })
      .limit(1);

    const nextSeq = existing && existing.length > 0 ? existing[0].sequence_number + 1 : 1;

    const { error } = await supabase.from("invoices").insert({
      protocol_id: protocolId,
      section,
      sequence_number: nextSeq,
      document_type: "Фактура",
      document_number: extracted.documentNumber,
      issue_date: extracted.issueDate,
      amount: parseFloat(extracted.amount) || 0,
      invoice_category: invoiceType,
      vat_rate: isMixed ? vatRate : null,
      user_id: user.id,
    });

    if (error) {
      toast.error("Грешка при запис: " + error.message);
    } else {
      toast.success("Фактурата е добавена към протокола");
      onSuccess();
      onClose();
    }
    setSaving(false);
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FilePlus className="h-5 w-5 text-violet-400" />
            Добави към протокол
          </DialogTitle>
          <DialogDescription className="truncate">{attachment.filename}</DialogDescription>
        </DialogHeader>

        {extracting ? (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
            <p className="text-sm text-muted-foreground">AI извлича данните от фактурата...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Extracted data */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">№ на документа</Label>
                <Input
                  value={extracted.documentNumber}
                  onChange={(e) => setExtracted({ ...extracted, documentNumber: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Дата</Label>
                <Input
                  type="date"
                  value={extracted.issueDate}
                  onChange={(e) => setExtracted({ ...extracted, issueDate: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Сума (EUR)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={extracted.amount}
                  onChange={(e) => setExtracted({ ...extracted, amount: e.target.value })}
                />
              </div>
            </div>

            {/* Protocol */}
            <div className="space-y-1">
              <Label className="text-xs">Протокол</Label>
              <Select value={protocolId} onValueChange={setProtocolId}>
                <SelectTrigger>
                  <SelectValue placeholder="Изберете протокол" />
                </SelectTrigger>
                <SelectContent>
                  {protocols.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      №{p.protocol_number} — {p.supplier_name} (
                      {p.protocol_type === "eu" ? "в ЕС" : p.protocol_type === "non_eu" ? "извън ЕС" : p.protocol_type === "mixed" ? "Смесен" : p.protocol_type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Invoice type */}
            <div className="space-y-1">
              <Label className="text-xs">Тип фактура</Label>
              <Select value={invoiceType} onValueChange={(v: "income" | "expense") => setInvoiceType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Приходна (Раздел А)</SelectItem>
                  <SelectItem value="expense">Разходна (Раздел Б)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* VAT rate for mixed protocols */}
            {isMixed && (
              <div className="space-y-1">
                <Label className="text-xs">ДДС ставка</Label>
                <Select value={String(vatRate)} onValueChange={(v) => setVatRate(Number(v) as 20 | 0)}>
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
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Отказ</Button>
          <Button
            onClick={handleSave}
            disabled={extracting || saving || !protocolId}
            className="bg-violet-600 hover:bg-violet-700"
          >
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Добави
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Folder View ────────────────────────────────────────────────────────────
function FolderView({
  attachments,
  protocols,
  onDownload,
  onAddToProtocol,
}: {
  attachments: EmailAttachment[];
  protocols: Protocol[];
  onDownload: (att: EmailAttachment) => void;
  onAddToProtocol: (att: EmailAttachment) => void;
}) {
  const [openSenders, setOpenSenders] = useState<Record<string, boolean>>({});
  const [openMonths, setOpenMonths] = useState<Record<string, boolean>>({});

  const grouped = groupAttachments(attachments);
  const senders = Object.keys(grouped).sort();

  const toggleSender = (s: string) =>
    setOpenSenders((prev) => ({ ...prev, [s]: !prev[s] }));
  const toggleMonth = (key: string) =>
    setOpenMonths((prev) => ({ ...prev, [key]: !prev[key] }));

  if (senders.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Paperclip className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Няма прикачени файлове</p>
          <p className="text-sm text-muted-foreground mt-1">
            Натиснете "Провери имейли" или изчакайте автоматичната синхронизация
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {senders.map((sender) => {
        const months = Object.keys(grouped[sender]).sort().reverse();
        const totalFiles = months.reduce(
          (s, m) => s + grouped[sender][m].length, 0
        );
        const isOpen = openSenders[sender] ?? false;

        return (
          <Card key={sender} className="overflow-hidden">
            {/* Sender (top-level folder) */}
            <button
              onClick={() => toggleSender(sender)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left"
            >
              {isOpen ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
              <FolderOpen className="h-5 w-5 text-violet-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{senderLabel(sender)}</p>
                <p className="text-xs text-muted-foreground truncate">{sender}</p>
              </div>
              <span className="text-xs text-muted-foreground shrink-0">
                {totalFiles} {totalFiles === 1 ? "файл" : "файла"}
              </span>
            </button>

            {/* Month sub-folders */}
            {isOpen && (
              <div className="border-t border-border">
                {months.map((mk) => {
                  const files = grouped[sender][mk];
                  const monthOpen = openMonths[`${sender}__${mk}`] ?? true;
                  const label = monthLabel(files[0]?.email_date ?? null);

                  return (
                    <div key={mk} className="border-b border-border last:border-0">
                      <button
                        onClick={() => toggleMonth(`${sender}__${mk}`)}
                        className="w-full flex items-center gap-3 px-6 py-2 hover:bg-muted/30 transition-colors text-left"
                      >
                        {monthOpen ? (
                          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        )}
                        <span className="text-sm font-medium capitalize">{label}</span>
                        <span className="text-xs text-muted-foreground ml-auto">
                          {files.length} {files.length === 1 ? "файл" : "файла"}
                        </span>
                      </button>

                      {/* Files */}
                      {monthOpen && (
                        <div className="bg-muted/20">
                          {files.map((att) => (
                            <div
                              key={att.id}
                              className="flex items-center gap-3 px-8 py-2.5 border-t border-border/50 hover:bg-muted/30 transition-colors"
                            >
                              <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{att.filename}</p>
                                <p className="text-xs text-muted-foreground">
                                  {formatDate(att.email_date)} · {formatBytes(att.file_size)}
                                  {att.email_subject && ` · ${att.email_subject}`}
                                </p>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-violet-400 hover:text-violet-300 hover:bg-violet-500/10 gap-1 text-xs"
                                  onClick={() => onAddToProtocol(att)}
                                >
                                  <FilePlus className="h-3.5 w-3.5" />
                                  Добави към протокол
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => onDownload(att)}
                                  title="Изтегли"
                                >
                                  <Download className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function EmailPage() {
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [attachments, setAttachments] = useState<EmailAttachment[]>([]);
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [loadingAttachments, setLoadingAttachments] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [addingAttachment, setAddingAttachment] = useState<EmailAttachment | null>(null);

  const supabase = createClient();

  // Wizard state
  const [wizardStep, setWizardStep] = useState<1 | 2>(1);
  const [selectedProvider, setSelectedProvider] = useState<ProviderId | null>(null);
  const [wizardEmail, setWizardEmail] = useState("");
  const [wizardPassword, setWizardPassword] = useState("");
  const [wizardHost, setWizardHost] = useState("");
  const [wizardPort, setWizardPort] = useState(993);
  const [wizardSaving, setWizardSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [wizardSecure, setWizardSecure] = useState(true);

  // legacy hook-form (kept for "other" provider extra fields)
  const { register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } =
    useForm<AccountFormData>({ resolver: zodResolver(AccountSchema), defaultValues: { imap_port: 993, imap_secure: true } });

  const resetWizard = () => {
    setWizardStep(1);
    setSelectedProvider(null);
    setWizardEmail("");
    setWizardPassword("");
    setWizardHost("");
    setWizardPort(993);
    setWizardSecure(true);
  };

  const loadAccounts = useCallback(async () => {
    setLoadingAccounts(true);
    try {
      const res = await fetch("/api/email/accounts");
      if (res.ok) setAccounts(await res.json());
    } catch {
      toast.error("Грешка при зареждане на акаунтите");
    } finally {
      setLoadingAccounts(false);
    }
  }, []);

  const loadAttachments = useCallback(async () => {
    setLoadingAttachments(true);
    try {
      const { data, error } = await supabase
        .from("email_attachments")
        .select("*")
        .order("email_date", { ascending: false });
      if (error) throw error;
      setAttachments(data || []);
    } catch {
      toast.error("Грешка при зареждане на прикачените файлове");
    } finally {
      setLoadingAttachments(false);
    }
  }, [supabase]);

  const loadProtocols = useCallback(async () => {
    const { data } = await supabase
      .from("protocols")
      .select("*")
      .order("protocol_number", { ascending: false });
    if (data) setProtocols(data);
  }, [supabase]);

  useEffect(() => {
    loadAccounts();
    loadAttachments();
    loadProtocols();
  }, [loadAccounts, loadAttachments, loadProtocols]);

  const handleAddAccount = async (data: AccountFormData) => {
    try {
      const res = await fetch("/api/email/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Грешка при добавяне");
        return;
      }
      toast.success("Имейл акаунтът е добавен успешно");
      setDialogOpen(false);
      reset();
      loadAccounts();
    } catch {
      toast.error("Грешка при добавяне на акаунта");
    }
  };

  const handleWizardSave = async () => {
    if (!selectedProvider || !wizardEmail || !wizardPassword) return;
    const provider = PROVIDERS[selectedProvider];
    const host = selectedProvider === "other" ? wizardHost : provider.imap_host;
    if (!host) { toast.error("Въведете IMAP хост"); return; }

    setWizardSaving(true);
    try {
      const res = await fetch("/api/email/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: provider.label === "Друг" ? wizardEmail : `${provider.label} (${wizardEmail})`,
          email_address: wizardEmail,
          imap_host: host,
          imap_port: selectedProvider === "other" ? wizardPort : provider.imap_port,
          imap_secure: selectedProvider === "other" ? wizardSecure : provider.imap_secure,
          username: wizardEmail,
          password: wizardPassword,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Грешка при добавяне");
        return;
      }
      toast.success("Имейл акаунтът е свързан успешно!");
      setDialogOpen(false);
      resetWizard();
      loadAccounts();
    } catch {
      toast.error("Грешка при свързване");
    } finally {
      setWizardSaving(false);
    }
  };

  const handleDeleteAccount = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/email/accounts?id=${id}`, { method: "DELETE" });
      if (!res.ok) { toast.error("Грешка при изтриване"); return; }
      toast.success("Акаунтът е изтрит");
      setAccounts((prev) => prev.filter((a) => a.id !== id));
    } catch {
      toast.error("Грешка при изтриване");
    } finally {
      setDeletingId(null);
    }
  };

  const handleSync = async (force = false) => {
    setSyncing(true);
    try {
      const res = await fetch("/api/email/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Грешка при синхронизация"); return; }
      if (data.newAttachments > 0) {
        toast.success(`Намерени ${data.newAttachments} нови прикачени файла`);
        loadAttachments();
        loadAccounts();
      } else {
        toast.info("Няма нови прикачени файлове");
      }
      if (data.errors?.length > 0) data.errors.forEach((e: string) => toast.error(e));
    } catch {
      toast.error("Грешка при синхронизация");
    } finally {
      setSyncing(false);
    }
  };

  const handleDownload = async (attachment: EmailAttachment) => {
    try {
      const { data, error } = await supabase.storage
        .from("email-attachments")
        .createSignedUrl(attachment.storage_path, 60);
      if (error || !data?.signedUrl) { toast.error("Грешка при генериране на линк"); return; }
      window.open(data.signedUrl, "_blank");
    } catch {
      toast.error("Грешка при сваляне");
    }
  };

  const imapSecure = watch("imap_secure");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Inbox className="h-8 w-8 text-violet-400" />
        <div>
          <h1 className="text-2xl font-bold">Имейли</h1>
          <p className="text-sm text-muted-foreground">
            Автоматична синхронизация веднъж дневно · Фактури организирани по контрагент и месец
          </p>
        </div>
      </div>

      <Tabs defaultValue="attachments">
        <TabsList>
          <TabsTrigger value="attachments" className="gap-2">
            <Paperclip className="h-4 w-4" />
            Фактури от имейли
          </TabsTrigger>
          <TabsTrigger value="accounts" className="gap-2">
            <Mail className="h-4 w-4" />
            Акаунти
          </TabsTrigger>
        </TabsList>

        {/* ── Attachments Tab ── */}
        <TabsContent value="attachments" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {attachments.length > 0 && `${attachments.length} файла от ${Object.keys(groupAttachments(attachments)).length} контрагента`}
            </p>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => handleSync(false)}
                disabled={syncing || accounts.length === 0}
                variant="outline"
                size="sm"
              >
                {syncing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                {syncing ? "Синхронизира..." : "Провери сега"}
              </Button>
              <Button
                onClick={() => handleSync(true)}
                disabled={syncing || accounts.length === 0}
                variant="outline"
                size="sm"
                title="Сканира последните 30 дни наново"
              >
                {syncing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Пълно сканиране
              </Button>
            </div>
          </div>

          {loadingAttachments ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <FolderView
              attachments={attachments}
              protocols={protocols}
              onDownload={handleDownload}
              onAddToProtocol={setAddingAttachment}
            />
          )}
        </TabsContent>

        {/* ── Accounts Tab ── */}
        <TabsContent value="accounts" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Button onClick={() => setDialogOpen(true)} className="bg-violet-600 hover:bg-violet-700">
              <Plus className="h-4 w-4 mr-2" />
              Добави акаунт
            </Button>
          </div>

          {loadingAccounts ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : accounts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Mail className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Няма добавени имейл акаунти</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {accounts.map((account) => (
                <Card key={account.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{account.display_name}</CardTitle>
                        <CardDescription className="mt-1">
                          {account.email_address} · {account.imap_host}:{account.imap_port}
                          {account.imap_secure ? " (SSL)" : ""}
                        </CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 shrink-0"
                        onClick={() => handleDeleteAccount(account.id)}
                        disabled={deletingId === account.id}
                      >
                        {deletingId === account.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 text-sm text-muted-foreground">
                    Последна синхронизация:{" "}
                    {account.last_synced_at ? formatDate(account.last_synced_at) : "Никога"}
                    {" · "}
                    <span className="text-xs">Автоматична синхронизация: всеки ден в 06:00</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ── Add Account Wizard ── */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetWizard(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Свържи имейл акаунт</DialogTitle>
            <DialogDescription>
              {wizardStep === 1 ? "Стъпка 1 от 2 — Избери доставчик" : "Стъпка 2 от 2 — Въведи данните си"}
            </DialogDescription>
          </DialogHeader>

          {/* Step 1: Provider selection */}
          {wizardStep === 1 && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {(Object.entries(PROVIDERS) as [ProviderId, typeof PROVIDERS[ProviderId]][]).map(([id, p]) => (
                  <button
                    key={id}
                    onClick={() => { setSelectedProvider(id); setWizardStep(2); }}
                    className="flex items-center gap-3 rounded-lg border border-border px-4 py-3 text-left hover:border-violet-500 hover:bg-violet-500/5 transition-colors"
                  >
                    <Mail className="h-5 w-5 text-violet-400 shrink-0" />
                    <span className="font-medium text-sm">{p.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Email + password */}
          {wizardStep === 2 && selectedProvider && (
            <div className="space-y-4">
              {/* Gmail App Password guide */}
              {selectedProvider === "gmail" && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 space-y-1">
                  <p className="text-sm font-medium text-amber-400">⚠️ Gmail изисква специална парола</p>
                  <p className="text-xs text-muted-foreground">
                    Не използвайте обичайната си парола. Вместо това:
                  </p>
                  <ol className="text-xs text-muted-foreground space-y-0.5 list-decimal list-inside">
                    <li>Отворете <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="text-violet-400 underline">myaccount.google.com/apppasswords</a></li>
                    <li>Напишете „TravelInvoices" → натиснете „Създаване"</li>
                    <li>Копирайте показаната парола (16 символа без интервали)</li>
                  </ol>
                </div>
              )}

              {/* Abv.bg guide */}
              {selectedProvider === "abv" && (
                <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-3">
                  <p className="text-xs text-muted-foreground">
                    Използвайте обичайната си парола за Abv.bg. Ако не работи, влезте в Abv.bg → Настройки → Сигурност и активирайте достъп за приложения.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="w-email">Имейл адрес</Label>
                <Input
                  id="w-email"
                  type="email"
                  placeholder="вашия@имейл.com"
                  value={wizardEmail}
                  onChange={(e) => setWizardEmail(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="w-password">
                  {selectedProvider === "gmail" ? "App Password (16 символа)" : "Парола"}
                </Label>
                <div className="relative">
                  <Input
                    id="w-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••••••••••"
                    value={wizardPassword}
                    onChange={(e) => setWizardPassword(e.target.value.replace(/\s/g, ""))}
                    className="pr-10 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {selectedProvider === "gmail" && wizardPassword && (
                  <p className={`text-xs ${wizardPassword.length === 16 ? "text-green-500" : "text-amber-400"}`}>
                    {wizardPassword.length}/16 символа {wizardPassword.length === 16 ? "✓" : "— трябва да са точно 16"}
                  </p>
                )}
              </div>

              {/* Extra fields only for "other" */}
              {selectedProvider === "other" && (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="w-host">IMAP хост</Label>
                    <Input
                      id="w-host"
                      placeholder="imap.example.com"
                      value={wizardHost}
                      onChange={(e) => setWizardHost(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="w-port">Порт</Label>
                      <Input
                        id="w-port"
                        type="number"
                        value={wizardPort}
                        onChange={(e) => setWizardPort(Number(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Защита</Label>
                      <Select
                        value={wizardSecure ? "ssl" : "starttls"}
                        onValueChange={(v) => {
                          const ssl = v === "ssl";
                          setWizardSecure(ssl);
                          setWizardPort(ssl ? 993 : 143);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ssl">SSL/TLS (993)</SelectItem>
                          <SelectItem value="starttls">STARTTLS / Без (143)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setWizardStep(1)}>← Назад</Button>
                <Button
                  onClick={handleWizardSave}
                  disabled={wizardSaving || !wizardEmail || !wizardPassword}
                  className="bg-violet-600 hover:bg-violet-700"
                >
                  {wizardSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Свържи акаунта
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Add to Protocol Dialog ── */}
      {addingAttachment && (
        <AddToProtocolDialog
          attachment={addingAttachment}
          protocols={protocols}
          onClose={() => setAddingAttachment(null)}
          onSuccess={loadAttachments}
        />
      )}
    </div>
  );
}
