import { useEffect, useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  brainSelectionState,
  getLocalizedName,
  type BrainPalette,
  type Locale,
} from "@anatomy/core";
import {
  BRAIN_ATLASES,
  BRAIN_IDS,
  BRAIN_REGIONS,
  BRAIN_TREE,
  BRAIN_UNMAPPED,
  brainRegionById,
  brainRegionColor,
  type BrainTreeNode,
} from "@anatomy/data";
import { useViewerStore } from "../store/viewerStore";

function GroupCheck({
  ids,
  children,
}: {
  ids: readonly string[];
  children: React.ReactNode;
}) {
  const selected = useViewerStore((s) => s.brainSelectedIds),
    ref = useRef<HTMLInputElement>(null);
  const state = brainSelectionState(ids, selected);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = state.indeterminate;
  }, [state.indeterminate]);
  return (
    <label className="brain-check">
      <input
        ref={ref}
        type="checkbox"
        checked={state.checked}
        onChange={() => useViewerStore.getState().toggleBrainIds(ids)}
      />
      {children}
    </label>
  );
}
const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
function matches(id: string, query: string) {
  const r = brainRegionById.get(id)!;
  return normalize(
    [r.names.en, r.names.ro, r.latinName, ...r.terminologyIds, r.id].join(" "),
  ).includes(query);
}
function RegionNode({ node, query }: { node: BrainTreeNode; query: string }) {
  const { t, i18n } = useTranslation(),
    locale = i18n.language as Locale;
  const palette = useViewerStore((s) => s.brainPalette),
    styles = useViewerStore((s) => s.brainStyles);
  const mode = useViewerStore((s) => s.brainMode);
  const ids = node.memberIds.filter((id) => matches(id, query));
  if (!ids.length) return null;
  return (
    <details className="brain-tree-node" open={query ? true : undefined}>
      <summary>
        {getLocalizedName(node, locale)} <small>{ids.length}</small>
      </summary>
      <GroupCheck ids={ids}>{getLocalizedName(node, locale)}</GroupCheck>
      {node.children.length
        ? node.children.map((child) => (
            <RegionNode key={child.id} node={child} query={query} />
          ))
        : ids.map((id) => {
            const region = brainRegionById.get(id)!;
            return (
              <div className="brain-tree-row" key={id}>
                <GroupCheck ids={[id]}>
                  <span
                    className="brain-legend-dot"
                    style={{
                      backgroundColor:
                        mode === "regions"
                          ? (brainRegionColor(id, palette, styles) ?? "#b99e98")
                          : "#b99e98",
                    }}
                    aria-hidden="true"
                  />
                  {getLocalizedName(region, locale)}
                </GroupCheck>
                <button
                  className="brain-info"
                  aria-label={`${t("brain.info")}: ${getLocalizedName(region, locale)}`}
                  onClick={() => useViewerStore.getState().selectBrain(id)}
                >
                  {t("brain.info")}
                </button>
              </div>
            );
          })}
    </details>
  );
}
export function BrainExplorer() {
  const { t } = useTranslation(),
    heading = useId();
  const active = useViewerStore((s) => s.activeSystemIds.has("nervous"));
  const mode = useViewerStore((s) => s.brainMode),
    palette = useViewerStore((s) => s.brainPalette),
    selected = useViewerStore((s) => s.brainSelectedIds),
    styles = useViewerStore((s) => s.brainStyles),
    opacity = useViewerStore((s) => s.brainOpacity),
    atlasId = useViewerStore((s) => s.brainAtlasId),
    snapshot = useViewerStore((s) => s.brainSnapshot);
  const [search, setSearch] = useState("");
  if (!active) return null;
  const store = useViewerStore.getState(),
    atlas = BRAIN_ATLASES.find((a) => a.id === atlasId)!;
  const current = styles[[...selected][0] ?? ""],
    query = normalize(search.trim());
  return (
    <section className="brain-explorer" aria-labelledby={heading}>
      <details open>
        <summary>
          <h3 id={heading}>{t("brain.title")}</h3>
        </summary>
        <div
          className="skull-mode-grid brain-mode-grid"
          role="radiogroup"
          aria-labelledby={heading}
        >
          {(["natural", "regions", "atlas"] as const).map((id) => (
            <label
              key={id}
              className={`skull-mode-card ${mode === id ? "is-selected" : ""}`}
            >
              <input
                type="radio"
                className="sr-only"
                name="brain-primary-mode"
                checked={mode === id}
                onChange={() => store.setBrainMode(id)}
                aria-label={t("brain.mode." + id)}
              />
              <img
                className="skull-mode-thumbnail"
                src={`/brain-previews/${id === "atlas" ? "natural" : id}.png`}
                alt={`${t("brain.preview")}: ${t("brain.mode." + (id === "atlas" ? "natural" : id))}`}
                width="120"
                height="120"
              />
              <span className="skull-mode-check" aria-hidden="true">
                {mode === id ? "✓" : ""}
              </span>
              <strong>{t("brain.mode." + id)}</strong>
            </label>
          ))}
        </div>
        <p className="coverage-warning">{t("brain.scope")}</p>
        {mode === "atlas" ? (
          <div className="brain-atlas-block" role="status">
            <p className="coverage-warning">{t("brain.blocked")}</p>
            <label>
              {t("brain.atlas")}
              <select
                value={atlasId}
                onChange={(e) => store.setBrainAtlas(e.target.value)}
              >
                {BRAIN_ATLASES.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </label>
            <p>
              {atlas.name} · {atlas.version}
            </p>
            <p>
              {t("brain.space")}: {atlas.space} · {atlas.format}
            </p>
            <p>{t("brain.registration")}</p>
            <p>{t("brain.networkNote")}</p>
            <a href={atlas.sourceUrl} target="_blank" rel="noreferrer">
              {atlas.name} — {t("nervous.references")}
            </a>
          </div>
        ) : mode === "regions" ? (
          <>
            <p className="coverage-counts">{t("brain.sourceOnly")}</p>
            <label className="brain-field">
              {t("brain.palette")}
              <select
                value={palette}
                onChange={(e) =>
                  store.setBrainPalette(e.target.value as BrainPalette)
                }
              >
                {(
                  ["classical", "contrast", "accessible", "custom"] as const
                ).map((p) => (
                  <option key={p} value={p}>
                    {t("brain.palette." + p)}
                  </option>
                ))}
              </select>
            </label>
          </>
        ) : null}
        <label className="venous-opacity">
          {t("brain.opacity")}{" "}
          <span className="brain-opacity-value">
            {Math.round(opacity * 100)}%
          </span>
          <input
            aria-label={t("brain.opacity")}
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={opacity}
            onChange={(e) => store.setBrainOpacity(Number(e.target.value))}
          />
        </label>
        <details className="brain-region-controls" open>
          <summary>{t("brain.tree")}</summary>
          <input
            className="brain-search"
            aria-label={t("brain.search")}
            placeholder={t("brain.search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <GroupCheck ids={BRAIN_IDS}>{t("brain.all")}</GroupCheck>
          <div className="brain-actions">
            <button onClick={() => store.setBrainSelection([])}>
              {t("brain.none")}
            </button>
            {(["left", "right"] as const).map((side) => (
              <button
                key={side}
                onClick={() =>
                  store.setBrainSelection(
                    BRAIN_REGIONS.filter((r) => r.laterality === side).map(
                      (r) => r.id,
                    ),
                  )
                }
              >
                {t("brain." + side)}
              </button>
            ))}
            <button
              onClick={() =>
                store.setBrainSelection(
                  BRAIN_REGIONS.filter((r) => r.homologueId).map((r) => r.id),
                )
              }
            >
              {t("brain.bilateral")}
            </button>
          </div>
          {BRAIN_TREE.map((node) => (
            <RegionNode key={node.id} node={node} query={query} />
          ))}
          {!BRAIN_IDS.some((id) => matches(id, query)) && (
            <p>{t("brain.noResults")}</p>
          )}
        </details>
        <p className="coverage-counts">
          {t("brain.selected", { count: selected.size })}
        </p>
        <fieldset className="brain-selection-actions" disabled={!selected.size}>
          <legend className="sr-only">
            {t("brain.selected", { count: selected.size })}
          </legend>
          <label className="brain-color-field">
            {t("brain.color")}
            <input
              type="color"
              aria-label={t("brain.color")}
              value={current?.color ?? "#c28b7b"}
              onChange={(e) =>
                store.styleBrainSelection({ color: e.target.value })
              }
            />
          </label>
          <label className="venous-opacity">
            {t("brain.selectedOpacity")}
            <input
              type="range"
              aria-label={t("brain.selectedOpacity")}
              min="0"
              max="1"
              step="0.05"
              value={current?.opacity ?? 1}
              onChange={(e) =>
                store.styleBrainSelection({ opacity: Number(e.target.value) })
              }
            />
          </label>
          <div className="brain-actions">
            <button onClick={() => store.setCameraView("focus")}>
              {t("brain.focus")}
            </button>
            <button onClick={store.isolateBrainSelection}>
              {t("brain.isolate")}
            </button>
            <button onClick={() => store.hideBrainSelection(true)}>
              {t("brain.hide")}
            </button>
            <button onClick={() => store.hideBrainSelection(false)}>
              {t("brain.show")}
            </button>
            <button onClick={() => store.resetBrainStyles()}>
              {t("brain.resetSelected")}
            </button>
            <button
              onClick={() =>
                store.setBrainSelection([
                  ...selected,
                  ...[...selected].flatMap((id) => {
                    const other = brainRegionById.get(id)?.homologueId;
                    return other && brainRegionById.has(other) ? [other] : [];
                  }),
                ])
              }
            >
              {t("brain.opposite")}
            </button>
          </div>
        </fieldset>
        {snapshot && (
          <button
            className="restore-button"
            onClick={store.restoreBrainContext}
          >
            {t("brain.restore")}
          </button>
        )}
        <button
          className="restore-button"
          onClick={() => store.resetBrainStyles(true)}
        >
          {t("brain.resetAll")}
        </button>
        <p className="coverage-counts">{t("brain.filters")}</p>
        <details>
          <summary>{t("brain.gaps")}</summary>
          <p className="coverage-counts">{t("brain.gapsNote")}</p>
          <ul>
            {BRAIN_UNMAPPED.map((name) => (
              <li key={name} lang="en">
                {name}
              </li>
            ))}
          </ul>
        </details>
      </details>
    </section>
  );
}
