import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

// ─── NutritionCard smoke test ──────────────────────────────
import NutritionCard from "../components/NutritionCard";
import { RECIPES } from "../constants";

describe("NutritionCard.tsx — smoke", () => {
  it("renders without crashing with first recipe", () => {
    render(<NutritionCard recipe={RECIPES[0]} />);
    expect(screen.getByText(RECIPES[0].title)).toBeInTheDocument();
  });

  it("shows View Recipe button (at least one match)", () => {
    render(<NutritionCard recipe={RECIPES[0]} />);
    const found = screen.getAllByText(/View Recipe/i);
    expect(found.length).toBeGreaterThanOrEqual(1);
  });
});
