import { useState, useRef, useLayoutEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  resolveArterialStructureIds,
  type ArterialLevel,
  type Laterality,
} from "@anatomy/core";
import {
  ARTERIAL_GROUP_NAMES,
  ARTERIAL_PALETTE,
  ARTERIAL_STRUCTURES,
  ARTERIAL_GEOMETRY,
  ARTERIAL_MANIFEST,
  ARTERIAL_ASSETS,
  ARTERIAL_EDGES,
  arterialMetadataById,
  structureById,
} from "@anatomy/data";
import { useViewerStore } from "../store/viewerStore";
import { arterialEn, arterialRo } from "../localization/arterial";
function MixedCheck({
  checked,
  mixed,
  label,
  onChange,
}: {
  checked: boolean;
  mixed: boolean;
  label: string;
  onChange: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useLayoutEffect(() => {
    if (ref.current) ref.current.indeterminate = mixed;
  }, [mixed]);
  return (
    <label className="brain-check">
      <input ref={ref} type="checkbox" checked={checked} onChange={onChange} />
      {label}
    </label>
  );
}
const keys = Object.keys(ARTERIAL_GROUP_NAMES);
export function ArterialExplorer() {
  const { i18n } = useTranslation(),
    locale = i18n.language === "ro" ? "ro" : "en",
    t = locale === "ro" ? arterialRo : arterialEn;
  const systems = useViewerStore((s) => s.activeSystemIds),
    requested = useViewerStore((s) => s.arterialRequested),
    mode = useViewerStore((s) => s.arterialMode),
    groups = useViewerStore((s) => s.arterialGroups),
    levels = useViewerStore((s) => s.arterialLevels),
    sides = useViewerStore((s) => s.arterialSides),
    selected = useViewerStore((s) => s.arterialSelectedIds),
    trace = useViewerStore((s) => s.arterialTraceIds),
    opacity = useViewerStore((s) => s.arterialOpacity),
    status = useViewerStore((s) => s.arterialStatus),
    hiddenIds = useViewerStore((s) => s.hiddenIds),
    isolatedIds = useViewerStore((s) => s.isolatedIds),
    selectedId = useViewerStore((s) => s.selectedId),
    snapshot = useViewerStore((s) => s.arterialSnapshot);
  const [query, setQuery] = useState("");
  const visible = useMemo(
    () =>
      resolveArterialStructureIds(
        ARTERIAL_STRUCTURES,
        systems,
        { hiddenIds, isolatedIds },
        { groups, levels, sides },
      ),
    [systems, hiddenIds, isolatedIds, groups, levels, sides],
  );
  if (
    !systems.has("arterial") &&
    !requested &&
    !arterialMetadataById.has(selectedId ?? "")
  )
    return null;
  const enabled = systems.has("arterial"),
    s = useViewerStore.getState(),
    needed = ARTERIAL_ASSETS.filter((a) =>
      a.structureIds.some((id) => visible.has(id)),
    ),
    error = needed.some((a) => status[a.id] === "error"),
    loading = needed.some((a) => !status[a.id] || status[a.id] === "loading");
  return (
    <section className="arterial-explorer" aria-label={t.title}>
      <details open>
        <summary>
          <h3>{t.title}</h3>
        </summary>
        <p className="coverage-warning">{t.scope}</p>
        <label className="brain-check">
          <input
            type="checkbox"
            checked={enabled}
            onChange={() => s.toggleSystem("arterial")}
          />
          {t.show}
        </label>
        {enabled && (
          <>
            <div
              className="arterial-modes"
              role="radiogroup"
              aria-label={t.modes}
            >
              {(["natural", "colors", "pathways"] as const).map((id) => (
                <label
                  key={id}
                  className={`arterial-mode ${mode === id ? "is-selected" : ""}`}
                >
                  <input
                    type="radio"
                    name="arterial-mode"
                    checked={mode === id}
                    onChange={() => s.setArterialMode(id)}
                  />
                  <svg
                    viewBox="0 0 60 60"
                    aria-hidden="true"
                    className={`arterial-preview ${id}`}
                  >
                    <path d="M30 54V24Q30 8 42 12Q51 15 44 22M30 24L15 13M30 32L46 29M30 42L14 35M30 50L43 48" />
                    <path
                      className="arterial-preview-branch"
                      d="M15 13V5M15 13L5 16M46 29L52 21M14 35L5 38M43 48L52 43"
                    />
                  </svg>
                  <strong>{t[id]}</strong>
                </label>
              ))}
            </div>
            <p className="arterial-status" role={error ? "alert" : "status"}>
              {error ? t.error : loading ? t.loading : t.ready}{" "}
              {error && <button onClick={s.retryArterial}>{t.retry}</button>}
            </p>
            <p>
              {visible.size}/{ARTERIAL_STRUCTURES.length} {t.count}
            </p>
            <MixedCheck
              checked={groups.size === keys.length}
              mixed={groups.size > 0 && groups.size < keys.length}
              label={t.all}
              onChange={() =>
                s.setArterialGroups(groups.size === keys.length ? [] : keys)
              }
            />
            <fieldset>
              <legend>{t.detail}</legend>
              {(["major", "named", "fine"] as const).map((id) => (
                <label className="brain-check" key={id}>
                  <input
                    type="checkbox"
                    checked={levels.has(id)}
                    onChange={() => s.toggleArterialLevel(id as ArterialLevel)}
                  />
                  {t[id]}
                </label>
              ))}
            </fieldset>
            <details>
              <summary>{t.sides}</summary>
              {(["left", "right", "midline", "bilateral"] as const).map(
                (id) => (
                  <label key={id} className="brain-check">
                    <input
                      type="checkbox"
                      checked={sides.has(id)}
                      onChange={() => s.toggleArterialSide(id as Laterality)}
                    />
                    {t[id]}
                  </label>
                ),
              )}
            </details>
            <label className="brain-opacity">
              {t.opacity} <output>{Math.round(opacity * 100)}%</output>
              <input
                type="range"
                aria-label={t.opacity}
                min="0"
                max="1"
                step="0.05"
                value={opacity}
                onChange={(e) => s.setArterialOpacity(Number(e.target.value))}
              />
            </label>
            <input
              className="arterial-search"
              type="search"
              aria-label={t.search}
              placeholder={t.search}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div className="arterial-actions">
              <span>
                {selected.size} {t.selected}
              </span>
              <button onClick={() => s.setArterialSelection([])}>
                {t.clear}
              </button>
              <label>
                {t.color}
                <input
                  type="color"
                  aria-label={t.color}
                  defaultValue="#cf8585"
                  disabled={!selected.size}
                  onChange={(e) => s.styleArterialSelection(e.target.value)}
                />
              </label>
              <button onClick={s.resetArterialStyles}>{t.reset}</button>
              <button
                disabled={!selected.size}
                onClick={() => s.setCameraView("focus")}
              >
                {t.focus}
              </button>
              <button
                disabled={!selected.size}
                onClick={s.isolateArterialSelection}
              >
                {t.isolate}
              </button>
              <button
                disabled={!selected.size}
                onClick={() => s.setStructuresHidden([...selected], true)}
              >
                {t.hide}
              </button>
              {snapshot && (
                <button onClick={s.restoreArterial}>{t.restore}</button>
              )}
            </div>
            <div className="arterial-tree">
              {keys.map((key) => {
                const members = ARTERIAL_STRUCTURES.filter(
                    (p) =>
                      p.arterialGroup === key &&
                      [
                        p.names.en,
                        p.names.ro,
                        p.id,
                        p.latinName,
                        ...(p.synonyms?.en ?? []),
                      ].some((n) =>
                        n?.toLowerCase().includes(query.toLowerCase()),
                      ),
                  ),
                  ids = members.map((p) => p.id),
                  count = ids.filter((id) => selected.has(id)).length;
                return (
                  <details key={key} data-arterial-group={key}>
                    <summary>
                      <span
                        className="arterial-swatch"
                        style={{ background: ARTERIAL_PALETTE[key] }}
                      />
                      {ARTERIAL_GROUP_NAMES[key]![locale]}{" "}
                      <small>{members.length}</small>
                    </summary>
                    <label className="brain-check">
                      <input
                        type="checkbox"
                        checked={groups.has(key)}
                        onChange={() =>
                          s.setArterialGroups(
                            groups.has(key)
                              ? [...groups].filter((k) => k !== key)
                              : [...groups, key],
                          )
                        }
                      />
                      {t.groupVisibility}
                    </label>
                    <button onClick={() => s.setArterialGroups([key])}>
                      {t.regionOnly}
                    </button>
                    <MixedCheck
                      label={t.groupSelect}
                      checked={count === ids.length && ids.length > 0}
                      mixed={count > 0 && count < ids.length}
                      onChange={() =>
                        s.setArterialSelection(
                          count === ids.length
                            ? [...selected].filter((id) => !ids.includes(id))
                            : [...new Set([...selected, ...ids])],
                        )
                      }
                    />
                    {members.map((p) => (
                      <div className="arterial-row" key={p.id}>
                        <input
                          aria-label={`${t.selection}: ${p.names[locale]}`}
                          type="checkbox"
                          checked={selected.has(p.id)}
                          onChange={() => s.selectArtery(p.id, true)}
                        />
                        <button
                          data-arterial-id={p.id}
                          onClick={(e) =>
                            s.selectArtery(
                              p.id,
                              e.shiftKey || e.ctrlKey || e.metaKey,
                            )
                          }
                        >
                          {p.names[locale]}
                        </button>
                      </div>
                    ))}
                  </details>
                );
              })}
            </div>
            {mode === "pathways" && (
              <div className="arterial-pathways">
                <p>{t.traceNote}</p>
                <button
                  disabled={!arterialMetadataById.has(selectedId ?? "")}
                  onClick={() => s.traceArtery("origin")}
                >
                  {t.origin}
                </button>
                <button
                  disabled={!arterialMetadataById.has(selectedId ?? "")}
                  onClick={() => s.traceArtery("branches")}
                >
                  {t.branches}
                </button>
                {trace.size === 1 && <p>{t.noTrace}</p>}
                <ol>
                  {[...trace].map((id) => (
                    <li key={id}>
                      {structureById.get(id)?.names[locale] ?? id}
                    </li>
                  ))}
                </ol>
                <p className="coverage-warning">{t.territory}</p>
              </div>
            )}
            <p>{t.shared}</p>
            <p>{t.sex}</p>
          </>
        )}
        <details>
          <summary>{t.inventory}</summary>
          <p>
            {ARTERIAL_GEOMETRY.length} {t.available}. {t.review}.
          </p>
          <p>{t.missing}:</p>
          <ul>
            {ARTERIAL_MANIFEST.missing.map((p) => (
              <li key={p.id}>{p.names[locale]}</li>
            ))}
          </ul>
          <p>{t.acquire}</p>
        </details>
        <a href={ARTERIAL_MANIFEST.licenseUrl} target="_blank" rel="noreferrer">
          {t.source} · BodyParts3D 4.0 · CC BY 4.0
        </a>
      </details>
    </section>
  );
}
export function ArterialDetails({ id }: { id: string }) {
  const { i18n } = useTranslation(),
    locale = i18n.language === "ro" ? "ro" : "en",
    t = locale === "ro" ? arterialRo : arterialEn,
    m = arterialMetadataById.get(id);
  if (!m) return null;
  const edges = ARTERIAL_EDGES.filter((e) => e.from === id || e.to === id),
    s = structureById.get(id)!;
  return (
    <details className="arterial-details" open>
      <summary>{t.details}</summary>
      <p>
        {s.names.en} · {s.names.ro}
      </p>
      <p>{s.latinName ?? t.latin}</p>
      <code>{m.terminologyId}</code>
      <p>{t.geometry}</p>
      <p>{t.review}</p>
      <p>{t.representation}</p>
      {m.grouped && <p>{t.set}</p>}
      <p>
        {t.laterality}: {t[m.laterality]}
      </p>
      <details>
        <summary>
          {t.graph} ({edges.length})
        </summary>
        {edges.map((e) => (
          <p key={`${e.from}:${e.to}`}>
            {structureById.get(e.from)?.names[locale]} →{" "}
            {structureById.get(e.to)?.names[locale]} ·{" "}
            <a href={e.sourceUrl} target="_blank" rel="noreferrer">
              {t.source}
            </a>
          </p>
        ))}
      </details>
    </details>
  );
}
