import {
  MUSCLE_ASSET,
  MUSCLE_STRUCTURES,
  MUSCLE_INVENTORY,
  MUSCLE_GROUPS,
  ANATOMY_CATALOG,
} from "@anatomy/data";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { MeshoptDecoder } from "meshoptimizer";
import { z } from "zod";
const errors: string[] = [];
const ids = new Set(ANATOMY_CATALOG.map((item) => item.id));
if (ids.size !== ANATOMY_CATALOG.length) errors.push("Duplicate catalog IDs");
const mappedCatalogIds = new Set(
  MUSCLE_STRUCTURES.filter((item) => item.status === "available").map(
    (item) => item.id,
  ),
);
const ownedFiles = new Set<string>();
for (const item of MUSCLE_ASSET.structures) {
  for (const file of item.sourceFiles) {
    if (ownedFiles.has(file.id))
      errors.push("Duplicate source mesh ownership: " + file.id);
    ownedFiles.add(file.id);
  }
  const center = (item.bounds.min[0] + item.bounds.max[0]) / 2;
  if (
    (item.laterality === "left" && center < -0.002) ||
    (item.laterality === "right" && center > 0.002)
  )
    errors.push("Laterality coordinate conflict: " + item.id);
  if (
    item.sourceConcepts.some((source) =>
      /artery|vein|bone|cartilage|nerve|ligament/i.test(source.name),
    )
  )
    errors.push("Non-muscle source: " + item.id);
}
if (ownedFiles.size !== MUSCLE_ASSET.sourceMeshCount)
  errors.push("Source mesh count mismatch");
for (const item of MUSCLE_INVENTORY) {
  if (!item.en.trim() || !item.ro.trim() || !item.latin.trim())
    errors.push("Missing terminology: " + item.id);
  const mapped = ["independent", "grouped"].includes(item.mappingStatus);
  if (
    mapped !== mappedCatalogIds.has(item.id) ||
    mapped !== (item.assetId !== null) ||
    mapped !== item.meshIds.length > 0
  )
    errors.push("Availability mismatch: " + item.id);
  if (item.groupedIn && !mappedCatalogIds.has(item.groupedIn))
    errors.push("Missing grouped source identity: " + item.id);
  if (!mapped && !item.gap) errors.push("Unreported gap: " + item.id);
  if (item.reviewStatus !== "unreviewed")
    errors.push("Unsubstantiated review status");
}
for (const group of MUSCLE_GROUPS) {
  if (
    group.parentId &&
    !MUSCLE_GROUPS.some((parent) => parent.id === group.parentId)
  )
    errors.push("Missing muscle group parent: " + group.id);
  for (const id of group.memberIds)
    if (!ids.has(id)) errors.push("Invalid group member: " + id);
}
const baseline = JSON.parse(
  await readFile(
    new URL(
      "../../docs/assets/skeleton-regression-baseline.json",
      import.meta.url,
    ),
    "utf8",
  ),
) as { files: Record<string, string> };
for (const [path, expected] of Object.entries(baseline.files)) {
  const bytes = await readFile(new URL("../../" + path, import.meta.url));
  if (createHash("sha256").update(bytes).digest("hex") !== expected)
    errors.push("Skeletal regression: " + path);
}
const alignment = JSON.parse(
  await readFile(
    new URL("../../docs/assets/muscle-alignment.json", import.meta.url),
    "utf8",
  ),
) as {
  maximumSourceDifference: number;
  landmarks: { id: string; geometryHash: string }[];
};
if (
  alignment.maximumSourceDifference !== 0 ||
  alignment.landmarks.length !== 29 ||
  alignment.landmarks.some((l) => !/^[a-f0-9]{64}$/.test(l.geometryHash))
)
  errors.push("Missing reference landmark registration evidence");
const landmarkBaseline = JSON.parse(
  await readFile(
    new URL(
      "../../docs/assets/skeleton-landmark-baseline.json",
      import.meta.url,
    ),
    "utf8",
  ),
) as { landmarks: { id: string; geometryHash: string }[] };
for (const recorded of landmarkBaseline.landmarks)
  if (
    !alignment.landmarks.some(
      (item) =>
        item.id === recorded.id && item.geometryHash === recorded.geometryHash,
    )
  )
    errors.push("Reference landmark baseline mismatch: " + recorded.id);
const glb = await readFile(
  new URL(
    "../../apps/web/public/models/bodyparts3d-muscles.glb",
    import.meta.url,
  ),
);
if (createHash("sha256").update(glb).digest("hex") !== MUSCLE_ASSET.sha256)
  errors.push("Muscle GLB checksum does not match manifest");
if (
  glb.length !== MUSCLE_ASSET.byteLength ||
  glb.readUInt32LE(8) !== glb.length
)
  errors.push("Muscle GLB byte length mismatch");
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
  if (!mappedCatalogIds.has(id) || mappedIds.has(id))
    errors.push(`Unknown or duplicate mesh mapping: ${id}`);
  mappedIds.add(id);
  const mapping = MUSCLE_ASSET.structures.find((item) => item.id === id);
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
if (mappedIds.size !== MUSCLE_ASSET.structures.length)
  errors.push("Not every catalog structure maps to geometry");
if (triangleCount !== MUSCLE_ASSET.triangleCount)
  errors.push("Triangle count differs from manifest");
if (errors.length)
  throw new Error(`Anatomy validation failed:\n${errors.join("\n")}`);
process.stdout.write(
  `Validated ${MUSCLE_ASSET.structures.length} structures, muscular, GLB checksum, mesh mappings, decoded geometry bounds, and ${triangleCount} triangles.\n`,
);
