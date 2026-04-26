"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { Invoice } from "@/types";
import { calculateVat } from "@/lib/utils/vat-calculator";
import { useLocale } from "@/lib/i18n/context";
import type { Dictionary } from "@/lib/i18n/types";

function VatBlock({
  label,
  invoices,
  taxRate,
  t,
}: {
  label?: string;
  invoices: Invoice[];
  taxRate: number;
  t: Dictionary;
}) {
  const vat = calculateVat(invoices, taxRate);
  return (
    <div className="space-y-3">
      {label && (
        <p className="text-sm font-semibold text-muted-foreground">{label}</p>
      )}
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">{t.vat.margin}</span>
        <span className="font-mono font-medium">{vat.margin.toFixed(2)} €</span>
      </div>
      <Separator />
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">{t.vat.taxBase}</span>
        <span className="font-mono font-medium">{vat.taxBase.toFixed(2)} €</span>
      </div>
      <Separator />
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">{t.vat.taxRate}</span>
        <span className="font-mono font-medium">{vat.taxRate}%</span>
      </div>
      <Separator />
      <div className="flex items-center justify-between text-lg">
        <span className="font-medium">{t.vat.vatAmount}</span>
        <span className="font-mono font-bold text-primary">
          {vat.vatAmount.toFixed(3)} €
        </span>
      </div>
    </div>
  );
}

export function VatCalculation({
  invoices,
  taxRate,
  protocolType,
}: {
  invoices: Invoice[];
  taxRate: number;
  protocolType?: string;
}) {
  const { t } = useLocale();

  if (protocolType === "mixed") {
    const euInvoices = invoices.filter((i) => (i.vat_rate ?? 20) === 20);
    const nonEuInvoices = invoices.filter((i) => (i.vat_rate ?? 20) === 0);

    return (
      <Card>
        <CardHeader>
          <CardTitle>{t.vat.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <VatBlock label={t.vat.servicesEU} invoices={euInvoices} taxRate={20} t={t} />
          <Separator className="my-2" />
          <VatBlock label={t.vat.servicesNonEU} invoices={nonEuInvoices} taxRate={0} t={t} />
        </CardContent>
      </Card>
    );
  }

  const effectiveTaxRate = protocolType === "non_eu" ? 0 : taxRate;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.vat.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <VatBlock invoices={invoices} taxRate={effectiveTaxRate} t={t} />
      </CardContent>
    </Card>
  );
}
