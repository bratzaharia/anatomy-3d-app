// Read-only derivation from the existing asset. Never rebuilds or rewrites it.
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { MeshoptDecoder } from "meshoptimizer";
import { format } from "prettier";
const root = new URL("../../", import.meta.url);
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const manifest = JSON.parse(
  await readFile(
    new URL("packages/anatomy-data/src/skeleton-manifest.json", root),
    "utf8",
  ),
);
const glb = await readFile(new URL("apps/web/public" + manifest.uri, root));
if (hash(glb) !== manifest.sha256)
  throw new Error("Skeletal asset checksum differs");
const jsonLength = glb.readUInt32LE(12);
const gltf = JSON.parse(glb.toString("utf8", 20, 20 + jsonLength));
const skull = manifest.structures.find((item) => item.id === "skull");
const node = gltf.nodes.find((item) => item.extras.anatomyId === skull.id);
const primitive = gltf.meshes[node.mesh].primitives[0];
await MeshoptDecoder.ready;
function decode(accessorId) {
  const accessor = gltf.accessors[accessorId];
  const view = gltf.bufferViews[accessor.bufferView];
  const extension = view.extensions.EXT_meshopt_compression;
  const bytes = new Uint8Array(view.byteLength);
  MeshoptDecoder.decodeGltfBuffer(
    bytes,
    extension.count,
    extension.byteStride,
    glb.subarray(
      28 + jsonLength + extension.byteOffset,
      28 + jsonLength + extension.byteOffset + extension.byteLength,
    ),
    extension.mode,
  );
  return Buffer.from(bytes);
}
const positions = decode(primitive.attributes.POSITION),
  indices = decode(primitive.indices);
const ranges = [],
  used = new Set();
let vertexStart = 0,
  indexStart = 0;
for (const concept of skull.sourceConcepts) {
  const vertices = [],
    faces = [];
  for (const id of concept.fileIds) {
    if (used.has(id)) throw new Error("Ambiguous source ownership: " + id);
    used.add(id);
    const original = await readFile(
      new URL(`tools/anatomy-assets/.cache/${id}.obj`, root),
    );
    if (
      hash(original) !==
      skull.sourceFiles.find((item) => item.id === id)?.sha256
    )
      throw new Error("Source checksum differs: " + id);
    const base = vertexStart + vertices.length / 3;
    for (const line of original.toString().split("\n")) {
      if (line.startsWith("v ")) {
        const [x, y, z] = line.trim().split(/\s+/).slice(1).map(Number);
        vertices.push(x / 1000, z / 1000, -y / 1000);
      } else if (line.startsWith("f ")) {
        const face = line
          .trim()
          .split(/\s+/)
          .slice(1)
          .map((item) => Number(item.split("/")[0]) - 1 + base);
        for (let i = 1; i < face.length - 1; i++)
          faces.push(face[0], face[i], face[i + 1]);
      }
    }
  }
  const vertexBytes = Buffer.from(new Float32Array(vertices).buffer),
    indexBytes = Buffer.from(new Uint32Array(faces).buffer);
  if (
    !vertexBytes.equals(
      positions.subarray(
        vertexStart * 12,
        vertexStart * 12 + vertexBytes.length,
      ),
    ) ||
    !indexBytes.equals(
      indices.subarray(indexStart * 4, indexStart * 4 + indexBytes.length),
    )
  )
    throw new Error(
      "Source boundary cannot be recovered exactly: " + concept.conceptId,
    );
  ranges.push({
    conceptId: concept.conceptId,
    bounds: {
      min: [0, 1, 2].map((axis) => {
        let value = Infinity;
        const floats = new Float32Array(
          vertexBytes.buffer,
          vertexBytes.byteOffset,
          vertices.length,
        );
        for (let i = axis; i < floats.length; i += 3)
          value = Math.min(value, floats[i]);
        return value;
      }),
      max: [0, 1, 2].map((axis) => {
        let value = -Infinity;
        const floats = new Float32Array(
          vertexBytes.buffer,
          vertexBytes.byteOffset,
          vertices.length,
        );
        for (let i = axis; i < floats.length; i += 3)
          value = Math.max(value, floats[i]);
        return value;
      }),
    },
    vertexStart,
    vertexCount: vertices.length / 3,
    indexStart,
    indexCount: faces.length,
    positionSha256: hash(vertexBytes),
    indexSha256: hash(indexBytes),
  });
  vertexStart += vertices.length / 3;
  indexStart += faces.length;
}
if (vertexStart * 12 !== positions.length || indexStart * 4 !== indices.length)
  throw new Error("Incomplete skull partition");
const result = {
  assetSha256: manifest.sha256,
  vertexCount: vertexStart,
  indexCount: indexStart,
  normalSha256: hash(decode(primitive.attributes.NORMAL)),
  ranges,
};
await writeFile(
  new URL("packages/anatomy-data/src/skull-color-ranges.json", root),
  await format(JSON.stringify(result), { parser: "json" }),
);
process.stdout.write(
  `Verified ${ranges.length} source-bone boundaries against every existing skull vertex and index. Skeletal GLB unchanged.\n`,
);
