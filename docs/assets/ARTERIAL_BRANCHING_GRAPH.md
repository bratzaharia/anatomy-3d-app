# Partial arterial branching graph

`ArterialEdge` separates branch, continuation, confluence and anastomosis, with a
source URL, evidence state, medical-review state and optional variant. Runtime
edges are curated independently of IS-A/PART-OF source ownership: an ontology
inclusion relationship is not evidence of arterial origin.

Implemented origin examples:

- Left radial → left brachial → left axillary → left subclavian → aortic arch →
  ascending aorta. The right pathway includes the brachiocephalic trunk.
- Left MCA source M1 → left internal carotid → left common carotid → aortic
  arch → ascending aorta.
- Basilar origin retains both vertebral contributors.
- Celiac, main mesenteric and renal trunks trace to abdominal aorta.
- Pulmonary branches trace separately to the pulmonary trunk, never the aorta.

Main educational pathway reference: [OpenStax, Circulatory Pathways](https://openstax.org/books/anatomy-and-physiology-2e/pages/20-5-circulatory-pathways).
Coronary semantic reference: [OpenStax, Heart Anatomy](https://openstax.org/books/anatomy-and-physiology-2e/pages/19-1-heart-anatomy).
These are source-backed educational associations, **not expert-approved graph
edges or measured mesh connectivity**. Geometry does not prove a patent lumen.

Traversal follows only source-backed branch/continuation/confluence edges,
skips unverified edges and does not force collateral connections into a tree.
Visited sets bound cycles. Unknown/duplicate/self/uncited edges fail validation.
Absent links stop traversal visibly; no inferred continuation is manufactured.
Many imported distal records intentionally have no curated upstream edge yet.

Trace mode highlights existing meshes and dims unrelated arteries. Explicit
trace clears isolation/side filters while saving previous exploration overrides.
Restore reinstates them; global layer membership is unchanged. No animated flow,
hemodynamic pressure, speed, capillary geometry or patient-specific claim exists.
The cardiac physiological flow graph remains separate and retains its valve/
ventricular cavity references; it is not welded into a fabricated surface lumen.
