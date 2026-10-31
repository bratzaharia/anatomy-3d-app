# Directed reference graph

`CARDIAC_GRAPH` uses canonical source IDs and separately named no-mesh concepts.
Every edge has a source URL and `reviewStatus: pending`. Validation rejects unknown
endpoints, duplicate/self edges and missing citations. Cycles are allowed for
circulation; the acyclic venous drainage validator is not misapplied here.

Supported inspection sequences:

- Cava → right atrial cavity → tricuspid leaflets → right ventricular cavity →
  pulmonary cusps → pulmonary trunk.
- Pulmonary vein → left atrial cavity → mitral leaflets → left ventricular cavity →
  aortic cusps → ascending aorta.
- Great cardiac vein → coronary sinus → right atrial cavity.

Pulmonary microcirculation is a semantic transition through omitted pulmonary
arterial/capillary geometry, not fictional 3D capillaries. Coronary output edges
include aortic origin, the two coronary trunks, LAD/circumflex and the source's
RCA-derived posterior descending branch. The latter carries a source-variant
qualification, not a universal right-dominance assertion.

UI arrows show reference order as text, not measured blood flow or verified mesh
connectivity. Explicit reveal restores applicable vein filters/isolation and shows
available related structures. It never joins geometry. Pathway playback, complete
systemic and coronary microcirculation, hemodynamics and conduction are not
implemented. No anatomical connection is inferred from adjacency.

Source: [OpenStax heart anatomy](https://openstax.org/books/anatomy-and-physiology-2e/pages/19-1-heart-anatomy).
