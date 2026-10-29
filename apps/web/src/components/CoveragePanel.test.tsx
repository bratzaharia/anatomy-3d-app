import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import i18n from "../localization/i18n";
import { CoveragePanel } from "./CoveragePanel";
import { useViewerStore } from "../store/viewerStore";
describe("bilingual coverage explorer", () => {
  beforeEach(() => {
    i18n.changeLanguage("ro");
    useViewerStore.setState({
      activeRegionId: "whole-body",
      selectedId: null,
      activeSystemIds: new Set(["skeletal"]),
    });
  });
  it("shows explicit skeletal gaps and selects inventory without enabling geometry", () => {
    render(<CoveragePanel />);
    const region = screen.getByRole("region", { name: "Acoperire și lipsuri" });
    fireEvent.click(within(region).getByText("Acoperire și lipsuri"));
    expect(within(region).getByText(/199 individuale/)).toBeInTheDocument();
    fireEvent.click(within(region).getByRole("button", { name: /^Coccis/ }));
    expect(useViewerStore.getState().selectedId).toBe("bone-coccyx");
    expect(useViewerStore.getState().activeSystemIds).toEqual(
      new Set(["skeletal"]),
    );
  });
  it("filters regional muscular gaps and preserves localization", async () => {
    useViewerStore.setState({ activeRegionId: "head" });
    render(<CoveragePanel />);
    fireEvent.click(screen.getByText("Acoperire și lipsuri"));
    fireEvent.change(screen.getByLabelText("Sistem de verificat"), {
      target: { value: "muscular" },
    });
    fireEvent.change(screen.getByLabelText("Caută în inventar"), {
      target: { value: "maseter" },
    });
    expect(screen.getAllByRole("button")).toHaveLength(2);
    await i18n.changeLanguage("en");
    expect(
      screen.getByRole("region", { name: "Coverage and gaps" }),
    ).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Search inventory"), {
      target: { value: "masseter" },
    });
    expect(screen.getAllByRole("button")).toHaveLength(2);
  });
});
