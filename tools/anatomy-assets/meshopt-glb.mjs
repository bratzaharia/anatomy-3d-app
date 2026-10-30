import { writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { MeshoptEncoder, MeshoptDecoder } from "meshoptimizer";
export async function writeMeshoptGlb(
  path,
  entries,
  copyright,
  materialName = "Neural source surfaces",
) {
  await Promise.all([MeshoptEncoder.ready, MeshoptDecoder.ready]);
  const views = [],
    accessors = [],
    chunks = [],
    nodes = [],
    meshes = [];
  let offset = 0,
    decodedBytes = 0;
  function attr(array, type, target, min, max) {
    const bytes = Buffer.from(array.buffer, array.byteOffset, array.byteLength),
      stride = type === "VEC3" ? 12 : 4,
      mode = target === 34963 ? "INDICES" : "ATTRIBUTES",
      count = bytes.length / stride;
    const encoded = MeshoptEncoder.encodeGltfBuffer(bytes, count, stride, mode),
      decoded = new Uint8Array(bytes.length);
    MeshoptDecoder.decodeGltfBuffer(decoded, count, stride, encoded, mode);
    if (!Buffer.from(decoded).equals(bytes))
      throw Error("Meshopt lossless round trip failed");
    const view = views.length;
    views.push({
      buffer: 1,
      byteOffset: decodedBytes,
      byteLength: bytes.length,
      target,
      extensions: {
        EXT_meshopt_compression: {
          buffer: 0,
          byteOffset: offset,
          byteLength: encoded.length,
          byteStride: stride,
          count,
          mode,
        },
      },
    });
    const pad = Buffer.alloc((4 - (encoded.length % 4)) % 4);
    chunks.push(Buffer.from(encoded), pad);
    offset += encoded.length + pad.length;
    decodedBytes += bytes.length;
    const id = accessors.length;
    accessors.push({
      bufferView: view,
      componentType: target === 34963 ? 5125 : 5126,
      count: array.length / (type === "VEC3" ? 3 : 1),
      type,
      ...(min ? { min, max } : {}),
    });
    return id;
  }
  for (const item of entries) {
    const p = attr(
        item.positions,
        "VEC3",
        34962,
        item.bounds.min,
        item.bounds.max,
      ),
      n = attr(item.normals, "VEC3", 34962),
      i = attr(item.indices, "SCALAR", 34963);
    nodes.push({
      name: item.id,
      mesh: meshes.length,
      extras: { anatomyId: item.id, sourceName: item.sourceName },
    });
    meshes.push({
      name: item.id,
      primitives: [
        { attributes: { POSITION: p, NORMAL: n }, indices: i, material: 0 },
      ],
    });
  }
  const gltf = {
    asset: {
      version: "2.0",
      generator: "Human Anatomy 3D Atlas source-preserving importer",
      copyright,
    },
    scene: 0,
    scenes: [{ nodes: nodes.map((_, i) => i) }],
    nodes,
    meshes,
    materials: [
      {
        name: materialName,
        pbrMetallicRoughness: {
          baseColorFactor: [0.75, 0.68, 0.48, 1],
          metallicFactor: 0,
          roughnessFactor: 0.76,
        },
      },
    ],
    buffers: [
      { byteLength: offset },
      {
        byteLength: decodedBytes,
        extensions: { EXT_meshopt_compression: { fallback: true } },
      },
    ],
    bufferViews: views,
    accessors,
    extensionsUsed: ["EXT_meshopt_compression"],
    extensionsRequired: ["EXT_meshopt_compression"],
  };
  let json = Buffer.from(JSON.stringify(gltf));
  json = Buffer.concat([json, Buffer.alloc((4 - (json.length % 4)) % 4, 32)]);
  const bin = Buffer.concat(chunks),
    header = Buffer.alloc(20),
    bh = Buffer.alloc(8);
  header.writeUInt32LE(0x46546c67, 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(28 + json.length + bin.length, 8);
  header.writeUInt32LE(json.length, 12);
  header.writeUInt32LE(0x4e4f534a, 16);
  bh.writeUInt32LE(bin.length, 0);
  bh.writeUInt32LE(0x004e4942, 4);
  const glb = Buffer.concat([header, json, bh, bin]);
  await writeFile(path, glb);
  return {
    byteLength: glb.length,
    sha256: createHash("sha256").update(glb).digest("hex"),
    decodedBytes,
  };
}
