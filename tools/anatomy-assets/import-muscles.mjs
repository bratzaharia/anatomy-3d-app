import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { inflateRawSync, gzipSync } from "node:zlib";
import { MeshoptEncoder, MeshoptDecoder } from "meshoptimizer";
import { format } from "prettier";
import {
  muscleDefinitions,
  muscleGroups,
  muscleId,
  sourceAssemblies,
  inventoryVersion,
  terminologyUrl,
} from "./muscle-definition.mjs";
const cache = new URL("./.cache/", import.meta.url);
const output = new URL("../../apps/web/public/models/", import.meta.url);
const archiveUrl =
  "https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/isa_BP3D_4.0_obj_99.zip";
const metadataUrl =
  "https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/";
const sha256 = (data) => createHash("sha256").update(data).digest("hex");
const writeGenerated = async (url, content, parser) =>
  writeFile(url, await format(content, { parser }));
await mkdir(cache, { recursive: true });
await mkdir(output, { recursive: true });
async function download(url, range) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, {
        headers: range ? { Range: `bytes=${range}` } : {},
        signal: AbortSignal.timeout(90000),
      });
      if (!response.ok || (range && response.status !== 206))
        throw new Error(`HTTP ${response.status}: ${url}`);
      return Buffer.from(await response.arrayBuffer());
    } catch (error) {
      if (attempt === 2) throw error;
    }
  }
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
  metadata("isa_parts_list_e.txt", "isa-parts.txt"),
  metadata("isa_element_parts.txt", "isa-elements.txt"),
]);
const rows = (text) =>
  text
    .trim()
    .split("\n")
    .slice(1)
    .map((line) => line.trim().split("\t"));
const byName = new Map(rows(partsText).map(([id, , name]) => [name, id]));
const elements = rows(elementsText);
function source(name) {
  const originalName = byName.has(name) ? name : name + " muscle";
  const conceptId = byName.get(originalName);
  if (!conceptId) return null;
  const fileIds = [
    ...new Set(
      elements.filter(([id]) => id === conceptId).map(([, , file]) => file),
    ),
  ];
  return fileIds.length ? { conceptId, name: originalName, fileIds } : null;
}
function sidedName(name, side) {
  if (!["left", "right"].includes(side)) return name;
  if (name.includes(" of hand") || name.includes(" of foot"))
    return name.replace(/ of (hand|foot)$/, ` of ${side} $1`);
  if (name.startsWith("set of "))
    return name.replace("set of ", "set of " + side + " ");
  return side + " " + name;
}
const inventory = [];
for (const definition of muscleDefinitions)
  for (const side of definition.sides) {
    let sources;
    if (sourceAssemblies[definition.name]) {
      const all = sourceAssemblies[definition.name].map((name) =>
        source(name.replace("$", side)),
      );
      // Missing parts mean that the whole-muscle identity is NOT advertised as complete.
      sources = all.every(Boolean) ? all : [];
    } else sources = [source(sidedName(definition.name, side))].filter(Boolean);
    const group = muscleGroups[definition.group];
    const region = ["upper-limb", "lower-limb"].includes(group[0])
      ? group[0] + "-" + side
      : group[0];
    const id = muscleId(definition.name, side);
    const groupedIn = definition.groupedIn
      ? muscleId(definition.groupedIn, side)
      : null;
    inventory.push({
      id,
      name: definition.name,
      side,
      region,
      group: definition.group,
      depth: group[3],
      en:
        (["left", "right"].includes(side)
          ? side[0].toUpperCase() + side.slice(1) + " "
          : "") +
        definition.name +
        (definition.grouped ? " (source set)" : ""),
      ro:
        definition.ro +
        (side === "left" ? " — stânga" : side === "right" ? " — dreapta" : ""),
      latin: definition.latin,
      sources,
      mappingStatus: sources.length
        ? definition.grouped
          ? "grouped"
          : "independent"
        : groupedIn
          ? "grouped-only"
          : "missing",
      groupedIn,
      reviewStatus: "unreviewed",
      medicalSource: terminologyUrl,
      gap: sources.length
        ? null
        : groupedIn
          ? "Only the named source set is mapped; no independent member mesh."
          : "No complete, independently mapped source concept in the audited release.",
    });
  }
// The source tables assign the opposite spatial side for these concepts.
// Quarantine rather than silently relabeling geometry without medical review.
for (const item of inventory)
  if (
    ["flexor pollicis brevis", "middle pharyngeal constrictor"].includes(
      item.name,
    )
  ) {
    item.sources = [];
    item.mappingStatus = "missing";
    item.gap =
      "Quarantined: source concept laterality conflicts with geometry coordinates; requires independent correction/review.";
  }
const definitions = inventory.filter((item) => item.sources.length);
if (process.argv.includes("--inventory-only")) {
  process.stdout.write(
    inventory
      .map(
        (i) =>
          `${i.mappingStatus} | ${i.id} | ${i.sources.flatMap((s) => s.fileIds).join(",")}`,
      )
      .join("\n") + "\n",
  );
  process.exit(0);
}
const skeletonReference = JSON.parse(
  await readFile(
    new URL(
      "../../packages/anatomy-data/src/skeleton-manifest.json",
      import.meta.url,
    ),
    "utf8",
  ),
);
const landmarks = skeletonReference.structures.map((item) => ({
  id: item.id,
  sourceFile: item.sourceFiles[0],
}));
const baseline = JSON.parse(
  await readFile(
    new URL(
      "../../docs/assets/skeleton-regression-baseline.json",
      import.meta.url,
    ),
    "utf8",
  ),
);
for (const [path, expected] of Object.entries(baseline.files))
  if (
    sha256(await readFile(new URL("../../" + path, import.meta.url))) !==
    expected
  )
    throw new Error("Skeletal baseline changed: " + path);
const landmarkBaseline = JSON.parse(
  await readFile(
    new URL(
      "../../docs/assets/skeleton-landmark-baseline.json",
      import.meta.url,
    ),
    "utf8",
  ),
).landmarks;
const muscleFileIds = [
  ...new Set(
    definitions.flatMap((item) =>
      item.sources.flatMap((source) => source.fileIds),
    ),
  ),
];
const ids = [
  ...new Set([...muscleFileIds, ...landmarks.map((l) => l.sourceFile.id)]),
];
const entries = new Map();
if (!process.argv.includes("--offline")) {
  const tail = await download(archiveUrl, "-262144");
  let e = tail.length - 22;
  while (e >= 0 && tail.readUInt32LE(e) !== 0x06054b50) e--;
  if (e < 0) throw new Error("ZIP directory missing");
  const offset = tail.readUInt32LE(e + 16),
    size = tail.readUInt32LE(e + 12);
  const directory = await download(
    archiveUrl,
    `${offset}-${offset + size - 1}`,
  );
  for (let p = 0; p < directory.length;) {
    if (directory.readUInt32LE(p) !== 0x02014b50)
      throw new Error("Invalid ZIP directory");
    const n = directory.readUInt16LE(p + 28),
      x = directory.readUInt16LE(p + 30),
      c = directory.readUInt16LE(p + 32);
    const name = directory.toString("utf8", p + 46, p + 46 + n),
      id = name.match(/(FJ\d+M?)\.obj$/)?.[1];
    if (id)
      entries.set(id, {
        offset: directory.readUInt32LE(p + 42),
        size: directory.readUInt32LE(p + 20),
        rawSize: directory.readUInt32LE(p + 24),
        compression: directory.readUInt16LE(p + 10),
      });
    p += 46 + n + x + c;
  }
}
const sourceFiles = new Map();
let cursor = 0;
await Promise.all(
  Array.from({ length: 8 }, async () => {
    while (cursor < ids.length) {
      const id = ids[cursor++],
        local = new URL(`isa-${id}.obj`, cache);
      let bytes;
      try {
        bytes = await readFile(local);
      } catch {
        const entry = entries.get(id);
        if (!entry) throw new Error("Missing cached mesh or ZIP entry: " + id);
        const header = await download(
          archiveUrl,
          `${entry.offset}-${entry.offset + 29}`,
        );
        if (header.readUInt32LE(0) !== 0x04034b50)
          throw new Error("Invalid local ZIP entry");
        const start =
          entry.offset + 30 + header.readUInt16LE(26) + header.readUInt16LE(28);
        const compressed = await download(
          archiveUrl,
          `${start}-${start + entry.size - 1}`,
        );
        bytes =
          entry.compression === 8 ? inflateRawSync(compressed) : compressed;
        if (bytes.length !== entry.rawSize)
          throw new Error("ZIP size mismatch: " + id);
        await writeFile(local, bytes);
      }
      sourceFiles.set(id, { bytes, sha256: sha256(bytes) });
      if (sourceFiles.size % 40 === 0)
        process.stdout.write(
          `Retrieved ${sourceFiles.size}/${ids.length} muscle meshes\n`,
        );
    }
  }),
);
// No source file may be rendered under more than one identity.
const owners = new Map();
for (const item of definitions)
  for (const id of new Set(item.sources.flatMap((s) => s.fileIds))) {
    if (owners.has(id))
      throw new Error(
        `Duplicate source ownership: ${id}, ${owners.get(id)}, ${item.id}`,
      );
    owners.set(id, item.id);
  }
const geometryLines = (bytes) =>
  bytes
    .toString()
    .split("\n")
    .filter((line) => /^v |^f /.test(line))
    .join("\n");
for (const landmark of landmarks) {
  const recorded = landmarkBaseline.find((item) => item.id === landmark.id);
  if (!recorded || recorded.sourceFile.sha256 !== landmark.sourceFile.sha256)
    throw new Error("Fixed reference landmark differs: " + landmark.id);
  let fixed;
  try {
    fixed = await readFile(new URL(landmark.sourceFile.id + ".obj", cache));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  if (fixed && sha256(fixed) !== landmark.sourceFile.sha256)
    throw new Error("Fixed reference source checksum differs");
  const candidate = sourceFiles.get(landmark.sourceFile.id);
  const geometryHash = recorded.geometryHash;
  if (fixed && sha256(geometryLines(fixed)) !== geometryHash)
    throw new Error("Fixed reference geometry baseline differs");
  if (sha256(geometryLines(candidate.bytes)) !== geometryHash)
    throw new Error("IS-A/PART-OF reference geometry differs: " + landmark.id);
  landmark.geometryHash = geometryHash;
  landmark.isaSourceHash = candidate.sha256;
}
await writeGenerated(
  new URL("../../docs/assets/muscle-alignment.json", import.meta.url),
  JSON.stringify(
    {
      method:
        "Identical vertex/face line hashes for source-subject reference meshes across IS-A and PART-OF archives (headers differ); identical proper rotation and units; identity layer transform. No skeleton modifications.",
      transform: "[x/1000,z/1000,-y/1000]",
      landmarks,
      maximumSourceDifference: 0,
      reviewStatus:
        "Technical coordinate registration verified; clinical attachment/intersection review pending.",
    },
    null,
    2,
  ) + "\n",
  "json",
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
      name: "Muscle",
      pbrMetallicRoughness: {
        baseColorFactor: [0.6, 0.16, 0.2, 1],
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

await writeFile(new URL("bodyparts3d-muscles.glb", output), glb);
const manifest = {
  id: "bodyparts3d-muscles-v4",
  uri: "/models/bodyparts3d-muscles.glb",
  sourceUrl: archiveUrl,
  sourceVersion: "4.0, IS-A, 99% polygon reduction",
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
  sourceMeshCount: muscleFileIds.length,
  bounds: { min: overallMin, max: overallMax },
  coordinateTransform: "[x/1000, z/1000, -y/1000]",
  inventoryVersion,
  anatomicallyComplete: false,
  metadataHashes: { parts: sha256(partsText), elements: sha256(elementsText) },
  groups: Object.entries(muscleGroups).map(([id, [region, en, ro, depth]]) => ({
    id: "muscle-group-" + id,
    region,
    names: { en, ro },
    depth,
  })),
  structures: metrics,
  inventory: inventory.map(({ sources, ...item }) => ({
    ...item,
    sourceConcepts: sources,
    assetId: sources.length ? "bodyparts3d-muscles-v4" : null,
    meshIds: sources.length ? [item.id] : [],
  })),
};
await writeGenerated(
  new URL(
    "../../packages/anatomy-data/src/muscle-manifest.json",
    import.meta.url,
  ),
  JSON.stringify(manifest, null, 2) + "\n",
  "json",
);
const counts = {};
for (const item of inventory) {
  const row = (counts[item.region] ??= {
    catalog: 0,
    independent: 0,
    grouped: 0,
    groupedOnly: 0,
    missing: 0,
  });
  row.catalog++;
  row[
    {
      independent: "independent",
      grouped: "grouped",
      "grouped-only": "groupedOnly",
      missing: "missing",
    }[item.mappingStatus]
  ]++;
}
const report =
  "# Muscular coverage — inventory " +
  inventoryVersion +
  "\n\nNOT anatomically complete. Independent medical and Romanian terminology review pending. Counts are computed, not a fixed human muscle total. Bilateral/serial source sets are separate rows and are not individual muscles.\n\n| Region | Catalog entries | Independent | Source sets | Grouped only | Missing |\n|---|---:|---:|---:|---:|---:|\n" +
  Object.entries(counts)
    .map(
      ([r, c]) =>
        `| ${r} | ${c.catalog} | ${c.independent} | ${c.grouped} | ${c.groupedOnly} | ${c.missing} |`,
    )
    .join("\n") +
  "\n\n## Unavailable individual geometry\n\n" +
  inventory
    .filter((i) => !i.sources.length)
    .map((i) => `- ${i.id}: ${i.en} — ${i.gap}`)
    .join("\n") +
  "\n";
await writeGenerated(
  new URL("../../docs/assets/MUSCLE_COVERAGE.md", import.meta.url),
  report,
  "markdown",
);
await writeFile(
  new URL("bodyparts3d-muscles-attribution.txt", output),
  gltf.asset.copyright +
    "\n" +
    archiveUrl +
    "\nAdaptations: curated muscle identities, named-part assembly, coordinate/unit conversion, smooth normals, lossless Meshopt compression. No synthesized or newly mirrored geometry. Source-supplied M meshes retained.\n",
);
process.stdout.write(
  JSON.stringify({
    structures: metrics.length,
    sourceMeshes: muscleFileIds.length,
    triangles,
    bytes: glb.length,
    gzipBytes: manifest.gzipByteLength,
    counts,
  }) + "\n",
);
