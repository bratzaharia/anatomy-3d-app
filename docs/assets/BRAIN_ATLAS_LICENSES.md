# Brain assets and atlas licensing decisions

Audit date: 2026-10-30. No new model or atlas dataset is imported. No proprietary
application resources are extracted; no purchases, messages or agreement acceptance.

## Accepted existing geometry and derived previews

BodyParts3D 4.0 source GLB SHA:
`05da6e823b3157b1c61e66b5dde0e4ab6f41de5d7948ba9ebae5afa60e7c8d14`.
[Official source](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html),
[publisher CC BY 4.0 notice](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html).
Existing attribution and embedded license metadata stay intact. Runtime material
colors are app presentation changes, not new anatomical labels. The two square
preview PNGs are rendered captures of these same source parts: Natural material
and conventional source-category colors. The Advanced card uses Natural, not
fabricated atlas artwork. Visible source attribution applies to these derivatives.

Credit: BodyParts3D, © The Database Center for Life Science licensed under
CC Attribution 4.0 International. No textures or images from the research pages
are copied. Source geometry, topology and transforms are unchanged.

## Candidate-only decisions

| Candidate      | Evidence consulted                                                                                                                                       | Current acceptance                                                                                                                                                                      |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DK / Destrieux | [FreeSurfer license](https://surfer.nmr.mgh.harvard.edu/fswiki/FreeSurferSoftwareLicense)                                                                | MGH terms describe reuse with required notices and preservation of third-party rights. Exact release/data files and bundled third-party notices still need review; no runtime approval. |
| Yeo 7 / 17     | [Original distribution documentation](https://surfer.nmr.mgh.harvard.edu/fswiki/CorticalParcellation_Yeo2011)                                            | Data are described in multiple spaces; exact archive terms must be checked, not inferred solely from the FreeSurfer software license.                                                   |
| HCP-MMP1.0     | [Original BALSA study and access terms](https://balsa.wustl.edu/study/show/RVVG)                                                                         | Open Access terms require specific obligations, attribution and preservation of terms on redistributed derivatives. No user agreement accepted or data downloaded; approval pending.    |
| Allen AHRAv2   | [Atlas documentation](https://alleninstitute.github.io/CCF-MAP/descriptions/human_ccf.html), [site terms](https://alleninstitute.org/legal/terms-of-use) | Exact annotation/template asset terms and intended product rights not accepted or pinned; pending.                                                                                      |
| Brainnetome    | [Download-page legal agreement](https://atlas.brainnetome.org/download.html)                                                                             | Published free terms are non-commercial; intended commercial use needs separate permission. Do not import by default.                                                                   |

This is an engineering provenance record, not legal advice or a blanket license
for future datasets. A future exact-file audit must include URL, version, hash,
distribution/derivative terms, commercial use and required notices before runtime.
