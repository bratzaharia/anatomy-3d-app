import { beforeEach, describe, it, expect } from "vitest";
import { useViewerStore } from "./viewerStore";
import { ARTERIAL_GROUP_NAMES } from "@anatomy/data";
import { arterialColor } from "../scene/arterialMaterials";
describe("independent arterial interaction", () => {
  beforeEach(() =>
    useViewerStore.setState({
      activeSystemIds: new Set(["skeletal", "arterial"]),
      arterialGroups: new Set(Object.keys(ARTERIAL_GROUP_NAMES)),
      arterialLevels: new Set(["major"]),
      arterialSides: new Set(),
      arterialSelectedIds: new Set(),
      arterialStyles: {},
      arterialTraceIds: new Set(),
      arterialSnapshot: null,
      arterialMode: "natural",
      arterialOpacity: 1,
      hiddenIds: new Set(),
      isolatedIds: new Set(),
      selectedId: null,
    }),
  );
  it("colors independent IDs reversibly without changing any older layer", () => {
    const s = useViewerStore.getState();
    s.selectArtery("arterial-fma22734");
    s.selectArtery("arterial-fma22733", true);
    s.styleArterialSelection("#123456");
    const a = useViewerStore.getState();
    expect(a.arterialSelectedIds.size).toBe(2);
    expect(a.arterialStyles["arterial-fma22734"]).toBe("#123456");
    expect(a.arterialStyles["cardiac-fma3736"]).toBeUndefined();
    expect(a.cardiacStyles).toBe(s.cardiacStyles);
    expect(a.skullViewMode).toBe(s.skullViewMode);
    expect(a.activeSystemIds).toBe(s.activeSystemIds);
    a.resetArterialStyles();
    expect(useViewerStore.getState().arterialStyles).toEqual({});
    expect(arterialColor("natural", "cerebral", "#123456")).toBe(
      arterialColor("natural", "aorta"),
    );
  });
  it("rejects invalid colors/opacity/IDs and leaves camera/layers unchanged", () => {
    const s = useViewerStore.getState();
    s.selectArtery("missing");
    s.styleArterialSelection("url(bad)");
    s.setArterialOpacity(NaN);
    expect(useViewerStore.getState().arterialOpacity).toBe(1);
    expect(useViewerStore.getState().arterialSelectedIds.size).toBe(0);
    s.setArterialOpacity(-1);
    expect(useViewerStore.getState().arterialOpacity).toBe(0);
    expect(useViewerStore.getState().cameraCommand).toBe(s.cameraCommand);
  });
  it("reveals only cited trace data and restores the exact prior filters/overrides", () => {
    const s = useViewerStore.getState();
    s.setArterialGroups(["upper-limb"]);
    s.toggleArterialSide("left");
    s.setStructuresHidden(["arterial-fma3768", "skull"], true);
    s.selectArtery("arterial-fma22734");
    const before = useViewerStore.getState();
    s.traceArtery("origin");
    const a = useViewerStore.getState();
    expect(a.arterialTraceIds.has("cardiac-fma3736")).toBe(true);
    expect(a.hiddenIds.has("skull")).toBe(true);
    expect(a.hiddenIds.has("arterial-fma3768")).toBe(false);
    expect(a.activeSystemIds).toBe(before.activeSystemIds);
    s.restoreArterial();
    const b = useViewerStore.getState();
    expect(b.hiddenIds).toBe(before.hiddenIds);
    expect(b.arterialSides).toBe(before.arterialSides);
    expect(b.arterialGroups).toBe(before.arterialGroups);
    expect(b.arterialTraceIds.size).toBe(0);
  });
});
