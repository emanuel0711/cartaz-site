import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";
import { sampleProducts, starterDesigns } from "./fixtures";
import { createBatchPdf } from "./pdf";
import type { Batch } from "./types";

function batch(overrides: Partial<Batch> = {}): Batch {
  return { id: "test", name: "Test batch", designId: starterDesigns[0].id, products: sampleProducts, copies: 1, outputMode: "single", status: "ready", createdAt: new Date(0).toISOString(), ...overrides };
}

describe("vector PDF generation", () => {
  it("creates one page per selected product", async () => {
    const document = await PDFDocument.load(await createBatchPdf(batch(), starterDesigns));
    expect(document.getPageCount()).toBe(10);
  });
  it("creates two pages per product when a second design is selected", async () => {
    const document = await PDFDocument.load(await createBatchPdf(batch({ secondDesignId: starterDesigns[1].id, products: sampleProducts.slice(0, 2) }), starterDesigns));
    expect(document.getPageCount()).toBe(4);
  });
});
