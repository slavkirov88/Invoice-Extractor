"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Trash2, Plus } from "lucide-react";
import { format } from "date-fns";
import type { Invoice } from "@/types";

export interface InvoiceDraft {
  id?: string;           // undefined = new row not yet saved
  _clientId: string;     // stable key for React rendering
  section: "A" | "B";
  sequence_number: number;
  document_type: string;
  document_number: string;
  issue_date: string;
  counterparty_vat_id: string;
  amount: string;        // string for input binding, parsed on save
  vat_rate: string;      // string for input binding
  _deleted?: boolean;    // mark for deletion on save
}

interface EditableInvoiceTableProps {
  title: string;
  section: "A" | "B";
  invoices: Invoice[];
  isEditing: boolean;
  showVatRate?: boolean;
  drafts: InvoiceDraft[];
  onDraftsChange: (drafts: InvoiceDraft[]) => void;
}

export function EditableInvoiceTable({
  title,
  section,
  invoices,
  isEditing,
  showVatRate = false,
  drafts,
  onDraftsChange,
}: EditableInvoiceTableProps) {
  void invoices; // accepted for reference/type information; parent converts to drafts
  const visibleDrafts = drafts.filter((d) => !d._deleted);
  const total = visibleDrafts.reduce(
    (sum, d) => sum + (parseFloat(d.amount) || 0),
    0
  );
  const colSpan = showVatRate ? 6 : 5;

  function updateDraft(visibleIndex: number, field: keyof InvoiceDraft, value: string) {
    const next = [...drafts];
    // Find actual index in full drafts array (including _deleted ones)
    let seen = 0;
    let allIndex = -1;
    for (let i = 0; i < drafts.length; i++) {
      if (!drafts[i]._deleted) {
        if (seen === visibleIndex) {
          allIndex = i;
          break;
        }
        seen++;
      }
    }
    if (allIndex === -1) return;
    next[allIndex] = { ...next[allIndex], [field]: value };
    onDraftsChange(next);
  }

  function deleteDraft(visibleIndex: number) {
    const next = [...drafts];
    let seen = 0;
    let allIndex = -1;
    for (let i = 0; i < drafts.length; i++) {
      if (!drafts[i]._deleted) {
        if (seen === visibleIndex) {
          allIndex = i;
          break;
        }
        seen++;
      }
    }
    if (allIndex === -1) return;
    if (next[allIndex].id) {
      // Existing invoice — mark for deletion
      next[allIndex] = { ...next[allIndex], _deleted: true };
    } else {
      // New unsaved row — remove entirely
      next.splice(allIndex, 1);
    }
    onDraftsChange(next);
  }

  function addRow() {
    const today = new Date().toISOString().split("T")[0];
    onDraftsChange([
      ...drafts,
      {
        _clientId: crypto.randomUUID(),
        section,
        sequence_number: visibleDrafts.length + 1,
        document_type: "Фактура",
        document_number: "",
        issue_date: today,
        counterparty_vat_id: "",
        amount: "",
        vat_rate: "",
      },
    ]);
  }

  if (!isEditing) {
    // Read-only view
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          {visibleDrafts.length === 0 ? (
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
                  {showVatRate && (
                    <TableHead className="text-center">ДДС ставка</TableHead>
                  )}
                  <TableHead className="text-right">Стойност EUR</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleDrafts.map((d, i) => (
                  <TableRow key={d._clientId}>
                    <TableCell>{d.sequence_number}</TableCell>
                    <TableCell>{d.document_type}</TableCell>
                    <TableCell className="font-mono">
                      {d.document_number}
                    </TableCell>
                    <TableCell>
                      {d.issue_date
                        ? format(new Date(d.issue_date), "dd.MM.yyyy")
                        : "-"}
                    </TableCell>
                    <TableCell>{d.counterparty_vat_id || "-"}</TableCell>
                    {showVatRate && (
                      <TableCell className="text-center">
                        {d.vat_rate ? `${d.vat_rate}%` : "-"}
                      </TableCell>
                    )}
                    <TableCell className="text-right font-mono">
                      {parseFloat(d.amount || "0").toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-bold">
                  <TableCell colSpan={colSpan}>
                    Общ размер на{" "}
                    {section === "A" ? "получените" : "платените"} суми
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

  // Edit mode
  return (
    <Card className="border-violet-500/30">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">№</TableHead>
              <TableHead>Вид</TableHead>
              <TableHead>№ документ</TableHead>
              <TableHead>Дата</TableHead>
              <TableHead>ИД контрагент</TableHead>
              {showVatRate && <TableHead className="w-20">ДДС %</TableHead>}
              <TableHead className="text-right w-28">Стойност</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleDrafts.map((d, i) => (
              <TableRow key={d._clientId}>
                <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                <TableCell>
                  <Input
                    value={d.document_type}
                    onChange={(e) =>
                      updateDraft(i, "document_type", e.target.value)
                    }
                    className="h-8 min-w-[90px]"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={d.document_number}
                    onChange={(e) =>
                      updateDraft(i, "document_number", e.target.value)
                    }
                    className="h-8 font-mono min-w-[100px]"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="date"
                    value={d.issue_date}
                    onChange={(e) =>
                      updateDraft(i, "issue_date", e.target.value)
                    }
                    className="h-8 min-w-[130px]"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={d.counterparty_vat_id}
                    onChange={(e) =>
                      updateDraft(i, "counterparty_vat_id", e.target.value)
                    }
                    className="h-8 min-w-[100px]"
                  />
                </TableCell>
                {showVatRate && (
                  <TableCell>
                    <Input
                      type="number"
                      value={d.vat_rate}
                      onChange={(e) =>
                        updateDraft(i, "vat_rate", e.target.value)
                      }
                      className="h-8 w-16"
                    />
                  </TableCell>
                )}
                <TableCell>
                  <Input
                    type="number"
                    value={d.amount}
                    onChange={(e) =>
                      updateDraft(i, "amount", e.target.value)
                    }
                    className="h-8 text-right font-mono min-w-[90px]"
                  />
                </TableCell>
                <TableCell>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => deleteDraft(i)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addRow}
          className="w-full"
        >
          <Plus className="mr-2 h-4 w-4" />
          Добави ред
        </Button>
      </CardContent>
    </Card>
  );
}
