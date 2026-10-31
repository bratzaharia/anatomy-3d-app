# Arterial implementation report

Branch: `feat/layer-05-complete-arterial-system` based on the saved cardiac module.
Local preview: `http://127.0.0.1:5175/`. Existing 5173/5180 worktrees are untouched.
No production deployment, PR/merge, paid purchase or new external communication.

## IMPLEMENTED

- Fifth independent primary system, localized compact three-mode right panel.
- 212 new source records plus 7 canonical cardiac arteries reused once:
  214 individual identities, 5 source sets, 23 explicit missing target families.
- Independent filters/detail/laterality, indeterminate group selection,
  multiselect, reversible per-ID colors, opacity, focus, hiding and isolation.
- Cited partial origin/distal tracing, including left MCA M1 and side-specific
  radial pathways. No guessed graph continuation or perfusion painting.
- Regional loading, recoverable per-packet errors, source/license attribution,
  stable-ID search, zero-opacity/no-hidden picking and preserved older layers.
- Independent importer, pinned source metadata, exact duplicate detection,
  source alias evidence, Meshopt GLBs, protected-baseline validation and machine-
  readable coverage. No previous importer or source GLB is rebuilt.

## PARTIALLY IMPLEMENTED

The available source spans the head, trunk, renal/pelvic regions and limbs, but
not every named artery. The branching graph is deliberately smaller than the
geometry inventory. Regional detail packets are progressive loading, not a full
multi-LOD pyramid. Natural mode uses restrained conventional material colors,
not tissue photographs. Pulmonary sets are not individual segmental vessels.

## BLOCKED / PENDING DATA AND MEDICAL REVIEW

Complete vessel denominator and terminology editorial review; face/external
carotid, spinal, pelvic, coronary and distal branches; individual pulmonary
branch mapping; female anatomy; alternate variants; territory-to-brain/organ
registration; measured lumen/wall/centerline data; expert anatomical review.
No whole-body completion percentage or clinical validation is asserted.

## Verification

137 unit/component/domain tests pass. Typecheck, lint, formatting, all source/GLB
validators, RO/EN validation for 1,741 catalog entries and production build pass.
All five arterial E2E scenarios pass, including the 32 global primary-layer
combinations. The complete existing/new suite reports **39/40 passed** in 5.3
minutes. The single failure is the old `skull-mode-cards.png` text screenshot:
2,084 different pixels (5%), concentrated in glyphs; the 3D skull snapshots and
geometry/cache/hover tests pass. No skull/card code, font rule or golden image
was changed. This visual-baseline discrepancy remains unresolved; the full suite
must not be reported all-green or used as an automatic production-merge gate.

Thirty old model/manifest/attribution files are protected, including the shared
cardiac arterial GLB. The baseline's added direct cardiac-artery check was
verified against `git show a3561a9:<path>`, not accepted from arbitrary local
contents. Source review is not medical approval. All 219 mapped geometric records
are selectable (100% of this available subset); no percentage of the full human
arterial system is claimed because missing families are not a vessel denominator.

The partial cited graph contains 67 relationships. Origin cycles fail validation;
explicit collateral/anastomotic cycles are allowed, and tracing is bounded.
During live development an intermediate schema/asset HMR mismatch was resolved
by the final source import and reload; fresh production-build browser tests pass.

## Main files

New: core arterial contract; data manifest/registry/tests; arterial store/tests;
renderer/material/picking modules; localized explorer/details/component tests;
ten GLBs and attribution; importer/definition/validator/coverage generator;
five-scenario browser test and these reports.

Modified integration points: canonical catalog/asset/system/coverage registries,
viewer state, inspector/camera/overlay/diagnostics, cardiac render ownership and
loading-status UI, scoped styles, package scripts and old four-layer test
expectations. No geometric buffer of an older layer changed.

## Adding a future asset

Obtain explicit web/mobile/runtime redistribution rights and source identity;
audit the actual file; map stable IDs and exclude shared-source duplicates;
record units, orientation, transform and landmark error; quarantine poor fits;
retain source hashes and version. Extend definitions/graph only with evidence,
import independently, run all validators/tests/build and review screenshots.
FBX/medical imaging/centerline adapters are not implemented by this OBJ importer;
use audited offline preprocessing without sending patient data publicly.
