# Coronary integration

The existing cardiac IDs are the single source of truth:

| ID               | Source identity                                     |
| ---------------- | --------------------------------------------------- |
| cardiac-fma3802  | Right coronary trunk                                |
| cardiac-fma3855  | Left coronary trunk                                 |
| cardiac-fma74912 | Anterior interventricular branch trunk (LAD)        |
| cardiac-fma3895  | Circumflex branch                                   |
| cardiac-fma3840  | Posterior interventricular branch of right coronary |

All five reuse `bodyparts3d-heart-arterial.glb` unchanged. Ascending aorta and
pulmonary trunk use the same packet but their distinct arterial categories.
Arterial and heart UI access does not create additional anatomical identities.
When arterial is on, its renderer owns all seven; otherwise the cardiac module
can render enabled coronary/great-artery categories. The E2E test checks draw
counts before/after toggling both cardiac categories to catch duplicates.

Right-coronary origin of the source posterior interventricular branch is
recorded as source-specific, not a universal dominance claim. Source geometry
does not establish all dominance territories. Left/codominant alternatives,
diagonals, septal perforators, marginal/posterolateral branches and quantitative
territory maps remain pending source acquisition, mapping and expert review.
No synthetic coronary branch or perfusion patch is generated.
