# Unreviewed source-pose candidates — NOT runtime anatomy

`hra-spinal-cord-UNREVIEWED.glb` is an offline review artifact, not a public viewer
asset and not an approved model of the application's spinal cord. Do not move it
to `apps/web/public` or register its IDs as available anatomy.

- Source: [Human Reference Atlas, Spinal Cord Male, NIH 3DPX-021018 v1](https://3d.nih.gov/entries/3DPX-021018?version=1).
- Creator: Human Reference Atlas / HuBMAP Consortium. Source data: Visible Human Male, U.S. National Library of Medicine.
- Exact source: [HRA reference library revision f1a3a63, VH_Male/v1.2/VH_M_Spinal_Cord.glb](https://github.com/hubmapconsortium/ccf-3d-reference-object-library/blob/f1a3a63f110e27ff0736047d52d04dba5d3087f9/VH_Male/v1.2/VH_M_Spinal_Cord.glb).
- License: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/); [pinned publisher license](https://github.com/hubmapconsortium/ccf-3d-reference-object-library/blob/f1a3a63f110e27ff0736047d52d04dba5d3087f9/LICENSE).
- Changes: source-only coordinate transfer from observed vertebral hole-centroid proxies; bounded constant-displacement extension (up to 3 mm engineering limit); normals recomputed; lossless Meshopt GLB conversion; source colors replaced by a neutral review material. Source triangles and 30 segment identities are retained. No nerve paths, missing segments or new mirrors are synthesized. No endorsement is implied.

**Quarantine reason:** the vertex-in-solid screen reports possible bone
intersections; C2/L1 target hole proxies are unresolved; brainstem/conus and full
surface clearance need anatomical review. Envelope overlap is not proof of
tissue continuity. The 30 cord segments must not be labeled as 31 nerve pairs.
See [machine report](../hra-spinal-registration.json) and [stage audit](../HRA_SPINAL_REGISTRATION.md).
