import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { inflateRawSync, gzipSync } from "node:zlib";
import { skeletonDefinitions } from "./skeleton-definition.mjs";
import { MeshoptEncoder, MeshoptDecoder } from "meshoptimizer";

const cache = new URL("./.cache/", import.meta.url);
const output = new URL("../../apps/web/public/models/", import.meta.url);
const archiveUrl =
  "https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/partof_BP3D_4.0_obj_99.zip";
const metadataUrl =
  "https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/";
await mkdir(cache, { recursive: true });
await mkdir(output, { recursive: true });
const sha256 = (data) => createHash("sha256").update(data).digest("hex");
async function download(url, range) {
  const response = await fetch(url, {
    headers: range ? { Range: `bytes=${range}` } : {},
    signal: AbortSignal.timeout(90000),
  });
  if (!response.ok || (range && response.status !== 206))
    throw new Error(`Download failed: ${response.status} ${url}`);
  return Buffer.from(await response.arrayBuffer());
}
async function metadata(name, local) {
  try {
    return await readFile(new URL(local, cache), "utf8");
  } catch {
    const bytes = await download(metadataUrl + name);
    await writeFile(new URL(local, cache), bytes);
    return bytes.toString();
  }
}
const [partsText, elementsText] = await Promise.all([
  metadata("partof_parts_list_e.txt", "parts.txt"),
  metadata("partof_element_parts.txt", "elements.txt"),
]);
const parts = partsText
  .trim()
  .split("\n")
  .slice(1)
  .map((line) => line.trim().split("\t"));
const elements = elementsText
  .trim()
  .split("\n")
  .slice(1)
  .map((line) => line.trim().split("\t"));
const conceptsByName = new Map(parts.map(([id, , name]) => [name, id]));
const definitions = skeletonDefinitions.map((definition) => ({
  ...definition,
  sources: definition.sourceNames.map((name) => {
    const conceptId = conceptsByName.get(name);
    if (!conceptId) throw new Error(`Unknown source concept: ${name}`);
    const fileIds = [
      ...new Set(
        elements.filter(([id]) => id === conceptId).map(([, , file]) => file),
      ),
    ];
    if (!fileIds.length) throw new Error(`No geometry for ${name}`);
    return { conceptId, name, fileIds };
  }),
}));

// Read the ZIP central directory using HTTP ranges, then retrieve only curated
// bone entries. The archive contains unrelated anatomical structures.
const entries = new Map();
if (!process.argv.includes("--offline")) {
  const tail = await download(archiveUrl, "-131072");
  let eocd = tail.length - 22;
  while (eocd >= 0 && tail.readUInt32LE(eocd) !== 0x06054b50) eocd--;
  if (eocd < 0) throw new Error("ZIP end-of-directory record missing");
  const directoryOffset = tail.readUInt32LE(eocd + 16);
  const directoryLength = tail.readUInt32LE(eocd + 12);
  const directory = await download(
    archiveUrl,
    `${directoryOffset}-${directoryOffset + directoryLength - 1}`,
  );
  for (let offset = 0; offset < directory.length;) {
    if (directory.readUInt32LE(offset) !== 0x02014b50)
      throw new Error("Invalid ZIP central directory");
    const nameLength = directory.readUInt16LE(offset + 28);
    const extraLength = directory.readUInt16LE(offset + 30);
    const commentLength = directory.readUInt16LE(offset + 32);
    const name = directory.toString(
      "utf8",
      offset + 46,
      offset + 46 + nameLength,
    );
    const id = name.match(/(FJ\d+)\.obj$/)?.[1];
    if (id)
      entries.set(id, {
        name,
        compression: directory.readUInt16LE(offset + 10),
        size: directory.readUInt32LE(offset + 20),
        uncompressedSize: directory.readUInt32LE(offset + 24),
        offset: directory.readUInt32LE(offset + 42),
      });
    offset += 46 + nameLength + extraLength + commentLength;
  }
}
const sourceFiles = new Map();
const ids = [
  ...new Set(
    definitions.flatMap((definition) =>
      definition.sources.flatMap((source) => source.fileIds),
    ),
  ),
];
let cursor = 0;
await Promise.all(
  Array.from({ length: 6 }, async () => {
    while (cursor < ids.length) {
      const id = ids[cursor++];
      const local = new URL(`${id}.obj`, cache);
      let bytes;
      try {
        bytes = await readFile(local);
      } catch {
        const entry = entries.get(id);
        if (!entry) throw new Error(`Missing cached mesh or ZIP entry: ${id}`);
        const header = await download(
          archiveUrl,
          `${entry.offset}-${entry.offset + 29}`,
        );
        if (header.readUInt32LE(0) !== 0x04034b50)
          throw new Error(`Invalid ZIP local header: ${id}`);
        const start =
          entry.offset + 30 + header.readUInt16LE(26) + header.readUInt16LE(28);
        const compressed = await download(
          archiveUrl,
          `${start}-${start + entry.size - 1}`,
        );
        bytes =
          entry.compression === 8 ? inflateRawSync(compressed) : compressed;
        if (bytes.length !== entry.uncompressedSize)
          throw new Error(`Size mismatch: ${id}`);
        await writeFile(local, bytes);
      }
      sourceFiles.set(id, { bytes, sha256: sha256(bytes) });
      if (sourceFiles.size % 20 === 0)
        process.stdout.write(
          `Retrieved ${sourceFiles.size}/${ids.length} bone meshes\n`,
        );
    }
  }),
);

const chunks = [];
const bufferViews = [];
const accessors = [];
const meshes = [];
const nodes = [];
let byteOffset = 0;
let triangles = 0;
const metrics = [];
const overallMin = [Infinity, Infinity, Infinity];
const overallMax = [-Infinity, -Infinity, -Infinity];
function attribute(values, componentType, type, target, min, max) {
  const array =
    componentType === 5126 ? new Float32Array(values) : new Uint32Array(values);
  const bytes = Buffer.from(array.buffer);
  const view = bufferViews.length;
  bufferViews.push({ buffer: 0, byteOffset, byteLength: bytes.length, target });
  chunks.push(bytes);
  byteOffset += bytes.length;
  const index = accessors.length;
  accessors.push({
    bufferView: view,
    componentType,
    count: values.length / (type === "VEC3" ? 3 : 1),
    type,
    ...(min ? { min, max } : {}),
  });
  return index;
}
for (const definition of definitions) {
  const positions = [];
  const indices = [];
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  const uniqueFiles = [
    ...new Set(definition.sources.flatMap((source) => source.fileIds)),
  ];
  for (const fileId of uniqueFiles) {
    const base = positions.length / 3;
    for (const line of sourceFiles.get(fileId).bytes.toString().split("\n")) {
      if (line.startsWith("v ")) {
        const [x, y, z] = line.trim().split(/\s+/).slice(1).map(Number);
        // BodyParts3D: millimetres, Z superior, -Y anterior. glTF: metres,
        // +Y superior and +Z anterior. This proper rotation preserves winding.
        const point = [x / 1000, z / 1000, -y / 1000];
        if (!point.every(Number.isFinite))
          throw new Error(`Invalid vertex in ${fileId}`);
        positions.push(...point);
      } else if (line.startsWith("f ")) {
        const face = line
          .trim()
          .split(/\s+/)
          .slice(1)
          .map((item) => Number(item.split("/")[0]) - 1 + base);
        for (let i = 1; i < face.length - 1; i++)
          indices.push(face[0], face[i], face[i + 1]);
      }
    }
  }
  const normals = new Float32Array(positions.length);
  for (let i = 0; i < indices.length; i += 3) {
    const [a, b, c] = indices.slice(i, i + 3).map((index) => index * 3);
    const ab = [0, 1, 2].map(
      (axis) => positions[b + axis] - positions[a + axis],
    );
    const ac = [0, 1, 2].map(
      (axis) => positions[c + axis] - positions[a + axis],
    );
    const cross = [
      ab[1] * ac[2] - ab[2] * ac[1],
      ab[2] * ac[0] - ab[0] * ac[2],
      ab[0] * ac[1] - ab[1] * ac[0],
    ];
    for (const vertex of [a, b, c])
      for (let axis = 0; axis < 3; axis++)
        normals[vertex + axis] += cross[axis];
  }
  for (let i = 0; i < normals.length; i += 3) {
    const length = Math.hypot(normals[i], normals[i + 1], normals[i + 2]) || 1;
    for (let axis = 0; axis < 3; axis++) {
      normals[i + axis] /= length;
      min[axis] = Math.min(min[axis], positions[i + axis]);
      max[axis] = Math.max(max[axis], positions[i + axis]);
    }
  }
  for (let axis = 0; axis < 3; axis++) {
    overallMin[axis] = Math.min(overallMin[axis], min[axis]);
    overallMax[axis] = Math.max(overallMax[axis], max[axis]);
  }
  const position = attribute(positions, 5126, "VEC3", 34962, min, max);
  const normal = attribute(normals, 5126, "VEC3", 34962);
  const index = attribute(indices, 5125, "SCALAR", 34963);
  const mesh = meshes.length;
  meshes.push({
    name: definition.id,
    primitives: [
      {
        attributes: { POSITION: position, NORMAL: normal },
        indices: index,
        material: 0,
      },
    ],
  });
  nodes.push({
    name: definition.id,
    mesh,
    extras: { anatomyId: definition.id },
  });
  triangles += indices.length / 3;
  metrics.push({
    id: definition.id,
    names: { en: definition.en, ro: definition.ro },
    latinName: definition.latin,
    regionId: definition.region,
    laterality:
      definition.side ??
      (definition.id === "pelvic-girdle" ? "bilateral" : "midline"),
    sourceConcepts: definition.sources,
    sourceFiles: uniqueFiles.map((id) => ({
      id,
      sha256: sourceFiles.get(id).sha256,
    })),
    bounds: { min, max },
    triangleCount: indices.length / 3,
  });
}
const gltf = {
  asset: {
    version: "2.0",
    generator: "Human Anatomy 3D Atlas — BodyParts3D import",
    copyright:
      "BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International",
  },
  scene: 0,
  scenes: [{ nodes: nodes.map((_, i) => i) }],
  nodes,
  meshes,
  materials: [
    {
      name: "Bone",
      pbrMetallicRoughness: {
        baseColorFactor: [0.88, 0.84, 0.72, 1],
        metallicFactor: 0,
        roughnessFactor: 0.62,
      },
    },
  ],
  buffers: [{ byteLength: byteOffset }],
  bufferViews,
  accessors,
};
// Lossless compression: retain every Float32 vertex, normal, and index exactly.
// Verify a round trip before writing; no simplification or quantization occurs.
await Promise.all([MeshoptEncoder.ready, MeshoptDecoder.ready]);
const rawBinary = Buffer.concat(chunks);
const rawJsonLength = Buffer.byteLength(JSON.stringify(gltf));
const compressedChunks = [];
let compressedOffset = 0;
for (let i = 0; i < bufferViews.length; i++) {
  const view = bufferViews[i];
  const stride = view.target === 34963 ? 4 : 12;
  const mode = view.target === 34963 ? "INDICES" : "ATTRIBUTES";
  const source = chunks[i];
  const count = source.length / stride;
  const encoded = MeshoptEncoder.encodeGltfBuffer(source, count, stride, mode);
  const decoded = new Uint8Array(source.length);
  MeshoptDecoder.decodeGltfBuffer(decoded, count, stride, encoded, mode);
  if (!Buffer.from(decoded).equals(source))
    throw new Error(`Compression round trip failed at buffer view ${i}`);
  view.buffer = 1;
  view.extensions = {
    EXT_meshopt_compression: {
      buffer: 0,
      byteOffset: compressedOffset,
      byteLength: encoded.length,
      byteStride: stride,
      count,
      mode,
    },
  };
  const padding = Buffer.alloc((4 - (encoded.length % 4)) % 4);
  compressedChunks.push(Buffer.from(encoded), padding);
  compressedOffset += encoded.length + padding.length;
}
gltf.extensionsUsed = ["EXT_meshopt_compression"];
gltf.extensionsRequired = ["EXT_meshopt_compression"];
gltf.buffers = [
  { byteLength: compressedOffset },
  {
    byteLength: byteOffset,
    extensions: { EXT_meshopt_compression: { fallback: true } },
  },
];
const json = Buffer.from(JSON.stringify(gltf));
const paddedJson = Buffer.concat([
  json,
  Buffer.alloc((4 - (json.length % 4)) % 4, 0x20),
]);
const binary = Buffer.concat(compressedChunks);
const glbHeader = Buffer.alloc(12);
glbHeader.writeUInt32LE(0x46546c67);
glbHeader.writeUInt32LE(2, 4);
glbHeader.writeUInt32LE(28 + paddedJson.length + binary.length, 8);
const jsonHeader = Buffer.alloc(8);
jsonHeader.writeUInt32LE(paddedJson.length);
jsonHeader.writeUInt32LE(0x4e4f534a, 4);
const binHeader = Buffer.alloc(8);
binHeader.writeUInt32LE(binary.length);
binHeader.writeUInt32LE(0x004e4942, 4);
const glb = Buffer.concat([
  glbHeader,
  jsonHeader,
  paddedJson,
  binHeader,
  binary,
]);
await writeFile(new URL("bodyparts3d-skeleton.glb", output), glb);
const manifest = {
  id: "bodyparts3d-skeleton-v4",
  uri: "/models/bodyparts3d-skeleton.glb",
  sourceUrl: archiveUrl,
  sourceVersion: "4.0, PART-OF, 99% polygon reduction",
  licenseId: "CC-BY-4.0",
  licenseUrl: "https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html",
  attribution: gltf.asset.copyright,
  checkedAt: "2026-10-27",
  sha256: sha256(glb),
  byteLength: glb.length,
  gzipByteLength: gzipSync(glb).length,
  compression: "EXT_meshopt_compression (lossless)",
  rawByteLength: rawBinary.length + rawJsonLength + 28,
  rawGzipByteLength: gzipSync(rawBinary).length,
  triangleCount: triangles,
  sourceMeshCount: ids.length,
  bounds: { min: overallMin, max: overallMax },
  structures: metrics,
};
await writeFile(
  new URL(
    "../../packages/anatomy-data/src/skeleton-manifest.json",
    import.meta.url,
  ),
  JSON.stringify(manifest, null, 2) + "\n",
);
await writeFile(
  new URL("bodyparts3d-attribution.txt", output),
  `${gltf.asset.copyright}\nSource: ${archiveUrl}\nLicense: https://creativecommons.org/licenses/by/4.0/\nAdaptations: curated bones, OBJ to GLB, coordinate and unit conversion, recomputed smooth normals, material assignment, semantic grouping, lossless Meshopt compression. No additional decimation or quantization.\n`,
);
process.stdout.write(
  JSON.stringify({
    structures: metrics.length,
    sourceMeshes: ids.length,
    triangles,
    bytes: glb.length,
    gzipBytes: manifest.gzipByteLength,
    bounds: manifest.bounds,
  }) + "\n",
);
