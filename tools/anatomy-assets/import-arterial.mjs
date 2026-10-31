// Independent source-only arterial adapter. Never runs previous importers.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { inflateRawSync } from "node:zlib";
import { execFileSync } from "node:child_process";
import { format } from "prettier";
import {
  arterialDefinitions,
  arterialMissing,
} from "./arterial-definition.mjs";
import { writeMeshoptGlb } from "./meshopt-glb.mjs";
const root = new URL("../../", import.meta.url);
const sourceBase =
  "https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/";
const archiveUrl = sourceBase + "isa_BP3D_4.0_obj_99.zip";
const cache =
  process.env.ANATOMY_SOURCE_CACHE ??
  new URL("./.cache/", import.meta.url).pathname;
await mkdir(cache, { recursive: true });
const sha = (b) => createHash("sha256").update(b).digest("hex");
const save = async (p, d) =>
  writeFile(
    new URL(p, root),
    await format(JSON.stringify(d), { parser: "json" }),
  );
const cached = (n) => readFile(`${cache}/${n}`);
let previousManifest;
try {
  previousManifest = JSON.parse(
    await readFile(
      new URL("packages/anatomy-data/src/arterial-manifest.json", root),
      "utf8",
    ),
  );
} catch (e) {
  if (e.code !== "ENOENT") throw e;
}
const pin = (name, bytes) => {
  const expected = previousManifest?.metadata.find((m) => m.filename === name);
  if (expected && sha(bytes) !== expected.sha256)
    throw Error(`Pinned source metadata changed: ${name}`);
  return bytes;
};
async function acquire(name, url) {
  let bytes;
  try {
    bytes = await cached(name);
  } catch (e) {
    if (e.code !== "ENOENT" || process.argv.includes("--offline")) throw e;
    const r = await fetch(url, { signal: AbortSignal.timeout(90000) });
    if (!r.ok) throw Error(`Source metadata HTTP ${r.status}`, { cause: e });
    bytes = Buffer.from(await r.arrayBuffer());
    pin(name, bytes);
    await writeFile(`${cache}/${name}`, bytes);
  }
  return pin(name, bytes);
}
const rows = (b) =>
  b
    .toString()
    .trim()
    .split("\n")
    .slice(1)
    .map((l) => l.trim().split("\t"));
const [isaParts, isaElements, parts, elements, license] = await Promise.all([
  acquire("isa-parts.txt", sourceBase + "isa_parts_list_e.txt"),
  acquire("isa-elements.txt", sourceBase + "isa_element_parts.txt"),
  acquire("parts.txt", sourceBase + "partof_parts_list_e.txt"),
  acquire("elements.txt", sourceBase + "partof_element_parts.txt"),
  acquire(
    "venous-bodyparts3d-license.html",
    "https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html",
  ),
]);
let directory;
try {
  directory = await cached("venous-zip-directory.bin");
} catch (e) {
  if (e.code !== "ENOENT" || process.argv.includes("--offline")) throw e;
  const tail = await range("-262144");
  let end = tail.length - 22;
  while (end >= 0 && tail.readUInt32LE(end) !== 0x06054b50) end--;
  if (end < 0) throw Error("Source ZIP end record missing", { cause: e });
  const offset = tail.readUInt32LE(end + 16),
    size = tail.readUInt32LE(end + 12);
  directory = pin(
    "venous-zip-directory.bin",
    await range(offset, offset + size - 1),
  );
  await writeFile(`${cache}/venous-zip-directory.bin`, directory);
}
pin("venous-zip-directory.bin", directory);
if (!license.toString().includes("4.0"))
  throw Error("Missing license evidence");
const protectedPaths = execFileSync(
  "git",
  ["ls-files", "apps/web/public/models", "packages/anatomy-data/src"],
  { cwd: root, encoding: "utf8" },
)
  .trim()
  .split("\n")
  .filter(
    (p) =>
      !p.startsWith("apps/web/public/models/bodyparts3d-arterial-") &&
      p !== "packages/anatomy-data/src/arterial-manifest.json" &&
      (p.startsWith("apps/web/public/models/") || p.endsWith(".json")),
  );
let baseline;
try {
  baseline = JSON.parse(
    await readFile(
      new URL("docs/assets/arterial-protected-baseline.json", root),
      "utf8",
    ),
  );
} catch (e) {
  if (e.code !== "ENOENT") throw e;
}
baseline ??= {
  baseCommit: execFileSync("git", ["rev-parse", "HEAD"], {
    cwd: root,
    encoding: "utf8",
  }).trim(),
  files: Object.fromEntries(
    await Promise.all(
      protectedPaths.map(async (p) => [
        p,
        sha(await readFile(new URL(p, root))),
      ]),
    ),
  ),
};
const protectedFiles = baseline.files;
if (protectedPaths.some((path) => !(path in protectedFiles)))
  throw Error(
    "Protected baseline is incomplete; audit missing paths against the base commit",
  );
for (const [path, hash] of Object.entries(protectedFiles))
  if (sha(await readFile(new URL(path, root))) !== hash)
    throw Error(`Protected input changed: ${path}`);
const entries = new Map();
for (let i = 0; i < directory.length;) {
  if (directory.readUInt32LE(i) !== 0x02014b50)
    throw Error("Invalid source archive directory");
  const n = directory.readUInt16LE(i + 28),
    x = directory.readUInt16LE(i + 30),
    c = directory.readUInt16LE(i + 32),
    id = directory
      .toString("utf8", i + 46, i + 46 + n)
      .match(/(FJ\d+M?)\.obj$/)?.[1];
  if (id)
    entries.set(id, {
      offset: directory.readUInt32LE(i + 42),
      size: directory.readUInt32LE(i + 20),
      rawSize: directory.readUInt32LE(i + 24),
      method: directory.readUInt16LE(i + 10),
    });
  i += 46 + n + x + c;
}
async function range(start, end) {
  const r = await fetch(archiveUrl, {
    headers: { Range: `bytes=${start}${end === undefined ? "" : `-${end}`}` },
    signal: AbortSignal.timeout(90000),
  });
  if (r.status !== 206) throw Error(`Range failed: ${r.status}`);
  return Buffer.from(await r.arrayBuffer());
}
async function source(id) {
  if (!/^FJ\d+M?$/.test(id)) throw Error("Invalid publisher source file ID");
  const checked = (bytes) => {
    const expected = previousManifest?.inventory
      .flatMap((s) => [...s.sourceFiles, ...(s.sourceAliases ?? [])])
      .find((f) => f.id === id);
    if (expected && sha(bytes) !== expected.sha256)
      throw Error(`Pinned arterial source changed: ${id}`);
    return bytes;
  };
  try {
    return checked(await cached(`isa-${id}.obj`));
  } catch (e) {
    if (e.code !== "ENOENT" || process.argv.includes("--offline")) throw e;
  }
  const e = entries.get(id);
  if (!e) throw Error(`Unknown source file ${id}`);
  const h = await range(e.offset, e.offset + 29);
  if (h.readUInt32LE(0) !== 0x04034b50) throw Error("Invalid archive header");
  const start = e.offset + 30 + h.readUInt16LE(26) + h.readUInt16LE(28),
    compressed = await range(start, start + e.size - 1),
    raw =
      e.method === 8
        ? inflateRawSync(compressed)
        : e.method === 0
          ? compressed
          : null;
  if (!raw || raw.length !== e.rawSize) throw Error("Invalid source body");
  checked(raw);
  await writeFile(`${cache}/isa-${id}.obj`, raw);
  return raw;
}
const geometryHash = (b) =>
  sha(
    b
      .toString()
      .split("\n")
      .filter((l) => /^v |^f /.test(l))
      .join("\n"),
  );
const alignment = JSON.parse(
  await readFile(new URL("docs/assets/nervous-alignment.json", root), "utf8"),
);
for (const landmark of alignment.landmarks)
  if (
    geometryHash(await source(landmark.sourceFile.id)) !== landmark.geometryHash
  )
    throw Error("Shared coordinate reference changed");
const used = new Set(),
  buckets = new Map(),
  inventory = [];
// Audit all ownership BEFORE acquiring any vascular file. Shared cardiac
// arteries retain their original asset and identity; they must not enter here.
const cardiacManifest = JSON.parse(
  await readFile(
    new URL("packages/anatomy-data/src/heart-manifest.json", root),
    "utf8",
  ),
);
const ownership = new Set(
  cardiacManifest.inventory.flatMap((s) => s.sourceFiles.map((f) => f.id)),
);
const required = new Set();
for (const d of arterialDefinitions) {
  for (const id of rows(isaElements)
    .filter((e) => e[0] === d.terminologyId)
    .map((e) => e[2])) {
    if (ownership.has(id))
      throw Error(`Duplicate source ownership before import: ${d.id} / ${id}`);
    ownership.add(id);
    required.add(id);
  }
}
// Bounded acquisition, no whole-archive download, source cache is resumable.
const pending = [...required];
await Promise.all(
  Array.from({ length: 6 }, async () => {
    while (pending.length) await source(pending.shift());
  }),
);
for (const definition of arterialDefinitions) {
  const d = {
    ...definition,
    names: {
      en:
        rows(isaParts).find((p) => p[0] === definition.terminologyId)?.[2] ??
        definition.id,
      ro: definition.ro,
    },
    laterality:
      definition.laterality ??
      (["FMA3768", "FMA87217", "FMA3789", "FMA50169", "FMA50542"].includes(
        definition.terminologyId,
      )
        ? "midline"
        : "none"),
    sex: definition.sex ?? "unspecified",
  };
  const sourceTable = rows(isaParts).some((p) => p[0] === d.terminologyId)
      ? "IS-A"
      : "PART-OF",
    table = rows(sourceTable === "IS-A" ? isaParts : parts),
    map = rows(sourceTable === "IS-A" ? isaElements : elements),
    concept = table.find((p) => p[0] === d.terminologyId);
  if (!concept) throw Error(`Missing publisher concept ${d.id}`);
  let files = [
    ...new Set(map.filter((e) => e[0] === d.terminologyId).map((e) => e[2])),
  ];
  if (d.onlyFiles) {
    if (d.onlyFiles.some((f) => !files.includes(f)))
      throw Error("Unmapped source subset");
    files = d.onlyFiles;
  }
  if (!files.length) throw Error(`No geometry for ${d.id}`);
  const sourceAliases = [];
  for (const alias of d.duplicateAliases ?? []) {
    const raw = await source(alias.id),
      original = await source(alias.duplicateOf);
    if (geometryHash(raw) !== geometryHash(original))
      throw Error("Declared exact duplicate alias diverged");
    sourceAliases.push({
      ...alias,
      sha256: sha(raw),
      geometryHash: geometryHash(raw),
    });
  }
  const p = [],
    ix = [],
    sourceFiles = [];
  for (const id of files) {
    if (used.has(id)) throw Error(`Duplicate arterial source ownership ${id}`);
    used.add(id);
    const raw = await source(id),
      offset = p.length / 3;
    sourceFiles.push({ id, sha256: sha(raw), geometryHash: geometryHash(raw) });
    for (const l of raw.toString().split("\n")) {
      if (l.startsWith("v ")) {
        const [x, y, z] = l.trim().split(/\s+/).slice(1).map(Number);
        p.push(x / 1000, z / 1000, -y / 1000);
      }
      if (l.startsWith("f ")) {
        const f = l
          .trim()
          .split(/\s+/)
          .slice(1)
          .map((v) => Number(v.split("/")[0]) - 1 + offset);
        for (let k = 1; k < f.length - 1; k++) ix.push(f[0], f[k], f[k + 1]);
      }
    }
  }
  if (
    !p.length ||
    !ix.length ||
    !p.every(Number.isFinite) ||
    ix.some((i) => !Number.isInteger(i) || i < 0 || i >= p.length / 3)
  )
    throw Error("Invalid arterial geometry");
  const positions = new Float32Array(p),
    indices = new Uint32Array(ix),
    normals = new Float32Array(p.length),
    edgeCounts = new Map();
  let degenerateTriangles = 0;
  for (let i = 0; i < ix.length; i += 3) {
    const [a, b, c] = ix.slice(i, i + 3).map((n) => n * 3),
      ab = [0, 1, 2].map((k) => p[b + k] - p[a + k]),
      ac = [0, 1, 2].map((k) => p[c + k] - p[a + k]),
      n = [
        ab[1] * ac[2] - ab[2] * ac[1],
        ab[2] * ac[0] - ab[0] * ac[2],
        ab[0] * ac[1] - ab[1] * ac[0],
      ];
    if (Math.hypot(...n) < 1e-15) degenerateTriangles++;
    for (const v of [a, b, c])
      for (let k = 0; k < 3; k++) normals[v + k] += n[k];
    for (const [v, w] of [
      [a, b],
      [b, c],
      [c, a],
    ]) {
      const key = v < w ? `${v}:${w}` : `${w}:${v}`;
      edgeCounts.set(key, (edgeCounts.get(key) ?? 0) + 1);
    }
  }
  const min = [Infinity, Infinity, Infinity],
    max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < p.length; i += 3) {
    const n = Math.hypot(normals[i], normals[i + 1], normals[i + 2]);
    for (let k = 0; k < 3; k++) {
      normals[i + k] = n ? normals[i + k] / n : 0;
      min[k] = Math.min(min[k], positions[i + k]);
      max[k] = Math.max(max[k], positions[i + k]);
    }
  }
  const bucket = d.level === "major" ? "major" : d.group;
  const item = {
    ...d,
    sourceTable,
    sourceName: concept[2],
    sourceConcepts: [
      { conceptId: d.terminologyId, name: concept[2], fileIds: files },
    ],
    sourceFiles,
    sourceAliases,
    bounds: { min, max },
    triangleCount: ix.length / 3,
    assetId: `bodyparts3d-arterial-${bucket}-v4`,
    meshIds: [d.id],
    geometryRepresentation:
      d.category === "cavity" ? "cavity-surface-not-wall" : "source-surface",
    geometryValidationStatus: "source-mapped-unverified",
    medicalReviewStatus: "pending",
    translationStatus: "pending-medical-review",
    quality: {
      boundaryEdges: [...edgeCounts.values()].filter((n) => n === 1).length,
      nonManifoldEdges: [...edgeCounts.values()].filter((n) => n > 2).length,
      degenerateTriangles,
    },
  };
  inventory.push(item);
  if (!buckets.has(bucket)) buckets.set(bucket, []);
  buckets.get(bucket).push({
    id: d.id,
    sourceName: concept[2],
    positions,
    indices,
    normals,
    bounds: item.bounds,
  });
}
const attribution =
    "BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International",
  assets = [];
for (const [bucket, parts] of buckets) {
  const uri = `/models/bodyparts3d-arterial-${bucket}.glb`,
    info = await writeMeshoptGlb(
      new URL("apps/web/public" + uri, root),
      parts,
      attribution,
      "Cardiac source surfaces",
    );
  assets.push({
    id: `bodyparts3d-arterial-${bucket}-v4`,
    uri,
    region: bucket === "major" ? "whole-body" : bucket,
    lod: bucket === "major" ? 0 : 1,
    format: "glb",
    compression: "EXT_meshopt_compression (lossless)",
    coordinateSystem: "BodyParts3D 4.0 / application metres Y-up",
    dependencies: [],
    medicalReviewStatus: "pending",
    bounds: {
      min: [0, 1, 2].map((k) => Math.min(...parts.map((p) => p.bounds.min[k]))),
      max: [0, 1, 2].map((k) => Math.max(...parts.map((p) => p.bounds.max[k]))),
    },
    ...info,
    structureIds: parts.map((p) => p.id),
    triangleCount: inventory
      .filter((i) => i.assetId === `bodyparts3d-arterial-${bucket}-v4`)
      .reduce((n, i) => n + i.triangleCount, 0),
  });
}
for (const [path, hash] of Object.entries(protectedFiles))
  if (sha(await readFile(new URL(path, root))) !== hash)
    throw Error(`Protected file changed ${path}`);
await save("packages/anatomy-data/src/arterial-manifest.json", {
  version: "0.1.0",
  complete: false,
  sourceVersion: "BodyParts3D 4.0, 99% reduced archive",
  sourceUrl: archiveUrl,
  licenseId: "CC-BY-4.0",
  licenseUrl: "https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html",
  attribution,
  checkedAt: "2026-11-01",
  metadata: [
    ...[
      ["isa-parts.txt", isaParts],
      ["isa-elements.txt", isaElements],
      ["parts.txt", parts],
      ["elements.txt", elements],
      ["venous-bodyparts3d-license.html", license],
      ["venous-zip-directory.bin", directory],
    ].map(([filename, b]) => ({ filename, sha256: sha(b) })),
  ],
  registration: {
    transform: "[x/1000,z/1000,-y/1000]",
    landmarks: alignment.landmarks.length,
    sourceDifferenceMm: 0,
    medicalReviewStatus: "pending",
  },
  assets,
  inventory,
  missing: arterialMissing,
});
await save("docs/assets/arterial-protected-baseline.json", baseline);
await writeFile(
  new URL("apps/web/public/models/bodyparts3d-arterial-attribution.txt", root),
  attribution +
    "\nSource-preserving subset; normals regenerated; proper rotation/mm-to-m conversion; lossless Meshopt. No medical certification.\n",
);
process.stdout.write(
  JSON.stringify({
    parts: inventory.length,
    assets: assets.length,
    triangles: inventory.reduce((n, s) => n + s.triangleCount, 0),
    bytes: assets.reduce((n, s) => n + s.byteLength, 0),
    protectedFiles: protectedPaths.length,
  }) + "\n",
);
