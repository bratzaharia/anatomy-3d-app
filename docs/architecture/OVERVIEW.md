# Architecture overview

The atlas is split at the renderer boundary. `anatomy-core` is strict TypeScript with no React, DOM, or Three.js dependency. It expresses stable identities, systems, regions, groups, hierarchy, and deterministic visibility. `anatomy-data` validates external manifests and owns curated catalog data. The web app maps visible IDs to scene objects and maps interactions back to canonical IDs.

Zustand is divided conceptually into selection, filters, navigation, visibility overrides, panel preferences, and camera commands. Pointer position and camera interpolation remain inside Three.js. The R3F canvas uses demand rendering and bounded DPR. Filter changes alter the set of objects, not catalogs or loaded assets. Language changes touch labels only.

`SkeletonModel` now loads the audited BodyParts3D GLB once through Drei's cache. Its explicit `extras.anatomyId` mappings resolve geometry to the catalog. Meshes stay mounted through filter changes, with both visibility and raycasting disabled when hidden. The three shared highlight materials are owned and disposed by the model; cached geometry stays loader-owned. The original primitive fixture has been removed.
