"use client";

import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import type { Protocol, Invoice } from "@/types";
import { calculateVat } from "@/lib/utils/vat-calculator";
import { format } from "date-fns";

interface ProtocolWithInvoices extends Protocol {
  invoices: Invoice[];
}

export function PdfExport({
  protocol,
}: {
  protocol: ProtocolWithInvoices;
}) {
  const handleExport = async () => {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;

    const doc = new jsPDF();

    // Title
    doc.setFontSize(16);
    doc.text(`PROTOKOL No ${protocol.protocol_number}`, 14, 20);

    doc.setFontSize(10);
    doc.text(
      `Dostavchik: ${protocol.supplier_name} (${protocol.supplier_vat_id})`,
      14,
      30
    );
    doc.text(
      `Data na sastavyane: ${format(new Date(protocol.creation_date), "dd.MM.yyyy")}`,
      14,
      36
    );
    doc.text(
      `Data na danachno sabitie: ${format(new Date(protocol.tax_event_date), "dd.MM.yyyy")}`,
      14,
      42
    );

    // Section A
    const sectionA = protocol.invoices
      .filter((i) => i.section === "A")
      .sort((a, b) => a.sequence_number - b.sequence_number);
    const totalA = sectionA.reduce(
      (sum, i) => sum + Number(i.amount),
      0
    );

    doc.setFontSize(12);
    doc.text("Razdel A. Polucheni sumi", 14, 54);

    autoTable(doc, {
      startY: 58,
      head: [["No", "Dokument", "No dok.", "Data", "Stoynost EUR"]],
      body: [
        ...sectionA.map((inv) => [
          inv.sequence_number,
          inv.document_type,
          inv.document_number,
          format(new Date(inv.issue_date), "dd.MM.yyyy"),
          Number(inv.amount).toFixed(2),
        ]),
        ["", "", "", "TOTAL:", totalA.toFixed(2)],
      ],
      theme: "grid",
    });

    // Section B
    const sectionB = protocol.invoices
      .filter((i) => i.section === "B")
      .sort((a, b) => a.sequence_number - b.sequence_number);
    const totalB = sectionB.reduce(
      (sum, i) => sum + Number(i.amount),
      0
    );

    const finalY = (doc as unknown as { lastAutoTable: { finalY: number } })
      .lastAutoTable.finalY;

    doc.text("Razdel B. Plateni sumi", 14, finalY + 10);

    autoTable(doc, {
      startY: finalY + 14,
      head: [["No", "Dokument", "No dok.", "Data", "Stoynost EUR"]],
      body: [
        ...sectionB.map((inv) => [
          inv.sequence_number,
          inv.document_type,
          inv.document_number,
          format(new Date(inv.issue_date), "dd.MM.yyyy"),
          Number(inv.amount).toFixed(2),
        ]),
        ["", "", "", "TOTAL:", totalB.toFixed(2)],
      ],
      theme: "grid",
    });

    // Section C - VAT
    const vat = calculateVat(protocol.invoices, protocol.tax_rate);
    const finalY2 = (doc as unknown as { lastAutoTable: { finalY: number } })
      .lastAutoTable.finalY;

    doc.text("Razdel V. DDS Izchislenie", 14, finalY2 + 10);
    doc.setFontSize(10);
    doc.text(`1. Marzh: ${vat.margin.toFixed(2)} EUR`, 14, finalY2 + 18);
    doc.text(
      `2. Danachna osnova: ${vat.taxBase.toFixed(2)} EUR`,
      14,
      finalY2 + 24
    );
    doc.text(`3. Danachna stavka: ${vat.taxRate}%`, 14, finalY2 + 30);
    doc.text(
      `4. DDS: ${vat.vatAmount.toFixed(3)} EUR`,
      14,
      finalY2 + 36
    );

    doc.save(`Protokol_${protocol.protocol_number}.pdf`);
  };

  return (
    <Button variant="outline" onClick={handleExport}>
      <FileText className="mr-2 h-4 w-4" />
      PDF
    </Button>
  );
}
