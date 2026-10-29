# Attribution

BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International.

- Source: [official BodyParts3D 4.0 download](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html).
- License: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) under the [current official distribution terms](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html).
- Adaptations: curated bone subset, OBJ-to-GLB conversion, coordinate and scale normalization, smooth normals, semantic grouping, bone material, lossless Meshopt compression. No extra decimation or quantization.
- Attribution is also shipped at `public/models/bodyparts3d-attribution.txt` and visible from the viewer.

Source publication: Mitsuhashi et al., “BodyParts3D: 3D structure database for anatomical concepts,” Nucleic Acids Research, DOI [10.1093/nar/gkn613](https://doi.org/10.1093/nar/gkn613). Neither DBCLS nor the authors are claimed to endorse this application. Independent medical and Romanian terminology review of this adaptation remains pending.

# Muscular adaptation

`bodyparts3d-muscles.glb`: BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International. Source: official BodyParts3D 4.0 IS-A OBJ 99 archive. Changes: curated muscular identities, named-subdivision assembly, coordinate/unit conversion, smooth normals and lossless Meshopt GLB compression. No additional decimation, invented placement or new mirroring. Source-supplied mirrored element meshes remain explicitly traceable. The source, license and every adapted element checksum are recorded in `muscle-manifest.json`; notices ship beside the asset.

The Z-Anatomy muscular candidate is not included in runtime assets. Its separate attribution/share-alike and third-party license conditions are recorded in the muscular candidate audit. FIPAT TA2 is the terminology reference for the editorial inventory, not a claim of FIPAT endorsement or an official Romanian translation.

# Nervous adaptation — partial

`bodyparts3d-nervous.glb`: BodyParts3D, © The Database Center for Life Science
licensed under CC Attribution 4.0 International. Official BodyParts3D 4.0 IS-A
OBJ 99 archive; source version and per-element checksums are recorded in
`nervous-manifest.json`. Adaptations: curated neural identities, coordinate/unit
conversion, smooth normals and lossless Meshopt compression. No synthesized
trajectories, mirroring, extra decimation or deformation. Notices ship beside the
asset in `bodyparts3d-nervous-attribution.txt` and remain visible in the atlas.
Independent medical and Romanian terminology review is pending. The inventory
does not imply complete full-body geometry. See [audit](NERVOUS_AUDIT.md).

## Peripheral Z-Anatomy adaptation — partial

`z-nervous-trunk.glb`, `z-nervous-cranial.glb`, `z-nervous-upper-limbs.glb`, `z-nervous-lower-limbs.glb`: Z-Anatomy — Gauthier Kervyn, Lluís Vinent Juanico and contributors; based on BodyParts3D, © DBCLS (historic CC BY-SA 2.1 Japan). Peripheral adaptations distributed under CC BY-SA 4.0. Cranial source: University of Dundee, CAHID, CC BY 4.0. Changes: curated peripheral source subset, canonical semantic mapping, source-only 190-bone-proxy pose transfer, exact-position welding, recomputed normals, lossless Meshopt GLB conversion. No NC inner-ear/kidney or ambiguous Washington brain/white-matter content included; no source textures redistributed. Source/version and license links ship in z-nervous-attribution.txt, GLB metadata, the manifest and viewer. No source author endorsement or medical approval is implied.
