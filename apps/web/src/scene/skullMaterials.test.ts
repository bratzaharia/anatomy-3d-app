import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { MeshoptDecoder } from "meshoptimizer";
import {
  BufferGeometry,
  Float32BufferAttribute,
  Uint32BufferAttribute,
  MeshStandardMaterial,
  Color,
  Mesh,
  Raycaster,
  Vector3,
} from "three";
import {
  SKELETON_ASSET,
  SKULL_BONE_MAPPINGS,
  SKULL_BONE_STRUCTURES,
  SKELETAL_STRUCTURES,
} from "@anatomy/data";
import { resolveVisibleStructureIds } from "@anatomy/core";
import layout from "../../../../packages/anatomy-data/src/skull-color-ranges.json";
import {
  skullBoneColors,
  skullReferenceColors,
  softenReference,
  skullDisplayColor,
} from "./skullBoneColors";
import {
  createSkullBoneMaterials,
  createSkullGeometryViews,
  validateSkullColorLayout,
} from "./skullMaterials";

const hash = (bytes: Uint8Array) =>
  createHash("sha256").update(bytes).digest("hex");
describe("skull-only anatomical materials", () => {
  it("matches the palette to the existing canonical source concepts, not mesh labels", () => {
    const sourceIds = SKELETON_ASSET.structures
      .filter((item) => ["skull", "mandible"].includes(item.id))
      .flatMap((item) => item.sourceConcepts.map((source) => source.conceptId));
    expect(Object.keys(skullBoneColors).sort()).toEqual(sourceIds.sort());
    expect(SKULL_BONE_STRUCTURES).toHaveLength(21);
    expect(new Set(SKULL_BONE_STRUCTURES.map((bone) => bone.id)).size).toBe(21);
    expect(layout.ranges.map((range) => range.conceptId)).toEqual(
      SKELETON_ASSET.structures
        .find((item) => item.id === "skull")!
        .sourceConcepts.map((source) => source.conceptId),
    );
  });
  it("verifies every bone range against the unchanged GLB and leaves spatial attributes untouched", async () => {
    const bytes = readFileSync(
      resolve("apps/web/public/models/bodyparts3d-skeleton.glb"),
    );
    expect(hash(bytes)).toBe(
      "126268604b056cdd8878c6297f6a8e90ae5cbf4cdce1cc7f952988d13bc68531",
    );
    const length = bytes.readUInt32LE(12),
      gltf = JSON.parse(bytes.toString("utf8", 20, 20 + length));
    const node = gltf.nodes.find(
      (item: { extras: { anatomyId: string } }) =>
        item.extras.anatomyId === "skull",
    );
    const primitive = gltf.meshes[node.mesh].primitives[0];
    await MeshoptDecoder.ready;
    function decode(id: number) {
      const view = gltf.bufferViews[gltf.accessors[id].bufferView],
        extension = view.extensions.EXT_meshopt_compression;
      const result = new Uint8Array(view.byteLength);
      MeshoptDecoder.decodeGltfBuffer(
        result,
        extension.count,
        extension.byteStride,
        bytes.subarray(
          28 + length + extension.byteOffset,
          28 + length + extension.byteOffset + extension.byteLength,
        ),
        extension.mode,
      );
      return result;
    }
    const positions = decode(primitive.attributes.POSITION),
      indices = decode(primitive.indices),
      normals = decode(primitive.attributes.NORMAL);
    let vertex = 0,
      index = 0;
    for (const range of layout.ranges) {
      expect(range.vertexStart).toBe(vertex);
      expect(range.indexStart).toBe(index);
      expect(
        hash(
          positions.subarray(vertex * 12, (vertex + range.vertexCount) * 12),
        ),
      ).toBe(range.positionSha256);
      expect(
        hash(indices.subarray(index * 4, (index + range.indexCount) * 4)),
      ).toBe(range.indexSha256);
      const faces = new Uint32Array(
        indices.buffer,
        index * 4,
        range.indexCount,
      );
      expect(
        faces.every(
          (value) => value >= vertex && value < vertex + range.vertexCount,
        ),
      ).toBe(true);
      vertex += range.vertexCount;
      index += range.indexCount;
    }
    expect(vertex * 12).toBe(positions.length);
    expect(index * 4).toBe(indices.length);
    expect(hash(normals)).toBe(layout.normalSha256);
    const geometry = new BufferGeometry();
    geometry.setAttribute(
      "position",
      new Float32BufferAttribute(new Float32Array(positions.buffer), 3),
    );
    geometry.setAttribute(
      "normal",
      new Float32BufferAttribute(new Float32Array(normals.buffer), 3),
    );
    geometry.setIndex(
      new Uint32BufferAttribute(new Uint32Array(indices.buffer), 1),
    );
    const positionAttribute = geometry.attributes.position,
      indexAttribute = geometry.index;
    validateSkullColorLayout(geometry);
    const views = createSkullGeometryViews(geometry);
    expect(views).toHaveLength(21);
    for (const [i, view] of views.entries()) {
      const range = SKULL_BONE_MAPPINGS[i]!;
      expect(view.geometry.attributes.position).toBe(positionAttribute);
      expect(view.geometry.attributes.normal).toBe(geometry.attributes.normal);
      expect(view.geometry.index).toBe(indexAttribute);
      expect(view.geometry.drawRange).toEqual({
        start: range.indexStart,
        count: range.indexCount,
      });
      expect(view.geometry.boundingBox?.min.toArray()).toEqual(
        range.bounds.min,
      );
      expect(view.geometry.boundingBox?.max.toArray()).toEqual(
        range.bounds.max,
      );
      // Every range uses the same original index buffer but raycasts only its own triangles.
      const mesh = new Mesh(view.geometry, new MeshStandardMaterial());
      const center = view.geometry.boundingBox!.getCenter(new Vector3());
      mesh.updateMatrixWorld();
      const hits = new Raycaster(
        center.clone().add(new Vector3(0, 0, 1)),
        new Vector3(0, 0, -1),
      ).intersectObject(mesh);
      for (const hit of hits)
        expect(hit.faceIndex! * 3).toBeGreaterThanOrEqual(range.indexStart);
      for (const hit of hits)
        expect(hit.faceIndex! * 3).toBeLessThan(
          range.indexStart + range.indexCount,
        );
      mesh.material.dispose();
      view.geometry.dispose();
    }
    expect(geometry.attributes.position).toBe(positionAttribute);
    expect(geometry.index).toBe(indexAttribute);
    expect(Object.keys(geometry.attributes).sort()).toEqual([
      "normal",
      "position",
    ]);
    expect(geometry.groups).toHaveLength(0);
    geometry.dispose();
  });
  it("reduces reference saturation 30%, darkens only the hovered/selected bone 20%, and stays opaque", () => {
    for (const [id, hex] of Object.entries(skullReferenceColors)) {
      const reference = new Color(hex).convertLinearToSRGB();
      const softened = softenReference(hex).convertLinearToSRGB();
      const saturation = (c: Color) =>
        (Math.max(c.r, c.g, c.b) - Math.min(c.r, c.g, c.b)) /
        Math.max(c.r, c.g, c.b);
      expect(saturation(softened)).toBeCloseTo(saturation(reference) * 0.7, 4);
      const base = skullDisplayColor(id).convertLinearToSRGB();
      const hover = skullDisplayColor(id, true).convertLinearToSRGB();
      for (const axis of ["r", "g", "b"] as const)
        expect(hover[axis]).toBeCloseTo(base[axis] * 0.8, 4);
      const materials = createSkullBoneMaterials(id);
      expect(materials.base.color.getHexString()).toBe(
        skullBoneColors[id]!.slice(1),
      );
      expect(materials.base.color.equals(materials.hovered.color)).toBe(false);
      for (const material of Object.values(materials)) {
        expect(material.roughness).toBe(0.7);
        expect(material.metalness).toBe(0);
        expect(material.transparent).toBe(false);
        expect(material.opacity).toBe(1);
        material.dispose();
      }
    }
  });
  it("supports individual and parent skull hiding/isolation without exposing hidden children", () => {
    const id = SKULL_BONE_STRUCTURES[0]!.id;
    const resolve = (hidden: string[], isolated: string[]) =>
      resolveVisibleStructureIds(SKELETAL_STRUCTURES, new Set(["skeletal"]), {
        hiddenIds: new Set(hidden),
        isolatedIds: new Set(isolated),
      });
    expect(resolve([], []).has(id)).toBe(true);
    expect(resolve(["skull"], []).has(id)).toBe(false);
    expect(resolve([id], []).has(id)).toBe(false);
    expect(resolve([], ["skull"]).has(id)).toBe(true);
    expect([...resolve([], [id])]).toEqual([id]);
    expect(resolve(["skull"], [id]).size).toBe(0);
    expect(
      resolveVisibleStructureIds(SKELETAL_STRUCTURES, new Set(["muscular"]))
        .size,
    ).toBe(0);
  });
});
