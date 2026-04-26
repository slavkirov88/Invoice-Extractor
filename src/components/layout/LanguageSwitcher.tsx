"use client";

import { useLocale } from "@/lib/i18n/context";
import { Button } from "@/components/ui/button";

export function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();

  return (
    <Button
      variant="ghost"
      size="sm"
      className="text-xs font-medium px-2"
      onClick={() => setLocale(locale === "bg" ? "en" : "bg")}
    >
      {locale === "bg" ? "EN" : "BG"}
    </Button>
  );
}
