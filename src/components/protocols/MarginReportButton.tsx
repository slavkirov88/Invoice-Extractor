"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { calculateVat } from "@/lib/utils/vat-calculator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import type { Invoice } from "@/types";

export function MarginReportButton() {
  const supabase = createClient();
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [month, setMonth] = useState(
    String(new Date().getMonth() + 1).padStart(2, "0")
  );
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    const y = parseInt(year, 10);
    const m = parseInt(month, 10);
    if (!y || m < 1 || m > 12) {
      toast.error("Въведете валиден период");
      return;
    }

    setLoading(true);
    try {
      // Date range for the selected month
      const startDate = `${y}-${String(m).padStart(2, "0")}-01`;
      const lastDay = new Date(y, m, 0).getDate();
      const endDate = `${y}-${String(m).padStart(2, "0")}-${lastDay}`;

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Не сте влезли в системата");
        return;
      }

      const { data: protocols, error } = await supabase
        .from("protocols")
        .select(
          "protocol_number, destination, tax_rate, tax_event_date, invoices(section, amount)"
        )
        .eq("user_id", user.id)
        .gte("tax_event_date", startDate)
        .lte("tax_event_date", endDate)
        .order("protocol_number", { ascending: true });

      if (error) {
        toast.error("Грешка при зареждане: " + error.message);
        return;
      }

      if (!protocols || protocols.length === 0) {
        toast.error("Няма протоколи за избрания период");
        return;
      }

      const ExcelJS = (await import("exceljs")).default;
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet("Справка марж");

      // Column widths
      ws.columns = [
        { width: 7 },  // A: №
        { width: 16 }, // B: ПРОТОКОЛ №
        { width: 18 }, // C: Дестинация (merged with D)
        { width: 6 },  // D: (merged)
        { width: 16 }, // E: Данъчна Основа
        { width: 8 },  // F: ДДС %
        { width: 14 }, // G: ДДС
        { width: 14 }, // H: Данъчен период
      ];

      // Row 1 — headers
      const headerRow = ws.addRow([
        "№ по ред",
        "ПРОТОКОЛ №",
        "Дестинация",
        null,
        "Данъчна Основа",
        "ДДС %",
        "ДДС",
        "Данъчен период",
      ]);
      headerRow.font = { bold: true };
      headerRow.alignment = { horizontal: "center", vertical: "middle" };
      ws.mergeCells("C1:D1");

      // Row 2 — column numbers (standard BG accounting table)
      const numRow = ws.addRow([1, 2, 3, null, 5, 6, 7, null]);
      numRow.alignment = { horizontal: "center" };
      ws.mergeCells("C2:D2");

      const periodLabel = `${String(m).padStart(2, "0")}.${y}`;

      let totalTaxBase = 0;
      let totalVat = 0;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      protocols.forEach((p: any, idx: number) => {
        const invoices = (p.invoices ?? []) as Invoice[];
        const vat = calculateVat(invoices, p.tax_rate);
        totalTaxBase += vat.taxBase;
        totalVat += vat.vatAmount;

        const dataRow = ws.addRow([
          idx + 1,
          p.protocol_number,
          p.destination ?? "",
          null,
          vat.taxBase,
          vat.taxRate,
          vat.vatAmount,
          periodLabel,
        ]);
        ws.mergeCells(`C${dataRow.number}:D${dataRow.number}`);
        dataRow.getCell(5).numFmt = "#,##0.00";
        dataRow.getCell(7).numFmt = "#,##0.000";
      });

      // Totals row
      const totalsRow = ws.addRow([
        "обща Сума",
        null,
        null,
        null,
        Math.round(totalTaxBase * 100) / 100,
        null,
        Math.round(totalVat * 1000) / 1000,
        null,
      ]);
      totalsRow.font = { bold: true };
      ws.mergeCells(`C${totalsRow.number}:D${totalsRow.number}`);
      totalsRow.getCell(5).numFmt = "#,##0.00";
      totalsRow.getCell(7).numFmt = "#,##0.000";

      // Download
      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `spravka-marzh-${String(m).padStart(2, "0")}-${y}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success(`Справката е изтеглена (${protocols.length} протокола)`);
    } catch (err) {
      toast.error("Неочаквана грешка при генериране");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-end gap-2">
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Месец</Label>
        <Input
          type="number"
          min={1}
          max={12}
          value={month}
          onChange={(e) => setMonth(e.target.value.padStart(2, "0"))}
          className="w-20"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Година</Label>
        <Input
          type="number"
          min={2020}
          max={2099}
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="w-24"
        />
      </div>
      <Button variant="outline" onClick={handleExport} disabled={loading}>
        <FileSpreadsheet className="mr-2 h-4 w-4" />
        {loading ? "Генериране..." : "Справка за марж"}
      </Button>
    </div>
  );
}
