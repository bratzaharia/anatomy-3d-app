# Skull palette and independent picking — 2026-10-28

## Scope and provenance

Latest request: reference-directed natural bone and saturated segmentation colors
with self-shadows. This supersedes the preceding pastel values. Current rendering,
costs and fidelity limitations are documented in `SKULL_RENDERING.md`; the source
boundary audit and interaction contracts below remain valid.

The preceding pastel milestone superseded the earlier saturated reference-image palette:
22 unique, harmonious muted ivory, beige, sand, sage, dusty blue-gray and pale
terracotta tones now live in `skullBoneColors.ts`, keyed by unchanged FMA IDs.
Paired bones use tiny tonal differences. Colored is optional; Simple is the
neutral default. No reference image is imported as a texture or anatomical data.
Colors are educational labels, not physiological pigmentation. See
`docs/architecture/SKULL_VIEW_MODES.md` for the additive three-mode selector.

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
- The centralized palette uses low-saturation, light bone-inspired sRGB colors.
  Hover multiplies final display
  RGB by 0.75 **after** tone mapping, output colorspace and dithering, so lighting
  cannot wash out the intended 25% visible darkening. Both normal and selected
  bones have their own hover variant; selected-hovered takes priority over
  selected. Moving away restores the previous base/selected material. Selection
  keeps its prior hue and persistent cue. Simple/Colored opacity stays 1,
  roughness 0.7 and metalness 0. The optional radiographic style uses separate
  translucent materials. Non-skull material priority is unchanged.
- All non-skull materials, muscular assets/renderer, lighting and whole-body
  camera framing remain unchanged. Camera focus additionally recognizes the
  audited individual bone bounds.

## Resources and regression checks

Independent picking uses 21 draw-range meshes instead of one aggregate skull:
whole-body skeletal calls increase from 30 to 50 (including the shared grid),
combined calls from 385 to 405. Triangle counts remain 513,166 skeletal / 2,900,690
combined including the grid. Geometry wrappers share original GPU buffers;
materials are allocated once per mounted viewer and disposed on unmount.
The hover correction adds one selected-hovered material per skull bone (22),
not a mesh, draw call, texture, postprocessing pass or frame loop. Both hover
variants use the same deterministic shader-program cache key.
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

The initial palette milestone passed 28 unit/component and 9 Chromium browser
tests. The selected-hover correction adds a state-priority/shader unit test and
a screenshot-pixel browser regression. Before correction, frontal hover ratios
were `[0.9324, 0.9328, 0.7648]` (RGB); on a selected frontal they were `[1, 1, 1]`.
After correction, unselected ratios were `[0.7502, 0.7511, 0.7498]`, selected
`[0.7489, 0.7496, 0.7500]`: approximately 25% darker in every displayed channel.
Another bone's sampled pixels remain unchanged, hover-out restores the previous
pixels exactly, and rendering stops while idle. No asset or spatial data changed.

After the correction, all 29 unit/component and 10 Chromium browser tests passed,
as did lint, formatting, TypeScript, production build, anatomy and RO/EN validators.
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
The corrected selected-bone hover is captured in `skull-hover-preview.png`.
