# Cardiac source license audit

Decision: accept the defined BodyParts3D 4.0 source subset as educational geometry,
not as medically approved anatomy. Checked 2026-10-30 against the
[publisher license](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html).
Its CC BY 4.0 notice covers access, redistribution and adaptations with attribution;
it does not warrant anatomical completeness. Older source-header notices do not
replace the current publisher notice. This is an engineering provenance record,
not legal advice.

Credit: BodyParts3D, © The Database Center for Life Science licensed under
CC Attribution 4.0 International. Embedded GLB copyright, distributed attribution
text and visible source link preserve this credit. Model and code licenses are
separate.

[FIPAT/IFAA terminology](https://ifaa.net/committees/anatomical-terminology-fipat/fipat-ifaa-terminologies/)
is the target nomenclature reference for expert normalization. No TA2 tables or
terminology dataset are imported or redistributed here. Published FIPAT document
terms are separate from BodyParts3D licensing; provisional translations and source
FMA cusp names are not presented as an approved TA2 concordance.

`heart-manifest.json` pins metadata/license/directory hashes, each OBJ file hash,
source geometry hash, derived GLB SHA-256, byte counts and exact FMA mappings.
Conversion: source component selection, proper rotation, mm → metres, regenerated
normals and lossless Meshopt encoding. No procedural replacement anatomy, smoothing,
new topology, duplicate veins or proprietary texture is introduced.

IS-A mappings are preferred for disjoint element ownership. PART-OF mappings are
used only for named source concepts absent from the IS-A concept table, e.g.
ascending aorta/pulmonary trunk. Source table and component list are explicit.
All OBJ elements come from the exact official IS-A 4.0 archive directory.

NIH-hosted cases, paid suppliers, imaging datasets and motion/texture candidates
are not approved by this license. Their exact asset terms, commercial delivery,
derivative rights and public repository permissions need separate acceptance.
