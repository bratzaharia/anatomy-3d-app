# Nervous source and asset audit — HA3DA-1, inventory 1.1.0

Decision: **accept the audited peripheral subset for an explicitly unreviewed educational integration; PARTIAL COVERAGE, not verified complete**. Keep the fixed skeletal/muscular geometry and skull rendering unchanged. No clinical or surgical registration claim is made.

## Actual delivery

The active scene has **302 canonical source entities**, 1,492,108 triangles: 55 retained BodyParts3D CNS/ciliary entities and 247 newly processed Z-Anatomy entities (194 independent source identities, 53 selectable source sets). The original 83-entity BodyParts3D neural GLB remains unchanged; its 28 overlapping partial cranial variants are not mounted. One canonical identity has exactly one active geometry owner.

The inventory has 465 entries: 249 individually mapped source identities, 53 source sets, 163 without geometry. Individual means independently identified source geometry, **not a medically verified complete nerve course**. Both hands and feet now have actual distal source surfaces, not screenshots, lines, picking proxies or procedurally guessed paths. Each hand has 3 individual identities and 6 sets; each foot has 4 individual identities and 6 sets. Sets are not independently separated per digital branch or per digit.

See [decoded geometric coverage](NERVOUS_GEOMETRY_COVERAGE.md), [machine-readable report](NERVOUS_GEOMETRY_COVERAGE.json) and [20 captured source-coverage views](nervous-qa/coverage-views.json). No human medical review of these captures is claimed.

## Source decisions and licensing

| Source / exact version                                                                                                                                                                                                                | Acquired evidence                                                                                                                                 | Decision                                                                                                                                                                                                      |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [BodyParts3D 4.0 IS-A OBJ99](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html)                                                                                                                                         | Existing original element checksums, GLB and common-subject reference hashes                                                                      | Retain 55 non-overlapping entities; original 83-entity archive preserved. FJ1737 cord/canal identity stays quarantined.                                                                                       |
| [Z-Anatomy NervousSystem100.fbx](https://github.com/LluisV/Z-Anatomy/blob/4ef7d59f4a2cc002f65ebd2bbb395ae4df3a5faf/Resources/Models/FBX/NervousSystem100.fbx), commit 4ef7d59f4a2cc002f65ebd2bbb395ae4df3a5faf                        | 53,887,724 bytes, SHA-256 3ea1aad64956cad27348a27b8fb50494b7cc307c6bc77bee0810ec2a67dff2b1; source numeric object IDs and original names retained | 247 peripheral source entities converted and source-pose transferred. Not a claim that all 712 FBX objects are nerves or usable anatomy.                                                                      |
| [SPARC/Pennsieve dataset 307](https://discover.pennsieve.io/datasets/307), version 8, DOI [10.26275/bbvg-gj86](https://doi.org/10.26275/bbvg-gj86)                                                                                    | Downloaded EXF volumes, source semantic groups, nerve annotations, provenance and curator README                                                  | Research scaffold only, not mounted or counted as verified trajectories. Publisher describes estimated nerve fiducials and a non-subject-specific scaffold.                                                   |
| [HRA Visible Human male v1.2](https://github.com/hubmapconsortium/ccf-3d-reference-object-library/tree/f1a3a63f110e27ff0736047d52d04dba5d3087f9/VH_Male/v1.2), [NIH 3DPX-021018 v1](https://3d.nih.gov/entries/3DPX-021018?version=1) | Actual cord GLB 489,992 bytes / 16,358 triangles / 30 source segments; vertebrae and extraction-site GLBs downloaded too                          | Quarantine pending canal/brainstem registration. Best sagittal similarity of 24 corresponding vertebral center proxies has RMS 14.65 mm, max 35.95 mm. See [measured audit](hra-spinal-candidate-audit.json). |
| [Open3DModel / AnatomyTOOL](https://anatomytool.org/open3dmodel-learn)                                                                                                                                                                | Primary resource request returned HTTP 502 during this audit                                                                                      | No exact asset acquired or approved. Do not conflate this institutional project with similarly named decorative model sites.                                                                                  |

BodyParts3D's [official current license](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html), updated 2025-02-27, is **CC BY 4.0**. Original source element notices are preserved separately; those terms are not silently substituted for Z-Anatomy's derivative terms.

The pinned Z-Anatomy [asset-specific license](https://github.com/LluisV/Z-Anatomy/blob/4ef7d59f4a2cc002f65ebd2bbb395ae4df3a5faf/Resources/Models/License.txt) was acquired and SHA-256 checked (af62c06f620b9da20138e4c22a3f56565482dd058266540994ace97a4e24b693). The licensed derivative subset is distributed as **CC BY-SA 4.0**, with credit to Z-Anatomy contributors, historic BodyParts3D CC BY-SA 2.1 Japan, and University of Dundee CAHID cranial source CC BY 4.0. Commercial redistribution/adaptation is permitted under the applicable BY/SA terms, with attribution, license links and modification notices. This is not a new license for unrelated application code.

Explicit source exceptions were **excluded**, not imported under a blanket license: Washington Brainder/white matter/nuclei, cochlear/vestibular/inner-ear components (Dundee inner-ear content is NC-SA), kidney and auxiliary marker objects. No source textures were loaded or redistributed. The full FBX containing excluded content stays in the ignored acquisition cache, not public assets. Notices ship beside the four GLBs in z-nervous-attribution.txt, inside GLB metadata, in the viewer and inspector. Source object inclusion/exclusion is recorded in z-nervous-registration.json.

HRA's pinned repository license is CC BY 4.0; SPARC dataset 307 is CC BY 4.0. Neither is redistributed as runtime neural geometry in this change. Five SPARC regional EXFs have the same 13,611,914-byte content hash: they are semantic views of one scaffold, not five independent geometry acquisitions or additional coverage.

## Anatomy, identity and registration

- Source nerves only are changed. No fixed bone/muscle vertex, material, skull mode, anatomical pose, light or scale is changed. The validator checks all 14 protected SHA-256 references.
- Initial global affine fitting of Z source to 18 bone center proxies left RMS 12.14 mm / max 21.62 mm held-out error and was rejected as a direct placement method.
- The included source-only pose transfer uses 190 explicitly name-matched bone bounding-box center proxies, a 3D polyharmonic kernel with affine tail, and five-fold withheld-bone validation. RMS 2.925 mm, max 17.103 mm (sacrum; pelvis requires particular review). These are **geometric proxies, not independently annotated nerve/foramen clinical landmarks**. This transfer is educational and unreviewed, not proof of correct passage through every foramen or tissue plane.
- Per-object center Jacobian samples range 0.818–1.150, all positive. Center samples are a technical screen, **not an everywhere fold-free proof** or a nerve intersection/canal safety analysis. Full coefficients, 190 correspondences and holdouts are in [registration evidence](z-nervous-registration.json).
- Actual FBX surface topology is retained. Only identical positions within each canonical source entity are welded; normals are recomputed. No new path, mirror, extra decimation or anatomical connection is synthesized. Runtime transforms are identity; source vertices already use the fixed atlas frame.
- Canonical matches use curated source aliases at import time, never runtime display labels. The source's unsuffixed Common_plantar_digital_branches_of_medial_plantar_nerve is assigned right from its unilateral negative-X bounds and explicit left counterpart; original source name and object ID remain recorded. The right vagal source course crossing the midline is not mirrored or relabeled by a bounding-box center heuristic.
- Cranial source parent surfaces must not imply complete fine branching. CNI source scope (filaments versus bulb/tract components), facial fine branches, source ganglion segment identities, and all geometric courses require independent anatomy review. Optic nerve retains CNS classification. Source names alone are not medical approval.
- 147 added identities retain original source names with explicit RO fallback and missing Latin-review notices. No fabricated medical translation or official FIPAT endorsement is claimed. Existing editorial catalog strings are reused but remain medically unreviewed.

## Runtime, performance and failure behavior

One existing canvas/camera/selection store. Neural loading starts only on explicit nervous activation; the base CNS archive and four real regional chunks load in parallel and stay cached across system toggles and locale changes. This is regional chunking, **not a completed progressive whole-body LOD/high-detail streaming system**. A failed neural array request can be cleared/retried as one cache key without replacing bones or muscles.

Four shared neural materials; no additional lights, render passes, shadows, fake foreground rendering, raycast proxies or permanent frame loops. Hidden/facet-excluded meshes use no-op raycasting. Whole-body inspection snapshots exact prior hidden/isolated/facet state and fits the body; restore preserves global checkboxes and existing bone/muscle opacity. Individual nerve focus uses its complete bounds; regional focus uses the immutable skeletal region envelope so a vagal/accessory course cannot pull the head camera toward the torso.

Measured Chromium 156 / software WebGL / DPR 1 / 1440×960:

| Scenario                 | Main draw calls | Main triangles |
| ------------------------ | --------------: | -------------: |
| Existing bones           |              50 |        513,166 |
| Existing bones + muscles |             405 |      2,900,690 |
| Nerves only              |             303 |      1,492,110 |
| All three systems        |             707 |      4,392,798 |

The grid accounts for one draw and two triangles. The existing cached skull shadow refresh is reported separately, not hidden in main-draw counts. Neural first activation measured 1.16–1.18 s locally; five files total 19,080,964 bytes. Warm toggles issue no extra neural requests. Idle frame count remains unchanged. All-layer software orbit measured 14 frames / 15.57 s ≈ 0.90 FPS (prior software baseline bones+muscles ≈1.39 FPS, old head-only neural ≈1.1–1.3 FPS). This is a real performance cost; **no hardware/mobile/60-FPS claim**. Measured neural raycast max 0.2 ms in this orbit scenario is not evidence for adding BVH. Whole-body neural LOD/progressive refinement and hardware/mobile profiling remain necessary before performance acceptance.

## Verification and remaining gates

The anatomy validator decodes every active GLB and checks hashes, normals, finite positions, triangle indices/counts, source ownership, IDs, bounds, and the 14 unchanged references. Coverage is generated from those decoded GLBs, not inventory row count. Tests cover actual rendered distal pixels → hover/click → canonical selection → isolate/hide → no hidden picking, all eight layer combinations, exact visibility restoration, locale/cache preservation, retry, camera focus and skull modes. Skeletal/muscular/skull golden images are not regenerated for this change.

The milestone remains **PARTIAL_COVERAGE**: spinal cord, all 31 independently numbered spinal pairs, cervical/coccygeal plexuses, phrenic courses, selected fine cranial/digital branches, pelvic/hypogastric/splanchnic and enteric coverage remain unresolved. See the generated report for every catalog gap and additional scope gaps. Source sets do not hide these missing identities. Independent medical/registration/terminology review is required. No production deployment, merge or paid asset purchase is part of this work.

Full regression run: **61 unit/component tests and 23 Chromium E2E tests passed**;
typecheck, lint, formatting, i18n/anatomy validators and production build passed.
The second software-WebGL run measured neural activation at 1.29 s and all-layer
orbit at 0.84 FPS; bone+muscle baseline remained 1.41 FPS. These repeat measurements
reinforce the performance limitation, rather than a mobile-performance claim.
The QA artifacts include 20 requested source views and a separate actual local
in-app browser proof screenshot.

Review recommendation: suitable for a clearly labeled development/educational
preview only. High-priority release gates are clinical course/canal/foramen and
pelvic registration review, exhaustive target coverage, and measured hardware
LOD/performance work. Source-name RO/Latin review is also pending. Passing code
tests does not approve these medically sensitive gates or authorize production.
