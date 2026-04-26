"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Zap, CheckCircle2, ArrowRight, Loader2, Crown } from "lucide-react";
import { toast } from "sonner";
import { useLocale } from "@/lib/i18n/context";

const PROFESSIONAL_PRICE_ID =
  process.env.NEXT_PUBLIC_STRIPE_PROFESSIONAL_PRICE_ID ||
  "price_1T8NYgRt9H8Dfn2rW1Qg9Aue";
const BUSINESS_PRICE_ID =
  process.env.NEXT_PUBLIC_STRIPE_BUSINESS_PRICE_ID ||
  "price_1T8NXORt9H8Dfn2rq4rLKxoz";

async function startCheckout(priceId: string) {
  const res = await fetch("/api/stripe/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ priceId }),
  });
  if (!res.ok) throw new Error("checkout_failed");
  const { url } = await res.json();
  if (url) {
    if (typeof window !== "undefined" && (window as any).fbq) {
      (window as any).fbq("track", "InitiateCheckout");
    }
    window.location.href = url;
  }
}

export function TrialCTA() {
  const { t } = useLocale();
  const [loading, setLoading] = useState<string | null>(null);

  const handleStart = async (priceId: string) => {
    setLoading(priceId);
    try {
      await startCheckout(priceId);
    } catch {
      toast.error(t.trial.toastCheckoutError);
    } finally {
      setLoading(null);
    }
  };

  return (
    <Card className="border-2 border-violet-500/40 bg-gradient-to-br from-violet-500/10 to-indigo-500/5">
      <CardContent className="py-8 px-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold">{t.trial.title}</h2>
          <p className="text-muted-foreground mt-2">
            {t.trial.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
          {/* Старт plan */}
          <div className="rounded-xl border border-border bg-background/50 p-5 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-500/10">
                <Zap className="h-5 w-5 text-violet-400" />
              </div>
              <div>
                <div className="font-semibold">{t.plans.starter}</div>
                <div className="text-lg font-bold">
                  {t.trial.starterPrice}
                </div>
              </div>
            </div>
            <ul className="space-y-1.5 text-sm text-muted-foreground flex-1">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                {t.trial.feature1Starter}
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                {t.trial.feature2Starter}
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                {t.trial.aiFeature}
              </li>
            </ul>
            <button
              onClick={() => handleStart(PROFESSIONAL_PRICE_ID)}
              disabled={loading !== null}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-700 transition-all disabled:opacity-50"
            >
              {loading === PROFESSIONAL_PRICE_ID ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  {t.trial.startTrial}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>

          {/* Business plan */}
          <div className="rounded-xl border-2 border-violet-500/50 bg-violet-500/5 p-5 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-500/20">
                <Crown className="h-5 w-5 text-violet-400" />
              </div>
              <div>
                <div className="font-semibold flex items-center gap-2">
                  {t.plans.business}
                  <span className="text-xs bg-violet-500/20 text-violet-300 px-1.5 py-0.5 rounded-full">{t.trial.popular}</span>
                </div>
                <div className="text-lg font-bold">
                  {t.trial.businessPrice}
                </div>
              </div>
            </div>
            <ul className="space-y-1.5 text-sm text-muted-foreground flex-1">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                {t.trial.feature1Business}
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                {t.trial.feature2Business}
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                {t.trial.aiFeature}
              </li>
            </ul>
            <button
              onClick={() => handleStart(BUSINESS_PRICE_ID)}
              disabled={loading !== null}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-700 transition-all disabled:opacity-50 shadow-lg shadow-violet-600/25"
            >
              {loading === BUSINESS_PRICE_ID ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  {t.trial.startTrial}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>

        <p className="text-xs text-center text-muted-foreground mt-4">
          {t.trial.trialNote}
        </p>
      </CardContent>
    </Card>
  );
}
