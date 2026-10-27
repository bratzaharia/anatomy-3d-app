# ADR 0004: sourced skeletal geometry

Accepted 2026-10-27. Supersedes the fixture delivery decision in ADR 0001 for the active viewer.

The user requested real bones. We imported a curated subset directly from the official BodyParts3D 4.0 PART-OF archive after checking its current CC BY 4.0 distribution license. Broad source skeleton membership is unsuitable as an inclusion list because it contains unrelated tissues and omits limb bones. The importer therefore resolves explicit named bone concepts through the official FMA-to-element table.

202 source element meshes map to 29 canonical selectable bones/groups. Groups preserve an honest interaction boundary for skull, spine, ribs, hands, and feet; a later revision may expose their separately mapped source concepts. Existing skull/humerus/femur IDs remain stable. Placeholder soft-tissue geometry is removed and those systems remain planned.

The GLB retains every vertex and triangle from the selected reduced-detail source release. Lossless Meshopt compression is verified by byte-for-byte buffer round trips during import. It reduces the raw asset from about 12.99 MB to 7.13 MB, without simplification or quantization. A local GLB and attribution file avoid external runtime asset dependencies. Independent medical review remains a documented next step.
