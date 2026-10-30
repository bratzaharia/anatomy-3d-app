import { mkdir, writeFile } from "node:fs/promises";
import { BRAIN_ATLASES, BRAIN_SOURCE } from "@anatomy/data";
import { brainAtlasBlockers } from "@anatomy/core";
// A preparation job, not a registration algorithm and not runtime geometry.
// No downloading, agreement acceptance, nearest-neighbour painting or import.
const root = new URL(
  "../../docs/assets/brain-registration-plans/",
  import.meta.url,
);
await mkdir(root, { recursive: true });
for (const atlas of BRAIN_ATLASES) {
  const job = {
    version: 1,
    atlasId: atlas.id,
    source: atlas,
    target: BRAIN_SOURCE,
    runtimeApproved: false,
    blockers: brainAtlasBlockers(null, BRAIN_SOURCE.sha256),
    requiredInputs: [
      "Exact atlas release files, checksums and label lookup table",
      "Asset-specific distribution/commercial license evidence",
      "Native template and matched hemisphere surfaces with coordinate conventions",
      "BodyParts3D same-subject reference MRI and/or verified pial/spherical surface correspondence, or an explicitly separate validated atlas reference mesh",
      "Registration transform/correspondence with independent anatomical holdout landmarks",
      "Target-topology-bound label map, unknown/medial-wall mask and boundary evidence",
      "Signed hemisphere, topology, overlap and registration QA report",
    ],
    stages: [
      "Acquire permitted exact files outside runtime",
      "Decode native NIfTI/GIFTI/annot/CIFTI with format-specific tools; preserve label identities and background",
      "Establish surface correspondence or validated volume-to-surface registration; do not assume matching coordinate spaces",
      "Measure registration, coverage, hemisphere consistency and boundaries against independent anatomical evidence",
      "Pin target vertex/index hashes; split only along actual accepted labels without changing reference shape",
      "Independent neuroanatomical and license review",
      "Only then generate runtime GLB/label buffers and permit atlas rendering",
    ],
    unavailableInCurrentRepository: [
      "Same-subject cortical registration data",
      "Accepted atlas files and target correspondence",
      "Independent atlas-mapping review",
    ],
  };
  await writeFile(
    new URL(atlas.id + ".json", root),
    JSON.stringify(job, null, 2) + "\n",
  );
}
process.stdout.write(
  `Prepared ${BRAIN_ATLASES.length} blocked registration jobs; zero atlas geometry imported.\n`,
);
