# Venous asset licenses and provenance

Checked 2026-10-29. Decision: **accept sourced educational surfaces, pending
independent anatomical/terminology review**. Medical approval is not implied.

## Runtime source

[BodyParts3D 4.0 official download](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html)
and [publisher license](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html).
The publisher currently permits access, redistribution and adaptations under
CC BY 4.0 with attribution. This includes commercial reuse under that license;
it is not a medical-quality warranty. Older OBJ header notices are retained in
source cache; the current publisher license notice and its hash are recorded.

Required credit:

> BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International

The new GLBs embed this copyright, include a distributed attribution text file,
and retain the app's visible source/license links. Source release, URL, per-file
SHA-256, metadata/license hashes, transformations, derived bytes and checksums are
in `packages/anatomy-data/src/venous-manifest.json`. Reimports reject changed
previously pinned metadata or surfaces. The ignored cache is not a runtime asset
or a substitute for distributed attribution.

Modifications: curated source mapping, units/proper rotation, regional packing,
regenerated normals, lossless Meshopt compression. Source triangles are not
remodelled, welded or simplified further; no proprietary textures are used.

## Terminology and drainage references

- [FIPAT terminology framework](https://ifaa.net/committees/anatomical-terminology-fipat/fipat-ifaa-terminologies/).
  FMA IDs come only from publisher tables. Missing terminology IDs remain null;
  Latin/RO labels are preliminary and explicitly awaiting qualified review.
- [OpenStax circulation reference](https://openstax.org/books/anatomy-and-physiology-2e/pages/20-5-circulatory-pathways)
  and [NCBI coronary sinus reference](https://www.ncbi.nlm.nih.gov/books/NBK557566/).
  Only curated factual anatomical relationships and citations are represented;
  no textbook figures, copied prose, model files or clinical advice are imported.
  These references' content licenses are **not** asserted to be the CC BY 4.0
  license of the BodyParts3D surfaces.

## Excluded sources

No Catfish application resource was extracted. No paid supplier was purchased
or licensed by this change. Z-Anatomy, Sketchfab and marketplace candidates have
not been approved for this venous runtime. Candidate material needs exact-file
license evidence, independent registration and overlap review before acceptance.
