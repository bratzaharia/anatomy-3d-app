// Read-only candidate audit. Never writes runtime assets or skeletal files.
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { FBXLoader } from "../../apps/web/node_modules/three/examples/jsm/loaders/FBXLoader.js";
import {
  Box3,
  Vector3,
} from "../../apps/web/node_modules/three/build/three.module.js";
import { format } from "prettier";
const root = new URL("../../", import.meta.url);
const bytes = await readFile(
  new URL("./.cache/z-reference-skeleton.fbx", import.meta.url),
);
const muscles = await readFile(
  new URL("./.cache/z-muscles.fbx", import.meta.url),
);
const license = await readFile(
  new URL("./.cache/z-license.txt", import.meta.url),
);
const reference = JSON.parse(
  await readFile(
    new URL("packages/anatomy-data/src/skeleton-manifest.json", root),
    "utf8",
  ),
);
const scene = new FBXLoader().parse(
  bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.length),
  "",
);
scene.updateMatrixWorld(true);
const comparisons = [];
for (const [name, id] of [
  ["Mandible", "mandible"],
  ["Sacrum", "sacrum"],
  ...[
    "Humerus",
    "Radius",
    "Ulna",
    "Clavicle",
    "Scapula",
    "Femur",
    "Tibia",
    "Fibula",
  ].flatMap((name) => [
    [name + "l", name.toLowerCase() + "-left"],
    [name + "r", name.toLowerCase() + "-right"],
  ]),
]) {
  const mesh = scene.getObjectByName(name),
    box = new Box3();
  if (!mesh?.isMesh) throw new Error("Missing reference: " + name);
  for (let i = 0; i < mesh.geometry.attributes.position.count; i++)
    box.expandByPoint(
      new Vector3()
        .fromBufferAttribute(mesh.geometry.attributes.position, i)
        .applyMatrix4(mesh.matrixWorld)
        .multiplyScalar(0.01),
    );
  const fixed = reference.structures.find((item) => item.id === id).bounds;
  const minDelta = fixed.min.map((v, i) => v - box.min.getComponent(i));
  const maxDelta = fixed.max.map((v, i) => v - box.max.getComponent(i));
  comparisons.push({
    id,
    candidateBounds: { min: box.min.toArray(), max: box.max.toArray() },
    fixedBounds: fixed,
    minDelta,
    maxDelta,
    superiorInferiorExtentRatio:
      (fixed.max[1] - fixed.min[1]) / (box.max.y - box.min.y),
  });
}
const sha256 = (data) => createHash("sha256").update(data).digest("hex");
const report = {
  candidate: "LluisV/Z-Anatomy, PC-Version, MuscularSystem100.fbx",
  sourceCommit: "4ef7d59f4a2cc002f65ebd2bbb395ae4df3a5faf",
  muscularSha256: sha256(muscles),
  referenceSkeletonSha256: sha256(bytes),
  modelLicenseSha256: sha256(license),
  license:
    "CC-BY-SA-4.0, with embedded third-party exceptions outside muscular scope; asset-specific approval still required before acceptance.",
  accepted: false,
  reason:
    "Names indicate additional missing muscle geometry, but same-origin registration cannot be assumed: per-bone offsets and extents differ. No scaling, nonrigid warp, skeleton modification, or runtime import performed. A validated compatible registration or a different source is required.",
  method:
    "FBX world matrices baked for comparison, centimetres to metres; exact vertex bounds, not rotated local bounding-box corners. These are bounds comparisons, not clinical attachment validation or an optimal-registration residual.",
  comparisons,
};
await writeFile(
  new URL("docs/assets/z-anatomy-candidate-audit.json", root),
  await format(JSON.stringify(report), { parser: "json" }),
);
process.stdout.write(
  `Audited ${comparisons.length} candidate references; candidate not registered for runtime.\n`,
);
