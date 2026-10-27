import { useTranslation } from "react-i18next";
import type { Locale } from "@anatomy/core";
import { getLocalizedName, resolveGroupMembers } from "@anatomy/core";
import {
  GROUPS,
  regionById,
  STRUCTURES,
  structureById,
  systemById,
  SKELETON_ASSET,
} from "@anatomy/data";
import { useViewerStore } from "../store/viewerStore";
import { Icon } from "./Icon";

export function Inspector() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language as Locale;
  const selectedId = useViewerStore((state) => state.selectedId);
  const select = useViewerStore((state) => state.select);
  const hideSelected = useViewerStore((state) => state.hideSelected);
  const isolateSelected = useViewerStore((state) => state.isolateSelected);
  const restoreVisibility = useViewerStore((state) => state.restoreVisibility);
  const setCameraView = useViewerStore((state) => state.setCameraView);
  const isolatedIds = useViewerStore((state) => state.isolatedIds);
  const hiddenIds = useViewerStore((state) => state.hiddenIds);
  const structure = selectedId ? structureById.get(selectedId) : undefined;
  const assetStructure = SKELETON_ASSET.structures.find(
    (item) => item.id === selectedId,
  );
  const activeSystemIds = useViewerStore((state) => state.activeSystemIds);
  const isHidden =
    structure &&
    (!structure.systemIds.some((id) => activeSystemIds.has(id)) ||
      hiddenIds.has(structure.id) ||
      (isolatedIds.size > 0 && !isolatedIds.has(structure.id)));

  return (
    <aside className="side-panel inspector" aria-label={t("inspector.title")}>
      <div className="inspector-header">
        <div>
          <span className="eyebrow">{t("inspector.title")}</span>
          <h2>{structure ? getLocalizedName(structure, locale) : "—"}</h2>
        </div>
        {structure && (
          <button
            className="icon-button"
            onClick={() => select(null)}
            aria-label={t("inspector.deselect")}
          >
            ×
          </button>
        )}
      </div>
      {!structure ? (
        <div className="inspector-empty">
          <div className="empty-orbit">
            <Icon name="target" size={27} />
          </div>
          <p>{t("inspector.empty")}</p>
        </div>
      ) : (
        <div className="inspector-content">
          <div className="structure-identity">
            <div
              className="system-chip"
              style={
                {
                  "--chip-color": systemById.get(structure.systemIds[0] ?? "")
                    ?.color,
                } as React.CSSProperties
              }
            >
              {getLocalizedName(
                systemById.get(structure.systemIds[0] ?? "") ?? {
                  names: { en: "", ro: "" },
                },
                locale,
              )}
            </div>
            <p className="latin-name">{structure.latinName}</p>
            <span className="review-badge">
              ● {t(isHidden ? "inspector.hidden" : "inspector.available")}
            </span>
            {assetStructure && (
              <p className="structure-source-detail">
                {t("inspector.mappedMeshes", {
                  count: assetStructure.sourceFiles.length,
                })}
                {assetStructure.sourceConcepts.length > 1 && (
                  <span>{t("inspector.groupSelection")}</span>
                )}
              </p>
            )}
          </div>
          <dl className="metadata-grid">
            <div>
              <dt>{t("inspector.region")}</dt>
              <dd>
                {getLocalizedName(
                  regionById.get(structure.regionIds[0] ?? "") ?? {
                    names: { en: "", ro: "" },
                  },
                  locale,
                )}
              </dd>
            </div>
            <div>
              <dt>{t("inspector.system")}</dt>
              <dd>
                {getLocalizedName(
                  systemById.get(structure.systemIds[0] ?? "") ?? {
                    names: { en: "", ro: "" },
                  },
                  locale,
                )}
              </dd>
            </div>
          </dl>
          <div className="inspector-actions">
            <button
              className="primary-action"
              onClick={() => setCameraView("focus")}
            >
              <Icon name="target" />
              {t("viewer.focus")}
            </button>
            <button onClick={isolateSelected}>
              <Icon name="eye" />
              {t("inspector.isolate")}
            </button>
            <button onClick={hideSelected}>
              <Icon name="eye" />
              {t("inspector.hide")}
            </button>
          </div>
          {(isolatedIds.size > 0 || hiddenIds.size > 0) && (
            <button className="restore-button" onClick={restoreVisibility}>
              <Icon name="reset" />
              {t("inspector.restore")}
            </button>
          )}
          {structure.groupIds?.map((groupId) => {
            const group = GROUPS.find((item) => item.id === groupId);
            if (!group) return null;
            const members = resolveGroupMembers(group, STRUCTURES);
            return (
              <section className="group-card" key={group.id}>
                <div className="group-title">
                  <div>
                    <span className="eyebrow">{t("groups.title")}</span>
                    <h3>{getLocalizedName(group, locale)}</h3>
                  </div>
                  <span>
                    {members.length} {t("groups.members")}
                  </span>
                </div>
                <div className="member-list">
                  {members.map((member, index) => (
                    <button
                      key={member.id}
                      className={member.id === structure.id ? "current" : ""}
                      onClick={() => select(member.id)}
                    >
                      <span className="member-index">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span>
                        {getLocalizedName(member, locale)}
                        <small>{member.latinName}</small>
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            );
          })}
          <div className="source-note">
            <Icon name="info" />
            <p>
              BodyParts3D, © The Database Center for Life Science
              <br />
              <a
                href="https://creativecommons.org/licenses/by/4.0/"
                target="_blank"
                rel="noreferrer"
              >
                CC BY 4.0
              </a>{" "}
              · {t("inspector.sourceNote")}
            </p>
          </div>
        </div>
      )}
    </aside>
  );
}
