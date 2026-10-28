import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import "../localization/i18n";
import { AVAILABLE_SYSTEM_IDS } from "@anatomy/data";
import { useViewerStore } from "../store/viewerStore";
import { LeftPanel } from "./LeftPanel";

describe("layer filters", () => {
  beforeEach(() =>
    useViewerStore.getState().replaceSystems(AVAILABLE_SYSTEM_IDS),
  );

  it("keeps sourced bones and muscles independent and unsourced layers planned", () => {
    render(<LeftPanel />);
    const skeletal = screen.getByLabelText("Sistem osos");
    const muscular = screen.getByLabelText(/Sistem muscular/);
    fireEvent.click(skeletal);
    expect(skeletal).not.toBeChecked();
    expect(muscular).toBeEnabled();
    expect(muscular).toBeChecked();
    expect(screen.getByLabelText(/Sistem nervos/)).toBeDisabled();
  });

  it("clears all filters from the derived All control", () => {
    render(<LeftPanel />);
    fireEvent.click(screen.getByLabelText("Toate straturile"));
    expect(useViewerStore.getState().activeSystemIds.size).toBe(0);
  });
});
