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
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import type { UserCredits } from "@/lib/credits";
import { useLocale } from "@/lib/i18n/context";

const PROFESSIONAL_PRICE_ID =
  process.env.NEXT_PUBLIC_STRIPE_PROFESSIONAL_PRICE_ID ||
  "price_1T8NYgRt9H8Dfn2rW1Qg9Aue";
const BUSINESS_PRICE_ID =
  process.env.NEXT_PUBLIC_STRIPE_BUSINESS_PRICE_ID ||
  "price_1T8NXORt9H8Dfn2rq4rLKxoz";

export default function SettingsPage() {
  const { t, locale } = useLocale();
  const [credits, setCredits] = useState<UserCredits | null>(null);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  function formatDate(iso?: string) {
    if (!iso) return "";
    return new Date(iso).toLocaleDateString(locale === "bg" ? "bg-BG" : "en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

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
        const data = await res.json();
        toast.error(data.detail || data.error || t.settings.toastCheckoutError);
      }
    } catch {
      toast.error(t.settings.toastNetworkError);
    } finally {
      setCheckoutLoading(null);
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
      } else {
        const data = await res.json();
        toast.error(data.detail || data.error || t.settings.toastCheckoutError);
      }
    } catch {
      toast.error(t.settings.toastNetworkError);
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

  const isFree = !credits?.hasSubscription;
  const isCanceling = credits?.subscriptionStatus === "canceling";
  const isActive =
    credits?.subscriptionStatus === "active" ||
    credits?.subscriptionStatus === "trialing" ||
    credits?.subscriptionStatus === "past_due";
  const isBusiness = credits?.plan === "business";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-8 w-8 text-violet-400" />
        <div>
          <h1 className="text-2xl font-bold">{t.settings.title}</h1>
          <p className="text-sm text-muted-foreground">
            {t.settings.subtitle}
          </p>
        </div>
      </div>

      {/* Subscription section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            {t.settings.subscription}
          </CardTitle>
          <CardDescription>{t.settings.currentPlan}</CardDescription>
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
                    <div className="font-semibold">{t.settings.starterPlan}</div>
                    <div className="text-lg font-bold">{t.settings.starterPrice}</div>
                  </div>
                </div>
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    {t.settings.starterFeature1}
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    {t.settings.starterFeature2}
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    {t.settings.aiFeature}
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
                  {t.settings.startTrial}
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
                      {t.settings.businessPlan}
                      <span className="text-xs bg-violet-500/20 text-violet-300 px-1.5 py-0.5 rounded-full">{t.settings.popular}</span>
                    </div>
                    <div className="text-lg font-bold">{t.settings.businessPrice}</div>
                  </div>
                </div>
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    {t.settings.businessFeature1}
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    {t.settings.businessFeature2}
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    {t.settings.aiFeature}
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
                  {t.settings.startTrial}
                </Button>
              </div>

              <p className="sm:col-span-2 text-xs text-center text-muted-foreground">
                {t.settings.trialNote}
              </p>
            </div>
          )}

          {/* State 2: Active / trialing */}
          {isActive && (
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
                      {credits?.plan === "professional" ? t.plans.starter : credits?.plan === "business" ? t.plans.business : t.plans.free}
                      <span className="text-xs bg-green-500/15 text-green-400 px-1.5 py-0.5 rounded-full font-normal">
                        {credits?.subscriptionStatus === "trialing" ? t.settings.trialStatus : t.settings.activeStatus}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {t.settings.activeUntil} {formatDate(credits?.currentPeriodEnd)}
                    </div>
                  </div>
                </div>
                <BadgeCheck className="h-6 w-6 text-green-400 shrink-0" />
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={handleManageSubscription}
                disabled={portalLoading}
              >
                {portalLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <ExternalLink className="h-4 w-4 mr-2" />
                )}
                {t.settings.manageSubscription}
              </Button>
            </div>
          )}

          {/* State 3: Canceling */}
          {isCanceling && (
            <div className="space-y-4">
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
                <div className="font-medium text-amber-400">
                  {t.settings.cancelingWarning} {formatDate(credits?.currentPeriodEnd)}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {t.settings.cancelingNote}
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={handleManageSubscription}
                disabled={portalLoading}
              >
                {portalLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <ExternalLink className="h-4 w-4 mr-2" />
                )}
                {t.settings.manageSubscription}
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
            {t.settings.account}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div>
              <div className="text-sm text-muted-foreground">{t.settings.emailLabel}</div>
              <div className="font-medium">{email}</div>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full text-red-400 hover:text-red-300 hover:bg-red-500/10"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            {t.settings.logout}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
