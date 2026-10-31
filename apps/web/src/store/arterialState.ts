import type { StateCreator } from "zustand";
import {
  traceArterial,
  type ArterialMode,
  type ArterialLevel,
  type Laterality,
} from "@anatomy/core";
import {
  ARTERIAL_GROUP_NAMES,
  ARTERIAL_EDGES,
  arterialMetadataById,
} from "@anatomy/data";
import type { ViewerState } from "./viewerStore";
interface ArterialSnapshot {
  groups: ReadonlySet<string>;
  levels: ReadonlySet<ArterialLevel>;
  sides: ReadonlySet<Laterality>;
  hidden: ReadonlySet<string>;
  isolated: ReadonlySet<string>;
  selected: string | null;
}
export interface ArterialState {
  arterialRequested: boolean;
  arterialMode: ArterialMode;
  arterialGroups: ReadonlySet<string>;
  arterialLevels: ReadonlySet<ArterialLevel>;
  arterialSides: ReadonlySet<Laterality>;
  arterialSelectedIds: ReadonlySet<string>;
  arterialTraceIds: ReadonlySet<string>;
  arterialStyles: Readonly<Record<string, string>>;
  arterialOpacity: number;
  arterialStatus: Readonly<Record<string, "loading" | "ready" | "error">>;
  arterialRetry: number;
  arterialSnapshot: ArterialSnapshot | null;
  setArterialMode: (mode: ArterialMode) => void;
  setArterialGroups: (ids: readonly string[]) => void;
  toggleArterialLevel: (id: ArterialLevel) => void;
  toggleArterialSide: (id: Laterality) => void;
  selectArtery: (id: string, additive?: boolean) => void;
  setArterialSelection: (ids: readonly string[]) => void;
  styleArterialSelection: (color: string) => void;
  resetArterialStyles: () => void;
  setArterialOpacity: (opacity: number) => void;
  setArterialStatus: (
    id: string,
    status: "loading" | "ready" | "error",
  ) => void;
  retryArterial: () => void;
  traceArtery: (direction: "origin" | "branches") => void;
  isolateArterialSelection: () => void;
  restoreArterial: () => void;
}
const toggle = <T>(set: ReadonlySet<T>, id: T) => {
  const next = new Set(set);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
};
export const createArterialSlice: StateCreator<
  ViewerState,
  [],
  [],
  ArterialState
> = (set, get) => ({
  arterialRequested: false,
  arterialMode: "natural",
  arterialGroups: new Set(Object.keys(ARTERIAL_GROUP_NAMES)),
  arterialLevels: new Set(["major"]),
  arterialSides: new Set(),
  arterialSelectedIds: new Set(),
  arterialTraceIds: new Set(),
  arterialStyles: {},
  arterialOpacity: 1,
  arterialStatus: {},
  arterialRetry: 0,
  arterialSnapshot: null,
  setArterialMode: (mode) => {
    if (["natural", "colors", "pathways"].includes(mode))
      set({ arterialMode: mode, hoveredId: null });
  },
  setArterialGroups: (ids) =>
    set({
      arterialGroups: new Set(ids.filter((id) => id in ARTERIAL_GROUP_NAMES)),
      hoveredId: null,
    }),
  toggleArterialLevel: (id) => {
    if (["major", "named", "fine"].includes(id))
      set((s) => ({
        arterialLevels: toggle(s.arterialLevels, id),
        hoveredId: null,
      }));
  },
  toggleArterialSide: (id) => {
    if (["left", "right", "midline", "bilateral", "none"].includes(id))
      set((s) => ({
        arterialSides: toggle(s.arterialSides, id),
        hoveredId: null,
      }));
  },
  setArterialSelection: (ids) => {
    const valid = ids.filter((id) => arterialMetadataById.has(id));
    set({
      arterialSelectedIds: new Set(valid),
      selectedId: valid.at(-1) ?? null,
      rightPanelOpen: true,
    });
  },
  selectArtery: (id, additive = false) => {
    if (!arterialMetadataById.has(id)) return;
    const ids = additive
      ? toggle(get().arterialSelectedIds, id)
      : new Set([id]);
    get().setArterialSelection([...ids]);
  },
  styleArterialSelection: (color) => {
    if (/^#[\da-f]{6}$/i.test(color))
      set((s) => ({
        arterialStyles: {
          ...s.arterialStyles,
          ...Object.fromEntries(
            [...s.arterialSelectedIds].map((id) => [id, color]),
          ),
        },
        arterialMode: "colors",
      }));
  },
  resetArterialStyles: () =>
    set({
      arterialStyles: {},
      arterialMode: "natural",
      arterialOpacity: 1,
      hoveredId: null,
    }),
  setArterialOpacity: (value) => {
    if (Number.isFinite(value))
      set({
        arterialOpacity: Math.max(0, Math.min(1, value)),
        hoveredId: null,
      });
  },
  setArterialStatus: (id, status) =>
    set((s) => ({ arterialStatus: { ...s.arterialStatus, [id]: status } })),
  retryArterial: () => set((s) => ({ arterialRetry: s.arterialRetry + 1 })),
  traceArtery: (direction) => {
    const s = get();
    if (!s.selectedId || !arterialMetadataById.has(s.selectedId)) return;
    const ids = traceArterial(s.selectedId, ARTERIAL_EDGES, direction),
      groups = new Set(s.arterialGroups),
      levels = new Set(s.arterialLevels);
    for (const id of ids) {
      const m = arterialMetadataById.get(id);
      if (m) {
        groups.add(m.group);
        levels.add(m.level);
      }
    }
    set({
      arterialSnapshot: s.arterialSnapshot ?? {
        groups: s.arterialGroups,
        levels: s.arterialLevels,
        sides: s.arterialSides,
        hidden: s.hiddenIds,
        isolated: s.isolatedIds,
        selected: s.selectedId,
      },
      arterialMode: "pathways",
      arterialGroups: groups,
      arterialLevels: levels,
      arterialSides: new Set(),
      arterialTraceIds: new Set(ids),
      hiddenIds: new Set([...s.hiddenIds].filter((id) => !ids.includes(id))),
      isolatedIds: new Set(),
      hoveredId: null,
    });
  },
  isolateArterialSelection: () => {
    const s = get();
    if (!s.arterialSelectedIds.size) return;
    const groups = new Set(s.arterialGroups),
      levels = new Set(s.arterialLevels);
    for (const id of s.arterialSelectedIds) {
      const m = arterialMetadataById.get(id)!;
      groups.add(m.group);
      levels.add(m.level);
    }
    set({
      arterialSnapshot: s.arterialSnapshot ?? {
        groups: s.arterialGroups,
        levels: s.arterialLevels,
        sides: s.arterialSides,
        hidden: s.hiddenIds,
        isolated: s.isolatedIds,
        selected: s.selectedId,
      },
      arterialGroups: groups,
      arterialLevels: levels,
      arterialSides: new Set(),
      isolatedIds: new Set(s.arterialSelectedIds),
      hiddenIds: new Set(
        [...s.hiddenIds].filter((id) => !s.arterialSelectedIds.has(id)),
      ),
      hoveredId: null,
    });
  },
  restoreArterial: () => {
    const s = get(),
      p = s.arterialSnapshot;
    set({
      ...(p
        ? {
            arterialGroups: p.groups,
            arterialLevels: p.levels,
            arterialSides: p.sides,
            hiddenIds: p.hidden,
            isolatedIds: p.isolated,
            selectedId: p.selected,
          }
        : {}),
      arterialSnapshot: null,
      arterialTraceIds: new Set(),
      hoveredId: null,
    });
  },
});
