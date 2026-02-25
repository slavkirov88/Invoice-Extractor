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
} from "lucide-react";
import type { UserCredits } from "@/lib/credits";

export default function SettingsPage() {
  const [credits, setCredits] = useState<UserCredits | null>(null);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
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

  const handleCheckout = async (plan: "professional" | "business") => {
    setCheckoutLoading(plan);
    try {
      const priceId =
        plan === "professional"
          ? process.env.NEXT_PUBLIC_STRIPE_PROFESSIONAL_PRICE_ID ||
            "price_1T4cIzRt9H8Dfn2r2sdoikbP"
          : process.env.NEXT_PUBLIC_STRIPE_BUSINESS_PRICE_ID ||
            "price_1T4cJ2Rt9H8Dfn2rUVFD9FRr";

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
      setCheckoutLoading(null);
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
          <CardDescription>Текущ план и кредити</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current plan */}
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
                  {credits?.planName || "Безплатен"}
                </div>
                <div className="text-sm text-muted-foreground">
                  {credits?.isUnlimited
                    ? "Неограничен достъп"
                    : `${credits?.remaining ?? 0}/${credits?.total ?? 10} кредита остават`}
                </div>
              </div>
            </div>
            {credits?.isUnlimited && (
              <BadgeCheck className="h-6 w-6 text-green-400" />
            )}
          </div>

          {/* Credits progress bar (free plan only) */}
          {credits && !credits.isUnlimited && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">
                  Използвани кредити
                </span>
                <span className="text-sm font-medium">
                  {credits.used}/{credits.total}
                </span>
              </div>
              <div className="h-3 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    credits.remaining === 0
                      ? "bg-red-500"
                      : credits.remaining <= 3
                        ? "bg-yellow-500"
                        : "bg-violet-500"
                  }`}
                  style={{
                    width: `${(credits.used / credits.total) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Upgrade options (free plan only) */}
          {credits && !credits.isUnlimited && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border-2 border-violet-500 p-5 relative">
                <div className="absolute -top-3 left-4">
                  <span className="rounded-full bg-violet-600 px-3 py-0.5 text-xs font-medium text-white">
                    Препоръчан
                  </span>
                </div>
                <h3 className="text-lg font-semibold mt-1">Професионален</h3>
                <div className="mt-1">
                  <span className="text-3xl font-bold">50€</span>
                  <span className="text-muted-foreground">/месец</span>
                </div>
                <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                  <li>До 500 фактури/месец</li>
                  <li>Неограничени протоколи</li>
                  <li>Приоритетна поддръжка</li>
                </ul>
                <Button
                  className="w-full mt-4 bg-violet-600 hover:bg-violet-700"
                  onClick={() => handleCheckout("professional")}
                  disabled={checkoutLoading !== null}
                >
                  {checkoutLoading === "professional" ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Zap className="h-4 w-4 mr-2" />
                  )}
                  Избери Professional
                </Button>
              </div>

              <div className="rounded-xl border border-border p-5">
                <h3 className="text-lg font-semibold">Бизнес</h3>
                <div className="mt-1">
                  <span className="text-3xl font-bold">100€</span>
                  <span className="text-muted-foreground">/месец</span>
                </div>
                <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                  <li>Неограничени фактури</li>
                  <li>Неограничени протоколи</li>
                  <li>VIP поддръжка + API достъп</li>
                </ul>
                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() => handleCheckout("business")}
                  disabled={checkoutLoading !== null}
                >
                  {checkoutLoading === "business" ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Zap className="h-4 w-4 mr-2" />
                  )}
                  Избери Business
                </Button>
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
