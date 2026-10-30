import { beforeEach, it, expect } from "vitest";
import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import i18n from "../localization/i18n";
import { useViewerStore } from "../store/viewerStore";
import { CardiacExplorer } from "./CardiacExplorer";
import { heartEn, heartRo } from "../localization/heart";
beforeEach(async () => {
  cleanup();
  await i18n.changeLanguage("en");
  useViewerStore.setState({
    activeSystemIds: new Set(["skeletal", "venous"]),
    cardiacEnabled: false,
    cardiacRequested: false,
    cardiacMode: "natural",
    cardiacGroups: new Set(["walls"]),
    cardiacSelectedIds: new Set(),
    cardiacStyles: {},
    cardiacOpacity: 1,
    cardiacWallOpacity: 1,
    cardiacClip: false,
    selectedId: null,
    hiddenIds: new Set(),
    isolatedIds: new Set(),
  });
});
it("shows an independent organ control and exactly three mode radios only after opt-in", () => {
  render(<CardiacExplorer />);
  expect(screen.queryByRole("radiogroup")).toBeNull();
  fireEvent.click(screen.getByLabelText("Show heart"));
  expect(screen.getAllByRole("radio")).toHaveLength(3);
  expect(screen.getByRole("radio", { name: "Natural" })).toBeChecked();
  expect([...useViewerStore.getState().activeSystemIds]).toEqual([
    "skeletal",
    "venous",
  ]);
});
it("supports partial selections, safe colors, visibility and exact material reset", () => {
  const s = useViewerStore.getState();
  s.setCardiacEnabled(true);
  render(<CardiacExplorer />);
  s.selectCardiac("cardiac-fma9457");
  expect(useViewerStore.getState().cardiacSelectedIds.size).toBe(1);
  s.styleCardiacSelection("#123456");
  s.styleCardiacSelection("url(bad)");
  expect(useViewerStore.getState().cardiacStyles).toEqual({
    "cardiac-fma9457": "#123456",
  });
  s.isolateCardiacSelection();
  expect(useViewerStore.getState().isolatedIds).toEqual(
    new Set(["cardiac-fma9457"]),
  );
  s.setCardiacOpacity(0);
  s.setCardiacOpacity(NaN);
  expect(useViewerStore.getState().cardiacOpacity).toBe(0);
  s.resetCardiacStyles();
  expect(useViewerStore.getState().cardiacStyles).toEqual({});
  expect(useViewerStore.getState().cardiacOpacity).toBe(1);
  expect(Object.keys(heartRo).sort()).toEqual(Object.keys(heartEn).sort());
});
it("keeps the cardiac organ visible when the venous system is disabled", () => {
  const s = useViewerStore.getState();
  s.setCardiacEnabled(true);
  s.toggleSystem("venous");
  expect(useViewerStore.getState().cardiacEnabled).toBe(true);
  expect(useViewerStore.getState().activeSystemIds.has("venous")).toBe(false);
  render(<CardiacExplorer />);
  expect(screen.getByLabelText("Show heart")).toBeChecked();
  fireEvent.click(screen.getByLabelText("Show heart"));
  expect(screen.getByLabelText("Show heart")).not.toBeChecked();
});
