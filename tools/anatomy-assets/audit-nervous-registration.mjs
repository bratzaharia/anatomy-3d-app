// Candidate measurement only. No runtime geometry or existing layer writes.
import { readFile, writeFile } from "node:fs/promises";
const root = new URL("../../", import.meta.url);
const audit = JSON.parse(
  await readFile(
    new URL("docs/assets/z-anatomy-candidate-audit.json", root),
    "utf8",
  ),
);
const rows = audit.comparisons.map((item) => ({
  id: item.id,
  source: item.candidateBounds.min.map(
    (v, i) => (v + item.candidateBounds.max[i]) / 2,
  ),
  target: item.fixedBounds.min.map((v, i) => (v + item.fixedBounds.max[i]) / 2),
}));
function solve(a, b) {
  const m = a.map((row, i) => [...row, b[i]]);
  for (let j = 0; j < b.length; j++) {
    let p = j;
    for (let i = j + 1; i < b.length; i++)
      if (Math.abs(m[i][j]) > Math.abs(m[p][j])) p = i;
    [m[p], m[j]] = [m[j], m[p]];
    const d = m[j][j];
    if (Math.abs(d) < 1e-12) throw Error("Singular landmark fit");
    for (let k = j; k <= b.length; k++) m[j][k] /= d;
    for (let i = 0; i < b.length; i++)
      if (i !== j) {
        const v = m[i][j];
        for (let k = j; k <= b.length; k++) m[i][k] -= v * m[j][k];
      }
  }
  return m.map((row) => row.at(-1));
}
const fit = (rs) =>
  [0, 1, 2].map((axis) => {
    const a = Array.from({ length: 4 }, () => Array(4).fill(0)),
      b = Array(4).fill(0);
    for (const r of rs) {
      const x = [...r.source, 1];
      for (let i = 0; i < 4; i++) {
        b[i] += x[i] * r.target[axis];
        for (let j = 0; j < 4; j++) a[i][j] += x[i] * x[j];
      }
    }
    return solve(a, b);
  });
const transform = (p, m) =>
  m.map((row) => row.slice(0, 3).reduce((s, v, i) => s + v * p[i], row[3]));
const matrix = fit(rows);
const measurements = rows.map((r, i) => ({
  ...r,
  fitErrorMm:
    1000 *
    Math.hypot(...transform(r.source, matrix).map((v, j) => v - r.target[j])),
  holdoutErrorMm:
    1000 *
    Math.hypot(
      ...transform(r.source, fit(rows.filter((_, j) => j !== i))).map(
        (v, j) => v - r.target[j],
      ),
    ),
}));
const result = {
  method:
    "Least-squares affine fit to 18 corresponding bone bounding-box centers; leave-one-bone-out validation. These are geometric proxies, not clinical nerve landmarks.",
  matrix,
  measurements,
  rmsHoldoutMm: Math.sqrt(
    measurements.reduce((s, r) => s + r.holdoutErrorMm ** 2, 0) /
      measurements.length,
  ),
  maxHoldoutMm: Math.max(...measurements.map((r) => r.holdoutErrorMm)),
  status: "candidate only; not anatomical approval",
};
await writeFile(
  new URL("./.cache/z-nervous-registration.json", import.meta.url),
  JSON.stringify(result, null, 2),
);
process.stdout.write(JSON.stringify(result, null, 2) + "\n");
