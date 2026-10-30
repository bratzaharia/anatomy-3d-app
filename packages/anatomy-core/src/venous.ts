import {
  resolveVisibleStructureIds,
  type AnatomicalStructure,
  type VisibilityOverrides,
} from "./index";
export type VenousDepth = "superficial" | "deep" | "perforating" | "unknown";
export type VenousCategory =
  "vein" | "dural-sinus" | "cardiac-sinus" | "plexus" | "microanatomy";
export type VenousTerritory = "systemic" | "portal" | "pulmonary" | "cardiac";
export type VenousViewMode = "standard" | "blue" | "depth" | "contrast";
export interface VenousStructure extends AnatomicalStructure {
  readonly venousGroup: string;
  readonly venousCategory: VenousCategory;
  readonly depth: VenousDepth;
  readonly territory: VenousTerritory;
}
export interface VenousFilters {
  readonly groups: ReadonlySet<string>;
  readonly depths: ReadonlySet<VenousDepth>;
  readonly regions: ReadonlySet<string>;
}
export interface VenousConnection {
  readonly from: string;
  readonly to: string;
  readonly relation: "drains-into" | "microcirculatory-transition";
  readonly sourceUrl: string;
  readonly validationStatus: "unverified" | "reviewed";
}
// OR within each facet; AND across facets. No groups = no veins; empty depth
// and region sets = unrestricted. Unknown depth is never guessed from a name.
export function resolveVenousStructureIds(
  structures: readonly VenousStructure[],
  systems: ReadonlySet<string>,
  overrides: VisibilityOverrides,
  filters: VenousFilters,
): ReadonlySet<string> {
  const eligible = resolveVisibleStructureIds(structures, systems, overrides);
  return new Set(
    structures
      .filter(
        (s) =>
          eligible.has(s.id) &&
          filters.groups.has(s.venousGroup) &&
          (!filters.depths.size || filters.depths.has(s.depth)) &&
          (!filters.regions.size ||
            s.regionIds.some((r) => filters.regions.has(r))),
      )
      .map((s) => s.id),
  );
}
export function traceVenousDrainage(
  id: string,
  edges: readonly VenousConnection[],
): readonly string[] {
  const visited = new Set<string>(),
    queue = [id];
  while (queue.length) {
    const node = queue.shift()!;
    if (visited.has(node)) continue;
    visited.add(node);
    for (const edge of edges) if (edge.from === node) queue.push(edge.to);
  }
  return [...visited];
}
export function validateVenousConnections(
  ids: ReadonlySet<string>,
  edges: readonly VenousConnection[],
): readonly string[] {
  const errors: string[] = [],
    seen = new Set<string>();
  for (const e of edges) {
    const key = `${e.from}:${e.to}:${e.relation}`;
    if (!ids.has(e.from) || !ids.has(e.to))
      errors.push("Unknown venous endpoint: " + key);
    if (e.from === e.to || seen.has(key))
      errors.push("Duplicate/self venous edge: " + key);
    if (!e.sourceUrl.startsWith("https://"))
      errors.push("Unsourced venous edge: " + key);
    seen.add(key);
  }
  const visiting = new Set<string>(),
    visited = new Set<string>();
  function visit(id: string) {
    if (visiting.has(id)) {
      errors.push("Directed drainage cycle: " + id);
      return;
    }
    if (visited.has(id)) return;
    visiting.add(id);
    for (const e of edges) if (e.from === id) visit(e.to);
    visiting.delete(id);
    visited.add(id);
  }
  for (const id of ids) visit(id);
  return errors;
}
