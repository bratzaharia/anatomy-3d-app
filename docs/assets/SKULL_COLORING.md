# Skull palette and independent picking — 2026-10-28

## Scope and provenance

User requested the supplied reference-image palette with 30% less saturation,
20% darker bone-local hover, and individual skull-bone selection. The images are
used only as color references; they are not imported textures or anatomical data.
Colors are educational labels, not physiological pigmentation. Paired bones use
the same family color; the mandible, absent from the images, stays muted ivory.

Identity and source ownership come from the existing [BodyParts3D 4.0 release](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/),
under its existing CC BY 4.0 provenance/attribution. No new geometry or third-party
asset is introduced. Medical and Romanian terminology review remains pending.

## Boundary audit and geometry integrity

`tools/anatomy-assets/derive-skull-color-ranges.mjs` verifies original source OBJ
checksums and compares every converted position and triangulated index against
the existing Meshopt-decoded skull. It derives 21 contiguous, exhaustive source
bone ranges: 72,676 vertices and 121,518 triangles. Supplemental ranges include
source FMA IDs, original positions/index hashes, normal hash and computed bounds.
Tests independently verify those ranges against the unchanged GLB, without
needing cached OBJ files. Every triangle stays entirely within its source range.

Skeletal GLB SHA-256 remains
`126268604b056cdd8878c6297f6a8e90ae5cbf4cdce1cc7f952988d13bc68531`;
skeletal source manifest remains
`cd1be45dcbf22e7bb091951213129c1bce92f65e41c442f18b0e49f5344aa8f4`.
The original position, index and normal BufferAttributes are shared by lightweight
draw-range views; they are not copied or edited. No rebaking, decimation, spatial
transform, re-registration, new surface, or guessed boundary is used.

## Interaction and appearance

- 21 stable `skull-fma…` child IDs supplement the original `skull` aggregate;
  the existing `mandible` ID is retained. All 22 have RO/EN and Latin names,
  source provenance, a skull-bones group, search, inspector, focus and selection.
- The parent skull still means “without mandible.” Parent hide/isolation applies
  to its children; individual overrides affect only that source bone. Hidden
  geometry uses the existing non-raycasting handler. Indexed draw-range raycasts
  cannot select a triangle belonging to another source bone.
- HSV saturation is multiplied by 0.7 in sRGB. Hover RGB is multiplied by 0.8
  in sRGB before conversion to the renderer's linear working space. Rounding
  to an 8-bit palette and Three's transfer-function approximations are covered
  with an appropriate numerical tolerance. Opacity stays 1, roughness 0.7 and
  metalness 0. Selection retains the bone's own hue with a subtle persistent cue.
- All non-skull materials, muscular assets/renderer, lighting and whole-body
  camera framing remain unchanged. Camera focus additionally recognizes the
  audited individual bone bounds.

## Resources and regression checks

Independent picking uses 21 draw-range meshes instead of one aggregate skull:
whole-body skeletal calls increase from 30 to 50 (including the shared grid),
combined calls from 385 to 405. Triangle counts remain 513,166 skeletal / 2,900,690
combined including the grid. Geometry wrappers share original GPU buffers;
materials are allocated once per mounted viewer and disposed on unmount.
There is no new frame loop, network model request, texture or geometry payload.
The performance test checks idle demand-rendering and repeated-toggle stability;
software-renderer results are not a real-device FPS guarantee.

The separate left-panel bug was reproduced before the fix: closing navigation
placed the canvas in the zero-width grid column. Explicit column/row placement
keeps the viewport in the center while either panel is conditionally unmounted.
The regression test covers closing/reopening both panels; the existing tablet
test covers the drawer layout.

Unit tests cover source partitions, original buffer identity, per-range raycasts,
palette arithmetic, opacity, ancestor visibility and localization. Browser tests
cover real frontal/zygomatic picking, local hover snapshots, hiding/non-picking,
isolation, focus, RO/EN, color restoration, asset caching and panel visibility.
Full-body golden images are intentionally updated only for the skull palette.

The explicit authorized renderer baseline is recorded in
`skeleton-regression-baseline.json`; it does not silently redefine the immutable
GLB/manifest baseline used by muscular alignment validation.

## Executed verification

28 unit/component tests and all 9 Chromium browser tests passed. Lint,
formatting, TypeScript, production build, anatomy and RO/EN validators passed.
The build retains its existing large-chunk warning. Desktop panel collapse and
the user's 696 × 853 drawer scenario both preserve a visible, rendered model.

Chromium 156 / SwiftShader, 1440 × 960, DPR 1: measured 50 skeletal / 405 combined
draw calls, unchanged triangle counts and camera, one texture, zero idle frames
over one second, and stable geometry counts after toggling. Scripted combined
orbit measured about 1.32 rendered FPS, consistent with the existing slow
software-renderer limitation; no real-device smoothness claim is made. Both GLBs
are fetched once in the layer/cache regression test. The muscular GLB remains
`63b531f7c2734c794626d3e36ea3a57e440115fb6f5cf89d936a5876c629fef3`.

Manual atlas verification confirmed the softened palette, individual frontal
selection and inspector, focus, and visibility with navigation collapsed. See
`skull-colored-preview.png` for the captured result.
