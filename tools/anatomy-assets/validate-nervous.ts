import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { MeshoptDecoder } from "meshoptimizer";
import { validateHierarchy, validateNervousConnections } from "@anatomy/core";
import {
  ANATOMY_CATALOG,
  NERVOUS_ASSET,
  NERVOUS_STRUCTURES,
  NERVOUS_INVENTORY,
  REGIONS,
  NERVOUS_GROUPS,
} from "@anatomy/data";

const root = new URL("../../", import.meta.url);
const hash = (bytes: Uint8Array) =>
  createHash("sha256").update(bytes).digest("hex");
const errors: string[] = [];
const baseline = JSON.parse(
  await readFile(
    new URL("docs/assets/nervous-regression-baseline.json", root),
    "utf8",
  ),
) as { files: Record<string, string> };
for (const [path, sha] of Object.entries(baseline.files))
  if (hash(await readFile(new URL(path, root))) !== sha)
    errors.push("Protected existing anatomy changed: " + path);
errors.push(
  ...validateHierarchy(ANATOMY_CATALOG),
  ...validateNervousConnections(
    new Set(NERVOUS_STRUCTURES.map((item) => item.id)),
    NERVOUS_ASSET.connections,
  ),
);
if (
  new Set(ANATOMY_CATALOG.map((item) => item.id)).size !==
  ANATOMY_CATALOG.length
)
  errors.push("Duplicate anatomy ID");
const byId = new Map(NERVOUS_STRUCTURES.map((item) => [item.id, item]));
const files = new Set<string>();
for (const item of NERVOUS_ASSET.structures) {
  if (byId.get(item.id)?.status !== "available")
    errors.push("Missing mapped identity: " + item.id);
  if (
    item.sourceConcepts.some((source) =>
      /artery|vein|muscle|cartilage|ventricle|canal/i.test(source.name),
    )
  )
    errors.push("Non-neural or ambiguous source: " + item.id);
  for (const file of item.sourceFiles) {
    if (files.has(file.id))
      errors.push("Duplicate source ownership: " + file.id);
    files.add(file.id);
  }
  const x = (item.bounds.min[0] + item.bounds.max[0]) / 2;
  if (
    (item.laterality === "left" && x < -0.002) ||
    (item.laterality === "right" && x > 0.002)
  )
    errors.push("Laterality conflict: " + item.id);
}
if (files.size !== NERVOUS_ASSET.sourceMeshCount)
  errors.push("Source count mismatch");
for (const item of NERVOUS_INVENTORY) {
  const mapped = item.geometryStatus === "individual";
  if (mapped !== !!item.assetId || mapped !== item.meshIds.length > 0)
    errors.push("False geometry availability: " + item.id);
  if (!mapped && !item.gap) errors.push("Unreported gap: " + item.id);
  if (item.regionIds.some((id) => !REGIONS.some((region) => region.id === id)))
    errors.push("Unknown region: " + item.id);
}
for (const group of NERVOUS_GROUPS)
  if (group.memberIds.some((id) => !byId.has(id)))
    errors.push("Unknown group member: " + group.id);
const glb = await readFile(
  new URL("apps/web/public" + NERVOUS_ASSET.uri, root),
);
if (
  hash(glb) !== NERVOUS_ASSET.sha256 ||
  glb.length !== NERVOUS_ASSET.byteLength
)
  errors.push("Nervous GLB checksum/length mismatch");
if (
  glb.readUInt32LE(0) !== 0x46546c67 ||
  glb.readUInt32LE(4) !== 2 ||
  glb.readUInt32LE(8) !== glb.length
)
  throw Error("Invalid nervous GLB");
const jsonLength = glb.readUInt32LE(12);
const gltf = JSON.parse(glb.toString("utf8", 20, 20 + jsonLength));
await MeshoptDecoder.ready;
let triangles = 0;
for (const node of gltf.nodes) {
  const item = NERVOUS_ASSET.structures.find(
    (item) => item.id === node.extras.anatomyId,
  );
  if (!item) throw Error("Unknown GLB anatomy ID");
  const primitive = gltf.meshes[node.mesh].primitives[0];
  function decode(id: number) {
    const accessor = gltf.accessors[id],
      view = gltf.bufferViews[accessor.bufferView],
      extension = view.extensions.EXT_meshopt_compression;
    const result = new Uint8Array(view.byteLength);
    MeshoptDecoder.decodeGltfBuffer(
      result,
      extension.count,
      extension.byteStride,
      glb.subarray(
        28 + jsonLength + extension.byteOffset,
        28 + jsonLength + extension.byteOffset + extension.byteLength,
      ),
      extension.mode,
    );
    return result;
  }
  const p = decode(primitive.attributes.POSITION),
    n = decode(primitive.attributes.NORMAL),
    idx = decode(primitive.indices);
  const positions = new Float32Array(p.buffer),
    normals = new Float32Array(n.buffer),
    indices = new Uint32Array(idx.buffer);
  if (!positions.every(Number.isFinite) || !normals.every(Number.isFinite))
    errors.push("Invalid vertex/normal: " + item.id);
  if (
    !indices.every((index) => index < positions.length / 3) ||
    indices.length / 3 !== item.triangleCount
  )
    errors.push("Invalid indices: " + item.id);
  const min = [Infinity, Infinity, Infinity],
    max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < positions.length; i++) {
    const axis = i % 3;
    min[axis] = Math.min(min[axis]!, positions[i]!);
    max[axis] = Math.max(max[axis]!, positions[i]!);
  }
  for (let axis = 0; axis < 3; axis++)
    if (
      Math.abs(min[axis]! - item.bounds.min[axis]!) > 0.000001 ||
      Math.abs(max[axis]! - item.bounds.max[axis]!) > 0.000001
    )
      errors.push("Decoded bounds differ: " + item.id);
  triangles += indices.length / 3;
}
if (
  triangles !== NERVOUS_ASSET.triangleCount ||
  gltf.nodes.length !== NERVOUS_ASSET.structures.length
)
  errors.push("Nervous scene counts differ");
const alignment = JSON.parse(
  await readFile(new URL("docs/assets/nervous-alignment.json", root), "utf8"),
);
if (
  alignment.maximumSourceDifference !== 0 ||
  alignment.landmarks.length !== 29
)
  errors.push("Missing fixed-subject alignment evidence");
if (errors.length) throw Error(errors.join("\n"));
process.stdout.write(
  `Validated ${NERVOUS_INVENTORY.length} nervous inventory entries, ${gltf.nodes.length} individually mapped entities, ${files.size} source meshes, ${triangles} triangles, and ${Object.keys(baseline.files).length} unchanged reference files.\n`,
);
