# Arterial validation — NOT clinically certified

Current disposition: source-mapped educational subset, **PENDING MEDICAL REVIEW**.
No record has a qualified reviewer approval, reviewer identity or approval date.
Automated tests, publisher names and convincing appearance are not medical review.

## Automated evidence

- Source IDs and exact mesh ownership are disjoint, including shared cardiac
  anatomy. One exact celiac duplicate is excluded with reversible alias evidence.
- 30 previous model/manifest/attribution files are protected by SHA-256 against
  cardiac base commit `a3561a9`; import/validation fail if these differ.
- 29 existing skeletal source references match geometry hashes. The documented
  transform is `[x/1000,z/1000,-y/1000]`. Reported source difference 0 mm means
  identical reference files, **not** zero anatomical registration error measured
  against patients or an independent specimen.
- GLBs decode losslessly with checked bounds, IDs, indices, finite coordinates
  and normals. No source positions are fitted to adjacent anatomy.
- New surfaces contain 47,078 index-based boundary edges, zero detected
  nonmanifold edges and zero degenerate triangles. Boundaries include source
  seams/ends; they are not automatically capped or treated as watertight lumens.
- Limb laterality is retained from explicit source identities. A left hepatic
  trunk can lie to the anatomical right of the body midplane; a centroid sign
  alone is not evidence to mirror or relabel an organ branch.

## Required qualified review checklist

- [ ] EN/RO terms and any established Latin/FIPAT correspondence.
- [ ] Scope denominator and exhaustive named-branch target inventory.
- [ ] Source vessel identity, laterality and sex/specimen applicability.
- [ ] Each origin, continuation, confluence and collateral relationship.
- [ ] Arch/coronary/pulmonary connections, without implying lumen validation.
- [ ] Major skeletal/muscular/neural/venous landmark relationships in each region.
- [ ] Cerebral and coronary variants, separately from the source reference.
- [ ] Distal continuity, missing segments and topology suitability.
- [ ] No false artery/vein classification based on oxygenation.
- [ ] No territory or surgical/diagnostic claim beyond actual evidence.

Reviewer workflow: propose correction against stable IDs and source files;
record reviewer identity, credentials, date, evidence and approve/reject/request-
changes decision; version any corrected mapping and rerun tests/visual audit.
Reject ambiguous geometry or licensing before runtime admission. Display review
state independently from geometry availability and registration state.
