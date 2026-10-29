// Read the fixed manifest; populate ignored source cache only. Never rebuild
// or write existing skeletal/muscular/runtime assets to fit a new layer.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { inflateRawSync } from "node:zlib";
const cache = new URL("./.cache/", import.meta.url);
await mkdir(cache, { recursive: true });
const fixed = JSON.parse(
  await readFile(
    new URL(
      "../../packages/anatomy-data/src/skeleton-manifest.json",
      import.meta.url,
    ),
    "utf8",
  ),
);
const files = new Map(
  fixed.structures.flatMap((s) => s.sourceFiles).map((f) => [f.id, f.sha256]),
);
const archive =
  "https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/partof_BP3D_4.0_obj_99.zip";
async function range(value) {
  const response = await fetch(archive, {
    headers: { Range: `bytes=${value}` },
    signal: AbortSignal.timeout(45000),
  });
  if (response.status !== 206)
    throw Error(
      "Reference archive must support byte ranges, got " + response.status,
    );
  return Buffer.from(await response.arrayBuffer());
}
let entries;
async function directory() {
  const tail = await range("-65536");
  const end = tail.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  if (end < 0) throw Error("ZIP directory not found");
  const offset = tail.readUInt32LE(end + 16),
    size = tail.readUInt32LE(end + 12);
  const bytes = await range(`${offset}-${offset + size - 1}`);
  const out = new Map();
  for (let p = 0; p < bytes.length;) {
    if (bytes.readUInt32LE(p) !== 0x02014b50)
      throw Error("Invalid ZIP directory");
    const n = bytes.readUInt16LE(p + 28),
      x = bytes.readUInt16LE(p + 30),
      c = bytes.readUInt16LE(p + 32);
    const name = bytes.toString("utf8", p + 46, p + 46 + n),
      id = name.match(/(FJ\d+M?)\.obj$/)?.[1];
    if (id)
      out.set(id, {
        offset: bytes.readUInt32LE(p + 42),
        size: bytes.readUInt32LE(p + 20),
        rawSize: bytes.readUInt32LE(p + 24),
        compression: bytes.readUInt16LE(p + 10),
      });
    p += 46 + n + x + c;
  }
  return out;
}
for (const [id, expected] of files) {
  if (!/^FJ\d+M?$/.test(id)) throw Error("Unexpected fixed file ID");
  let bytes;
  try {
    bytes = await readFile(new URL(id + ".obj", cache));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  if (!bytes) {
    entries ??= await directory();
    const entry = entries.get(id);
    if (!entry)
      throw Error("Fixed reference not present in source archive: " + id);
    const header = await range(`${entry.offset}-${entry.offset + 29}`);
    if (header.readUInt32LE(0) !== 0x04034b50)
      throw Error("Invalid ZIP local header");
    const start =
      entry.offset + 30 + header.readUInt16LE(26) + header.readUInt16LE(28);
    const encoded = await range(`${start}-${start + entry.size - 1}`);
    if (![0, 8].includes(entry.compression))
      throw Error("Unsupported source compression");
    bytes = entry.compression === 8 ? inflateRawSync(encoded) : encoded;
    if (bytes.length !== entry.rawSize) throw Error("Reference size mismatch");
    if (createHash("sha256").update(bytes).digest("hex") !== expected)
      throw Error("Source reference changed: " + id);
    await writeFile(new URL(id + ".obj", cache), bytes);
  }
  if (createHash("sha256").update(bytes).digest("hex") !== expected)
    throw Error("Fixed reference checksum differs: " + id);
}
process.stdout.write(
  `Verified ${files.size} fixed source references in ignored cache; no runtime anatomy written.\n`,
);
