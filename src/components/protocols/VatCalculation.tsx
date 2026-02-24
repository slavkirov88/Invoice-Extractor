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

export function VatCalculation({
  invoices,
  taxRate,
}: {
  invoices: Invoice[];
  taxRate: number;
}) {
  const vat = calculateVat(invoices, taxRate);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Раздел В. Изчисляване на ДДС</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">
            1. Марж в цената
          </span>
          <span className="font-mono font-medium">
            {vat.margin.toFixed(2)} лв.
          </span>
        </div>
        <Separator />
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">
            2. Данъчна основа (р.1 / (100 + р.3) * 100)
          </span>
          <span className="font-mono font-medium">
            {vat.taxBase.toFixed(2)} лв.
          </span>
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
            {vat.vatAmount.toFixed(3)} лв.
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
