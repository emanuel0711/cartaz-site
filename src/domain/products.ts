import readXlsxFile from "read-excel-file";
import { parseMoney, sanitizeCell } from "./format";
import type { Product, ProductIssue } from "./types";
import { newId } from "../lib/id";

export const MAX_FILE_BYTES = 16 * 1024 * 1024;
export const MAX_ROWS = 5000;
export const MAX_COLUMNS = 64;
export const MAX_PASTE_CHARACTERS = 2_000_000;

const aliases: Record<string, keyof Product> = {
  description: "description", descricao: "description", product: "description", produto: "description",
  reference: "reference", referencia: "reference", ref: "reference", sku: "reference",
  ean: "ean", barcode: "ean", codigodebarras: "ean", codigo: "ean",
  regularprice: "normalPriceCents", precoregular: "normalPriceCents", preconormal: "normalPriceCents",
  promotionalprice: "promotionalPriceCents", promotional: "promotionalPriceCents", precopromocional: "promotionalPriceCents", oferta: "promotionalPriceCents",
  installments: "installments", parcelas: "installments", nroparcelas: "installments",
  installmentvalue: "installmentValueCents", valorparcela: "installmentValueCents",
  unit: "unit", unidade: "unit", package: "package", embalagem: "package",
  size: "size", tamanho: "size", gramagem: "size", note: "note", observacao: "note",
  bundleprice: "bundlePriceCents", valorfardo: "bundlePriceCents", savings: "savingsCents", economizevalor: "savingsCents",
};

function key(value: unknown): string {
  return String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], cell = "", quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (char === '"' && quoted && next === '"') { cell += '"'; index += 1; }
    else if (char === '"') quoted = !quoted;
    else if ((char === "," || char === ";" || char === "\t") && !quoted) { row.push(cell); cell = ""; }
    else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell); if (row.some((value) => value.trim())) rows.push(row); row = []; cell = "";
    } else cell += char;
  }
  row.push(cell); if (row.some((value) => value.trim())) rows.push(row);
  return rows;
}

export async function readProductFile(file: File): Promise<unknown[][]> {
  if (file.size > MAX_FILE_BYTES) throw new Error("The file is larger than 16 MB.");
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (!extension || !["csv", "xlsx"].includes(extension)) throw new Error("Use a .csv or .xlsx file.");
  const signature = new Uint8Array(await file.slice(0, 4).arrayBuffer());
  if (extension === "xlsx" && !(signature[0] === 0x50 && signature[1] === 0x4b && signature[2] === 0x03 && signature[3] === 0x04)) throw new Error("This file does not have a valid XLSX signature.");
  if (extension === "csv" && signature.some((byte) => byte === 0)) throw new Error("This CSV appears to contain binary data.");
  const rows = extension === "csv" ? parseCsv(await file.text()) : await readXlsxFile(file);
  if (rows.length > MAX_ROWS + 1) throw new Error(`This file has more than ${MAX_ROWS.toLocaleString()} product rows.`);
  if (rows.some((row) => row.length > MAX_COLUMNS)) throw new Error(`A spreadsheet can contain at most ${MAX_COLUMNS} columns.`);
  return rows;
}

export function mapRows(rows: unknown[][]): Product[] {
  if (rows.length < 2) return [];
  const headers = rows[0].map((header) => aliases[key(header)]);
  return rows.slice(1, MAX_ROWS + 1).filter((row) => row.some((value) => String(value ?? "").trim())).map((row, index) => {
    const values: Partial<Record<keyof Product, unknown>> = {};
    headers.forEach((field, column) => { if (field) values[field] = row[column]; });
    const eanRaw = values.ean;
    const ean = typeof eanRaw === "number" ? String(Math.trunc(eanRaw)) : sanitizeCell(eanRaw);
    const product: Product = {
      id: newId(), selected: true, description: sanitizeCell(values.description),
      reference: sanitizeCell(values.reference), ean,
      normalPriceCents: parseMoney(values.normalPriceCents), promotionalPriceCents: parseMoney(values.promotionalPriceCents),
      installments: values.installments ? Math.max(0, Math.trunc(Number(values.installments))) : null,
      installmentValueCents: parseMoney(values.installmentValueCents), unit: sanitizeCell(values.unit),
      package: sanitizeCell(values.package), size: sanitizeCell(values.size), note: sanitizeCell(values.note),
      bundlePriceCents: parseMoney(values.bundlePriceCents), savingsCents: parseMoney(values.savingsCents), issues: [],
    };
    product.issues = validateProduct(product, index, typeof eanRaw === "number");
    if (Object.values(values).some((value) => /^[=+@]/.test(String(value ?? "").trim()))) product.issues.push({ level: "warning", field: "row", message: "Spreadsheet formula prefix was neutralized and kept as text." });
    return product;
  });
}

export function validateProduct(product: Product, _row = 0, numericEan = false): ProductIssue[] {
  const issues: ProductIssue[] = [];
  if (!product.description.trim()) issues.push({ level: "error", field: "description", message: "Description is required." });
  if (product.description.length > 240) issues.push({ level: "warning", field: "description", message: "Description is longer than 240 characters." });
  if (product.promotionalPriceCents === null) issues.push({ level: "error", field: "promotionalPriceCents", message: "Promotional price is required." });
  else if (product.promotionalPriceCents <= 0) issues.push({ level: "error", field: "promotionalPriceCents", message: "Promotional price must be greater than zero." });
  if (product.normalPriceCents !== null && product.promotionalPriceCents !== null && product.promotionalPriceCents > product.normalPriceCents) {
    issues.push({ level: "warning", field: "promotionalPriceCents", message: "Promotional price is higher than the regular price." });
  }
  if (product.ean && !/^(\d{8}|\d{12}|\d{13}|\d{14})$/.test(product.ean)) issues.push({ level: "warning", field: "ean", message: "EAN should contain 8, 12, 13, or 14 digits." });
  if (numericEan) issues.push({ level: "warning", field: "ean", message: "EAN was stored as a number; leading zeros may have been lost." });
  if (product.installments && !product.installmentValueCents) issues.push({ level: "warning", field: "installmentValueCents", message: "Installment value is missing." });
  return issues;
}

export function findDuplicates(products: Product[]): Set<string> {
  const seen = new Set<string>(), duplicates = new Set<string>();
  products.forEach((product) => {
    const identity = product.ean || product.reference.toLowerCase();
    if (!identity) return;
    if (seen.has(identity)) duplicates.add(product.id); else seen.add(identity);
  });
  return duplicates;
}

export const TEMPLATE_CSV = `DESCRIPTION,REFERENCE,EAN,REGULAR PRICE,PROMOTIONAL PRICE,INSTALLMENTS,INSTALLMENT VALUE,UNIT,PACKAGE,SIZE,NOTE,BUNDLE PRICE,SAVINGS\nWhole Milk 1L,MILK-01,0789123400012,"6.29","4.99",,,unit,carton,1 L,Limit 6 per customer,,1.30\n`;
