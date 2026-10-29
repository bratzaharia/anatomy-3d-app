# Historical BodyParts3D-only nervous audit — inventory 1.0.0

This is the archived original source decision, not current runtime coverage.
See [current multi-source audit](NERVOUS_AUDIT.md) for inventory 1.1.0.

Decision: **accept the independently mapped BodyParts3D surfaces for a partial,
unreviewed educational integration only**. Reject any claim of complete
full-body nervous geometry. No external commercial assets were acquired.

## Provenance and license

- Publisher: Database Center for Life Science, BodyParts3D release 4.0,
  IS-A 99% polygon-reduction archive, linked by the publisher's
  [download page](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html).
- Source: <https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/isa_BP3D_4.0_obj_99.zip>.
- [Publisher license](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html),
  checked 2026-10-28: CC BY 4.0, permitting redistribution and adaptations with
  attribution. The required credit is retained in the GLB, companion attribution
  file, application and repository. The code and anatomical asset licenses are
  distinct. No NC or SA third-party geometry/textures were imported.
- Per-structure FMA concepts, original file IDs, SHA-256 hashes, source version,
  and output checksum are recorded in `nervous-manifest.json`.
- Terms reference [FIPAT/IFAA](https://ifaa.net/committees/anatomical-terminology-fipat/fipat-ifaa-terminologies/).
  No FIPAT PDF is reproduced or modified. Anatomical terminology and RO names
  remain **unreviewed**, not an endorsed Romanian translation.
- Cranial functional categories are broad catalog annotations, not full fiber
  composition or innervation claims. See [OpenStax A&P 2e §13.4](https://openstax.org/books/anatomy-and-physiology-2e/pages/13-4-the-peripheral-nervous-system)
  and [NCBI cranial nerve reference](https://www.ncbi.nlm.nih.gov/books/NBK470353/).
  Oculomotor is motor with parasympathetic components, not mixed sensory/motor;
  optic nerve is classified as CNS. Nerve I filaments are not its CNS bulb.
- The small branch-relationship graph cites OpenStax and the
  [UAMS lower-limb nerve table](https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/nerve-tables/nerves-of-the-lower-limb/).
  No detailed muscle/organ innervation, microscopic nuclei or trajectories are asserted.
- Associated cavities/coverings use [OpenStax §13.3](https://openstax.org/books/anatomy-and-physiology/pages/13-3-circulation-and-the-central-nervous-system):
  the lateral ventricles are cataloged as a bilateral pair, while filum terminale
  is assigned to spinal/pelvic regions. Neither is rendered or classified as
  neural tissue.

## Anatomy and registration

83 independently selectable anatomical source entities, assembled from 91
non-duplicated source meshes. 342,860 triangles; 4,762,452-byte GLB. Surface
resolution is the publisher's reduced release, not a new high-resolution scan.
Multiple pieces of one source concept share one canonical identity. The brain
navigation entity references its existing child surfaces; it adds no geometry.

`nervous-alignment.json` checks identical vertex/face line hashes for all 29
unchanged skeletal reference structures across the IS-A/PART-OF releases. The
same proper rotation/unit conversion `[x/1000, z/1000, -y/1000]` is applied to
new nerves only, with identity runtime transforms. No mirroring, deformation,
translation or scale fitting to the skeleton is performed.

This establishes technical common-subject registration, **not clinical validation
of every brain boundary or nerve-foramen relationship**. Independent medical
review is pending. FMA labels alone do not constitute proof of full nerve course.

## Rejected / quarantined candidates

- **FJ1737:** PART-OF FMA7647 (spinal cord) and FMA78497 (central canal) both use
  the same source geometry. IS-A identifies it as central canal. Tissue-versus-
  cavity identity is unresolved, so no spinal cord surface is shown. No synthetic
  substitute is created. Cord segments, conus, cauda equina and roots remain missing.
- The existing Z-Anatomy muscular candidate audit already demonstrates different
  subject alignment. Its source cannot be assumed registered to the fixed atlas;
  no Z geometry was added. Asset-specific licensing/registration would need a
  separate audit, especially third-party textures or models.
- Full-body peripheral nerves, most complete cranial nerves, all 31 spinal nerve
  pairs, major plexuses and most autonomic structures have **no approved compatible
  independent geometry in this integration**. Metadata entries do not draw meshes.

## Delivery and verification

The nervous GLB loads only on first explicit nervous-layer activation. The
decoded cache is retained across toggles and language changes. Material sets are
shared; no extra lights, render passes, shadows, picking proxies or frame loops.
Meshes use ordinary depth testing; hidden/filtered meshes have a no-op raycast.
No unsupported BVH, LOD, KTX or compression dependencies were introduced.

`VITE_NERVOUS_ASSET_BASE_URL` can point to a static CDN with CORS and
`model/gltf-binary`, but defaults to the existing Vercel-hosted `/models/` path.
No Cloudflare migration or production release is part of this branch work.

Run `pnpm validate:anatomy` for manifest, decoded geometry, indices, normals,
laterality, hierarchy, graph references, coverage and the exact SHA-256 baseline
of 14 protected skeletal/muscular/skull files. See `NERVOUS_COVERAGE.md` for the
generated, versioned missing-geometry report. Passing these technical checks is
not medical approval or completion of the requested full-body milestone.
