import type { StateCreator } from "zustand";
import {
  toggleBrainSelection,
  type BrainMode,
  type BrainPalette,
  type BrainStyle,
} from "@anatomy/core";
import { BRAIN_IDS, BRAIN_SOURCE, brainRegionById } from "@anatomy/data";
import type { ViewerState } from "./viewerStore";

const key = "anatomy-brain-preferences-v1";
export function readBrainPreferences() {
  const empty = {
    palette: "classical" as BrainPalette,
    styles: {} as Record<string, BrainStyle>,
  };
  try {
    if (typeof window === "undefined") return empty;
    const value = JSON.parse(localStorage.getItem(key) ?? "null");
    if (
      value?.version !== 1 ||
      value.targetSha256 !== BRAIN_SOURCE.sha256 ||
      !value.styles ||
      typeof value.styles !== "object"
    )
      return empty;
    const styles: Record<string, BrainStyle> = {};
    for (const [id, raw] of Object.entries(value.styles)) {
      const style = raw as BrainStyle;
      if (!brainRegionById.has(id) || !style || typeof style !== "object")
        continue;
      styles[id] = {
        ...(typeof style.color === "string" &&
        /^#[\da-f]{6}$/i.test(style.color)
          ? { color: style.color }
          : {}),
        ...(typeof style.opacity === "number" &&
        Number.isFinite(style.opacity) &&
        style.opacity >= 0 &&
        style.opacity <= 1
          ? { opacity: style.opacity }
          : {}),
      };
    }
    return {
      styles,
      palette: ["classical", "contrast", "accessible", "custom"].includes(
        value.palette,
      )
        ? (value.palette as BrainPalette)
        : empty.palette,
    };
  } catch {
    return empty;
  }
}
export interface BrainState {
  brainMode: BrainMode;
  brainAtlasId: string;
  brainPalette: BrainPalette;
  brainStyles: Readonly<Record<string, BrainStyle>>;
  brainOpacity: number;
  brainSelectedIds: ReadonlySet<string>;
  brainSnapshot: {
    hiddenIds: ReadonlySet<string>;
    isolatedIds: ReadonlySet<string>;
  } | null;
  setBrainMode: (mode: BrainMode) => void;
  setBrainAtlas: (id: string) => void;
  setBrainPalette: (palette: BrainPalette) => void;
  selectBrain: (id: string, additive?: boolean) => void;
  toggleBrainIds: (ids: readonly string[]) => void;
  setBrainSelection: (ids: readonly string[]) => void;
  styleBrainSelection: (style: BrainStyle) => void;
  resetBrainStyles: (all?: boolean) => void;
  setBrainOpacity: (opacity: number) => void;
  hideBrainSelection: (hidden: boolean) => void;
  isolateBrainSelection: () => void;
  restoreBrainContext: () => void;
}
export const createBrainSlice: StateCreator<ViewerState, [], [], BrainState> = (
  set,
  get,
) => {
  const save = () => {
    try {
      const s = get();
      localStorage.setItem(
        key,
        JSON.stringify({
          version: 1,
          targetSha256: BRAIN_SOURCE.sha256,
          palette: s.brainPalette,
          styles: s.brainStyles,
        }),
      );
    } catch {
      /* Private browsing/storage quota never breaks anatomy controls. */
    }
  };
  const select = (ids: readonly string[]) => {
    const valid = ids.filter((id) => brainRegionById.has(id));
    set({
      brainSelectedIds: new Set(valid),
      selectedId:
        valid.at(-1) ??
        (brainRegionById.has(get().selectedId ?? "") ? null : get().selectedId),
      rightPanelOpen: true,
    });
  };
  const preferences = readBrainPreferences();
  return {
    brainMode: "natural",
    brainAtlasId: "desikan-killiany",
    brainPalette: preferences.palette,
    brainStyles: preferences.styles,
    brainOpacity: 1,
    brainSelectedIds: new Set(),
    brainSnapshot: null,
    setBrainMode: (mode) => {
      if (["natural", "regions", "atlas"].includes(mode))
        set({ brainMode: mode, hoveredId: null });
    },
    setBrainAtlas: (id) => {
      if (
        [
          "desikan-killiany",
          "destrieux",
          "hcp-mmp-1",
          "yeo-7",
          "yeo-17",
        ].includes(id)
      )
        set({ brainAtlasId: id });
    },
    setBrainPalette: (palette) => {
      if (["classical", "contrast", "accessible", "custom"].includes(palette)) {
        set({ brainPalette: palette });
        save();
      }
    },
    setBrainSelection: select,
    toggleBrainIds: (ids) =>
      select([
        ...toggleBrainSelection(
          get().brainSelectedIds,
          ids.filter((id) => brainRegionById.has(id)),
        ),
      ]),
    selectBrain: (id, additive = false) => {
      if (!brainRegionById.has(id)) return;
      if (additive) get().toggleBrainIds([id]);
      else select([id]);
    },
    styleBrainSelection: (style) => {
      if (style.color !== undefined && !/^#[\da-f]{6}$/i.test(style.color))
        return;
      if (
        style.opacity !== undefined &&
        (!Number.isFinite(style.opacity) ||
          style.opacity < 0 ||
          style.opacity > 1)
      )
        return;
      set((s) => ({
        brainStyles: {
          ...s.brainStyles,
          ...Object.fromEntries(
            [...s.brainSelectedIds].map((id) => [
              id,
              { ...s.brainStyles[id], ...style },
            ]),
          ),
        },
        ...(style.color
          ? {
              brainMode: "regions" as const,
              brainPalette:
                s.brainMode === "regions"
                  ? s.brainPalette
                  : ("custom" as const),
            }
          : {}),
        hoveredId: null,
      }));
      save();
    },
    resetBrainStyles: (all = false) => {
      set((s) => ({
        brainStyles: all
          ? {}
          : Object.fromEntries(
              Object.entries(s.brainStyles).filter(
                ([id]) => !s.brainSelectedIds.has(id),
              ),
            ),
      }));
      save();
    },
    setBrainOpacity: (opacity) => {
      if (Number.isFinite(opacity))
        set({
          brainOpacity: Math.min(1, Math.max(0, opacity)),
          hoveredId: null,
        });
    },
    hideBrainSelection: (hidden) =>
      set((s) => ({
        hiddenIds: new Set(
          hidden
            ? [...s.hiddenIds, ...s.brainSelectedIds]
            : [...s.hiddenIds].filter((id) => !s.brainSelectedIds.has(id)),
        ),
        ...(!hidden && s.isolatedIds.size
          ? { isolatedIds: new Set([...s.isolatedIds, ...s.brainSelectedIds]) }
          : {}),
        hoveredId: null,
      })),
    isolateBrainSelection: () => {
      if (get().brainSelectedIds.size)
        set((s) => ({
          brainSnapshot: s.brainSnapshot ?? {
            hiddenIds: s.hiddenIds,
            isolatedIds: s.isolatedIds,
          },
          hiddenIds: new Set(
            [...s.hiddenIds].filter((id) => !s.brainSelectedIds.has(id)),
          ),
          isolatedIds: new Set(s.brainSelectedIds),
          hoveredId: null,
        }));
    },
    restoreBrainContext: () => {
      const snapshot = get().brainSnapshot;
      if (snapshot) set({ ...snapshot, brainSnapshot: null, hoveredId: null });
    },
  };
};

export const allBrainIds = BRAIN_IDS;
