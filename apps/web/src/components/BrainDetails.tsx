import { useTranslation } from "react-i18next";
import type { Locale } from "@anatomy/core";
import { BRAIN_CATEGORIES, BRAIN_SOURCE, brainRegionById } from "@anatomy/data";
export function BrainDetails({ id }: { id: string }) {
  const { t, i18n } = useTranslation(),
    part = brainRegionById.get(id);
  if (!part) return null;
  const group = BRAIN_CATEGORIES.find((g) => g.id === part.category)!;
  return (
    <section className="brain-details" aria-label={t("brain.info")}>
      <p className="coverage-warning">{t("brain.mapping")}</p>
      <dl>
        <dt>{t("brain.group")}</dt>
        <dd>{group.names[i18n.language as Locale]}</dd>
        <dt>BodyParts3D / FMA</dt>
        <dd>{part.terminologyIds.join(" · ")}</dd>
      </dl>
      <p>
        {part.names.en} · {part.names.ro} · <i>{part.latinName}</i>
      </p>
      <p>{t("brain.noAdvanced")}</p>
      <p>{t("brain.function")}</p>
      <a href={BRAIN_SOURCE.sourceUrl} target="_blank" rel="noreferrer">
        BodyParts3D 4.0 · CC BY 4.0
      </a>
    </section>
  );
}
