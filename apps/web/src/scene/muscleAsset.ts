import { MUSCLE_ASSET } from "@anatomy/data";
// A static CDN/R2 origin can serve the same versioned, checksum-validated asset.
export const muscleAssetUrl = `${import.meta.env.VITE_MUSCLE_ASSET_BASE_URL ?? ""}${MUSCLE_ASSET.uri}`;
