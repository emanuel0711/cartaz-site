import { create } from "zustand";
import { persist } from "zustand/middleware";
import { sampleProducts, starterDesigns } from "../domain/fixtures";
import type { Batch, Design, Product } from "../domain/types";
import { newId } from "../lib/id";

interface AppState {
  designs: Design[];
  products: Product[];
  batches: Batch[];
  brandName: string;
  brandColor: string;
  setProducts: (products: Product[]) => void;
  updateProduct: (id: string, patch: Partial<Product>) => void;
  removeProduct: (id: string) => void;
  addDesign: (design: Design) => void;
  updateDesign: (id: string, update: Partial<Design>) => void;
  duplicateDesign: (id: string) => string;
  archiveDesign: (id: string) => void;
  addBatch: (batch: Batch) => void;
  setBrand: (name: string, color: string) => void;
  resetDemo: () => void;
}

export const useAppStore = create<AppState>()(persist((set, get) => ({
  designs: starterDesigns,
  products: sampleProducts,
  batches: [],
  brandName: "Cartaz Economix",
  brandColor: "#248a4b",
  setProducts: (products) => set({ products }),
  updateProduct: (id, patch) => set((state) => ({ products: state.products.map((product) => product.id === id ? { ...product, ...patch } : product) })),
  removeProduct: (id) => set((state) => ({ products: state.products.filter((product) => product.id !== id) })),
  addDesign: (design) => set((state) => ({ designs: [design, ...state.designs] })),
  updateDesign: (id, update) => set((state) => ({ designs: state.designs.map((design) => design.id === id ? { ...design, ...update, version: design.version + 1, updatedAt: new Date().toISOString() } : design) })),
  duplicateDesign: (id) => {
    const source = get().designs.find((design) => design.id === id);
    if (!source) return id;
    const nextId = newId();
    set((state) => ({ designs: [{ ...source, id: nextId, name: `${source.name} copy`, status: "draft", version: 1, updatedAt: new Date().toISOString(), elements: source.elements.map((element) => ({ ...element, id: newId() })) }, ...state.designs] }));
    return nextId;
  },
  archiveDesign: (id) => set((state) => ({ designs: state.designs.filter((design) => design.id !== id) })),
  addBatch: (batch) => set((state) => ({ batches: [batch, ...state.batches].slice(0, 25) })),
  setBrand: (brandName, brandColor) => set({ brandName, brandColor }),
  resetDemo: () => set({ designs: starterDesigns, products: sampleProducts, batches: [], brandName: "Cartaz Economix", brandColor: "#248a4b" }),
}), { name: "cartaz-economix-preview-data", version: 2 }));
