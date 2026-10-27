# Anatomical asset pipeline

The runtime format is GLB. Do not place a source asset in `public/models` until its audit is accepted.

1. Preserve the original download, checksum, source page, exact version, and asset-specific license outside the runtime bundle.
2. Inspect the source in Blender or an equivalent deterministic tool. Record units, up/forward axes, origin, transforms, mesh count, materials, textures, and hierarchy.
3. Correct normals and non-manifold defects without altering anatomy. Normalize to metres, upright anatomical position, Y-up, centred around the body midline, with feet near ground level.
4. Split structures that require independent selection. Do not merge by material. Assign stable source keys, then maintain an explicit source-key → canonical anatomy-ID map; Blender names are not runtime identities.
5. Export GLB, calculate per-structure bounds, and validate every selectable mesh mapping. Reject unknown IDs and catalog entities falsely marked available.
6. Measure uncompressed and transferred bytes, triangles, draw calls, texture memory, load/decode time, and representative interaction performance. Apply Meshopt or Draco only after comparing size and decode cost. Use KTX2 only when textures justify it.
7. Add a manifest entry with semantic asset ID, URI, LOD, mappings, license ID, and provenance. Update `ASSET_SOURCES.md`, `LICENSE_MATRIX.md`, and `ATTRIBUTION.md`.
8. Run `pnpm validate:anatomy`, `pnpm validate:i18n`, tests, build, and the asset-audit skill. Manually verify orientation, scale, filtering, hover, selection, focus bounds, context restoration, and repeated navigation memory.

Source formats may be BLEND, FBX, OBJ, STL, glTF, or GLB, but only the measured, validated runtime GLB and its license metadata ship. High-detail regional files remain separate loading boundaries so the whole-body shell never downloads them unnecessarily.

## Implemented BodyParts3D importer

`node tools/anatomy-assets/import-skeleton.mjs` downloads only curated bone entries using ZIP HTTP byte ranges and the official FMA/element mapping tables. Original OBJ files are cached under ignored `.cache/` with per-file hashes recorded in the generated manifest. `--offline` rebuilds from this cache. Edit `skeleton-definition.mjs` to change the explicit inclusion list, then regenerate and run both validators.

Each canonical structure becomes one selectable GLB mesh, including deliberate groups such as hands/feet. The manifest retains the original finer source concept/file mappings so these can be split later without guessing scene names. Compression round trips verify all vertex/normal/index bytes. The anatomy validator separately decodes the shipped GLB and checks its checksum, mapping coverage, bounds, and index ranges.
