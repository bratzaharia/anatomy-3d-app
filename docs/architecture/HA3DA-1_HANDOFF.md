# HA3DA-1 — partial nervous layer handoff

## Delivered scope

An independent, explicitly partial nervous layer is integrated into the existing
React/Three atlas. It shares canonical IDs, the camera and the central visibility
resolver, but does not modify existing skeletal/muscular geometry, transforms,
skull modes, colors, surface materials or lighting. The protected-file validator
checks 14 exact baseline hashes.

There are 318 inventory entries plus one virtual brain navigation entity:
83 independently mapped entities, 91 source meshes, 235 entries without approved
geometry. Available source surfaces are head-level CNS parts, some cranial
nerves/branches and two ciliary ganglia. Individual mapping does **not** certify
complete course, boundary accuracy or independent medical approval.

The UI supports bilingual search, structural/functional/regional facets,
hover/select/focus/hide/isolate, source-aware inspector details, explicit gaps,
lazy loading, error/retry and cached warm toggles. All is derived from all three
available systems. Nervous overlap never duplicates anatomy identity or geometry.

## Why the layer initially looked invisible

The user had both skeletal and nervous checkboxes enabled. The imported head
surfaces were physically occluded by the opaque cranium, and there was no
full-body peripheral geometry below the head. This was verified in the actual
local browser, not assumed to be a cache problem.

The localized **Vezi stratul nervos / Show nervous layer** viewport action now
temporarily reveals all mapped nervous entities and focuses the brain. It
preserves global layer checkboxes and snapshots prior hide/isolate overrides
and nervous-only facets. The adjacent restore action returns that exact context.
No existing layer is automatically made translucent, disabled or deformed.

## Remaining blockers to a complete system

- Spinal cord source FJ1737 has conflicting tissue/cavity identities and is
  quarantined, not rendered as a cord. No invented substitute is supplied.
- All 31 paired spinal nerves, roots, conus, cauda equina, full peripheral
  plexuses and most autonomic geometry still need compatible licensed assets.
- Most complete cranial nerve courses are not available; available branches do
  not count as their unavailable parent nerve.
- The small cited branch graph is not a full root/trunk/division/cord graph or
  an innervation/connectome database. Additional sourced inventory is needed.
- Independent medical and Romanian terminology review remain required.
- Higher resolution and real-device/mobile profiling require separate evidence.

Recommendation: retain this as a partial educational branch, not a completed
full-body nervous milestone. Next acquire/audit a licensed dataset with per-nerve
identities and proven registration to the fixed skeleton. Reject ambiguous
licenses or incompatible subjects; do not alter existing bones to force a fit.

## Verification

`pnpm test`, `pnpm lint`, `pnpm format:check`, `pnpm typecheck`,
`pnpm validate:anatomy`, `pnpm validate:i18n`, `pnpm build`, and
`pnpm test:e2e` are the delivery checks. The build retains the pre-existing
large-chunk warning; no new package dependency was added.

Final verification on 2026-10-29: **59 unit/component tests and 18 Chromium
browser tests passed**; types, lint, formatting, anatomy/i18n validators and
production build passed. No prior image golden was updated. These are technical
checks, not independent medical approval.

See [asset/license audit](../assets/NERVOUS_AUDIT.md),
[generated coverage](../assets/NERVOUS_COVERAGE.md),
[architecture](NERVOUS_LAYER.md) and
[measured performance](../performance/NERVOUS_LAYER.md).

## Changed-file map

- Domain: `packages/anatomy-core/src/index.ts` (nervous types/facets/graph).
- Data: `packages/anatomy-data/src/{index.ts,nervous.ts,nervous-manifest.json}`;
  `nervous.test.ts`; existing `muscles.test.ts` and `skeleton.test.ts` only
  updated for the newly available third system.
- New renderer: `apps/web/src/scene/{NervousLayer.tsx,nervousPicking.ts}`.
  Shared `AnatomyCanvas.tsx` adds the layer and focus-bound lookup;
  `SceneDiagnostics.tsx` adds opt-in nervous counters.
- New UI: `apps/web/src/components/{NervousExplorer.tsx,NervousDetails.tsx,
NervousExplorer.test.tsx}`. Shared `LeftPanel.tsx`, `LeftPanel.test.tsx`,
  `Inspector.tsx`, `ViewerOverlay.tsx`, `localization/i18n.ts`,
  `store/viewerStore.ts`, `store/viewerStore.test.ts` and `styles/index.css`
  register and exercise the additive layer.
- Browser tests: `apps/web/e2e/nervous.spec.ts` and its new brain snapshot;
  `muscles.spec.ts` now correctly treats All as three systems while retaining
  its original two-system regression scenario.
- Independent importer/audit: `tools/anatomy-assets/{nervous-definition.mjs,
import-nervous.mjs,validate-nervous.ts}`; `package.json` appends the validator.
- New assets: `apps/web/public/models/bodyparts3d-nervous.glb` and its attribution.
- Documentation: this handoff, nervous architecture/performance/audit/coverage,
  `docs/assets/{nervous-alignment.json,nervous-regression-baseline.json,
ATTRIBUTION.md,LICENSE_MATRIX.md}`, `docs/roadmap/ROADMAP.md`, `README.md`,
  and the additive nervous-preservation rule in `AGENTS.md`.

The skeletal/muscular importers, original assets/manifests, `SkeletonModel.tsx`,
`MuscleLayer.tsx`, skull helpers/materials and all prior image goldens are
unchanged. Hosting remains Vercel; no merge, production release or Cloudflare
migration is included in this branch delivery.
