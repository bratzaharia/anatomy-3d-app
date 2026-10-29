import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { format } from "prettier";
import {
  parseExfGroups,
  spinalSourcePairs,
  serializeRanges,
} from "./spinal-source-inventory.ts";
const root = new URL("../../", import.meta.url),
  cache = new URL("./.cache/", import.meta.url);
const bytes = await readFile(new URL("sparc-spinal_nerves.exf", cache));
const sha256 = createHash("sha256").update(bytes).digest("hex");
if (
  sha256 !== "5bcb4f5a6558e9963137b530a2e54a906e41ec7db4883510873b63bfcbf8730d"
)
  throw Error("SPARC source changed; re-audit");
const readme = await readFile(new URL("sparc-readme.md", cache));
if (
  createHash("sha256").update(readme).digest("hex") !==
  "72096ab9a47d4a7cf0af435b9b949a1ff003b6f50df279c2a3b39a6a99fc0eef"
)
  throw Error("Publisher source classification changed");
const pairs = spinalSourcePairs(parseExfGroups(bytes.toString()));
const catalog = JSON.parse(
  await readFile(
    new URL("packages/anatomy-data/src/nervous-manifest.json", root),
    "utf8",
  ),
).inventory;
for (const pair of pairs) {
  const item = catalog.find((i) => i.id === pair.canonicalId);
  if (
    !item ||
    item.spinalDesignation !== pair.level ||
    item.laterality !== pair.side
  )
    throw Error("Source inventory does not resolve to canonical spinal pair");
}
const report = {
  source: "https://discover.pennsieve.io/datasets/307",
  sourceVersion: 8,
  sourceSha256: sha256,
  file: "primary/mapclient_workflow/Organs/spinal_nerves.exf",
  license: "CC-BY-4.0",
  sourceClassification:
    "Publisher-described research scaffold with estimated nerve fiducials; not subject-specific anatomical nerve surface ground truth.",
  parsedRepresentation:
    "Named EXF nodes and 3D volume membership only. c.HermiteSerendipity coordinates are not flattened into invented linear triangles or polylines.",
  decision: "RESEARCH_SOURCE_ONLY_NOT_RUNTIME_GEOMETRY",
  runtimeImported: false,
  pairCount: 31,
  sidedEntries: pairs.length,
  sourceVolumes: pairs.reduce((n, p) => n + p.sourceVolumeIds.length, 0),
  verifiedAnatomicalCoverageAdded: 0,
  catalogAvailabilityChanged: false,
  partsMembershipMayOverlap: true,
  parts: [
    "dorsal root of spinal cord",
    "ventral root of spinal cord",
    "dorsal root ganglion",
    "spinal nerve",
  ],
  remainingGates: [
    "Preserve the source Hermite basis in any future surface reconstruction",
    "Validate coordinate units/orientation and registration against the fixed atlas",
    "Review root exits, ganglia, rami and nerve courses independently",
    "Keep research-estimated geometry visually separate and outside verified coverage",
  ],
  pairs: pairs.map(({ sourceVolumeIds, sourceNodeIds, parts, ...pair }) => ({
    ...pair,
    sourceVolumeCount: sourceVolumeIds.length,
    sourceVolumeRanges: serializeRanges(sourceVolumeIds),
    sourceNodeCount: sourceNodeIds.length,
    sourceNodeRanges: serializeRanges(sourceNodeIds),
    parts: parts.map(({ volumeIds, sourceGroup }) => ({
      sourceGroup,
      sourceVolumeCount: volumeIds.length,
      sourceVolumeRanges: serializeRanges(volumeIds),
    })),
  })),
};
await writeFile(
  new URL("docs/assets/spinal-source-pairs.json", root),
  await format(JSON.stringify(report), { parser: "json" }),
);
const lines = [
  "# Spinal source inventory — research scaffold only",
  "",
  "31 source semantic pairs resolve to 62 existing canonical catalog entries. This is an actual source-volume membership audit, not newly rendered nerves. The publisher describes estimated nerve fiducials; availability and verified anatomical coverage are unchanged.",
  "",
  "| Level | Side | Source volumes | Source nodes | Dorsal root | Ventral root | DRG | Spinal trunk |",
  "| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |",
  ...pairs.map(
    (p) =>
      `| ${p.level} | ${p.side} | ${p.sourceVolumeIds.length} | ${p.sourceNodeIds.length} | ${p.parts.map((part) => part.volumeIds.length).join(" | ")} |`,
  ),
  "",
  "Source IDs and disjoint membership are recorded in spinal-source-pairs.json. Co1 maps explicitly to the publisher's coccygeal nerve group. Source nerve volumes are not spinal cord segments, and neither are complete distal peripheral courses.",
  "Part memberships can overlap (for example, the dorsal root ganglion belongs to the dorsal-root source group). Do not sum part counts or render overlapping parts as duplicate geometry.",
  "",
  "Source: https://discover.pennsieve.io/datasets/307 — version 8, CC BY 4.0. No source volumes, new anatomy meshes, estimated paths or public runtime assets are distributed by this audit.",
  "",
];
await writeFile(
  new URL("docs/assets/SPINAL_SOURCE_PAIRS.md", root),
  await format(lines.join("\n"), { parser: "markdown" }),
);
process.stdout.write(
  JSON.stringify({
    pairCount: report.pairCount,
    sidedEntries: report.sidedEntries,
    volumes: report.sourceVolumes,
    runtimeImported: false,
    verifiedAnatomicalCoverageAdded: 0,
  }) + "\n",
);
