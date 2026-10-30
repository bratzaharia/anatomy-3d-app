import {
  resolveVisibleStructureIds,
  type AnatomicalStructure,
  type VisibilityOverrides,
} from "./index";
export type CardiacMode = "natural" | "colors" | "connections";
export type CardiacGroup =
  | "walls"
  | "cavities"
  | "valves"
  | "papillary"
  | "coronary-arteries"
  | "great-arteries";
export interface CardiacStructure extends AnatomicalStructure {
  readonly cardiacGroup: CardiacGroup;
}
// Cardiac organ visibility is independent of the venous layer. Arterial source
// parts retain arterial classification; this does not enable a whole-body layer.
export function resolveCardiacStructureIds(
  structures: readonly CardiacStructure[],
  enabled: boolean,
  groups: ReadonlySet<CardiacGroup>,
  overrides: VisibilityOverrides,
  ancestors: readonly AnatomicalStructure[] = [],
): ReadonlySet<string> {
  if (!enabled) return new Set();
  const eligible = resolveVisibleStructureIds(
    [...structures, ...ancestors],
    new Set(["cardiac", "arterial"]),
    overrides,
  );
  return new Set(
    structures
      .filter((s) => eligible.has(s.id) && groups.has(s.cardiacGroup))
      .map((s) => s.id),
  );
}
export interface CardiacEdge {
  readonly from: string;
  readonly to: string;
  readonly sourceUrl: string;
  readonly relation: "flow" | "microcirculation";
  readonly reviewStatus: "pending";
  readonly variant?: string;
}
// Cycles are physiological here, unlike an acyclic venous drainage tree.
export function validateCardiacGraph(
  ids: ReadonlySet<string>,
  edges: readonly CardiacEdge[],
) {
  const errors: string[] = [],
    seen = new Set<string>();
  for (const e of edges) {
    const key = `${e.from}:${e.to}`;
    if (!ids.has(e.from) || !ids.has(e.to))
      errors.push(`Unknown cardiac endpoint: ${key}`);
    if (seen.has(key) || e.from === e.to)
      errors.push(`Duplicate/self cardiac edge: ${key}`);
    if (!e.sourceUrl.startsWith("https://"))
      errors.push(`Unsourced cardiac edge: ${key}`);
    seen.add(key);
  }
  return errors;
}
