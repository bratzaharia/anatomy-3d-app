# Coverage follow-up and individual bone interaction — 2026-10-29

Decision: accept the **source-exact interaction partition**, not new anatomy or
medical certification. Existing source geometry is unchanged. See the
[full three-system gap audit](SYSTEM_COVERAGE.md) for every unavailable entry.

## What was actually completed

- Added 157 stable FMA-derived bone identities inside the existing vertebral,
  ribs/sternum, hip, hand and foot groups: 24 + 25 + 2 + 54 + 52. The existing 21
  individual skull children and all original root IDs are preserved.
- Each child has RO/EN labels, editorial Latin, source concept/file references,
  exact triangle ranges and measured bounds. Selection, hover, focus, hide,
  parent hiding and isolation now operate on the original bone, not its entire
  group. `STRUCTURES` remains the 29-entry skeletal compatibility boundary.
- Added the absent coccyx and six auditory ossicles as **unavailable inventory
  identities**, never meshes. The defined conventional adult-bone scope contains
  199 mapped concepts and seven gaps. Teeth and accessory/variable bones are
  explicitly outside that scope; 202 source meshes are not 202 distinct bones.
- Added a localized, regional coverage explorer for bones, muscles and nerves.
  Individual mappings, source sets, grouped-only members and missing entries are
  counted separately. Missing entries can be inspected but cannot focus, isolate,
  hide or raycast nonexistent geometry. Quarantine/source-policy reasons are
  visible; unavailable inventory is not falsely credited as a distributed model.
- Fixed an importer substring bug: `axillary` matched `maxillary`. The two
  meningeal maxillary branches now belong to the head/cranial group. They and the
  bilateral maxillary nerves are packed in the cranial asset. All 247 Z-Anatomy
  surfaces retain bit-identical decoded positions, normals and indices compared
  with merged base `411c37c`; see [repack proof](NERVOUS_REPACK_AUDIT.json).

## Source integrity and rights

The skeleton and muscles are still the exact official BodyParts3D 4.0 GLBs and
source manifests. `derive-skeletal-parts.mjs` verifies original OBJ checksums and
compares every recovered position/index byte with the decoded existing GLB. It
does not run either original importer or edit original geometry. The normal
buffer is hash-protected. The committed validator repeats byte, topology,
coverage, bounds and canonical-ID checks without requiring the source cache.

The existing [BodyParts3D CC BY 4.0 distribution license](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html)
was rechecked for this audit. Attribution, source URL and original FMA/FJ IDs are
retained; the new partition is derived mapping metadata under the same terms.
Z-Anatomy repacking retains the pinned source, BY-SA 4.0 license, attribution and
third-party exclusions from the [neural audit](NERVOUS_AUDIT.md). No new external
geometry, textures or differently licensed subassets have been imported.

The skeletal renderer hash is intentionally advanced in both regression guards:
the old hash and reason are recorded. This is authorization for the new
interaction path, **not** a blanket baseline refresh. Skeletal/muscular GLB and
source-manifest hashes, skull geometry/modes/materials, camera/light settings and
anatomical transforms are unchanged. The camera only gains existing child bounds
as focus targets.

## Rendering and ownership

Seven lightweight geometry views share the original position, normal and index
attributes. Adjacent visible ranges with identical materials are coalesced: the
default skeleton still submits 49 meshes + grid, 513,164 source triangles + two
grid triangles. Highlighting can split a parent into a few draw groups, rather
than introducing 157 permanent mesh draws. Hidden ranges are omitted from the
same material-array groups Three.js uses for raycasting. Face-index lookup maps
back to stable concept IDs; display names never drive picking.

Only local geometry views/materials are disposed; cached GLTF resources are not
mutated. Subscriptions only change the relevant parent's selected/hovered value.
Rendering remains on demand; no new frame loop, model request, texture, bone
transform, skeletal/muscular asset decode or hidden proxy mesh is introduced.
Physical mobile-device performance remains unmeasured.

## Verification and remaining work

Unit/component tests cover coverage counts and reasons, complete partition
endpoints, invalid face IDs, coalesced groups, hidden face exclusion,
parent/child visibility, all seven parent groups, localization and regional
inventory filtering. The new browser test selects a real scaphoid surface by
hover/click, isolates precisely its original triangles, hides it and verifies
no subsequent hit. It also checks one model request, restored draw/triangle
counts, stable geometry allocations and no idle frames. A second browser flow
inspects real skeletal, muscular and neural gaps with disabled 3D actions.

No missing muscle or nerve was fabricated or silently activated. There remain
143 muscle gaps, 22 grouped-only hand members and 163 neural gaps. The HRA cord,
31-pair SPARC source, vestibulocochlear pair and license/registration-sensitive
skeletal candidates still require the documented source/anatomical reviews.
This branch closes interaction/visibility/reporting gaps; it does **not** claim
three anatomically complete systems.

Reproduce:

```sh
node tools/anatomy-assets/derive-skeletal-parts.mjs
node tools/anatomy-assets/import-z-nervous.mjs
node tools/anatomy-assets/audit-nervous-repack.mjs
node --import tsx tools/anatomy-assets/report-system-coverage.ts
pnpm validate:anatomy
pnpm test
pnpm test:e2e
```

Derivation/import need the already-audited ignored source cache. The repack proof
also needs the merged base commit in local Git history. Runtime validation and
CI need neither source downloads nor full history. Source/audit paths are
documented in [PIPELINE.md](PIPELINE.md).

### Executed local results

- Passed: typecheck, lint, formatting, **98 unit/component tests**, anatomy and
  RO/EN validators, production build. Existing large-chunk warning remains.
- Full Chromium browser suite after the accessibility fix: **24 passed / 1
  failed**. The remaining failure is the same pre-existing local
  `skull-mode-cards.png` comparison (2,084 pixels / 5%) documented before this
  branch. No existing browser test or golden image was altered to hide it.
  Source skull colors/hover, perspective, shadow and bone/muscle/neural image
  regressions all pass; all 25 browser cases were executed, not skipped.
- Actual source-triangle raycasts pass for each of the seven newly partitioned
  parent groups; clearing visible groups excludes their faces from raycasting.
- Measured at 1440 × 960 on Chromium SwiftShader software WebGL: skeleton
  **50 calls / 513,166 triangles including grid**, bones + muscles **405 calls /
  2,900,690 triangles**, all three **707 calls / 4,392,798 triangles**. Default
  draw counts and submitted geometry match the pre-partition baseline.
- One skeletal model request through pick/hide/isolate/restore/locale changes,
  stable geometry allocations, and zero idle frames in the measurement interval.
  The combined software-rendered orbit was approximately 0.81 rendered FPS;
  this is not a physical GPU/mobile performance guarantee. LOD and actual-device
  profiling remain necessary, separate work. No anatomy was decimated here.
- The new coverage UI screenshot was visually inspected; quarantine notices and
  disabled actions remain visible. The accessible select labels are separate
  from their option text, preserving existing layer controls on desktop/tablet.
