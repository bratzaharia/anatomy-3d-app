// Candidate audit only: source anatomy is never placed by visual guesswork.
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { format } from "prettier";
const root = new URL("../../", import.meta.url);
const cache = new URL("./.cache/", import.meta.url);
const records = [];
const assets = {};
for (const filename of [
  "hra-spinal-cord.glb",
  "hra-vertebrae.glb",
  "hra-spinal-landmarks.glb",
]) {
  const bytes = await readFile(new URL(filename, cache));
  const gltf = JSON.parse(
    bytes.toString("utf8", 20, 20 + bytes.readUInt32LE(12)),
  );
  if (
    gltf.nodes.some((n) => n.matrix || n.translation || n.rotation || n.scale)
  )
    throw Error("Unexpected source transform; inspect before measuring");
  assets[filename] = gltf;
  records.push({
    filename,
    bytes: bytes.length,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    sourceMeshes: gltf.meshes.length,
    triangles: gltf.meshes.reduce(
      (count, mesh) =>
        count +
        mesh.primitives.reduce(
          (s, p) => s + gltf.accessors[p.indices].count / 3,
          0,
        ),
      0,
    ),
  });
}
const fixed = JSON.parse(
  await readFile(
    new URL("packages/anatomy-data/src/skeleton-manifest.json", root),
    "utf8",
  ),
);
const ordinals = [
  "first",
  "second",
  "third",
  "fourth",
  "fifth",
  "sixth",
  "seventh",
  "eighth",
  "ninth",
  "tenth",
  "eleventh",
  "twelfth",
];
const gltf = assets["hra-vertebrae.glb"];
const pairs = [];
for (const node of gltf.nodes.filter((n) => n.mesh !== undefined)) {
  const match = node.name.match(/_(cervical|thoracic|lumbar)_vertebra_(\d+)$/);
  if (!match) throw Error("Unidentified source vertebra");
  const [, region, number] = match;
  const name =
    region === "cervical" && number === "1"
      ? "atlas"
      : region === "cervical" && number === "2"
        ? "axis"
        : `${ordinals[Number(number) - 1]} ${region} vertebra`;
  const concept = fixed.structures
    .flatMap((s) => s.sourceConcepts)
    .find((c) => c.name === name);
  if (!concept || concept.fileIds.length !== 1)
    throw Error("No exact fixed bone: " + name);
  const accessor =
    gltf.accessors[gltf.meshes[node.mesh].primitives[0].attributes.POSITION];
  const source = accessor.min.map((v, i) => (v + accessor.max[i]) / 2);
  const obj = await readFile(
    new URL(concept.fileIds[0] + ".obj", cache),
    "utf8",
  );
  const min = [Infinity, Infinity, Infinity],
    max = [-Infinity, -Infinity, -Infinity];
  for (const line of obj.split("\n"))
    if (line.startsWith("v ")) {
      const [x, y, z] = line.trim().split(/\s+/).slice(1).map(Number);
      const p = [x / 1000, z / 1000, -y / 1000];
      for (let i = 0; i < 3; i++) {
        min[i] = Math.min(min[i], p[i]);
        max[i] = Math.max(max[i], p[i]);
      }
    }
  pairs.push({
    sourceName: node.name,
    targetConcept: concept.conceptId,
    source,
    target: min.map((v, i) => (v + max[i]) / 2),
  });
}
// Best sagittal similarity (proper X rotation, uniform scale, translation).
// Unlike a visual stretch, this has a stated objective and measured residuals.
const mean = (key) =>
  [0, 1, 2].map(
    (axis) => pairs.reduce((s, p) => s + p[key][axis], 0) / pairs.length,
  );
const sc = mean("source"),
  tc = mean("target");
let real = 0,
  imaginary = 0,
  denominator = 0;
for (const p of pairs) {
  const sy = p.source[1] - sc[1],
    sz = p.source[2] - sc[2],
    ty = p.target[1] - tc[1],
    tz = p.target[2] - tc[2];
  real += sy * ty + sz * tz;
  imaginary += sy * tz - sz * ty;
  denominator += sy * sy + sz * sz;
}
const a = real / denominator,
  b = imaginary / denominator,
  scale = Math.hypot(a, b);
const transform = (p) => [
  tc[0] + scale * (p[0] - sc[0]),
  tc[1] + a * (p[1] - sc[1]) - b * (p[2] - sc[2]),
  tc[2] + b * (p[1] - sc[1]) + a * (p[2] - sc[2]),
];
const measurements = pairs.map((p) => ({
  ...p,
  residualMm:
    Math.hypot(...transform(p.source).map((v, i) => v - p.target[i])) * 1000,
}));
const report = {
  decision: "QUARANTINE_PENDING_CANAL_REGISTRATION",
  source:
    "https://github.com/hubmapconsortium/ccf-3d-reference-object-library/tree/f1a3a63f110e27ff0736047d52d04dba5d3087f9/VH_Male/v1.2",
  nihEntry: "https://3d.nih.gov/entries/3DPX-021018?version=1",
  license: "CC-BY-4.0",
  files: records,
  sourceCordSegments: assets["hra-spinal-cord.glb"].nodes
    .filter((n) => n.mesh !== undefined)
    .map((n) => ({ name: n.name, ontology: n.extras?.ontologyid })),
  method:
    "24 exact-name vertebral bounding-box center proxies; best sagittal similarity. Not clinical canal landmarks or anatomical approval.",
  scale,
  rotationXRadians: Math.atan2(b, a),
  sourceCenter: sc,
  targetCenter: tc,
  rmsResidualMm: Math.sqrt(
    measurements.reduce((s, p) => s + p.residualMm ** 2, 0) /
      measurements.length,
  ),
  maxResidualMm: Math.max(...measurements.map((p) => p.residualMm)),
  measurements,
  blockers: [
    "Visible Human male is a different subject and spinal curvature from the fixed BodyParts3D skeleton.",
    "The supplied Extraction Sites landmark GLB is three merged vertebral surfaces, not independent spinal canal, brainstem junction or conus annotations.",
    "A bounding-box fit alone does not establish that the cord lies within the vertebral canal or joins the existing medulla.",
    "30 source cord segments (C1-C8, T1-T12, L1-L5, S1-S5) are not the 31 paired spinal nerves and must not be relabeled as such.",
    "Needs independent canal landmark correspondence, source-only deformable transfer, intersection/entry checks and medical review before mounting.",
  ],
  runtimeImported: false,
};
await writeFile(
  new URL("docs/assets/hra-spinal-candidate-audit.json", root),
  await format(JSON.stringify(report), { parser: "json" }),
);
process.stdout.write(
  JSON.stringify({
    decision: report.decision,
    sourceMeshes: report.sourceCordSegments.length,
    rmsResidualMm: report.rmsResidualMm,
    maxResidualMm: report.maxResidualMm,
  }) + "\n",
);
