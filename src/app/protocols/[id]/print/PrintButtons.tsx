"use client";

import { useLocale } from "@/lib/i18n/context";

export default function PrintButtons() {
  const { t } = useLocale();
  return (
    <div
      style={{
        position: "fixed",
        top: 12,
        right: 12,
        display: "flex",
        gap: 8,
        zIndex: 999,
      }}
      className="no-print"
    >
      <button
        className="btn btn-primary"
        onClick={() => window.print()}
      >
        {t.print.printButton}
      </button>
      <button className="btn" onClick={() => window.close()}>
        {t.print.closeButton}
      </button>
    </div>
  );
}
