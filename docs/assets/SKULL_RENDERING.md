# Reference-directed skull shading — 2026-10-28

## Request and fidelity boundary

Simple follows the natural-bone reference; Colored follows the second image's
yellow frontal, golden parietals, green temporals, cyan zygomatics, blue sphenoid,
yellow-green maxillae, orange nasals and magenta/violet small facial bones. The
previous pastel values are superseded. These are educational segmentation colors,
not biological pigmentation. Both modes remain actual interactive 3D geometry.

The existing BodyParts3D mesh lacks the photographic scan's fine surface/teeth
detail. There is **no claim of 100% photographic or medical realism**. Matching
the first image exactly requires a higher-detail, reviewed, properly licensed
asset registered to the fixed skeleton. No replacement or acquisition occurred.

## Materials and real self-shadows

- `skullSurface.ts` adds skull-only standard-material shading. Indirect diffuse
  is multiplied by 0.20 in Simple / 0.15 in Colored so ambient lighting does not wash out cavities. The
  global lights' positions, targets, colors and intensities are unchanged.
- Simple uses light ivory `#e5e1d8`, roughness 0.50; Colored uses canonical FMA colors,
  roughness 0.62. Both remain opaque and nonmetallic.
- Original object-space value noise subtly modulates optical normals, roughness
  and albedo: nominal scale 0.625 mm, height 25 µm in Simple / 80 µm in Colored, faded with screen derivatives
  at a distance. This is **decorative procedural grain, not scanned anatomical
  pores or measured surface detail**. It does not change vertices or normal buffers.
  There are no imported bitmap textures, generated UVs, displaced geometry or
  false bone boundaries. Shader cache keys include the settings for safe hot reload.
- Hover still multiplies final display RGB by 0.75, including selected bones.
  X-ray skips the opaque surface/light-response changes.
- The final Simple-only finish reduces the yellow/blue lighting cast at conserved
  diffuse luminance, with finer micrograin and less mottling. Its shadow receiver
  uses 55% of the existing normal bias (82.5 µm rather than 150 µm), tightening
  real mesh contacts without changing the shadow light, target or caster geometry.
  No sutures, teeth, fissures or pores are drawn or reconstructed. The original
  selection tint and 25% display-space hover are retained. Colored and X-ray
  shader settings and screenshots remain unchanged.
- `skullShadow.ts` fits a 1024px PCF shadow-map light camera around existing skull
  and mandible bounds, using the original `[2,3,4]` key direction. Only opaque
  skull meshes cast/receive shadows. The viewer is still a perspective camera;
  the orthographic camera is only for light depth mapping.
- Shadow auto-updates are disabled. Mode/caster visibility changes dirty the
  cache; hover, selection and camera movement do not rebake it. The existing
  demand frame loop remains. The renderer/light owns and disposes the target.

## Actual cost and verification

Chromium 156 / SwiftShader, 1440 × 960, DPR 1, before/after measured:

| Metric                               |              Before |     After |
| ------------------------------------ | ------------------: | --------: |
| Main skeletal / combined calls       |            50 / 405 |  50 / 405 |
| Main skeletal / combined triangles   | 513,166 / 2,900,690 | unchanged |
| Textures                             |                   1 |         3 |
| Combined scripted orbit rendered FPS |               1.405 |     1.398 |
| Idle frames over one second          |                   0 |         0 |

The two shadow target attachments cost approximately 8 MiB before driver overhead.
A refresh submits up to 22 extra draws / 127,094 skull triangles; cached frames
avoid that work. Diagnostics expose main-pass counts, raw total counts, per-frame
and cumulative shadow work, projection and program/texture counts separately.
This does not hide shadow cost as changed anatomical geometry. Software-renderer
FPS remains low and is not a real-device smoothness guarantee.

37 unit/component tests and all 12 Chromium browser tests passed, including a
final run without snapshot updates. Typecheck, lint, formatting, production build
and anatomy/i18n validators passed. Checks cover shadow-frustum containment, unchanged vertex projection,
shader hooks, 25% hover pixels, real perspective side views, shadow-cache reuse,
rebaking after hide/restore, idle rendering, modes, RO/EN, filters and muscles.
Both GLBs/source manifest retain their checksums; original source geometry and
camera behavior remain unchanged. Medical/RO terminology review is still pending.

The final repeat measured 1.374 software-rendered orbit FPS (versus 1.398 above),
with the same geometry, texture/call counts and zero idle frames.

Pixel comparisons against checked-in whole-body baselines found all changes
inside the skull rectangle (x=374–434, y=99–179 on an 810 × 888 canvas): 3,783
skeletal pixels and 3,409 combined-layer pixels. Everything outside that region
was pixel-identical. Manual close-up previews are `skull-studio-simple.png` and
`skull-studio-colored.png`.

## Simple-only finish follow-up

The later user request was restricted to the Simple skull. The frontal and side
Simple test snapshots are the current finish; the earlier manual preview above
records the previous studio pass. No external asset, anatomy catalog, camera,
light, source geometry, UV or normal-buffer changes were made.

Chromium 156 / SwiftShader, 1440 × 960, DPR 1 baseline: 50 skeletal / 405 combined
main draws, 513,166 / 2,900,690 triangles including the grid, 50 / 405 GPU geometry
objects, 3 textures, zero idle frames in one second. Combined scripted orbit:
1.414 rendered FPS (software rendering, not a real-device performance estimate).
The refinement adds shader arithmetic only, no textures, geometry or render passes.
Simple now owns a distinct shader cache key so its finish cannot leak to Colored.
Additional mode-specific shader programs compile on first use, not each selection.
Asset bytes remain 7,134,628 skeletal / 41,167,792 muscular; checksums are unchanged.

After the finish, the same scenario retained all the draw/triangle/geometry/texture
counts and zero idle frames. Combined scripted orbit measured 1.410 rendered FPS;
muscle enable-to-render was 1,114 ms versus 1,102 ms before, and the warm layer
round trip 11,038 ms versus 11,061 ms. These software-renderer measurements show
no material regression, not a guaranteed frame rate on users' devices. Hover pixel
ratios in Simple remain 0.7496–0.7502 in both selected and unselected states.
Frontal pixel checks require a light neutral surface with a substantially darker
orbital cavity. Existing Colored and X-ray image baselines passed unchanged.
