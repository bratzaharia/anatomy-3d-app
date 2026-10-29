// Offline candidate only. Never imports into the viewer or changes fixed bones.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { format } from "prettier";
import {
  canalProxy,
  createCanalTransfer,
  insideSurface,
  surfaceBounds,
} from "./spinal-registration.ts";
import { writeMeshoptGlb } from "./meshopt-glb.mjs";
const root = new URL("../../", import.meta.url),
  cache = new URL("./.cache/", import.meta.url);
const hash = (b) => createHash("sha256").update(b).digest("hex");
const protectedFiles = JSON.parse(
  await readFile(
    new URL("docs/assets/nervous-regression-baseline.json", root),
    "utf8",
  ),
);
async function verifyFixed() {
  for (const [path, expected] of Object.entries(protectedFiles.files))
    if (hash(await readFile(new URL(path, root))) !== expected)
      throw Error("Protected reference changed: " + path);
}
await verifyFixed();
const license = await readFile(new URL("hra-license.txt", cache));
if (
  hash(license) !==
  "9ba9550ad48438d0836ddab3da480b3b69ffa0aac7b7878b5a0039e7ab429411"
)
  throw Error("HRA source license changed; re-audit");
async function glb(filename, expected) {
  const bytes = await readFile(new URL(filename, cache));
  if (hash(bytes) !== expected)
    throw Error("Unexpected HRA source: " + filename);
  const length = bytes.readUInt32LE(12),
    j = JSON.parse(bytes.toString("utf8", 20, 20 + length));
  if (
    j.nodes.some((n) => n.matrix || n.rotation || n.translation || n.scale) ||
    j.extensionsRequired?.length
  )
    throw Error("Unreviewed GLB transform or extension");
  const binOffset = 28 + length;
  const decode = (id) => {
    const a = j.accessors[id],
      v = j.bufferViews[a.bufferView];
    if (a.sparse || v.buffer !== 0) throw Error("Unsupported source accessor");
    const size = a.componentType === 5123 ? 2 : 4,
      components = a.type === "VEC3" ? 3 : a.type === "SCALAR" ? 1 : 0;
    if (!components || ![5123, 5125, 5126].includes(a.componentType))
      throw Error("Unsupported source attribute");
    const out =
      a.componentType === 5126
        ? new Float32Array(a.count * components)
        : new Uint32Array(a.count * components);
    for (let i = 0; i < a.count; i++)
      for (let k = 0; k < components; k++) {
        const offset =
          binOffset +
          (v.byteOffset ?? 0) +
          (a.byteOffset ?? 0) +
          i * (v.byteStride ?? size * components) +
          k * size;
        out[i * components + k] =
          a.componentType === 5126
            ? bytes.readFloatLE(offset)
            : a.componentType === 5123
              ? bytes.readUInt16LE(offset)
              : bytes.readUInt32LE(offset);
      }
    return out;
  };
  return j.nodes
    .filter((n) => n.mesh !== undefined)
    .map((n) => {
      const p = j.meshes[n.mesh].primitives;
      if (p.length !== 1 || (p[0].mode ?? 4) !== 4)
        throw Error("Unexpected source topology");
      return {
        name: n.name,
        extras: n.extras,
        positions: decode(p[0].attributes.POSITION),
        indices: decode(p[0].indices),
      };
    });
}
const sourceBones = await glb(
  "hra-vertebrae.glb",
  "981041904438bd74c14d671af8f87b3f407b675294bbf297af673c8df7144451",
);
const sourceCord = await glb(
  "hra-spinal-cord.glb",
  "a7858d88c2237aa7d559c4c1d638923d213d2a9f46c575dea03d6ba67a9975c0",
);
const prior = JSON.parse(
  await readFile(
    new URL("docs/assets/hra-spinal-candidate-audit.json", root),
    "utf8",
  ),
);
const skeleton = JSON.parse(
  await readFile(
    new URL("packages/anatomy-data/src/skeleton-manifest.json", root),
    "utf8",
  ),
);
const fixedBones = [],
  measurements = [],
  anchors = [];
for (const source of sourceBones) {
  const correspondence = prior.measurements.find(
    (p) => p.sourceName === source.name,
  );
  const concept = skeleton.structures
    .flatMap((s) => s.sourceConcepts)
    .find((c) => c.conceptId === correspondence?.targetConcept);
  if (!concept || concept.fileIds.length !== 1)
    throw Error("Missing fixed correspondence");
  const fileId = concept.fileIds[0],
    expected = skeleton.structures
      .flatMap((s) => s.sourceFiles)
      .find((f) => f.id === fileId).sha256;
  const obj = await readFile(new URL(fileId + ".obj", cache));
  if (hash(obj) !== expected) throw Error("Fixed OBJ checksum differs");
  const positions = [],
    indices = [];
  for (const line of obj.toString().split("\n")) {
    if (line.startsWith("v ")) {
      const [x, y, z] = line.trim().split(/\s+/).slice(1).map(Number);
      positions.push(x / 1000, z / 1000, -y / 1000);
    }
    if (line.startsWith("f ")) {
      const face = line
        .trim()
        .split(/\s+/)
        .slice(1)
        .map((v) => Number(v.split("/")[0]) - 1);
      for (let i = 1; i < face.length - 1; i++)
        indices.push(face[0], face[i], face[i + 1]);
    }
  }
  const fixed = { name: concept.name, positions, indices },
    sourceHole = canalProxy(source),
    targetHole = canalProxy(fixed);
  if (source.name === "VH_M_cervical_vertebra_1" && sourceHole && targetHole) {
    // The upper boundary uses actual observed superior sections, not a guessed
    // extension of a median landmark. Cranial tissue continuity remains a gate.
    sourceHole.selected = sourceHole.sections.at(-1);
    targetHole.selected = targetHole.sections.at(-1);
  }
  fixedBones.push({ ...fixed, bounds: surfaceBounds(fixed) });
  const level = source.name.replace("VH_M_", "");
  const summary = (hole) =>
    hole
      ? {
          selected: hole.selected,
          validSections: hole.validSections,
          bounds: hole.bounds,
        }
      : null;
  measurements.push({
    level,
    targetConcept: concept.conceptId,
    source: summary(sourceHole),
    target: summary(targetHole),
  });
  if (sourceHole && targetHole)
    anchors.push({
      level,
      source: sourceHole.selected.center,
      target: targetHole.selected.center,
    });
}
process.stdout.write(
  JSON.stringify({
    detectedCorrespondences: anchors.length,
    missing: measurements
      .filter((m) => !m.source || !m.target)
      .map((m) => ({ level: m.level, source: !!m.source, target: !!m.target })),
  }) + "\n",
);
// Recorded engineering bound, not an anatomical approval threshold.
const boundaryTranslationLimit = 0.003;
const transfer =
  anchors.length >= 3
    ? createCanalTransfer(anchors, boundaryTranslationLimit)
    : null;
const holdouts = [];
if (transfer)
  for (let i = 0; i < anchors.length; i++) {
    try {
      const held = createCanalTransfer(anchors.filter((_, j) => i !== j))(
        anchors[i].source,
      );
      holdouts.push({
        level: anchors[i].level,
        errorMm:
          Math.hypot(...held.map((v, k) => v - anchors[i].target[k])) * 1000,
      });
    } catch (error) {
      if (!String(error).includes("Outside measured canal coverage"))
        throw error;
      holdouts.push({
        level: anchors[i].level,
        errorMm: null,
        reason: "Endpoint withheld: no extrapolation allowed",
      });
    }
  }
let unmappedVertices = 0,
  vertexCount = 0,
  collisionVertices = 0;
let boundaryTranslatedVertices = 0,
  maximumBoundaryTranslationDistanceMm = 0;
const sourceYRange = [
  Math.min(...anchors.map((a) => a.source[1])),
  Math.max(...anchors.map((a) => a.source[1])),
];
const collisionBones = new Map(),
  entries = [],
  sourceSegments = [],
  sourceOntologyIds = new Set(),
  junctionPoints = [];
const top = Math.max(...sourceCord.map((s) => surfaceBounds(s).max[1]));
for (const source of sourceCord) {
  const sourceOntology = source.extras?.ontologyid;
  if (
    !/^UBERON:\d{7}$/.test(sourceOntology ?? "") ||
    sourceOntologyIds.has(sourceOntology)
  )
    throw Error("Missing or duplicated source segment ontology ID");
  sourceOntologyIds.add(sourceOntology);
  const id = `nervous-hra-cord-source-${sourceOntology.toLowerCase().replace(":", "-")}`;
  sourceSegments.push({ id, sourceOntology, sourceName: source.name });
  const positions = new Float32Array(source.positions.length);
  for (let i = 0; i < source.positions.length; i += 3) {
    vertexCount++;
    const p = [...source.positions.slice(i, i + 3)];
    const boundaryDistance = Math.max(
      0,
      sourceYRange[0] - p[1],
      p[1] - sourceYRange[1],
    );
    if (boundaryDistance > 0) {
      boundaryTranslatedVertices++;
      maximumBoundaryTranslationDistanceMm = Math.max(
        maximumBoundaryTranslationDistanceMm,
        boundaryDistance * 1000,
      );
    }
    let registered;
    try {
      registered = transfer?.(p);
    } catch (error) {
      if (!String(error).includes("Outside measured canal coverage"))
        throw error;
    }
    if (!registered) {
      unmappedVertices++;
      continue;
    }
    positions.set(registered, i);
    if (p[1] > top - 0.002) junctionPoints.push(registered);
    let collision = false;
    for (const bone of fixedBones) {
      if (
        registered.some(
          (v, k) => v < bone.bounds.min[k] || v > bone.bounds.max[k],
        )
      )
        continue;
      if (insideSurface(registered, bone)) {
        collision = true;
        collisionBones.set(bone.name, (collisionBones.get(bone.name) ?? 0) + 1);
      }
    }
    if (collision) collisionVertices++;
  }
  const normals = new Float32Array(positions.length);
  for (let i = 0; i < source.indices.length; i += 3) {
    const [a, b, c] = [...source.indices.slice(i, i + 3)].map((v) => v * 3);
    const ab = [0, 1, 2].map((k) => positions[b + k] - positions[a + k]),
      ac = [0, 1, 2].map((k) => positions[c + k] - positions[a + k]);
    const n = [
      ab[1] * ac[2] - ab[2] * ac[1],
      ab[2] * ac[0] - ab[0] * ac[2],
      ab[0] * ac[1] - ab[1] * ac[0],
    ];
    for (const offset of [a, b, c])
      for (let k = 0; k < 3; k++) normals[offset + k] += n[k];
  }
  for (let i = 0; i < normals.length; i += 3) {
    const n = Math.hypot(...normals.slice(i, i + 3)) || 1;
    for (let k = 0; k < 3; k++) normals[i + k] /= n;
  }
  entries.push({
    id,
    sourceName: source.name,
    positions,
    normals,
    indices: source.indices,
    bounds: surfaceBounds({ positions, indices: source.indices }),
  });
}
const medulla = JSON.parse(
  await readFile(
    new URL("packages/anatomy-data/src/nervous-manifest.json", root),
    "utf8",
  ),
).structures.find((s) => s.id === "nervous-medulla-oblongata").bounds;
const junctionBounds = junctionPoints.length
  ? surfaceBounds({ positions: junctionPoints.flat(), indices: [] })
  : null;
const junctionEnvelopeGapMm = junctionBounds
  ? Math.hypot(
      ...[0, 1, 2].map((k) =>
        Math.max(
          0,
          medulla.min[k] - junctionBounds.max[k],
          junctionBounds.min[k] - medulla.max[k],
        ),
      ),
    ) * 1000
  : null;
await mkdir(new URL("docs/assets/candidates/", root), { recursive: true });
const candidate =
  unmappedVertices === 0
    ? await writeMeshoptGlb(
        new URL("docs/assets/candidates/hra-spinal-cord-UNREVIEWED.glb", root),
        entries,
        "Human Reference Atlas / HuBMAP Consortium; Visible Human Male source data, U.S. National Library of Medicine. CC BY 4.0. Source-only coordinate transfer and conversion; unreviewed candidate, no endorsement. Source: https://3d.nih.gov/entries/3DPX-021018?version=1",
      )
    : null;
await verifyFixed();
const validHoldouts = holdouts.filter((h) => h.errorMm !== null);
const report = {
  decision: "QUARANTINE_PENDING_ANATOMICAL_REVIEW",
  runtimeImported: false,
  clinicalReview: "pending",
  method:
    "Measured horizontal closed-hole mesh sections, median observed canal-centroid proxies (superior C1 boundary uses highest observed sections); source-only monotone piecewise transfer with explicitly bounded constant-displacement boundary translation. No estimated nerve path or radius rescaling. These proxies are not medically annotated canal landmarks.",
  sourceLicense: "CC-BY-4.0",
  sourceLicenseSha256: hash(license),
  sourceCordSha256:
    "a7858d88c2237aa7d559c4c1d638923d213d2a9f46c575dea03d6ba67a9975c0",
  sourceVertebraeSha256:
    "981041904438bd74c14d671af8f87b3f407b675294bbf297af673c8df7144451",
  sourcePage: prior.nihEntry,
  sourceSegments,
  fixedReferenceCount: Object.keys(protectedFiles.files).length,
  anchors,
  measurements,
  holdouts,
  rmsInteriorHoldoutMm: validHoldouts.length
    ? Math.sqrt(
        validHoldouts.reduce((s, h) => s + h.errorMm ** 2, 0) /
          validHoldouts.length,
      )
    : null,
  maximumInteriorHoldoutMm: validHoldouts.length
    ? Math.max(...validHoldouts.map((h) => h.errorMm))
    : null,
  vertexCount,
  unmappedVertices,
  boundaryPolicy: {
    maximumAllowedDistanceMm: boundaryTranslationLimit * 1000,
    boundaryTranslatedVertices,
    maximumObservedDistanceMm: maximumBoundaryTranslationDistanceMm,
    medicalApproval: false,
  },
  collisionVertices,
  collisionBones: Object.fromEntries(collisionBones),
  collisionScreenLimit:
    "Vertex-in-solid screen only; not a complete triangle-intersection/canal-clearance test. Open/reduced source meshes can affect parity. No zero-collision medical claim.",
  junctionEnvelopeGapMm,
  junctionScreenLimit:
    "Bounding-envelope distance only, not verified continuity with medulla.",
  candidate: candidate
    ? {
        ...candidate,
        uri: "docs/assets/candidates/hra-spinal-cord-UNREVIEWED.glb",
        segments: entries.length,
        triangles: entries.reduce((s, e) => s + e.indices.length / 3, 0),
      }
    : null,
  remainingGates: [
    "Review detected hole correspondence and canal axes",
    "Complete geometric surface-intersection and clearance assessment",
    "Anatomist annotation of cranial junction and conus",
    "Medical course and segment review",
    "Separate 31 spinal pairs audit; cord segments are not spinal nerve pairs",
  ],
};
await writeFile(
  new URL("docs/assets/hra-spinal-registration.json", root),
  await format(JSON.stringify(report), { parser: "json" }),
);
process.stdout.write(
  JSON.stringify({
    anchors: anchors.length,
    vertexCount,
    unmappedVertices,
    collisionVertices,
    junctionEnvelopeGapMm,
    rmsInteriorHoldoutMm: report.rmsInteriorHoldoutMm,
    candidate: !!candidate,
    runtimeImported: false,
  }) + "\n",
);
