# Venous medical verification — PENDING

No independent anatomist/clinician has approved this layer. All model and edge
records remain unverified, with null reviewer/date. Automated technical checks
and reference lookups must never promote them to reviewed status.

## Technical audit findings

- The accepted source is the adult male BodyParts3D reference. Female-only
  targets are listed separately and not overlaid. Individual source entities
  and grouped vessel sets are counted separately.
- Same-subject skeletal landmarks have identical source geometry, but this does
  **not** validate vessel trajectories, lumens, tissue crossings or mesh joins.
- Two ascending lumbar candidates have source labels opposite their coordinate
  side (`FJ3493`, `FJ3589`): quarantined, not mirrored/relabelled. Global centroid
  tests are not used to reject organ-relative cardiac/portal names.
- Accepted reduced surfaces have 39,648 boundary edges, zero detected
  non-manifold edges and zero degenerate triangles. Open vessel ends/source
  segmentation are not closed, repaired, welded or asserted to be lumen joins.
- Main caval, cardiac, pulmonary and portal semantic reference routes are
  distinct. The liver transition is conceptual, not a visible microvascular
  model. Unsupported/variable routes and anatomical variants are not guessed.
- Missing intracranial sinuses, small head/neck vessels, vertebral plexuses,
  female anatomy and valve/venule detail remain explicit in the generated matrix.

## Reviewer checklist, per structure and regional combination

1. Verify source identity/FMA and EN/RO/Latin terminology (TA2 framework).
2. Check side, sex, normal/reference pattern versus variants and coverage extent.
3. Verify superficial/deep/perforating category; retain unknown where unsupported.
4. Inspect anterior/posterior/lateral views relative to fixed bones, muscles and
   nerves; record measured landmarks, trajectory disagreements and intersections.
5. Check each claimed tributary/drainage relationship against cited anatomy.
   Pulmonary veins remain veins despite oxygenated blood; the portal system must
   pass through hepatic microcirculation before systemic venous return.
6. Inspect endpoints, branches, disconnected surfaces, duplicated identities and
   representational gaps. A semantic edge is not proof of continuous geometry.
7. Accept, reject or request correction per ID, with full reviewer name,
   qualification, date, source/version/hash, evidence and notes. Separate
   terminology, geometry, registration and relationship approvals.

Store signed decisions outside public assets; record non-sensitive approval
metadata in a versioned review ledger after owner approval. A future controlled
schema migration can allow `reviewed` per exact evidence, not a bulk flag flip.
Reimport or geometry replacement requires re-review of affected relationships.

This is educational reference anatomy, not patient-specific imaging, diagnostic
software or a certified medical device. Until the checklist is completed,
“medical-grade complete system” is a target, not a product claim.
