import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

// ─── MovementCard smoke test ──────────────────────────────
import MovementCard from "../components/MovementCard";
import { MOVEMENTS } from "../constants";

describe("MovementCard.tsx — smoke", () => {
  it("renders the movement title as the card's clear heading", () => {
    render(<MovementCard movement={MOVEMENTS[0]} />);
    expect(
      screen.getByRole("heading", { level: 3, name: MOVEMENTS[0].title })
    ).toBeInTheDocument();
  });

  it("shows safety note section", () => {
    render(<MovementCard movement={MOVEMENTS[0]} />);
    expect(screen.getAllByText(/Things to watch/i).length).toBeGreaterThan(0);
  });

  it("shows intensity badge", () => {
    render(<MovementCard movement={MOVEMENTS[0]} />);
    expect(
      screen.getAllByText(
        /More Energy|Take It Easier|Low Battery/i
      ).length
    ).toBeGreaterThan(0);
  });
});
