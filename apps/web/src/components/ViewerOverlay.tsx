import { useTranslation } from "react-i18next";
import type { Locale } from "@anatomy/core";
import { getLocalizedName } from "@anatomy/core";
import { regionById, structureById, SKELETON_ASSET } from "@anatomy/data";
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
      <div className="model-summary">
        {t("viewer.sourceMeshes", { count: SKELETON_ASSET.sourceMeshCount })}
        <span>·</span>
        {t("viewer.selectable", { count: SKELETON_ASSET.structures.length })}
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
