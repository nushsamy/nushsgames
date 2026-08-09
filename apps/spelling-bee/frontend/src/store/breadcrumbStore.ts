import { create } from "zustand";

/** Holds the current page's dynamic breadcrumb label (e.g. a bee's title) for AppShell to render. */
interface BreadcrumbState {
  label: string | null;
  setLabel: (label: string | null) => void;
}

export const useBreadcrumbStore = create<BreadcrumbState>((set) => ({
  label: null,
  setLabel: (label) => set({ label }),
}));
