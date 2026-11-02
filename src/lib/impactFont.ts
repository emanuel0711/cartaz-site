import {
  loadImpactFont,
  removeImpactFont,
  saveImpactFont,
} from "./indexedDbStorage";

const MAX_FONT_BYTES = 5 * 1024 * 1024;
let activeUrl: string | null = null;

export function systemImpactAvailable(): boolean {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) return false;
  context.font = "72px monospace";
  const baseline = context.measureText("WWWWiiii").width;
  context.font = "72px Impact, monospace";
  return Math.abs(context.measureText("WWWWiiii").width - baseline) > 1;
}
export async function activateStoredImpact(): Promise<
  "uploaded" | "system" | "fallback"
> {
  const bytes = await loadImpactFont();
  if (bytes) {
    if (activeUrl) URL.revokeObjectURL(activeUrl);
    activeUrl = URL.createObjectURL(new Blob([bytes], { type: "font/ttf" }));
    const face = new FontFace("Impact Uploaded", `url(${activeUrl})`);
    await face.load();
    document.fonts.add(face);
    document.documentElement.style.setProperty(
      "--poster-impact",
      '\"Impact Uploaded\", Impact, Anton, sans-serif',
    );
    return "uploaded";
  }
  document.documentElement.style.setProperty(
    "--poster-impact",
    'Impact, Anton, "Arial Narrow", sans-serif',
  );
  return systemImpactAvailable() ? "system" : "fallback";
}
export async function storeImpactFile(file: File) {
  if (file.size > MAX_FONT_BYTES)
    throw new Error("The font file must be 5 MB or smaller.");
  if (!/\.ttf$/i.test(file.name)) throw new Error("Choose a .ttf font file.");
  const bytes = await file.arrayBuffer();
  const signature = new DataView(bytes).getUint32(0, false);
  if (signature !== 0x00010000 && signature !== 0x74727565)
    throw new Error("This file is not a valid TrueType font.");
  await saveImpactFont(bytes);
  await activateStoredImpact();
}
export async function clearImpactFont() {
  await removeImpactFont();
  return activateStoredImpact();
}
