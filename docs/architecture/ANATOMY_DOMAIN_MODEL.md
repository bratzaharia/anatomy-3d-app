# Anatomy domain model

Every structure has a stable kebab-case ID, curated English and Romanian names, optional Latin name and synonyms, one or more system and region IDs, an explicit structure type, laterality, asset references, availability, and provenance. Systems, structure types, regions, groups, geometry assets, and educational content are separate concepts.

Groups reference structure IDs and derive their displayed members from the catalog. Group counts therefore cannot drift or invent members. Hierarchy validation rejects missing parents and cycles. Geometry can map multiple meshes to one anatomy ID; display names and arbitrary mesh names are never identities.

The current catalog derives 29 entities from the validated BodyParts3D skeletal manifest. It preserves source FMA concepts and FJ mesh IDs separately from canonical application IDs. Aggregated structures (skull, vertebrae, ribs/sternum, hips, hands, and feet) have a `bone-group` structure type and explicit grouped-selection UI; individual long bones remain independent. All adapted content remains unreviewed pending qualified medical review.
