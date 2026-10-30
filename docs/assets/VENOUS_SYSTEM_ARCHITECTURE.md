# Layer 04 — venous system architecture

Branch: `feat/layer-04-complete-venous-system`, based on coverage commit
`1a2b6df1b01b51f38d3a148f20064e25a701c223`. The name is a feature target, not a
claim that the delivered dataset is complete. No production deployment or paid
purchase is part of this change.

## Boundaries

- Core: `VenousStructure`, filters, cycle-safe drainage traversal and graph checks
  are renderer-independent. Canonical stable IDs, never display labels, drive
  selection and visibility.
- Data: a typed, validated venous manifest extends `ANATOMY_CATALOG`, groups,
  source-aware search and coverage. `STRUCTURES` remains skeletal-only.
- Import: the independent venous OBJ adapter acquires selected public archive
  members, validates identities, hashes, indices, normals and bounds, and emits
  losslessly compressed regional GLBs. It never runs old system importers.
- Scene: one independent suspense/error boundary per region. No initial venous
  download; regions excluded by venous filters are not requested. Local material
  ownership and loader-owned cached buffers are separate. No permanent frames.
- UI: independent global layer checkbox; right inspector controls for facets,
  opacity, four material modes, isolation, inventory and semantic tracing.

## Coordinate and preservation contract

All source positions use the same proper rotation as the fixed BodyParts3D
skeleton: `[x/1000, z/1000, -y/1000]`. The manifest records its column-major matrix.
Twenty-nine existing skeletal reference meshes have identical source vertex/face
hashes between publisher archives: technical RMS/max difference **0 mm**, not a
clinical vessel-registration measurement. No nonlinear fit, nonuniform scaling,
mirroring, artificial tubes, endpoint welding or previous-layer rebuild occurs.
`venous-protected-baseline.json` pins all 15 pre-existing runtime model/manifest
files checked by the independent validator.

## Filter and selection semantics

Global layers compose by union. Hidden overrides take precedence over isolation.
Venous group facets union within the facet; depth and region facets also union
internally and intersect across facets. No groups means no veins. Empty depth
or region filters mean unrestricted. Unknown depth is explicit, never inferred.
Zero opacity is invisible and non-raycastable. Shift/Ctrl/Cmd-click toggles
additional venous selections without resetting bone/muscle/neural settings.
Temporary whole-layer/path isolation restores captured overrides and venous
facets; global layer toggles remain the user's current choices.

Semantic edges are sourced **reference relationships, unreviewed**, not geometric
connections or flow simulation. The portal path passes through a non-rendered
hepatic microcirculation collection point; pulmonary paths terminate at the left
atrium. Semantic endpoints do not become fake selectable anatomical surfaces.
Variable or unsupported relationships are omitted rather than guessed.

## Hosting and extension

`VITE_VENOUS_ASSET_BASE_URL` optionally prefixes manifest-relative model paths.
The default is same-origin static files. No storage credentials, R2 account,
Cloudflare migration, production environment change or host-specific core schema
was introduced. A future asset host must allow CORS and the documented license.

The current production adapter is **OBJ-only**, not a generic FBX/GLB conversion
service. Future adapters must emit the same audited manifest contract. Multiple
LOD levels, automatic neighbor prefetch, contextual transparency of other layers,
flow arrows and true clinical endpoint-connectivity validation are **not yet
implemented**. Four display materials plus reversible isolate/trace actions are
available; no radiographic/ultrasound claim is made.
