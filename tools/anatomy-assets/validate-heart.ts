import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { MeshoptDecoder } from "meshoptimizer";
import {
  HEART_MANIFEST,
  CARDIAC_ASSETS,
  CARDIAC_GEOMETRY,
  CARDIAC_CATALOG,
  CARDIAC_GRAPH,
  CARDIAC_GRAPH_CONCEPTS,
  VENOUS_INVENTORY,
} from "@anatomy/data";
import { validateCardiacGraph } from "@anatomy/core";
const root = new URL("../../", import.meta.url),
  hash = (b: Uint8Array) => createHash("sha256").update(b).digest("hex");
const protectedBaseline = JSON.parse(
  await readFile(
    new URL("docs/assets/heart-protected-baseline.json", root),
    "utf8",
  ),
) as { files: Record<string, string> };
for (const [path, sha] of Object.entries(protectedBaseline.files))
  if (hash(await readFile(new URL(path, root))) !== sha)
    throw Error(`Protected anatomy changed: ${path}`);
const ids = new Set(
  [...CARDIAC_CATALOG, ...VENOUS_INVENTORY, ...CARDIAC_GRAPH_CONCEPTS].map(
    (p) => p.id,
  ),
);
const errors = validateCardiacGraph(ids, CARDIAC_GRAPH);
if (errors.length) throw Error(errors.join("\n"));
const sourceFiles = CARDIAC_GEOMETRY.flatMap((p) =>
  p.sourceFiles.map((f) => f.id),
);
if (sourceFiles.length !== new Set(sourceFiles).size)
  throw Error("Duplicate cardiac source ownership");
if (
  CARDIAC_GEOMETRY.some((p) =>
    p.sourceFiles.some((f) =>
      VENOUS_INVENTORY.some((v) => v.sourceFiles.some((vf) => vf.id === f.id)),
    ),
  )
)
  throw Error("Cardiac GLB duplicates existing veins");
await MeshoptDecoder.ready;
let triangles = 0;
for (const asset of CARDIAC_ASSETS) {
  const b = await readFile(new URL("apps/web/public" + asset.uri, root));
  if (b.length !== asset.byteLength || hash(b) !== asset.sha256)
    throw Error(`Cardiac checksum mismatch ${asset.id}`);
  if (
    b.readUInt32LE(0) !== 0x46546c67 ||
    b.readUInt32LE(4) !== 2 ||
    b.readUInt32LE(8) !== b.length
  )
    throw Error("Invalid cardiac GLB header");
  const size = b.readUInt32LE(12),
    gltf = JSON.parse(b.toString("utf8", 20, 20 + size));
  if (gltf.asset.copyright !== HEART_MANIFEST.attribution)
    throw Error("Missing cardiac attribution");
  const decoded: Uint8Array[] = gltf.bufferViews.map(
    (v: {
      byteLength: number;
      extensions: {
        EXT_meshopt_compression: {
          count: number;
          byteStride: number;
          byteOffset: number;
          byteLength: number;
          mode: string;
        };
      };
    }) => {
      const e = v.extensions.EXT_meshopt_compression,
        target = new Uint8Array(v.byteLength);
      MeshoptDecoder.decodeGltfBuffer(
        target,
        e.count,
        e.byteStride,
        b.subarray(
          28 + size + e.byteOffset,
          28 + size + e.byteOffset + e.byteLength,
        ),
        e.mode,
      );
      return target;
    },
  );
  const seen = new Set<string>();
  let localTriangles = 0;
  for (const node of gltf.nodes) {
    const id = node.extras?.anatomyId,
      part = CARDIAC_GEOMETRY.find((p) => p.id === id);
    if (
      !part ||
      seen.has(id) ||
      !asset.structureIds.includes(id) ||
      node.matrix ||
      node.translation ||
      node.rotation ||
      node.scale
    )
      throw Error("Invalid cardiac identity/transform");
    seen.add(id);
    const p = gltf.meshes[node.mesh].primitives[0],
      pa = gltf.accessors[p.attributes.POSITION],
      ia = gltf.accessors[p.indices],
      na = gltf.accessors[p.attributes.NORMAL];
    const pos = new Float32Array(decoded[pa.bufferView]!.buffer),
      ix = new Uint32Array(decoded[ia.bufferView]!.buffer),
      normals = new Float32Array(decoded[na.bufferView]!.buffer);
    if (
      ix.length / 3 !== part.triangleCount ||
      !pos.every(Number.isFinite) ||
      !normals.every(Number.isFinite) ||
      ix.some((i) => i >= pos.length / 3)
    )
      throw Error("Malformed cardiac source buffers");
    for (let k = 0; k < 3; k++) {
      let min = Infinity,
        max = -Infinity;
      for (let i = k; i < pos.length; i += 3) {
        min = Math.min(min, pos[i]!);
        max = Math.max(max, pos[i]!);
      }
      if (
        Math.abs(min - part.bounds.min[k]!) > 1e-7 ||
        Math.abs(max - part.bounds.max[k]!) > 1e-7
      )
        throw Error("Cardiac bounds differ");
    }
    localTriangles += ix.length / 3;
  }
  if (
    seen.size !== asset.structureIds.length ||
    localTriangles !== asset.triangleCount
  )
    throw Error("Incomplete cardiac mapping");
  triangles += localTriangles;
}
process.stdout.write(
  JSON.stringify({
    cardiacParts: CARDIAC_GEOMETRY.length,
    triangles,
    assets: CARDIAC_ASSETS.length,
    bytes: CARDIAC_ASSETS.reduce((n, a) => n + a.byteLength, 0),
    cavitiesNotWalls: 4,
    sourceLeafletsAndCusps: 11,
    clinicalApproval: false,
    protectedFiles: Object.keys(protectedBaseline.files).length,
  }) + "\n",
);
