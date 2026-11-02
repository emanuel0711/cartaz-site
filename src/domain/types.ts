export type DesignStatus = "template" | "draft" | "published";
export type DynamicField =
  | "description"
  | "reference"
  | "ean"
  | "normalPrice"
  | "promotionalPrice"
  | "installments"
  | "installmentValue"
  | "unit"
  | "package"
  | "size"
  | "note"
  | "bundlePrice"
  | "savings";

export type TextFit = "shrink" | "wrap" | "truncate";
export type PriceStyle = "standard" | "reduced-cents";

export interface Product {
  id: string;
  selected: boolean;
  description: string;
  reference: string;
  ean: string;
  normalPriceCents: number | null;
  promotionalPriceCents: number | null;
  installments: number | null;
  installmentValueCents: number | null;
  unit: string;
  package: string;
  size: string;
  note: string;
  bundlePriceCents: number | null;
  savingsCents: number | null;
  designId?: string;
  issues: ProductIssue[];
}

export interface ProductIssue {
  level: "error" | "warning";
  field: keyof Product | "row";
  message: string;
}

export interface DesignElement {
  id: string;
  kind: "text" | "dynamic" | "shape" | "image" | "qr";
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  text?: string;
  field?: DynamicField;
  token?: string;
  source?: string;
  fontFamily?: "Impact" | "Anton" | "Helvetica";
  fontSize: number;
  minFontSize: number;
  fontWeight: 400 | 500 | 600;
  color: string;
  backgroundColor?: string;
  align: "left" | "center" | "right";
  textFit: TextFit;
  priceStyle?: PriceStyle;
  locked?: boolean;
  visible?: boolean;
}

export interface Design {
  id: string;
  name: string;
  status: DesignStatus;
  widthMm: number;
  heightMm: number;
  orientation: "portrait" | "landscape";
  backgroundColor: string;
  accentColor: string;
  backgroundImageDataUrl?: string;
  elements: DesignElement[];
  version: number;
  updatedAt: string;
}

export interface Batch {
  id: string;
  name: string;
  designId: string;
  secondDesignId?: string;
  products: Product[];
  copies: number;
  outputMode: "single" | "per-product";
  status: "ready" | "failed";
  createdAt: string;
}

export interface TltImportReport {
  sourceId: string;
  name: string;
  status: "imported" | "partial" | "failed";
  warnings: string[];
  designId?: string;
}

export const FIELD_LABELS: Record<DynamicField, string> = {
  description: "Description",
  reference: "Reference",
  ean: "Barcode (EAN)",
  normalPrice: "Regular price",
  promotionalPrice: "Promotional price",
  installments: "Installments",
  installmentValue: "Installment value",
  unit: "Unit",
  package: "Package",
  size: "Size",
  note: "Note",
  bundlePrice: "Bundle price",
  savings: "You save",
};

export const FIELD_TOKENS: Record<DynamicField, string> = {
  description: "DESCRICAO",
  reference: "REFERENCIA",
  ean: "EAN",
  normalPrice: "PRECO NORMAL",
  promotionalPrice: "PRECO PROMOCIONAL",
  installments: "NRO PARCELAS",
  installmentValue: "VALOR PARCELA",
  unit: "UNIDADE",
  package: "EMBALAGEM",
  size: "TAMANHO",
  note: "OBSERVACAO",
  bundlePrice: "VALOR FARDO",
  savings: "ECONOMIZE VALOR",
};

export const PAGE_SIZES = {
  A6: [105, 148],
  A5: [148, 210],
  A4: [210, 297],
  A3: [297, 420],
  A2: [420, 594],
  Office: [216, 279],
  Legal: [216, 356],
} as const;
