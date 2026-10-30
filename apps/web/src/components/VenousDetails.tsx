import { useTranslation } from "react-i18next";
import type { Locale } from "@anatomy/core";
import {
  VENOUS_CONNECTIONS,
  VENOUS_MANIFEST,
  venousMetadataById,
  venousGraphNames,
} from "@anatomy/data";
import { useViewerStore } from "../store/viewerStore";
import { CardiacVenousBridge } from "./CardiacVenousBridge";
export function VenousDetails({ id }: { id: string }) {
  const { t, i18n } = useTranslation(),
    locale = i18n.language as Locale;
  const trace = useViewerStore((s) => s.venousTraceIds),
    active = useViewerStore((s) => s.activeSystemIds.has("venous"));
  const metadata = venousMetadataById.get(id);
  if (!metadata) return null;
  const downstream = VENOUS_CONNECTIONS.filter((e) => e.from === id),
    upstream = VENOUS_CONNECTIONS.filter((e) => e.to === id);
  const name = (key: string) => venousGraphNames.get(key)?.[locale] ?? key;
  return (
    <section className="venous-details" aria-label={t("venous.details")}>
      <p className="coverage-warning">{t("venous.review")}</p>
      <dl className="metadata-grid">
        <div>
          <dt>{t("venous.categoryLabel")}</dt>
          <dd>{t("venous.category." + metadata.venousCategory)}</dd>
        </div>
        <div>
          <dt>{t("venous.depthLabel")}</dt>
          <dd>{t("venous." + metadata.depth)}</dd>
        </div>
      </dl>
      <p className="coverage-counts">{t("venous.sex")}</p>
      {!metadata.assetId && (
        <p className="coverage-warning">{t("venous.missing")}</p>
      )}
      {metadata.missingReason?.startsWith("Quarantined") && (
        <p className="coverage-warning">{t("venous.sideConflict")}</p>
      )}
      {metadata.sex === "female-only" && (
        <p className="coverage-warning">{t("venous.femaleMissing")}</p>
      )}
      {metadata.geometryStatus === "grouped" && (
        <p className="coverage-warning">{t("venous.set")}</p>
      )}
      <h4>{t("venous.drainsInto")}</h4>
      <p>
        {downstream.length
          ? downstream.map((e) => name(e.to)).join(" · ")
          : t("venous.notRecorded")}
      </p>
      <h4>{t("venous.tributaries")}</h4>
      <p>
        {upstream.length
          ? upstream.map((e) => name(e.from)).join(" · ")
          : t("venous.notRecorded")}
      </p>
      <button
        className="restore-button"
        disabled={!active || !downstream.length}
        onClick={() => useViewerStore.getState().inspectVenous(true)}
      >
        {t("venous.trace")}
      </button>
      {!!trace.size && (
        <>
          <h4>{t("venous.traceTitle")}</h4>
          <ul>
            {[...trace].map((key) => (
              <li key={key}>
                {name(key)}
                {venousMetadataById.get(key)?.assetId === null
                  ? " — " + t("groups.noGeometry")
                  : ""}
              </li>
            ))}
          </ul>
          <button
            className="restore-button"
            onClick={() => useViewerStore.getState().restoreVenous()}
          >
            {t("venous.restore")}
          </button>
        </>
      )}
      <p className="coverage-counts">{t("venous.traceNote")}</p>
      <CardiacVenousBridge id={id} />
      <a href={metadata.medicalSource} target="_blank" rel="noreferrer">
        {t("nervous.references")}
      </a>
      <p className="coverage-counts">
        {metadata.terminologyId ?? "TA2"} · {t("venous.source")}{" "}
        <a href={VENOUS_MANIFEST.licenseUrl} target="_blank" rel="noreferrer">
          {metadata.assetId
            ? "BodyParts3D · CC BY 4.0"
            : t("coverage.inventoryOnly")}
        </a>
      </p>
    </section>
  );
}
