import { beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import "../localization/i18n";
import i18n from "../localization/i18n";
import { BrainExplorer } from "./BrainExplorer";
import { Inspector } from "./Inspector";
import { useViewerStore } from "../store/viewerStore";
import { readBrainPreferences } from "../store/brainState";
import { BRAIN_IDS } from "@anatomy/data";
describe("brain controls and independent state", () => {
  beforeEach(async () => {
    cleanup();
    localStorage.clear();
    await i18n.changeLanguage("en");
    useViewerStore.setState({
      activeSystemIds: new Set(["nervous", "venous"]),
      brainSelectedIds: new Set(),
      brainStyles: {},
      brainMode: "natural",
      brainPalette: "classical",
      brainOpacity: 1,
      brainSnapshot: null,
      venousSnapshot: null,
      nervousIsolationSnapshot: null,
      selectedId: null,
      hiddenIds: new Set(["skull"]),
      isolatedIds: new Set(),
    });
  });
  it("shows exactly three native keyboard-accessible mode radios and blocks all candidate atlas rendering", () => {
    render(<BrainExplorer />);
    expect(screen.getAllByRole("radio")).toHaveLength(3);
    expect(screen.getByRole("radio", { name: "Natural" })).toBeChecked();
    fireEvent.click(screen.getByRole("radio", { name: "Advanced atlas" }));
    expect(screen.getByRole("status")).toHaveTextContent(
      "Atlas not registered",
    );
    fireEvent.change(
      screen.getByLabelText("Candidate atlas (not integrated)"),
      { target: { value: "yeo-17" } },
    );
    expect(useViewerStore.getState().brainAtlasId).toBe("yeo-17");
    fireEvent.click(screen.getByRole("radio", { name: "Natural" }));
    expect(screen.queryByRole("status")).toBeNull();
  });
  it("supports parent partial checks, arbitrary selection, persistent safe styles and exact context restoration", () => {
    render(<BrainExplorer />);
    const original = useViewerStore.getState();
    fireEvent.click(screen.getByRole("button", { name: "Left parts" }));
    expect(useViewerStore.getState().brainSelectedIds.size).toBe(23);
    expect(
      screen.getByLabelText("Select all available parts"),
    ).toBePartiallyChecked();
    fireEvent.click(screen.getByRole("button", { name: "Deselect all" }));
    original.selectBrain(BRAIN_IDS[0]!);
    original.selectBrain(BRAIN_IDS[1]!, true);
    original.styleBrainSelection({ color: "#123456", opacity: 0.5 });
    expect(readBrainPreferences().styles[BRAIN_IDS[0]!]).toEqual({
      color: "#123456",
      opacity: 0.5,
    });
    expect(
      useViewerStore.getState().brainStyles[BRAIN_IDS[2]!],
    ).toBeUndefined();
    expect(useViewerStore.getState().brainPalette).toBe("custom");
    original.setBrainPalette("accessible");
    original.styleBrainSelection({ color: "#224466" });
    expect(useViewerStore.getState().brainPalette).toBe("accessible");
    original.isolateBrainSelection();
    original.hideBrainSelection(true);
    original.restoreBrainContext();
    expect(useViewerStore.getState().hiddenIds).toBe(original.hiddenIds);
    expect(useViewerStore.getState().isolatedIds).toBe(original.isolatedIds);
    expect(useViewerStore.getState().activeSystemIds).toBe(
      original.activeSystemIds,
    );
    expect(useViewerStore.getState().skullViewMode).toBe(
      original.skullViewMode,
    );
    original.styleBrainSelection({ color: "url(bad)" });
    original.setBrainOpacity(NaN);
    expect(useViewerStore.getState().brainStyles[BRAIN_IDS[0]!]!.color).toBe(
      "#224466",
    );
    expect(useViewerStore.getState().brainOpacity).toBe(1);
    original.resetBrainStyles();
    expect(useViewerStore.getState().brainStyles).toEqual({});
  });
  it("retains source selections across atlas candidates without implying parcel mapping", () => {
    const s = useViewerStore.getState();
    s.setBrainSelection(BRAIN_IDS.slice(0, 2));
    s.setBrainMode("atlas");
    s.setBrainAtlas("hcp-mmp-1");
    expect([...useViewerStore.getState().brainSelectedIds]).toEqual(
      BRAIN_IDS.slice(0, 2),
    );
    s.setBrainAtlas("bad");
    expect(useViewerStore.getState().brainAtlasId).toBe("hcp-mmp-1");
  });
  it("reports aggregate brain visibility from its real children and opacity", () => {
    const s = useViewerStore.getState();
    s.select("nervous-brain");
    s.isolateBrainSelection();
    const { rerender } = render(<Inspector />);
    expect(screen.queryByText(/Hidden by current filters/)).toBeNull();
    s.setBrainOpacity(0);
    rerender(<Inspector />);
    expect(screen.getByText(/Hidden by current filters/)).toBeVisible();
  });
  it("does not preempt the existing venous restore context", () => {
    const s = useViewerStore.getState();
    s.setBrainSelection(BRAIN_IDS.slice(0, 2));
    s.isolateBrainSelection();
    const brainContext = useViewerStore.getState().isolatedIds;
    s.selectVein("venous-hepatic-portal-vein");
    s.inspectVenous(true);
    s.restoreVisibility();
    expect(useViewerStore.getState().venousSnapshot).toBeNull();
    expect(useViewerStore.getState().isolatedIds).toBe(brainContext);
    expect(useViewerStore.getState().brainSnapshot).not.toBeNull();
    s.restoreBrainContext();
    expect(useViewerStore.getState().hiddenIds.has("skull")).toBe(true);
    expect(useViewerStore.getState().isolatedIds.size).toBe(0);
  });
});
