// Independent OBJ adapter. Does not run any existing system importer.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { inflateRawSync } from "node:zlib";
import { execFileSync } from "node:child_process";
import { format } from "prettier";
import { writeMeshoptGlb } from "./meshopt-glb.mjs";
import {
  venousDefinitions,
  venousGroups,
  venousConnections,
  venousCollectionPoints,
} from "./venous-definition.mjs";
const root = new URL("../../", import.meta.url),
  cache = new URL("./.cache/", import.meta.url);
const hash = (b) => createHash("sha256").update(b).digest("hex");
const save = async (path, data) =>
  writeFile(
    new URL(path, root),
    await format(JSON.stringify(data), { parser: "json" }),
  );
await mkdir(cache, { recursive: true });
const baselinePath = "docs/assets/venous-protected-baseline.json";
let baseline;
try {
  baseline = JSON.parse(await readFile(new URL(baselinePath, root), "utf8"));
} catch (e) {
  if (e.code !== "ENOENT") throw e;
  const paths = execFileSync(
    "git",
    [
      "ls-files",
      "apps/web/public/models",
      "packages/anatomy-data/src/skeleton-manifest.json",
      "packages/anatomy-data/src/muscle-manifest.json",
      "packages/anatomy-data/src/nervous-manifest.json",
      "packages/anatomy-data/src/nervous-supplement.json",
    ],
    { cwd: root, encoding: "utf8" },
  )
    .trim()
    .split("\n")
    .filter((p) => !p.includes("venous"));
  baseline = {
    baseCommit: execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: root,
      encoding: "utf8",
    }).trim(),
    files: Object.fromEntries(
      await Promise.all(
        paths.map(async (p) => [p, hash(await readFile(new URL(p, root)))]),
      ),
    ),
  };
  await save(baselinePath, baseline);
}
async function protect() {
  for (const [path, sha] of Object.entries(baseline.files))
    if (hash(await readFile(new URL(path, root))) !== sha)
      throw Error("Protected system changed: " + path);
}
await protect();
const base = "https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/";
const archiveUrl = base + "isa_BP3D_4.0_obj_99.zip";
const acquisition = [];
let previousManifest;
try {
  previousManifest = JSON.parse(
    await readFile(
      new URL("packages/anatomy-data/src/venous-manifest.json", root),
      "utf8",
    ),
  );
} catch (e) {
  if (e.code !== "ENOENT") throw e;
}
async function acquire(filename, url) {
  let b;
  try {
    b = await readFile(new URL(filename, cache));
  } catch (e) {
    if (e.code !== "ENOENT" || process.argv.includes("--offline")) throw e;
    const r = await fetch(url, { signal: AbortSignal.timeout(240000) });
    if (!r.ok) throw Error(`HTTP ${r.status}: ${url}`, { cause: e });
    b = Buffer.from(await r.arrayBuffer());
    await writeFile(new URL(filename, cache), b);
  }
  const expected = previousManifest?.acquisition.find(
    (s) => s.filename === filename,
  );
  if (expected && expected.sha256 !== hash(b))
    throw Error("Pinned source changed: " + filename);
  acquisition.push({ filename, url, byteLength: b.length, sha256: hash(b) });
  return b;
}
const [parts, elements, license] = await Promise.all([
  acquire("isa-parts.txt", base + "isa_parts_list_e.txt"),
  acquire("isa-elements.txt", base + "isa_element_parts.txt"),
  acquire(
    "venous-bodyparts3d-license.html",
    "https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html",
  ),
]);
if (!license.toString().includes("4.0"))
  throw Error("License evidence missing");
const rows = (b) =>
  b
    .toString()
    .trim()
    .split("\n")
    .slice(1)
    .map((x) => x.trim().split("\t"));
const partsByName = new Map(
  rows(parts).map(([conceptId, , name]) => [name, conceptId]),
);
const fileMap = new Map();
for (const [id, , file] of rows(elements)) {
  if (!fileMap.has(id)) fileMap.set(id, new Set());
  fileMap.get(id).add(file);
}
const inventory = venousDefinitions.map((d) => {
  const conceptId = partsByName.get(d.sourceName),
    fileIds = [...(fileMap.get(conceptId) ?? [])];
  return {
    ...d,
    terminologyId: conceptId ?? null,
    sourceConcepts: conceptId
      ? [{ conceptId, name: d.sourceName, fileIds }]
      : [],
    sourceFiles: [],
    assetId: null,
    meshIds: [],
    geometryType: "none",
    geometryStatus: "unavailable",
    validationStatus: "unverified",
    reviewedBy: null,
    reviewDate: null,
    translationStatus: "pending-medical-review",
    missingReason:
      d.sex === "female-only"
        ? "Male source subject; no female model accepted. Sex-specific anatomy is not merged into this body."
        : "No independently mapped surface in audited BodyParts3D 4.0. No substitute geometry drawn.",
    bounds: null,
    triangleCount: 0,
  };
});
const owners = new Map();
for (const d of inventory)
  for (const file of d.sourceConcepts.flatMap((s) => s.fileIds)) {
    if (owners.has(file))
      throw Error(
        `Duplicate source ownership: ${file} (${owners.get(file)} / ${d.id})`,
      );
    owners.set(file, d.id);
  }
async function range(bytes) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(archiveUrl, {
        headers: { Range: `bytes=${bytes}` },
        signal: AbortSignal.timeout(90000),
      });
      if (response.status !== 206)
        throw Error(
          "Source server did not honor byte range: " + response.status,
        );
      return Buffer.from(await response.arrayBuffer());
    } catch (e) {
      if (attempt === 2) throw e;
    }
  }
}
let directoryBytes;
try {
  directoryBytes = await readFile(new URL("venous-zip-directory.bin", cache));
} catch (e) {
  if (e.code !== "ENOENT" || process.argv.includes("--offline")) throw e;
  const zip = await range("-262144");
  let end = zip.length - 22;
  while (end >= 0 && zip.readUInt32LE(end) !== 0x06054b50) end--;
  if (end < 0) throw Error("ZIP directory missing", { cause: e });
  const offset = zip.readUInt32LE(end + 16),
    size = zip.readUInt32LE(end + 12);
  directoryBytes = await range(`${offset}-${offset + size - 1}`);
  await writeFile(new URL("venous-zip-directory.bin", cache), directoryBytes);
}
acquisition.push({
  filename: "venous-zip-directory.bin",
  url: archiveUrl,
  byteLength: directoryBytes.length,
  sha256: hash(directoryBytes),
});
const zip = directoryBytes;
const end = zip.length;
if (end < 0) throw Error("ZIP directory missing");
const directory = 0,
  entries = new Map();
for (let p = directory; p < end;) {
  if (zip.readUInt32LE(p) !== 0x02014b50) throw Error("Invalid ZIP directory");
  const n = zip.readUInt16LE(p + 28),
    x = zip.readUInt16LE(p + 30),
    c = zip.readUInt16LE(p + 32);
  const id = zip
    .toString("utf8", p + 46, p + 46 + n)
    .match(/(FJ\d+M?)\.obj$/)?.[1];
  if (id)
    entries.set(id, {
      offset: zip.readUInt32LE(p + 42),
      size: zip.readUInt32LE(p + 20),
      rawSize: zip.readUInt32LE(p + 24),
      method: zip.readUInt16LE(p + 10),
    });
  p += 46 + n + x + c;
}
// Existing 29 skeletal reference meshes must be geometrically identical in
// both publisher archives. Same proper rotation, no independent vein fitting.
const alignment = JSON.parse(
  await readFile(new URL("docs/assets/nervous-alignment.json", root), "utf8"),
);
const sourceBuffers = new Map(),
  ids = [
    ...new Set([
      ...owners.keys(),
      ...alignment.landmarks.map((l) => l.sourceFile.id),
    ]),
  ];
let cursor = 0;
await Promise.all(
  Array.from({ length: 6 }, async () => {
    while (cursor < ids.length) {
      const id = ids[cursor++];
      let raw;
      try {
        raw = await readFile(new URL(`isa-${id}.obj`, cache));
      } catch (e) {
        if (e.code !== "ENOENT" || process.argv.includes("--offline")) throw e;
        const entry = entries.get(id);
        if (!entry) throw Error("Missing ZIP entry: " + id, { cause: e });
        const header = await range(`${entry.offset}-${entry.offset + 29}`);
        if (header.readUInt32LE(0) !== 0x04034b50)
          throw Error("Invalid ZIP local header", { cause: e });
        const start =
          entry.offset + 30 + header.readUInt16LE(26) + header.readUInt16LE(28);
        const compressed = await range(`${start}-${start + entry.size - 1}`);
        raw =
          entry.method === 8
            ? inflateRawSync(compressed)
            : entry.method === 0
              ? compressed
              : null;
        if (!raw || raw.length !== entry.rawSize)
          throw Error("Invalid ZIP body: " + id, { cause: e });
        await writeFile(new URL(`isa-${id}.obj`, cache), raw);
      }
      sourceBuffers.set(id, raw);
      if (sourceBuffers.size % 40 === 0)
        process.stdout.write(
          `Retrieved ${sourceBuffers.size}/${ids.length} source meshes\n`,
        );
    }
  }),
);
const extract = (id) => {
  const b = sourceBuffers.get(id);
  if (!b) throw Error("Missing source: " + id);
  const expected = previousManifest?.inventory
    .flatMap((s) => s.sourceFiles)
    .find((s) => s.id === id);
  if (expected && expected.sha256 !== hash(b))
    throw Error("Pinned source surface changed: " + id);
  return b;
};
const geometryHash = (b) =>
  hash(
    b
      .toString()
      .split("\n")
      .filter((x) => /^v |^f /.test(x))
      .join("\n"),
  );
const landmarks = alignment.landmarks.map((l) => {
  if (geometryHash(extract(l.sourceFile.id)) !== l.geometryHash)
    throw Error("Coordinate reference changed: " + l.id);
  return {
    id: l.id,
    sourceFile: l.sourceFile.id,
    geometryHash: l.geometryHash,
    sourceDifferenceMm: 0,
  };
});
const buckets = new Map(),
  sourceHashes = new Set();
const metrics = {
  boundaryEdges: 0,
  nonManifoldEdges: 0,
  degenerateTriangles: 0,
};
for (const d of inventory) {
  const files = d.sourceConcepts.flatMap((s) => s.fileIds);
  if (!files.length) continue;
  const p = [],
    ix = [],
    sourceFiles = [];
  for (const file of files) {
    const b = extract(file),
      sha = hash(b),
      baseVertex = p.length / 3;
    if (sourceHashes.has(geometryHash(b)))
      throw Error("Duplicate geometry: " + file);
    sourceHashes.add(geometryHash(b));
    sourceFiles.push({ id: file, sha256: sha });
    for (const line of b.toString().split("\n")) {
      if (line.startsWith("v ")) {
        const [x, y, z] = line.trim().split(/\s+/).slice(1).map(Number);
        const point = [x / 1000, z / 1000, -y / 1000];
        if (!point.every(Number.isFinite)) throw Error("Non-finite vertex");
        p.push(...point);
      } else if (line.startsWith("f ")) {
        const f = line
          .trim()
          .split(/\s+/)
          .slice(1)
          .map((x) => Number(x.split("/")[0]) - 1 + baseVertex);
        for (let i = 1; i < f.length - 1; i++) ix.push(f[0], f[i], f[i + 1]);
      }
    }
  }
  if (
    !p.length ||
    !ix.length ||
    ix.some((i) => !Number.isInteger(i) || i < 0 || i >= p.length / 3)
  )
    throw Error("Malformed geometry: " + d.id);
  const positions = new Float32Array(p),
    indices = new Uint32Array(ix),
    normals = new Float32Array(p.length),
    edgeCounts = new Map();
  let degenerates = 0;
  for (let i = 0; i < ix.length; i += 3) {
    const [a, b, c] = ix.slice(i, i + 3).map((v) => v * 3),
      ab = [0, 1, 2].map((k) => p[b + k] - p[a + k]),
      ac = [0, 1, 2].map((k) => p[c + k] - p[a + k]);
    const n = [
      ab[1] * ac[2] - ab[2] * ac[1],
      ab[2] * ac[0] - ab[0] * ac[2],
      ab[0] * ac[1] - ab[1] * ac[0],
    ];
    if (Math.hypot(...n) < 1e-15) degenerates++;
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
  // Only absolute publisher left/right naming is tested, with a 5 mm tolerance
  // for midline-crossing trunks. Never mirror or relabel a conflicting surface.
  const centerX = (min[0] + max[0]) / 2;
  if (
    d.group !== "cardiac" &&
    d.group !== "portal" &&
    ((d.laterality === "left" && centerX < -0.005) ||
      (d.laterality === "right" && centerX > 0.005))
  ) {
    d.missingReason =
      "Quarantined: source laterality conflicts with source-space bounds; no automatic mirroring.";
    d.sourceFiles = sourceFiles;
    continue;
  }
  const region =
    d.group === "intracranial" || d.group === "head-neck"
      ? "head-neck"
      : ["cardiac", "pulmonary", "thoracic"].includes(d.group)
        ? "thorax"
        : ["portal", "abdominal"].includes(d.group)
          ? "abdomen"
          : d.group === "pelvic"
            ? "pelvis"
            : d.group;
  if (!buckets.has(region)) buckets.set(region, []);
  const quality = {
    boundaryEdges: [...edgeCounts.values()].filter((n) => n === 1).length,
    nonManifoldEdges: [...edgeCounts.values()].filter((n) => n > 2).length,
    degenerateTriangles: degenerates,
  };
  for (const key of Object.keys(metrics)) metrics[key] += quality[key];
  Object.assign(d, {
    assetId: `bodyparts3d-venous-${region}-v4`,
    meshIds: [d.id],
    geometryType: "surface-mesh",
    geometryStatus: d.representation === "set" ? "grouped" : "individual",
    missingReason: null,
    sourceFiles,
    bounds: { min, max },
    triangleCount: ix.length / 3,
    quality,
  });
  buckets.get(region).push({
    id: d.id,
    sourceName: d.sourceName,
    positions,
    normals,
    indices,
    bounds: d.bounds,
  });
}
const attribution =
  "BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International";
const assets = [];
for (const [region, entries] of buckets) {
  const filename = `bodyparts3d-venous-${region}.glb`,
    uri = "/models/" + filename;
  const info = await writeMeshoptGlb(
    new URL("apps/web/public" + uri, root),
    entries,
    attribution,
    "Venous source surfaces",
  );
  assets.push({
    id: `bodyparts3d-venous-${region}-v4`,
    region,
    uri,
    version: "4.0/venous-1.0.0",
    format: "glb",
    compression: "EXT_meshopt_compression (lossless)",
    lod: 0,
    dependencies: [],
    coordinateSystem: "metres; +X anatomical left, +Y superior, +Z anterior",
    ...info,
    structureIds: entries.map((e) => e.id),
    triangleCount: entries.reduce((n, e) => n + e.indices.length / 3, 0),
    bounds: {
      min: [0, 1, 2].map((k) =>
        Math.min(...entries.map((e) => e.bounds.min[k])),
      ),
      max: [0, 1, 2].map((k) =>
        Math.max(...entries.map((e) => e.bounds.max[k])),
      ),
    },
    licenseId: "CC-BY-4.0",
    validationStatus: "unverified",
  });
}
const manifest = {
  id: "bodyparts3d-venous-v4",
  version: "1.0.0",
  anatomicallyComplete: false,
  sourceUrl: archiveUrl,
  sourceVersion:
    "BodyParts3D 4.0 IS-A 99% reduced polygon surfaces; adult male reference",
  licenseId: "CC-BY-4.0",
  licenseUrl: "https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html",
  attribution,
  checkedAt: "2026-10-29",
  coordinateTransform: [
    0.001, 0, 0, 0, 0, 0, -0.001, 0, 0, 0.001, 0, 0, 0, 0, 0, 1,
  ],
  registration: {
    method: "Identical skeletal source vertex/face hashes; no fitting",
    rmsMm: 0,
    maxMm: 0,
    landmarks,
    clinicalReview: "pending",
  },
  acquisition,
  groups: venousGroups.map(([key, en, ro]) => ({
    id: "venous-group-" + key,
    key,
    names: { en, ro },
  })),
  assets,
  inventory,
  connections: venousConnections,
  collectionPoints: venousCollectionPoints,
  quality: metrics,
};
await save("packages/anatomy-data/src/venous-manifest.json", manifest);
await writeFile(
  new URL("docs/assets/VENOUS_ANATOMICAL_COVERAGE.md", root),
  await format(
    "# Venous coverage — inventory 1.0.0\n\nPARTIAL, unreviewed educational anatomy. This is a bounded macroscopic target, not an exhaustive list of every adult vein or variant. Female-only targets and microanatomy have no accepted model. Individual means an independently mapped source entity, not a complete course or a clinically validated structure. A set is not counted as its individual vessels.\n\n" +
      `Target: ${inventory.length}; individual surfaces: ${inventory.filter((s) => s.geometryStatus === "individual").length}; source sets: ${inventory.filter((s) => s.geometryStatus === "grouped").length}; missing/quarantined: ${inventory.filter((s) => !s.assetId).length}.\n\n` +
      "The machine-readable matrix is `packages/anatomy-data/src/venous-manifest.json` (`inventory`). It includes stable IDs, names, laterality, category, territory, depth, sex, original source concepts/files/hashes, availability, representation, independent review state and missing reasons. Clinical/terminology review remains pending for every entry.\n\n" +
      "| ID | English | Romanian | Group | Geometry | FMA | Missing reason |\n|---|---|---|---|---|---|---|\n" +
      inventory
        .map(
          (s) =>
            `| ${s.id} | ${s.names.en} | ${s.names.ro} | ${s.group} | ${s.geometryStatus} | ${s.terminologyId ?? "not mapped"} | ${s.missingReason ?? "—"} |`,
        )
        .join("\n") +
      "\n",
    { parser: "markdown" },
  ),
);
await writeFile(
  new URL("apps/web/public/models/bodyparts3d-venous-attribution.txt", root),
  attribution +
    "\n" +
    archiveUrl +
    "\nAdaptations: independently mapped vessels, regional packaging, source-preserving axis/unit conversion, regenerated normals and lossless Meshopt compression. Blue materials are educational conventions. Reduced surfaces are not medically reviewed, full vessel courses or a complete network. No invented connections.\n",
);
await protect();
process.stdout.write(
  JSON.stringify({
    catalog: inventory.length,
    individual: inventory.filter((d) => d.geometryStatus === "individual")
      .length,
    sets: inventory.filter((d) => d.geometryStatus === "grouped").length,
    missing: inventory.filter((d) => !d.assetId).length,
    assets: assets.map(({ region, byteLength, triangleCount }) => ({
      region,
      byteLength,
      triangleCount,
    })),
    quality: metrics,
  }) + "\n",
);
