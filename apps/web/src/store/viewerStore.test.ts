import { beforeEach, describe, expect, it } from "vitest";
import { useViewerStore } from "./viewerStore";
describe("independent muscular state", () => {
  beforeEach(() =>
    useViewerStore.setState({
      activeSystemIds: new Set(["skeletal"]),
      selectedId: "skull",
      hoveredId: null,
      muscleOpacity: 1,
      muscleRequested: false,
      muscleStatus: "idle",
      hiddenIds: new Set(),
      isolatedIds: new Set(),
    }),
  );
  it("retains bone selection, camera and cached request state on layer changes", () => {
    const command = useViewerStore.getState().cameraCommand;
    useViewerStore.getState().toggleSystem("muscular");
    expect([...useViewerStore.getState().activeSystemIds]).toEqual([
      "skeletal",
      "muscular",
    ]);
    expect(useViewerStore.getState().selectedId).toBe("skull");
    expect(useViewerStore.getState().cameraCommand).toBe(command);
    useViewerStore.getState().toggleSystem("muscular");
    expect(useViewerStore.getState().muscleRequested).toBe(true);
    expect(useViewerStore.getState().activeSystemIds.has("skeletal")).toBe(
      true,
    );
  });
  it("only changes muscle opacity and contextual visibility with predictable overrides", () => {
    const before = useViewerStore.getState();
    before.setMuscleOpacity(0.5);
    expect(useViewerStore.getState().activeSystemIds).toBe(
      before.activeSystemIds,
    );
    expect(useViewerStore.getState().selectedId).toBe("skull");
    useViewerStore
      .getState()
      .setStructuresHidden(["muscle-deltoid-left"], true);
    expect(useViewerStore.getState().hiddenIds.has("skull")).toBe(false);
    useViewerStore.setState({ isolatedIds: new Set(["skull"]) });
    useViewerStore
      .getState()
      .setStructuresHidden(["muscle-deltoid-left"], false);
    expect(useViewerStore.getState().hiddenIds.size).toBe(0);
    expect(useViewerStore.getState().isolatedIds.size).toBe(0);
  });
});

describe("independent skull display state", () => {
  it("defaults to simple and validates mode IDs without touching other viewer state", () => {
    useViewerStore.getState().setSkullViewMode("simple");
    const before = useViewerStore.getState();
    expect(before.skullViewMode).toBe("simple");
    for (const mode of ["colored", "xray", "simple"] as const) {
      before.setSkullViewMode(mode);
      const after = useViewerStore.getState();
      expect(after.skullViewMode).toBe(mode);
      for (const key of [
        "selectedId",
        "cameraCommand",
        "hiddenIds",
        "isolatedIds",
        "activeSystemIds",
        "muscleOpacity",
        "muscleRequested",
      ] as const)
        expect(after[key]).toBe(before[key]);
    }
    before.setSkullViewMode("unimplemented" as "simple");
    expect(useViewerStore.getState().skullViewMode).toBe("simple");
  });
});

describe("independent nervous state and reversible inspection", () => {
  beforeEach(() => {
    useViewerStore.setState({
      activeSystemIds: new Set(["skeletal", "muscular"]),
      selectedId: null,
      nervousRequested: false,
      nervousStatus: "idle",
      nervousIsolationSnapshot: null,
      hiddenIds: new Set(["skull"]),
      isolatedIds: new Set(),
    });
    useViewerStore.getState().resetNervousFilters();
  });
  it("loads on first activation only and preserves other layers and camera", () => {
    const before = useViewerStore.getState();
    before.toggleSystem("nervous");
    const active = useViewerStore.getState();
    expect(active.nervousRequested).toBe(true);
    expect(active.nervousStatus).toBe("loading");
    expect(
      active.activeSystemIds.has("skeletal") &&
        active.activeSystemIds.has("muscular"),
    ).toBe(true);
    expect(active.cameraCommand).toBe(before.cameraCommand);
    active.toggleSystem("nervous");
    expect(useViewerStore.getState().nervousRequested).toBe(true);
    expect(useViewerStore.getState().muscleOpacity).toBe(before.muscleOpacity);
  });
  it("restores the exact pre-isolation overrides without changing global filters", () => {
    const before = useViewerStore.getState();
    before.select("nervous-pons");
    before.isolateSelected();
    expect([...useViewerStore.getState().isolatedIds]).toEqual([
      "nervous-pons",
    ]);
    useViewerStore.getState().restoreVisibility();
    expect(useViewerStore.getState().hiddenIds).toBe(before.hiddenIds);
    expect(useViewerStore.getState().isolatedIds).toBe(before.isolatedIds);
    expect(useViewerStore.getState().activeSystemIds).toBe(
      before.activeSystemIds,
    );
    expect(useViewerStore.getState().nervousIsolationSnapshot).toBeNull();
  });
  it("limits nervous facets to their own state and resets them independently", () => {
    const before = useViewerStore.getState();
    before.toggleNervousDivision("pns");
    before.toggleNervousFunction("parasympathetic");
    before.toggleNervousRegion("head");
    const after = useViewerStore.getState();
    expect(after.activeSystemIds).toBe(before.activeSystemIds);
    expect(after.hiddenIds).toBe(before.hiddenIds);
    expect(after.cameraCommand).toBe(before.cameraCommand);
    before.resetNervousFilters();
    expect(useViewerStore.getState().nervousDivisions.size).toBe(3);
    expect(useViewerStore.getState().nervousFunctions.size).toBe(0);
  });
  it("reveals head geometry without toggling other layers and restores prior overrides and facets", () => {
    useViewerStore.getState().toggleSystem("nervous");
    useViewerStore.setState({
      hiddenIds: new Set(["skull", "nervous-brain", "nervous-pons"]),
      isolatedIds: new Set(["skull"]),
      nervousDivisions: new Set(["pns"]),
      nervousFunctions: new Set(["motor"]),
      nervousRegions: new Set(["pelvis"]),
    });
    const before = useViewerStore.getState();
    before.inspectNervousSystem();
    const shown = useViewerStore.getState();
    expect(shown.activeSystemIds).toBe(before.activeSystemIds);
    expect(shown.hiddenIds).toEqual(new Set(["skull"]));
    expect(shown.isolatedIds.size).toBe(84);
    expect(shown.selectedId).toBe("nervous-brain");
    expect(shown.cameraCommand.view).toBe("focus");
    expect(shown.nervousDivisions.size).toBe(3);
    expect(shown.nervousFunctions.size).toBe(0);
    expect(shown.nervousRegions.size).toBe(0);
    shown.inspectNervousSystem();
    shown.restoreVisibility();
    const restored = useViewerStore.getState();
    for (const key of [
      "hiddenIds",
      "isolatedIds",
      "nervousDivisions",
      "nervousFunctions",
      "nervousRegions",
    ] as const)
      expect(restored[key]).toBe(before[key]);
  });
});
