import { fireEvent, render, screen, within } from "@testing-library/react";
import { act } from "react";
import { beforeEach, describe, expect, it } from "vitest";
import i18n from "../localization/i18n";
import { useViewerStore } from "../store/viewerStore";
import { Inspector } from "./Inspector";

describe("contextual skull visualization cards", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("ro");
    useViewerStore.setState({
      skullViewMode: "simple",
      selectedId: "skull",
      activeRegionId: "whole-body",
    });
  });
  it("shows three accessible cards in the skull inspector, with Simple checked", () => {
    render(<Inspector />);
    const group = screen.getByRole("radiogroup", {
      name: "Moduri de vizualizare pentru craniu",
    });
    expect(within(group).getAllByRole("radio")).toHaveLength(3);
    expect(within(group).getByRole("radio", { name: "Simplu" })).toBeChecked();
    expect(within(group).getAllByRole("img")).toHaveLength(3);
  });
  it("enforces exclusivity and preserves selection and camera across mode/language changes", async () => {
    render(<Inspector />);
    const before = useViewerStore.getState();
    fireEvent.click(screen.getByRole("radio", { name: "Colorat" }));
    expect(
      screen
        .getAllByRole("radio")
        .filter((radio) => (radio as HTMLInputElement).checked),
    ).toHaveLength(1);
    fireEvent.click(screen.getByRole("radio", { name: "Radiografie" }));
    expect(screen.getByText(/nu radiografie clinică/)).toBeVisible();
    expect(useViewerStore.getState().cameraCommand).toBe(before.cameraCommand);
    expect(useViewerStore.getState().selectedId).toBe("skull");
    await act(async () => {
      await i18n.changeLanguage("en");
    });
    expect(screen.getByRole("radio", { name: "X-ray" })).toBeChecked();
    expect(
      screen.getByRole("radiogroup", { name: "Skull Visualization Modes" }),
    ).toBeVisible();
    expect(screen.getByRole("radio", { name: "Simple" })).not.toBeChecked();
  });
  it("shows head context with no selection, but never a muscle or unrelated bone", () => {
    useViewerStore.setState({ selectedId: null, activeRegionId: "head" });
    const { rerender } = render(<Inspector />);
    expect(screen.getByRole("radiogroup")).toBeVisible();
    act(() => useViewerStore.getState().select("humerus-left"));
    rerender(<Inspector />);
    expect(screen.queryByRole("radiogroup")).not.toBeInTheDocument();
    act(() => useViewerStore.getState().select("muscle-deltoid-left"));
    rerender(<Inspector />);
    expect(screen.queryByRole("radiogroup")).not.toBeInTheDocument();
    act(() => useViewerStore.getState().select("mandible"));
    rerender(<Inspector />);
    expect(screen.getByRole("radiogroup")).toBeVisible();
  });
});
