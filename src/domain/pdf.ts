import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFImage,
  type PDFFont,
  type PDFPage,
} from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import antonUrl from "@fontsource/anton/files/anton-latin-ext-400-normal.woff2?url";
import QRCode from "qrcode";
import { getFieldValue, priceParts } from "./format";
import type { Batch, Design, DesignElement, Product } from "./types";
import { fitTextSize, wrapText } from "./textLayout";
import { loadImpactFont } from "../lib/indexedDbStorage";

const mmToPt = (mm: number) => (mm * 72) / 25.4;

function hex(value: string) {
  const clean = value.replace("#", "");
  const normalized =
    clean.length === 3
      ? clean
          .split("")
          .map((part) => part + part)
          .join("")
      : clean;
  const number = Number.parseInt(normalized, 16);
  return rgb(
    ((number >> 16) & 255) / 255,
    ((number >> 8) & 255) / 255,
    (number & 255) / 255,
  );
}

function safePdfText(value: string, font: PDFFont): string {
  const clean = value
    .normalize("NFC")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
  return [...clean]
    .map((character) => {
      try {
        font.encodeText(character);
        return character;
      } catch {
        return "?";
      }
    })
    .join("");
}

function renderText(
  page: PDFPage,
  element: DesignElement,
  textValue: string,
  pageHeight: number,
  font: PDFFont,
  bold: PDFFont,
) {
  const activeFont = element.fontFamily === "Helvetica" ? font : bold;
  const x = mmToPt(element.x),
    yTop = pageHeight - mmToPt(element.y),
    width = mmToPt(element.width),
    height = mmToPt(element.height);
  const clean = safePdfText(textValue || " ", activeFont);
  if (
    element.field &&
    [
      "normalPrice",
      "promotionalPrice",
      "installmentValue",
      "bundlePrice",
    ].includes(element.field) &&
    element.priceStyle === "reduced-cents"
  ) {
    const centsMap: Record<string, number | null> = {
      normalPrice: (element as any)._product?.normalPriceCents ?? null,
      promotionalPrice:
        (element as any)._product?.promotionalPriceCents ?? null,
      installmentValue:
        (element as any)._product?.installmentValueCents ?? null,
      bundlePrice: (element as any)._product?.bundlePriceCents ?? null,
    };
    const parts = priceParts(centsMap[element.field]);
    const majorSize = fitTextSize(
      parts.major,
      element.fontSize,
      element.minFontSize,
      width * 0.72,
      (value, size) => bold.widthOfTextAtSize(value, size),
    );
    const majorWidth = bold.widthOfTextAtSize(parts.major, majorSize);
    const totalWidth = majorWidth + majorSize * 0.45;
    const startX =
      element.align === "center"
        ? x + (width - totalWidth) / 2
        : element.align === "right"
          ? x + width - totalWidth
          : x;
    page.drawText(parts.major, {
      x: startX,
      y: yTop - Math.min(height, majorSize),
      size: majorSize,
      font: bold,
      color: hex(element.color),
    });
    page.drawText(parts.minor, {
      x: startX + majorWidth + 2,
      y: yTop - Math.min(height * 0.45, majorSize * 0.4),
      size: majorSize * 0.36,
      font: bold,
      color: hex(element.color),
    });
    return;
  }
  const size =
    element.textFit === "shrink"
      ? fitTextSize(
          clean,
          element.fontSize,
          element.minFontSize,
          width,
          (value, at) => activeFont.widthOfTextAtSize(value, at),
        )
      : element.fontSize;
  let lines =
    element.textFit === "wrap"
      ? wrapText(clean, size, width, (value, at) =>
          activeFont.widthOfTextAtSize(value, at),
        )
      : [clean];
  if (
    element.textFit === "truncate" &&
    activeFont.widthOfTextAtSize(clean, size) > width
  ) {
    let shortened = clean;
    while (
      shortened.length &&
      activeFont.widthOfTextAtSize(`${shortened}…`, size) > width
    )
      shortened = shortened.slice(0, -1);
    lines = [`${shortened}…`];
  }
  const lineHeight = size * 1.15;
  lines
    .slice(0, Math.max(1, Math.floor(height / lineHeight)))
    .forEach((line, index) => {
      const lineWidth = activeFont.widthOfTextAtSize(line, size);
      const lineX =
        element.align === "center"
          ? x + (width - lineWidth) / 2
          : element.align === "right"
            ? x + width - lineWidth
            : x;
      page.drawText(line, {
        x: lineX,
        y: yTop - size - index * lineHeight,
        size,
        font: activeFont,
        color: hex(element.color),
      });
    });
}

function dataUrlBytes(source: string): Uint8Array {
  const base64 = source.split(",")[1] || "";
  const binary = atob(base64);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function embedDataImage(
  pdf: PDFDocument,
  source: string,
): Promise<PDFImage> {
  const bytes = dataUrlBytes(source);
  return /^data:image\/jpe?g/i.test(source)
    ? pdf.embedJpg(bytes)
    : pdf.embedPng(bytes);
}

async function addPoster(
  pdf: PDFDocument,
  design: Design,
  product: Product,
  regular: PDFFont,
  impact: PDFFont,
) {
  const width = mmToPt(design.widthMm),
    height = mmToPt(design.heightMm);
  const page = pdf.addPage([width, height]);
  page.drawRectangle({
    x: 0,
    y: 0,
    width,
    height,
    color: hex(design.backgroundColor),
  });
  if (design.backgroundImageDataUrl) {
    try {
      const image = await embedDataImage(pdf, design.backgroundImageDataUrl);
      page.drawImage(image, { x: 0, y: 0, width, height });
    } catch {
      /* malformed imported background stays visibly absent */
    }
  }
  for (const element of design.elements.filter(
    (item) => item.visible !== false,
  )) {
    if (element.kind === "shape")
      page.drawRectangle({
        x: mmToPt(element.x),
        y: height - mmToPt(element.y + element.height),
        width: mmToPt(element.width),
        height: mmToPt(element.height),
        color: hex(element.backgroundColor || element.color),
      });
    else if (element.kind === "image" && element.source) {
      try {
        const image = await embedDataImage(pdf, element.source);
        page.drawImage(image, {
          x: mmToPt(element.x),
          y: height - mmToPt(element.y + element.height),
          width: mmToPt(element.width),
          height: mmToPt(element.height),
        });
      } catch {
        /* invalid local image is skipped */
      }
    } else if (element.kind === "qr") {
      const value = element.field
        ? getFieldValue(product, element.field)
        : element.text || " ";
      const source = await QRCode.toDataURL(value, {
        margin: 0,
        width: 512,
        errorCorrectionLevel: "M",
      });
      const image = await embedDataImage(pdf, source);
      page.drawImage(image, {
        x: mmToPt(element.x),
        y: height - mmToPt(element.y + element.height),
        width: mmToPt(element.width),
        height: mmToPt(element.height),
      });
    } else {
      const withProduct = { ...element, _product: product } as DesignElement;
      renderText(
        page,
        withProduct,
        element.kind === "dynamic" && element.field
          ? getFieldValue(product, element.field)
          : element.text || element.token || "",
        height,
        regular,
        impact,
      );
    }
  }
}

export async function createBatchPdf(
  batch: Batch,
  designs: Design[],
  fontBytesOverride?: Uint8Array,
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const uploaded = fontBytesOverride || (await loadImpactFont());
  const impact =
    typeof window === "undefined" && !fontBytesOverride
      ? await pdf.embedFont(StandardFonts.HelveticaBold)
      : await pdf.embedFont(
          uploaded
            ? uploaded instanceof Uint8Array
              ? uploaded
              : new Uint8Array(uploaded)
            : new Uint8Array(await (await fetch(antonUrl)).arrayBuffer()),
          { subset: true },
        );
  const main = designs.find((design) => design.id === batch.designId);
  if (!main) throw new Error("The selected design no longer exists.");
  const second = batch.secondDesignId
    ? designs.find((design) => design.id === batch.secondDesignId)
    : undefined;
  for (const product of batch.products.filter((item) => item.selected)) {
    for (let copy = 0; copy < batch.copies; copy += 1) {
      await addPoster(
        pdf,
        designs.find((design) => design.id === product.designId) || main,
        product,
        regular,
        impact,
      );
      if (second) await addPoster(pdf, second, product, regular, impact);
    }
  }
  pdf.setTitle(batch.name);
  pdf.setCreator("Cartaz Economix");
  return pdf.save();
}

export async function downloadBatchPdf(batch: Batch, designs: Design[]) {
  const bytes = await createBatchPdf(batch, designs);
  const blob = new Blob([bytes.slice().buffer], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${batch.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "posters"}.pdf`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
