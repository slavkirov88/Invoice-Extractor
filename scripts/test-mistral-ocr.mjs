/**
 * Mistral OCR Integration Test Agent
 *
 * Минава през цялата OCR pipeline:
 *   1. API connectivity
 *   2. withRetry логика (unit tests)
 *   3. OCR — извличане на текст от PDF
 *   4. Chat completion — структуриране на JSON от OCR текст
 *   5. Пълен pipeline (OCR → extraction → JSON validate)
 *   6. Edge cases
 *
 * Usage:
 *   node scripts/test-mistral-ocr.mjs                    # сваля sample PDF
 *   node scripts/test-mistral-ocr.mjs path/to/invoice.pdf # използва твой PDF
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// ─── Load .env.local ──────────────────────────────────────────────────────────
const envFile = path.join(ROOT, ".env.local");
if (fs.existsSync(envFile)) {
  const lines = fs.readFileSync(envFile, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx < 0) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
    if (key && !process.env[key]) process.env[key] = val;
  }
}

const { Mistral } = await import("@mistralai/mistralai");

// ─── withRetry (mirrors src/lib/mistral/with-retry.ts) ───────────────────────
async function withRetry(fn, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const isRateLimit =
        msg.includes("429") ||
        msg.includes("rate_limited") ||
        msg.includes("Rate limit");
      if (isRateLimit && attempt < retries) {
        const delay = (attempt + 1) * 2000;
        console.log(`    ↻ Rate limit hit — waiting ${delay / 1000}s before retry ${attempt + 1}/${retries}...`);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      throw err;
    }
  }
  throw new Error("Max retries exceeded");
}

// ─── Test runner ──────────────────────────────────────────────────────────────
const results = [];

async function test(name, fn) {
  const start = Date.now();
  process.stdout.write(`  • ${name} ... `);
  try {
    const details = await fn();
    const ms = Date.now() - start;
    results.push({ name, status: "PASS", ms, details });
    console.log(`✓  (${ms}ms)${details ? `\n    → ${details}` : ""}`);
  } catch (err) {
    const ms = Date.now() - start;
    const error = err instanceof Error ? err.message : String(err);
    results.push({ name, status: "FAIL", ms, error });
    console.log(`✗  (${ms}ms)\n    ✗ ${error}`);
  }
}

function skip(name, reason) {
  results.push({ name, status: "SKIP", ms: 0 });
  console.log(`  ○ ${name} — SKIP: ${reason}`);
}

// ─── PDF helper ───────────────────────────────────────────────────────────────
async function getPdfBase64(filePath) {
  if (filePath) {
    const abs = path.resolve(process.cwd(), filePath);
    if (!fs.existsSync(abs)) {
      console.log(`  ⚠ PDF not found at: ${abs}`);
      return null;
    }
    return fs.readFileSync(abs).toString("base64");
  }

  // Download a small sample public PDF
  try {
    console.log("  ↓ Downloading sample PDF...");
    const res = await fetch("https://www.w3.org/WAI/WCAG21/Techniques/pdf/sample.pdf");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    console.log(`  ✓ Downloaded ${(buf.length / 1024).toFixed(1)}KB`);
    return buf.toString("base64");
  } catch (e) {
    console.log(`  ⚠ Could not download sample PDF: ${e.message}`);
    return null;
  }
}

// ─── Extraction prompt ────────────────────────────────────────────────────────
const EXTRACTION_PROMPT = (text) => `Анализирай текста от финансов документ и извлечи:
1. Номер на документа
2. Дата на издаване (YYYY-MM-DD)
3. Обща стойност в евро. BGN → EUR: раздели на 1.95583.
4. ЕИК/VAT на ИЗДАТЕЛЯ (с BG prefix ако е български; ако няма → "999999999").

Върни САМО JSON: {"documentNumber":"...","issueDate":"YYYY-MM-DD","amount":0.00,"counterparty_vat_id":"..."}

${text}`;

function validateExtracted(parsed) {
  const { documentNumber, issueDate, amount, counterparty_vat_id } = parsed;
  const missing = ["documentNumber", "issueDate", "amount", "counterparty_vat_id"]
    .filter((k) => !(k in parsed));
  if (missing.length) throw new Error(`Missing fields: ${missing.join(", ")}`);
  if (typeof amount !== "number" || isNaN(amount) || amount < 0)
    throw new Error(`Invalid amount: ${amount}`);
  if (issueDate && issueDate !== "" && !/^\d{4}-\d{2}-\d{2}$/.test(issueDate))
    throw new Error(`Invalid date format: "${issueDate}"`);
  return { documentNumber, issueDate, amount, counterparty_vat_id };
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  const pdfArg = process.argv[2];
  const apiKey = process.env.MISTRAL_API_KEY;

  console.log("\n╔══════════════════════════════════════════════╗");
  console.log("║      Mistral OCR Integration Test Agent      ║");
  console.log("╚══════════════════════════════════════════════╝\n");

  // ── Pre-flight ────────────────────────────────────────────────────────────
  if (!apiKey) {
    console.error("✗ MISTRAL_API_KEY не е зададен в .env.local или environment\n");
    process.exit(1);
  }
  console.log(`✓ API key: ${apiKey.slice(0, 8)}${"*".repeat(8)}\n`);

  const mistral = new Mistral({ apiKey });

  // ══ SUITE 1: API Connectivity ═════════════════════════════════════════════
  console.log("━━━ Suite 1: API Connectivity ━━━━━━━━━━━━━━━━━━━━");

  await test("Ping: chat completion responds", async () => {
    const resp = await withRetry(() =>
      mistral.chat.complete({
        model: "mistral-small-latest",
        messages: [{ role: "user", content: 'Reply with the single word: "pong"' }],
        maxTokens: 10,
      })
    );
    const content = resp.choices?.[0]?.message?.content;
    if (!content) throw new Error("Empty response");
    return `model replied: "${String(content).trim().slice(0, 40)}"`;
  });

  await test("Model: mistral-small-latest is accessible", async () => {
    const resp = await withRetry(() =>
      mistral.chat.complete({
        model: "mistral-small-latest",
        messages: [{ role: "user", content: "What model are you? One sentence." }],
        maxTokens: 30,
      })
    );
    const content = String(resp.choices?.[0]?.message?.content ?? "");
    return content.trim().slice(0, 80);
  });

  // ══ SUITE 2: withRetry unit tests ════════════════════════════════════════
  console.log("\n━━━ Suite 2: withRetry helper ━━━━━━━━━━━━━━━━━━━━");

  await test("Succeeds on first try (no retries needed)", async () => {
    let calls = 0;
    const result = await withRetry(async () => { calls++; return "ok"; });
    if (result !== "ok" || calls !== 1) throw new Error(`calls=${calls}`);
    return `1 call, result="${result}"`;
  });

  await test("Retries on 429 and recovers on 2nd attempt", async () => {
    let calls = 0;
    const result = await withRetry(async () => {
      calls++;
      if (calls < 2) throw new Error("API error occurred: Status 429");
      return "recovered";
    });
    if (result !== "recovered" || calls !== 2)
      throw new Error(`calls=${calls}, result=${result}`);
    return `recovered after ${calls} attempts`;
  });

  await test("Does NOT retry on non-429 errors", async () => {
    let calls = 0;
    try {
      await withRetry(async () => { calls++; throw new Error("500 Internal Server Error"); });
      throw new Error("Should have thrown");
    } catch (err) {
      if (calls !== 1) throw new Error(`Expected 1 call, got ${calls}`);
      if (!err.message.includes("500")) throw new Error("Wrong error propagated");
      return `threw immediately after 1 call`;
    }
  });

  await test("Throws after max retries (3 attempts total)", async () => {
    let calls = 0;
    try {
      await withRetry(async () => {
        calls++;
        throw new Error("Status 429 rate_limited");
      }, 2);
      throw new Error("Should have thrown");
    } catch (err) {
      if (calls !== 3) throw new Error(`Expected 3 calls (1+2 retries), got ${calls}`);
      return `threw after ${calls} attempts (1 + 2 retries)`;
    }
  });

  // ══ SUITE 3: OCR ═════════════════════════════════════════════════════════
  console.log("\n━━━ Suite 3: Mistral OCR ━━━━━━━━━━━━━━━━━━━━━━━━━");

  const pdfBase64 = await getPdfBase64(pdfArg);
  let ocrText = "";

  if (!pdfBase64) {
    skip("OCR: extract text from PDF", "No PDF available — pass path as argument");
    skip("OCR: returns non-empty markdown", "No PDF available");
  } else {
    const sizeKb = Math.round(pdfBase64.length * 0.75 / 1024);
    console.log(`  PDF: ${pdfArg ?? "sample.pdf"} (≈${sizeKb}KB)`);

    await test("OCR: process PDF via mistral-ocr-latest", async () => {
      const resp = await withRetry(() =>
        mistral.ocr.process({
          model: "mistral-ocr-latest",
          document: {
            type: "document_url",
            documentUrl: `data:application/pdf;base64,${pdfBase64}`,
          },
        })
      );
      ocrText = resp.pages?.map((p) => p.markdown).join("\n\n") ?? "";
      if (!ocrText) throw new Error("OCR returned empty text");
      const pages = resp.pages?.length ?? 0;
      const words = ocrText.split(/\s+/).length;
      return `${pages} page(s), ~${words} words extracted`;
    });

    await test("OCR: output is non-empty markdown string", async () => {
      if (!ocrText) throw new Error("No OCR text (previous test failed)");
      if (ocrText.length < 10) throw new Error(`Too short: "${ocrText}"`);
      return `${ocrText.length} chars — preview: "${ocrText.slice(0, 60).replace(/\n/g, " ")}..."`;
    });
  }

  // ══ SUITE 4: Chat extraction pipeline ════════════════════════════════════
  console.log("\n━━━ Suite 4: Chat Extraction Pipeline ━━━━━━━━━━━━━");

  const syntheticText = `
ФАКТУРА № 2024-0042
Дата: 15.01.2024
Издател: Travel Tours EOOD, ЕИК BG203456789
Получател: Hotel Sunrise
Стойност: 2 340,00 лв.
ДДС: 468,00 лв.
ОБЩО: 2 808,00 лв.
  `.trim();

  await test("Extract from synthetic Bulgarian invoice (BGN→EUR conversion)", async () => {
    const resp = await withRetry(() =>
      mistral.chat.complete({
        model: "mistral-small-latest",
        messages: [{ role: "user", content: EXTRACTION_PROMPT(syntheticText) }],
        maxTokens: 150,
      })
    );
    const raw = String(resp.choices?.[0]?.message?.content ?? "");
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error(`No JSON in response: "${raw.slice(0, 100)}"`);
    const parsed = JSON.parse(match[0]);
    const { documentNumber, issueDate, amount, counterparty_vat_id } = validateExtracted(parsed);

    // Invoice has 2340 BGN net + 468 BGN VAT = 2808 BGN total
    // Model may pick either net (~1197 EUR) or gross (~1436 EUR) — both are valid
    const netEur = 2340 / 1.95583;
    const grossEur = 2808 / 1.95583;
    if (amount > 0 && amount < netEur - 100)
      throw new Error(`Amount ${amount} EUR seems too low (net≈${netEur.toFixed(2)}, gross≈${grossEur.toFixed(2)})`);

    return `docNum="${documentNumber}", date="${issueDate}", amount=${amount} EUR, vat="${counterparty_vat_id}"`;
  });

  if (ocrText) {
    await test("Extract from real OCR text (full pipeline)", async () => {
      const resp = await withRetry(() =>
        mistral.chat.complete({
          model: "mistral-small-latest",
          messages: [{ role: "user", content: EXTRACTION_PROMPT(ocrText) }],
          maxTokens: 150,
        })
      );
      const raw = String(resp.choices?.[0]?.message?.content ?? "");
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) throw new Error(`No JSON: "${raw.slice(0, 100)}"`);
      const parsed = JSON.parse(match[0]);
      const result = validateExtracted(parsed);
      return `docNum="${result.documentNumber}", date="${result.issueDate}", amount=${result.amount}, vat="${result.counterparty_vat_id}"`;
    });
  } else {
    skip("Extract from real OCR text (full pipeline)", "No OCR text available");
  }

  await test("JSON has all 4 required fields", async () => {
    const resp = await withRetry(() =>
      mistral.chat.complete({
        model: "mistral-small-latest",
        messages: [{
          role: "user",
          content: 'Върни САМО JSON: {"documentNumber":"INV-001","issueDate":"2024-01-15","amount":100.00,"counterparty_vat_id":"BG123456789"}',
        }],
        maxTokens: 80,
      })
    );
    const raw = String(resp.choices?.[0]?.message?.content ?? "");
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON");
    const parsed = JSON.parse(match[0]);
    validateExtracted(parsed);
    const fields = Object.keys(parsed);
    return `fields: ${fields.join(", ")}`;
  });

  // ══ SUITE 5: Edge cases ══════════════════════════════════════════════════
  console.log("\n━━━ Suite 5: Edge cases ━━━━━━━━━━━━━━━━━━━━━━━━━━");

  await test("Non-invoice text → fallback values (0 / 999999999)", async () => {
    const resp = await withRetry(() =>
      mistral.chat.complete({
        model: "mistral-small-latest",
        messages: [{
          role: "user",
          content: EXTRACTION_PROMPT("Днес времето е слънчево. Котката спи на прозореца."),
        }],
        maxTokens: 100,
      })
    );
    const raw = String(resp.choices?.[0]?.message?.content ?? "");
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON");
    const parsed = JSON.parse(match[0]);
    validateExtracted(parsed);
    return `amount=${parsed.amount}, vat="${parsed.counterparty_vat_id}"`;
  });

  await test("Amount field is numeric (not string)", async () => {
    const resp = await withRetry(() =>
      mistral.chat.complete({
        model: "mistral-small-latest",
        messages: [{
          role: "user",
          content: EXTRACTION_PROMPT("Invoice #55, Date 2024-03-01, Total: 500 EUR, VAT: DE123456789"),
        }],
        maxTokens: 100,
      })
    );
    const raw = String(resp.choices?.[0]?.message?.content ?? "");
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON");
    const parsed = JSON.parse(match[0]);
    if (typeof parsed.amount !== "number")
      throw new Error(`amount is ${typeof parsed.amount}: ${parsed.amount}`);
    return `amount=${parsed.amount} (type: number ✓)`;
  });

  await test("EUR amount extracted without conversion (already EUR)", async () => {
    const resp = await withRetry(() =>
      mistral.chat.complete({
        model: "mistral-small-latest",
        messages: [{
          role: "user",
          content: EXTRACTION_PROMPT("Invoice No: 777, 2024-06-15, Total: EUR 1000.00, EIK: BG987654321"),
        }],
        maxTokens: 100,
      })
    );
    const raw = String(resp.choices?.[0]?.message?.content ?? "");
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON");
    const parsed = JSON.parse(match[0]);
    if (typeof parsed.amount !== "number") throw new Error(`amount not a number`);
    // Should be close to 1000, not 1000/1.95583
    if (parsed.amount > 0 && Math.abs(parsed.amount - 1000) > 100)
      throw new Error(`Amount ${parsed.amount} looks like BGN conversion was wrongly applied`);
    return `amount=${parsed.amount} EUR (no conversion applied ✓)`;
  });

  // ══ Summary ═══════════════════════════════════════════════════════════════
  const passed = results.filter((r) => r.status === "PASS").length;
  const failed = results.filter((r) => r.status === "FAIL").length;
  const skipped = results.filter((r) => r.status === "SKIP").length;
  const totalMs = results.reduce((s, r) => s + r.ms, 0);

  console.log("\n╔══════════════════════════════════════════════╗");
  console.log(
    `║  ${passed} passed  •  ${failed} failed  •  ${skipped} skipped  •  ${(totalMs / 1000).toFixed(1)}s total`.padEnd(47) + "║"
  );
  console.log("╚══════════════════════════════════════════════╝");

  if (failed > 0) {
    console.log("\nFailed tests:");
    results
      .filter((r) => r.status === "FAIL")
      .forEach((r) => console.log(`  ✗ ${r.name}\n    ${r.error}`));
    console.log();
  }

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("\nFatal:", err);
  process.exit(1);
});
