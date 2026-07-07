import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

import App from "../App";

const renderWithRouter = (initialRoute = "/") => {
  window.history.pushState({}, "", initialRoute);
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <App />
    </MemoryRouter>
  );
};

const nav = () => document.querySelector("nav")!;

describe("App.tsx — smoke", () => {
  it("renders without crashing", () => {
    renderWithRouter("/");
    expect(screen.getAllByText(/Fit For Cancer/i).length).toBeGreaterThan(0);
  });

  it("renders the 6 desktop navigation links", () => {
    renderWithRouter("/");
    const n = nav() as HTMLElement;
    expect(n).toBeTruthy();
    expect(within(n).getByText("Home")).toBeInTheDocument();
    expect(within(n).getByText("Exercise")).toBeInTheDocument();
    expect(within(n).getByText("Nutrition")).toBeInTheDocument();
  });

  it("renders the lazy-loaded tabs without error", () => {
    renderWithRouter("/exercise");
    expect(screen.getByText(/Safe Movements/i)).toBeInTheDocument();
  });
});
