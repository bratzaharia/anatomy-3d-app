// @vitest-environment node
import { beforeAll, describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import { MeshoptDecoder } from "meshoptimizer";
import {
  BufferAttribute,
  BufferGeometry,
  Mesh,
  MeshBasicMaterial,
  DoubleSide,
  Raycaster,
  Vector3,
} from "three";
import { SKELETAL_PART_PARENTS, SKELETON_ASSET } from "@anatomy/data";
import { skeletalDrawGroups, skeletalPartAtFace } from "./skeletalParts";
describe("coalesced source-bone drawing and picking", () => {
  const sources = new Map<
    string,
    { positions: Float32Array; indices: Uint32Array }
  >();
  beforeAll(async () => {
    const bytes = await readFile(
      new URL("../../public" + SKELETON_ASSET.uri, import.meta.url),
    );
    const length = bytes.readUInt32LE(12),
      gltf = JSON.parse(bytes.toString("utf8", 20, 20 + length));
    await MeshoptDecoder.ready;
    const decode = (id: number) => {
      const view = gltf.bufferViews[gltf.accessors[id].bufferView],
        e = view.extensions.EXT_meshopt_compression,
        out = new Uint8Array(view.byteLength);
      MeshoptDecoder.decodeGltfBuffer(
        out,
        e.count,
        e.byteStride,
        bytes.subarray(
          28 + length + e.byteOffset,
          28 + length + e.byteOffset + e.byteLength,
        ),
        e.mode,
      );
      return out;
    };
    for (const partition of SKELETAL_PART_PARENTS) {
      const node = gltf.nodes.find(
          (n: { extras: { anatomyId: string } }) =>
            n.extras.anatomyId === partition.id,
        ),
        p = gltf.meshes[node.mesh].primitives[0];
      sources.set(partition.id, {
        positions: new Float32Array(decode(p.attributes.POSITION).buffer),
        indices: new Uint32Array(decode(p.indices).buffer),
      });
    }
  });
  for (const parent of SKELETAL_PART_PARENTS) {
    it(`raycasts actual source triangles and excludes hidden faces in ${parent.id}`, () => {
      const { positions, indices } = sources.get(parent.id)!,
        part = parent.parts[1]!;
      const geometry = new BufferGeometry()
        .setAttribute("position", new BufferAttribute(positions, 3))
        .setIndex(new BufferAttribute(indices, 1));
      const material = new MeshBasicMaterial({ side: DoubleSide }),
        mesh = new Mesh(geometry, [material, material, material]);
      for (const g of skeletalDrawGroups(
        parent,
        new Set([part.id]),
        null,
        null,
      ))
        geometry.addGroup(g.start, g.count, g.materialIndex);
      const a = new Vector3(),
        b = new Vector3(),
        c = new Vector3(),
        normal = new Vector3();
      for (
        let i = part.indexStart;
        i < part.indexStart + part.indexCount;
        i += 3
      ) {
        a.fromArray(positions, indices[i]! * 3);
        b.fromArray(positions, indices[i + 1]! * 3);
        c.fromArray(positions, indices[i + 2]! * 3);
        normal.crossVectors(b.clone().sub(a), c.clone().sub(a));
        if (normal.lengthSq() > 1e-18) break;
      }
      expect(normal.lengthSq()).toBeGreaterThan(0);
      normal.normalize();
      const center = a
          .clone()
          .add(b)
          .add(c)
          .multiplyScalar(1 / 3),
        ray = new Raycaster(
          center.clone().addScaledVector(normal, 0.001),
          normal.negate(),
          0,
          0.002,
        );
      mesh.updateMatrixWorld(true);
      const hits = ray.intersectObject(mesh);
      expect(hits.length).toBeGreaterThan(0);
      expect(
        hits.every((h) => skeletalPartAtFace(parent, h.faceIndex) === part.id),
      ).toBe(true);
      geometry.clearGroups();
      expect(ray.intersectObject(mesh)).toHaveLength(0);
      geometry.dispose();
      material.dispose();
    });
    it(`preserves default one-draw source partition for ${parent.id}`, () => {
      const visible = new Set(parent.parts.map((p) => p.id));
      expect(skeletalDrawGroups(parent, visible, null, null)).toEqual([
        { start: 0, count: parent.indexCount, materialIndex: 0 },
      ]);
      for (const p of parent.parts) {
        expect(skeletalPartAtFace(parent, p.indexStart / 3)).toBe(p.id);
        expect(
          skeletalPartAtFace(parent, (p.indexStart + p.indexCount) / 3 - 1),
        ).toBe(p.id);
      }
      expect(skeletalPartAtFace(parent, -1)).toBeNull();
      expect(skeletalPartAtFace(parent, parent.indexCount / 3)).toBeNull();
      expect(skeletalPartAtFace(parent, undefined)).toBeNull();
    });
    it(`omits hidden source faces and highlights/isolation of one child only for ${parent.id}`, () => {
      const part = parent.parts[1]!;
      expect(
        skeletalDrawGroups(parent, new Set([part.id]), part.id, part.id),
      ).toEqual([
        { start: part.indexStart, count: part.indexCount, materialIndex: 1 },
      ]);
      const visible = new Set(
        parent.parts.filter((p) => p.id !== part.id).map((p) => p.id),
      );
      const groups = skeletalDrawGroups(parent, visible, null, null);
      expect(groups.reduce((n, g) => n + g.count, 0)).toBe(
        parent.indexCount - part.indexCount,
      );
      expect(
        groups.every(
          (g) =>
            g.start + g.count <= part.indexStart ||
            g.start >= part.indexStart + part.indexCount,
        ),
      ).toBe(true);
      expect(skeletalDrawGroups(parent, new Set(), null, null)).toEqual([]);
    });
  }
});
