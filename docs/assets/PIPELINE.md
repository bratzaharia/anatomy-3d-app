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

# Independent muscular pipeline

Run `node tools/anatomy-assets/import-muscles.mjs` (or `--offline` after caching). The command writes only muscular runtime assets, muscular manifests/reports and its alignment report. It never invokes or modifies the skeletal importer, GLB, manifest or renderer. It checks the fixed skeletal files and recorded source-geometry landmark hashes; if the original bone source cache is present, it checks that too. A fresh checkout can use the committed landmark baseline without rebuilding skeletal outputs.

The curated inventory, RO names, contextual compartments, serial-set conventions and whole-muscle source assemblies are in `muscle-definition.mjs`. ZIP ranges retrieve only accepted source files plus 29 read-only skeletal references. Source OBJ originals and candidate FBX files stay in ignored `.cache/`; only the optimized GLB and inspectable metadata are distributed. Conflicting source-side labels are quarantined, unavailable individual members remain explicit, and source files cannot acquire duplicate runtime ownership.

The pipeline verifies lossless Meshopt round trips and writes canonical anatomy IDs into node extras. `pnpm validate:anatomy` decodes both assets, checks mappings/geometry/checksums, validates every inventory entry and group, and checks the three immutable skeletal baseline hashes. `pnpm validate:i18n` checks both catalogs and all UI keys. Run format, tests, source review and build before accepting a changed asset. The muscular GLB can be served from a configured static origin with `VITE_MUSCLE_ASSET_BASE_URL`; there is no R2-specific runtime API.

Higher-detail regional sources are not present in this release. Do not invent a coarse model or treat generated shapes as medical LODs; audit and register a real additional asset before introducing progressive regional detail.

## Independent nervous extension — reproducible source-only transfer

The original BodyParts3D nervous importer remains available for its archived
83-entity source asset. Do not invoke older skeletal or muscular importers to fit
new nerves. All fixed references can be acquired without writing runtime anatomy:

```sh
node tools/anatomy-assets/acquire-fixed-references.mjs
node tools/anatomy-assets/acquire-nervous-sources.mjs --hra --sparc --report
node tools/anatomy-assets/inspect-nervous-sources.mjs --skeleton
node tools/anatomy-assets/inspect-nervous-sources.mjs
node tools/anatomy-assets/z-nervous-registration.mjs
node tools/anatomy-assets/import-z-nervous.mjs
node tools/anatomy-assets/audit-hra-spinal.mjs
pnpm validate:anatomy
```

Acquisition downloads into ignored `.cache/` only, retaining exact source hashes.
The reference acquirer verifies all 202 original OBJ hashes against the immutable
skeletal manifest. The Z source skeleton is read only for 190 geometric proxy
correspondences, never rendered or used to replace the fixed bones. Source-only
registration records its coefficients/holdouts and is not clinical approval.
The neural importer verifies the source FBX and license hashes and 14 protected
reference files before writing only four new neural GLBs, attribution, its
supplement manifest and registration report. Lossless Meshopt writer and decoded
validator retain canonical ID ownership and actual source topology.

HRA cord and SPARC scaffold acquisition does not approve their runtime use. The
HRA audit measures 24 corresponding vertebrae and records its unresolved canal
registration. SPARC source-estimated nerve paths must remain separate from any
verified anatomical claim. The current regional GLBs all load on activation;
progressive high/low-detail neural LOD is not implemented. See the current
[source decisions and performance evidence](NERVOUS_AUDIT.md).

To refresh all 20 viewer-generated regional QA artifacts after a build:

```sh
pnpm build
NERVOUS_CAPTURE_QA=1 pnpm exec playwright test apps/web/e2e/nervous-distal.spec.ts --grep 'twenty source'
```

These are captured partial source views with explicit missing-region records,
not human medical review. Distal tests pick actual rendered digital source
pixels, then verify canonical selection and no hidden-mesh picking.
