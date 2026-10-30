# Brain registry: implemented source subset

Authority: `packages/anatomy-data/src/brain.ts` and the decoded
`brain-geometry-audit.json`. Names, Latin terms, FMA concepts and laterality reuse
the existing nervous manifest; translations and anatomical boundaries remain
unreviewed. Stable app IDs are not external atlas parcel IDs.

| Source group                | Independently mapped parts | Representation limit                                                         |
| --------------------------- | -------------------------: | ---------------------------------------------------------------------------- |
| Frontal cortex              |                          8 | Four paired source gyri, not full frontal hemispheres                        |
| Parietal cortex             |                          8 | Postcentral, supramarginal, angular and superior parietal parts              |
| Temporal cortex             |                          4 | Middle/inferior temporal gyri only                                           |
| Cross-lobar / limbic cortex |                          6 | Fusiform, parahippocampal and cingulate source gyri; no invented subdivision |
| Occipital lobes             |                          2 | Whole source-lobe meshes, no cuneus/calcarine parcels                        |
| Insular cortex              |                          2 | Whole source-insula parts, no short/long gyrus split                         |
| Deep gray matter            |                         10 | Paired hippocampus, amygdala, caudate, putamen, pallidum                     |
| White-matter structures     |                          6 | Paired capsule/fornix, corpus callosum, optic chiasm                         |
| Diencephalic parts          |                          3 | Paired thalamus and one hypothalamic source part                             |
| Brainstem                   |                          3 | Midbrain, pons, medulla source parts                                         |
| Cerebellum                  |                          1 | Whole source part; cannot isolate left/right/vermis/lobules                  |
| **Total**                   |                     **53** | **23 paired identities on each side + 7 central parts**                      |

The cortex tree has 15 available parts per side. A left/right filter selects
existing lateralized parts, NOT a newly reconstructed whole hemisphere. Cortex,
deep gray matter, white matter, brainstem and associated cavities are not merged
into one tissue category. Ventricular surfaces remain absent and are not painted
onto adjacent tissue. Spinal cord is explicitly excluded from this brain registry.

Known unmapped targets include superior temporal gyrus, precuneus, named inferior
frontal subdivisions, cortical poles, detailed occipital/cingulate subdivisions,
cerebellar divisions/nuclei, accumbens, subthalamic nucleus, substantia nigra and
all advanced cortical atlas labels. This list is not exhaustive. No cortex-only
hemisphere selection implies that those missing structures have become available.

Presentation grouping is a curated educational classification, not a validated
crosswalk into another atlas. In particular, a full BodyParts3D gyrus must never be
renamed as a finer DK/Destrieux parcel or a functional Yeo network.
