import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { MeshoptDecoder } from "meshoptimizer";
import {
  VENOUS_MANIFEST,
  VENOUS_ASSETS,
  VENOUS_INVENTORY,
  VENOUS_COVERAGE,
} from "@anatomy/data";
import { validateVenousConnections } from "@anatomy/core";
import { z } from "zod";
const root = new URL("../../", import.meta.url),
  hash = (b: Uint8Array) => createHash("sha256").update(b).digest("hex");
const baseline = JSON.parse(
  await readFile(
    new URL("docs/assets/venous-protected-baseline.json", root),
    "utf8",
  ),
) as { files: Record<string, string> };
for (const [path, sha] of Object.entries(baseline.files))
  if (hash(await readFile(new URL(path, root))) !== sha)
    throw Error("Protected model changed: " + path);
const ids = new Set(
  [...VENOUS_INVENTORY, ...VENOUS_MANIFEST.collectionPoints].map((s) => s.id),
);
const errors = [...validateVenousConnections(ids, VENOUS_MANIFEST.connections)];
const sourceFiles = new Set<string>(),
  mapped = new Set<string>();
let triangles = 0;
await MeshoptDecoder.ready;
const gltfSchema = z.object({
  nodes: z.array(
    z.object({ mesh: z.number(), extras: z.object({ anatomyId: z.string() }) }),
  ),
  meshes: z.array(
    z.object({
      primitives: z.array(
        z.object({
          attributes: z.object({ POSITION: z.number(), NORMAL: z.number() }),
          indices: z.number(),
        }),
      ),
    }),
  ),
  accessors: z.array(
    z.object({
      bufferView: z.number(),
      count: z.number(),
      componentType: z.number(),
    }),
  ),
  bufferViews: z.array(
    z.object({
      byteLength: z.number(),
      extensions: z.object({
        EXT_meshopt_compression: z.object({
          byteOffset: z.number(),
          byteLength: z.number(),
          byteStride: z.number(),
          count: z.number(),
          mode: z.enum(["ATTRIBUTES", "TRIANGLES", "INDICES"]),
        }),
      }),
    }),
  ),
});
for (const asset of VENOUS_ASSETS) {
  const bytes = await readFile(new URL("apps/web/public" + asset.uri, root));
  if (
    bytes.length !== asset.byteLength ||
    hash(bytes) !== asset.sha256 ||
    bytes.readUInt32LE(8) !== bytes.length
  )
    throw Error("Venous GLB checksum/size differs: " + asset.id);
  const length = bytes.readUInt32LE(12),
    gltf = gltfSchema.parse(
      JSON.parse(bytes.toString("utf8", 20, 20 + length)),
    );
  const decoded = gltf.bufferViews.map((v) => {
    const ext = v.extensions.EXT_meshopt_compression,
      target = new Uint8Array(v.byteLength);
    MeshoptDecoder.decodeGltfBuffer(
      target,
      ext.count,
      ext.byteStride,
      bytes.subarray(
        28 + length + ext.byteOffset,
        28 + length + ext.byteOffset + ext.byteLength,
      ),
      ext.mode,
    );
    return target;
  });
  let regionTriangles = 0;
  for (const node of gltf.nodes) {
    const id = node.extras.anatomyId,
      s = VENOUS_INVENTORY.find((s) => s.id === id);
    if (!s || s.assetId !== asset.id || mapped.has(id))
      throw Error("Duplicate/orphan venous mesh: " + id);
    mapped.add(id);
    const primitive = gltf.meshes[node.mesh]!.primitives[0]!,
      pa = gltf.accessors[primitive.attributes.POSITION]!,
      na = gltf.accessors[primitive.attributes.NORMAL]!,
      ia = gltf.accessors[primitive.indices]!;
    if (
      pa.componentType !== 5126 ||
      na.componentType !== 5126 ||
      ia.componentType !== 5125 ||
      pa.count !== na.count
    )
      throw Error("Invalid component layout: " + id);
    const p = new Float32Array(decoded[pa.bufferView]!.buffer),
      n = new Float32Array(decoded[na.bufferView]!.buffer),
      ix = new Uint32Array(decoded[ia.bufferView]!.buffer);
    if (
      !p.every(Number.isFinite) ||
      !n.every(Number.isFinite) ||
      ix.length % 3 ||
      ix.some((i) => i >= pa.count) ||
      ix.length / 3 !== s.triangleCount
    )
      throw Error("Malformed venous geometry: " + id);
    const min = [Infinity, Infinity, Infinity],
      max = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < p.length; i++) {
      const k = i % 3;
      min[k] = Math.min(min[k]!, p[i]!);
      max[k] = Math.max(max[k]!, p[i]!);
    }
    for (let k = 0; k < 3; k++)
      if (
        Math.abs(min[k]! - s.bounds!.min[k]!) > 1e-6 ||
        Math.abs(max[k]! - s.bounds!.max[k]!) > 1e-6
      )
        throw Error("Bounds mismatch: " + id);
    for (const f of s.sourceFiles) {
      if (sourceFiles.has(f.id)) throw Error("Duplicate source file: " + f.id);
      sourceFiles.add(f.id);
    }
    regionTriangles += s.triangleCount;
  }
  if (
    regionTriangles !== asset.triangleCount ||
    gltf.nodes.length !== asset.structureIds.length
  )
    errors.push("Venous region counts differ: " + asset.id);
  triangles += regionTriangles;
}
for (const s of VENOUS_INVENTORY) {
  if (Boolean(s.assetId) !== mapped.has(s.id))
    errors.push("Inventory/geometry mismatch: " + s.id);
  if (!s.assetId && (!s.missingReason || s.meshIds.length || s.triangleCount))
    errors.push("Dishonest missing geometry: " + s.id);
  if (s.reviewedBy || s.reviewDate || s.validationStatus !== "unverified")
    errors.push("Unauthorized medical promotion: " + s.id);
}
if (
  VENOUS_MANIFEST.connections.some(
    (e) =>
      e.from === "venous-hepatic-portal-vein" &&
      e.to === "venous-inferior-vena-cava",
  )
)
  errors.push("Portal bypass of hepatic microcirculation");
if (errors.length) throw Error(errors.join("\n"));
process.stdout.write(
  JSON.stringify({
    venous: VENOUS_COVERAGE,
    regionalAssets: VENOUS_ASSETS.length,
    triangles,
    sourceMeshes: sourceFiles.size,
    protectedFiles: Object.keys(baseline.files).length,
    clinicalReview: "pending",
  }) + "\n",
);
