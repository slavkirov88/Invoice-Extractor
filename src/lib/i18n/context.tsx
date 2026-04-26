"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { bg } from "./dictionaries/bg";
import { en } from "./dictionaries/en";
import type { Dictionary } from "./types";
import type { Locale } from "./index";
import { bg as dateFnsBg } from "date-fns/locale/bg";
import { enUS as dateFnsEnUS } from "date-fns/locale/en-US";

interface LocaleContextValue {
  t: Dictionary;
  locale: Locale;
  setLocale: (locale: Locale) => void;
  dateLocale: typeof dateFnsBg;
}

const dictionaries: Record<Locale, Dictionary> = { bg, en };
const dateLocales: Record<Locale, typeof dateFnsBg> = {
  bg: dateFnsBg,
  en: dateFnsEnUS,
};

const LocaleContext = createContext<LocaleContextValue>({
  t: bg,
  locale: "bg",
  setLocale: () => {},
  dateLocale: dateFnsBg,
});

export function LocaleProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const router = useRouter();

  const setLocale = useCallback(
    (newLocale: Locale) => {
      document.cookie = `locale=${newLocale};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`;
      setLocaleState(newLocale);
      router.refresh();
    },
    [router]
  );

  return (
    <LocaleContext.Provider
      value={{
        t: dictionaries[locale],
        locale,
        setLocale,
        dateLocale: dateLocales[locale],
      }}
    >
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}
