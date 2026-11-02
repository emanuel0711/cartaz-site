import { newId } from "../lib/id";
import type {
  Design,
  DesignElement,
  DynamicField,
  TltImportReport,
} from "./types";

type HarEntry = {
  request?: { url?: string; postData?: { text?: string } };
  response?: { content?: { text?: string } };
};
type Har = { log?: { entries?: HarEntry[] } };
type TltRect = { left?: number; top?: number; width?: number; height?: number };
type TltElement = {
  type?: number;
  name?: string;
  img_data?: string;
  plug_rect?: TltRect;
  html?: string;
};
type TltListItem = {
  ID_DOCUMENTO?: number;
  ID_MODELO?: number;
  NOME_DOC?: string;
  NOME_MODELO?: string;
  TAMANHO?: string;
  LARGURA_MM?: number;
  ALTURA_MM?: number;
  ORIENTACAO?: number;
};

const PX_PER_MM = 96 / 25.4;
const TOKEN_FIELDS: Record<string, DynamicField> = {
  MC_DESCRICAO: "description",
  MC_REF: "reference",
  MC_EAN: "ean",
  MC_PRN: "normalPrice",
  MC_PRNCR: "normalPrice",
  MC_PRP: "promotionalPrice",
  MC_PRPCR: "promotionalPrice",
  MC_NRO_PARCELAS: "installments",
  MC_VALOR_PARCELA: "installmentValue",
  MC_UNIDADE: "unit",
  MC_EMBALAGEM: "package",
  MC_TAMANHO: "size",
  MC_OBSERVACAO: "note",
  MC_VALOR_FARDO: "bundlePrice",
  MC_ECONOMIZE_VALOR: "savings",
};

function parseAsmx(entry: HarEntry): unknown[] {
  const text = entry.response?.content?.text;
  if (!text) return [];
  try {
    const outer = JSON.parse(text) as { d?: string | unknown[] };
    const value = typeof outer.d === "string" ? JSON.parse(outer.d) : outer.d;
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function requestId(entry: HarEntry): string | null {
  try {
    return (
      String(
        (JSON.parse(entry.request?.postData?.text || "{}") as { ID?: unknown })
          .ID ?? "",
      ) || null
    );
  } catch {
    return null;
  }
}

function pageSize(item: TltListItem): [number, number] {
  if (item.LARGURA_MM && item.ALTURA_MM)
    return [item.LARGURA_MM, item.ALTURA_MM];
  const sizes: Record<string, [number, number]> = {
    A6: [105, 148],
    A5: [148, 210],
    A4: [210, 297],
    A3: [297, 420],
    A2: [420, 594],
    OFICIO: [216, 279],
    LEGAL: [216, 356],
  };
  const result = sizes[(item.TAMANHO || "A4").toUpperCase()] || sizes.A4;
  return item.ORIENTACAO === 1 ? [result[1], result[0]] : result;
}

function styleValue(html: string, property: string): string | undefined {
  return html
    .match(new RegExp(`${property}\\s*:\\s*([^;\\\"]+)`, "i"))?.[1]
    ?.trim();
}

function plainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .trim();
}

function convertElement(
  raw: TltElement,
  warnings: string[],
): DesignElement | null {
  const rect = raw.plug_rect || {};
  const x = Math.max(0, Number(rect.left || 0) / PX_PER_MM),
    y = Math.max(0, Number(rect.top || 0) / PX_PER_MM);
  const width = Math.max(1, Number(rect.width || 32) / PX_PER_MM),
    height = Math.max(1, Number(rect.height || 32) / PX_PER_MM);
  if (raw.type === 2 || raw.img_data)
    return {
      id: newId(),
      kind: "image",
      name: raw.name || "TLT image",
      x,
      y,
      width,
      height,
      rotation: 0,
      source: raw.img_data || "",
      fontSize: 12,
      minFontSize: 8,
      fontWeight: 600,
      color: "#111111",
      align: "center",
      textFit: "shrink",
      visible: true,
    };
  if (raw.type !== 1) {
    warnings.push(
      `Unsupported TLT element type ${String(raw.type)} was skipped.`,
    );
    return null;
  }
  const html = raw.html || "";
  const text = plainText(html);
  const token = text.match(/MC_[A-Z0-9_]+/)?.[0];
  const field = token ? TOKEN_FIELDS[token] : undefined;
  if (token && !field)
    warnings.push(
      `Token ${token} was preserved but has no automatic product mapping.`,
    );
  const fontSizePx = Number.parseFloat(styleValue(html, "font-size") || "48");
  const color = styleValue(html, "color") || "#111111";
  const align = (styleValue(html, "text-align") ||
    html.match(/text-align\s*:\s*(left|right|center)/i)?.[1] ||
    "center") as "left" | "center" | "right";
  const family = /font-family\s*:\s*Impact/i.test(html)
    ? "Impact"
    : "Helvetica";
  return {
    id: newId(),
    kind: field || token ? "dynamic" : "text",
    name: token || text.slice(0, 40) || "TLT text",
    x,
    y,
    width,
    height,
    rotation: 0,
    text: field || token ? undefined : text,
    field,
    token,
    fontFamily: family,
    fontSize: Math.max(6, fontSizePx * 0.75),
    minFontSize: 6,
    fontWeight: 600,
    color,
    align,
    textFit: "shrink",
    priceStyle: field?.toLowerCase().includes("price")
      ? "reduced-cents"
      : "standard",
    visible: true,
  };
}

export function importTltHar(input: unknown): {
  designs: Design[];
  reports: TltImportReport[];
} {
  const har = input as Har;
  const entries = har?.log?.entries;
  if (!Array.isArray(entries))
    throw new Error("This file is not a valid HAR capture.");
  const listItems: TltListItem[] = entries.flatMap((entry) =>
    /\/(GetCartazes|GetModelos)$/.test(entry.request?.url || "")
      ? (parseAsmx(entry) as TltListItem[])
      : [],
  );
  const byId = new Map<
    string,
    { text?: TltElement[]; images?: TltElement[]; back?: TltElement[] }
  >();
  entries.forEach((entry) => {
    const match = entry.request?.url?.match(
      /\/(LerDesignText|LerDesignImg|LerDesignBack)$/,
    );
    const id = requestId(entry);
    if (!match || !id) return;
    const value = byId.get(id) || {};
    if (match[1] === "LerDesignText")
      value.text = parseAsmx(entry) as TltElement[];
    if (match[1] === "LerDesignImg")
      value.images = parseAsmx(entry) as TltElement[];
    if (match[1] === "LerDesignBack")
      value.back = parseAsmx(entry) as TltElement[];
    byId.set(id, value);
  });
  const designs: Design[] = [];
  const reports: TltImportReport[] = [];
  listItems.forEach((item) => {
    const sourceId = String(item.ID_DOCUMENTO ?? item.ID_MODELO ?? "");
    const name = item.NOME_DOC || item.NOME_MODELO || `TLT design ${sourceId}`;
    const raw = byId.get(sourceId);
    if (!raw?.text && !raw?.images && !raw?.back) {
      reports.push({
        sourceId,
        name,
        status: "failed",
        warnings: [
          "The HAR lists this design but does not contain its LerDesign responses.",
        ],
      });
      return;
    }
    const warnings: string[] = [];
    const [widthMm, heightMm] = pageSize(item);
    const elements = [...(raw.text || []), ...(raw.images || [])]
      .map((entry) => convertElement(entry, warnings))
      .filter((entry): entry is DesignElement => Boolean(entry));
    const background = raw.back?.find((entry) => entry.img_data)?.img_data;
    if (!background)
      warnings.push(
        "No background image was present in the captured response.",
      );
    const design: Design = {
      id: newId(),
      name: `${name} (TLT import)`,
      status: "draft",
      widthMm,
      heightMm,
      orientation: widthMm > heightMm ? "landscape" : "portrait",
      backgroundColor: "#ffffff",
      backgroundImageDataUrl: background,
      accentColor: "#248a4b",
      elements,
      version: 1,
      updatedAt: new Date().toISOString(),
    };
    designs.push(design);
    reports.push({
      sourceId,
      name,
      status: warnings.length ? "partial" : "imported",
      warnings,
      designId: design.id,
    });
  });
  return { designs, reports };
}
