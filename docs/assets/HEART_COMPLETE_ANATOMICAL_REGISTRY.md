# Defined cardiac registry — not a completeness certificate

The authoritative machine-readable inventory is
`packages/anatomy-data/src/heart-manifest.json`. It records 30 accepted source
parts, FMA IDs, exact publisher source tables, source file hashes, geometry hashes,
bounds, triangle counts, source representation and separate geometry/medical/
translation review states. FMA codes are publisher identifiers, not invented
Terminologia Anatomica codes. All RO/Latin terminology awaits qualified review.

| Accepted category          | Separately selectable source parts | Limits                                                         |
| -------------------------- | ---------------------------------: | -------------------------------------------------------------- |
| Walls                      |                                  3 | Two atrial walls and one unsegmented source heart-wall region  |
| Cavity boundaries          |                                  4 | Lumen/volume surfaces, **not myocardial or endocardial walls** |
| Valve leaflets/cusps       |                                 11 | 3 tricuspid, 2 mitral, 3 pulmonary, 3 aortic source parts      |
| Papillary components       |                                  5 | Publisher-specific decomposition, not a complete apparatus     |
| Coronary artery parts      |                                  5 | Partial trunks/branches; source posterior descending variant   |
| Great arterial connections |                                  2 | Ascending aorta and pulmonary trunk only                       |

The root heart and four valve selectors are aggregate identities, **not five extra
meshes**. Related venous entries stay in the existing venous registry and do not
increase the cardiac-source mesh count.

The source `FMA86212` contains FJ2428 plus the two atrial walls. The importer selects
only its exact FJ2428 component and records this source subset; it does not split
that surface into left/right ventricular walls. It must not be renamed as a
complete left/right myocardium. IS-A `FMA7264` maps the remaining papillary part
separately from its `FMA7265` head; no overlapping PART-OF parent mesh is imported.

Missing registry entries cover endocardium, epicardium, pericardium, septa,
chordae, moderator band, coronary-sinus ostium/valve, smallest cardiac veins and
conduction tissue. This is a scoped initial target list, not an exhaustive count
of all missing cardiac anatomy. Additional unsegmented/unaccepted targets include
surface landmarks and sulci, auricles, crista terminalis/pectinate muscles/fossa
ovalis, complete ventricular walls/trabeculae, all valve annuli/root/ostia details,
serous/fibrous pericardial layers, full coronary branches and venous variations.

Do not infer any of those structures from proximity, colors, cavity surfaces or
uncapped clipping. The collection is an educational source subset, not a patient
reference or an anatomically complete model.
