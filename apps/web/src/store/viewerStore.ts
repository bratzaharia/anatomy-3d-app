import { create } from "zustand";
import { AVAILABLE_SYSTEM_IDS } from "@anatomy/data";

export type CameraView = "front" | "back" | "left" | "right" | "fit" | "focus";

interface ViewerState {
  activeSystemIds: ReadonlySet<string>;
  selectedId: string | null;
  hoveredId: string | null;
  activeRegionId: string;
  hiddenIds: ReadonlySet<string>;
  isolatedIds: ReadonlySet<string>;
  cameraCommand: { view: CameraView; nonce: number };
  leftPanelOpen: boolean;
  rightPanelOpen: boolean;
  assetStatus: "loading" | "ready" | "error";
  toggleSystem: (id: string) => void;
  replaceSystems: (ids: readonly string[]) => void;
  select: (id: string | null) => void;
  hover: (id: string | null) => void;
  setRegion: (id: string) => void;
  hideSelected: () => void;
  isolateSelected: () => void;
  restoreVisibility: () => void;
  setCameraView: (view: CameraView) => void;
  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;
}

export const useViewerStore = create<ViewerState>((set, get) => ({
  activeSystemIds: new Set(AVAILABLE_SYSTEM_IDS),
  selectedId: null,
  hoveredId: null,
  activeRegionId: "whole-body",
  hiddenIds: new Set(),
  isolatedIds: new Set(),
  cameraCommand: { view: "fit", nonce: 0 },
  leftPanelOpen: typeof window === "undefined" || window.innerWidth > 820,
  rightPanelOpen: typeof window === "undefined" || window.innerWidth > 820,
  assetStatus: "loading",
  toggleSystem: (id) =>
    set((state) => {
      const next = new Set(state.activeSystemIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { activeSystemIds: next, hoveredId: null };
    }),
  replaceSystems: (ids) =>
    set({ activeSystemIds: new Set(ids), hoveredId: null }),
  select: (id) =>
    set({ selectedId: id, rightPanelOpen: id ? true : get().rightPanelOpen }),
  hover: (id) => set({ hoveredId: id }),
  setRegion: (id) =>
    set({
      selectedId: null,
      activeRegionId: id,
      cameraCommand: {
        view: id === "whole-body" ? "fit" : "focus",
        nonce: get().cameraCommand.nonce + 1,
      },
    }),
  hideSelected: () =>
    set((state) =>
      state.selectedId
        ? {
            hiddenIds: new Set([...state.hiddenIds, state.selectedId]),
            selectedId: null,
            hoveredId: null,
          }
        : {},
    ),
  isolateSelected: () =>
    set((state) =>
      state.selectedId ? { isolatedIds: new Set([state.selectedId]) } : {},
    ),
  restoreVisibility: () =>
    set({ hiddenIds: new Set(), isolatedIds: new Set() }),
  setCameraView: (view) =>
    set((state) => ({
      cameraCommand: { view, nonce: state.cameraCommand.nonce + 1 },
    })),
  toggleLeftPanel: () =>
    set((state) => ({ leftPanelOpen: !state.leftPanelOpen })),
  toggleRightPanel: () =>
    set((state) => ({ rightPanelOpen: !state.rightPanelOpen })),
}));
