import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import "../localization/i18n";
import { useViewerStore } from "../store/viewerStore";
import { Inspector } from "./Inspector";

describe("anatomy inspector", () => {
  beforeEach(() => useViewerStore.getState().select(null));
  it("shows the selected structure and Latin name", () => {
    useViewerStore.getState().select("skull");
    render(<Inspector />);
    expect(
      screen.getByRole("heading", { name: "Craniu (fără mandibulă)" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Cranium").length).toBeGreaterThan(0);
  });
});
