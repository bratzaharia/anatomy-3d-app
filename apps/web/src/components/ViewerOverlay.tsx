import { useTranslation } from "react-i18next";
import type { Locale } from "@anatomy/core";
import { getLocalizedName } from "@anatomy/core";
import {
  regionById,
  structureById,
  SKELETON_ASSET,
  MUSCLE_ASSET,
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
  const activeCount = useViewerStore((state) => state.activeSystemIds.size);
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
      <div className="model-summary">
        {t("viewer.sourceMeshes", {
          count:
            (skeletal ? SKELETON_ASSET.sourceMeshCount : 0) +
            (muscular ? MUSCLE_ASSET.sourceMeshCount : 0),
        })}
        <span>·</span>
        {t("viewer.selectable", {
          count:
            (skeletal ? SKELETON_ASSET.structures.length : 0) +
            (muscular ? MUSCLE_ASSET.structures.length : 0),
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
