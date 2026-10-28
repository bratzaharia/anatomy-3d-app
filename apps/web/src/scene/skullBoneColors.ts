import { Color } from "three";

// Reference-image educational segmentation, not physiological pigmentation.
// Canonical FMA source IDs remain unchanged; paired colors differ only slightly.
export const skullBoneColors: Readonly<Record<string, string>> = {
  FMA52734: "#ffff00", // frontal — yellow
  FMA52789: "#ffc400",
  FMA52788: "#ffc800", // parietals — gold
  FMA52739: "#11eb00",
  FMA52738: "#13ee02", // temporals — green
  FMA52735: "#a000dd", // occipital — purple
  FMA52736: "#00aee9", // sphenoid — blue
  FMA52740: "#ee1616", // ethmoid — red
  FMA53650: "#badb28",
  FMA53649: "#bede2b", // maxillae — yellow-green
  FMA52893: "#00d5d7",
  FMA52892: "#02d8d9", // zygomatics — cyan
  FMA53648: "#ef9c00",
  FMA53647: "#f29f02", // nasals — orange
  FMA53646: "#ed00bc",
  FMA53645: "#f002c0", // lacrimals — magenta
  FMA53656: "#008ed0",
  FMA53655: "#0391d3", // palatines — blue
  FMA54738: "#9b00db",
  FMA54737: "#9e03de", // inferior conchae — violet
  FMA9710: "#d8c89a", // vomer — ivory
  FMA52748: "#c7c3ba", // mandible — natural bone, absent in color reference
};
export function skullDisplayColor(conceptId: string, darkened = false): Color {
  const hex = skullBoneColors[conceptId];
  if (!hex) throw new Error("Missing skull palette ID: " + conceptId);
  const color = new Color(hex);
  if (darkened)
    color.convertLinearToSRGB().multiplyScalar(0.8).convertSRGBToLinear();
  return color;
}
