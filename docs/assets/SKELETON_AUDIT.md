# Skeletal asset integration audit

Decision: accepted for the sourced educational skeletal view; independent medical and terminology review remains pending. Audit date: 2026-10-27.

Selection follow-up, 2026-10-29: [source-exact bone partition](SKELETAL_PARTITION_AUDIT.md)
adds individual interaction inside the original groups without changing this
GLB. The original grouped-selection findings below describe the initial release.
The current [coverage audit](SYSTEM_COVERAGE.md) exposes seven missing bone
identities rather than claiming complete skeletal geometry.

## Provenance and rights

The model comes directly from the official BodyParts3D 4.0 PART-OF OBJ archive. The publisher's current license page and archive README specify CC BY 4.0 and required attribution. Those terms permit adaptation and redistribution, including commercial reuse, subject to attribution and the linked license. Historical OBJ headers retain an earlier license notice; this distinction is recorded in `ASSET_SOURCES.md`. No third-party Z-Anatomy material was included. Source links, FMA concepts, original FJ file IDs, and original OBJ SHA-256 hashes are retained per structure in `skeleton-manifest.json`.

## Geometry and identity

- Included: 202 explicitly selected source meshes, 513,164 triangles, and 29 canonical structures/groups.
- The broad upstream skeleton group was not used: it includes non-bone tissues and omits limb bones. The importer instead resolves a curated inclusion list of named bone concepts.
- Coordinate conversion: source millimetres/Z-up to metres/Y-up/+Z-anterior, preserving triangle winding. Extent: approximately 0.648 × 1.707 × 0.254 metres. The source's left bones have positive X after conversion.
- No anatomical reshaping, mirroring, extra decimation, or quantization. Smooth normals are recomputed from source topology. No textures are used.
- Skull, spine, ribs/sternum, hips, hands, and feet have explicit group selection. Separate arm/leg bones and mandible retain independent IDs. This is not advertised as a complete 206-bone inventory; auditory ossicles, coccyx, and separate teeth are absent.
- Runtime geometry-to-ID mappings are embedded as GLB extras and checked against the catalog. Camera fit/focus uses measured per-structure bounds.

## Size and compression

Raw GLB: 12,988,696 bytes. Losslessly compressed GLB: 7,134,628 bytes; gzip: 6,578,713 bytes. Meshopt round trips verify all buffer bytes before output. The source is already the publisher's reduced-detail release, so no additional simplification was applied.

## Verification

`pnpm validate:anatomy` checks GLB version and checksum, expected file size, mapping coverage, decompression, finite geometry, index ranges, exact triangle count, and per-structure bounds. Domain/component tests cover metadata, source uniqueness, licensing/schema rejection, filtering, groups, and inspection. Browser tests cover actual raycast selection and hidden geometry exclusion, cached loading through locale/filter changes, a failed-model retry, and tablet navigation. Visible model framing, anatomy orientation, selection, and focus were also inspected in the app browser.

Remaining review: qualified medical/RO terminology assessment, finer independent selection inside current groups, physical-device GPU/memory/FPS measurement, and context-restoration behavior.
