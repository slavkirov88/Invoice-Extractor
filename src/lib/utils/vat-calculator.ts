import type { Invoice, VatCalculation } from "@/types";

export function calculateVat(
  invoices: Invoice[],
  taxRate: number = 20
): VatCalculation {
  const totalReceived = invoices
    .filter((inv) => inv.section === "A")
    .reduce((sum, inv) => sum + Number(inv.amount), 0);

  const totalPaid = invoices
    .filter((inv) => inv.section === "B")
    .reduce((sum, inv) => sum + Number(inv.amount), 0);

  const margin = totalReceived - totalPaid;
  const taxBase = (margin / (100 + taxRate)) * 100;
  const vatAmount = (taxBase * taxRate) / 100;

  return {
    totalReceived: Math.round(totalReceived * 100) / 100,
    totalPaid: Math.round(totalPaid * 100) / 100,
    margin: Math.round(margin * 100) / 100,
    taxBase: Math.round(taxBase * 100) / 100,
    taxRate,
    vatAmount: Math.round(vatAmount * 1000) / 1000,
  };
}
