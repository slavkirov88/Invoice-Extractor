"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  Shield,
  UserCheck,
  UserX,
  Loader2,
  Crown,
  AlertCircle,
  Clock,
  Plus,
  Trash2,
  FileText,
  FolderOpen,
} from "lucide-react";
import type { Subscription } from "@/types";

const ADMIN_EMAIL = "slavkirov@abv.bg";

const WHITELIST_PERIODS = [
  { label: "1 месец", months: 1 },
  { label: "3 месеца", months: 3 },
  { label: "6 месеца", months: 6 },
  { label: "1 година", months: 12 },
];

interface UserWithSub {
  id: string;
  email: string;
  created_at: string;
  subscription: Subscription | null;
}

interface WhitelistEntry {
  id: string;
  email: string;
  plan: string;
  expires_at: string | null;
  added_by: string | null;
  created_at: string;
  user_id: string | null;
  registered: boolean;
  registered_at: string | null;
  protocols_count: number;
  invoices_count: number;
}

export default function AdminPage() {
  const [users, setUsers] = useState<UserWithSub[]>([]);
  const [whitelist, setWhitelist] = useState<WhitelistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [whitelistLoading, setWhitelistLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedMonths, setSelectedMonths] = useState<Record<string, number>>(
    {}
  );

  // Beta tester form
  const [newEmail, setNewEmail] = useState("");
  const [newMonths, setNewMonths] = useState(1);
  const [addingEmail, setAddingEmail] = useState(false);

  const router = useRouter();

  useEffect(() => {
    async function checkAdmin() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || user.email !== ADMIN_EMAIL) {
        router.push("/overview");
        return;
      }
      setIsAdmin(true);
    }
    checkAdmin();
  }, [router]);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setUsers(data.users);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchWhitelist = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/whitelist");
      if (!res.ok) throw new Error("Failed to fetch whitelist");
      const data = await res.json();
      setWhitelist(data.whitelist);
    } catch (error) {
      console.error("Error fetching whitelist:", error);
    } finally {
      setWhitelistLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
      fetchWhitelist();
    }
  }, [isAdmin, fetchUsers, fetchWhitelist]);

  const grantAccess = async (userId: string) => {
    setActionLoading(userId);
    const months = selectedMonths[userId] || 1;
    try {
      const res = await fetch("/api/admin/grant-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, plan: "professional", months }),
      });
      if (res.ok) await fetchUsers();
    } finally {
      setActionLoading(null);
    }
  };

  const revokeAccess = async (userId: string) => {
    setActionLoading(userId);
    try {
      const res = await fetch("/api/admin/grant-access", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) await fetchUsers();
    } finally {
      setActionLoading(null);
    }
  };

  const addBetaTester = async () => {
    if (!newEmail || !newEmail.includes("@")) return;
    setAddingEmail(true);
    try {
      const res = await fetch("/api/admin/whitelist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail, months: newMonths }),
      });
      if (res.ok) {
        setNewEmail("");
        await fetchWhitelist();
      }
    } finally {
      setAddingEmail(false);
    }
  };

  const removeBetaTester = async (email: string) => {
    setActionLoading(`wl-${email}`);
    try {
      const res = await fetch("/api/admin/whitelist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) await fetchWhitelist();
    } finally {
      setActionLoading(null);
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const statusLabel: Record<string, string> = {
    active: "Активен",
    trialing: "Пробен период",
    past_due: "Просрочен",
    canceled: "Отказан",
    canceling: "Отменя се",
  };

  const statusColor: Record<string, string> = {
    active: "text-green-400 bg-green-400/10",
    trialing: "text-blue-400 bg-blue-400/10",
    past_due: "text-yellow-400 bg-yellow-400/10",
    canceled: "text-red-400 bg-red-400/10",
    canceling: "text-orange-400 bg-orange-400/10",
  };

  function getRemainingDays(dateStr: string): number {
    const diff = new Date(dateStr).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  function isWhitelistSub(sub: Subscription): boolean {
    return !sub.stripe_subscription_id;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Shield className="h-8 w-8 text-violet-400" />
        <div>
          <h1 className="text-2xl font-bold">Админ панел</h1>
          <p className="text-sm text-muted-foreground">
            Управление на потребители и достъп
          </p>
        </div>
      </div>

      {/* Beta Testers Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <UserCheck className="h-5 w-5 text-amber-400" />
          Бета тестери
        </h2>

        {/* Add beta tester form */}
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Имейл
              </label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                onKeyDown={(e) => e.key === "Enter" && addBetaTester()}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Период
              </label>
              <select
                value={newMonths}
                onChange={(e) => setNewMonths(Number(e.target.value))}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                {WHITELIST_PERIODS.map((p) => (
                  <option key={p.months} value={p.months}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={addBetaTester}
              disabled={addingEmail || !newEmail}
              className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50 transition-colors"
            >
              {addingEmail ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Добави
            </button>
          </div>
        </div>

        {/* Whitelist table */}
        {whitelistLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : whitelist.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
            <AlertCircle className="h-8 w-8 mb-2" />
            <p className="text-sm">Няма добавени бета тестери</p>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    Имейл
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    Статус
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    Използване
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    Изтича
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody>
                {whitelist.map((entry) => {
                  const isExpired =
                    entry.expires_at &&
                    new Date(entry.expires_at) < new Date();
                  const remaining = entry.expires_at
                    ? getRemainingDays(entry.expires_at)
                    : null;
                  const isProcessing = actionLoading === `wl-${entry.email}`;

                  return (
                    <tr
                      key={entry.id}
                      className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm">
                        {entry.email}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {entry.registered ? (
                          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium text-green-400 bg-green-400/10">
                            <UserCheck className="h-3 w-3" />
                            Регистриран
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium text-muted-foreground bg-muted">
                            Очаква регистрация
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {entry.registered ? (
                          <div className="flex items-center gap-3">
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                              <FolderOpen className="h-3 w-3" />
                              {entry.protocols_count} протокола
                            </span>
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                              <FileText className="h-3 w-3" />
                              {entry.invoices_count} фактури
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {entry.expires_at ? (
                          <span
                            className={`inline-flex items-center gap-1 text-xs ${
                              isExpired
                                ? "text-red-400"
                                : "text-muted-foreground"
                            }`}
                          >
                            <Clock className="h-3 w-3" />
                            {isExpired
                              ? "Изтекъл"
                              : `${remaining} дни`}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            Без срок
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isProcessing ? (
                          <Loader2 className="h-4 w-4 animate-spin ml-auto" />
                        ) : (
                          <button
                            onClick={() => removeBetaTester(entry.email)}
                            className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Премахни
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* All Users Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Всички потребители</h2>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <AlertCircle className="h-12 w-12 mb-4" />
            <p>Няма регистрирани потребители</p>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    Имейл
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    Регистрация
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    Статус
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const sub = user.subscription;
                  const isActive =
                    sub &&
                    (sub.status === "active" || sub.status === "trialing");
                  const isProcessing = actionLoading === user.id;
                  const wl = sub && isWhitelistSub(sub);
                  const remaining =
                    sub && isActive && wl && sub.current_period_end
                      ? getRemainingDays(sub.current_period_end)
                      : null;

                  return (
                    <tr
                      key={user.id}
                      className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          {user.email === ADMIN_EMAIL && (
                            <Crown className="h-4 w-4 text-yellow-400" />
                          )}
                          {user.email}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString("bg-BG")}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {sub && isActive ? (
                          <div className="flex flex-col gap-1">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium w-fit ${
                                wl
                                  ? "text-amber-400 bg-amber-400/10"
                                  : statusColor[sub.status] || ""
                              }`}
                            >
                              {wl ? (
                                <>
                                  <UserCheck className="h-3 w-3" />
                                  Whitelist
                                </>
                              ) : (
                                statusLabel[sub.status] || sub.status
                              )}
                            </span>
                            {remaining !== null && (
                              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {remaining > 0
                                  ? `${remaining} дни остават`
                                  : "Изтекъл"}
                              </span>
                            )}
                          </div>
                        ) : sub ? (
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[sub.status] || ""}`}
                          >
                            {statusLabel[sub.status] || sub.status}
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium text-muted-foreground bg-muted">
                            Няма абонамент
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isProcessing ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : user.email === ADMIN_EMAIL ? (
                            <span className="text-xs text-muted-foreground">
                              Админ
                            </span>
                          ) : isActive ? (
                            <button
                              onClick={() => revokeAccess(user.id)}
                              className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                            >
                              <UserX className="h-3.5 w-3.5" />
                              Премахни
                            </button>
                          ) : (
                            <>
                              <select
                                value={selectedMonths[user.id] || 1}
                                onChange={(e) =>
                                  setSelectedMonths({
                                    ...selectedMonths,
                                    [user.id]: Number(e.target.value),
                                  })
                                }
                                className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs"
                              >
                                {WHITELIST_PERIODS.map((p) => (
                                  <option key={p.months} value={p.months}>
                                    {p.label}
                                  </option>
                                ))}
                              </select>
                              <button
                                onClick={() => grantAccess(user.id)}
                                className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 transition-colors"
                              >
                                <UserCheck className="h-3.5 w-3.5" />
                                Whitelist
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
