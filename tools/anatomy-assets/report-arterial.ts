import { writeFile } from "node:fs/promises";
import { format } from "prettier";
import {
  ARTERIAL_COVERAGE,
  ARTERIAL_GEOMETRY,
  ARTERIAL_EDGES,
  ARTERIAL_MANIFEST,
  ARTERIAL_STRUCTURES,
} from "@anatomy/data";
const report = {
  complete: false,
  scope:
    "Initial curated source records plus missing target families; not an exhaustive vessel denominator",
  source: ARTERIAL_MANIFEST.sourceUrl,
  license: ARTERIAL_MANIFEST.licenseId,
  registration: ARTERIAL_MANIFEST.registration,
  individual: ARTERIAL_COVERAGE.filter((s) => s.geometry === "individual")
    .length,
  sourceSets: ARTERIAL_COVERAGE.filter((s) => s.geometry === "set").length,
  missingTargetFamilies: ARTERIAL_MANIFEST.missing.length,
  qualifiedMedicalApprovals: 0,
  records: ARTERIAL_COVERAGE.map((s) => ({
    ...s,
    regions: ARTERIAL_STRUCTURES.find((p) => p.id === s.id)?.regionIds ?? [],
    source: ARTERIAL_MANIFEST.sourceUrl,
    license: ARTERIAL_MANIFEST.licenseId,
    laterality: arterial(s.id)?.laterality ?? null,
    terminologyId: arterial(s.id)?.terminologyId ?? null,
    sourceFiles: arterial(s.id)?.sourceFiles ?? [],
    originEdges: ARTERIAL_EDGES.filter((e) => e.to === s.id),
    branchEdges: ARTERIAL_EDGES.filter((e) => e.from === s.id),
    centerlineAvailable: false,
    territoryMapAvailable: false,
    reviewer: null,
    reviewDate: null,
  })),
};
function arterial(id: string) {
  return ARTERIAL_GEOMETRY.find((s) => s.id === id);
}
if (process.argv.includes("--write"))
  await writeFile(
    new URL("../../docs/assets/arterial-coverage.json", import.meta.url),
    await format(JSON.stringify(report), { parser: "json" }),
  );
process.stdout.write(
  JSON.stringify({
    individual: report.individual,
    sourceSets: report.sourceSets,
    missingTargetFamilies: report.missingTargetFamilies,
    clinicalApproval: false,
  }) + "\n",
);
