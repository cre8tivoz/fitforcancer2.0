import { afterEach, describe, it, expect } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

import EnergyBank from "../components/EnergyBank";

describe("EnergyBank.tsx — smoke", () => {
  afterEach(() => {
    cleanup();
    window.localStorage.clear();
  });

  it("renders without crashing", () => {
    render(<EnergyBank />);
    expect(screen.getAllByText(/Energy Bank/i).length).toBeGreaterThan(0);
  });

  it("explains the current ATHENA check-in flow when history is empty", () => {
    render(<EnergyBank />);

    expect(screen.getByText(/No check-ins saved yet/i)).toBeInTheDocument();
    expect(screen.getByText(/starts filling up as soon as you choose a fatigue score in ATHENA/i)).toBeInTheDocument();
    expect(screen.queryByText(/Quick Note/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Health Assistant/i)).not.toBeInTheDocument();
  });

  it("labels saved scores as fatigue rather than energy", () => {
    window.localStorage.setItem(
      "energy_history",
      JSON.stringify([{ id: 1, date: "2026-08-12T08:00:00.000Z", score: 8, note: "" }]),
    );

    render(<EnergyBank currentFatigueScore={8} />);

    expect(screen.getByRole("heading", { name: /30-Day Fatigue Trend/i })).toBeInTheDocument();
    expect(screen.getByText(/0 = no fatigue to 10 = worst fatigue/i)).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /30-Day Energy Trend/i })).not.toBeInTheDocument();
  });
});
