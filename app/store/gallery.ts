import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface GalleryItem {
  id: number;
  url: string;
  prompt: string;
  createdAt: string;
  title?: string;
}

interface GalleryStore {
  items: GalleryItem[];
  add: (_: Omit<GalleryItem, "id">) => void;
  remove: (_: number) => void;
  clear: () => void;
}

export const useGalleryStore = create<GalleryStore>()(
  persist(
    (set, get) => ({
      items: [],
      add(item) {
        const it = { ...item, id: Date.now() } as GalleryItem;
        set((s) => ({ items: [it, ...s.items].slice(0, 200) }));
      },
      remove(id) {
        set((s) => ({ items: s.items.filter((i) => i.id !== id) }));
      },
      clear() {
        set(() => ({ items: [] }));
      },
    }),
    { name: "gallery-store", version: 1 },
  ),
);
