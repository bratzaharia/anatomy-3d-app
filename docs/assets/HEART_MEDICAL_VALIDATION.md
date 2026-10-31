# Cardiac validation gates

No independent clinical anatomy review is complete. Geometry availability,
source fidelity, provenance and medical review are separate statuses; an imported
FMA-labelled surface is not a clinical certification or patient-specific model.

Source topology audit across 43 OBJ components: 16,170 index-based boundary edges,
zero detected non-manifold edges and three degenerate triangles. Unwelded seams
and intentionally separate source parts can contribute to boundary counts; these
numbers are not a watertightness certificate. No automatic welding or removal
changes source geometry. These findings are explicit review risks, especially
for chamber walls, section views and vascular ostia.

Engineering checks: disjoint source ownership; no duplication of venous sources;
stable IDs; source-space reference hashes; exact derived GLB checksums; decoded
positions/indices/normals/bounds/counts; catalog/hierarchy validity; graph endpoint,
citation and direction checks; localization; visibility/raycast consistency.

Required expert checks before any stronger medical claim:

- Heart orientation, source subject morphology and relations to sternum,
  diaphragm/mediastinum and surrounding structures.
- Adequacy of the unsegmented wall surface and cavity boundaries; distinct
  ventricular thickness is not validated or reconstructed by this implementation.
- Exact leaflet/cusp naming, geometry, orientation, roots and supporting apparatus.
- Caval, pulmonary and coronary-sinus ostia: graph direction does not certify
  physical continuity, correct wall junctions or absence of leaks/intersections.
- Coronary arterial/venous identity, source-specific dominance and variations.
- RO/Latin terminology, educational descriptions and omission of unsupported claims.

Conduction, heartbeat deformation, leaflet motion, microvascular geometry and
patient-specific imaging remain unavailable. Do not promote a schematic signal
or generic mesh deformation to validated physiology. The UI exposes these gaps.
