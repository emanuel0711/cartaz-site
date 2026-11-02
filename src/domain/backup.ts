import { z } from "zod";
import type { Batch, Design, Product } from "./types";
export const BACKUP_VERSION = 1;
const backupSchema = z.object({
  schemaVersion: z.literal(BACKUP_VERSION),
  exportedAt: z.string(),
  data: z.object({
    designs: z.array(z.unknown()),
    products: z.array(z.unknown()),
    batches: z.array(z.unknown()),
    brandName: z.string().max(80),
    brandColor: z.string().regex(/^#[0-9a-f]{6}$/i),
  }),
});
export type BackupData = {
  designs: Design[];
  products: Product[];
  batches: Batch[];
  brandName: string;
  brandColor: string;
};
export function createBackup(data: BackupData) {
  return JSON.stringify(
    {
      schemaVersion: BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      data,
    },
    null,
    2,
  );
}
export function parseBackup(text: string): BackupData {
  return backupSchema.parse(JSON.parse(text)).data as BackupData;
}
