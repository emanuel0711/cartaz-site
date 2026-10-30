import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { getFieldValue, priceParts } from "./format";
import type { Batch, Design, DesignElement, Product } from "./types";

const mmToPt = (mm: number) => mm * 72 / 25.4;

function hex(value: string) {
  const clean = value.replace("#", "");
  const normalized = clean.length === 3 ? clean.split("").map((part) => part + part).join("") : clean;
  const number = Number.parseInt(normalized, 16);
  return rgb(((number >> 16) & 255) / 255, ((number >> 8) & 255) / 255, (number & 255) / 255);
}

function safePdfText(value: string): string {
  return value.normalize("NFC").replace(/[\u{1F300}-\u{1FAFF}]/gu, "□").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
}

function fitSize(text: string, font: PDFFont, size: number, min: number, maxWidth: number): number {
  let current = size;
  while (current > min && font.widthOfTextAtSize(text, current) > maxWidth) current -= 0.5;
  return Math.max(current, min);
}

function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/); const lines: string[] = []; let line = "";
  words.forEach((word) => {
    const candidate = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) line = candidate;
    else { if (line) lines.push(line); line = word; }
  });
  if (line) lines.push(line);
  return lines;
}

function renderText(page: PDFPage, element: DesignElement, textValue: string, pageHeight: number, font: PDFFont, bold: PDFFont) {
  const activeFont = element.fontWeight >= 600 ? bold : font;
  const x = mmToPt(element.x), yTop = pageHeight - mmToPt(element.y), width = mmToPt(element.width), height = mmToPt(element.height);
  const clean = safePdfText(textValue || " ");
  if (element.field && ["normalPrice", "promotionalPrice", "installmentValue", "bundlePrice"].includes(element.field) && element.priceStyle === "reduced-cents") {
    const centsMap: Record<string, number | null> = { normalPrice: (element as any)._product?.normalPriceCents ?? null, promotionalPrice: (element as any)._product?.promotionalPriceCents ?? null, installmentValue: (element as any)._product?.installmentValueCents ?? null, bundlePrice: (element as any)._product?.bundlePriceCents ?? null };
    const parts = priceParts(centsMap[element.field]);
    const majorSize = fitSize(parts.major, bold, element.fontSize, element.minFontSize, width * .72);
    const majorWidth = bold.widthOfTextAtSize(parts.major, majorSize);
    const totalWidth = majorWidth + majorSize * .45;
    const startX = element.align === "center" ? x + (width - totalWidth) / 2 : element.align === "right" ? x + width - totalWidth : x;
    page.drawText(parts.major, { x: startX, y: yTop - Math.min(height, majorSize), size: majorSize, font: bold, color: hex(element.color) });
    page.drawText(parts.minor, { x: startX + majorWidth + 2, y: yTop - Math.min(height * .45, majorSize * .4), size: majorSize * .36, font: bold, color: hex(element.color) });
    return;
  }
  const size = element.textFit === "shrink" ? fitSize(clean, activeFont, element.fontSize, element.minFontSize, width) : element.fontSize;
  let lines = element.textFit === "wrap" ? wrap(clean, activeFont, size, width) : [clean];
  if (element.textFit === "truncate" && activeFont.widthOfTextAtSize(clean, size) > width) {
    let shortened = clean;
    while (shortened.length && activeFont.widthOfTextAtSize(`${shortened}…`, size) > width) shortened = shortened.slice(0, -1);
    lines = [`${shortened}…`];
  }
  const lineHeight = size * 1.15;
  lines.slice(0, Math.max(1, Math.floor(height / lineHeight))).forEach((line, index) => {
    const lineWidth = activeFont.widthOfTextAtSize(line, size);
    const lineX = element.align === "center" ? x + (width - lineWidth) / 2 : element.align === "right" ? x + width - lineWidth : x;
    page.drawText(line, { x: lineX, y: yTop - size - index * lineHeight, size, font: activeFont, color: hex(element.color) });
  });
}

async function addPoster(pdf: PDFDocument, design: Design, product: Product) {
  const width = mmToPt(design.widthMm), height = mmToPt(design.heightMm);
  const page = pdf.addPage([width, height]);
  page.drawRectangle({ x: 0, y: 0, width, height, color: hex(design.backgroundColor) });
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  design.elements.filter((element) => element.visible !== false).forEach((element) => {
    if (element.kind === "shape") page.drawRectangle({ x: mmToPt(element.x), y: height - mmToPt(element.y + element.height), width: mmToPt(element.width), height: mmToPt(element.height), color: hex(element.backgroundColor || element.color) });
    else {
      const withProduct = { ...element, _product: product } as DesignElement;
      renderText(page, withProduct, element.kind === "dynamic" && element.field ? getFieldValue(product, element.field) : element.text || "", height, regular, bold);
    }
  });
}

export async function createBatchPdf(batch: Batch, designs: Design[]): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const main = designs.find((design) => design.id === batch.designId);
  if (!main) throw new Error("The selected design no longer exists.");
  const second = batch.secondDesignId ? designs.find((design) => design.id === batch.secondDesignId) : undefined;
  for (const product of batch.products.filter((item) => item.selected)) {
    for (let copy = 0; copy < batch.copies; copy += 1) {
      await addPoster(pdf, designs.find((design) => design.id === product.designId) || main, product);
      if (second) await addPoster(pdf, second, product);
    }
  }
  pdf.setTitle(batch.name); pdf.setCreator("Cartaz Economix");
  return pdf.save();
}

export async function downloadBatchPdf(batch: Batch, designs: Design[]) {
  const bytes = await createBatchPdf(batch, designs);
  const blob = new Blob([bytes.slice().buffer], { type: "application/pdf" });
  const url = URL.createObjectURL(blob); const link = document.createElement("a");
  link.href = url; link.download = `${batch.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "posters"}.pdf`;
  link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
