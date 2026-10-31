import { ARTERIAL_PALETTE } from "@anatomy/data";
export function arterialColor(mode: string, group: string, custom?: string) {
  return mode === "natural"
    ? "#a36970"
    : (custom ?? ARTERIAL_PALETTE[group] ?? "#b77a80");
}
