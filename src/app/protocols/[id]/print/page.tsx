export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { calculateVat } from "@/lib/utils/vat-calculator";
import { format } from "date-fns";
import { getLocaleFromCookies, getDictionary } from "@/lib/i18n";
import PrintButtons from "./PrintButtons";

export default async function ProtocolPrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: protocol, error } = await supabase
    .from("protocols")
    .select("*, invoices(*)")
    .eq("id", id)
    .single();

  if (error || !protocol) notFound();

  const locale = await getLocaleFromCookies();
  const t = getDictionary(locale);

  const sectionA = protocol.invoices
    .filter((i: { section: string }) => i.section === "A")
    .sort(
      (a: { sequence_number: number }, b: { sequence_number: number }) =>
        a.sequence_number - b.sequence_number
    );

  const sectionB = protocol.invoices
    .filter((i: { section: string }) => i.section === "B")
    .sort(
      (a: { sequence_number: number }, b: { sequence_number: number }) =>
        a.sequence_number - b.sequence_number
    );

  const totalA = sectionA.reduce(
    (sum: number, i: { amount: number }) => sum + Number(i.amount),
    0
  );
  const totalB = sectionB.reduce(
    (sum: number, i: { amount: number }) => sum + Number(i.amount),
    0
  );

  const sectionCommission = protocol.invoices
    .filter((i: { section: string }) => i.section === "commission")
    .sort(
      (a: { sequence_number: number }, b: { sequence_number: number }) =>
        a.sequence_number - b.sequence_number
    );

  const totalCommission = sectionCommission.reduce(
    (sum: number, i: { amount: number }) => sum + Number(i.amount),
    0
  );

  const vat = calculateVat(protocol.invoices, protocol.tax_rate);

  const protocolTypeLabel =
    protocol.protocol_type === "eu"
      ? t.protocols.typeEURate
      : protocol.protocol_type === "non_eu"
      ? t.protocols.typeNonEURate
      : protocol.protocol_type === "mixed"
      ? t.protocols.typeMixed
      : protocol.protocol_type === "commission"
      ? t.protocols.typeCommission
      : t.protocols.typeStandard;

  const isMixed = protocol.protocol_type === "mixed";

  const legalArticle =
    protocol.tax_rate === 0
      ? t.print.legalArticleStandard
      : t.print.legalArticleCommission;

  return (
    <>
      <style>{`
        body {
          background: white !important;
          color: black !important;
          font-family: Arial, sans-serif !important;
          font-size: 11px !important;
        }
        .print-page {
          max-width: 210mm;
          margin: 0 auto;
          padding: 15mm;
          background: white;
          color: black;
          font-family: Arial, sans-serif;
          font-size: 11px;
        }
        .print-page * {
          color: black;
        }
        .protocol-header {
          text-align: center;
          margin-bottom: 10px;
        }
        .protocol-header h1 {
          font-size: 15px;
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: black;
        }
        .protocol-header .subtitle {
          font-size: 9px;
          color: #444;
          margin-top: 2px;
        }
        .meta-box {
          border: 2px solid #000;
          margin-bottom: 12px;
        }
        .meta-box-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          border-bottom: 1px solid #000;
        }
        .meta-box-row:last-child { border-bottom: none; }
        .meta-cell {
          padding: 4px 8px;
          font-size: 10px;
          border-right: 1px solid #000;
        }
        .meta-cell:last-child { border-right: none; }
        .meta-label { color: #555; margin-right: 4px; }
        .section-wrap {
          border: 2px solid #000;
          margin-bottom: 12px;
        }
        .section-title {
          background: #d9d9d9;
          border-bottom: 2px solid #000;
          padding: 4px 8px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        .print-page table {
          width: 100%;
          border-collapse: collapse;
          font-size: 10px;
        }
        .print-page th {
          background: #ebebeb;
          border-right: 1px solid #000;
          border-bottom: 2px solid #000;
          padding: 4px 6px;
          text-align: left;
          font-weight: 700;
        }
        .print-page th:last-child { border-right: none; }
        .print-page td {
          border-right: 1px solid #888;
          border-bottom: 1px solid #888;
          padding: 4px 6px;
        }
        .print-page td:last-child { border-right: none; }
        .print-page tr:last-child td { border-bottom: none; }
        .total-row td {
          font-weight: 700 !important;
          background: #f0f0f0 !important;
          border-top: 2px solid #000 !important;
          border-bottom: none !important;
        }
        .section-c-table {
          width: auto !important;
          min-width: 340px;
        }
        .section-c-table td {
          border: 1px solid #888 !important;
          padding: 4px 8px;
        }
        .section-c-table tr:last-child td {
          border-bottom: 1px solid #888 !important;
        }
        .section-c-table .total-row td {
          border-top: 2px solid #000 !important;
          font-weight: 700 !important;
          background: #f0f0f0 !important;
        }
        .signatures {
          margin-top: 32px;
          display: flex;
          justify-content: flex-end;
          gap: 48px;
        }
        .signature-block { text-align: center; font-size: 10px; }
        .signature-line {
          border-bottom: 1.5px solid #333;
          width: 130px;
          margin: 28px auto 5px;
        }
        .btn {
          padding: 6px 16px;
          border-radius: 6px;
          border: 1px solid #ccc;
          cursor: pointer;
          font-size: 12px;
          background: white;
        }
        .btn-primary {
          background: #7c3aed !important;
          color: white !important;
          border-color: #7c3aed !important;
        }
        @media print {
          .no-print { display: none !important; }
          body { font-size: 10px !important; }
          .print-page { padding: 10mm; }
          nav, header, footer, aside, [data-sidebar] { display: none !important; }
        }
      `}</style>

      <PrintButtons />

      <div className="print-page">
        {/* Header */}
        <div className="protocol-header">
          <h1>{t.print.protocolTitle} №{protocol.protocol_number}</h1>
          <div className="subtitle">
            {protocolTypeLabel} &nbsp;·&nbsp; {legalArticle}
          </div>
        </div>

        {/* Meta box */}
        <div className="meta-box">
          <div className="meta-box-row">
            <div className="meta-cell">
              <span className="meta-label">{t.print.supplierLabel}:</span>
              <strong>{protocol.supplier_name}</strong>
            </div>
            <div className="meta-cell">
              <span className="meta-label">{t.print.vatIdLabel}:</span>
              {protocol.supplier_vat_id}
            </div>
          </div>
          <div className="meta-box-row">
            <div className="meta-cell">
              <span className="meta-label">{t.print.creationDateLabel}:</span>
              {format(new Date(protocol.creation_date), "dd.MM.yyyy")}
            </div>
            <div className="meta-cell">
              <span className="meta-label">{t.print.taxEventDateLabel}:</span>
              {format(new Date(protocol.tax_event_date), "dd.MM.yyyy")}
            </div>
          </div>
          {(protocol.reference_number || protocol.destination || protocol.linked_protocol_number) && (
            <div className="meta-box-row">
              {protocol.reference_number ? (
                <div className="meta-cell">
                  <span className="meta-label">{t.print.referenceLabel}:</span>
                  {protocol.reference_number}
                </div>
              ) : <div className="meta-cell" />}
              {protocol.destination ? (
                <div className="meta-cell">
                  <span className="meta-label">{t.print.destinationLabel}:</span>
                  {protocol.destination}
                </div>
              ) : protocol.linked_protocol_number ? (
                <div className="meta-cell">
                  <span className="meta-label">{t.print.linkedProtocolLabel}:</span>
                  {protocol.linked_protocol_number}
                </div>
              ) : <div className="meta-cell" />}
            </div>
          )}
        </div>

        {/* Section A */}
        <div className="section-wrap">
          <div className="section-title">{t.print.sectionATitle}</div>
          <table>
            <thead>
              <tr>
                <th style={{ width: 28 }}>№</th>
                <th>{t.print.documentType}</th>
                <th>{t.print.documentNumber}</th>
                <th>{t.print.issueDate}</th>
                <th>{t.print.counterpartyId}</th>
                {isMixed && <th style={{ width: 55 }}>{t.print.vatPercent}</th>}
                <th style={{ width: 85, textAlign: "right" }}>{t.print.amountEUR}</th>
              </tr>
            </thead>
            <tbody>
              {sectionA.map(
                (inv: {
                  id: string;
                  sequence_number: number;
                  document_type: string;
                  document_number: string;
                  issue_date: string;
                  counterparty_vat_id: string | null;
                  vat_rate: number | null;
                  amount: number;
                }) => (
                  <tr key={inv.id}>
                    <td>{inv.sequence_number}</td>
                    <td>{inv.document_type}</td>
                    <td>{inv.document_number}</td>
                    <td>{format(new Date(inv.issue_date), "dd.MM.yyyy")}</td>
                    <td>{inv.counterparty_vat_id || "—"}</td>
                    {isMixed && (
                      <td style={{ textAlign: "center" }}>
                        {inv.vat_rate != null ? `${inv.vat_rate}%` : "—"}
                      </td>
                    )}
                    <td style={{ textAlign: "right" }}>
                      {Number(inv.amount).toFixed(2)}
                    </td>
                  </tr>
                )
              )}
              <tr className="total-row">
                <td colSpan={isMixed ? 6 : 5}>
                  {t.print.totalReceived}
                </td>
                <td style={{ textAlign: "right" }}>{totalA.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section B */}
        <div className="section-wrap">
          <div className="section-title">{t.print.sectionBTitle}</div>
          <table>
            <thead>
              <tr>
                <th style={{ width: 28 }}>№</th>
                <th>{t.print.documentType}</th>
                <th>{t.print.documentNumber}</th>
                <th>{t.print.issueDate}</th>
                <th>{t.print.counterpartyId}</th>
                {isMixed && <th style={{ width: 55 }}>{t.print.vatPercent}</th>}
                <th style={{ width: 85, textAlign: "right" }}>{t.print.amountEUR}</th>
              </tr>
            </thead>
            <tbody>
              {sectionB.map(
                (inv: {
                  id: string;
                  sequence_number: number;
                  document_type: string;
                  document_number: string;
                  issue_date: string;
                  counterparty_vat_id: string | null;
                  vat_rate: number | null;
                  amount: number;
                }) => (
                  <tr key={inv.id}>
                    <td>{inv.sequence_number}</td>
                    <td>{inv.document_type}</td>
                    <td>{inv.document_number}</td>
                    <td>{format(new Date(inv.issue_date), "dd.MM.yyyy")}</td>
                    <td>{inv.counterparty_vat_id || "—"}</td>
                    {isMixed && (
                      <td style={{ textAlign: "center" }}>
                        {inv.vat_rate != null ? `${inv.vat_rate}%` : "—"}
                      </td>
                    )}
                    <td style={{ textAlign: "right" }}>
                      {Number(inv.amount).toFixed(2)}
                    </td>
                  </tr>
                )
              )}
              <tr className="total-row">
                <td colSpan={isMixed ? 6 : 5}>
                  {t.print.totalPaid}
                </td>
                <td style={{ textAlign: "right" }}>{totalB.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Commission section */}
        {protocol.protocol_type === "commission" && sectionCommission.length > 0 && (
          <div className="section-wrap">
            <div className="section-title" style={{ background: "#d5f5e3" }}>{t.print.commissionTitle}</div>
            <table>
              <thead>
                <tr>
                  <th style={{ width: 28 }}>№</th>
                  <th>{t.print.commissionInvoiceNumber}</th>
                  <th>{t.print.commissionDate}</th>
                  <th style={{ width: 85, textAlign: "right" }}>{t.print.commissionAmountEUR}</th>
                </tr>
              </thead>
              <tbody>
                {sectionCommission.map(
                  (inv: {
                    id: string;
                    sequence_number: number;
                    document_number: string;
                    issue_date: string;
                    amount: number;
                  }) => (
                    <tr key={inv.id} style={{ background: "#eafaf1" }}>
                      <td>{inv.sequence_number}</td>
                      <td>{inv.document_number}</td>
                      <td>{format(new Date(inv.issue_date), "dd.MM.yyyy")}</td>
                      <td style={{ textAlign: "right" }}>
                        {Number(inv.amount).toFixed(2)}
                      </td>
                    </tr>
                  )
                )}
                <tr className="total-row">
                  <td colSpan={3}>{t.print.totalCommission}</td>
                  <td style={{ textAlign: "right" }}>{totalCommission.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Section C */}
        <div className="section-wrap">
          <div className="section-title">{t.print.sectionCTitle}</div>
          <table className="section-c-table">
            <tbody>
              <tr>
                <td>1. {t.print.marginLabel}</td>
                <td style={{ textAlign: "right", width: 110 }}>
                  {vat.margin.toFixed(2)} EUR
                </td>
              </tr>
              <tr>
                <td>2. {t.print.taxBaseLabel}</td>
                <td style={{ textAlign: "right" }}>
                  {vat.taxBase.toFixed(2)} EUR
                </td>
              </tr>
              <tr>
                <td>3. {t.print.taxRateLabel}</td>
                <td style={{ textAlign: "right" }}>{vat.taxRate}%</td>
              </tr>
              <tr className="total-row">
                <td>4. {t.print.vatLabel}</td>
                <td style={{ textAlign: "right" }}>
                  {vat.vatAmount.toFixed(3)} EUR
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Signatures */}
        <div className="signatures">
          <div className="signature-block">
            <div className="signature-line" />
            <div>{t.print.createdByLabel}: {protocol.compiled_by || ""}</div>
          </div>
          <div className="signature-block">
            <div className="signature-line" />
            <div>{t.print.approvedByLabel}: {protocol.approved_by || ""}</div>
          </div>
        </div>
      </div>
    </>
  );
}
