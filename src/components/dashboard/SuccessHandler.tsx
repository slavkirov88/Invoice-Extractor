"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Loader2, CheckCircle2 } from "lucide-react";
import { useLocale } from "@/lib/i18n/context";

export function SuccessHandler() {
  const { t } = useLocale();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activating, setActivating] = useState(false);

  const isSuccess = searchParams.get("success") === "true";
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    if (!isSuccess || !sessionId) return;

    async function activate() {
      setActivating(true);

      try {
        // Immediately activate the subscription in Supabase
        const res = await fetch("/api/stripe/activate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });

        if (res.ok) {
          const data = await res.json();
          toast.success(
            data.plan === "business" ? t.successHandler.toastBusinessActivated : t.successHandler.toastStarterActivated
          );
        } else {
          // Fallback: wait for webhook to process
          await new Promise((resolve) => setTimeout(resolve, 3000));
          toast.success(t.successHandler.toastActivating);
        }
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }

      // Clean URL and refresh page data
      router.replace("/overview");
      router.refresh();
      setActivating(false);
    }

    activate();
  }, [isSuccess, sessionId, router]);

  if (!isSuccess || !activating) return null;

  return (
    <div className="rounded-lg border border-violet-500/30 bg-violet-500/5 p-4 flex items-center gap-3">
      <Loader2 className="h-5 w-5 animate-spin text-violet-400" />
      <span className="text-sm font-medium">{t.successHandler.activating}</span>
    </div>
  );
}
