import type { StateCreator } from "zustand";
import type { CardiacMode, CardiacGroup } from "@anatomy/core";
import {
  CARDIAC_STRUCTURES,
  cardiacMetadataById,
  CARDIAC_GROUP_NAMES,
} from "@anatomy/data";
import type { ViewerState } from "./viewerStore";
export interface CardiacState {
  cardiacEnabled: boolean;
  cardiacRequested: boolean;
  cardiacMode: CardiacMode;
  cardiacGroups: ReadonlySet<CardiacGroup>;
  cardiacSelectedIds: ReadonlySet<string>;
  cardiacStyles: Readonly<Record<string, string>>;
  cardiacOpacity: number;
  cardiacWallOpacity: number;
  cardiacClip: boolean;
  cardiacClipLevel: number;
  cardiacStatus: Readonly<Record<string, "loading" | "ready" | "error">>;
  cardiacRetry: number;
  setCardiacEnabled: (enabled: boolean) => void;
  setCardiacMode: (mode: CardiacMode) => void;
  toggleCardiacGroup: (group: CardiacGroup) => void;
  selectCardiac: (id: string, additive?: boolean) => void;
  toggleCardiacSelection: (ids: readonly string[]) => void;
  setCardiacSelection: (ids: readonly string[]) => void;
  styleCardiacSelection: (color: string) => void;
  resetCardiacStyles: () => void;
  setCardiacOpacity: (value: number) => void;
  setCardiacWallOpacity: (value: number) => void;
  setCardiacClip: (enabled: boolean) => void;
  setCardiacClipLevel: (value: number) => void;
  setCardiacStatus: (id: string, status: "loading" | "ready" | "error") => void;
  retryCardiac: () => void;
  revealCardiacPath: (ids: readonly string[]) => void;
  isolateCardiacSelection: () => void;
}
export const createCardiacSlice: StateCreator<
  ViewerState,
  [],
  [],
  CardiacState
> = (set, get) => ({
  cardiacEnabled: false,
  cardiacRequested: false,
  cardiacMode: "natural",
  cardiacGroups: new Set(["walls"]),
  cardiacSelectedIds: new Set(),
  cardiacStyles: {},
  cardiacOpacity: 1,
  cardiacWallOpacity: 1,
  cardiacClip: false,
  cardiacClipLevel: 0.5,
  cardiacStatus: {},
  cardiacRetry: 0,
  isolateCardiacSelection: () => {
    const s = get(),
      groups = new Set(s.cardiacGroups);
    if (!s.cardiacSelectedIds.size) return;
    for (const id of s.cardiacSelectedIds)
      groups.add(cardiacMetadataById.get(id)!.group);
    set({
      cardiacEnabled: true,
      cardiacRequested: true,
      cardiacGroups: groups,
      hiddenIds: new Set(
        [...s.hiddenIds].filter((id) => !s.cardiacSelectedIds.has(id)),
      ),
      isolatedIds: new Set(s.cardiacSelectedIds),
      hoveredId: null,
    });
  },
  setCardiacEnabled: (enabled) =>
    set((s) => ({
      cardiacEnabled: enabled,
      cardiacRequested: s.cardiacRequested || enabled,
      hoveredId: null,
      rightPanelOpen: true,
    })),
  setCardiacMode: (mode) => {
    if (["natural", "colors", "connections"].includes(mode))
      set({ cardiacMode: mode, hoveredId: null });
  },
  toggleCardiacGroup: (group) => {
    if (!(group in CARDIAC_GROUP_NAMES)) return;
    const groups = new Set(get().cardiacGroups);
    if (groups.has(group)) groups.delete(group);
    else groups.add(group);
    set({ cardiacGroups: groups, hoveredId: null });
  },
  setCardiacSelection: (ids) => {
    const valid = ids.filter((id) => cardiacMetadataById.has(id));
    set({
      cardiacSelectedIds: new Set(valid),
      selectedId: valid.at(-1) ?? null,
      rightPanelOpen: true,
    });
  },
  selectCardiac: (id, additive = false) => {
    if (!cardiacMetadataById.has(id)) return;
    if (additive) get().toggleCardiacSelection([id]);
    else get().setCardiacSelection([id]);
  },
  toggleCardiacSelection: (ids) => {
    const next = new Set(get().cardiacSelectedIds),
      valid = ids.filter((id) => cardiacMetadataById.has(id));
    const all = valid.every((id) => next.has(id));
    for (const id of valid)
      if (all) next.delete(id);
      else next.add(id);
    get().setCardiacSelection([...next]);
  },
  styleCardiacSelection: (color) => {
    if (!/^#[\da-f]{6}$/i.test(color)) return;
    set((s) => ({
      cardiacStyles: {
        ...s.cardiacStyles,
        ...Object.fromEntries(
          [...s.cardiacSelectedIds].map((id) => [id, color]),
        ),
      },
      cardiacMode: "colors",
    }));
  },
  resetCardiacStyles: () =>
    set({
      cardiacStyles: {},
      cardiacOpacity: 1,
      cardiacWallOpacity: 1,
      cardiacClip: false,
      cardiacMode: "natural",
      hoveredId: null,
    }),
  setCardiacOpacity: (value) => {
    if (Number.isFinite(value))
      set({ cardiacOpacity: Math.min(1, Math.max(0, value)), hoveredId: null });
  },
  setCardiacWallOpacity: (value) => {
    if (Number.isFinite(value))
      set({
        cardiacWallOpacity: Math.min(1, Math.max(0, value)),
        hoveredId: null,
      });
  },
  setCardiacClip: (enabled) => set({ cardiacClip: enabled, hoveredId: null }),
  setCardiacClipLevel: (value) => {
    if (Number.isFinite(value))
      set({
        cardiacClipLevel: Math.min(1, Math.max(0, value)),
        hoveredId: null,
      });
  },
  setCardiacStatus: (id, status) =>
    set((s) => ({ cardiacStatus: { ...s.cardiacStatus, [id]: status } })),
  retryCardiac: () => set((s) => ({ cardiacRetry: s.cardiacRetry + 1 })),
  revealCardiacPath: (ids) => {
    // Explicit contextual show: preserve unrelated globally enabled systems,
    // clear isolation through the existing central action, then reveal targets.
    const s = get(),
      groups = new Set(s.cardiacGroups);
    for (const part of CARDIAC_STRUCTURES)
      if (ids.includes(part.id) || ids.includes(part.parentId ?? ""))
        groups.add(part.cardiacGroup);
    const parts = CARDIAC_STRUCTURES.filter(
      (p) => ids.includes(p.id) || ids.includes(p.parentId ?? ""),
    );
    s.setStructuresHidden([...ids, ...parts.map((p) => p.id)], false);
    const systems = new Set(s.activeSystemIds);
    if (ids.some((id) => id.startsWith("venous-"))) systems.add("venous");
    s.replaceSystems([...systems]);
    set({
      cardiacEnabled: true,
      cardiacRequested: true,
      cardiacGroups: groups,
      cardiacMode: "connections",
      cardiacSelectedIds: new Set(parts.map((p) => p.id)),
      rightPanelOpen: true,
    });
    // Explicitly restore all venous facets; semantic paths do not weld endpoints.
    s.setAllVenousGroups(true);
  },
});
