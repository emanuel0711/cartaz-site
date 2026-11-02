import { describe, expect, it } from "vitest";
import { parseMoney } from "./format";
import { mapRows, parseCsv, validateProduct } from "./products";

describe("money parsing", () => {
  it.each([
    ["9,99", 999],
    ["1.000,00", 100000],
    ["1,000.00", 100000],
    [0.99, 99],
  ])("parses %s", (value, expected) =>
    expect(parseMoney(value)).toBe(expected),
  );
});

describe("spreadsheet import", () => {
  it("preserves leading-zero EAN values when the cell is text", () => {
    const product = mapRows([
      ["DESCRIPTION", "EAN", "PROMOTIONAL PRICE"],
      ["Water", "0123456789012", "2.99"],
    ])[0];
    expect(product.ean).toBe("0123456789012");
    expect(
      product.issues.filter((issue) => issue.level === "error"),
    ).toHaveLength(0);
  });
  it("parses quoted CSV values", () =>
    expect(parseCsv('DESCRIPTION,NOTE\n"Rice, premium","A, B"')[1]).toEqual([
      "Rice, premium",
      "A, B",
    ]));
  it("detects the delimiter without splitting Brazilian decimal commas", () =>
    expect(parseCsv("DESCRIPTION;PROMOTIONAL PRICE\nRice;9,99")[1]).toEqual([
      "Rice",
      "9,99",
    ]));
  it("converts scientific-notation EAN text when it remains a safe integer", () =>
    expect(
      mapRows([
        ["DESCRIPTION", "EAN", "PROMOTIONAL PRICE"],
        ["Rice", "7.89E+12", "9,99"],
      ])[0].ean,
    ).toBe("7890000000000"));
  it("rejects duplicate mapped headers", () =>
    expect(() =>
      mapRows([
        ["DESCRIPTION", "DESCRICAO", "PROMOTIONAL PRICE"],
        ["A", "B", "1"],
      ]),
    ).toThrow(/duplicate/i));
  it("reports required values", () =>
    expect(
      validateProduct({
        ...mapRows([
          ["DESCRIPTION", "PROMOTIONAL PRICE", "REFERENCE"],
          ["", "", "X"],
        ])[0],
        description: "",
        promotionalPriceCents: null,
      }),
    ).toHaveLength(2));
});
