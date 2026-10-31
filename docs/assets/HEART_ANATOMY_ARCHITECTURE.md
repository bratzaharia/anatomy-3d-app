# Cardiac organ module — source subset v0.1

Branch: `feat/heart-cardiac-venous-integration`, based on production squash
`8f10a2d`. This is **not a complete or medically approved heart**.

`heart-definition.mjs` → independent `import-heart.mjs` → three lossless Meshopt
GLBs + `heart-manifest.json` → typed domain registry → `CardiacAnatomyModule`.
No previous importer is invoked. Protected source assets and JSON manifests are
checked by `validate:heart`. Shared scene units/axes remain metres, right-handed,
with source conversion `[x/1000,z/1000,-y/1000]` and unchanged source positions.

Reimport: `pnpm import:heart` acquires pinned publisher metadata and exact OBJ
archive ranges into the ignored cache. `ANATOMY_SOURCE_CACHE` can point to an
existing source cache; `pnpm import:heart --offline` refuses missing inputs.
Reimports reject changed metadata/source hashes and validate the original
protected-file baseline before and after generation.

The organ is classified as `cardiac`; its artery parts remain `arterial`, never
`venous`. It is an independent, opt-in organ module, not a fifth primary layer.
The existing four primary-system checkboxes and their compositions are preserved.
Layer 04 exposes the controls; heart rendering can remain on with veins off.
The 17 related venous inventory identities reuse the existing renderer, canonical
IDs and GLBs. No venous triangles are copied into a cardiac asset.

Three packages: external walls/cavities, internal leaflets/papillary muscles,
arterial connections. Only packages with enabled visible source parts load.
Geometry stays loader-owned; material instances are owned and disposed locally.
Demand rendering remains in use, with no cardiac animation/frame loop.

Selection, groups, styles, opacity and clipping live in a dedicated store slice.
Visibility uses the central resolver, including ancestor hiding. Clipped,
hidden and zero-opacity parts cannot be raycast selected. Geometric sections are
uncapped model cuts, not clinical CT/MRI views or reconstructed tissue.

Natural, category colors and semantic-connection inspection are mutually exclusive
presentation modes. Materials are conventional colors without acquired tissue
textures; source boundaries are not painted approximately.

See [implementation status](HEART_IMPLEMENTATION_REPORT.md),
[geometry registry](HEART_COMPLETE_ANATOMICAL_REGISTRY.md) and
[medical gates](HEART_MEDICAL_VALIDATION.md).
