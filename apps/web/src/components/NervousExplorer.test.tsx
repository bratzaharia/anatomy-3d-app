import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { NERVOUS_INVENTORY } from "@anatomy/data";
import i18n from "../localization/i18n";
import { useViewerStore } from "../store/viewerStore";
import { NervousExplorer } from "./NervousExplorer";
import { Inspector } from "./Inspector";

describe("nervous explorer and shared inspector", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("ro");
    useViewerStore.setState({
      activeSystemIds: new Set(["nervous"]),
      selectedId: null,
      activeRegionId: "whole-body",
      hiddenIds: new Set(),
      isolatedIds: new Set(),
      nervousIsolationSnapshot: null,
    });
    useViewerStore.getState().resetNervousFilters();
  });
  it("keeps every catalog member discoverable and clearly distinguishes missing geometry", () => {
    render(<NervousExplorer />);
    expect(document.querySelectorAll(".explorer-members button")).toHaveLength(
      NERVOUS_INVENTORY.length,
    );
    expect(screen.getByText(/465 intrări/)).toBeVisible();
    const before = useViewerStore.getState();
    fireEvent.click(screen.getByLabelText("Sistem nervos central (SNC)"));
    expect(useViewerStore.getState().activeSystemIds).toBe(
      before.activeSystemIds,
    );
    expect(useViewerStore.getState().cameraCommand).toBe(before.cameraCommand);
  });
  it("shows a missing spinal cord honestly and disables actions that need real geometry", () => {
    useViewerStore.setState({ selectedId: "nervous-spinal-cord" });
    render(<Inspector />);
    expect(screen.getByText(/Geometrie în carantină/)).toBeVisible();
    expect(screen.getByRole("button", { name: "Focalizează" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Izolează" })).toBeDisabled();
  });
  it("classifies optic nerve as CNS, with normal focus/selection actions", () => {
    useViewerStore.setState({ selectedId: "nervous-optic-nerve-left" });
    render(<Inspector />);
    expect(screen.getByText(/tract al SNC/)).toBeVisible();
    expect(screen.getByRole("button", { name: "Focalizează" })).toBeEnabled();
  });
});
