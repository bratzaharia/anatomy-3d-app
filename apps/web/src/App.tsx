import { Component, Suspense, lazy, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { LeftPanel } from "./components/LeftPanel";
import { Inspector } from "./components/Inspector";
import { ViewerOverlay } from "./components/ViewerOverlay";
import { useViewerStore } from "./store/viewerStore";
import { Icon } from "./components/Icon";

const AnatomyCanvas = lazy(() =>
  import("./scene/AnatomyCanvas").then((module) => ({
    default: module.AnatomyCanvas,
  })),
);

function ViewerFallback() {
  const { t } = useTranslation();
  return (
    <div className="viewer-fallback">
      <div className="loader-ring" />
      <span>{t("viewer.loading")}</span>
    </div>
  );
}

class ViewerErrorBoundary extends Component<
  { readonly fallback: ReactNode; readonly children: ReactNode },
  { readonly failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    useViewerStore.setState({ assetStatus: "error" });
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function supportsWebGL2(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2"));
  } catch {
    return false;
  }
}

const WEBGL2_AVAILABLE = supportsWebGL2();

export default function App() {
  const { t, i18n } = useTranslation();
  const leftOpen = useViewerStore((state) => state.leftPanelOpen);
  const rightOpen = useViewerStore((state) => state.rightPanelOpen);
  const toggleLeftPanel = useViewerStore((state) => state.toggleLeftPanel);
  const toggleRightPanel = useViewerStore((state) => state.toggleRightPanel);
  const setLanguage = (locale: "ro" | "en") => {
    localStorage.setItem("anatomy-locale", locale);
    void i18n.changeLanguage(locale);
  };
  return (
    <main
      className={`app-shell ${leftOpen ? "" : "left-collapsed"} ${rightOpen ? "" : "right-collapsed"}`}
    >
      <header className="topbar">
        <div className="brand">
          <svg
            className="brand-mark"
            viewBox="0 0 40 44"
            fill="none"
            aria-hidden="true"
            focusable="false"
          >
            <path
              d="M18 3.2a4 4 0 0 1 4 0l13 7.5a4 4 0 0 1 2 3.5v15.6a4 4 0 0 1-2 3.5l-13 7.5a4 4 0 0 1-4 0L5 33.3a4 4 0 0 1-2-3.5V14.2a4 4 0 0 1 2-3.5L18 3.2Z"
              fill="currentColor"
              fillOpacity="0.07"
              stroke="currentColor"
              strokeOpacity="0.65"
              strokeWidth="1.3"
            />
            <circle cx="20" cy="11.5" r="2.7" fill="currentColor" />
            <path
              d="m12.5 25.5 2.3-7.2a2 2 0 0 1 1.9-1.4h6.6a2 2 0 0 1 1.9 1.4l2.3 7.2M17 19.5V27l-2 8m8-15.5V27l2 8M17 26h6"
              stroke="currentColor"
              strokeWidth="2.1"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M20 19.5v3.8"
              stroke="currentColor"
              strokeOpacity="0.45"
              strokeWidth="1.1"
              strokeLinecap="round"
            />
          </svg>
          <div>
            <h1>{t("app.title")}</h1>
            <p>{t("app.subtitle")}</p>
          </div>
        </div>
        <div className="topbar-actions">
          <button
            className={`panel-toggle left ${leftOpen ? "active" : ""}`}
            onClick={toggleLeftPanel}
            aria-label={t("panels.navigation")}
          >
            <Icon name="panel" />
          </button>
          <div
            className="language-switch"
            role="group"
            aria-label={t("language.label")}
          >
            <button
              className={i18n.language === "ro" ? "active" : ""}
              onClick={() => setLanguage("ro")}
            >
              RO
            </button>
            <button
              className={i18n.language === "en" ? "active" : ""}
              onClick={() => setLanguage("en")}
            >
              EN
            </button>
          </div>
          <button
            className={`panel-toggle ${rightOpen ? "active" : ""}`}
            onClick={toggleRightPanel}
            aria-label={t("panels.inspector")}
          >
            <Icon name="info" />
          </button>
        </div>
      </header>
      {leftOpen && <LeftPanel />}
      <section className="viewport" aria-label="3D anatomy viewport">
        <ViewerErrorBoundary
          fallback={
            <div className="viewer-error">
              <Icon name="info" size={28} />
              <p>{t("error.model")}</p>
              <button
                className="restore-button"
                onClick={() => window.location.reload()}
              >
                {t("error.retry")}
              </button>
            </div>
          }
        >
          {WEBGL2_AVAILABLE ? (
            <Suspense fallback={<ViewerFallback />}>
              <AnatomyCanvas />
            </Suspense>
          ) : (
            <div className="viewer-error">
              <Icon name="info" size={28} />
              <p>{t("error.webgl")}</p>
            </div>
          )}
        </ViewerErrorBoundary>
        <ViewerOverlay supported={WEBGL2_AVAILABLE} />
      </section>
      {rightOpen && <Inspector />}
    </main>
  );
}
