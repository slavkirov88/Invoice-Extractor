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

function VatBlock({
  label,
  invoices,
  taxRate,
}: {
  label?: string;
  invoices: Invoice[];
  taxRate: number;
}) {
  const vat = calculateVat(invoices, taxRate);
  return (
    <div className="space-y-3">
      {label && (
        <p className="text-sm font-semibold text-muted-foreground">{label}</p>
      )}
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">1. Марж в цената</span>
        <span className="font-mono font-medium">{vat.margin.toFixed(2)} €</span>
      </div>
      <Separator />
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">
          2. Данъчна основа (р.1 / (100 + р.3) * 100)
        </span>
        <span className="font-mono font-medium">{vat.taxBase.toFixed(2)} €</span>
      </div>
      <Separator />
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">3. Данъчна ставка</span>
        <span className="font-mono font-medium">{vat.taxRate}%</span>
      </div>
      <Separator />
      <div className="flex items-center justify-between text-lg">
        <span className="font-medium">
          4. Данък добавена стойност (р.2 * р.3 / 100)
        </span>
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
  // Mixed protocol: split by per-invoice vat_rate
  if (protocolType === "mixed") {
    const euInvoices = invoices.filter((i) => (i.vat_rate ?? 20) === 20);
    const nonEuInvoices = invoices.filter((i) => (i.vat_rate ?? 20) === 0);

    return (
      <Card>
        <CardHeader>
          <CardTitle>Раздел В. Изчисляване на ДДС</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <VatBlock label="Услуги в ЕС (20%)" invoices={euInvoices} taxRate={20} />
          <Separator className="my-2" />
          <VatBlock label="Услуги извън ЕС (0%)" invoices={nonEuInvoices} taxRate={0} />
        </CardContent>
      </Card>
    );
  }

  // Standard single-rate calculation (eu = 20%, non_eu = 0%)
  const effectiveTaxRate = protocolType === "non_eu" ? 0 : taxRate;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Раздел В. Изчисляване на ДДС</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <VatBlock invoices={invoices} taxRate={effectiveTaxRate} />
      </CardContent>
    </Card>
  );
}
