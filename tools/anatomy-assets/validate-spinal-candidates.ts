import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { MeshoptDecoder } from "meshoptimizer";
import {
  ASSET_MANIFEST,
  ANATOMY_CATALOG,
  NERVOUS_INVENTORY,
} from "@anatomy/data";
import { parseRanges } from "./spinal-source-inventory";
const root = new URL("../../", import.meta.url);
const registration = JSON.parse(
  await readFile(
    new URL("docs/assets/hra-spinal-registration.json", root),
    "utf8",
  ),
);
const source = JSON.parse(
  await readFile(new URL("docs/assets/spinal-source-pairs.json", root), "utf8"),
);
const baseline = JSON.parse(
  await readFile(
    new URL("docs/assets/nervous-regression-baseline.json", root),
    "utf8",
  ),
);
for (const [path, expected] of Object.entries(baseline.files))
  if (
    createHash("sha256")
      .update(await readFile(new URL(path, root)))
      .digest("hex") !== expected
  )
    throw Error("Fixed reference changed: " + path);
if (
  registration.runtimeImported !== false ||
  registration.clinicalReview !== "pending" ||
  registration.decision !== "QUARANTINE_PENDING_ANATOMICAL_REVIEW"
)
  throw Error("Candidate must not silently acquire medical/runtime approval");
if (
  registration.unmappedVertices !== 0 ||
  !registration.candidate ||
  registration.candidate.uri !==
    "docs/assets/candidates/hra-spinal-cord-UNREVIEWED.glb"
)
  throw Error("Missing complete offline candidate");
if (
  registration.boundaryPolicy.maximumObservedDistanceMm >
    registration.boundaryPolicy.maximumAllowedDistanceMm ||
  registration.boundaryPolicy.medicalApproval !== false
)
  throw Error("Unrecorded boundary policy");
if (
  ASSET_MANIFEST.assets.some(
    (a) => a.uri.includes("UNREVIEWED") || a.uri.includes("candidates/"),
  )
)
  throw Error("Quarantined geometry entered runtime manifest");
const bytes = await readFile(new URL(registration.candidate.uri, root));
if (
  bytes.length !== registration.candidate.byteLength ||
  createHash("sha256").update(bytes).digest("hex") !==
    registration.candidate.sha256
)
  throw Error("Candidate checksum/length differs");
if (
  bytes.readUInt32LE(0) !== 0x46546c67 ||
  bytes.readUInt32LE(8) !== bytes.length
)
  throw Error("Invalid candidate GLB");
const jsonLength = bytes.readUInt32LE(12),
  gltf = JSON.parse(bytes.toString("utf8", 20, 20 + jsonLength));
if (
  !gltf.asset.copyright.includes("CC BY 4.0") ||
  !gltf.asset.copyright.includes("unreviewed candidate")
)
  throw Error("Candidate provenance notice missing");
await MeshoptDecoder.ready;
const ids = new Set<string>();
const sourceSegments = new Map<
  string,
  { sourceOntology: string; sourceName: string }
>(
  registration.sourceSegments.map(
    (s: { id: string; sourceOntology: string; sourceName: string }) => [
      s.id,
      s,
    ],
  ),
);
if (sourceSegments.size !== 30 || registration.sourceSegments.length !== 30)
  throw Error("Missing unique source segment identities");
let triangles = 0;
for (const node of gltf.nodes) {
  const segment = sourceSegments.get(node.extras.anatomyId);
  if (
    !segment ||
    !/^UBERON:\d{7}$/.test(segment.sourceOntology) ||
    node.extras.anatomyId !==
      `nervous-hra-cord-source-${segment.sourceOntology.toLowerCase().replace(":", "-")}` ||
    node.extras.sourceName !== segment.sourceName
  )
    throw Error("Candidate identity does not match pinned source ontology");
  if (
    ids.has(node.extras.anatomyId) ||
    ANATOMY_CATALOG.some((a) => a.id === node.extras.anatomyId)
  )
    throw Error(
      "Candidate ID is duplicated or masquerading as runtime anatomy",
    );
  ids.add(node.extras.anatomyId);
  const primitive = gltf.meshes[node.mesh].primitives[0];
  const decode = (id: number) => {
    const a = gltf.accessors[id],
      view = gltf.bufferViews[a.bufferView],
      e = view.extensions.EXT_meshopt_compression;
    const out = new Uint8Array(view.byteLength);
    MeshoptDecoder.decodeGltfBuffer(
      out,
      e.count,
      e.byteStride,
      bytes.subarray(
        28 + jsonLength + e.byteOffset,
        28 + jsonLength + e.byteOffset + e.byteLength,
      ),
      e.mode,
    );
    return out;
  };
  const positions = new Float32Array(
      decode(primitive.attributes.POSITION).buffer,
    ),
    normals = new Float32Array(decode(primitive.attributes.NORMAL).buffer),
    indices = new Uint32Array(decode(primitive.indices).buffer);
  if (
    !positions.length ||
    positions.length !== normals.length ||
    positions.length % 3 ||
    !positions.every(Number.isFinite) ||
    !normals.every(Number.isFinite) ||
    !indices.length ||
    indices.length % 3 ||
    !indices.every((i) => i < positions.length / 3)
  )
    throw Error("Invalid candidate source geometry");
  triangles += indices.length / 3;
}
if (
  ids.size !== registration.candidate.segments ||
  ids.size !== 30 ||
  triangles !== registration.candidate.triangles ||
  triangles !== 16358
)
  throw Error("Candidate source topology/count differs");
if (
  source.runtimeImported !== false ||
  source.verifiedAnatomicalCoverageAdded !== 0 ||
  source.catalogAvailabilityChanged !== false ||
  source.pairs.length !== 62 ||
  source.pairCount !== 31
)
  throw Error("Research scaffold falsely promoted to verified coverage");
const owned = new Set<number>(),
  canonical = new Set<string>();
for (const pair of source.pairs) {
  const item = NERVOUS_INVENTORY.find((i) => i.id === pair.canonicalId);
  if (
    !item ||
    item.spinalDesignation !== pair.level ||
    item.laterality !== pair.side ||
    item.assetId ||
    pair.runtimeImported ||
    pair.medicallyVerified ||
    pair.alignmentVerified ||
    canonical.has(pair.canonicalId)
  )
    throw Error("Invalid or falsely available spinal source identity");
  canonical.add(pair.canonicalId);
  const volumes = parseRanges(pair.sourceVolumeRanges),
    nodes = parseRanges(pair.sourceNodeRanges);
  if (
    !volumes.size ||
    volumes.size !== pair.sourceVolumeCount ||
    !nodes.size ||
    nodes.size !== pair.sourceNodeCount
  )
    throw Error("Source range count differs");
  for (const id of volumes) {
    if (owned.has(id)) throw Error("Duplicate source volume ownership");
    owned.add(id);
  }
  for (const part of pair.parts) {
    const partVolumes = parseRanges(part.sourceVolumeRanges);
    if (
      partVolumes.size !== part.sourceVolumeCount ||
      [...partVolumes].some((v) => !volumes.has(v))
    )
      throw Error("Part is not a source subset");
  }
}
if (owned.size !== source.sourceVolumes || owned.size !== 16120)
  throw Error("Source-volume coverage differs");
process.stdout.write(
  `Validated quarantined HRA candidate: ${ids.size} source segments / ${triangles} triangles; ${source.pairs.length} source-only spinal identities / ${owned.size} disjoint research cells. Runtime and medical approval remain false.\n`,
);
