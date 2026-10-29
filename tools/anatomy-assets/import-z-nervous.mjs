import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { format } from "prettier";
import { FBXLoader } from "../../apps/web/node_modules/three/examples/jsm/loaders/FBXLoader.js";
import {
  LoadingManager,
  Texture,
  Vector3,
} from "../../apps/web/node_modules/three/build/three.module.js";
import { registeredPoint } from "./z-nervous-registration.mjs";
import { writeMeshoptGlb } from "./meshopt-glb.mjs";
const cache = new URL("./.cache/", import.meta.url),
  root = new URL("../../", import.meta.url);
const sourceBytes = await readFile(new URL("z-nervous.fbx", cache));
const sha = (b) => createHash("sha256").update(b).digest("hex");
const sourceLicenseSha256 = sha(
  await readFile(new URL("z-neural-license.txt", cache)),
);
if (
  sourceLicenseSha256 !==
  "af62c06f620b9da20138e4c22a3f56565482dd058266540994ace97a4e24b693"
)
  throw Error(
    "Source license changed; re-audit subasset terms before importing",
  );
if (
  sha(sourceBytes) !==
  "3ea1aad64956cad27348a27b8fb50494b7cc307c6bc77bee0810ec2a67dff2b1"
)
  throw Error("Unexpected Z neural source");
const protectedFiles = JSON.parse(
  await readFile(
    new URL("docs/assets/nervous-regression-baseline.json", root),
    "utf8",
  ),
);
for (const [file, hash] of Object.entries(protectedFiles.files))
  if (sha(await readFile(new URL(file, root))) !== hash)
    throw Error("Existing anatomy changed: " + file);
const registration = JSON.parse(
  await readFile(new URL("z-nervous-smooth-registration.json", cache), "utf8"),
);
if (
  registration.landmarkCount < 180 ||
  registration.rmsHoldoutMm > 3 ||
  registration.maxHoldoutMm > 18
)
  throw Error(
    "Source pose registration did not meet recorded technical envelope",
  );
const base = JSON.parse(
  await readFile(
    new URL("packages/anatomy-data/src/nervous-manifest.json", root),
    "utf8",
  ),
);
const manager = new LoadingManager();
manager.addHandler(/.*/, { load: () => new Texture() });
const scene = new FBXLoader(manager).parse(
  sourceBytes.buffer.slice(
    sourceBytes.byteOffset,
    sourceBytes.byteOffset + sourceBytes.length,
  ),
  "",
);
scene.updateMatrixWorld(true);
const slug = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
const normalize = (s) =>
  s
    .toLowerCase()
    .replace(/\b(left|right)\b/g, "")
    .replaceAll("-", "")
    .replace(/\s+/g, " ")
    .trim();
const aliases = {
  "subclavian nerve": "nerve to subclavius",
  "superior subscapular nerve": "upper subscapular nerve",
  "inferior subscapular nerve": "lower subscapular nerve",
  "medial brachial cutaneous nerve": "medial cutaneous nerve of arm",
  "medial antebrachial cutaneous nerve": "medial cutaneous nerve of forearm",
  "ilio-inguinal nerve": "ilioinguinal nerve",
};
const mapped = new Set(),
  skipped = [],
  inventory = [],
  chunks = new Map(),
  v = new Vector3(),
  pointCache = new Map();
function warped(x, y, z) {
  const key = `${x},${y},${z}`;
  let p = pointCache.get(key);
  if (!p) {
    p = registeredPoint([x, y, z], registration.model);
    pointCache.set(key, p);
  }
  return p;
}
function jacobian(p) {
  const h = 0.0001,
    columns = [0, 1, 2].map((i) => {
      const a = [...p],
        b = [...p];
      a[i] += h;
      b[i] -= h;
      return registeredPoint(a, registration.model).map(
        (v, k) => (v - registeredPoint(b, registration.model)[k]) / (2 * h),
      );
    });
  const [a, b, c] = columns;
  return (
    a[0] * (b[1] * c[2] - b[2] * c[1]) -
    b[0] * (a[1] * c[2] - a[2] * c[1]) +
    c[0] * (a[1] * b[2] - a[2] * b[1])
  );
}
let minJacobian = Infinity,
  maxJacobian = -Infinity;
scene.traverse((object) => {
  if (!object.isMesh) return;
  const count =
      (object.geometry.index?.count ??
        object.geometry.attributes.position.count) / 3,
    name = object.name;
  // Explicitly reject helpers and all ambiguous CNS / inner-ear components.
  if (
    count <= 20 ||
    /j$|nucleus|cochlear|vestibular/i.test(name) ||
    !/nerve|brachial_plexus|spinal_ganglion|sympathetic_trunk|ganglia_of_sympathetic_trunk|^Cauda_equina$/i.test(
      name,
    )
  ) {
    skipped.push({
      name,
      reason:
        "outside audited peripheral subset / auxiliary / third-party exclusion",
    });
    return;
  }
  const unsuffixedRight =
    name === "Common_plantar_digital_branches_of_medial_plantar_nerve";
  const side = unsuffixedRight
    ? "right"
    : /[lr]$/.test(name)
      ? name.at(-1) === "l"
        ? "left"
        : "right"
      : "midline";
  let canonical = (
    side === "midline" || unsuffixedRight ? name : name.slice(0, -1)
  )
    .replaceAll("_", " ")
    .replace(/\s*\([IVX]+\)/g, "");
  if (
    canonical === "Common plantar digital branches of medial plantar nerve" &&
    side === "midline"
  )
    canonical += " (source side unresolved)";
  const key = aliases[canonical.toLowerCase()] ?? canonical.toLowerCase();
  const prior = base.inventory.find(
    (item) =>
      normalize(item.names.en) === normalize(key) && item.laterality === side,
  );
  if (
    prior?.assetId &&
    (prior.parentId === "nervous-brain" || prior.group === "autonomic")
  ) {
    skipped.push({
      name,
      reason:
        "canonical structure already supplied by retained BodyParts3D CNS / ganglion",
      anatomyId: prior.id,
    });
    return;
  }
  const id =
    prior?.id ??
    `nervous-z-${slug(canonical)}${side === "midline" ? "" : "-" + side}`;
  if (mapped.has(id)) throw Error("Duplicate source identity: " + id);
  mapped.add(id);
  const positions = [],
    indices = [],
    lookup = new Map(),
    bounds = {
      min: [Infinity, Infinity, Infinity],
      max: [-Infinity, -Infinity, -Infinity],
    },
    sourceBounds = {
      min: [Infinity, Infinity, Infinity],
      max: [-Infinity, -Infinity, -Infinity],
    };
  const sourcePosition = object.geometry.attributes.position;
  for (let i = 0; i < sourcePosition.count; i++) {
    v.fromBufferAttribute(sourcePosition, i)
      .applyMatrix4(object.matrixWorld)
      .multiplyScalar(0.01);
    const p = warped(v.x, v.y, v.z),
      key = p.join(",");
    let index = lookup.get(key);
    if (index === undefined) {
      index = positions.length / 3;
      lookup.set(key, index);
      positions.push(...p);
      for (let k = 0; k < 3; k++) {
        bounds.min[k] = Math.min(bounds.min[k], p[k]);
        bounds.max[k] = Math.max(bounds.max[k], p[k]);
        sourceBounds.min[k] = Math.min(sourceBounds.min[k], v.getComponent(k));
        sourceBounds.max[k] = Math.max(sourceBounds.max[k], v.getComponent(k));
      }
    }
    indices.push(index);
  }
  // FBXLoader expands source faces; do not invent connectivity or trajectories.
  if (object.geometry.index) throw Error("Expected expanded FBX triangles");
  const center = sourceBounds.min.map((v, k) => (v + sourceBounds.max[k]) / 2),
    det = jacobian(center);
  minJacobian = Math.min(minJacobian, det);
  maxJacobian = Math.max(maxJacobian, det);
  if (!(det > 0.5 && det < 1.6))
    throw Error(
      "Nonphysical local registration determinant at " + name + ": " + det,
    );
  // Some genuine nerves cross the midline (e.g. the source right vagal course).
  // Never reject/relabel those by a whole-course bounding-box center.
  if (
    side !== "midline" &&
    sourceBounds.min[0] * sourceBounds.max[0] > 0 &&
    ((bounds.min[0] + bounds.max[0]) / 2) * (side === "left" ? 1 : -1) < -0.005
  )
    throw Error("Source laterality conflict: " + name);
  const normals = new Float32Array(positions.length);
  for (let i = 0; i < indices.length; i += 3) {
    const [a, b, c] = indices.slice(i, i + 3).map((v) => v * 3),
      ab = [0, 1, 2].map((k) => positions[b + k] - positions[a + k]),
      ac = [0, 1, 2].map((k) => positions[c + k] - positions[a + k]),
      n = [
        ab[1] * ac[2] - ab[2] * ac[1],
        ab[2] * ac[0] - ab[0] * ac[2],
        ab[0] * ac[1] - ab[1] * ac[0],
      ];
    for (const j of [a, b, c])
      for (let k = 0; k < 3; k++) normals[j + k] += n[k];
  }
  for (let i = 0; i < normals.length; i += 3) {
    const length = Math.hypot(...normals.slice(i, i + 3)) || 1;
    for (let k = 0; k < 3; k++) normals[i + k] /= length;
  }
  const upper =
    /brachial|antebrachial|radial|ulnar|median|musculocutaneous|subscapular|thoracodorsal|subclavian|suprascapular|axillary|pectoral|long thoracic|dorsal scapular|interosseous.*forearm/i.test(
      canonical,
    );
  const lower =
    /femoral|obturator|sciatic|tibial|fibular|sural|plantar|saphenous|gluteal|piriformis|quadratus femoris|foot/i.test(
      canonical,
    );
  const spinal = /spinal|cauda/i.test(canonical),
    autonomic = /sympathetic/i.test(canonical),
    pelvic = /pudendal/i.test(canonical),
    thoracic = /intercostal/i.test(canonical);
  const group =
    prior?.group ??
    (upper
      ? "brachial"
      : lower
        ? "sacral"
        : spinal
          ? "spinal"
          : autonomic
            ? "autonomic"
            : pelvic
              ? "sacral"
              : thoracic
                ? "thoracic"
                : "cranial");
  const regionIds = prior?.regionIds ?? [
    upper
      ? `upper-limb-${side}`
      : lower
        ? `lower-limb-${side}`
        : spinal
          ? "back"
          : autonomic
            ? "back"
            : pelvic
              ? "pelvis"
              : thoracic
                ? "thorax"
                : "head",
  ];
  const chunk = upper
    ? "upper-limbs"
    : lower
      ? "lower-limbs"
      : spinal ||
          autonomic ||
          pelvic ||
          thoracic ||
          regionIds.some((r) =>
            ["neck", "thorax", "abdomen", "pelvis", "back"].includes(r),
          )
        ? "trunk"
        : "cranial";
  const isSet =
      /branches|roots|root of spinal|spinal ganglion|ganglia|nerves|cauda/i.test(
        canonical,
      ),
    assetId = "z-nervous-" + chunk;
  const item = {
    ...(prior ?? {}),
    id,
    names: prior?.names ?? {
      en: canonical + (side === "midline" ? "" : ` — ${side}`),
      ro:
        canonical +
        (side === "midline"
          ? ""
          : side === "left"
            ? " — stânga"
            : " — dreapta"),
    },
    latinName: prior?.latinName ?? "",
    laterality: side,
    group,
    division: prior?.division ?? "pns",
    // Only an explicit sympathetic source identity adds this overlap tag.
    // Untagged fiber composition remains unknown, never inferred from position.
    functions: prior?.functions?.length
      ? prior.functions
      : autonomic
        ? ["autonomic", "sympathetic"]
        : [],
    regionIds,
    structureType:
      prior?.structureType ?? (isSet ? "nerve_branch_set" : "nerve_branch"),
    geometryStatus: isSet ? "grouped" : "individual",
    gap: null,
    reviewStatus: "unreviewed",
    medicalSource: "https://github.com/Z-Anatomy/Models-of-human-anatomy",
    sourceConcepts: [],
    assetId,
    meshIds: [id],
    sourceDataset: "Z-Anatomy",
    sourceIdentifier: name,
    sourceObjectId: String(object.ID),
    representation: "surface_mesh",
    alignmentStatus: "landmark_registered",
    clinicalAlignment: "pending",
    translationStatus: prior ? "existing-catalog" : "source-name-fallback",
    distalRegion:
      /digital|palmar|dorsal branch.*ulnar/i.test(canonical) && upper
        ? "hand"
        : /plantar|digital.*fibular|dorsal cutaneous.*foot/i.test(canonical) &&
            lower
          ? "foot"
          : null,
    bounds,
    triangleCount: indices.length / 3,
    sourceBounds,
  };
  inventory.push(item);
  if (!chunks.has(chunk)) chunks.set(chunk, []);
  chunks.get(chunk).push({
    id,
    sourceName: name,
    positions: new Float32Array(positions),
    normals,
    indices: new Uint32Array(indices),
    bounds,
  });
});
const assets = [];
const credit =
  "Z-Anatomy — Gauthier Kervyn, Lluís Vinent Juanico and contributors; based on BodyParts3D, © DBCLS (CC BY-SA 2.1 Japan). Peripheral adaptations CC BY-SA 4.0. Cranial source: University of Dundee, CAHID, CC BY 4.0. Source-pose landmark registration and GLB conversion by Human Anatomy 3D Atlas. No NC inner-ear or ambiguous Washington brain/white-matter content included.";
for (const [key, entries] of chunks) {
  const uri = `/models/z-nervous-${key}.glb`,
    metrics = await writeMeshoptGlb(
      new URL("apps/web/public" + uri, root),
      entries,
      credit,
    );
  assets.push({
    id: "z-nervous-" + key,
    uri,
    ...metrics,
    licenseId: "CC-BY-SA-4.0",
    structureIds: entries.map((e) => e.id),
    sourceMeshCount: entries.length,
    triangleCount: entries.reduce((n, e) => n + e.indices.length / 3, 0),
  });
}
const report = {
  version: "1.1.0",
  sourceUrl:
    "https://github.com/LluisV/Z-Anatomy/blob/4ef7d59f4a2cc002f65ebd2bbb395ae4df3a5faf/Resources/Models/FBX/NervousSystem100.fbx",
  sourceCommit: "4ef7d59f4a2cc002f65ebd2bbb395ae4df3a5faf",
  sourceSha256: sha(sourceBytes),
  sourceLicenseSha256,
  sourceLicenseUrl:
    "https://github.com/LluisV/Z-Anatomy/blob/4ef7d59f4a2cc002f65ebd2bbb395ae4df3a5faf/Resources/Models/License.txt",
  licenseId: "CC-BY-SA-4.0",
  licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
  attribution: credit,
  anatomicallyComplete: false,
  registration: {
    landmarkCount: registration.landmarkCount,
    rmsHoldoutMm: registration.rmsHoldoutMm,
    maxHoldoutMm: registration.maxHoldoutMm,
    clinicalReview: "pending",
    minimumCenterJacobian: minJacobian,
    maximumCenterJacobian: maxJacobian,
  },
  assets,
  inventory,
};
await writeFile(
  new URL("docs/assets/z-nervous-registration.json", root),
  await format(
    JSON.stringify({
      ...registration,
      minimumCenterJacobian: minJacobian,
      maximumCenterJacobian: maxJacobian,
      excluded: skipped,
    }),
    { parser: "json" },
  ),
);
await writeFile(
  new URL("packages/anatomy-data/src/nervous-supplement.json", root),
  await format(JSON.stringify(report), { parser: "json" }),
);
await writeFile(
  new URL("apps/web/public/models/z-nervous-attribution.txt", root),
  credit + "\n" + report.sourceUrl + "\n" + report.licenseUrl + "\n",
);
process.stdout.write(
  JSON.stringify({
    mapped: inventory.length,
    individual: inventory.filter((i) => i.geometryStatus === "individual")
      .length,
    grouped: inventory.filter((i) => i.geometryStatus === "grouped").length,
    assets: assets.map((a) => ({
      id: a.id,
      bytes: a.byteLength,
      triangles: a.triangleCount,
      entities: a.structureIds.length,
    })),
    jacobian: [minJacobian, maxJacobian],
  }) + "\n",
);
