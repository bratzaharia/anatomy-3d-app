# Anatomy domain model

Every structure has a stable kebab-case ID, curated English and Romanian names, optional Latin name and synonyms, one or more system and region IDs, an explicit structure type, laterality, asset references, availability, and provenance. Systems, structure types, regions, groups, geometry assets, and educational content are separate concepts.

Groups reference structure IDs and derive their displayed members from the catalog. Group counts therefore cannot drift or invent members. Hierarchy validation rejects missing parents and cycles. Geometry can map multiple meshes to one anatomy ID; display names and arbitrary mesh names are never identities.

The immutable skeletal manifest still has 29 root entities. The catalog adds 21
skull children and 157 source-exact children of the spine, rib/sternum, hip, hand
and foot groups, without changing the GLB. FMA concepts and FJ file IDs stay
separate from stable application IDs. Logical parents retain group operations;
children have individual selection/focus/visibility. Seven absent bone identities
remain unavailable and have no asset. Within the defined conventional adult-bone
scope there are 199 mapped bone concepts, not 202 individual bones: several
concepts span multiple source meshes. Teeth and accessory/variable bones are
outside this scope. All adapted content remains medically unreviewed.

Rendering coalesces adjacent equally styled source triangle ranges, so default
draw counts are unchanged. The same ranges govern material-array raycasting;
hidden children do not have invisible picking proxies. Source byte hashes and
complete parent partitions are validated independently of UI labels.

The shared coverage inventory excludes logical bone parents from individual
counts and distinguishes individual geometry, source sets, grouped-only members
and unavailable entries for all three systems. It is derived from the effective
runtime catalogs, not an assertion of exhaustive or clinically verified anatomy.
