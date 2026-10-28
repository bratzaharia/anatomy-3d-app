# Muscular asset audit — 2026-10-27

Decision: accept the curated BodyParts3D muscular subset for the existing educational development viewer, with conspicuous incomplete-coverage and unreviewed-content notices. **Do not declare the requested complete-muscular milestone achieved.** Independent anatomical, attachment, localization and device-performance review remains required before medical/clinical use.

## Included source and licensing

Exact source: official [BodyParts3D 4.0 IS-A OBJ 99 release](https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/isa_BP3D_4.0_obj_99.zip), with accompanying `isa_parts_list_e.txt` and `isa_element_parts.txt`. Metadata checksums, every FMA concept, FJ file ID and raw OBJ checksum are retained in `muscle-manifest.json`. Originals are cached separately and ignored by Git. The publisher's 99%-reduced release is used without further simplification, invented geometry or new mirroring.

The [official asset license](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html), updated 2025-02-27 and checked on the audit date, specifies CC BY 4.0: commercial use, redistribution and adaptations are permitted with attribution, license/source links and disclosure of modifications. Historical OBJ headers still mention CC BY-SA 2.1 Japan; the current distribution terms are recorded explicitly, not inferred from an unrelated mirror. Attribution ships next to the GLB and remains visible in the app. The application code has not been relicensed.

## Inventory and mapping findings

Inventory v1.0.0 is an editorial macroscopic inventory informed by FIPAT Terminologia Anatomica, 2nd edition, and the publisher's FMA concepts. It is not an agreed universal muscle count or a certified exhaustive inventory. Laterality is counted explicitly; selected serial muscle families remain sets, and variants/sex-specific anatomy need further review. Individual Latin anatomical terms are public-domain terminology; the FIPAT publication itself retains its own license. Romanian wording is editorial and not represented as an official FIPAT translation.

The runtime contains 355 selectable entities: 329 individually mapped concepts/whole-muscle assemblies and 26 explicitly labeled source sets, comprising 417 distinct source files. The inventory also preserves 22 hand members only identifiable within source sets and 143 entries without accepted geometry. These are computed categories, not a fixed total of human muscles. All available groups and every unavailable entry can be inspected in the UI. No origins, insertions, functions, innervation or blood-supply claims have been invented.

Important gaps include facial expression and mastication, intrinsic tongue and middle-ear/auricular muscles, portions of the abdominal wall and intrinsic back, right longus colli, perineal/sex-specific musculature, individual intrinsic hand members, dorsal foot interossei and extensor digitorum brevis. See the generated report for the exact entity list. Metadata is not evidence of full clinical shape/attachment completeness: for example, the source's whole flexor-pollicis-brevis concept maps a superficial-head representation and has conflicting side labels; it is quarantined rather than advertised as complete.

Quarantined source concepts: left/right flexor pollicis brevis and middle pharyngeal constrictor have side labels conflicting with mesh-coordinate laterality. They remain unavailable with explicit reasons. The importer never silently swaps labels. Source-supplied `M` element meshes and mirrored source subject anatomy are retained as published; they are not independently acquired bilateral scans. Some pelvic concepts contain several source components; their subject/sex and clinical suitability require expert review.

## Alignment and geometry

The skeleton is fixed. The muscle pipeline uses exactly the existing proper rotation and unit conversion `[x/1000, z/1000, -y/1000]`, with identity runtime transforms. It compares vertex/face-line hashes of 29 reference meshes across the official IS-A/PART-OF archives, covering skull, mandible, hyoid, vertebrae, ribs/sternum, pelvis/sacrum, clavicles, scapulae, upper/lower limb bones, hands and feet. Those geometry hashes match exactly; differing archive headers are excluded from this comparison. Original fixed-reference file checksums are checked first. Results are in `muscle-alignment.json`.

This verifies the shared subject/coordinate frame, not every anatomical attachment or absence of source-model intersections. No bones were translated, rotated, resized, duplicated, regenerated or fitted to soft tissue. Source bounds, finite positions/normals, index ranges, triangles, unique canonical/source ownership, source-file references, laterality and full GLB mappings are validated. Lossless Meshopt round-trip checks preserve all generated Float32 attributes and indices exactly. No textures are included.

Runtime GLB: 41,167,792 bytes (37,649,825 gzip), 2,387,524 triangles, 355 selectable meshes. This is a substantial desktop-oriented asset; see performance notes. Raw models remain out of Git. Technical validation does not constitute medical review.

## Additional asset acquisition / remaining blocker

The official Z-Anatomy `MuscularSystem100.fbx` was inspected as a potential gap closer, together with its matching `SkeletalSystem100.fbx`. Source commit: `4ef7d59f4a2cc002f65ebd2bbb395ae4df3a5faf`, [publisher's model directory](https://github.com/LluisV/Z-Anatomy/tree/PC-Version/Resources/Models). The model-specific license requires CC BY-SA 4.0 attribution/share-alike and lists unrelated kidney/inner-ear noncommercial exceptions. Those unrelated subassets were not imported. No blanket claim of uniform repository licensing is made.

Muscle names indicate additional facial, abdominal and other candidate geometry. However, 18 exact-vertex bone-bound comparisons show differing offsets and extents after the documented FBX world transforms and centimetre conversion. A simple origin shift cannot establish accurate registration. The candidate is **not accepted into the runtime**; hashes and comparisons are in `z-anatomy-candidate-audit.json`, reproducible with `audit-z-registration.mjs`. This bounds audit is not a fitted-registration residual and does not prove that a carefully validated registration is impossible.

To close the milestone: obtain medically reviewed missing geometry in the fixed BodyParts3D frame, or complete a landmark/surface registration and per-asset license audit for a candidate such as Z-Anatomy. Review source side conflicts, grouped-member separation, sex-specific pelvic variants, full inventory granularity and RO terminology. Do not approximate missing muscles, reshape bones, or hide these gaps behind a completion label.
