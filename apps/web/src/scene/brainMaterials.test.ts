import { describe, expect, it } from "vitest";
import { MeshStandardMaterial } from "three";
import { brainMaterial } from "./brainMaterials";
describe("reversible brain-only materials", () => {
  it("returns the exact original Natural material and never mutates it", () => {
    const base = new MeshStandardMaterial({
        color: "#b99e98",
        roughness: 0.76,
      }),
      before = base.toJSON();
    expect(brainMaterial(base, undefined, 1, false, false)).toBe(base);
    const colored = brainMaterial(base, "#123456", 0.4, true, true);
    expect(colored).not.toBe(base);
    expect(colored.transparent).toBe(true);
    expect(colored.depthWrite).toBe(false);
    expect(base.toJSON()).toEqual(before);
    expect(brainMaterial(base, undefined, 1, false, false)).toBe(base);
    colored.dispose();
    base.dispose();
  });
});
