import { useTranslation } from "react-i18next";
import { cardiacVenousRoute, cardiacNameById } from "@anatomy/data";
import { useViewerStore } from "../store/viewerStore";
import { heartEn, heartRo } from "../localization/heart";
export function CardiacVenousBridge({ id }: { id: string }) {
  const { i18n } = useTranslation(),
    locale = i18n.language === "ro" ? "ro" : "en",
    t = locale === "ro" ? heartRo : heartEn,
    route = cardiacVenousRoute(id);
  if (!route.length) return null;
  return (
    <section aria-label={t.paths}>
      <h4>{t.paths}</h4>
      <p>
        {route.map((id) => cardiacNameById.get(id)?.[locale] ?? id).join(" → ")}
      </p>
      <p className="coverage-warning">{t.pathHint}</p>
      <button
        className="restore-button"
        onClick={() => useViewerStore.getState().revealCardiacPath(route)}
      >
        {t.reveal}
      </button>
    </section>
  );
}
