"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import type { Protocol, Invoice } from "@/types";
import { calculateVat } from "@/lib/utils/vat-calculator";

interface ProtocolWithInvoices extends Protocol {
  invoices: Invoice[];
}

export function ExcelExport({
  protocol,
}: {
  protocol: ProtocolWithInvoices;
}) {
  const handleExport = async () => {
    const ExcelJS = (await import("exceljs")).default;
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Протокол");

    // Set column widths
    ws.columns = [
      { width: 4 },
      { width: 12 },
      { width: 18 },
      { width: 6 },
      { width: 20 },
      { width: 16 },
      { width: 6 },
      { width: 24 },
      { width: 14 },
      { width: 4 },
    ];

    // Header
    ws.getCell("B1").value = "ПРОТОКОЛ";
    ws.getCell("B1").font = { bold: true, size: 14 };
    ws.getCell("I1").value = "ДОСТАВЧИК";
    ws.getCell("I1").font = { bold: true };
    ws.getCell("I2").value = protocol.supplier_name;
    ws.getCell("I3").value = "Идентификационен код:";
    ws.getCell("I4").value = protocol.supplier_vat_id;

    ws.getCell("B4").value = "№";
    ws.getCell("C4").value = protocol.protocol_number;
    ws.getCell("C4").font = { bold: true };

    if (protocol.linked_protocol_number) {
      ws.getCell("D4").value = "към протокол №";
      ws.getCell("F4").value = protocol.linked_protocol_number;
    }

    ws.getCell("B6").value = "Дата на съставяне";
    ws.getCell("E6").value = protocol.creation_date;
    ws.getCell("B7").value = "Дата на данъчно събитие";
    ws.getCell("E7").value = protocol.tax_event_date;

    ws.getCell("B9").value =
      "Въз основа на издадените и получени от нас данъчни документи по оказване на обща";
    ws.getCell("B10").value =
      "туристическа услуга с референция №";
    ws.getCell("E10").value = protocol.reference_number || "";
    ws.getCell("B12").value =
      "съставихме настоящия протокол със следните данни:";

    // Section A
    const sectionA = protocol.invoices
      .filter((i) => i.section === "A")
      .sort((a, b) => a.sequence_number - b.sequence_number);

    let row = 14;
    ws.getCell(`B${row}`).value =
      "Раздел А. Получени суми по туристическата услуга :";
    ws.getCell(`B${row}`).font = { bold: true };

    row = 16;
    const headerCells = ["B", "C", "E", "F", "H", "I"];
    const headers = [
      "Пореден №",
      "Вид на документа",
      "№ на документа",
      "Дата на издаване",
      "ИД на контрагента",
      "Стойност EUR",
    ];
    headers.forEach((h, i) => {
      ws.getCell(`${headerCells[i]}${row}`).value = h;
      ws.getCell(`${headerCells[i]}${row}`).font = { bold: true };
    });

    sectionA.forEach((inv, idx) => {
      row = 17 + idx;
      ws.getCell(`B${row}`).value = inv.sequence_number;
      ws.getCell(`C${row}`).value = inv.document_type;
      ws.getCell(`E${row}`).value = inv.document_number;
      ws.getCell(`F${row}`).value = inv.issue_date;
      ws.getCell(`H${row}`).value = inv.counterparty_vat_id || "";
      ws.getCell(`I${row}`).value = Number(inv.amount);
      ws.getCell(`I${row}`).numFmt = "#,##0.00";
    });

    row = 17 + Math.max(sectionA.length, 3);
    const totalA = sectionA.reduce(
      (sum, i) => sum + Number(i.amount),
      0
    );
    ws.getCell(`C${row}`).value = "Общ размер на получените суми";
    ws.getCell(`C${row}`).font = { bold: true };
    ws.getCell(`I${row}`).value = totalA;
    ws.getCell(`I${row}`).numFmt = "#,##0.00";
    ws.getCell(`I${row}`).font = { bold: true };

    // Section B
    const sectionB = protocol.invoices
      .filter((i) => i.section === "B")
      .sort((a, b) => a.sequence_number - b.sequence_number);

    row += 3;
    ws.getCell(`B${row}`).value =
      "Раздел Б.  Платени суми по туристическата услуга";
    ws.getCell(`B${row}`).font = { bold: true };

    row += 2;
    headers.forEach((h, i) => {
      ws.getCell(`${headerCells[i]}${row}`).value = h;
      ws.getCell(`${headerCells[i]}${row}`).font = { bold: true };
    });

    sectionB.forEach((inv, idx) => {
      const r = row + 1 + idx;
      ws.getCell(`B${r}`).value = inv.sequence_number;
      ws.getCell(`C${r}`).value = inv.document_type;
      ws.getCell(`E${r}`).value = inv.document_number;
      ws.getCell(`F${r}`).value = inv.issue_date;
      ws.getCell(`H${r}`).value = inv.counterparty_vat_id || "";
      ws.getCell(`I${r}`).value = Number(inv.amount);
      ws.getCell(`I${r}`).numFmt = "#,##0.00";
    });

    row = row + 1 + Math.max(sectionB.length, 3) + 1;
    const totalB = sectionB.reduce(
      (sum, i) => sum + Number(i.amount),
      0
    );
    ws.getCell(`C${row}`).value = "Общ размер на платените суми";
    ws.getCell(`C${row}`).font = { bold: true };
    ws.getCell(`I${row}`).value = totalB;
    ws.getCell(`I${row}`).numFmt = "#,##0.00";
    ws.getCell(`I${row}`).font = { bold: true };

    // Section C - VAT
    const vat = calculateVat(protocol.invoices, protocol.tax_rate);

    row += 2;
    ws.getCell(`B${row}`).value = "Раздел В. Изчисляване на ДДС";
    ws.getCell(`B${row}`).font = { bold: true };

    row += 2;
    ws.getCell(`B${row}`).value = "1. Марж в цената";
    ws.getCell(`I${row}`).value = vat.margin;
    ws.getCell(`I${row}`).numFmt = "#,##0.00";
    row++;
    ws.getCell(`B${row}`).value =
      "2. Данъчна основа:  р. 1 / (100 + р. 3) *100";
    ws.getCell(`I${row}`).value = vat.taxBase;
    ws.getCell(`I${row}`).numFmt = "#,##0.00";
    row++;
    ws.getCell(`B${row}`).value = "3. Данъчна ставка %";
    ws.getCell(`I${row}`).value = vat.taxRate;
    row++;
    ws.getCell(`B${row}`).value =
      "4. Данък добавена стойност (р. 2 * р. 3) / 100";
    ws.getCell(`I${row}`).value = vat.vatAmount;
    ws.getCell(`I${row}`).numFmt = "#,##0.000";
    ws.getCell(`I${row}`).font = { bold: true };

    row += 3;
    ws.getCell(`B${row}`).value = "чл.140, ал.1 от ЗДДС";
    ws.getCell(`G${row}`).value = "Съставил:";
    ws.getCell(`G${row}`).font = { bold: true };
    ws.getCell(`H${row}`).value = protocol.compiled_by || "";
    row++;
    ws.getCell(`G${row}`).value = "Одобрил:";
    ws.getCell(`G${row}`).font = { bold: true };
    ws.getCell(`H${row}`).value = protocol.approved_by || "";

    // Download
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Протокол_${protocol.protocol_number}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Button variant="outline" onClick={handleExport}>
      <Download className="mr-2 h-4 w-4" />
      Excel
    </Button>
  );
}
