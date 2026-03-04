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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
} from "lucide-react";
import type { EmailAccount, EmailAttachment } from "@/types";

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

export default function EmailPage() {
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [attachments, setAttachments] = useState<EmailAttachment[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [loadingAttachments, setLoadingAttachments] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const supabase = createClient();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AccountFormData>({
    resolver: zodResolver(AccountSchema),
    defaultValues: {
      imap_port: 993,
      imap_secure: true,
    },
  });

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
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAttachments(data || []);
    } catch {
      toast.error("Грешка при зареждане на прикачените файлове");
    } finally {
      setLoadingAttachments(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadAccounts();
    loadAttachments();
  }, [loadAccounts, loadAttachments]);

  const handleAddAccount = async (data: AccountFormData) => {
    try {
      const res = await fetch("/api/email/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Грешка при добавяне на акаунта");
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

  const handleDeleteAccount = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/email/accounts?id=${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Грешка при изтриване");
        return;
      }

      toast.success("Акаунтът е изтрит");
      setAccounts((prev) => prev.filter((a) => a.id !== id));
    } catch {
      toast.error("Грешка при изтриване");
    } finally {
      setDeletingId(null);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/email/sync", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Грешка при синхронизация");
        return;
      }

      if (data.newAttachments > 0) {
        toast.success(`Намерени ${data.newAttachments} нови прикачени файла`);
        loadAttachments();
        loadAccounts();
      } else {
        toast.info("Няма нови прикачени файлове");
      }

      if (data.errors?.length > 0) {
        data.errors.forEach((e: string) => toast.error(e));
      }
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

      if (error || !data?.signedUrl) {
        toast.error("Грешка при генериране на линк за сваляне");
        return;
      }

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
            Свържете имейл акаунт и синхронизирайте прикачени фактури
          </p>
        </div>
      </div>

      <Tabs defaultValue="accounts">
        <TabsList>
          <TabsTrigger value="accounts" className="gap-2">
            <Mail className="h-4 w-4" />
            Акаунти
          </TabsTrigger>
          <TabsTrigger value="attachments" className="gap-2">
            <Paperclip className="h-4 w-4" />
            Прикачени файлове
          </TabsTrigger>
        </TabsList>

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
                <p className="text-sm text-muted-foreground mt-1">
                  Добавете акаунт, за да синхронизирате прикачени фактури
                </p>
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
                    {account.last_synced_at
                      ? formatDate(account.last_synced_at)
                      : "Никога"}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Attachments Tab ── */}
        <TabsContent value="attachments" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Button
              onClick={handleSync}
              disabled={syncing || accounts.length === 0}
              className="bg-violet-600 hover:bg-violet-700"
            >
              {syncing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              {syncing ? "Синхронизира се..." : "Провери имейли"}
            </Button>
          </div>

          {loadingAttachments ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : attachments.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Paperclip className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Няма прикачени файлове</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Натиснете "Провери имейли", за да синхронизирате
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>От</TableHead>
                    <TableHead>Относно</TableHead>
                    <TableHead>Файл</TableHead>
                    <TableHead>Дата</TableHead>
                    <TableHead>Размер</TableHead>
                    <TableHead className="text-right">Изтегли</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attachments.map((att) => (
                    <TableRow key={att.id}>
                      <TableCell className="text-sm text-muted-foreground max-w-[160px] truncate">
                        {att.email_from || "—"}
                      </TableCell>
                      <TableCell className="text-sm max-w-[200px] truncate">
                        {att.email_subject || "—"}
                      </TableCell>
                      <TableCell className="text-sm font-medium max-w-[180px] truncate">
                        {att.filename}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {formatDate(att.email_date)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {formatBytes(att.file_size)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDownload(att)}
                          title="Изтегли"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* ── Add Account Dialog ── */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) reset(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Добави имейл акаунт</DialogTitle>
            <DialogDescription>
              Въведете IMAP настройките на вашия имейл акаунт
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(handleAddAccount)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="display_name">Наименование</Label>
              <Input
                id="display_name"
                placeholder="Работен Gmail"
                {...register("display_name")}
              />
              {errors.display_name && (
                <p className="text-xs text-red-400">{errors.display_name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email_address">Имейл адрес</Label>
              <Input
                id="email_address"
                type="email"
                placeholder="you@example.com"
                {...register("email_address")}
              />
              {errors.email_address && (
                <p className="text-xs text-red-400">{errors.email_address.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="imap_host">IMAP хост</Label>
                <Input
                  id="imap_host"
                  placeholder="imap.gmail.com"
                  {...register("imap_host")}
                />
                {errors.imap_host && (
                  <p className="text-xs text-red-400">{errors.imap_host.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="imap_port">Порт</Label>
                <Input
                  id="imap_port"
                  type="number"
                  placeholder="993"
                  {...register("imap_port", { valueAsNumber: true })}
                />
                {errors.imap_port && (
                  <p className="text-xs text-red-400">{errors.imap_port.message}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                role="switch"
                aria-checked={imapSecure}
                onClick={() => setValue("imap_secure", !imapSecure)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                  imapSecure ? "bg-violet-600" : "bg-input"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform ${
                    imapSecure ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
              <Label>SSL/TLS шифроване</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Потребителско име</Label>
              <Input
                id="username"
                placeholder="you@example.com"
                {...register("username")}
              />
              {errors.username && (
                <p className="text-xs text-red-400">{errors.username.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Парола / App Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••••••"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-xs text-red-400">{errors.password.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                За Gmail с 2FA използвайте App Password от настройките на Google акаунта
              </p>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => { setDialogOpen(false); reset(); }}
              >
                Отказ
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-violet-600 hover:bg-violet-700"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Добави
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
