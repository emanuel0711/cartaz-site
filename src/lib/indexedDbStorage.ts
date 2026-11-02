import type { StateStorage } from "zustand/middleware";
import { z } from "zod";

const DB_NAME = "cartaz-economix";
const STORE_NAME = "app-state";
const envelopeSchema = z.object({
  version: z.number(),
  state: z
    .object({
      designs: z.array(z.unknown()),
      products: z.array(z.unknown()),
      batches: z.array(z.unknown()),
      brandName: z.string(),
      brandColor: z.string(),
    })
    .passthrough(),
});

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () =>
      request.result.createObjectStore(STORE_NAME);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function transact<T>(
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, mode);
    const request = action(transaction.objectStore(STORE_NAME));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => db.close();
  });
}

export const indexedDbStorage: StateStorage = {
  getItem: async (name) => {
    try {
      const stored = await transact<string | undefined>("readonly", (store) =>
        store.get(name),
      );
      const legacy = localStorage.getItem(name);
      const candidate = stored ?? legacy;
      if (!candidate) return null;
      envelopeSchema.parse(JSON.parse(candidate));
      if (!stored && legacy)
        await transact("readwrite", (store) => store.put(legacy, name));
      return candidate;
    } catch (error) {
      console.warn("Local data was ignored because validation failed.", error);
      return null;
    }
  },
  setItem: async (name, value) => {
    envelopeSchema.parse(JSON.parse(value));
    await transact("readwrite", (store) => store.put(value, name));
  },
  removeItem: async (name) => {
    await transact("readwrite", (store) => store.delete(name));
    localStorage.removeItem(name);
  },
};

const FONT_KEY = "impact-font";
export async function saveImpactFont(bytes: ArrayBuffer) {
  await transact("readwrite", (store) => store.put(bytes, FONT_KEY));
}
export async function loadImpactFont(): Promise<ArrayBuffer | null> {
  if (typeof indexedDB === "undefined") return null;
  return (
    (await transact<ArrayBuffer | undefined>("readonly", (store) =>
      store.get(FONT_KEY),
    )) ?? null
  );
}
export async function removeImpactFont() {
  await transact("readwrite", (store) => store.delete(FONT_KEY));
}
