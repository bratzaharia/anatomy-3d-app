# Human Anatomy 3D Atlas

## Context

This repository is the foundation for a bilingual, medically responsible 3D anatomy education platform. The fixed BodyParts3D 4.0 skeleton has 202 source meshes mapped to 29 selectable structures/groups. An independent, incomplete muscular layer adds 355 selectable entities; gaps and review status are explicit in its inventory. Other systems are planned. Medical correctness, deterministic behavior, performance, and maintainability are the priorities, in that order.

## Repository map

- `packages/anatomy-core`: renderer-independent IDs, hierarchy, groups, selection, and filtering semantics.
- `packages/anatomy-data`: catalogs, translations, schemas, and asset manifests.
- `apps/web/src/scene`: React Three Fiber rendering and camera behavior.
- `apps/web/src/components`: localized web UI.
- `tools/anatomy-assets`: catalog and asset validation tools.
- `tools/anatomy-assets/skeleton-definition.mjs`: curated source bone concepts and translations; rebuild the GLB and manifest after changes.
- `tools/anatomy-assets/muscle-definition.mjs`: versioned muscular inventory and mappings; use the independent muscular importer. Never rebuild or edit the skeletal module to fit muscles. `STRUCTURES` remains skeletal-only; shared consumers use `ANATOMY_CATALOG`.
- `docs/assets`: provenance, licenses, and attribution.

## Commands

`pnpm install`, `pnpm dev`, `pnpm lint`, `pnpm format`, `pnpm format:check`, `pnpm typecheck`, `pnpm test`, `pnpm test:e2e`, `pnpm build`, `pnpm validate:anatomy`, `pnpm validate:i18n`.

## Non-negotiable rules

- Never invent medical data or present fixture geometry as medical anatomy.
- Anatomy identity uses stable IDs, never mesh names or display labels.
- Romanian and English remain complete for all visible content.
- Layer filters remain composable; hidden geometry is not raycast-selectable.
- Every asset requires verified source, license, and attribution metadata.
- Avoid permanent frame loops, resource leaks, unnecessary rerenders, `console.log`, and broad unrelated changes.
- Nervous integration is additive: never change skeletal/muscular geometry, skull modes or alignment to fit nerves. Preserve one shared scene/ID space; audit source trajectories, functional overlap and registration; report missing neural geometry explicitly. Do not rebuild older layers with the nervous importer.
- Reviews must check anatomical integrity, visibility/raycast behavior, asset licenses, localization, and 3D performance.

## Definition of done

Types, lint, formatting, relevant tests, validators, and production build pass. New UI is localized; new assets have provenance; performance implications and remaining medical-review risks are documented.
