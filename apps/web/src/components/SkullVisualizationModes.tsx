import { useId } from "react";
import { useTranslation } from "react-i18next";
import type { Locale } from "@anatomy/core";
import {
  SKULL_VISUALIZATION_MODES,
  type SkullVisualizationMode,
} from "@anatomy/data";
import { useViewerStore } from "../store/viewerStore";

// Code-native, lightweight design thumbnails, not anatomical segmentation data.
// All modes use the same illustrative silhouette; only its surface style varies.
function SkullThumbnail({
  mode,
  label,
}: {
  mode: SkullVisualizationMode;
  label: string;
}) {
  const gradient = useId();
  const colored = mode.thumbnailId === "colored";
  const xray = mode.thumbnailId === "xray";
  const bone = colored ? "#ffff00" : xray ? "#9fc9df" : "#c7c3ba";
  return (
    <svg
      className="skull-mode-thumbnail"
      viewBox="0 0 120 120"
      role="img"
      aria-label={label}
    >
      <defs>
        <radialGradient id={gradient}>
          <stop offset="0" stopColor={xray ? "#254a63" : "#20323d"} />
          <stop offset="1" stopColor="#091621" />
        </radialGradient>
      </defs>
      <rect width="120" height="120" rx="8" fill={`url(#${gradient})`} />
      <g
        transform="translate(0 15)"
        stroke={xray ? "#d6effc" : "#9bafa9"}
        strokeWidth="0.6"
        strokeLinejoin="round"
        fill={bone}
        fillOpacity={xray ? "0.3" : "1"}
      >
        <path d="M29 38C25 16 38 5 60 5S95 16 91 38L86 49 78 54 72 64H48L42 54 34 49Z" />
        <path
          d="M29 38 35 30 43 36 42 49 34 49Z"
          fill={colored ? "#11eb00" : bone}
        />
        <path
          d="M91 38 85 30 77 36 78 49 86 49Z"
          fill={colored ? "#13ee02" : bone}
        />
        <path
          d="M34 49 43 44 50 49 54 58 48 64 42 54Z"
          fill={colored ? "#00d5d7" : bone}
        />
        <path
          d="M86 49 77 44 70 49 66 58 72 64 78 54Z"
          fill={colored ? "#02d8d9" : bone}
        />
        <path
          d="M47 49 53 45H67L73 49 71 64H49Z"
          fill={colored ? "#badb28" : bone}
        />
        <path d="M60 7V29M32 28 42 31M88 28 78 31" fill="none" opacity="0.45" />
        <path
          d="M34 52 40 57 44 69Q60 79 76 69L80 57 86 52 82 70Q60 88 38 70Z"
          fill={colored ? "#c7c3ba" : bone}
        />
        <path
          d="M38 38Q43 32 52 36L53 44Q45 49 39 44ZM82 38Q77 32 68 36L67 44Q75 49 81 44Z"
          fill="#0b1a25"
          fillOpacity={xray ? "0.4" : "0.95"}
        />
        <path d="M60 44 55 55 60 53 65 55Z" fill="#132633" />
        <path
          d="M48 62H72M49 66H71M53 60V68M58 60V69M63 60V69M68 60V68"
          fill="none"
          opacity="0.65"
        />
      </g>
    </svg>
  );
}

function SkullModeCard({ mode }: { mode: SkullVisualizationMode }) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language as Locale;
  const selected = useViewerStore((state) => state.skullViewMode === mode.id);
  const setMode = useViewerStore((state) => state.setSkullViewMode);
  const id = useId();
  return (
    <label
      className={`skull-mode-card ${selected ? "is-selected" : ""}`}
      title={`${mode.names[locale]}: ${mode.description[locale]}`}
    >
      <input
        type="radio"
        name="skull-primary-mode"
        className="sr-only"
        value={mode.id}
        checked={selected}
        disabled={!mode.implemented}
        aria-labelledby={`${id}-title`}
        aria-describedby={`${id}-description`}
        onChange={() => {
          const registered = SKULL_VISUALIZATION_MODES.find(
            (item) => item.id === mode.id,
          );
          if (registered?.implemented) setMode(registered.id);
        }}
      />
      <SkullThumbnail
        mode={mode}
        label={`${t("skullModes.preview")}: ${mode.names[locale]}`}
      />
      <span className="skull-mode-check" aria-hidden="true">
        {selected ? "✓" : ""}
      </span>
      <strong id={`${id}-title`}>{mode.names[locale]}</strong>
      <small className="sr-only" id={`${id}-description`}>
        {mode.description[locale]}
      </small>
    </label>
  );
}

export function SkullVisualizationModes() {
  const { t } = useTranslation();
  const mode = useViewerStore((state) => state.skullViewMode);
  return (
    <section className="skull-modes" aria-labelledby="skull-modes-title">
      <span className="eyebrow">{t("skullModes.bones")}</span>
      <h3 id="skull-modes-title">{t("skullModes.title")}</h3>
      <p className="skull-mode-hint" id="skull-modes-hint">
        {t("skullModes.hint")}
      </p>
      <div
        className="skull-mode-grid"
        role="radiogroup"
        aria-labelledby="skull-modes-title"
        aria-describedby="skull-modes-hint"
      >
        {SKULL_VISUALIZATION_MODES.map((item) => (
          <SkullModeCard key={item.id} mode={item} />
        ))}
      </div>
      {mode === "xray" && (
        <p className="skull-xray-note">{t("skullModes.xrayNote")}</p>
      )}
    </section>
  );
}
