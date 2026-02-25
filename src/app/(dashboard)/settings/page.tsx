"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Settings,
  CreditCard,
  Zap,
  BadgeCheck,
  LogOut,
  User,
  Crown,
  Loader2,
  ExternalLink,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import type { UserCredits } from "@/lib/credits";

export default function SettingsPage() {
  const [credits, setCredits] = useState<UserCredits | null>(null);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) setEmail(user.email || "");

      try {
        const res = await fetch("/api/credits");
        if (res.ok) setCredits(await res.json());
      } catch {
        // silently fail
      }
      setLoading(false);
    }
    init();
  }, [supabase]);

  const handleStartTrial = async () => {
    setCheckoutLoading(true);
    try {
      const priceId =
        process.env.NEXT_PUBLIC_STRIPE_PROFESSIONAL_PRICE_ID ||
        "price_1T4cIzRt9H8Dfn2r2sdoikbP";

      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });

      if (res.ok) {
        const { url } = await res.json();
        if (url) window.location.href = url;
      }
    } catch {
      // silently fail
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
      });

      if (res.ok) {
        const { url } = await res.json();
        if (url) window.location.href = url;
      }
    } catch {
      // silently fail
    } finally {
      setPortalLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-8 w-8 text-violet-400" />
        <div>
          <h1 className="text-2xl font-bold">Настройки</h1>
          <p className="text-sm text-muted-foreground">
            Управление на акаунт и абонамент
          </p>
        </div>
      </div>

      {/* Subscription section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Абонамент
          </CardTitle>
          <CardDescription>Текущ план</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current plan display */}
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="flex items-center gap-3">
              {credits?.isUnlimited ? (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10">
                  <Crown className="h-5 w-5 text-green-400" />
                </div>
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <User className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
              <div>
                <div className="font-medium">
                  {credits?.isUnlimited
                    ? credits.planName
                    : "Няма активен абонамент"}
                </div>
                <div className="text-sm text-muted-foreground">
                  {credits?.isUnlimited
                    ? "Неограничен достъп"
                    : "Започнете безплатен тест за пълен достъп"}
                </div>
              </div>
            </div>
            {credits?.isUnlimited && (
              <BadgeCheck className="h-6 w-6 text-green-400" />
            )}
          </div>

          {/* Manage subscription button (for paid users) */}
          {credits?.hasSubscription && (
            <Button
              className="w-full text-base py-6 bg-violet-600 hover:bg-violet-700"
              onClick={handleManageSubscription}
              disabled={portalLoading}
            >
              {portalLoading ? (
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
              ) : (
                <ExternalLink className="h-5 w-5 mr-2" />
              )}
              Управлявай абонамент
            </Button>
          )}

          {/* Start trial CTA (for free users) */}
          {credits && !credits.hasSubscription && (
            <div className="rounded-xl border-2 border-violet-500/40 bg-violet-500/5 p-6 text-center space-y-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-violet-500/10 border border-violet-500/30 mx-auto">
                <Zap className="h-7 w-7 text-violet-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">
                  Започнете 7-дневен безплатен тест
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Въведете картата си и получете пълен достъп. Не ви таксуваме 7 дни.
                </p>
              </div>
              <Button
                className="w-full text-base py-6 bg-violet-600 hover:bg-violet-700"
                onClick={handleStartTrial}
                disabled={checkoutLoading}
              >
                {checkoutLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                ) : (
                  <ArrowRight className="h-5 w-5 mr-2" />
                )}
                Започни безплатен тест
              </Button>
              <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                  7 дни безплатно
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                  После 50€/мес
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                  Лесен отказ
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Account section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Акаунт
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div>
              <div className="text-sm text-muted-foreground">Имейл</div>
              <div className="font-medium">{email}</div>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full text-red-400 hover:text-red-300 hover:bg-red-500/10"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Изход от акаунта
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
