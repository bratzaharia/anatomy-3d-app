# Asset sources

## Included runtime geometry

`bodyparts3d-skeleton-v4` is adapted directly from the official [BodyParts3D 4.0 PART-OF archive](https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/partof_BP3D_4.0_obj_99.zip). The source is the publisher's 99% polygon-reduction release, not full-resolution clinical geometry. Source concepts and element-file mappings come from the accompanying [PART-OF names table](https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/partof_parts_list_e.txt) and [element table](https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/partof_element_parts.txt).

The original dataset describes an adult male whole-body model. We selected only curated named bone concepts, because the upstream broad skeleton group includes some non-bone tissues and omits limb bones. The import contains 202 element meshes, mapped to 29 selectable bones/groups. This is a mesh count, not a claim of 202 distinct anatomical bones or a complete 206-bone inventory. Auditory ossicles, coccyx, and separate teeth are not supplied in this view. No soft tissue, third-party kidney model, texture, or unrelated Z-Anatomy asset was imported.

The generated `packages/anatomy-data/src/skeleton-manifest.json` records every FMA source concept, FJ element ID, original OBJ SHA-256, output checksum, exact bounds, and triangle count. `tools/anatomy-assets/skeleton-definition.mjs` is the reviewed inclusion list. `import-skeleton.mjs` retrieves only those ZIP entries, converts millimetres/Z-up to metres/Y-up/+Z-anterior, recomputes smooth normals, groups source elements by canonical ID, assigns bone material, and compresses losslessly with Meshopt. No extra simplification, geometry reshaping, or quantization is applied.

License verified on 2026-10-27 against the [official asset archive license](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html), updated 2025-02-27, and the [accompanying archive README](https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/README_e.html). Both specify CC BY 4.0. Some OBJ headers retain the historical CC BY-SA 2.1 Japan notice; the current distribution license is documented separately rather than inferred from a mirror. Attribution and links are visible in the viewer and distributed beside the GLB.

## Muscular geometry

The additive muscular asset uses the official [IS-A OBJ 99 archive](https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/isa_BP3D_4.0_obj_99.zip), [names](https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/isa_parts_list_e.txt) and [element mappings](https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/isa_element_parts.txt). It shares the fixed skeleton's source coordinate frame and unit conversion; identical geometry hashes for 29 reference meshes are recorded in `muscle-alignment.json`. It does not invoke or modify the skeletal importer. See [muscular audit](MUSCLE_AUDIT.md) and [computed coverage](MUSCLE_COVERAGE.md).

## Nervous whole-body extension

The additive nervous extension retains the original BodyParts3D CNS source and adds an audited peripheral subset from pinned Z-Anatomy FBX source, including distal hand/foot surfaces. Its source-only registration, BY-SA derivative obligations, excluded third-party content, acquired SPARC research scaffolds and quarantined HRA cord are documented in [the nervous audit](NERVOUS_AUDIT.md). Effective coverage comes from [decoded GLBs](NERVOUS_GEOMETRY_COVERAGE.md), not metadata counts. These neural decisions do not approve the separate muscular candidate below.

## Candidate evaluation before import

Z-Anatomy's publisher-provided muscular FBX was evaluated as a gap closer but not accepted into runtime because registration to the fixed skeleton has not been validated; its source-specific license and 18 reference comparisons are documented in the muscular audit. Open Anatomy Project remains an unevaluated candidate. Before importing additional assets, audit exact versions and included subassets. Independent medical review of grouping, translations and source suitability remains pending.
