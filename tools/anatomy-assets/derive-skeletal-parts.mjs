// Read-only partition of existing source triangles. Never rebuilds the skeleton.
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { MeshoptDecoder } from "meshoptimizer";
import { format } from "prettier";
const root = new URL("../../", import.meta.url);
const hash = (b) => createHash("sha256").update(b).digest("hex");
const manifest = JSON.parse(
  await readFile(
    new URL("packages/anatomy-data/src/skeleton-manifest.json", root),
    "utf8",
  ),
);
const bytes = await readFile(new URL("apps/web/public" + manifest.uri, root));
if (hash(bytes) !== manifest.sha256) throw Error("Fixed skeleton changed");
const jsonLength = bytes.readUInt32LE(12);
const gltf = JSON.parse(bytes.toString("utf8", 20, 20 + jsonLength));
await MeshoptDecoder.ready;
function decode(id) {
  const a = gltf.accessors[id],
    view = gltf.bufferViews[a.bufferView],
    e = view.extensions.EXT_meshopt_compression;
  const out = new Uint8Array(view.byteLength);
  MeshoptDecoder.decodeGltfBuffer(
    out,
    e.count,
    e.byteStride,
    bytes.subarray(
      28 + jsonLength + e.byteOffset,
      28 + jsonLength + e.byteOffset + e.byteLength,
    ),
    e.mode,
  );
  return Buffer.from(out);
}
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
const roman = [
  "I",
  "II",
  "III",
  "IV",
  "V",
  "VI",
  "VII",
  "VIII",
  "IX",
  "X",
  "XI",
  "XII",
];
const boneTerms = {
  scaphoid: ["Os scafoid", "Os scaphoideum"],
  lunate: ["Os semilunar", "Os lunatum"],
  triquetral: ["Os piramidal", "Os triquetrum"],
  pisiform: ["Os pisiform", "Os pisiforme"],
  trapezium: ["Os trapez", "Os trapezium"],
  trapezoid: ["Os trapezoid", "Os trapezoideum"],
  capitate: ["Os capitat", "Os capitatum"],
  hamate: ["Os cu cârlig", "Os hamatum"],
  talus: ["Talus", "Talus"],
  calcaneus: ["Calcaneu", "Calcaneus"],
  "medial cuneiform bone": ["Os cuneiform medial", "Os cuneiforme mediale"],
  "intermediate cuneiform bone": [
    "Os cuneiform intermediar",
    "Os cuneiforme intermedium",
  ],
  "lateral cuneiform bone": ["Os cuneiform lateral", "Os cuneiforme laterale"],
  "cuboid bone": ["Os cuboid", "Os cuboideum"],
  "hip bone": ["Os coxal", "Os coxae"],
};
function translated(name) {
  const side = /\bleft\b/.test(name)
    ? "left"
    : /\bright\b/.test(name)
      ? "right"
      : "midline";
  const roSide = side === "left" ? "stânga" : "dreapta",
    latinSide = side === "left" ? "sinister" : "dexter";
  const stem = name.replace(/\b(left|right)\s*/g, "");
  let terms;
  if (name === "atlas") terms = ["Atlas (C1)", "Atlas"];
  else if (name === "axis") terms = ["Axis (C2)", "Axis"];
  else if (name === "sternum") terms = ["Stern", "Sternum"];
  else if (boneTerms[stem]) terms = boneTerms[stem];
  else if (/^navicular bone of/.test(stem))
    terms = ["Os navicular al piciorului", "Os naviculare"];
  else {
    const vertebra = stem.match(/^(\w+) (cervical|thoracic|lumbar) vertebra$/);
    const serial = stem.match(/^(\w+) (rib|metacarpal bone|metatarsal bone)$/);
    const phalanx = stem.match(/^(proximal|middle|distal) phalanx of (.+)$/);
    if (vertebra) {
      const level =
        { cervical: "C", thoracic: "T", lumbar: "L" }[vertebra[2]] +
        (ordinals.indexOf(vertebra[1]) + 1);
      terms = [`Vertebra ${level}`, `Vertebra ${level}`];
    } else if (serial) {
      const n = roman[ordinals.indexOf(serial[1])];
      const labels = {
        rib: ["Coasta", "Costa"],
        "metacarpal bone": ["Metacarpianul", "Os metacarpale"],
        "metatarsal bone": ["Metatarsianul", "Os metatarsale"],
      }[serial[2]];
      terms = labels.map((s) => `${s} ${n}`);
    } else if (phalanx) {
      const level = {
        proximal: ["proximală", "proximalis"],
        middle: ["mijlocie", "media"],
        distal: ["distală", "distalis"],
      }[phalanx[1]];
      const digits = {
        thumb: "I",
        "index finger": "II",
        "middle finger": "III",
        "ring finger": "IV",
        "little finger": "V",
        "big toe": "I",
        "second toe": "II",
        "third toe": "III",
        "fourth toe": "IV",
        "little toe": "V",
      };
      const digit = digits[phalanx[2]],
        hand = /finger|thumb/.test(phalanx[2]);
      if (!digit) throw Error("Untranslated digit " + name);
      terms = [
        `Falanga ${level[0]} — degetul ${digit} al ${hand ? "mâinii" : "piciorului"}`,
        `Phalanx ${level[1]} digiti ${digit} ${hand ? "manus" : "pedis"}`,
      ];
    }
  }
  if (!terms) throw Error("Untranslated source bone " + name);
  return {
    names: {
      en: name[0].toUpperCase() + name.slice(1),
      ro: terms[0] + (side === "midline" ? "" : ` — ${roSide}`),
    },
    latinName: terms[1] + (side === "midline" ? "" : ` (${latinSide})`),
    laterality: side,
  };
}
const parents = [],
  used = new Set();
for (const parent of manifest.structures.filter(
  (s) => s.id !== "skull" && s.sourceConcepts.length > 1,
)) {
  const node = gltf.nodes.find((n) => n.extras.anatomyId === parent.id),
    primitive = gltf.meshes[node.mesh].primitives[0];
  const positions = decode(primitive.attributes.POSITION),
    indices = decode(primitive.indices);
  let vertexStart = 0,
    indexStart = 0;
  const parts = [];
  for (const concept of parent.sourceConcepts) {
    const vertices = [],
      faces = [];
    for (const fileId of concept.fileIds) {
      if (used.has(fileId)) throw Error("Duplicate source ownership");
      used.add(fileId);
      const original = await readFile(
        new URL(`tools/anatomy-assets/.cache/${fileId}.obj`, root),
      );
      if (
        hash(original) !==
        parent.sourceFiles.find((f) => f.id === fileId)?.sha256
      )
        throw Error("Source checksum mismatch");
      const base = vertexStart + vertices.length / 3;
      for (const line of original.toString().split("\n")) {
        if (line.startsWith("v ")) {
          const [x, y, z] = line.trim().split(/\s+/).slice(1).map(Number);
          vertices.push(x / 1000, z / 1000, -y / 1000);
        } else if (line.startsWith("f ")) {
          const f = line
            .trim()
            .split(/\s+/)
            .slice(1)
            .map((v) => Number(v.split("/")[0]) - 1 + base);
          for (let i = 1; i < f.length - 1; i++)
            faces.push(f[0], f[i], f[i + 1]);
        }
      }
    }
    const p = new Float32Array(vertices),
      ix = new Uint32Array(faces),
      pb = Buffer.from(p.buffer),
      ib = Buffer.from(ix.buffer);
    if (
      !pb.equals(
        positions.subarray(vertexStart * 12, vertexStart * 12 + pb.length),
      ) ||
      !ib.equals(indices.subarray(indexStart * 4, indexStart * 4 + ib.length))
    )
      throw Error("Not an exact source partition: " + concept.conceptId);
    const bound = (reduce, initial) =>
      [0, 1, 2].map((axis) => {
        let v = initial;
        for (let i = axis; i < p.length; i += 3) v = reduce(v, p[i]);
        return v;
      });
    parts.push({
      id: "bone-" + concept.conceptId.toLowerCase(),
      conceptId: concept.conceptId,
      ...translated(concept.name),
      bounds: {
        min: bound(Math.min, Infinity),
        max: bound(Math.max, -Infinity),
      },
      vertexStart,
      vertexCount: p.length / 3,
      indexStart,
      indexCount: ix.length,
      positionSha256: hash(pb),
      indexSha256: hash(ib),
    });
    vertexStart += p.length / 3;
    indexStart += ix.length;
  }
  if (
    vertexStart * 12 !== positions.length ||
    indexStart * 4 !== indices.length
  )
    throw Error("Incomplete partition");
  parents.push({
    id: parent.id,
    vertexCount: vertexStart,
    indexCount: indexStart,
    normalSha256: hash(decode(primitive.attributes.NORMAL)),
    parts,
  });
}
await writeFile(
  new URL("packages/anatomy-data/src/skeletal-parts.json", root),
  await format(JSON.stringify({ assetSha256: manifest.sha256, parents }), {
    parser: "json",
  }),
);
process.stdout.write(
  `Verified ${parents.reduce((n, p) => n + p.parts.length, 0)} existing source bones in ${parents.length} groups. No geometry changed.\n`,
);
