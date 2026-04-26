"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import type { Protocol, Invoice } from "@/types";
import { calculateVat } from "@/lib/utils/vat-calculator";
import { useLocale } from "@/lib/i18n/context";

interface ProtocolWithInvoices extends Protocol {
  invoices: Invoice[];
}

export function ExcelExport({
  protocol,
}: {
  protocol: ProtocolWithInvoices;
}) {
  const { t } = useLocale();
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
    ws.getCell("B1").value = t.export.protocol;
    ws.getCell("B1").font = { bold: true, size: 14 };
    ws.getCell("I1").value = t.export.supplier;
    ws.getCell("I1").font = { bold: true };
    ws.getCell("I2").value = protocol.supplier_name;
    ws.getCell("I3").value = t.export.identificationCode;
    ws.getCell("I4").value = protocol.supplier_vat_id;

    ws.getCell("B4").value = t.export.number;
    ws.getCell("C4").value = protocol.protocol_number;
    ws.getCell("C4").font = { bold: true };

    if (protocol.linked_protocol_number) {
      ws.getCell("D4").value = t.export.toProtocolNumber;
      ws.getCell("F4").value = protocol.linked_protocol_number;
    }

    ws.getCell("B6").value = t.export.creationDate;
    ws.getCell("E6").value = protocol.creation_date;
    ws.getCell("B7").value = t.export.taxEventDate;
    ws.getCell("E7").value = protocol.tax_event_date;

    ws.getCell("B9").value = t.export.basedOnDocuments;
    ws.getCell("B10").value = t.export.touristService;
    ws.getCell("E10").value = protocol.reference_number || "";
    ws.getCell("B12").value = t.export.weComposedProtocol;

    // Section A
    const sectionA = protocol.invoices
      .filter((i) => i.section === "A")
      .sort((a, b) => a.sequence_number - b.sequence_number);

    let row = 14;
    ws.getCell(`B${row}`).value = t.export.sectionATitle;
    ws.getCell(`B${row}`).font = { bold: true };

    row = 16;
    const headerCells = ["B", "C", "E", "F", "H", "I"];
    const headers = [
      t.export.seqNumber,
      t.export.documentType,
      t.export.documentNumber,
      t.export.issueDate,
      t.export.counterpartyId,
      t.export.amountEUR,
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
    ws.getCell(`C${row}`).value = t.export.totalReceived;
    ws.getCell(`C${row}`).font = { bold: true };
    ws.getCell(`I${row}`).value = totalA;
    ws.getCell(`I${row}`).numFmt = "#,##0.00";
    ws.getCell(`I${row}`).font = { bold: true };

    // Section B
    const sectionB = protocol.invoices
      .filter((i) => i.section === "B")
      .sort((a, b) => a.sequence_number - b.sequence_number);

    row += 3;
    ws.getCell(`B${row}`).value = t.export.sectionBTitle;
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
    ws.getCell(`C${row}`).value = t.export.totalPaid;
    ws.getCell(`C${row}`).font = { bold: true };
    ws.getCell(`I${row}`).value = totalB;
    ws.getCell(`I${row}`).numFmt = "#,##0.00";
    ws.getCell(`I${row}`).font = { bold: true };

    // Commission section (only for commission protocols)
    if (protocol.protocol_type === "commission") {
      const sectionCommission = protocol.invoices
        .filter((i) => i.section === "commission")
        .sort((a, b) => a.sequence_number - b.sequence_number);

      row += 3;
      ws.getCell(`B${row}`).value = t.export.commissionTitle;
      ws.getCell(`B${row}`).font = { bold: true };

      row += 2;
      const commHeaders = [t.export.seqNumber, t.export.commissionInvoiceNumber, t.export.commissionDate, t.export.commissionAmountEUR];
      const commCells = ["B", "C", "F", "I"];
      commHeaders.forEach((h, i) => {
        ws.getCell(`${commCells[i]}${row}`).value = h;
        ws.getCell(`${commCells[i]}${row}`).font = { bold: true };
      });

      sectionCommission.forEach((inv, idx) => {
        const r = row + 1 + idx;
        ws.getCell(`B${r}`).value = inv.sequence_number;
        ws.getCell(`C${r}`).value = inv.document_number;
        ws.getCell(`F${r}`).value = inv.issue_date;
        ws.getCell(`I${r}`).value = Number(inv.amount);
        ws.getCell(`I${r}`).numFmt = "#,##0.00";
        // Green background
        ["B", "C", "F", "I"].forEach((col) => {
          ws.getCell(`${col}${r}`).fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFD5F5E3" },
          };
        });
      });

      const totalComm = sectionCommission.reduce((sum, i) => sum + Number(i.amount), 0);
      row = row + 1 + Math.max(sectionCommission.length, 1) + 1;
      ws.getCell(`C${row}`).value = t.export.totalCommission;
      ws.getCell(`C${row}`).font = { bold: true };
      ws.getCell(`I${row}`).value = totalComm;
      ws.getCell(`I${row}`).numFmt = "#,##0.00";
      ws.getCell(`I${row}`).font = { bold: true };
    }

    // Section C - VAT
    const vat = calculateVat(protocol.invoices, protocol.tax_rate);

    row += 2;
    ws.getCell(`B${row}`).value = t.export.sectionCTitle;
    ws.getCell(`B${row}`).font = { bold: true };

    row += 2;
    ws.getCell(`B${row}`).value = t.export.margin;
    ws.getCell(`I${row}`).value = vat.margin;
    ws.getCell(`I${row}`).numFmt = "#,##0.00";
    row++;
    ws.getCell(`B${row}`).value = t.export.taxBase;
    ws.getCell(`I${row}`).value = vat.taxBase;
    ws.getCell(`I${row}`).numFmt = "#,##0.00";
    row++;
    ws.getCell(`B${row}`).value = t.export.taxRatePercent;
    ws.getCell(`I${row}`).value = vat.taxRate;
    row++;
    ws.getCell(`B${row}`).value = t.export.vatAmount;
    ws.getCell(`I${row}`).value = vat.vatAmount;
    ws.getCell(`I${row}`).numFmt = "#,##0.000";
    ws.getCell(`I${row}`).font = { bold: true };

    row += 3;
    ws.getCell(`B${row}`).value = t.export.legalArticle;
    ws.getCell(`G${row}`).value = t.export.createdBy;
    ws.getCell(`G${row}`).font = { bold: true };
    ws.getCell(`H${row}`).value = protocol.compiled_by || "";
    row++;
    ws.getCell(`G${row}`).value = t.export.approvedBy;
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
