# Arterial asset acquisition audit — 2026-11-01

Decision: integrate the licensed BodyParts3D subset in its native reference
frame. Do not buy or import incompatible/mislicensed alternatives to fill gaps.

| Candidate / primary source                                                             | Findings and decision                                                                                                                                                                                                                                                                            |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [BodyParts3D archive](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html) | Actual 4.0 IS-A named OBJ geometry; same reference body. 212 new records imported, 7 cardiac records reused. Public license verified separately. No centerline or patient-specific lumen/wall measurement. Partial distal/face/spinal/sex-specific coverage; professional review still required. |
| [SlicerVMTK](https://github.com/vmtk/SlicerExtension-VMTK)                             | Toolchain for segmentation, centerlines and branch analysis, not a ready whole-body atlas. Repository reports Apache-2.0; dependencies and patient-data rights need independent audit. No installation or imaging data processed.                                                                |
| [SimVascular](https://simvascular.github.io/)                                          | Reconstruction/meshing/simulation pipeline. Software BSD terms do not license every example dataset or third-party component. Useful future offline preprocessing, not a drop-in body-aligned asset.                                                                                             |
| [Vascular Model Repository](https://www.vascularmodel.com/)                            | Regional normal/diseased computational models. Exact file license, patient/privacy provenance, labels and reference registration have not passed acquisition gates; no model imported. The supplied Stanford URL timed out; official SimVascular links to this repository.                       |
| [Z-Anatomy models](https://github.com/Z-Anatomy/Models-of-human-anatomy)               | BodyParts3D-derived Blender content, generally CC BY-SA 4.0 with mixed third-party references including NC assets. Requires file-specific rights and geometry-registration audit. No new arterial extraction; do not assume a global license covers every object.                                |
| [Catfish contact](https://catfishanimationstudio.com/en/contact/)                      | Potential B2B request for named arterial models. No public geometry redistribution license or quote verified. Existing app purchase is not a mesh license. No app extraction, reverse engineering or additional email sent.                                                                      |
| [SciePro real-time license](https://www.sciepro.com/licensing-terms)                   | Official real-time terms mention app/WebGL integration, runtime distribution and modification. Require written confirmation for web/mobile/CDN delivery and the precise arterial inventory before purchase. No geometry received or registered.                                                  |
| Marketplace / other anatomy or CTA collections                                         | No asset-specific license, individually named coverage or same-body registration approved in this change. Remain candidates, not integrated datasets.                                                                                                                                            |

[SciePro public pricing](https://www.sciepro.com/pricing) returned starting prices
of $29,900 for a single male/female model and $49,900 for the collection during
this audit. Search snippets displayed a different currency; obtain a current
written, arterial-only quote rather than budgeting from cached snippets. These
are not prices for the missing branches alone and no purchase is recommended
without sample audit and explicit approval.

## Prioritized acquisition request

1. Individually identified external carotid/facial, spinal, pelvic and distal
   limb branches, including female reference anatomy separately.
2. Coronary detail and documented dominance variants, cerebral segment/variant
   geometry and source-backed perfusion maps with their actual reference space.
3. Named pulmonary branches and centerlines with measured radii only where
   provided; no arbitrary diameters reconstructed as measured anatomy.

For any vendor demand: complete stable object/branch list, source and medical
review evidence, editable FBX/OBJ/GLB plus hierarchy, units/orientation/landmarks,
geometry sample, topology/bounds, left/right coverage, correspondence to this
body, variant/sex separation, optimization/derivative rights, attribution and
explicit commercial WebGL/mobile/runtime asset delivery terms. Evaluate the
sample before contract/purchase. Automated quality checks do not certify anatomy.
