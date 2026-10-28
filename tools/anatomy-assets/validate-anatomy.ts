import {
  GROUPS,
  STRUCTURES,
  SKELETON_ASSET,
  REGIONS,
  SYSTEMS,
  ANATOMY_CATALOG,
} from "@anatomy/data";
import { validateHierarchy } from "@anatomy/core";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { MeshoptDecoder } from "meshoptimizer";
import { z } from "zod";

const errors = [...validateHierarchy(ANATOMY_CATALOG)];
const ids = new Set<string>();
for (const structure of ANATOMY_CATALOG) {
  if (ids.has(structure.id))
    errors.push(`Duplicate structure ID: ${structure.id}`);
  ids.add(structure.id);
  if (!/^[a-z0-9-]+$/.test(structure.id))
    errors.push(`Invalid structure ID: ${structure.id}`);
  if (!structure.provenance.length)
    errors.push(`Missing provenance: ${structure.id}`);
  if (
    structure.regionIds.some(
      (id) => !REGIONS.some((region) => region.id === id),
    )
  )
    errors.push(`Unknown region for ${structure.id}`);
  if (
    structure.systemIds.some(
      (id) => !SYSTEMS.some((system) => system.id === id),
    )
  )
    errors.push(`Unknown system for ${structure.id}`);
}
for (const group of GROUPS)
  for (const memberId of group.memberIds)
    if (!ids.has(memberId))
      errors.push(`Unknown group member ${memberId} in ${group.id}`);
const glb = await readFile(
  new URL(
    "../../apps/web/public/models/bodyparts3d-skeleton.glb",
    import.meta.url,
  ),
);
if (createHash("sha256").update(glb).digest("hex") !== SKELETON_ASSET.sha256)
  errors.push("Skeleton GLB checksum does not match manifest");
if (
  glb.length !== SKELETON_ASSET.byteLength ||
  glb.readUInt32LE(8) !== glb.length
)
  errors.push("Skeleton GLB byte length mismatch");
if (glb.readUInt32LE(0) !== 0x46546c67 || glb.readUInt32LE(4) !== 2)
  throw new Error("Invalid GLB 2.0 header");
const jsonLength = glb.readUInt32LE(12);
const gltf = z
  .object({
    nodes: z.array(
      z.object({
        name: z.string(),
        mesh: z.number().int(),
        extras: z.object({ anatomyId: z.string() }),
      }),
    ),
    meshes: z.array(
      z.object({
        primitives: z.array(
          z.object({
            attributes: z.object({
              POSITION: z.number().int(),
              NORMAL: z.number().int(),
            }),
            indices: z.number().int(),
          }),
        ),
      }),
    ),
    accessors: z.array(
      z.object({
        bufferView: z.number().int(),
        count: z.number().int(),
        componentType: z.number().int(),
        type: z.string(),
      }),
    ),
    bufferViews: z.array(
      z.object({
        byteLength: z.number().int(),
        extensions: z.object({
          EXT_meshopt_compression: z.object({
            byteOffset: z.number().int(),
            byteLength: z.number().int(),
            byteStride: z.number().int(),
            count: z.number().int(),
            mode: z.string(),
          }),
        }),
      }),
    ),
  })
  .parse(JSON.parse(glb.toString("utf8", 20, 20 + jsonLength)));
await MeshoptDecoder.ready;
const binaryOffset = 28 + jsonLength;
const decoded = gltf.bufferViews.map((view) => {
  const extension = view.extensions.EXT_meshopt_compression;
  const target = new Uint8Array(view.byteLength);
  MeshoptDecoder.decodeGltfBuffer(
    target,
    extension.count,
    extension.byteStride,
    glb.subarray(
      binaryOffset + extension.byteOffset,
      binaryOffset + extension.byteOffset + extension.byteLength,
    ),
    extension.mode,
  );
  return target;
});
let triangleCount = 0;
const mappedIds = new Set<string>();
for (const node of gltf.nodes) {
  const id = node.extras.anatomyId;
  if (!ids.has(id) || mappedIds.has(id))
    errors.push(`Unknown or duplicate mesh mapping: ${id}`);
  mappedIds.add(id);
  const mapping = SKELETON_ASSET.structures.find((item) => item.id === id);
  const primitive = gltf.meshes[node.mesh]?.primitives[0];
  if (!primitive || !mapping)
    throw new Error(`Missing geometry or mapping: ${id}`);
  const positionAccessor = gltf.accessors[primitive.attributes.POSITION];
  const indexAccessor = gltf.accessors[primitive.indices];
  const normalAccessor = gltf.accessors[primitive.attributes.NORMAL];
  if (!positionAccessor || !indexAccessor || !normalAccessor)
    throw new Error(`Missing accessors for ${id}`);
  const positionBytes = decoded[positionAccessor.bufferView];
  const indexBytes = decoded[indexAccessor.bufferView];
  const normalBytes = decoded[normalAccessor.bufferView];
  if (!positionBytes || !indexBytes || !normalBytes)
    throw new Error(`Missing buffer view for ${id}`);
  const positions = new Float32Array(positionBytes.buffer);
  const indices = new Uint32Array(indexBytes.buffer);
  const normals = new Float32Array(normalBytes.buffer);
  if (indices.length % 3 || normalAccessor.count !== positionAccessor.count)
    errors.push(`Invalid triangle or normal count: ${id}`);
  if (indices.some((index) => index >= positionAccessor.count))
    errors.push(`Out-of-range vertex index: ${id}`);
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < positions.length; i++) {
    const position = positions[i];
    if (position === undefined || !Number.isFinite(position))
      throw new Error(`Non-finite geometry: ${id}`);
    const axis = i % 3;
    min[axis] = Math.min(min[axis] ?? Infinity, position);
    max[axis] = Math.max(max[axis] ?? -Infinity, position);
  }
  if (!normals.every(Number.isFinite)) errors.push(`Non-finite normals: ${id}`);
  for (let axis = 0; axis < 3; axis++)
    if (
      Math.abs((min[axis] ?? 0) - (mapping.bounds.min[axis] ?? 0)) > 0.000001 ||
      Math.abs((max[axis] ?? 0) - (mapping.bounds.max[axis] ?? 0)) > 0.000001
    )
      errors.push(`Bounds mismatch: ${id}`);
  triangleCount += indices.length / 3;
}
if (mappedIds.size !== STRUCTURES.length)
  errors.push("Not every catalog structure maps to geometry");
if (triangleCount !== SKELETON_ASSET.triangleCount)
  errors.push("Triangle count differs from manifest");
if (errors.length)
  throw new Error(`Anatomy validation failed:\n${errors.join("\n")}`);
process.stdout.write(
  `Validated ${STRUCTURES.length} structures, ${GROUPS.length} group, GLB checksum, mesh mappings, decoded geometry bounds, and ${triangleCount} triangles.\n`,
);
