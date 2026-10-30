import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { MeshoptDecoder } from "meshoptimizer";
import {
  SKELETON_ASSET,
  SKELETAL_PART_PARENTS,
  SKELETAL_PART_STRUCTURES,
  ASSET_MANIFEST,
  ANATOMY_COVERAGE,
  summarizeCoverage,
} from "@anatomy/data";
const hash = (b: Uint8Array) => createHash("sha256").update(b).digest("hex");
const bytes = await readFile(
  new URL("../../apps/web/public" + SKELETON_ASSET.uri, import.meta.url),
);
if (hash(bytes) !== SKELETON_ASSET.sha256)
  throw Error("Fixed geometry changed");
const length = bytes.readUInt32LE(12),
  gltf = JSON.parse(bytes.toString("utf8", 20, 20 + length));
await MeshoptDecoder.ready;
function decode(id: number) {
  const view = gltf.bufferViews[gltf.accessors[id].bufferView],
    e = view.extensions.EXT_meshopt_compression,
    out = new Uint8Array(view.byteLength);
  MeshoptDecoder.decodeGltfBuffer(
    out,
    e.count,
    e.byteStride,
    bytes.subarray(
      28 + length + e.byteOffset,
      28 + length + e.byteOffset + e.byteLength,
    ),
    e.mode,
  );
  return out;
}
const owned = new Set<string>();
for (const parent of SKELETAL_PART_PARENTS) {
  const source = SKELETON_ASSET.structures.find((s) => s.id === parent.id)!,
    node = gltf.nodes.find(
      (n: { extras: { anatomyId: string } }) =>
        n.extras.anatomyId === parent.id,
    ),
    primitive = gltf.meshes[node.mesh].primitives[0];
  const p = decode(primitive.attributes.POSITION),
    ix = decode(primitive.indices),
    normals = decode(primitive.attributes.NORMAL);
  if (hash(normals) !== parent.normalSha256)
    throw Error("Source normals differ");
  let vertex = 0,
    index = 0;
  for (const part of parent.parts) {
    if (
      owned.has(part.id) ||
      part.id !== "bone-" + part.conceptId.toLowerCase() ||
      part.vertexStart !== vertex ||
      part.indexStart !== index ||
      part.indexCount % 3 ||
      !source.sourceConcepts.some((c) => c.conceptId === part.conceptId)
    )
      throw Error("Invalid canonical partition");
    owned.add(part.id);
    const vertices = p.subarray(vertex * 12, (vertex + part.vertexCount) * 12),
      indices = ix.subarray(index * 4, (index + part.indexCount) * 4);
    if (
      hash(vertices) !== part.positionSha256 ||
      hash(indices) !== part.indexSha256
    )
      throw Error("Partition source bytes differ");
    const points = new Float32Array(vertices.slice().buffer),
      faces = new Uint32Array(indices.slice().buffer);
    if (
      !points.every(Number.isFinite) ||
      !faces.every((i) => i >= vertex && i < vertex + part.vertexCount)
    )
      throw Error("Invalid partition indices");
    for (let axis = 0; axis < 3; axis++) {
      let min = Infinity,
        max = -Infinity;
      for (let i = axis; i < points.length; i += 3) {
        min = Math.min(min, points[i]!);
        max = Math.max(max, points[i]!);
      }
      if (
        Math.abs(min - part.bounds.min[axis]!) > 1e-7 ||
        Math.abs(max - part.bounds.max[axis]!) > 1e-7
      )
        throw Error("Partition bounds differ");
    }
    vertex += part.vertexCount;
    index += part.indexCount;
  }
  if (
    vertex !== parent.vertexCount ||
    index !== parent.indexCount ||
    vertex * 12 !== p.length ||
    index * 4 !== ix.length ||
    parent.parts.length !== source.sourceConcepts.length
  )
    throw Error("Incomplete source coverage");
}
if (owned.size !== 157 || SKELETAL_PART_STRUCTURES.length !== 157)
  throw Error("Unexpected source partition count");
for (const entry of ANATOMY_COVERAGE) {
  if (!entry.structure) throw Error("Coverage identity absent");
  if (
    (entry.status === "missing" || entry.status === "grouped-only") &&
    (entry.structure.assetIds.length ||
      ASSET_MANIFEST.assets.some((a) =>
        a.structureIds.includes(entry.structure.id),
      ))
  )
    throw Error("Unavailable inventory became runtime geometry");
}
const bones = summarizeCoverage(
  ANATOMY_COVERAGE.filter((e) => e.system === "skeletal"),
);
if (bones.total !== 206 || bones.individual !== 199 || bones.missing !== 7)
  throw Error("Defined adult-bone scope differs");
process.stdout.write(
  `Validated ${owned.size} exact source partitions, ${bones.individual} available bone identities and ${bones.missing} explicit gaps; no new anatomy geometry.\n`,
);
