import { create } from 'zustand';
import type { MediaAsset } from './types';

type LibraryState = {
  items: MediaAsset[];
  selectedId: string | null;
  add: (asset: MediaAsset) => void;
  remove: (id: string) => void;
  select: (id: string | null) => void;
  clear: () => void;
  getById: (id: string) => MediaAsset | undefined;
};

export const useLibraryStore = create<LibraryState>((set, get) => ({
  items: [],
  selectedId: null,
  add: (asset) =>
    set((s) => ({
      items: s.items.some((i) => i.id === asset.id) ? s.items : [...s.items, asset],
      selectedId: asset.id,
    })),
  remove: (id) =>
    set((s) => ({
      items: s.items.filter((i) => i.id !== id),
      selectedId: s.selectedId === id ? null : s.selectedId,
    })),
  select: (selectedId) => set({ selectedId }),
  clear: () => set({ items: [], selectedId: null }),
  getById: (id) => get().items.find((i) => i.id === id),
}));
