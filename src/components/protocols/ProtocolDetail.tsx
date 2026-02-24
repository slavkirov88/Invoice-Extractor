"use client";

import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { VatCalculation } from "./VatCalculation";
import { ExcelExport } from "@/components/export/ExcelExport";
import { PdfExport } from "@/components/export/PdfExport";
import type { Protocol, Invoice } from "@/types";
import Link from "next/link";
import { Plus, Download } from "lucide-react";

interface ProtocolWithInvoices extends Protocol {
  invoices: Invoice[];
}

function InvoiceTable({
  title,
  invoices,
}: {
  title: string;
  invoices: Invoice[];
}) {
  const total = invoices.reduce((sum, inv) => sum + Number(inv.amount), 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {invoices.length === 0 ? (
          <p className="py-4 text-center text-muted-foreground">
            Няма добавени фактури
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">№</TableHead>
                <TableHead>Вид документ</TableHead>
                <TableHead>№ на документа</TableHead>
                <TableHead>Дата на издаване</TableHead>
                <TableHead>ИД на контрагента</TableHead>
                <TableHead className="text-right">Стойност лв.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell>{inv.sequence_number}</TableCell>
                  <TableCell>{inv.document_type}</TableCell>
                  <TableCell className="font-mono">
                    {inv.document_number}
                  </TableCell>
                  <TableCell>
                    {format(new Date(inv.issue_date), "dd.MM.yyyy")}
                  </TableCell>
                  <TableCell>{inv.counterparty_vat_id || "-"}</TableCell>
                  <TableCell className="text-right font-mono">
                    {Number(inv.amount).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="font-bold">
                <TableCell colSpan={5}>
                  Общ размер на{" "}
                  {invoices[0]?.section === "A"
                    ? "получените"
                    : "платените"}{" "}
                  суми
                </TableCell>
                <TableCell className="text-right font-mono">
                  {total.toFixed(2)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

export function ProtocolDetail({
  protocol,
}: {
  protocol: ProtocolWithInvoices;
}) {
  const sectionA = protocol.invoices
    .filter((i) => i.section === "A")
    .sort((a, b) => a.sequence_number - b.sequence_number);
  const sectionB = protocol.invoices
    .filter((i) => i.section === "B")
    .sort((a, b) => a.sequence_number - b.sequence_number);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">
              Протокол №{protocol.protocol_number}
            </h1>
            <Badge
              variant={
                protocol.protocol_type === "commission"
                  ? "secondary"
                  : "default"
              }
            >
              {protocol.protocol_type === "commission"
                ? "Комисионна"
                : "Стандартен"}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            {protocol.supplier_name} ({protocol.supplier_vat_id})
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/invoices/add?protocol=${protocol.id}`}>
              <Plus className="mr-2 h-4 w-4" />
              Добави фактура
            </Link>
          </Button>
          <ExcelExport protocol={protocol} />
          <PdfExport protocol={protocol} />
        </div>
      </div>

      <Card>
        <CardContent className="grid gap-4 pt-6 md:grid-cols-4">
          <div>
            <p className="text-sm text-muted-foreground">Дата на съставяне</p>
            <p className="font-medium">
              {format(new Date(protocol.creation_date), "dd.MM.yyyy")}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">
              Дата на данъчно събитие
            </p>
            <p className="font-medium">
              {format(new Date(protocol.tax_event_date), "dd.MM.yyyy")}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Референция №</p>
            <p className="font-medium">
              {protocol.reference_number || "-"}
            </p>
          </div>
          {protocol.linked_protocol_number && (
            <div>
              <p className="text-sm text-muted-foreground">
                Към протокол №
              </p>
              <p className="font-medium">
                {protocol.linked_protocol_number}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <InvoiceTable
        title="Раздел А. Получени суми по туристическата услуга"
        invoices={sectionA}
      />

      <InvoiceTable
        title="Раздел Б. Платени суми по туристическата услуга"
        invoices={sectionB}
      />

      <VatCalculation
        invoices={protocol.invoices}
        taxRate={protocol.tax_rate}
      />
    </div>
  );
}
