// Source-only smooth landmark registration. Fixed anatomy is read, never edited.
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
const cache = new URL("./.cache/", import.meta.url);
function solve(a, b) {
  const m = a.map((row, i) => [...row, ...b[i]]),
    n = a.length;
  for (let j = 0; j < n; j++) {
    let p = j;
    for (let i = j + 1; i < n; i++)
      if (Math.abs(m[i][j]) > Math.abs(m[p][j])) p = i;
    [m[p], m[j]] = [m[j], m[p]];
    const d = m[j][j];
    if (Math.abs(d) < 1e-12) throw Error("Singular source registration");
    for (let k = j; k < n + 3; k++) m[j][k] /= d;
    for (let i = 0; i < n; i++)
      if (i !== j) {
        const v = m[i][j];
        for (let k = j; k < n + 3; k++) m[i][k] -= v * m[j][k];
      }
  }
  return m.map((row) => row.slice(n));
}
export function fitRegistration(landmarks) {
  const n = landmarks.length,
    a = Array.from({ length: n + 4 }, () => Array(n + 4).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++)
      a[i][j] = Math.hypot(
        ...landmarks[i].source.map((v, k) => v - landmarks[j].source[k]),
      );
    const p = [1, ...landmarks[i].source];
    for (let j = 0; j < 4; j++) a[i][n + j] = a[n + j][i] = p[j];
  }
  return {
    landmarks,
    weights: solve(a, [
      ...landmarks.map((l) => l.target),
      ...Array.from({ length: 4 }, () => [0, 0, 0]),
    ]),
  };
}
export function registeredPoint(p, model) {
  const n = model.landmarks.length,
    out = [0, 0, 0];
  for (let i = 0; i < n; i++) {
    const r = Math.hypot(
      p[0] - model.landmarks[i].source[0],
      p[1] - model.landmarks[i].source[1],
      p[2] - model.landmarks[i].source[2],
    );
    for (let k = 0; k < 3; k++) out[k] += r * model.weights[i][k];
  }
  const x = [1, ...p];
  for (let i = 0; i < 4; i++)
    for (let k = 0; k < 3; k++) out[k] += x[i] * model.weights[n + i][k];
  return out;
}
function normalize(name, source = false) {
  let s = name.toLowerCase().replaceAll("_", " ");
  let side;
  if (source && /[lr]$/.test(s)) {
    side = s.at(-1) === "l" ? "left" : "right";
    s = s.slice(0, -1);
  } else {
    side = s.includes("left") ? "left" : s.includes("right") ? "right" : "";
    s = s.replace(/\b(left|right)\b/g, "");
  }
  s = s
    .replace(/\bthumb\b/g, "first finger hand")
    .replace(/\bindex finger\b/g, "second finger hand")
    .replace(/\bmiddle finger\b/g, "third finger hand")
    .replace(/\bring finger\b/g, "fourth finger hand")
    .replace(/\blittle finger\b/g, "fifth finger hand")
    .replace(/\bbig toe\b/g, "first finger foot")
    .replace(/\blittle toe\b/g, "fifth finger foot")
    .replace(/\btoe\b/g, "finger foot");
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
  const v = s.match(/(\w+) (cervical|thoracic|lumbar) vertebra/);
  if (v) s = `vertebra ${v[2][0]}${ordinals.indexOf(v[1]) + 1}`;
  return (
    s
      .replace(/\b(of|bone)\b/g, "")
      .replace(/[^a-z0-9 ]/g, "")
      .replace(/\s+/g, " ")
      .trim() +
    " " +
    side
  ).trim();
}
export async function buildRegistration() {
  const sourceReferenceSha256 = createHash("sha256")
    .update(await readFile(new URL("z-reference-skeleton.fbx", cache)))
    .digest("hex");
  if (
    sourceReferenceSha256 !==
    "294a649765cd060a62a4095da52b9c8ef2d97769aa447e196448aa5f7d596dea"
  )
    throw Error("Source reference changed; re-audit registration");
  const source = JSON.parse(
    await readFile(new URL("z-bone-meshes.json", cache), "utf8"),
  );
  const byName = new Map(
    source
      .filter((m) => m.triangles > 20)
      .map((m) => [normalize(m.name, true), m]),
  );
  const fixed = JSON.parse(
    await readFile(
      new URL(
        "../../packages/anatomy-data/src/skeleton-manifest.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  const landmarks = [];
  for (const group of fixed.structures)
    for (const concept of group.sourceConcepts) {
      const candidate = byName.get(normalize(concept.name));
      if (!candidate || concept.fileIds.length !== 1) continue;
      const text = await readFile(
        new URL(concept.fileIds[0] + ".obj", cache),
        "utf8",
      );
      const min = [Infinity, Infinity, Infinity],
        max = [-Infinity, -Infinity, -Infinity];
      for (const line of text.split("\n"))
        if (line.startsWith("v ")) {
          const [x, y, z] = line.trim().split(/\s+/).slice(1).map(Number),
            p = [x / 1000, z / 1000, -y / 1000];
          for (let k = 0; k < 3; k++) {
            min[k] = Math.min(min[k], p[k]);
            max[k] = Math.max(max[k], p[k]);
          }
        }
      landmarks.push({
        sourceName: candidate.name,
        targetConceptId: concept.conceptId,
        targetName: concept.name,
        region: group.regionId,
        source: candidate.bounds.min.map(
          (v, k) => (v + candidate.bounds.max[k]) / 2,
        ),
        target: min.map((v, k) => (v + max[k]) / 2),
      });
    }
  const holdouts = [];
  for (let fold = 0; fold < 5; fold++) {
    const model = fitRegistration(landmarks.filter((_, i) => i % 5 !== fold));
    for (const [i, l] of landmarks.entries())
      if (i % 5 === fold)
        holdouts.push({
          name: l.targetName,
          errorMm:
            1000 *
            Math.hypot(
              ...registeredPoint(l.source, model).map(
                (v, k) => v - l.target[k],
              ),
            ),
        });
  }
  const model = fitRegistration(landmarks);
  const report = {
    sourceReferenceSha256,
    method:
      "3D polyharmonic (r) landmark interpolation with affine tail, fitted only to source nerves. Bounding-box centers of explicitly name-matched bones are geometric proxies, not clinical nerve/foramen landmarks. Five-fold withheld-bone validation.",
    landmarkCount: landmarks.length,
    model,
    holdouts,
    rmsHoldoutMm: Math.sqrt(
      holdouts.reduce((s, l) => s + l.errorMm ** 2, 0) / holdouts.length,
    ),
    maxHoldoutMm: Math.max(...holdouts.map((l) => l.errorMm)),
    clinicalReview: "pending",
    scope:
      "educational source-pose transfer, not clinically validated registration",
  };
  await writeFile(
    new URL("z-nervous-smooth-registration.json", cache),
    JSON.stringify(report, null, 2),
  );
  return report;
}
if (process.argv[1]?.endsWith("z-nervous-registration.mjs")) {
  const r = await buildRegistration();
  process.stdout.write(
    JSON.stringify({
      landmarks: r.landmarkCount,
      rmsHoldoutMm: r.rmsHoldoutMm,
      maxHoldoutMm: r.maxHoldoutMm,
      worst: r.holdouts.sort((a, b) => b.errorMm - a.errorMm).slice(0, 15),
    }) + "\n",
  );
}
