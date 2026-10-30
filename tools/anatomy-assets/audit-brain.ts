import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { MeshoptDecoder } from "meshoptimizer";
import { BRAIN_IDS, BRAIN_REGIONS, NERVOUS_ASSET } from "@anatomy/data";
const root = new URL("../../", import.meta.url);
const hash = (b: Uint8Array) => createHash("sha256").update(b).digest("hex");
const bytes = await readFile(
  new URL("apps/web/public" + NERVOUS_ASSET.uri, root),
);
if (hash(bytes) !== NERVOUS_ASSET.sha256)
  throw Error("Brain source checksum mismatch");
const length = bytes.readUInt32LE(12),
  gltf = JSON.parse(bytes.toString("utf8", 20, 20 + length));
await MeshoptDecoder.ready;
const rows: object[] = [];
let faceCount = 0;
for (const id of BRAIN_IDS) {
  const nodes = gltf.nodes.filter(
    (n: { extras?: { anatomyId?: string } }) => n.extras?.anatomyId === id,
  );
  if (nodes.length !== 1) throw Error("Ambiguous brain node: " + id);
  const node = nodes[0],
    primitives = gltf.meshes[node.mesh].primitives;
  if (
    primitives.length !== 1 ||
    node.matrix ||
    node.translation ||
    node.rotation ||
    node.scale
  )
    throw Error("Unexpected brain transform/primitive layout");
  const p = primitives[0];
  if (Object.keys(p.attributes).sort().join(",") !== "NORMAL,POSITION")
    throw Error("Unexpected unaudited brain attributes: " + id);
  function decode(index: number) {
    const a = gltf.accessors[index],
      v = gltf.bufferViews[a.bufferView],
      e = v.extensions.EXT_meshopt_compression,
      out = new Uint8Array(v.byteLength);
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
  const positions = decode(p.attributes.POSITION),
    normals = decode(p.attributes.NORMAL),
    indices = decode(p.indices);
  const points = new Float32Array(positions.buffer),
    faces = new Uint32Array(indices.buffer),
    ns = new Float32Array(normals.buffer);
  const region = BRAIN_REGIONS.find((r) => r.id === id)!,
    source = NERVOUS_ASSET.structures.find((s) => s.id === id)!;
  if (
    faces.length / 3 !== source.triangleCount ||
    faces.some((i) => i * 3 >= points.length) ||
    !points.every(Number.isFinite) ||
    !ns.every(Number.isFinite)
  )
    throw Error("Invalid brain topology: " + id);
  const min = [Infinity, Infinity, Infinity],
    max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < points.length; i++) {
    const axis = i % 3;
    min[axis] = Math.min(min[axis]!, points[i]!);
    max[axis] = Math.max(max[axis]!, points[i]!);
  }
  if (
    min.some((v, i) => Math.abs(v - source.bounds.min[i]!) > 1e-6) ||
    max.some((v, i) => Math.abs(v - source.bounds.max[i]!) > 1e-6)
  )
    throw Error("Brain bounds differ: " + id);
  const centerX = (min[0]! + max[0]!) / 2;
  if (
    (region.laterality === "left" && centerX < 0) ||
    (region.laterality === "right" && centerX > 0)
  )
    throw Error("Brain side conflict: " + id);
  faceCount += faces.length / 3;
  rows.push({
    id,
    sourceConcepts: region.terminologyIds,
    laterality: region.laterality,
    category: region.category,
    vertices: points.length / 3,
    triangles: faces.length / 3,
    positionSha256: hash(positions),
    indexSha256: hash(indices),
    attributes: Object.keys(p.attributes),
    bounds: { min, max },
    mappingStatus: "source-identified-not-medically-reviewed",
  });
}
const report = {
  version: 1,
  sourceSha256: NERVOUS_ASSET.sha256,
  coordinateTransform: NERVOUS_ASSET.coordinateTransform,
  geometryModified: false,
  regionCount: rows.length,
  triangleCount: faceCount,
  textures: gltf.textures?.length ?? 0,
  hasCorticalAtlasLabels: false,
  hasSphericalCorrespondence: false,
  canColorSourceParts: true,
  canRenderRegisteredAdvancedAtlas: false,
  clinicalReview: "pending",
  regions: rows,
};
const output = new URL("docs/assets/brain-geometry-audit.json", root),
  serialized = JSON.stringify(report, null, 2) + "\n";
if (process.argv.includes("--write")) await writeFile(output, serialized);
else if (
  JSON.stringify(JSON.parse(await readFile(output, "utf8"))) !==
  JSON.stringify(report)
)
  throw Error(
    "Brain audit changed; investigate before replacing the pinned report",
  );
process.stdout.write(
  JSON.stringify({
    brainRegions: rows.length,
    triangles: faceCount,
    atlasLabels: false,
    geometryModified: false,
  }) + "\n",
);
