import { writeFile } from "node:fs/promises";
import { format } from "prettier";
import {
  ANATOMY_COVERAGE,
  REGIONS,
  summarizeCoverage,
  type CoverageSystem,
} from "@anatomy/data";
const root = new URL("../../", import.meta.url);
const systems: CoverageSystem[] = ["skeletal", "muscular", "nervous"];
const report = {
  scope:
    "Defined catalogs only, not medically certified exhaustive human anatomy. Bones use a conventional adult scope, excluding teeth and accessory/variable bones. Muscle and nerve catalogs are editorial and include source sets. No clinical validation is implied by counts.",
  clinicallyReviewed: false,
  addedGeometry: false,
  existingBoneIdentitiesMadeIndividuallySelectable: 157,
  systems: systems.map((system) => ({
    system,
    ...summarizeCoverage(ANATOMY_COVERAGE.filter((e) => e.system === system)),
    regions: REGIONS.filter((r) => r.id !== "whole-body").map((r) => ({
      region: r.id,
      ...summarizeCoverage(
        ANATOMY_COVERAGE.filter(
          (e) => e.system === system && e.structure.regionIds.includes(r.id),
        ),
      ),
    })),
  })),
  gaps: ANATOMY_COVERAGE.filter((e) => e.reason).map((e) => ({
    id: e.structure.id,
    system: e.system,
    names: e.structure.names,
    regions: e.structure.regionIds,
    status: e.status,
    reason: e.reason,
    source: e.structure.provenance[0]!.sourceUrl,
    assetIds: e.structure.assetIds,
  })),
};
await writeFile(
  new URL("docs/assets/SYSTEM_COVERAGE.json", root),
  await format(JSON.stringify(report), { parser: "json" }),
);
const lines = [
  "# Defined-system coverage audit — 2026-10-29",
  "",
  report.scope,
  "",
  "This change recovers individual picking/focus/hide/isolation for 157 already present bone concepts, corrects maxillary-branch classification, and makes gaps inspectable in RO/EN. It does not acquire or invent missing anatomy.",
  "",
  "| System | Individual | Source sets | Grouped only | Missing accepted geometry | Defined entries |",
  "| --- | ---: | ---: | ---: | ---: | ---: |",
  ...report.systems.map(
    (s) =>
      `| ${s.system} | ${s.individual} | ${s.sets} | ${s.groupedOnly} | ${s.missing} | ${s.total} |`,
  ),
  "",
  "No logical parents are counted again as individual bones. 202 bone source meshes represent 199 available bone concepts, not 202 separate adult bones. Source sets are not counted as individual muscles/nerves. Regional nerve counts can overlap and must not be summed.",
  "",
  "## Unavailable or grouped-only entries",
  "",
  "| System | Stable ID | English | Romanian | Status / reason |",
  "| --- | --- | --- | --- | --- |",
  ...report.gaps.map(
    (g) =>
      `| ${g.system} | ${g.id} | ${g.names.en} | ${g.names.ro} | ${g.status} / ${g.reason} |`,
  ),
  "",
  "## Remaining work",
  "",
  "- Skeletal: obtain license-cleared, compatible coccyx and bilateral auditory-ossicle surfaces. Z-Anatomy candidates are not automatically accepted; registration and inner-ear subasset rights need review.",
  "- Muscular: 143 gaps include facial/masticatory, abdominal, intrinsic back, perineal/sex-specific and some distal muscles; four side-conflicting concepts remain quarantined. Twenty-two hand members remain represented only by named sets. The old 355-mesh muscular GLB is unchanged.",
  "- Nervous: 163 gaps remain, including the cord, 62 individually numbered spinal nerves and the vestibulocochlear pair. Keep the HRA cord candidate and estimated SPARC reconstruction outside runtime until their documented gates are resolved. Retired overlapping cranial variants are not silently re-enabled.",
  "- All systems: qualified anatomical/RO terminology review, physical-device measurements and source completeness remain necessary. The inventories are not certified exhaustive.",
  "",
  "Reproduce with `node --import tsx tools/anatomy-assets/report-system-coverage.ts`. See [partition implementation and verification](SKELETAL_PARTITION_AUDIT.md), [muscular audit](MUSCLE_AUDIT.md), [neural coverage](NERVOUS_GEOMETRY_COVERAGE.md) and [HRA quarantine](HRA_SPINAL_REGISTRATION.md).",
  "",
];
await writeFile(
  new URL("docs/assets/SYSTEM_COVERAGE.md", root),
  await format(lines.join("\n"), { parser: "markdown" }),
);
process.stdout.write(
  JSON.stringify(
    report.systems.map(
      ({ system, total, individual, sets, groupedOnly, missing }) => ({
        system,
        total,
        individual,
        sets,
        groupedOnly,
        missing,
      }),
    ),
  ) + "\n",
);
