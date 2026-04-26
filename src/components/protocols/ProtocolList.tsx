"use client";

import Link from "next/link";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Protocol } from "@/types";
import { useLocale } from "@/lib/i18n/context";

interface ProtocolWithInvoices extends Omit<Protocol, "invoices"> {
  invoices: { id: string; section: string; amount: number }[];
}

export function ProtocolList({
  protocols,
}: {
  protocols: ProtocolWithInvoices[];
}) {
  const { t } = useLocale();

  if (protocols.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border p-12 text-center">
        <p className="text-lg text-muted-foreground">
          {t.protocols.noProtocols}
        </p>
        <p className="text-sm text-muted-foreground">
          {t.protocols.noProtocolsHint}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-24">{t.protocols.number}</TableHead>
            <TableHead>{t.protocols.type}</TableHead>
            <TableHead>{t.protocols.supplier}</TableHead>
            <TableHead>{t.protocols.date}</TableHead>
            <TableHead className="text-right">{t.protocols.received}</TableHead>
            <TableHead className="text-right">{t.protocols.paid}</TableHead>
            <TableHead className="text-right">{t.protocols.invoiceCount}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {protocols.map((protocol) => {
            const received = protocol.invoices
              .filter((i) => i.section === "A")
              .reduce((sum, i) => sum + Number(i.amount), 0);
            const paid = protocol.invoices
              .filter((i) => i.section === "B")
              .reduce((sum, i) => sum + Number(i.amount), 0);

            return (
              <TableRow key={protocol.id}>
                <TableCell>
                  <Link
                    href={`/protocols/${protocol.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {protocol.protocol_number}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      protocol.protocol_type === "non_eu"
                        ? "secondary"
                        : protocol.protocol_type === "mixed"
                        ? "outline"
                        : "default"
                    }
                  >
                    {protocol.protocol_type === "eu"
                      ? t.protocols.typeEU
                      : protocol.protocol_type === "non_eu"
                      ? t.protocols.typeNonEU
                      : protocol.protocol_type === "mixed"
                      ? t.protocols.typeMixed
                      : protocol.protocol_type === "commission"
                      ? t.protocols.typeCommission
                      : t.protocols.typeStandard}
                  </Badge>
                </TableCell>
                <TableCell>{protocol.supplier_name}</TableCell>
                <TableCell>
                  {format(new Date(protocol.creation_date), "dd.MM.yyyy")}
                </TableCell>
                <TableCell className="text-right">
                  {received.toFixed(2)} €
                </TableCell>
                <TableCell className="text-right">
                  {paid.toFixed(2)} €
                </TableCell>
                <TableCell className="text-right">
                  {protocol.invoices.length}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
