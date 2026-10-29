// Public, pinned candidate acquisition. Download does not approve runtime use.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { format } from "prettier";
const cache = new URL("./.cache/", import.meta.url);
await mkdir(cache, { recursive: true });
const revision = "4ef7d59f4a2cc002f65ebd2bbb395ae4df3a5faf";
const sources = [
  [
    "z-nervous.fbx",
    `https://raw.githubusercontent.com/LluisV/Z-Anatomy/${revision}/Resources/Models/FBX/NervousSystem100.fbx`,
  ],
  [
    "z-neural-license.txt",
    `https://raw.githubusercontent.com/LluisV/Z-Anatomy/${revision}/Resources/Models/License.txt`,
  ],
  [
    "z-reference-skeleton.fbx",
    `https://raw.githubusercontent.com/LluisV/Z-Anatomy/${revision}/Resources/Models/FBX/SkeletalSystem100.fbx`,
  ],
  [
    "sparc-307-list.xml",
    "https://sparc-prod-aod-discover-publish50-use1.s3.amazonaws.com/?list-type=2&prefix=307/&max-keys=1000",
  ],
];
if (process.argv.includes("--hra")) {
  const hraRevision = "f1a3a63f110e27ff0736047d52d04dba5d3087f9";
  const base = `https://raw.githubusercontent.com/hubmapconsortium/ccf-3d-reference-object-library/${hraRevision}/`;
  sources.push(
    ["hra-license.txt", base + "LICENSE"],
    ["hra-readme.md", base + "README.md"],
    ["hra-spinal-cord.glb", base + "VH_Male/v1.2/VH_M_Spinal_Cord.glb"],
    ["hra-vertebrae.glb", base + "VH_Male/v1.2/VH_M_Vertebrae.glb"],
    [
      "hra-spinal-landmarks.glb",
      base + "VH_Male/v1.2/Extraction%20Sites/VH_M_Spinal_Cord_Landmarks.glb",
    ],
  );
}
if (process.argv.includes("--sparc")) {
  const listingPath = new URL("sparc-307-list.xml", cache);
  const xml = await readFile(listingPath, "utf8").catch(async (error) => {
    if (error.code !== "ENOENT") throw error;
    const [, url] = sources.find(
      ([filename]) => filename === "sparc-307-list.xml",
    );
    const response = await fetch(url, { signal: AbortSignal.timeout(120000) });
    if (!response.ok) throw Error(`${response.status}: ${url}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    await writeFile(listingPath, bytes);
    return bytes.toString("utf8");
  });
  for (const match of xml.matchAll(/<Key>(.*?)<\/Key>/g)) {
    const key = match[1];
    if (
      /(?:nervesWithVagus|spinal_nerves|cervical_nerve|lumbar_nerve|sacral_nerve|thoracic_nerve|human_body_provenance|Geometry_Fitter_Wholebody|readme)/i.test(
        key,
      )
    )
      sources.push([
        "sparc-" + key.split("/").at(-1),
        "https://sparc-prod-aod-discover-publish50-use1.s3.amazonaws.com/" +
          key,
      ]);
  }
}
const records = [];
for (const [filename, url] of sources) {
  let bytes;
  try {
    bytes = await readFile(new URL(filename, cache));
  } catch {
    const response = await fetch(url, { signal: AbortSignal.timeout(120000) });
    if (!response.ok) throw Error(`${response.status}: ${url}`);
    bytes = Buffer.from(await response.arrayBuffer());
    await writeFile(new URL(filename, cache), bytes);
  }
  records.push({
    filename,
    url,
    bytes: bytes.length,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    approval: "candidate-only",
  });
  process.stdout.write(JSON.stringify(records.at(-1)) + "\n");
}
await writeFile(
  new URL("nervous-acquisition.json", cache),
  JSON.stringify(records, null, 2),
);
if (process.argv.includes("--report"))
  await writeFile(
    new URL("../../docs/assets/nervous-acquisition.json", import.meta.url),
    await format(JSON.stringify(records), { parser: "json" }),
  );
