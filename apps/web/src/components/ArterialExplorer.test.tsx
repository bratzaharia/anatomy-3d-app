import { render, screen, fireEvent, within } from "@testing-library/react";
import { beforeEach, it, expect } from "vitest";
import i18n from "../localization/i18n";
import { ARTERIAL_GROUP_NAMES } from "@anatomy/data";
import { useViewerStore } from "../store/viewerStore";
import { ArterialExplorer } from "./ArterialExplorer";
import { arterialEn, arterialRo } from "../localization/arterial";
beforeEach(async () => {
  await i18n.changeLanguage("en");
  useViewerStore.setState({
    activeSystemIds: new Set(["arterial"]),
    arterialGroups: new Set(Object.keys(ARTERIAL_GROUP_NAMES)),
    arterialLevels: new Set(["major"]),
    arterialSides: new Set(),
    arterialSelectedIds: new Set(),
    arterialTraceIds: new Set(),
    arterialSnapshot: null,
    arterialMode: "natural",
    arterialRequested: true,
    hiddenIds: new Set(),
    isolatedIds: new Set(),
    arterialStatus: {},
  });
});
it("exposes exactly three native modes and truthful source limitations in both locales", async () => {
  const { rerender } = render(<ArterialExplorer />);
  expect(screen.getAllByRole("radio")).toHaveLength(3);
  fireEvent.click(screen.getByRole("radio", { name: "Pathways" }));
  expect(screen.getByText(arterialEn.territory)).toBeInTheDocument();
  expect(Object.keys(arterialRo).sort()).toEqual(
    Object.keys(arterialEn).sort(),
  );
  await i18n.changeLanguage("ro");
  rerender(<ArterialExplorer />);
  expect(screen.getByRole("radio", { name: "Trasee" })).toBeChecked();
  expect(screen.getByText(arterialRo.territory)).toBeInTheDocument();
});
it("uses indeterminate group selection and independent region visibility", () => {
  const { container } = render(<ArterialExplorer />);
  const group = container.querySelector('[data-arterial-group="upper-limb"]')!;
  fireEvent.click(
    within(group as HTMLElement).getByLabelText(
      /Select this group:.*right radial artery/,
    ),
  );
  const selectAll = within(group as HTMLElement).getByLabelText(
    "Select all in group",
  ) as HTMLInputElement;
  expect(selectAll.indeterminate).toBe(true);
  fireEvent.click(selectAll);
  expect(useViewerStore.getState().arterialSelectedIds.size).toBe(44);
  fireEvent.click(within(group as HTMLElement).getByLabelText("Visibility"));
  expect(useViewerStore.getState().arterialGroups.has("upper-limb")).toBe(
    false,
  );
  expect(useViewerStore.getState().arterialGroups.has("cerebral")).toBe(true);
});
