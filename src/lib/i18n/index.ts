import { cookies } from "next/headers";
import { bg } from "./dictionaries/bg";
import { en } from "./dictionaries/en";
import type { Dictionary } from "./types";

export type Locale = "bg" | "en";

const dictionaries: Record<Locale, Dictionary> = { bg, en };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? dictionaries.bg;
}

export async function getLocaleFromCookies(): Promise<Locale> {
  const cookieStore = await cookies();
  const locale = cookieStore.get("locale")?.value;
  if (locale === "en" || locale === "bg") return locale;
  return "bg";
}

export type { Dictionary };
