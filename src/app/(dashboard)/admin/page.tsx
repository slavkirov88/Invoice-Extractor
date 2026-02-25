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
} from "lucide-react";
import type { Subscription } from "@/types";

const ADMIN_EMAIL = "slavkirov@abv.bg";

interface UserWithSub {
  id: string;
  email: string;
  created_at: string;
  subscription: Subscription | null;
}

export default function AdminPage() {
  const [users, setUsers] = useState<UserWithSub[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
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

  useEffect(() => {
    if (isAdmin) fetchUsers();
  }, [isAdmin, fetchUsers]);

  const grantAccess = async (userId: string, plan: string) => {
    setActionLoading(userId);
    try {
      const res = await fetch("/api/admin/grant-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, plan }),
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
  };

  const statusColor: Record<string, string> = {
    active: "text-green-400 bg-green-400/10",
    trialing: "text-blue-400 bg-blue-400/10",
    past_due: "text-yellow-400 bg-yellow-400/10",
    canceled: "text-red-400 bg-red-400/10",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-8 w-8 text-violet-400" />
        <div>
          <h1 className="text-2xl font-bold">Админ панел</h1>
          <p className="text-sm text-muted-foreground">
            Управление на потребители и достъп
          </p>
        </div>
      </div>

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
                  План
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
                  sub && (sub.status === "active" || sub.status === "trialing");
                const isProcessing = actionLoading === user.id;

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
                      {sub ? (
                        <span className="capitalize">{sub.plan}</span>
                      ) : (
                        <span className="text-muted-foreground">Безплатен</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {sub ? (
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
                            <button
                              onClick={() =>
                                grantAccess(user.id, "professional")
                              }
                              className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 transition-colors"
                            >
                              <UserCheck className="h-3.5 w-3.5" />
                              Professional
                            </button>
                            <button
                              onClick={() => grantAccess(user.id, "business")}
                              className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                            >
                              <UserCheck className="h-3.5 w-3.5" />
                              Business
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
  );
}
