import { useState, useRef, useLayoutEffect } from "react";
import { useTranslation } from "react-i18next";
import type { CardiacGroup, CardiacMode } from "@anatomy/core";
import {
  CARDIAC_STRUCTURES,
  CARDIAC_GROUP_NAMES,
  CARDIAC_GEOMETRY,
  CARDIAC_ASSETS,
  CARDIAC_MISSING,
  CARDIAC_VENOUS_IDS,
  CARDIAC_PATHS,
  cardiacNameById,
  venousMetadataById,
  HEART_MANIFEST,
  cardiacMetadataById,
} from "@anatomy/data";
import { heartEn, heartRo } from "../localization/heart";
import { useViewerStore } from "../store/viewerStore";
function SelectionCheck({
  ids,
  label,
}: {
  ids: readonly string[];
  label: string;
}) {
  const selected = useViewerStore((s) => s.cardiacSelectedIds),
    ref = useRef<HTMLInputElement>(null),
    count = ids.filter((id) => selected.has(id)).length;
  useLayoutEffect(() => {
    if (ref.current)
      ref.current.indeterminate = count > 0 && count < ids.length;
  }, [count, ids.length]);
  return (
    <label className="brain-check">
      <input
        ref={ref}
        type="checkbox"
        checked={count === ids.length && ids.length > 0}
        onChange={() => useViewerStore.getState().toggleCardiacSelection(ids)}
      />
      {label}
    </label>
  );
}
export function CardiacExplorer() {
  const { i18n } = useTranslation(),
    locale = i18n.language === "ro" ? "ro" : "en",
    t = locale === "ro" ? heartRo : heartEn;
  const enabled = useViewerStore((s) => s.cardiacEnabled),
    requested = useViewerStore((s) => s.cardiacRequested),
    venous = useViewerStore((s) => s.activeSystemIds.has("venous")),
    selectedId = useViewerStore((s) => s.selectedId),
    mode = useViewerStore((s) => s.cardiacMode),
    groups = useViewerStore((s) => s.cardiacGroups),
    selected = useViewerStore((s) => s.cardiacSelectedIds),
    opacity = useViewerStore((s) => s.cardiacOpacity),
    wallOpacity = useViewerStore((s) => s.cardiacWallOpacity),
    clip = useViewerStore((s) => s.cardiacClip),
    clipLevel = useViewerStore((s) => s.cardiacClipLevel),
    status = useViewerStore((s) => s.cardiacStatus);
  const [query, setQuery] = useState(""),
    [path, setPath] = useState<keyof typeof CARDIAC_PATHS>("coronary");
  if (!enabled && !requested && !venous && !selectedId?.startsWith("cardiac-"))
    return null;
  const s = useViewerStore.getState(),
    needed = CARDIAC_ASSETS.filter((a) =>
      a.structureIds.some((id) =>
        groups.has(cardiacMetadataById.get(id)!.group),
      ),
    ),
    error = enabled && needed.some((a) => status[a.id] === "error"),
    loading =
      enabled &&
      needed.some((a) => !status[a.id] || status[a.id] === "loading");
  return (
    <section className="cardiac-explorer" aria-label={t.title}>
      <details open>
        <summary>
          <h3>{t.title}</h3>
        </summary>
        <p className="coverage-warning">{t.scope}</p>
        <label className="brain-check">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => s.setCardiacEnabled(e.target.checked)}
          />
          {t.show}
        </label>
        {enabled && (
          <>
            <div
              className="cardiac-modes"
              role="radiogroup"
              aria-label={t.title}
            >
              {(["natural", "colors", "connections"] as const).map((id) => (
                <label
                  className={`cardiac-mode ${mode === id ? "is-selected" : ""}`}
                  key={id}
                >
                  <input
                    type="radio"
                    name="cardiac-mode"
                    value={id}
                    checked={mode === id}
                    onChange={() => s.setCardiacMode(id as CardiacMode)}
                  />
                  <span
                    className={`cardiac-mode-swatch ${id}`}
                    aria-hidden="true"
                  />
                  <strong>{t[id]}</strong>
                </label>
              ))}
            </div>
            <p>{t.materials}</p>
            {error ? (
              <div role="alert">
                {t.error}
                <button onClick={s.retryCardiac}>{t.retry}</button>
              </div>
            ) : loading ? (
              <p role="status">{t.loading}</p>
            ) : null}
            <div className="brain-actions">
              <button
                onClick={() => {
                  s.select("cardiac-heart");
                  s.setCameraView("focus");
                }}
              >
                {t.focus}
              </button>
              <button onClick={s.resetCardiacStyles}>{t.reset}</button>
              <button onClick={s.restoreVisibility}>{t.restore}</button>
            </div>
            <label className="venous-opacity">
              {t.opacity}
              <output>{Math.round(opacity * 100)}%</output>
              <input
                aria-label={t.opacity}
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={opacity}
                onChange={(e) => s.setCardiacOpacity(Number(e.target.value))}
              />
            </label>
            <label className="brain-check">
              <input
                type="checkbox"
                checked={clip}
                onChange={(e) => s.setCardiacClip(e.target.checked)}
              />
              {t.clip}
            </label>
            <label className="venous-opacity">
              {t.wallOpacity}
              <input
                aria-label={t.wallOpacity}
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={wallOpacity}
                onChange={(e) =>
                  s.setCardiacWallOpacity(Number(e.target.value))
                }
              />
            </label>
            {clip && (
              <label className="venous-opacity">
                {t.clipLevel}
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={clipLevel}
                  onChange={(e) =>
                    s.setCardiacClipLevel(Number(e.target.value))
                  }
                />
              </label>
            )}
            <details open>
              <summary>
                {t.groups} · {CARDIAC_GEOMETRY.length}
              </summary>
              <input
                className="brain-search"
                aria-label={t.search}
                placeholder={t.search}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <SelectionCheck
                ids={CARDIAC_STRUCTURES.map((p) => p.id)}
                label={t.selectAll}
              />
              <div className="brain-actions">
                <button onClick={() => s.setCardiacSelection([])}>
                  {t.clear}
                </button>
              </div>
              {(Object.keys(CARDIAC_GROUP_NAMES) as CardiacGroup[]).map(
                (group) => {
                  const parts = CARDIAC_STRUCTURES.filter(
                    (p) => p.cardiacGroup === group,
                  );
                  return (
                    <details
                      className="brain-tree-node"
                      key={group}
                      data-cardiac-group={group}
                    >
                      <summary>
                        {CARDIAC_GROUP_NAMES[group][locale]} · {parts.length}
                      </summary>
                      <label className="brain-check">
                        <input
                          type="checkbox"
                          checked={groups.has(group)}
                          onChange={() => s.toggleCardiacGroup(group)}
                        />
                        {t.toggle}: {CARDIAC_GROUP_NAMES[group][locale]}
                      </label>
                      <SelectionCheck
                        ids={parts.map((p) => p.id)}
                        label={`${t.selectGroup}: ${CARDIAC_GROUP_NAMES[group][locale]}`}
                      />
                      {parts
                        .filter((p) =>
                          `${p.names[locale]} ${p.latinName}`
                            .toLowerCase()
                            .includes(query.toLowerCase()),
                        )
                        .map((p) => (
                          <div key={p.id}>
                            <SelectionCheck
                              ids={[p.id]}
                              label={p.names[locale]}
                            />
                            <button
                              className="brain-info"
                              onClick={() => {
                                s.selectCardiac(p.id);
                                s.setCameraView("focus");
                              }}
                            >
                              {p.latinName}
                            </button>
                          </div>
                        ))}
                    </details>
                  );
                },
              )}
            </details>
            <fieldset
              className="brain-selection-actions"
              disabled={!selected.size}
            >
              <legend>
                {t.selected}: {selected.size}
              </legend>
              <label className="brain-color-field">
                {t.color}
                <input
                  type="color"
                  defaultValue="#bd737b"
                  onChange={(e) => s.styleCardiacSelection(e.target.value)}
                />
              </label>
              <div className="brain-actions">
                <button onClick={s.isolateCardiacSelection}>{t.isolate}</button>
                <button
                  onClick={() => s.setStructuresHidden([...selected], true)}
                >
                  {t.hide}
                </button>
              </div>
            </fieldset>
            {mode === "connections" && (
              <details open>
                <summary>{t.paths}</summary>
                <p>{t.pathHint}</p>
                <select
                  aria-label={t.paths}
                  value={path}
                  onChange={(e) =>
                    setPath(e.target.value as keyof typeof CARDIAC_PATHS)
                  }
                >
                  <option value="systemic">{t.pathSystemic}</option>
                  <option value="pulmonary">{t.pathPulmonary}</option>
                  <option value="coronary">{t.pathCoronary}</option>
                </select>
                <ol>
                  {CARDIAC_PATHS[path].map((id) => (
                    <li key={id}>{cardiacNameById.get(id)?.[locale]} →</li>
                  ))}
                </ol>
                <button
                  className="brain-info"
                  onClick={() => s.revealCardiacPath(CARDIAC_PATHS[path])}
                >
                  {t.reveal}
                </button>
                <p>
                  <a
                    href="https://openstax.org/books/anatomy-and-physiology-2e/pages/19-1-heart-anatomy"
                    target="_blank"
                    rel="noreferrer"
                  >
                    OpenStax · 19.1
                  </a>
                </p>
              </details>
            )}
          </>
        )}
        <details>
          <summary>{t.venous}</summary>
          {CARDIAC_VENOUS_IDS.map((id) => {
            const v = venousMetadataById.get(id)!;
            return (
              <p key={id}>
                <button
                  className="brain-info"
                  onClick={() => {
                    s.selectVein(id);
                    s.setCameraView("focus");
                  }}
                >
                  {v.names[locale]}
                </button>
                {!v.assetId && <small> · {t.missing}</small>}
              </p>
            );
          })}
        </details>
        <details>
          <summary>{t.gaps}</summary>
          <p>{t.notImplemented}</p>
          {CARDIAC_MISSING.map((p) => (
            <p key={p.id}>
              {p.names[locale]} · {t.missing}
            </p>
          ))}
        </details>
        <p>
          <a href={HEART_MANIFEST.licenseUrl} target="_blank" rel="noreferrer">
            {t.source}: BodyParts3D 4.0 · CC BY 4.0
          </a>
        </p>
      </details>
    </section>
  );
}
export function CardiacDetails({ id }: { id: string }) {
  const { i18n } = useTranslation(),
    t = i18n.language === "ro" ? heartRo : heartEn,
    p = cardiacMetadataById.get(id);
  if (!id.startsWith("cardiac-")) return null;
  return (
    <section className="brain-details">
      <p className="coverage-warning">{t.detail}</p>
      {p && (
        <>
          <p>
            {t.classification}:{" "}
            {p.category === "cavity" ? t.cavityType : t[p.category]}
          </p>
          <p>
            {p.terminologyId} · {p.sourceName}
          </p>
          <p>
            {t.review} · {p.triangleCount.toLocaleString()} {t.triangles}
          </p>
          {p.category === "cavity" && (
            <p className="coverage-warning">{t.cavity}</p>
          )}
        </>
      )}
    </section>
  );
}
