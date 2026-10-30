import { useTranslation } from "react-i18next";
import type { Locale } from "@anatomy/core";
import { getLocalizedName, resolveVenousStructureIds } from "@anatomy/core";
import {
  regionById,
  structureById,
  SKELETON_ASSET,
  MUSCLE_ASSET,
  SKELETAL_STRUCTURES,
  NERVOUS_GEOMETRY,
  VENOUS_ASSETS,
  VENOUS_GEOMETRY,
  VENOUS_STRUCTURES,
  CARDIAC_GEOMETRY,
} from "@anatomy/data";
import { useViewerStore, type CameraView } from "../store/viewerStore";
import { Icon } from "./Icon";

export function ViewerOverlay({
  supported = true,
}: {
  readonly supported?: boolean;
}) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language as Locale;
  const activeRegionId = useViewerStore((state) => state.activeRegionId);
  const hoveredId = useViewerStore((state) => state.hoveredId);
  const cardiac = useViewerStore((state) => state.cardiacEnabled);
  const activeCount = useViewerStore(
    (state) => state.activeSystemIds.size + (state.cardiacEnabled ? 1 : 0),
  );
  const setCameraView = useViewerStore((state) => state.setCameraView);
  const assetStatus = useViewerStore((state) => state.assetStatus);
  const muscleStatus = useViewerStore((state) => state.muscleStatus);
  const muscular = useViewerStore((state) =>
    state.activeSystemIds.has("muscular"),
  );
  const skeletal = useViewerStore((state) =>
    state.activeSystemIds.has("skeletal"),
  );
  const hovered = hoveredId ? structureById.get(hoveredId) : undefined;
  const nervous = useViewerStore((state) =>
    state.activeSystemIds.has("nervous"),
  );
  const nervousStatus = useViewerStore((state) => state.nervousStatus);
  const venous = useViewerStore((state) => state.activeSystemIds.has("venous"));
  const venousStatus = useViewerStore((state) => state.venousAssetStatus);
  const systems = useViewerStore((state) => state.activeSystemIds);
  const hiddenIds = useViewerStore((state) => state.hiddenIds);
  const isolatedIds = useViewerStore((state) => state.isolatedIds);
  const groups = useViewerStore((state) => state.venousGroups);
  const depths = useViewerStore((state) => state.venousDepths);
  const regions = useViewerStore((state) => state.venousRegions);
  const eligible = resolveVenousStructureIds(
    VENOUS_STRUCTURES,
    systems,
    { hiddenIds, isolatedIds },
    { groups, depths, regions },
  );
  const needed = VENOUS_ASSETS.filter((asset) =>
    asset.structureIds.some((id) => eligible.has(id)),
  );
  const venousError = needed.some(
    (asset) => venousStatus[asset.id] === "error",
  );
  const venousLoading = needed.some(
    (asset) => !venousStatus[asset.id] || venousStatus[asset.id] === "loading",
  );
  const nervousInspection = useViewerStore(
    (state) => state.nervousIsolationSnapshot !== null,
  );
  const views: readonly CameraView[] = ["front", "back", "left", "right"];
  return (
    <>
      <div className="viewport-status">
        <span className="pulse" />
        <span>
          {getLocalizedName(
            regionById.get(activeRegionId) ?? regionById.get("whole-body")!,
            locale,
          )}
        </span>
        <i>•</i>
        <small>{t("viewer.drag")}</small>
      </div>
      <a
        className="model-credit"
        href="https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html"
        target="_blank"
        rel="noreferrer"
      >
        <span className="model-credit-dot" />
        <span>
          BodyParts3D <b>4.0</b>
        </span>
        <small>CC BY 4.0</small>
      </a>
      {supported && assetStatus === "loading" && (
        <div className="model-loading" role="status">
          <div className="loader-ring" />
          <p>{t("viewer.loading")}</p>
        </div>
      )}
      {supported && venous && (venousLoading || venousError) && (
        <div
          className="venous-load-status"
          role={venousError ? "alert" : "status"}
        >
          {t(venousError ? "venous.error" : "venous.loading")}
          {venousError && (
            <button onClick={() => useViewerStore.getState().retryVenous()}>
              {t("error.retry")}
            </button>
          )}
        </div>
      )}
      {supported && muscular && muscleStatus === "loading" && (
        <div className="muscle-load-status" role="status">
          {t("muscles.loading")}
        </div>
      )}
      {supported && muscular && muscleStatus === "error" && (
        <div className="muscle-load-status" role="alert">
          <p>{t("muscles.error")}</p>
          <button
            onClick={() => {
              useViewerStore.getState().retryMuscles();
            }}
          >
            {t("error.retry")}
          </button>
        </div>
      )}
      {muscular && muscleStatus === "ready" && (
        <div className="muscle-load-status coverage-warning">
          {t("muscles.incomplete")}
        </div>
      )}
      {supported && nervous && nervousStatus === "loading" && (
        <div className="nervous-load-status" role="status">
          {t("nervous.loading")}
        </div>
      )}
      {supported && nervous && nervousStatus === "error" && (
        <div className="nervous-load-status" role="alert">
          <p>{t("nervous.error")}</p>
          <button onClick={() => useViewerStore.getState().retryNervous()}>
            {t("error.retry")}
          </button>
        </div>
      )}
      {nervous && nervousStatus === "ready" && (
        <div className="nervous-load-status coverage-warning">
          <span>{t("nervous.incomplete")}</span>
          <p>{t("nervous.visibilityHint")}</p>
          <button
            onClick={() => {
              const state = useViewerStore.getState();
              if (nervousInspection) state.restoreVisibility();
              else state.inspectNervousSystem();
            }}
          >
            {t(nervousInspection ? "nervous.restoreContext" : "nervous.show")}
          </button>
        </div>
      )}
      {nervous && (
        <a
          className="nervous-source-credit"
          href="https://github.com/Z-Anatomy/Models-of-human-anatomy"
          target="_blank"
          rel="noreferrer"
        >
          Z-Anatomy · CC BY-SA 4.0 · BodyParts3D / Dundee
        </a>
      )}
      <div className="model-summary">
        {t("viewer.sourceMeshes", {
          count:
            (cardiac
              ? CARDIAC_GEOMETRY.reduce((n, p) => n + p.sourceFiles.length, 0)
              : 0) +
            (skeletal ? SKELETON_ASSET.sourceMeshCount : 0) +
            (muscular ? MUSCLE_ASSET.sourceMeshCount : 0) +
            (nervous
              ? NERVOUS_GEOMETRY.reduce(
                  (count, item) => count + item.sourceFiles.length,
                  0,
                )
              : 0) +
            (venous
              ? VENOUS_GEOMETRY.reduce(
                  (n, item) => n + item.sourceFiles.length,
                  0,
                )
              : 0),
        })}
        <span>·</span>
        {t("viewer.selectable", {
          count:
            (cardiac ? CARDIAC_GEOMETRY.length : 0) +
            (skeletal
              ? SKELETAL_STRUCTURES.filter(
                  (item) => item.status === "available",
                ).length
              : 0) +
            (muscular ? MUSCLE_ASSET.structures.length : 0) +
            (nervous ? NERVOUS_GEOMETRY.length : 0) +
            (venous ? VENOUS_GEOMETRY.length : 0),
        })}
      </div>
      <div
        className="view-controls"
        role="group"
        aria-label={t("viewer.views")}
      >
        {views.map((view) => (
          <button key={view} onClick={() => setCameraView(view)}>
            {t(`viewer.${view}`)}
          </button>
        ))}
        <button className="fit-button" onClick={() => setCameraView("fit")}>
          <Icon name="reset" />
          {t("viewer.reset")}
        </button>
      </div>
      {hovered && (
        <div className="hover-label">
          <strong>{getLocalizedName(hovered, locale)}</strong>
          <small>{hovered.latinName}</small>
        </div>
      )}
      {activeCount === 0 && (
        <div className="empty-scene">
          <div>
            <Icon name="layers" size={28} />
          </div>
          <h2>{t("viewer.empty")}</h2>
          <p>{t("filters.none")}</p>
        </div>
      )}
    </>
  );
}
