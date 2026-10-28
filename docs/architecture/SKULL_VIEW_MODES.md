# Optional skull visualization modes

## Product and integration

The existing right inspector has an **Oase / Bones** section with three square,
single-select preview cards. It appears for the skull aggregate, its individual
children, mandible, or head context with no selection. Unrelated bones and muscles
do not show it. No global toolbar, separate viewer, or new anatomy hierarchy was
introduced. Existing groups/actions remain available below the cards.

The native radio group supports Tab, Space and arrow keys, localized names and
descriptions, focus-visible and checked states. The responsive grid uses two
columns in the existing inspector, one at very narrow widths, and three if the
panel is later widened. Both card and SVG preview are square.

## Registry and state

- `packages/anatomy-data/src/skullVisualizationModes.ts` defines stable IDs,
  RO/EN names/descriptions, preview IDs, implemented status, primary category and
  renderer-independent appearance profiles. The package index exports it; i18n
  validation includes every mode's name and description.
- `apps/web/src/store/viewerStore.ts` owns one `skullViewMode` value, default
  `simple`. Unknown or unimplemented IDs are rejected. State is session-only:
  refreshing starts Simple, while locale/selection/filter/panel changes retain
  the current choice. Mode changes do not issue camera commands, reset selection
  or touch any layer/visibility state. Stale hover is cleared.
- Primary modes are mutually exclusive. Future labels/suture overlays must have
  a separate registry/selection set; they must not be combined as primary modes.
  No unavailable/future cards are shown in this milestone. Adding CT, sections or
  pathology would require real rendering/data work, not just relabeling a card.

## Preview handling

`apps/web/src/components/SkullVisualizationModes.tsx` contains reusable cards and
original code-native SVG thumbnails. These are deliberately schematic design
previews, with localized “Stylized preview” accessible labels, not screenshots or
clinical segmentation. All share the same silhouette; only the style changes.
There are no external image requests, licensed third-party image downloads, or
additional WebGL canvases. Their original paths are UI art, not model boundaries.

## Rendering

The subsequent reference/realism milestone supersedes the material values in the
original milestone table below: Simple now uses `#c7c3ba` / roughness 0.54;
Colored uses the reference segmentation palette / roughness 0.62. Both gain
skull-only surface shading and cached self-shadows. See
`docs/assets/SKULL_RENDERING.md` for the exact implementation, costs and limits.

| ID        | Behavior                                                                                                                                                                                                                                        |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `simple`  | Shared neutral `#e5d8b8` opaque, roughness 0.7, nonmetallic bone shading. Default.                                                                                                                                                              |
| `colored` | 22 separately configured muted pastels in `skullBoneColors.ts`; paired bones differ slightly. Opaque.                                                                                                                                           |
| `xray`    | Shared bluish monochrome translucent standard materials, base opacity 0.28, emissive 0.35, no depth writes, front faces. Selected opacity 0.44 provides a persistent cue. Educational simulation, explicitly not clinical imaging or diagnosis. |

`apps/web/src/scene/skullMaterials.ts` preallocates 24 material sets: 22 colored,
one shared neutral and one shared radiographic. Each has base, hovered, selected,
selected-hovered states (96 materials, disposed once by the owner). Compared to
the previous corrected-hover milestone, neutral/X-ray add eight materials, not
extra meshes, buffers, textures, lights, postprocessing passes or frame loops.
Hover remains the final-display RGB multiplier of 0.75, including selected bones.
Translucency blends with the background, so X-ray screen pixels need not have an
exact 0.75 ratio; hover still affects only the pointed bone.

The memoized skull renderer subscribes to the mode and changes material props on
the **same** meshes. Other bones keep their original materials. Skull IDs,
source ranges, normals, transforms, camera, geometry, muscular renderer and both
GLBs remain unchanged. The neutral/X-ray schemes reuse a material set across
all skull entities. Visibility/raycast resolution remains canonical-ID based.

## Files and verification

Created: registry, `SkullVisualizationModes.tsx`, its component tests, and
`apps/web/e2e/skull-modes.spec.ts`. Modified: package exports, viewer store/tests,
inspector, localization, CSS, skull palette/material factory/renderer and tests,
i18n validator, skull-only golden images and the explicit authorized renderer
baseline. Existing colored/hover regressions now select optional Colored before
checking its appearance. Existing user changes from the prior hover fix remain.

Unit checks cover default/exclusive/invalid mode state, RO/EN/contextual cards,
palette coverage and low saturation, all four interactions, translucency, shared
materials and disposal. Browser checks cover all three actual renderings, native
keyboard selection, real bone raycasts in every mode, round-trip Simple pixels,
language, cached one-time geometry requests, stable camera/GPU geometry/call/
triangle/texture counts, idle demand rendering, and unrelated bone context.
The existing full-body, filter, retry, hide/isolate, panel and muscle regressions
are retained. Relevant lint, formatting, TypeScript, tests, anatomy/i18n validators
and production build are required before handoff.

Final execution: 34 unit/component tests and all 11 Chromium browser tests passed,
including the final run without snapshot updates. Typecheck, lint, formatting,
production build, anatomy and i18n validation passed. Each primary mode settles
to zero idle frames after its final interaction render. The integrated manual
preview is saved at `docs/assets/skull-modes-colored.png`.

Pixel comparison of the updated neutral-default full-body golden against the
previous checked-in golden (810 × 888 canvas) found 3,783 changed pixels, all
inside the skull rectangle x=374–434 / y=99–179. The rest of the body and scene
were pixel-identical. Both GLBs and the skeletal source manifest retain their
recorded SHA-256 hashes. Whole-body calls remain 50 skeletal / 405 combined;
triangle and texture counts remain unchanged. Square cards are checked at 1440px
and 975px viewport widths; actual mode changes are tested in all three styles.

## Limitations

The X-ray style is surface translucency, **not** volumetric attenuation, CT/MRI,
patient data or a clinically accurate radiograph. It keeps ordinary transparent
surface sorting and opaque non-skull structures, which can remain visible through
the skull. No exploded offsets, clipping planes, labels or medical pathology are
implemented. Existing independent medical/RO terminology review remains pending.

The established SwiftShader combined-layer frame rate remains slow (~1.3 FPS),
so a passing regression is not a real-device smoothness guarantee. No new FPS
claim is made. Production build retains the existing large-chunk warning.
