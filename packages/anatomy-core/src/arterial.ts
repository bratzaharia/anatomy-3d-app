import {
  resolveVisibleStructureIds,
  type AnatomicalStructure,
  type VisibilityOverrides,
  type Laterality,
} from "./index";
export type ArterialMode = "natural" | "colors" | "pathways";
export type ArterialLevel = "major" | "named" | "fine";
export interface ArterialStructure extends AnatomicalStructure {
  readonly arterialGroup: string;
  readonly detail: ArterialLevel;
  readonly circulation: "systemic" | "pulmonary" | "coronary";
}
export interface ArterialFilters {
  readonly groups: ReadonlySet<string>;
  readonly sides: ReadonlySet<Laterality>;
  readonly levels: ReadonlySet<ArterialLevel>;
}
// OR within facets, AND between facets. No groups/levels deliberately means
// no arteries; empty sides is unrestricted. Overrides always take precedence.
export function resolveArterialStructureIds(
  structures: readonly ArterialStructure[],
  systems: ReadonlySet<string>,
  overrides: VisibilityOverrides,
  filters: ArterialFilters,
) {
  const eligible = resolveVisibleStructureIds(structures, systems, overrides);
  return new Set(
    structures
      .filter(
        (s) =>
          eligible.has(s.id) &&
          filters.groups.has(s.arterialGroup) &&
          filters.levels.has(s.detail) &&
          (!filters.sides.size || filters.sides.has(s.laterality)),
      )
      .map((s) => s.id),
  );
}
export interface ArterialEdge {
  readonly from: string;
  readonly to: string;
  readonly relation: "branch" | "continuation" | "confluence" | "anastomosis";
  readonly sourceUrl: string;
  readonly evidence: "source-backed" | "unverified";
  readonly medicalReview: "pending" | "reviewed";
  readonly variant?: string;
}
// Anastomoses are stored, not forced into an origin tree. Upstream traversal
// retains both vertebral origins at a confluence; it never guesses missing links.
export function traceArterial(
  id: string,
  edges: readonly ArterialEdge[],
  direction: "origin" | "branches",
) {
  const visited = new Set<string>(),
    queue = [id];
  while (queue.length) {
    const node = queue.shift()!;
    if (visited.has(node)) continue;
    visited.add(node);
    for (const e of edges) {
      if (e.evidence !== "source-backed" || e.relation === "anastomosis")
        continue;
      if (direction === "origin" && e.to === node) queue.push(e.from);
      if (direction === "branches" && e.from === node) queue.push(e.to);
    }
  }
  return [...visited];
}
export function validateArterialGraph(
  ids: ReadonlySet<string>,
  edges: readonly ArterialEdge[],
) {
  const errors: string[] = [],
    seen = new Set<string>();
  for (const e of edges) {
    const key = `${e.from}:${e.to}:${e.relation}`;
    if (!ids.has(e.from) || !ids.has(e.to))
      errors.push(`Unknown arterial endpoint: ${key}`);
    if (e.from === e.to || seen.has(key))
      errors.push(`Duplicate/self arterial edge: ${key}`);
    if (!e.sourceUrl.startsWith("https://"))
      errors.push(`Unsourced arterial edge: ${key}`);
    seen.add(key);
  }
  // Collateral/anastomotic cycles are valid; a directed origin/continuation
  // cycle without a collateral edge is not an acceptable arterial hierarchy.
  const visiting = new Set<string>(),
    visited = new Set<string>();
  const visit = (id: string) => {
    if (visiting.has(id)) {
      errors.push(`Directed arterial origin cycle: ${id}`);
      return;
    }
    if (visited.has(id)) return;
    visiting.add(id);
    for (const e of edges)
      if (e.from === id && e.relation !== "anastomosis") visit(e.to);
    visiting.delete(id);
    visited.add(id);
  };
  for (const id of ids) visit(id);
  return errors;
}
