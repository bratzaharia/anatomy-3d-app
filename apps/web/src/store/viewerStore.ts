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
  muscleStatus: "idle" | "loading" | "ready" | "error";
  muscleRequested: boolean;
  muscleRetry: number;
  muscleOpacity: number;
  setMuscleOpacity: (opacity: number) => void;
  retryMuscles: () => void;
  setStructuresHidden: (ids: readonly string[], hidden: boolean) => void;
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
  activeSystemIds: new Set(["skeletal"]),
  selectedId: null,
  hoveredId: null,
  activeRegionId: "whole-body",
  hiddenIds: new Set(),
  isolatedIds: new Set(),
  cameraCommand: { view: "fit", nonce: 0 },
  leftPanelOpen: typeof window === "undefined" || window.innerWidth > 820,
  rightPanelOpen: typeof window === "undefined" || window.innerWidth > 820,
  assetStatus: "loading",
  muscleStatus: "idle",
  muscleRequested: false,
  muscleRetry: 0,
  muscleOpacity: 1,
  setMuscleOpacity: (opacity) =>
    set({ muscleOpacity: Math.max(0, Math.min(1, opacity)), hoveredId: null }),
  retryMuscles: () =>
    set((state) => ({
      muscleRetry: state.muscleRetry + 1,
      muscleStatus: "loading",
    })),
  setStructuresHidden: (ids, hidden) =>
    set((state) => ({
      hiddenIds: hidden
        ? new Set([...state.hiddenIds, ...ids])
        : new Set([...state.hiddenIds].filter((id) => !ids.includes(id))),
      // Explicit show exits isolation, but never enables a globally disabled layer.
      isolatedIds: hidden ? state.isolatedIds : new Set(),
      hoveredId: null,
    })),
  toggleSystem: (id) =>
    set((state) => {
      if (!AVAILABLE_SYSTEM_IDS.includes(id)) return {};
      const next = new Set(state.activeSystemIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return {
        activeSystemIds: next,
        hoveredId: null,
        muscleRequested: state.muscleRequested || next.has("muscular"),
        muscleStatus:
          !state.muscleRequested && next.has("muscular")
            ? "loading"
            : state.muscleStatus,
      };
    }),
  replaceSystems: (ids) =>
    set((state) => ({
      activeSystemIds: new Set(
        ids.filter((id) => AVAILABLE_SYSTEM_IDS.includes(id)),
      ),
      hoveredId: null,
      muscleRequested: state.muscleRequested || ids.includes("muscular"),
      muscleStatus:
        !state.muscleRequested && ids.includes("muscular")
          ? "loading"
          : state.muscleStatus,
    })),
  select: (id) =>
    set({ selectedId: id, rightPanelOpen: id ? true : get().rightPanelOpen }),
  hover: (id) => {
    if (get().hoveredId !== id) set({ hoveredId: id });
  },
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
