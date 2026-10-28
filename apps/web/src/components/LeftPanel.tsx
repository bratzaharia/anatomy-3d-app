import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Locale } from "@anatomy/core";
import { getLocalizedName, isAllSelected } from "@anatomy/core";
import {
  AVAILABLE_SYSTEM_IDS,
  REGIONS,
  searchStructures,
  SYSTEMS,
} from "@anatomy/data";
import { useViewerStore } from "../store/viewerStore";
import { Icon } from "./Icon";
import { MuscleExplorer } from "./MuscleExplorer";

export function LeftPanel() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language as Locale;
  const activeSystemIds = useViewerStore((state) => state.activeSystemIds);
  const activeRegionId = useViewerStore((state) => state.activeRegionId);
  const toggleSystem = useViewerStore((state) => state.toggleSystem);
  const replaceSystems = useViewerStore((state) => state.replaceSystems);
  const select = useViewerStore((state) => state.select);
  const setRegion = useViewerStore((state) => state.setRegion);
  const [query, setQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const results = useMemo(
    () => searchStructures(query, locale),
    [query, locale],
  );
  const allChecked = isAllSelected(AVAILABLE_SYSTEM_IDS, activeSystemIds);

  return (
    <aside className="side-panel left-panel" aria-label={t("nav.regions")}>
      <div className="panel-scroll">
        <section className="search-section">
          <label className="sr-only" htmlFor="anatomy-search">
            {t("search.label")}
          </label>
          <div className="search-field">
            <Icon name="search" />
            <input
              id="anatomy-search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setShowResults(true);
              }}
              onFocus={() => setShowResults(true)}
              placeholder={t("search.placeholder")}
            />
          </div>
          {showResults && query && (
            <div className="search-results">
              {results.length ? (
                results.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      select(item.id);
                      setShowResults(false);
                    }}
                  >
                    {getLocalizedName(item, locale)}
                    <small>{item.latinName}</small>
                    {item.status !== "available" && (
                      <small>{t("groups.noGeometry")}</small>
                    )}
                  </button>
                ))
              ) : (
                <p>{t("search.noResults")}</p>
              )}
            </div>
          )}
        </section>

        <section className="panel-section">
          <div className="section-heading">
            <Icon name="body" />
            <h2>{t("nav.regions")}</h2>
          </div>
          <nav className="region-list">
            {REGIONS.map((region) => (
              <button
                key={region.id}
                className={activeRegionId === region.id ? "active" : ""}
                disabled={region.status !== "available"}
                onClick={() => setRegion(region.id)}
              >
                <span className="region-marker" />
                <span>{getLocalizedName(region, locale)}</span>
                {region.status !== "available" && (
                  <small>{t("nav.planned")}</small>
                )}
              </button>
            ))}
          </nav>
        </section>

        <section className="panel-section">
          <div className="section-heading">
            <Icon name="layers" />
            <h2>{t("filters.title")}</h2>
            <span className="section-count">
              {activeSystemIds.size}/{AVAILABLE_SYSTEM_IDS.length}
            </span>
          </div>
          <label className="filter-row all-row">
            <input
              type="checkbox"
              checked={allChecked}
              onChange={() =>
                replaceSystems(allChecked ? [] : AVAILABLE_SYSTEM_IDS)
              }
            />
            <span className="custom-check" />
            <span>{t("filters.all")}</span>
          </label>
          <div className="filter-list">
            {SYSTEMS.map((system) => (
              <label
                key={system.id}
                className={`filter-row ${system.available ? "" : "disabled"}`}
              >
                <input
                  type="checkbox"
                  disabled={!system.available}
                  checked={activeSystemIds.has(system.id)}
                  onChange={() => toggleSystem(system.id)}
                />
                <span
                  className="custom-check"
                  style={
                    { "--filter-color": system.color } as React.CSSProperties
                  }
                />
                <span>{getLocalizedName(system, locale)}</span>
                {!system.available && <small>{t("common.planned")}</small>}
              </label>
            ))}
          </div>
        </section>

        <MuscleExplorer />
        <section className="panel-section presets">
          <h2>{t("filters.presets")}</h2>
          <div className="preset-grid">
            <button onClick={() => replaceSystems(["skeletal"])}>
              {t("filters.bonesOnly")}
            </button>
            <button
              onClick={() => useViewerStore.getState().restoreVisibility()}
            >
              {t("inspector.restore")}
            </button>
          </div>
        </section>
      </div>
    </aside>
  );
}
