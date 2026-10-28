# Human Anatomy 3D Atlas

A bilingual (Romanian/English) interactive anatomy atlas with sourced **BodyParts3D 4.0** skeletal and muscular layers. The unchanged skeleton maps 202 source meshes to 29 selectable bones/groups. The additive muscular layer maps 417 source meshes to 329 individual entities and 26 explicit sets across the body. **Muscular coverage is incomplete:** inventory v1.0.0 exposes grouped-only members and missing geometry. Nerves and organs remain planned. Independent medical and Romanian terminology review remains pending.

## Quick start

Requires Node.js 22+ and pnpm 10.12.1.

```bash
pnpm install
pnpm dev
```

Open the printed local URL. Use `pnpm build`, `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm validate:anatomy`, and `pnpm validate:i18n` before review. `pnpm test:e2e` requires Playwright Chromium (`pnpm exec playwright install chromium`).

## Architecture

`@anatomy/core` owns renderer-independent types, visibility, hierarchy, groups, and localization lookup. `@anatomy/data` owns versioned catalogs, source references, and the asset manifest. `apps/web` owns React UI, Zustand state, and the React Three Fiber renderer. A mesh resolves to one canonical anatomy ID through `userData.anatomyId`; display names never identify geometry.

Layer filters are independent. “All” is derived from every currently available category; clicking it when checked clears every layer, producing an intentional empty state. Hidden objects have raycasting explicitly disabled. The loaded geometry remains cached when filters or language change. Camera fit and focus use the measured model bounds.

## Sourced geometry

BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International. See [source and audit](docs/assets/ASSET_SOURCES.md), [license matrix](docs/assets/LICENSE_MATRIX.md), and [attribution](docs/assets/ATTRIBUTION.md). The 7.13 MB GLB uses lossless Meshopt compression; no extra decimation or quantization was applied to the publisher's reduced-detail mesh release.

Rebuild from the official archive with `node tools/anatomy-assets/import-skeleton.mjs`; use `--offline` once its ignored source cache is populated. `pnpm validate:anatomy` verifies the asset checksum, decoded geometry, mappings, bounds, and triangle count. No external anatomy service is needed at runtime.

For muscles, use `node tools/anatomy-assets/import-muscles.mjs` (or `--offline`); do not rebuild the skeleton. The 41.17 MB muscular GLB loads on first enable and stays cached. Bones, muscles, both, and no layers are supported. The regional explorer/inspector offers full group lists, missing-member status, contextual hide/show/reveal, and muscle-only opacity. See [muscular architecture](docs/architecture/MUSCULAR_LAYER.md), [coverage](docs/assets/MUSCLE_COVERAGE.md), [audit and acquisition gaps](docs/assets/MUSCLE_AUDIT.md), and the machine-readable `packages/anatomy-data/src/muscle-manifest.json`.

## Adding content

1. Confirm terminology and relationships from a reputable cited source; add the stable entity to `packages/anatomy-data/src/index.ts`.
2. Supply curated RO/EN names and provenance. Run both validators.
3. Audit the asset-specific license with `.agents/skills/anatomy-asset-audit`.
4. Normalize and export a GLB without merging independently selectable structures.
5. Add the asset manifest entry and explicit mesh-to-anatomy mapping.
6. Add filter, selection, component, and critical-flow tests.

See `docs/` for the domain, renderer, asset, performance, and roadmap decisions. Repository skills describe repeatable feature, review, asset-audit, and performance workflows.

## CI and branch protection

CI runs frozen installation, types, lint, formatting, unit/component tests, anatomy and i18n validators, build, and Chromium smoke tests. In GitHub, configure branch protection manually to require `quality` and `e2e`; this repository does not claim remote settings were changed.
