import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

// ─── MovementCard smoke test ──────────────────────────────
import MovementCard from "../components/MovementCard";
import { MOVEMENTS } from "../constants";

describe("MovementCard.tsx — smoke", () => {
  it("renders without crashing with first movement", () => {
    render(<MovementCard movement={MOVEMENTS[0]} />);
    expect(screen.getByText(MOVEMENTS[0].title)).toBeInTheDocument();
  });

  it("shows safety note section", () => {
    render(<MovementCard movement={MOVEMENTS[0]} />);
    expect(screen.getAllByText(/Safety Protocol/i).length).toBeGreaterThan(0);
  });

  it("shows intensity badge", () => {
    render(<MovementCard movement={MOVEMENTS[0]} />);
    expect(
      screen.getAllByText(
        /Intensity|Standard Movement|Modified Movement|Active Rest/i
      ).length
    ).toBeGreaterThan(0);
  });
});
