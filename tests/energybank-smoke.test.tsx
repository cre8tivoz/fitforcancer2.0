import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

// ─── EnergyBank smoke test ──────────────────────────────────
import EnergyBank from "../components/EnergyBank";

describe("EnergyBank.tsx — smoke", () => {
  it("renders without crashing", () => {
    render(<EnergyBank />);
    expect(screen.getAllByText(/Energy Bank/i).length).toBeGreaterThan(0);
  });

  it("shows empty state when no history", () => {
    render(<EnergyBank />);
    expect(screen.getAllByText(/No check-ins saved yet/i).length).toBeGreaterThan(0);
  });
});
