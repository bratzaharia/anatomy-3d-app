# Brain atlas research and registration prerequisites

Checked 2026-10-30. **Zero advanced datasets imported or registered.** Candidate
metadata is research, not proof that a downloadable academic dataset can be
commercially redistributed. Exact release files and rights remain to be pinned.

- [FreeSurfer cortical parcellation](https://surfer.nmr.mgh.harvard.edu/fswiki/CorticalParcellation)
  documents DK `aparc.annot` and Destrieux `aparc.a2009s.annot`. Their anatomical
  conventions differ, including treatment of exposed gyri versus sulcal banks.
  Labels are tied to vertices on a matching subject/hemisphere surface and color
  table. Source-native IDs must be retained; macro source gyri are not a crosswalk.
- [FreeSurfer surface registration](https://surfer.nmr.mgh.harvard.edu/fswiki/SurfaceRegAndTemplates)
  is the relevant registration family, not a bounding-box fit. The current GLB
  does not contain spherical surfaces, matched MRI, cortical curvature maps or
  vertex correspondence to fsaverage. Reconstruct/obtain proper same-subject
  cortical data, or use a clearly separate validated atlas reference surface.
- [HCP-MMP1.0 original BALSA study](https://balsa.wustl.edu/study/show/RVVG):
  multimodal cortical parcellation, 180 areas per hemisphere. Preserve the exact
  fs_LR mesh/density, hemisphere, CIFTI labels, GIFTI surfaces and any registration
  chain; source-space facts do not authorize mapping onto BodyParts3D.
- [Yeo 2011 source documentation](https://surfer.nmr.mgh.harvard.edu/fswiki/CorticalParcellation_Yeo2011):
  7- and 17-network estimates, available in surface and nonlinear MNI152 forms.
  These are distributed functional-connectivity networks, not independent
  anatomical organs or patient-specific activations. Select one explicit native
  representation and exact reference template before devising correspondence.
- [Allen AHRAv2](https://alleninstitute.github.io/CCF-MAP/descriptions/human_ccf.html)
  offers separate gyral and modified Brodmann annotation volumes in the symmetric
  MNI152 ICBM2009b reference. This is a volumetric framework, not a pre-registered
  GLB. Volume sampling and surface generation need their own validated chain.
- [Brainnetome](https://atlas.brainnetome.org/): a distinct connectivity-based
  framework (246 reported subregions); neither identity nor space is interchangeable
  with the source gyri. Its distribution conditions need separate permission review.

## Prepared jobs, not completed registration

Run `pnpm brain:prepare-atlas`; outputs are in `brain-registration-plans/`.
Each pins the target SHA, candidate source/version/space/format and missing inputs.
All have `runtimeApproved: false` and no correspondence. No external terms are
accepted and no files are downloaded by this command.

Future work must preserve source masks/background, medial-wall exclusions,
left/right labels, native topology and exact version. Validate correspondence
using independent anatomical landmarks and boundaries, quantify held-out errors,
inspect cortical folding and tissue overlap, and store the full review evidence.
No universal tolerance is invented here. Reviewers must justify atlas-specific
thresholds before acceptance. Do not label by closest XYZ point, broad lobe colors,
an affine fit alone or body-level bone registration.

Native NIfTI/GIFTI/FreeSurfer/CIFTI decoders, registration algorithms and approved
atlas label-buffer generation are not implemented by the preparation tool. Any
future runtime manifest must bind labels to exact target position/index hashes,
classify unknown faces explicitly and pass independent anatomical/license review.
