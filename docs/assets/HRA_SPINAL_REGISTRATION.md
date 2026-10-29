# HRA spinal stage — source-only candidate, NOT viewer integration

Decision: **QUARANTINE_PENDING_ANATOMICAL_REVIEW**. This branch implements the
first technical stage of spinal registration and source inventory. It does not
claim to complete the nervous system, reduce the 163 runtime gaps, or make the
31 spinal nerve pairs available in the viewer. No existing runtime anatomy,
skeletal/muscular transforms, skull materials, lights, camera or labels change.

## What is implemented

1. Reproducible extraction of closed inner contours from real vertebral mesh
   sections, rejecting open/branched chains rather than inventing closing edges.
2. 22 HRA-to-fixed-atlas geometric correspondences. Median observed hole
   centroids are used; superior C1 uses the highest observed sections. The target
   C2 and L1 meshes have no accepted closed contour at the sampled planes, so
   those correspondences remain unresolved, not fabricated.
3. Source-only monotone piecewise coordinate transfer of all **8,993 original
   cord vertices / 16,358 triangles / 30 source segments**. Transverse dimensions
   are preserved, normals recomputed and original source topology retained.
4. An explicit candidate boundary policy: constant displacement outside measured
   coverage, up to a **3 mm engineering limit**, preserving the existing source
   shape without extrapolating a new anatomical curve. 295 vertices use this
   policy, maximum distance **2.121 mm**. Strict transfer without that policy
   refuses these vertices. This is not a medical acceptance threshold.
5. A quarantined [GLB review artifact](candidates/hra-spinal-cord-UNREVIEWED.glb)
   outside `apps/web/public` and the runtime registry. Its IDs are deliberately
   not available catalog identities: they derive from the pinned source UBERON
   identifiers, not mesh names or segment order. The machine report records each
   source identity. Reuse requires review, not just copying it.
6. Actual SPARC EXF semantic membership audit: **31 source pairs / 62 canonical
   lateral identities / 16,120 disjoint source volume cells**, including source
   labels for dorsal roots, ventral roots, DRG and spinal trunks. See
   [the per-pair table](SPINAL_SOURCE_PAIRS.md). Parts can overlap semantically
   (for example ganglia within a root group); their counts must not be summed or
   rendered as duplicate anatomy. No Hermite volume is flattened into an invented
   polyline/triangle surface, and estimated research paths do not count as
   verified anatomy.

## Measurements and unresolved gates

| Screen                                 | Result                               | What it does NOT establish                                                                           |
| -------------------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| Accepted canal-centroid proxies        | 22 of 24 named vertebrae             | Clinically annotated canal axes or nerve/foramen exits                                               |
| Interior leave-one-proxy-out RMS       | 2.885 mm (20 interior cases)         | Accuracy of every cord surface or clinical registration; endpoint holdouts are explicitly unmeasured |
| Untransformed candidate vertices       | 0 with recorded boundary policy      | That boundary transfer is anatomically approved                                                      |
| Vertex-in-solid bone screen            | 39 possible hits: C5 6, T4 20, T5 13 | Definitive collisions or a full triangle/clearance analysis; open/reduced meshes affect parity       |
| Cranial junction bounding-envelope gap | 0 mm                                 | True tissue continuity with medulla; overlapping boxes are not a verified junction                   |
| Anatomical/clinical review             | Pending                              | Medical approval or a clinically usable atlas                                                        |

The old 14.65 mm RMS / 35.95 mm maximum measured general vertebral bounding-box
centers under a sagittal similarity. The new 2.885 mm is a different,
leave-one-out **canal-proxy** measure; these must not be advertised as directly
comparable clinical improvements. The 39 hits are kept visible as blocking
evidence, not removed by shrinking the cord to force a pass.

### Required before any runtime promotion

- Review geometric inner-contour choices, especially sparse C1 observations and
  missing C2/L1 target sections, with an anatomist.
- Perform complete surface intersection/clearance checks, accounting for source
  mesh solidity, and resolve flagged regions without editing the fixed bones.
- Annotate the cranial junction and conus using anatomical landmarks; envelope
  overlap alone cannot validate continuity.
- Review the boundary policy, segment identity, orientation and source variation.
- Keep source-estimated SPARC reconstruction separate from verified surfaces;
  validate its basis, units, orientation, roots, ganglia and segment exits first.
- Then add reviewed canonical runtime mappings in a separate intentional change.
  Thirty cord segments are not 31 paired spinal nerves.

## Sources, licenses and provenance

HRA: [NIH 3DPX-021018 v1](https://3d.nih.gov/entries/3DPX-021018?version=1),
Human Reference Atlas / HuBMAP Consortium, based on Visible Human Male data from
the U.S. National Library of Medicine. The source and vertebrae are pinned to
`f1a3a63f110e27ff0736047d52d04dba5d3087f9` in the official reference library.
The [pinned CC BY 4.0 license](https://github.com/hubmapconsortium/ccf-3d-reference-object-library/blob/f1a3a63f110e27ff0736047d52d04dba5d3087f9/LICENSE)
and both source files are SHA-256 checked before processing. Attribution,
license/source links, adaptation notice and non-endorsement are retained in the
[candidate notice](candidates/README.md), GLB metadata and machine report. BY 4.0
allows redistribution and adaptation with its attribution/notice conditions;
there is no additional NC source embedded in this HRA candidate.

SPARC: [dataset 307](https://discover.pennsieve.io/datasets/307), version 8,
DOI [10.26275/bbvg-gj86](https://doi.org/10.26275/bbvg-gj86), CC BY 4.0. The
dataset contributors' original research model is credited through that dataset
citation. The EXF and publisher README hashes are checked. The publisher
describes estimated nerve fiducials and a non-subject-specific scaffold. Only
derived group membership/range metadata is distributed here, not estimated
neural surfaces. No claim of source-author endorsement is made.

## Reproduction and verification

```sh
node tools/anatomy-assets/acquire-fixed-references.mjs
node tools/anatomy-assets/acquire-nervous-sources.mjs --hra --sparc
node --import tsx tools/anatomy-assets/register-hra-spinal.mjs
node --import tsx tools/anatomy-assets/audit-spinal-source-pairs.mjs
pnpm validate:spinal-candidates
```

The two processing commands read the ignored source cache and write only this
stage's reports and quarantined candidate. They never run an older importer.
The committed candidate validator also works in a clean CI checkout without the
source cache: it decodes the candidate, verifies its hash/topology, provenance,
unregistered IDs, research flags, disjoint source membership and all 14 protected
reference hashes. `pnpm validate:anatomy` includes it automatically.

Unit tests cover triangle-mesh contour extraction versus open-chain rejection (using
synthetic test fixtures, never runtime anatomy), interior
screening, monotone transfer and strict/limited boundary behavior, EXF dimension
separation, bounded ranges, unique left/right ownership and explicit non-runtime
flags. Existing browser regression tests are run without refreshing golden
images. Runtime geometry/material/draw counts, localization and loading behavior
are unchanged; no extra frame loop, renderer subscription or model request is
introduced. The offline candidate is 30 source meshes, has no textures and uses
lossless Meshopt compression. Existing runtime LOD work remains a separate task.

### Local verification on 2026-10-29

- Passed: typecheck, lint, formatting, 71 unit/component tests, anatomy validators
  including candidate decode/identity checks, RO/EN validation and production
  build. The build retains the existing large-chunk warning.
- Full Chromium E2E: 22 passed, 1 failed. The failure is the existing
  `skull-mode-cards.png` comparison in `skull-modes.spec.ts:133`: 2,084 pixels
  (5%) differ locally. The isolated rerun reproduces it. Application sources,
  browser tests/configuration and expected screenshots are byte-identical to
  base `4286ee887db3f1491f791ee3fd2a2b5a7e0ad457`; none are changed here. No
  golden images are refreshed to conceal this local baseline discrepancy.
- All 14 protected skeletal/muscular/skull reference hashes are unchanged. The
  runtime remains at 302 active neural entities with 163 unavailable entries.

Recommendation: **Draft PR for technical/anatomical review, not production
promotion of the spinal candidate.**
