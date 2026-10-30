import { useId, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { getLocalizedName, type Locale } from "@anatomy/core";
import {
  ANATOMY_COVERAGE,
  summarizeCoverage,
  systemById,
  type CoverageSystem,
} from "@anatomy/data";
import { useViewerStore } from "../store/viewerStore";
const systems: readonly CoverageSystem[] = [
  "skeletal",
  "muscular",
  "nervous",
  "venous",
];
const normalize = (s: string) =>
  s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
export function CoveragePanel() {
  const fieldId = useId();
  const { t, i18n } = useTranslation();
  const locale = i18n.language as Locale;
  const region = useViewerStore((state) => state.activeRegionId);
  const select = useViewerStore((state) => state.select);
  const [system, setSystem] = useState<CoverageSystem>("skeletal");
  const [status, setStatus] = useState("gaps");
  const [query, setQuery] = useState("");
  const regional = useMemo(
    () =>
      ANATOMY_COVERAGE.filter(
        (e) =>
          region === "whole-body" || e.structure.regionIds.includes(region),
      ),
    [region],
  );
  const entries = useMemo(
    () =>
      regional.filter(
        (e) =>
          e.system === system &&
          (status === "all" ||
            e.status === "missing" ||
            e.status === "grouped-only") &&
          normalize(
            [
              getLocalizedName(e.structure, locale),
              e.structure.latinName ?? "",
              e.structure.id,
            ].join(" "),
          ).includes(normalize(query)),
      ),
    [regional, system, status, query, locale],
  );
  return (
    <section
      className="panel-section coverage-panel"
      aria-label={t("coverage.title")}
    >
      <details>
        <summary>
          <h2>{t("coverage.title")}</h2>
        </summary>
        <p className="coverage-warning">{t("coverage.scope")}</p>
        <p className="coverage-counts">{t("coverage.regional")}</p>
        <dl className="coverage-summary">
          {systems.map((id) => {
            const count = summarizeCoverage(
              regional.filter((e) => e.system === id),
            );
            return (
              <div key={id}>
                <dt>{getLocalizedName(systemById.get(id)!, locale)}</dt>
                <dd>{t("coverage.counts", count)}</dd>
              </div>
            );
          })}
        </dl>
        <label htmlFor={fieldId + "-system"}>{t("coverage.system")}</label>
        <select
          id={fieldId + "-system"}
          value={system}
          onChange={(e) => setSystem(e.target.value as CoverageSystem)}
        >
          {systems.map((id) => (
            <option key={id} value={id}>
              {getLocalizedName(systemById.get(id)!, locale)}
            </option>
          ))}
        </select>
        <label htmlFor={fieldId + "-filter"}>{t("coverage.filter")}</label>
        <select
          id={fieldId + "-filter"}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="gaps">{t("coverage.gaps")}</option>
          <option value="all">{t("coverage.all")}</option>
        </select>
        <label htmlFor={fieldId + "-search"}>{t("coverage.search")}</label>
        <input
          id={fieldId + "-search"}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <p className="coverage-counts">
          {t("coverage.results", { count: entries.length })}
        </p>
        <div className="explorer-members coverage-members">
          {entries.map((entry) => (
            <button
              key={entry.structure.id}
              onClick={() => select(entry.structure.id)}
            >
              {getLocalizedName(entry.structure, locale)}
              <small>{t("coverage.status." + entry.status)}</small>
              {entry.reason && (
                <small>{t("coverage.reason." + entry.reason)}</small>
              )}
            </button>
          ))}
        </div>
      </details>
    </section>
  );
}
