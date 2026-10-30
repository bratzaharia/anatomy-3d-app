import { beforeEach, describe, expect, it } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import "../localization/i18n";
import i18n from "../localization/i18n";
import { VenousExplorer } from "./VenousExplorer";
import { VenousDetails } from "./VenousDetails";
import { useViewerStore } from "../store/viewerStore";
describe("venous UI and state", () => {
  beforeEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
    useViewerStore.setState({
      activeSystemIds: new Set(["skeletal"]),
      venousSnapshot: null,
      venousTraceIds: new Set(),
      hiddenIds: new Set(["skull"]),
      isolatedIds: new Set(),
      selectedId: null,
      venousRequested: false,
      venousSelectedIds: new Set(),
      venousOpacity: 1,
    });
    useViewerStore.getState().setAllVenousGroups(true);
  });
  it("only appears for the independently enabled venous layer", () => {
    const { rerender } = render(<VenousExplorer />);
    expect(screen.queryByText("Layer 04 — Venous system")).toBeNull();
    const before = useViewerStore.getState();
    before.toggleSystem("venous");
    rerender(<VenousExplorer />);
    expect(screen.getByText("Layer 04 — Venous system")).toBeVisible();
    expect(useViewerStore.getState().venousRequested).toBe(true);
    expect(useViewerStore.getState().cameraCommand).toBe(before.cameraCommand);
    expect(useViewerStore.getState().activeSystemIds.has("skeletal")).toBe(
      true,
    );
    fireEvent.click(screen.getByLabelText("All veins"));
    expect(useViewerStore.getState().venousGroups.size).toBe(0);
    fireEvent.click(screen.getByLabelText("All veins"));
    fireEvent.click(screen.getByRole("radio", { name: "Blue" }));
    expect(useViewerStore.getState().venousMode).toBe("blue");
    fireEvent.change(screen.getByRole("slider"), { target: { value: "0.5" } });
    expect(useViewerStore.getState().venousOpacity).toBe(0.5);
    expect(useViewerStore.getState().hiddenIds).toBe(before.hiddenIds);
  });
  it("keeps multi-selection additive and returns from tracing without changing bone state", () => {
    useViewerStore.getState().toggleSystem("venous");
    const before = useViewerStore.getState();
    before.selectVein("venous-cephalic-vein-left");
    before.selectVein("venous-cephalic-vein-right", true);
    expect(useViewerStore.getState().venousSelectedIds.size).toBe(2);
    before.selectVein("venous-cephalic-vein-right", true);
    expect(useViewerStore.getState().selectedId).toBe(
      "venous-cephalic-vein-left",
    );
    before.select(null);
    expect(useViewerStore.getState().venousSelectedIds.size).toBe(0);
    before.selectVein("venous-hepatic-portal-vein");
    before.inspectVenous(true);
    expect(
      useViewerStore
        .getState()
        .venousTraceIds.has("collection-hepatic-sinusoids"),
    ).toBe(true);
    before.restoreVenous();
    expect(useViewerStore.getState().hiddenIds).toBe(before.hiddenIds);
    expect(useViewerStore.getState().isolatedIds).toBe(before.isolatedIds);
    expect(useViewerStore.getState().activeSystemIds).toBe(
      before.activeSystemIds,
    );
    expect(useViewerStore.getState().venousTraceIds.size).toBe(0);
    expect(useViewerStore.getState().venousSelectedIds).toEqual(
      new Set(["venous-hepatic-portal-vein"]),
    );
  });
  it("does not present absent or unreviewed anatomy as approved", () => {
    render(<VenousDetails id="venous-superior-sagittal-sinus" />);
    expect(
      screen.getByText("No accepted geometry; no approximation is drawn"),
    ).toBeVisible();
    expect(screen.getByText(/not medically reviewed/)).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Trace reference drainage" }),
    ).toBeDisabled();
  });
  it("rejects non-finite opacity and preserves unrelated view modes", () => {
    const before = useViewerStore.getState();
    before.setVenousOpacity(NaN);
    expect(useViewerStore.getState().venousOpacity).toBe(1);
    before.setVenousOpacity(5);
    expect(useViewerStore.getState().venousOpacity).toBe(1);
    before.setVenousOpacity(-1);
    expect(useViewerStore.getState().venousOpacity).toBe(0);
    expect(useViewerStore.getState().skullViewMode).toBe(before.skullViewMode);
  });
});
