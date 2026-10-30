import type { DynamicField, Product } from "./types";

export function formatMoney(cents: number | null): string {
  if (cents === null) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

export function parseMoney(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) return Math.round(value * 100);
  let raw = String(value).trim().replace(/\s/g, "").replace(/[^0-9,.-]/g, "");
  if (!raw) return null;
  const comma = raw.lastIndexOf(",");
  const dot = raw.lastIndexOf(".");
  if (comma > dot) raw = raw.replace(/\./g, "").replace(",", ".");
  else if (dot > comma && comma >= 0) raw = raw.replace(/,/g, "");
  else if (comma >= 0) raw = raw.replace(",", ".");
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : null;
}

export function sanitizeCell(value: unknown): string {
  const text = value === null || value === undefined ? "" : String(value).trim();
  return /^[=+@]/.test(text) ? `'${text}` : text;
}

export function getFieldValue(product: Product, field: DynamicField): string {
  switch (field) {
    case "description": return product.description;
    case "reference": return product.reference;
    case "ean": return product.ean;
    case "normalPrice": return formatMoney(product.normalPriceCents);
    case "promotionalPrice": return formatMoney(product.promotionalPriceCents);
    case "installments": return product.installments ? String(product.installments) : "—";
    case "installmentValue": return formatMoney(product.installmentValueCents);
    case "unit": return product.unit;
    case "package": return product.package;
    case "size": return product.size;
    case "note": return product.note;
    case "bundlePrice": return formatMoney(product.bundlePriceCents);
    case "savings": return formatMoney(product.savingsCents);
  }
}

export function priceParts(cents: number | null): { major: string; minor: string } {
  if (cents === null) return { major: "—", minor: "" };
  const absolute = Math.abs(cents);
  return { major: `${cents < 0 ? "-" : ""}${Math.floor(absolute / 100)}`, minor: String(absolute % 100).padStart(2, "0") };
}
