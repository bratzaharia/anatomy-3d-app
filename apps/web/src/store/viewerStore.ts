import { create } from "zustand";
import type { NervousDivision, NervousFunction } from "@anatomy/core";
import {
  AVAILABLE_SYSTEM_IDS,
  NERVOUS_GEOMETRY,
  SKULL_VISUALIZATION_MODES,
  type SkullViewMode,
} from "@anatomy/data";

export type CameraView = "front" | "back" | "left" | "right" | "fit" | "focus";

interface ViewerState {
  nervousStatus: "idle" | "loading" | "ready" | "error";
  nervousRequested: boolean;
  nervousRetry: number;
  nervousIsolationSnapshot: {
    hiddenIds: ReadonlySet<string>;
    isolatedIds: ReadonlySet<string>;
    nervousDivisions: ReadonlySet<NervousDivision>;
    nervousFunctions: ReadonlySet<NervousFunction>;
    nervousRegions: ReadonlySet<string>;
  } | null;
  inspectNervousSystem: () => void;
  retryNervous: () => void;
  nervousDivisions: ReadonlySet<NervousDivision>;
  nervousFunctions: ReadonlySet<NervousFunction>;
  nervousRegions: ReadonlySet<string>;
  toggleNervousDivision: (id: NervousDivision) => void;
  toggleNervousFunction: (id: NervousFunction) => void;
  toggleNervousRegion: (id: string) => void;
  resetNervousFilters: () => void;
  skullViewMode: SkullViewMode;
  setSkullViewMode: (mode: SkullViewMode) => void;
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
  nervousStatus: "idle",
  nervousRequested: false,
  nervousRetry: 0,
  nervousIsolationSnapshot: null,
  inspectNervousSystem: () =>
    set((state) => {
      if (!state.activeSystemIds.has("nervous")) return {};
      return {
        nervousIsolationSnapshot: state.nervousIsolationSnapshot ?? {
          hiddenIds: state.hiddenIds,
          isolatedIds: state.isolatedIds,
          nervousDivisions: state.nervousDivisions,
          nervousFunctions: state.nervousFunctions,
          nervousRegions: state.nervousRegions,
        },
        hiddenIds: new Set(
          [...state.hiddenIds].filter((id) => !id.startsWith("nervous-")),
        ),
        isolatedIds: new Set([
          "nervous-brain",
          ...NERVOUS_GEOMETRY.map((item) => item.id),
        ]),
        nervousDivisions: new Set<NervousDivision>([
          "cns",
          "pns",
          "associated",
        ]),
        nervousFunctions: new Set<NervousFunction>(),
        nervousRegions: new Set<string>(),
        selectedId: null,
        hoveredId: null,
        rightPanelOpen: true,
        cameraCommand: { view: "fit", nonce: state.cameraCommand.nonce + 1 },
      };
    }),
  retryNervous: () =>
    set((state) => ({
      nervousRetry: state.nervousRetry + 1,
      nervousStatus: "loading",
    })),
  nervousDivisions: new Set(["cns", "pns", "associated"]),
  nervousFunctions: new Set(),
  nervousRegions: new Set(),
  toggleNervousDivision: (id) =>
    set((state) => ({
      nervousDivisions: toggled(state.nervousDivisions, id),
      hoveredId: null,
    })),
  toggleNervousFunction: (id) =>
    set((state) => ({
      nervousFunctions: toggled(state.nervousFunctions, id),
      hoveredId: null,
    })),
  toggleNervousRegion: (id) =>
    set((state) => ({
      nervousRegions: toggled(state.nervousRegions, id),
      hoveredId: null,
    })),
  resetNervousFilters: () =>
    set({
      nervousDivisions: new Set(["cns", "pns", "associated"]),
      nervousFunctions: new Set(),
      nervousRegions: new Set(),
      hoveredId: null,
    }),
  skullViewMode: "simple",
  setSkullViewMode: (mode) => {
    if (
      !SKULL_VISUALIZATION_MODES.some(
        (item) => item.id === mode && item.implemented,
      )
    )
      return;
    set({ skullViewMode: mode, hoveredId: null });
  },
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
        nervousRequested: state.nervousRequested || next.has("nervous"),
        nervousStatus:
          !state.nervousRequested && next.has("nervous")
            ? "loading"
            : state.nervousStatus,
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
      nervousRequested: state.nervousRequested || ids.includes("nervous"),
      nervousStatus:
        !state.nervousRequested && ids.includes("nervous")
          ? "loading"
          : state.nervousStatus,
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
      state.selectedId
        ? {
            isolatedIds: new Set([state.selectedId]),
            ...(state.selectedId.startsWith("nervous-") &&
            !state.nervousIsolationSnapshot
              ? {
                  nervousIsolationSnapshot: {
                    hiddenIds: state.hiddenIds,
                    isolatedIds: state.isolatedIds,
                    nervousDivisions: state.nervousDivisions,
                    nervousFunctions: state.nervousFunctions,
                    nervousRegions: state.nervousRegions,
                  },
                }
              : {}),
            ...(!state.selectedId.startsWith("nervous-")
              ? { nervousIsolationSnapshot: null }
              : {}),
          }
        : {},
    ),
  restoreVisibility: () =>
    set((state) =>
      state.nervousIsolationSnapshot
        ? { ...state.nervousIsolationSnapshot, nervousIsolationSnapshot: null }
        : { hiddenIds: new Set(), isolatedIds: new Set() },
    ),
  setCameraView: (view) =>
    set((state) => ({
      cameraCommand: { view, nonce: state.cameraCommand.nonce + 1 },
    })),
  toggleLeftPanel: () =>
    set((state) => ({ leftPanelOpen: !state.leftPanelOpen })),
  toggleRightPanel: () =>
    set((state) => ({ rightPanelOpen: !state.rightPanelOpen })),
}));

function toggled<T>(values: ReadonlySet<T>, id: T): ReadonlySet<T> {
  const next = new Set(values);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}
