import Link from "next/link";
import type { Metadata } from "next";
import { getLocaleFromCookies } from "@/lib/i18n";
import PrivacyContentBg from "@/components/legal/PrivacyContentBg";
import PrivacyContentEn from "@/components/legal/PrivacyContentEn";

export const metadata: Metadata = {
  title: "Политика за поверителност | TravelInvoices",
  description:
    "Политика за защита на личните данни на платформата TravelInvoices",
};

export default async function PrivacyPage() {
  const locale = await getLocaleFromCookies();

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          &larr; {locale === "en" ? "Back to homepage" : "Обратно към началната страница"}
        </Link>

        <h1 className="text-3xl font-bold mb-2">
          {locale === "en" ? "Privacy Policy" : "Политика за поверителност"}
        </h1>
        <p className="text-sm text-muted-foreground mb-10">
          {locale === "en"
            ? "Last updated: February 26, 2026"
            : "Последна актуализация: 26 февруари 2026 г."}
        </p>

        {locale === "en" ? <PrivacyContentEn /> : <PrivacyContentBg />}
      </div>
    </div>
  );
}
