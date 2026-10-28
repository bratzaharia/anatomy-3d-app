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
