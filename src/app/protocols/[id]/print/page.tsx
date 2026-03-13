export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { calculateVat } from "@/lib/utils/vat-calculator";
import { format } from "date-fns";
import { Noto_Sans } from "next/font/google";
import PrintTrigger from "./PrintTrigger";

const notoSans = Noto_Sans({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "600", "700"],
});

export default async function ProtocolPrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Auth check
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

  const vat = calculateVat(protocol.invoices, protocol.tax_rate);

  const protocolTypeLabel =
    protocol.protocol_type === "eu"
      ? "в ЕС (20%)"
      : protocol.protocol_type === "non_eu"
      ? "извън ЕС (0%)"
      : protocol.protocol_type === "mixed"
      ? "Смесен"
      : protocol.protocol_type === "commission"
      ? "Комисионен"
      : "Стандартен";

  const isMixed = protocol.protocol_type === "mixed";

  return (
    <html lang="bg">
      <head>
        <meta charSet="utf-8" />
        <title>Протокол №{protocol.protocol_number}</title>
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          html, body {
            background: white;
            color: black;
            font-family: ${notoSans.style.fontFamily}, Arial, sans-serif;
            font-size: 11px;
          }
          .page {
            max-width: 210mm;
            margin: 0 auto;
            padding: 15mm 15mm 15mm 15mm;
          }
          h1 { font-size: 16px; font-weight: 700; margin-bottom: 4px; }
          h2 { font-size: 12px; font-weight: 600; margin: 16px 0 6px; }
          .meta-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 4px 24px;
            margin-bottom: 8px;
            font-size: 10px;
          }
          .meta-label { color: #555; }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10px;
          }
          th {
            background: #f0f0f0;
            border: 1px solid #ccc;
            padding: 4px 6px;
            text-align: left;
            font-weight: 600;
          }
          td {
            border: 1px solid #ccc;
            padding: 4px 6px;
          }
          .total-row td { font-weight: 700; background: #f8f8f8; }
          .section-c { margin-top: 16px; }
          .section-c table { max-width: 320px; }
          .signatures {
            margin-top: 32px;
            display: flex;
            justify-content: flex-end;
            gap: 48px;
          }
          .signature-block { text-align: center; font-size: 10px; }
          .signature-line {
            border-bottom: 1px solid #333;
            width: 120px;
            margin: 24px auto 4px;
          }
          .no-print {
            position: fixed;
            top: 12px;
            right: 12px;
            display: flex;
            gap: 8px;
            z-index: 999;
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
            background: #7c3aed;
            color: white;
            border-color: #7c3aed;
          }
          @media print {
            .no-print { display: none !important; }
            html, body { font-size: 10px; }
            .page { padding: 10mm; }
          }
        `}</style>
      </head>
      <body>
        <PrintTrigger />

        <div className="no-print">
          <button className="btn btn-primary" onClick={() => window.print()}>
            Отпечатай / Запази PDF
          </button>
          <button className="btn" onClick={() => window.close()}>
            Затвори
          </button>
        </div>

        <div className="page">
          {/* Header */}
          <h1>ПРОТОКОЛ №{protocol.protocol_number}</h1>
          <p style={{ fontSize: 10, color: "#555", marginBottom: 12 }}>
            {protocolTypeLabel} · чл. 117, ал. 2 ЗДДС
          </p>

          <div className="meta-grid">
            <div>
              <span className="meta-label">Доставчик: </span>
              <strong>{protocol.supplier_name}</strong>
            </div>
            <div>
              <span className="meta-label">ЕИК / ДДС №: </span>
              {protocol.supplier_vat_id}
            </div>
            <div>
              <span className="meta-label">Дата на съставяне: </span>
              {format(new Date(protocol.creation_date), "dd.MM.yyyy")}
            </div>
            <div>
              <span className="meta-label">Дата на данъчно събитие: </span>
              {format(new Date(protocol.tax_event_date), "dd.MM.yyyy")}
            </div>
            {protocol.reference_number && (
              <div>
                <span className="meta-label">Референция №: </span>
                {protocol.reference_number}
              </div>
            )}
            {protocol.destination && (
              <div>
                <span className="meta-label">Дестинация: </span>
                {protocol.destination}
              </div>
            )}
            {protocol.linked_protocol_number && (
              <div>
                <span className="meta-label">Към протокол №: </span>
                {protocol.linked_protocol_number}
              </div>
            )}
          </div>

          {/* Section A */}
          <h2>Раздел А. Получени суми по туристическата услуга</h2>
          <table>
            <thead>
              <tr>
                <th style={{ width: 30 }}>№</th>
                <th>Вид документ</th>
                <th>№ на документа</th>
                <th>Дата на издаване</th>
                <th>ЕИК на контрагент</th>
                {isMixed && <th style={{ width: 60 }}>ДДС %</th>}
                <th style={{ width: 80, textAlign: "right" }}>Стойност EUR</th>
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
                  Общ размер на получените суми
                </td>
                <td style={{ textAlign: "right" }}>{totalA.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          {/* Section B */}
          <h2>Раздел Б. Платени суми по туристическата услуга</h2>
          <table>
            <thead>
              <tr>
                <th style={{ width: 30 }}>№</th>
                <th>Вид документ</th>
                <th>№ на документа</th>
                <th>Дата на издаване</th>
                <th>ЕИК на контрагент</th>
                {isMixed && <th style={{ width: 60 }}>ДДС %</th>}
                <th style={{ width: 80, textAlign: "right" }}>Стойност EUR</th>
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
                  Общ размер на платените суми
                </td>
                <td style={{ textAlign: "right" }}>{totalB.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          {/* Section C */}
          <div className="section-c">
            <h2>Раздел В. Изчисляване на данъка (ДДС)</h2>
            <table>
              <tbody>
                <tr>
                  <td>1. Марж (Раздел А − Раздел Б)</td>
                  <td style={{ textAlign: "right", width: 100 }}>
                    {vat.margin.toFixed(2)} EUR
                  </td>
                </tr>
                <tr>
                  <td>2. Данъчна основа (Марж × 100 / {100 + vat.taxRate})</td>
                  <td style={{ textAlign: "right" }}>
                    {vat.taxBase.toFixed(2)} EUR
                  </td>
                </tr>
                <tr>
                  <td>3. Данъчна ставка</td>
                  <td style={{ textAlign: "right" }}>{vat.taxRate}%</td>
                </tr>
                <tr className="total-row">
                  <td>4. Начислен ДДС</td>
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
              <div>Съставил: {protocol.compiled_by || ""}</div>
            </div>
            <div className="signature-block">
              <div className="signature-line" />
              <div>Одобрил: {protocol.approved_by || ""}</div>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
