import type { Design, Product } from "./types";

const now = new Date().toISOString();

export const sampleProducts: Product[] = [
  ["Whole Milk 1L", "MILK-01", "0789123400012", 629, 499, "unit", "carton", "1 L", "Limit 6 per customer"],
  ["Premium Long Grain Rice — selected grains and a very long description to test automatic text fitting", "RICE-5", "0789123400029", 2899, 2399, "bag", "bag", "5 kg", ""],
  ["Traditional Ground Coffee", "COF-500", "0789123400036", 2290, 1899, "pack", "vacuum pack", "500 g", ""],
  ["Extra Virgin Olive Oil", "OIL-01", "0789123400043", 4590, 3990, "bottle", "glass", "500 ml", "3 installments"],
  ["Chocolate Sandwich Cookies", "COOKIE", "0789123400050", 599, 449, "pack", "pack", "130 g", "Assorted flavors"],
  ["Laundry Detergent", "SOAP-3", "0789123400067", 3690, 2990, "bottle", "bottle", "3 L", ""],
  ["Mozzarella Cheese", "CHEESE", "0789123400074", 4899, 4299, "kg", "deli", "variable weight", "Price per kg"],
  ["Sparkling Water", "WATER", "0123456789012", 399, 299, "bottle", "PET", "1.5 L", "EAN starts with zero"],
  ["Greek Yogurt Strawberry", "YOG-90", "0789123400098", 499, 399, "unit", "cup", "90 g", "Contains lactose"],
  ["Family Ice Cream", "ICE-2", "0789123400104", 2990, 2499, "tub", "tub", "2 L", "Chocolate or vanilla"],
].map((row, index) => ({
  id: `product-${index + 1}`, selected: true, description: row[0] as string, reference: row[1] as string,
  ean: row[2] as string, normalPriceCents: row[3] as number, promotionalPriceCents: row[4] as number,
  installments: index === 3 ? 3 : null, installmentValueCents: index === 3 ? 1330 : null,
  unit: row[5] as string, package: row[6] as string, size: row[7] as string, note: row[8] as string,
  bundlePriceCents: null, savingsCents: (row[3] as number) - (row[4] as number), issues: [],
}));

export const starterDesigns: Design[] = [
  {
    id: "design-green", name: "Economix Green", status: "published", widthMm: 297, heightMm: 420,
    orientation: "portrait", backgroundColor: "#f8fbf7", accentColor: "#176837", version: 1, updatedAt: now,
    elements: [
      { id: "green-band", kind: "shape", name: "Header band", x: 0, y: 0, width: 297, height: 74, rotation: 0, fontSize: 12, minFontSize: 8, fontWeight: 600, color: "#ffffff", backgroundColor: "#176837", align: "center", textFit: "shrink" },
      { id: "green-title", kind: "text", name: "Campaign", x: 22, y: 22, width: 253, height: 34, rotation: 0, text: "WEEKLY OFFER", fontSize: 29, minFontSize: 16, fontWeight: 600, color: "#ffffff", align: "center", textFit: "shrink" },
      { id: "green-description", kind: "dynamic", name: "Description", x: 24, y: 104, width: 249, height: 78, rotation: 0, field: "description", fontSize: 24, minFontSize: 12, fontWeight: 600, color: "#171a17", align: "center", textFit: "shrink" },
      { id: "green-price", kind: "dynamic", name: "Promotional price", x: 28, y: 208, width: 241, height: 112, rotation: 0, field: "promotionalPrice", fontSize: 78, minFontSize: 38, fontWeight: 600, color: "#176837", align: "center", textFit: "shrink", priceStyle: "reduced-cents" },
      { id: "green-note", kind: "dynamic", name: "Note", x: 30, y: 345, width: 237, height: 34, rotation: 0, field: "note", fontSize: 12, minFontSize: 8, fontWeight: 400, color: "#697069", align: "center", textFit: "truncate" },
    ],
  },
  {
    id: "design-yellow", name: "Price Burst", status: "template", widthMm: 210, heightMm: 297,
    orientation: "portrait", backgroundColor: "#fff8d8", accentColor: "#d43b2e", version: 1, updatedAt: now,
    elements: [
      { id: "yellow-title", kind: "text", name: "Campaign", x: 15, y: 18, width: 180, height: 40, rotation: -2, text: "LOW PRICE", fontSize: 32, minFontSize: 18, fontWeight: 600, color: "#d43b2e", align: "center", textFit: "shrink" },
      { id: "yellow-description", kind: "dynamic", name: "Description", x: 18, y: 75, width: 174, height: 62, rotation: 0, field: "description", fontSize: 20, minFontSize: 11, fontWeight: 600, color: "#171a17", align: "center", textFit: "wrap" },
      { id: "yellow-price", kind: "dynamic", name: "Promotional price", x: 12, y: 150, width: 186, height: 90, rotation: -2, field: "promotionalPrice", fontSize: 62, minFontSize: 32, fontWeight: 600, color: "#d43b2e", align: "center", textFit: "shrink", priceStyle: "reduced-cents" },
      { id: "yellow-unit", kind: "dynamic", name: "Unit", x: 30, y: 248, width: 150, height: 22, rotation: 0, field: "unit", fontSize: 10, minFontSize: 8, fontWeight: 500, color: "#5c5540", align: "center", textFit: "truncate" },
    ],
  },
  {
    id: "design-clean", name: "Clean White", status: "draft", widthMm: 210, heightMm: 297,
    orientation: "portrait", backgroundColor: "#ffffff", accentColor: "#171a17", version: 1, updatedAt: now,
    elements: [
      { id: "clean-title", kind: "text", name: "Campaign", x: 16, y: 20, width: 178, height: 26, rotation: 0, text: "SPECIAL", fontSize: 18, minFontSize: 12, fontWeight: 500, color: "#248a4b", align: "left", textFit: "shrink" },
      { id: "clean-description", kind: "dynamic", name: "Description", x: 16, y: 70, width: 178, height: 64, rotation: 0, field: "description", fontSize: 22, minFontSize: 10, fontWeight: 600, color: "#171a17", align: "left", textFit: "shrink" },
      { id: "clean-price", kind: "dynamic", name: "Promotional price", x: 16, y: 158, width: 178, height: 82, rotation: 0, field: "promotionalPrice", fontSize: 54, minFontSize: 28, fontWeight: 600, color: "#171a17", align: "left", textFit: "shrink", priceStyle: "standard" },
    ],
  },
];
