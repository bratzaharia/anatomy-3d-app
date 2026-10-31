import type { AnatomicalStructure } from "@anatomy/core";
import { MUSCLE_INVENTORY } from "./muscles";
import { NERVOUS_INVENTORY, NERVOUS_ASSET } from "./nervous";
import { VENOUS_INVENTORY } from "./venous";
import { ARTERIAL_COVERAGE } from "./arterial";
export type CoverageStatus = "individual" | "set" | "grouped-only" | "missing";
export type CoverageReason =
  | "source-gap"
  | "grouped-only"
  | "side-conflict"
  | "spinal-quarantine"
  | "source-policy";
export type CoverageSystem =
  "skeletal" | "muscular" | "nervous" | "venous" | "arterial";
export interface CoverageEntry {
  readonly structure: AnatomicalStructure;
  readonly system: CoverageSystem;
  readonly status: CoverageStatus;
  readonly reason: CoverageReason | null;
}
const sideConflicts = new Set([
  "muscle-flexor-pollicis-brevis-left",
  "muscle-flexor-pollicis-brevis-right",
  "muscle-middle-pharyngeal-constrictor-left",
  "muscle-middle-pharyngeal-constrictor-right",
]);
const originalSourceIds = new Set(
  NERVOUS_ASSET.inventory.filter((n) => n.assetId).map((n) => n.id),
);
export function createCoverageInventory(
  catalog: readonly AnatomicalStructure[],
): readonly CoverageEntry[] {
  const byId = new Map(catalog.map((s) => [s.id, s]));
  return [
    ...ARTERIAL_COVERAGE.map((s) => ({
      structure: byId.get(s.id)!,
      system: "arterial" as const,
      status: s.geometry,
      reason: s.selectable ? null : ("source-gap" as const),
    })),
    ...catalog
      .filter(
        (s) => s.systemIds.includes("skeletal") && s.structureType === "bone",
      )
      .map((structure) => ({
        structure,
        system: "skeletal" as const,
        status:
          structure.status === "available"
            ? ("individual" as const)
            : ("missing" as const),
        reason:
          structure.status === "available" ? null : ("source-gap" as const),
      })),
    ...MUSCLE_INVENTORY.map((m) => ({
      structure: byId.get(m.id)!,
      system: "muscular" as const,
      status: (
        {
          independent: "individual",
          grouped: "set",
          "grouped-only": "grouped-only",
          missing: "missing",
        } as const
      )[m.mappingStatus],
      reason:
        m.mappingStatus === "grouped-only"
          ? ("grouped-only" as const)
          : m.mappingStatus === "missing"
            ? sideConflicts.has(m.id)
              ? ("side-conflict" as const)
              : ("source-gap" as const)
            : null,
    })),
    ...NERVOUS_INVENTORY.map((n) => ({
      structure: byId.get(n.id)!,
      system: "nervous" as const,
      status: (
        {
          individual: "individual",
          grouped: "set",
          unavailable: "missing",
        } as const
      )[n.geometryStatus],
      reason:
        n.geometryStatus !== "unavailable"
          ? null
          : n.id === "nervous-spinal-cord"
            ? ("spinal-quarantine" as const)
            : originalSourceIds.has(n.id)
              ? ("source-policy" as const)
              : ("source-gap" as const),
    })),
    ...VENOUS_INVENTORY.map((v) => ({
      structure: byId.get(v.id)!,
      system: "venous" as const,
      status:
        v.geometryStatus === "individual"
          ? ("individual" as const)
          : v.geometryStatus === "grouped"
            ? ("set" as const)
            : ("missing" as const),
      reason: v.assetId ? null : ("source-gap" as const),
    })),
  ];
}
export function summarizeCoverage(entries: readonly CoverageEntry[]) {
  return {
    total: entries.length,
    individual: entries.filter((e) => e.status === "individual").length,
    sets: entries.filter((e) => e.status === "set").length,
    groupedOnly: entries.filter((e) => e.status === "grouped-only").length,
    missing: entries.filter((e) => e.status === "missing").length,
  };
}
