import { readFile, writeFile } from "node:fs/promises";
import { FBXLoader } from "../../apps/web/node_modules/three/examples/jsm/loaders/FBXLoader.js";
import {
  Box3,
  Vector3,
  LoadingManager,
  Texture,
} from "../../apps/web/node_modules/three/build/three.module.js";
const manager = new LoadingManager();
manager.addHandler(/.*/, { load: () => new Texture() });
const skeleton = process.argv.includes("--skeleton");
const bytes = await readFile(
  new URL(
    skeleton ? "./.cache/z-reference-skeleton.fbx" : "./.cache/z-nervous.fbx",
    import.meta.url,
  ),
);
const scene = new FBXLoader(manager).parse(
  bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.length),
  "",
);
scene.updateMatrixWorld(true);
const meshes = [];
scene.traverse((object) => {
  if (!object.isMesh) return;
  const box = new Box3();
  for (let i = 0; i < object.geometry.attributes.position.count; i++)
    box.expandByPoint(
      new Vector3()
        .fromBufferAttribute(object.geometry.attributes.position, i)
        .applyMatrix4(object.matrixWorld)
        .multiplyScalar(0.01),
    );
  meshes.push({
    name: object.name,
    sourceId: object.ID,
    vertices: object.geometry.attributes.position.count,
    triangles:
      (object.geometry.index?.count ??
        object.geometry.attributes.position.count) / 3,
    bounds: { min: box.min.toArray(), max: box.max.toArray() },
  });
});
await writeFile(
  new URL(
    skeleton ? "./.cache/z-bone-meshes.json" : "./.cache/z-nervous-meshes.json",
    import.meta.url,
  ),
  JSON.stringify(meshes, null, 2),
);
process.stdout.write(
  JSON.stringify({
    meshCount: meshes.length,
    triangles: meshes.reduce((n, m) => n + m.triangles, 0),
  }) + "\n",
);
process.stdout.write(
  meshes
    .filter((m) => m.triangles > 20)
    .map((m) => `${m.name}\t${m.triangles}`)
    .join("\n") + "\n",
);
const xml = await readFile(
  new URL("./.cache/sparc-307-list.xml", import.meta.url),
  "utf8",
);
process.stdout.write(
  "SPARC FILES\n" +
    [...xml.matchAll(/<Key>(.*?)<\/Key>/g)]
      .map((m) => m[1])
      .filter((s) =>
        /nerve|centre|wholebody|provenance|readme|license/i.test(s),
      )
      .join("\n") +
    "\n",
);
