import { useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  getLocalizedName,
  type Locale,
  type VenousDepth,
  type VenousViewMode,
} from "@anatomy/core";
import {
  VENOUS_COVERAGE,
  VENOUS_MANIFEST,
  VENOUS_GROUPS,
  REGIONS,
  structureById,
  venousMetadataById,
} from "@anatomy/data";
import { useViewerStore } from "../store/viewerStore";
export function VenousExplorer() {
  const { t, i18n } = useTranslation(),
    locale = i18n.language as Locale;
  const active = useViewerStore((s) => s.activeSystemIds.has("venous"));
  const groups = useViewerStore((s) => s.venousGroups),
    depths = useViewerStore((s) => s.venousDepths),
    regions = useViewerStore((s) => s.venousRegions),
    opacity = useViewerStore((s) => s.venousOpacity),
    mode = useViewerStore((s) => s.venousMode),
    snapshot = useViewerStore((s) => s.venousSnapshot);
  const all = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (all.current)
      all.current.indeterminate =
        groups.size > 0 && groups.size < VENOUS_GROUPS.length;
  }, [groups, active]);
  if (!active) return null;
  const store = useViewerStore.getState();
  return (
    <section className="venous-explorer" aria-label={t("venous.title")}>
      <details open>
        <summary>
          <h3>{t("venous.title")}</h3>
        </summary>
        <p className="coverage-counts">
          {t("venous.coverage", VENOUS_COVERAGE)}
        </p>
        <p className="coverage-warning">{t("venous.review")}</p>
        <label className="venous-check">
          <input
            ref={all}
            type="checkbox"
            checked={groups.size === VENOUS_GROUPS.length}
            onChange={(e) => store.setAllVenousGroups(e.target.checked)}
          />
          {t("venous.all")}
        </label>
        <details className="venous-facets">
          <summary>{t("venous.regions")}</summary>
          {VENOUS_MANIFEST.groups.map((g) => (
            <label className="venous-check" key={g.key}>
              <input
                type="checkbox"
                checked={groups.has(g.key)}
                onChange={() => store.toggleVenousGroup(g.key)}
              />
              {getLocalizedName(g, locale)}
            </label>
          ))}
          {REGIONS.filter((r) => r.id !== "whole-body").map((r) => (
            <label className="venous-check" key={r.id}>
              <input
                type="checkbox"
                checked={regions.has(r.id)}
                onChange={() => store.toggleVenousRegion(r.id)}
              />
              {getLocalizedName(r, locale)}
            </label>
          ))}
        </details>
        <details className="venous-facets">
          <summary>{t("venous.depth")}</summary>
          {(
            ["superficial", "deep", "perforating", "unknown"] as VenousDepth[]
          ).map((id) => (
            <label className="venous-check" key={id}>
              <input
                type="checkbox"
                checked={depths.has(id)}
                onChange={() => store.toggleVenousDepth(id)}
              />
              {t("venous." + id)}
            </label>
          ))}
          <p className="coverage-counts">{t("venous.filterHint")}</p>
        </details>
        <div
          className="venous-modes"
          role="radiogroup"
          aria-label={t("venous.mode")}
        >
          {(["standard", "blue", "depth", "contrast"] as VenousViewMode[]).map(
            (id) => (
              <button
                key={id}
                role="radio"
                aria-checked={mode === id}
                onClick={() => store.setVenousMode(id)}
              >
                <span className={"venous-swatch " + id} aria-hidden="true" />
                {t("venous.mode." + id)}
              </button>
            ),
          )}
        </div>
        <p className="coverage-counts">{t("venous.modeNote")}</p>
        <label className="venous-opacity">
          {t("venous.opacity")} <output>{Math.round(opacity * 100)}%</output>
          <input
            aria-label={t("venous.opacity")}
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={opacity}
            onChange={(e) => store.setVenousOpacity(Number(e.target.value))}
          />
        </label>
        <button
          className="restore-button"
          onClick={() =>
            snapshot ? store.restoreVenous() : store.inspectVenous()
          }
        >
          {t(snapshot ? "venous.restore" : "venous.isolate")}
        </button>
        <p className="coverage-counts">{t("venous.multi")}</p>
        <details className="venous-inventory">
          <summary>{t("venous.inventory")}</summary>
          {VENOUS_GROUPS.map((group) => (
            <details key={group.id}>
              <summary>
                {getLocalizedName(group, locale)}{" "}
                <small>
                  {
                    group.memberIds.filter(
                      (id) => venousMetadataById.get(id)?.assetId,
                    ).length
                  }
                  /{group.memberIds.length}
                </small>
              </summary>
              <div className="explorer-members">
                {group.memberIds.map((id) => {
                  const s = structureById.get(id)!;
                  return (
                    <button key={id} onClick={() => store.selectVein(id)}>
                      {getLocalizedName(s, locale)}
                      <small>
                        {t(
                          s.status === "available"
                            ? "venous.available"
                            : "venous.missing",
                        )}
                      </small>
                    </button>
                  );
                })}
              </div>
            </details>
          ))}
        </details>
      </details>
    </section>
  );
}
