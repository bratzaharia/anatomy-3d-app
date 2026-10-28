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
  it("shows every intrinsic-back group member and pending medical details", () => {
    useViewerStore.getState().select("muscle-iliocostalis-lumborum-left");
    const { container } = render(<Inspector />);
    expect(container.querySelectorAll(".member-list button")).toHaveLength(51);
    expect(screen.getByText(/Originea, inserția/)).toBeInTheDocument();
  });
  it("makes missing geometry inspectable without enabling 3D actions", () => {
    useViewerStore.getState().select("muscle-rectus-abdominis-left");
    render(<Inspector />);
    expect(screen.getByRole("button", { name: "Focalizează" })).toBeDisabled();
    expect(screen.getAllByText("fără geometrie").length).toBeGreaterThan(0);
  });
});
