import { useState } from "react";
import { useTranslation } from "react-i18next";
import { getLocalizedName, type Locale } from "@anatomy/core";
import {
  MUSCLE_GROUPS,
  MUSCLE_STRUCTURES,
  MUSCLE_COVERAGE,
  muscleMetadataById,
} from "@anatomy/data";
import { useViewerStore } from "../store/viewerStore";

export function MuscleExplorer() {
  const { t, i18n } = useTranslation();
  const region = useViewerStore((state) => state.activeRegionId);
  const select = useViewerStore((state) => state.select);
  const opacity = useViewerStore((state) => state.muscleOpacity);
  const setOpacity = useViewerStore((state) => state.setMuscleOpacity);
  const active = useViewerStore((state) =>
    state.activeSystemIds.has("muscular"),
  );
  const [depth, setDepth] = useState("all");
  return (
    <section
      className="panel-section muscle-explorer"
      aria-label={t("muscles.explorer")}
    >
      <h2>{t("muscles.explorer")}</h2>
      <p className="coverage-warning">{t("muscles.incomplete")}</p>
      <p className="coverage-counts">
        {t("muscles.coverage", MUSCLE_COVERAGE)}
      </p>
      <label className="opacity-control">
        {t("muscles.opacity")}{" "}
        <span className="opacity-value">{Math.round(opacity * 100)}%</span>
        <input
          aria-label={t("muscles.opacity")}
          type="range"
          min="0"
          max="100"
          step="5"
          value={Math.round(opacity * 100)}
          disabled={!active}
          onChange={(event) => setOpacity(Number(event.target.value) / 100)}
        />
      </label>
      <label className="depth-control">
        {t("muscles.depth")}
        <select
          value={depth}
          onChange={(event) => setDepth(event.target.value)}
        >
          {["all", "superficial", "intermediate", "deep", "mixed"].map(
            (value) => (
              <option key={value} value={value}>
                {t("muscles.depth." + value)}
              </option>
            ),
          )}
        </select>
      </label>
      <div className="muscle-group-tree">
        {MUSCLE_GROUPS.map((group) => {
          const members = MUSCLE_STRUCTURES.filter(
            (item) =>
              group.memberIds.includes(item.id) &&
              (region === "whole-body" || item.regionIds.includes(region)) &&
              (depth === "all" ||
                muscleMetadataById.get(item.id)?.depth === depth),
          );
          if (!members.length) return null;
          return (
            <details key={group.id}>
              <summary>
                {getLocalizedName(group, i18n.language as Locale)}{" "}
                <small>{members.length}</small>
              </summary>
              <div className="explorer-members">
                {members.map((member) => (
                  <button key={member.id} onClick={() => select(member.id)}>
                    {getLocalizedName(member, i18n.language as Locale)}
                    {member.status !== "available" && (
                      <small>
                        {t(
                          muscleMetadataById.get(member.id)?.mappingStatus ===
                            "grouped-only"
                            ? "muscles.groupedOnly"
                            : "groups.noGeometry",
                        )}
                      </small>
                    )}
                  </button>
                ))}
              </div>
            </details>
          );
        })}
      </div>
    </section>
  );
}
