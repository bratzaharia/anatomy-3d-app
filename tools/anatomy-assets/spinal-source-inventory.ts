export type ExfGroup = { nodes: Set<number>; volumes: Set<number> };
export function serializeRanges(values: Iterable<number>) {
  const sorted = [...new Set(values)].sort((a, b) => a - b),
    out: string[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const start = sorted[i]!;
    let end = start;
    while (i + 1 < sorted.length && sorted[i + 1] === end + 1)
      end = sorted[++i]!;
    out.push(start === end ? String(start) : `${start}..${end}`);
  }
  return out.join(",");
}
export function parseRanges(value: string) {
  const result = new Set<number>();
  for (const token of value.split(/[\s,]+/).filter(Boolean)) {
    const match = token.match(/^(\d+)(?:\.\.(\d+))?$/);
    if (!match) throw Error("Unsupported EXF identifier range: " + token);
    const min = Number(match[1]),
      max = Number(match[2] ?? match[1]);
    if (
      !Number.isSafeInteger(min) ||
      !Number.isSafeInteger(max) ||
      min < 1 ||
      max < min ||
      max > 1000000
    )
      throw Error("EXF range outside bounded source scope");
    for (let i = min; i <= max; i++) result.add(i);
  }
  return result;
}
/** Parse semantic groups only. No Hermite interpolation or invented surface. */
export function parseExfGroups(text: string) {
  if (!text.startsWith("EX Version: 3")) throw Error("Unexpected EXF format");
  const groups = new Map<string, ExfGroup>();
  let current: ExfGroup | null = null,
    dimension = 0,
    mode: "nodes" | "volumes" | null = null;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (line.startsWith("Group name: ")) {
      const name = line.slice(12);
      if (groups.has(name)) throw Error("Duplicate EXF group: " + name);
      current = { nodes: new Set(), volumes: new Set() };
      groups.set(name, current);
      mode = null;
      dimension = 0;
    } else if (!current) continue;
    else if (line.startsWith("!#mesh ")) {
      dimension = Number(line.match(/dimension=(\d+)/)?.[1] ?? 0);
      mode = null;
    } else if (line.startsWith("!#nodeset")) {
      dimension = 0;
      mode = null;
    } else if (line === "Node group:") mode = "nodes";
    else if (line === "Element group:")
      mode = dimension === 3 ? "volumes" : null;
    else if (mode && line)
      for (const id of parseRanges(line)) current[mode].add(id);
  }
  return groups;
}
const intersect = (a: Set<number>, b: Set<number>) =>
  [...a].filter((id) => b.has(id)).sort((x, y) => x - y);
export function spinalSourcePairs(groups: Map<string, ExfGroup>) {
  const levels = [
    ...Array.from({ length: 8 }, (_, i) => `C${i + 1}`),
    ...Array.from({ length: 12 }, (_, i) => `T${i + 1}`),
    ...Array.from({ length: 5 }, (_, i) => `L${i + 1}`),
    ...Array.from({ length: 5 }, (_, i) => `S${i + 1}`),
    "Co1",
  ];
  const partNames = [
    "dorsal root of spinal cord",
    "ventral root of spinal cord",
    "dorsal root ganglion",
    "spinal nerve",
  ];
  const owned = new Set<number>();
  return levels.flatMap((level) => {
    const sourceGroup =
      level === "Co1" ? "coccygeal nerve" : `${level} spinal nerve`;
    const group = groups.get(sourceGroup);
    if (!group?.volumes.size)
      throw Error("Missing source nerve group: " + sourceGroup);
    const pairs = ["left", "right"].map((side) => {
      const sideGroup = groups.get(side);
      if (!sideGroup) throw Error("Missing source side: " + side);
      const volumeIds = intersect(group.volumes, sideGroup.volumes),
        nodeIds = intersect(group.nodes, sideGroup.nodes);
      if (!volumeIds.length || !nodeIds.length)
        throw Error("Empty source side: " + sourceGroup + " / " + side);
      for (const id of volumeIds) {
        if (owned.has(id))
          throw Error("Source volume has duplicate nerve/side ownership");
        owned.add(id);
      }
      return {
        canonicalId: `nervous-spinal-nerve-${level.toLowerCase()}-${side}`,
        level,
        side,
        sourceGroup,
        sourceVolumeIds: volumeIds,
        sourceNodeIds: nodeIds,
        parts: partNames.map((name) => ({
          sourceGroup: name,
          volumeIds: intersect(
            new Set(volumeIds),
            groups.get(name)?.volumes ?? new Set(),
          ),
        })),
        representation: "source_estimated_finite_element_volume",
        runtimeImported: false,
        alignmentVerified: false,
        medicallyVerified: false,
      };
    });
    if (
      pairs.reduce((n, p) => n + p.sourceVolumeIds.length, 0) !==
      group.volumes.size
    )
      throw Error("Unassigned or overlapping source-side volumes");
    return pairs;
  });
}
