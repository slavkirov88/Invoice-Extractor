"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Zap, CheckCircle2, ArrowRight, Loader2 } from "lucide-react";

export function TrialCTA() {
  const [loading, setLoading] = useState(false);

  const handleStartTrial = async () => {
    setLoading(true);
    try {
      const priceId =
        process.env.NEXT_PUBLIC_STRIPE_PROFESSIONAL_PRICE_ID ||
        "price_1T8NYgRt9H8Dfn2rW1Qg9Aue";

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
      setLoading(false);
    }
  };

  return (
    <Card className="border-2 border-violet-500/40 bg-gradient-to-br from-violet-500/10 to-indigo-500/5">
      <CardContent className="py-8 px-6 sm:px-10">
        <div className="flex flex-col items-center text-center space-y-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-violet-500/10 border border-violet-500/30">
            <Zap className="h-8 w-8 text-violet-400" />
          </div>

          <div>
            <h2 className="text-2xl font-bold">
              Започнете 7-дневен безплатен тест
            </h2>
            <p className="text-muted-foreground mt-2 max-w-md">
              Въведете картата си и получете пълен достъп до всички функции.
              Не ви таксуваме 7 дни.
            </p>
          </div>

          <button
            onClick={handleStartTrial}
            disabled={loading}
            className="group inline-flex items-center gap-2 rounded-xl bg-violet-600 px-8 py-4 text-lg font-semibold text-white hover:bg-violet-700 transition-all shadow-lg shadow-violet-600/25 hover:shadow-violet-600/40 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                Започни безплатен тест
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>

          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              7 дни безплатно
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              После 20€/месец
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Откажете се по всяко време
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
