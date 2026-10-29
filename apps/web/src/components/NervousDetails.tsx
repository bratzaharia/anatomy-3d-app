import { useTranslation } from "react-i18next";
import {
  getLocalizedName,
  nervousRelatedIds,
  type Locale,
} from "@anatomy/core";
import {
  NERVOUS_ASSET,
  nervousMetadataById,
  structureById,
} from "@anatomy/data";
import { useViewerStore } from "../store/viewerStore";

export function NervousDetails({ id }: { id: string }) {
  const { t, i18n } = useTranslation();
  const select = useViewerStore((state) => state.select);
  const reset = useViewerStore((state) => state.resetNervousFilters);
  const item = nervousMetadataById.get(id);
  if (!item && id !== "nervous-brain") return null;
  const related = nervousRelatedIds(id, NERVOUS_ASSET.connections);
  return (
    <section className="nervous-details" aria-label={t("nervous.details")}>
      <dl className="metadata-grid">
        <div>
          <dt>{t("nervous.structural")}</dt>
          <dd>{t("nervous.division." + (item?.division ?? "cns"))}</dd>
        </div>
        <div>
          <dt>{t("muscles.side")}</dt>
          <dd>{t("muscles.side." + (item?.laterality ?? "midline"))}</dd>
        </div>
      </dl>
      {item?.functions.length ? (
        <p className="coverage-counts">
          {item.functions.map((fn) => t("nervous.function." + fn)).join(" · ")}
        </p>
      ) : null}
      <p className="coverage-warning">{t("nervous.review")}</p>
      {item?.sourceDataset && (
        <p className="coverage-warning">{t("nervous.registeredSource")}</p>
      )}
      {item?.translationStatus === "source-name-fallback" && (
        <p className="coverage-counts">{t("nervous.sourceNameFallback")}</p>
      )}
      {item?.geometryStatus === "grouped" && (
        <p className="coverage-counts">{t("nervous.sourceSet")}</p>
      )}
      <p className="coverage-counts">
        {t(
          item?.geometryStatus === "unavailable"
            ? "nervous.unavailable"
            : "nervous.sourcePart",
        )}
      </p>
      {id === "nervous-spinal-cord" && (
        <p className="coverage-warning">{t("nervous.spinalQuarantine")}</p>
      )}
      {item?.cranialNumber === "II" && (
        <p className="coverage-counts">{t("nervous.opticCns")}</p>
      )}
      <button className="restore-button" onClick={reset}>
        {t("nervous.resetFilters")}
      </button>
      {related.length > 0 && (
        <>
          <h3>{t("nervous.connections")}</h3>
          <p className="coverage-counts">{t("nervous.connectionHint")}</p>
          <div className="explorer-members">
            {related.map((otherId) => (
              <button key={otherId} onClick={() => select(otherId)}>
                {getLocalizedName(
                  structureById.get(otherId)!,
                  i18n.language as Locale,
                )}
              </button>
            ))}
          </div>
        </>
      )}
      <p className="coverage-counts">
        <a
          href={
            item?.medicalSource ??
            "https://ifaa.net/committees/anatomical-terminology-fipat/fipat-ifaa-terminologies/"
          }
          target="_blank"
          rel="noreferrer"
        >
          {t("nervous.references")}
        </a>
      </p>
      {NERVOUS_ASSET.connections
        .filter((edge) => edge.from === id || edge.to === id)
        .map((edge) => (
          <p className="coverage-counts" key={edge.from + edge.to}>
            <a href={edge.sourceUrl} target="_blank" rel="noreferrer">
              {t("nervous.connectionSource")}
            </a>
          </p>
        ))}
    </section>
  );
}
