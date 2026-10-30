// One-off regression proof against the merged base; no geometry or runtime writes.
import { readFile, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { MeshoptDecoder } from "meshoptimizer";
import { format } from "prettier";
const root = new URL("../../", import.meta.url),
  base = "411c37c22f7e75e82735cb944b13c150ec8abf44";
const hash = (b) => createHash("sha256").update(b).digest("hex");
await MeshoptDecoder.ready;
function entries(bytes) {
  const length = bytes.readUInt32LE(12),
    gltf = JSON.parse(bytes.toString("utf8", 20, 20 + length));
  function decode(id) {
    const a = gltf.accessors[id],
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
    return { sha256: hash(out), count: a.count };
  }
  return gltf.nodes.map((n) => {
    const p = gltf.meshes[n.mesh].primitives[0];
    return {
      id: n.extras.anatomyId,
      sourceName: n.extras.sourceName,
      positions: decode(p.attributes.POSITION),
      normals: decode(p.attributes.NORMAL),
      indices: decode(p.indices),
    };
  });
}
const before = new Map(),
  after = new Map(),
  moved = [];
for (const chunk of ["cranial", "upper-limbs", "trunk", "lower-limbs"]) {
  const path = `apps/web/public/models/z-nervous-${chunk}.glb`;
  const prior = execFileSync("git", ["show", `${base}:${path}`], {
    cwd: root,
    maxBuffer: 30000000,
  });
  const current = await readFile(new URL(path, root));
  for (const [registry, data] of [
    [before, prior],
    [after, current],
  ])
    for (const entry of entries(data)) {
      if (registry.has(entry.id)) throw Error("Duplicate source identity");
      registry.set(entry.id, { chunk, entry });
    }
}
for (const [id, prior] of before) {
  const current = after.get(id);
  if (!current || JSON.stringify(prior.entry) !== JSON.stringify(current.entry))
    throw Error("Existing neural attributes changed: " + id);
  if (prior.chunk !== current.chunk)
    moved.push({ id, from: prior.chunk, to: current.chunk });
}
if (
  before.size !== 247 ||
  after.size !== 247 ||
  moved.length !== 4 ||
  moved.some(
    (m) =>
      !m.id.includes("maxillary-nerve") ||
      m.from !== "upper-limbs" ||
      m.to !== "cranial",
  )
)
  throw Error("Unexpected repack scope");
const report = {
  baseCommit: base,
  sourceGeometryIdentical: true,
  entitiesCompared: before.size,
  moved,
  method:
    "Bit-for-bit decoded POSITION, NORMAL and index buffer SHA-256/count comparison for every retained Z-Anatomy identity, plus original source name. No registration, anatomical shape, normal or topology changed.",
  sourceLicense: "CC-BY-SA-4.0",
  clinicalReview: "pending",
};
await writeFile(
  new URL("docs/assets/NERVOUS_REPACK_AUDIT.json", root),
  await format(JSON.stringify(report), { parser: "json" }),
);
process.stdout.write(
  `Verified ${before.size} unchanged neural surfaces; ${moved.length} maxillary source identities repacked into cranial.\n`,
);
