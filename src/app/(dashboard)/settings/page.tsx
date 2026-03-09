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
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import type { UserCredits } from "@/lib/credits";

const PROFESSIONAL_PRICE_ID =
  process.env.NEXT_PUBLIC_STRIPE_PROFESSIONAL_PRICE_ID ||
  "price_1T8NYgRt9H8Dfn2rW1Qg9Aue";
const BUSINESS_PRICE_ID =
  process.env.NEXT_PUBLIC_STRIPE_BUSINESS_PRICE_ID ||
  "price_1T8NXORt9H8Dfn2rq4rLKxoz";

function formatDate(iso?: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("bg-BG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function SettingsPage() {
  const [credits, setCredits] = useState<UserCredits | null>(null);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [changePlanLoading, setChangePlanLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function loadCredits() {
    const res = await fetch("/api/credits");
    if (res.ok) setCredits(await res.json());
  }

  useEffect(() => {
    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) setEmail(user.email || "");

      try {
        await loadCredits();
      } catch {
        // silently fail
      }
      setLoading(false);
    }
    init();
  }, [supabase]);

  const handleStartTrial = async (priceId: string) => {
    setCheckoutLoading(priceId);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });
      if (res.ok) {
        const { url } = await res.json();
        if (url) window.location.href = url;
      } else {
        toast.error("Грешка при създаване на сесия. Опитайте отново.");
      }
    } catch {
      toast.error("Грешка при свързване. Опитайте отново.");
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleChangePlan = async (priceId: string) => {
    setChangePlanLoading(true);
    try {
      const res = await fetch("/api/stripe/change-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });
      if (res.ok) {
        await loadCredits();
        toast.success("Планът е обновен успешно.");
      } else {
        toast.error("Грешка при смяна на план. Опитайте отново.");
      }
    } catch {
      toast.error("Грешка при свързване. Опитайте отново.");
    } finally {
      setChangePlanLoading(false);
    }
  };

  const handleCancel = async (cancel: boolean) => {
    setCancelLoading(true);
    try {
      const res = await fetch("/api/stripe/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cancel }),
      });
      if (res.ok) {
        await loadCredits();
        toast.success(cancel ? "Абонаментът ще спре в края на периода." : "Абонаментът е реактивиран.");
      } else {
        toast.error("Грешка при обновяване на абонамент. Опитайте отново.");
      }
    } catch {
      toast.error("Грешка при свързване. Опитайте отново.");
    } finally {
      setCancelLoading(false);
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

  const isFree = !credits?.hasSubscription;
  const isCanceling = credits?.subscriptionStatus === "canceling";
  const isActive =
    credits?.subscriptionStatus === "active" ||
    credits?.subscriptionStatus === "trialing" ||
    credits?.subscriptionStatus === "past_due";
  const isProfessional = credits?.plan === "professional";
  const isBusiness = credits?.plan === "business";

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

          {/* State 1: No subscription — show two plan cards */}
          {isFree && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Старт plan */}
              <div className="rounded-xl border border-border bg-muted/30 p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-500/10">
                    <Zap className="h-5 w-5 text-violet-400" />
                  </div>
                  <div>
                    <div className="font-semibold">Старт</div>
                    <div className="text-lg font-bold">20€<span className="text-sm font-normal text-muted-foreground">/мес</span></div>
                  </div>
                </div>
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    До 200 фактури/месец
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    До 50 протокола/месец
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    AI извличане от PDF
                  </li>
                </ul>
                <Button
                  className="w-full bg-violet-600 hover:bg-violet-700"
                  onClick={() => handleStartTrial(PROFESSIONAL_PRICE_ID)}
                  disabled={checkoutLoading === PROFESSIONAL_PRICE_ID}
                >
                  {checkoutLoading === PROFESSIONAL_PRICE_ID ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <ArrowRight className="h-4 w-4 mr-2" />
                  )}
                  Започни тест
                </Button>
              </div>

              {/* Бизнес plan */}
              <div className="rounded-xl border-2 border-violet-500/50 bg-violet-500/5 p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-500/20">
                    <Crown className="h-5 w-5 text-violet-400" />
                  </div>
                  <div>
                    <div className="font-semibold flex items-center gap-2">
                      Бизнес
                      <span className="text-xs bg-violet-500/20 text-violet-300 px-1.5 py-0.5 rounded-full">Популярен</span>
                    </div>
                    <div className="text-lg font-bold">40€<span className="text-sm font-normal text-muted-foreground">/мес</span></div>
                  </div>
                </div>
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    Неограничени фактури
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    Неограничени протоколи
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    AI извличане от PDF
                  </li>
                </ul>
                <Button
                  className="w-full bg-violet-600 hover:bg-violet-700"
                  onClick={() => handleStartTrial(BUSINESS_PRICE_ID)}
                  disabled={checkoutLoading === BUSINESS_PRICE_ID}
                >
                  {checkoutLoading === BUSINESS_PRICE_ID ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <ArrowRight className="h-4 w-4 mr-2" />
                  )}
                  Започни тест
                </Button>
              </div>

              <p className="sm:col-span-2 text-xs text-center text-muted-foreground">
                14 дни безплатно — без такса до края на пробния период
              </p>
            </div>
          )}

          {/* State 2: Active / trialing */}
          {(isActive) && (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10">
                    {isBusiness ? (
                      <Crown className="h-5 w-5 text-green-400" />
                    ) : (
                      <Zap className="h-5 w-5 text-green-400" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      {credits?.planName}
                      <span className="text-xs bg-green-500/15 text-green-400 px-1.5 py-0.5 rounded-full font-normal">
                        {credits?.subscriptionStatus === "trialing" ? "Пробен период" : "Активен"}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Активен до {formatDate(credits?.currentPeriodEnd)}
                    </div>
                  </div>
                </div>
                <BadgeCheck className="h-6 w-6 text-green-400 shrink-0" />
              </div>

              {/* Upgrade / Downgrade button */}
              {isProfessional && (
                <Button
                  className="w-full bg-violet-600 hover:bg-violet-700"
                  onClick={() => handleChangePlan(BUSINESS_PRICE_ID)}
                  disabled={changePlanLoading}
                >
                  {changePlanLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <TrendingUp className="h-4 w-4 mr-2" />
                  )}
                  ⬆ Upgrade на Бизнес (40€/мес)
                </Button>
              )}
              {isBusiness && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleChangePlan(PROFESSIONAL_PRICE_ID)}
                  disabled={changePlanLoading}
                >
                  {changePlanLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <TrendingDown className="h-4 w-4 mr-2" />
                  )}
                  ⬇ Downgrade на Старт (20€/мес)
                </Button>
              )}

              <div className="text-center">
                <button
                  onClick={() => handleCancel(true)}
                  disabled={cancelLoading}
                  className="text-sm text-red-400 hover:text-red-300 underline underline-offset-2 disabled:opacity-50"
                >
                  {cancelLoading ? "Зарежда..." : "Отмени абонамент"}
                </button>
              </div>
            </div>
          )}

          {/* State 3: Canceling */}
          {isCanceling && (
            <div className="space-y-4">
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
                <div className="font-medium text-amber-400">
                  Абонаментът спира на {formatDate(credits?.currentPeriodEnd)}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Имате достъп до края на периода. Реактивирайте по всяко време.
                </div>
              </div>
              <Button
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={() => handleCancel(false)}
                disabled={cancelLoading}
              >
                {cancelLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Реактивирай абонамент
              </Button>
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
