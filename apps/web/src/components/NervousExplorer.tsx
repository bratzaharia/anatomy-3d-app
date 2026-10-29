import { useTranslation } from "react-i18next";
import {
  getLocalizedName,
  type Locale,
  type NervousDivision,
  type NervousFunction,
} from "@anatomy/core";
import {
  NERVOUS_COVERAGE,
  NERVOUS_GROUPS,
  REGIONS,
  nervousMetadataById,
  structureById,
} from "@anatomy/data";
import { useViewerStore } from "../store/viewerStore";

export function NervousExplorer() {
  const { t, i18n } = useTranslation();
  const active = useViewerStore((state) =>
    state.activeSystemIds.has("nervous"),
  );
  const divisions = useViewerStore((state) => state.nervousDivisions);
  const functions = useViewerStore((state) => state.nervousFunctions);
  const regions = useViewerStore((state) => state.nervousRegions);
  const toggleDivision = useViewerStore((state) => state.toggleNervousDivision);
  const toggleFunction = useViewerStore((state) => state.toggleNervousFunction);
  const toggleRegion = useViewerStore((state) => state.toggleNervousRegion);
  const reset = useViewerStore((state) => state.resetNervousFilters);
  const select = useViewerStore((state) => state.select);
  if (!active) return null;
  const locale = i18n.language as Locale;
  return (
    <section
      className="panel-section nervous-explorer"
      aria-label={t("nervous.explorer")}
    >
      <h2>{t("nervous.explorer")}</h2>
      <p className="coverage-warning">{t("nervous.incomplete")}</p>
      <p className="coverage-counts">
        {t("nervous.coverage", NERVOUS_COVERAGE)}
      </p>
      <button className="restore-button" onClick={reset}>
        {t("nervous.resetFilters")}
      </button>
      <fieldset className="nervous-facets">
        <legend>{t("nervous.structural")}</legend>
        {(["cns", "pns", "associated"] as NervousDivision[]).map((id) => (
          <label key={id}>
            <input
              type="checkbox"
              checked={divisions.has(id)}
              onChange={() => toggleDivision(id)}
            />
            {t("nervous.division." + id)}
          </label>
        ))}
      </fieldset>
      <details className="nervous-facets">
        <summary>{t("nervous.functional")}</summary>
        <p className="coverage-counts">{t("nervous.filterHint")}</p>
        {(
          [
            "somatic",
            "autonomic",
            "sympathetic",
            "parasympathetic",
            "enteric",
            "sensory",
            "motor",
            "mixed",
          ] as NervousFunction[]
        ).map((id) => (
          <label key={id}>
            <input
              type="checkbox"
              checked={functions.has(id)}
              onChange={() => toggleFunction(id)}
            />
            {t("nervous.function." + id)}
          </label>
        ))}
      </details>
      <details className="nervous-facets">
        <summary>{t("nervous.regional")}</summary>
        <p className="coverage-counts">{t("nervous.filterHint")}</p>
        {REGIONS.filter((region) => region.id !== "whole-body").map(
          (region) => (
            <label key={region.id}>
              <input
                type="checkbox"
                checked={regions.has(region.id)}
                onChange={() => toggleRegion(region.id)}
              />
              {getLocalizedName(region, locale)}
            </label>
          ),
        )}
      </details>
      <button
        className="restore-button"
        onClick={() => select("nervous-brain")}
      >
        {t("nervous.brainParts")}
      </button>
      <div className="muscle-group-tree">
        {NERVOUS_GROUPS.map((group) => {
          const mapped = group.memberIds.filter(
            (id) =>
              nervousMetadataById.get(id)?.geometryStatus !== "unavailable",
          ).length;
          const grouped = group.memberIds.filter(
            (id) => nervousMetadataById.get(id)?.geometryStatus === "grouped",
          ).length;
          return (
            <details key={group.id}>
              <summary>
                {getLocalizedName(group, locale)}{" "}
                <small>
                  {t("nervous.groupCoverage", {
                    individual: mapped - grouped,
                    grouped,
                    missing: group.memberIds.length - mapped,
                  })}
                </small>
              </summary>
              <div className="explorer-members">
                {group.memberIds.map((id) => {
                  const item = structureById.get(id)!;
                  return (
                    <button key={id} onClick={() => select(id)}>
                      {getLocalizedName(item, locale)}
                      <small>
                        {item.status === "available"
                          ? t("nervous.sourcePart")
                          : t("groups.noGeometry")}
                      </small>
                    </button>
                  );
                })}
              </div>
            </details>
          );
        })}
      </div>
    </section>
  );
}
