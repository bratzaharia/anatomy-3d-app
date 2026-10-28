import { Color } from "three";

// Illustrative atlas colors by bone family from the user's reference.
// The image is a palette reference, not a source of anatomy/geometry.
export const skullReferenceColors: Readonly<Record<string, string>> = {
  FMA52734: "#ffff00", // frontal — yellow
  FMA52789: "#ffc400",
  FMA52788: "#ffc400", // parietals — gold
  FMA52739: "#11eb00",
  FMA52738: "#11eb00", // temporals — green
  FMA52735: "#a000dd", // occipital — purple
  FMA52736: "#00aee9", // sphenoid — blue
  FMA52740: "#ee1616", // ethmoid — red
  FMA53650: "#badb28",
  FMA53649: "#badb28", // maxillae — yellow-green
  FMA52893: "#00d5d7",
  FMA52892: "#00d5d7", // zygomatics — cyan
  FMA53648: "#ef9c00",
  FMA53647: "#ef9c00", // nasals — orange
  FMA53646: "#ed00bc",
  FMA53645: "#ed00bc", // lacrimals — magenta
  FMA53656: "#008ed0",
  FMA53655: "#008ed0", // palatines — blue
  FMA54738: "#9b00db",
  FMA54737: "#9b00db", // inferior nasal conchae — violet
  FMA9710: "#d8c89a", // vomer — ivory
  FMA52748: "#d7c9bc", // mandible absent from references: muted bone
};

// Exactly 30% less HSV saturation in display/sRGB space; opacity remains 1.
export function softenReference(hex: string): Color {
  const color = new Color(hex).convertLinearToSRGB();
  const max = Math.max(color.r, color.g, color.b);
  color.r = max + (color.r - max) * 0.7;
  color.g = max + (color.g - max) * 0.7;
  color.b = max + (color.b - max) * 0.7;
  return color.convertSRGBToLinear();
}
export const skullBoneColors: Readonly<Record<string, string>> =
  Object.fromEntries(
    Object.entries(skullReferenceColors).map(([id, hex]) => [
      id,
      "#" + softenReference(hex).getHexString(),
    ]),
  );
export function skullDisplayColor(conceptId: string, darkened = false): Color {
  const hex = skullBoneColors[conceptId];
  if (!hex) throw new Error("Missing skull palette ID: " + conceptId);
  const color = new Color(hex);
  if (darkened)
    color.convertLinearToSRGB().multiplyScalar(0.8).convertSRGBToLinear();
  return color;
}
