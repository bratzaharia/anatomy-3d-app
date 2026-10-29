# Additive nervous layer — HA3DA-1

The existing skeleton and muscles remain immutable references. Only shared
registration points are extended: the catalog/asset registry, global checkbox
store, scene mount, focus bounds, overlay and existing inspector. There is one
canvas, shared camera, shared coordinate space and canonical-ID selection store.
Protected source/material files are listed in `assets/nervous-regression-baseline.json`.

## Catalog versus geometry

The versioned nervous inventory is intentionally incomplete. It includes CNS
surfaces, twelve paired cranial nerve entries, 31 paired spinal nerve entries,
major plexus/peripheral/autonomic entries and associated structures. Every entry
has explicit source references, laterality, classification, review and geometry
status. Missing entries are searchable and inspectable but cannot be focused as
if geometry existed. The brain parent selects existing child surfaces, not a
duplicated whole-brain mesh. Display counts distinguish catalog entries from
independent 3D mappings. Serial nerves and bilateral rows are not percentages.

Navigation groups are not connectivity. `NervousConnection` stores separately
cited branch relationships, including metadata-only entities; it never creates
rendered paths or claims synaptic connections. No inferred muscle innervation is
added. New nerve root/tract/nucleus datasets can extend structure types without
changing bone or muscle identities.

## Filters and isolation

Global All is derived from all three available systems. All eight combinations,
including empty, use the original central visibility resolver. Per-nerve hidden
and isolated IDs compose with canonical parent visibility.

Nervous facets are OR within structural/function/region categories and AND across
categories. An empty structural set means no nervous geometry. Empty function or
region sets mean unrestricted. Only asserted functional memberships match a
restricted functional facet; unknown classifications are not guessed. CNS optic
nerves are not incorrectly forced into PNS. Associated cavities/coverings are
not neural tissue and currently have no independent meshes.

Nervous filters never change other global systems. Nervous isolation snapshots
existing hide/isolate overrides; restore returns those exact overrides, while
global system checkboxes remain untouched. The original bone/muscle isolation
semantics otherwise remain unchanged. Language switching preserves all stores.

Opaque bones/muscles can occlude the imported head structures. The viewport's
explicit **Show nervous layer** action reveals all mapped nervous entities,
focuses the available brain, and temporarily resets nervous-only facets. It
snapshots the prior hide/isolate overrides and nervous facets; **Restore previous
layers** restores those exact values. No global checkbox, bone opacity, muscle
opacity, skull mode, mesh or light is changed. Activation alone never hides
other systems automatically.

## Rendering and loading

`NervousLayer` mounts only on its first request, keeps the loader-owned cache and
geometry, and owns/disposes its four shared materials. CNS and PNS receive muted
educational colors under the unchanged lights. Hover/click use actual source
triangles, no arbitrary enlargement, no forced foreground rendering. Global
filters, facets and hide/isolate update visibility and exclude hidden raycasts.
Error/retry uses a separate boundary, so a missing nervous GLB does not replace
the skeleton or muscular layer.

One full-source head-level asset is currently small enough to load lazily as one
unit; no unmeasured LOD/BVH or empty regional chunks are introduced. Additional
compatible full-body/region assets must be audited and versioned before import.
Whole-body view honestly shows only the available head geometry, not invented
peripheral anatomy. Hosting remains Vercel; a configurable static asset origin is
separate from anatomy-domain logic.

## Remaining milestone work

The complete full-body milestone is **not achieved**. It still requires reviewed,
licensed, correctly registered spinal cord, roots, cauda equina, complete cranial
nerves, peripheral plexuses/branches and autonomic surfaces. Branch-level plexus
root/trunk/division/cord relationships and additional CNS/meningeal/ventricular
detail need further sourced inventories; no graph is fabricated to fill gaps.
