---
name: anatomy-asset-audit
description: Audit a new or changed 3D anatomy asset before it can enter the runtime manifest.
---

# Anatomy asset audit

Trigger for every proposed anatomy geometry or texture import. Record source URL, exact asset/version, asset-specific license, attribution, commercial and redistribution terms, derivative restrictions, provenance, and review status. Reject ambiguous licensing.

Inspect anatomical completeness, structure naming, semantic ID mapping, scale, orientation, normals, pivots, bounds, selectable mesh coverage, file size, textures, compression, and mobile suitability. Verify every selectable mesh resolves to a catalog ID and every manifest ID exists. Run the anatomy validator and relevant build.

Output a structured report with decision, source/license evidence, anatomy and geometry findings, runtime metrics, required fixes, and verification actually executed.
