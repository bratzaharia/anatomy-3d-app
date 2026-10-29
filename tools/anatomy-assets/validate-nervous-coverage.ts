import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { MeshoptDecoder } from "meshoptimizer";
import { format } from "prettier";
import {
  NERVOUS_ASSETS,
  NERVOUS_SUPPLEMENT,
  NERVOUS_INVENTORY,
  NERVOUS_GEOMETRY,
  nervousMetadataById,
  REGIONS,
} from "@anatomy/data";
const root = new URL("../../", import.meta.url),
  errors: string[] = [],
  owners = new Set<string>();
await MeshoptDecoder.ready;
let triangles = 0;
for (const asset of NERVOUS_ASSETS) {
  const glb = await readFile(new URL("apps/web/public" + asset.uri, root));
  if (
    glb.length !== asset.byteLength ||
    createHash("sha256").update(glb).digest("hex") !== asset.sha256
  )
    errors.push("Asset checksum/length differs: " + asset.id);
  if (glb.readUInt32LE(0) !== 0x46546c67 || glb.readUInt32LE(8) !== glb.length)
    throw Error("Invalid GLB " + asset.id);
  const jl = glb.readUInt32LE(12),
    gltf = JSON.parse(glb.toString("utf8", 20, 20 + jl));
  for (const node of gltf.nodes) {
    const id = node.extras.anatomyId,
      meta = nervousMetadataById.get(id);
    if (!meta) errors.push("Unmapped source object: " + id);
    const primitive = gltf.meshes[node.mesh].primitives[0];
    const decode = (id: number) => {
      const a = gltf.accessors[id],
        v = gltf.bufferViews[a.bufferView],
        e = v.extensions.EXT_meshopt_compression,
        out = new Uint8Array(v.byteLength);
      MeshoptDecoder.decodeGltfBuffer(
        out,
        e.count,
        e.byteStride,
        glb.subarray(
          28 + jl + e.byteOffset,
          28 + jl + e.byteOffset + e.byteLength,
        ),
        e.mode,
      );
      return out;
    };
    const p = new Float32Array(decode(primitive.attributes.POSITION).buffer),
      n = new Float32Array(decode(primitive.attributes.NORMAL).buffer),
      idx = new Uint32Array(decode(primitive.indices).buffer);
    if (
      !p.length ||
      p.length !== n.length ||
      !p.every(Number.isFinite) ||
      !n.every(Number.isFinite) ||
      !idx.length ||
      idx.length % 3 ||
      !idx.every((i) => i < p.length / 3)
    )
      errors.push("Invalid geometry: " + id);
    if (meta?.assetId !== asset.id) continue; // Retained, inactive source variants are never mounted.
    if (owners.has(id)) errors.push("Duplicate active geometry: " + id);
    owners.add(id);
    const mapping = NERVOUS_GEOMETRY.find((i) => i.id === id)!;
    const min = [Infinity, Infinity, Infinity],
      max = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < p.length; i++) {
      const axis = i % 3;
      min[axis] = Math.min(min[axis]!, p[i]!);
      max[axis] = Math.max(max[axis]!, p[i]!);
    }
    if (
      Math.hypot(...max.map((v, i) => v - min[i]!)) < 0.00001 ||
      idx.length / 3 !== mapping.triangleCount
    )
      errors.push("Zero extent/triangle mismatch: " + id);
    for (let i = 0; i < 3; i++)
      if (
        Math.abs(min[i]! - mapping.bounds.min[i]!) > 1e-6 ||
        Math.abs(max[i]! - mapping.bounds.max[i]!) > 1e-6
      )
        errors.push("Decoded bounds differ: " + id);
    triangles += idx.length / 3;
  }
}
if (owners.size !== NERVOUS_GEOMETRY.length)
  errors.push("Active registry differs from actual GLBs");
for (const item of NERVOUS_SUPPLEMENT.inventory) {
  if (!owners.has(item.id)) errors.push("Supplement not rendered: " + item.id);
  if (
    /cochlear|vestibular|white_matter|nucleus|j$/i.test(item.sourceIdentifier)
  )
    errors.push("Excluded/ambiguous third-party object imported: " + item.id);
  if (item.sourceObjectId === "undefined")
    errors.push("Source object ID missing: " + item.id);
}
if (NERVOUS_SUPPLEMENT.registration.minimumCenterJacobian <= 0)
  errors.push("Source registration folds");
if (errors.length) throw Error(errors.join("\n"));
const inventory = NERVOUS_INVENTORY.map((item) => ({
  id: item.id,
  names: item.names,
  requiredForTarget: true,
  regionIds: item.regionIds,
  laterality: item.laterality,
  representation: item.assetId ? "surface_mesh" : "none",
  geometryStatus: item.geometryStatus,
  sourceDataset:
    item.sourceDataset ?? (item.assetId ? "BodyParts3D" : "inventory only"),
  sourceIdentifier:
    item.sourceIdentifier ??
    item.sourceConcepts.map((c) => c.conceptId).join(","),
  assetId: item.assetId,
  meshIds: item.meshIds,
  alignmentStatus: item.sourceDataset
    ? "landmark_registered_medical_review_pending"
    : item.assetId
      ? "same_subject_technical_registration"
      : "not_applicable",
  reviewStatus: "pending",
  gap: item.gap,
}));
const counts = (items: typeof NERVOUS_INVENTORY) => ({
  target: items.length,
  individual: items.filter((i) => i.geometryStatus === "individual").length,
  grouped: items.filter((i) => i.geometryStatus === "grouped").length,
  missing: items.filter((i) => !i.assetId).length,
  medicallyVerified: 0,
});
const report = {
  inventoryVersion: NERVOUS_SUPPLEMENT.version,
  gate: "PARTIAL_COVERAGE",
  targetInventoryMedicallyReviewed: false,
  verifiedComplete: false,
  total: counts(NERVOUS_INVENTORY),
  renderedEntities: owners.size,
  renderedTriangles: triangles,
  cranialParents: counts(NERVOUS_INVENTORY.filter((i) => !!i.cranialNumber)),
  spinalPairs: counts(NERVOUS_INVENTORY.filter((i) => !!i.spinalDesignation)),
  regions: REGIONS.filter((r) => r.id !== "whole-body").map((region) => ({
    id: region.id,
    ...counts(NERVOUS_INVENTORY.filter((i) => i.regionIds.includes(region.id))),
  })),
  distal: ["hand", "foot"].flatMap((region) =>
    ["left", "right"].map((side) => ({
      region,
      side,
      scope: "available_source_identities_only_not_exhaustive_distal_target",
      definedScopeComplete: false,
      independentDigitalBranchInventoryReviewed: false,
      ...counts(
        NERVOUS_INVENTORY.filter(
          (i) => i.distalRegion === region && i.laterality === side,
        ),
      ),
    })),
  ),
  registration: NERVOUS_SUPPLEMENT.registration,
  inventory,
};
await writeFile(
  new URL("docs/assets/NERVOUS_GEOMETRY_COVERAGE.json", root),
  await format(JSON.stringify(report), { parser: "json" }),
);
const tableRows = [
  { label: "Total", ...report.total },
  { label: "Cranial parent nerves", ...report.cranialParents },
  { label: "31 spinal nerve pairs", ...report.spinalPairs },
  ...report.regions.map((r) => ({ label: r.id, ...r })),
  ...report.distal.map((r) => ({ label: r.region + "-" + r.side, ...r })),
];
const lines = [
  "# Nervous geometric coverage — " + report.inventoryVersion,
  "",
  "Gate: **PARTIAL COVERAGE**. No medically verified complete claim. Counts below are derived from decoded GLBs and canonical source ownership; grouped branches never count as independently mapped nerves. The target inventory and source-pose transfer still need medical review.",
  "",
  "| Scope | Target | Individual | Source sets | Missing | Medically verified |",
  "| --- | ---: | ---: | ---: | ---: | ---: |",
  ...tableRows.map(
    (r) =>
      `| ${r.label} | ${r.target} | ${r.individual} | ${r.grouped} | ${r.missing} | 0 |`,
  ),
  "",
  `Actual active geometry: ${owners.size} entities, ${triangles.toLocaleString("en-US")} triangles. Source-derived hand/foot sets are not independently separated per digit. Region tags describe source scope, not proof of every branch in that region.`,
  "A zero missing count for distal source identities does not mean a complete hand or foot: the independent per-digit target inventory is not yet exhaustively reviewed. No regional completeness percentage is asserted.",
  "",
  "## Every unresolved catalog entry",
  "",
  ...inventory
    .filter((i) => !i.assetId)
    .map((i) => `- ${i.id}: ${i.names.en} — ${i.gap}`),
  "",
  "## Required scope not yet independently resolved",
  "",
  "- Spinal cord surface; all 31 paired complete spinal nerves; individually numbered dorsal/ventral roots, dorsal root ganglia and rami. Existing Z roots/ganglia are aggregate source sets, not 62 independently numbered nerves.",
  "- Cervical and coccygeal plexuses; complete phrenic and cutaneous cervical courses.",
  "- Individually separated temporal, zygomatic, buccal, marginal mandibular and cervical branches of facial nerve. Its mapped parent surface is not branch-level completeness.",
  "- Individually separated palmar/dorsal and plantar/dorsal digital branches per digit. The source supplies selectable sets, not one canonical identity for each digital branch.",
  "- Complete pelvic hypogastric, splanchnic and perineal branching; segment-specific lumbar/sacral sympathetic ganglia and trunks; complete visceral vagal distribution; enteric plexuses.",
  "- Source-estimated SPARC scaffold data was acquired separately, but does not count as verified nerve courses or a clinically registered surface.",
  "- Independent review of source courses, normal variation, 190-landmark pose transfer (especially pelvis), and missing Romanian/Latin terminology.",
  "",
];
await writeFile(
  new URL("docs/assets/NERVOUS_GEOMETRY_COVERAGE.md", root),
  await format(lines.join("\n"), { parser: "markdown" }),
);
await writeFile(
  new URL("docs/assets/NERVOUS_COVERAGE.md", root),
  await format(lines.join("\n"), { parser: "markdown" }),
);
process.stdout.write(
  JSON.stringify({
    assets: NERVOUS_ASSETS.length,
    activeEntities: owners.size,
    triangles,
    gate: report.gate,
    total: report.total,
    cranial: report.cranialParents,
    spinal: report.spinalPairs,
    distal: report.distal,
  }) + "\n",
);
