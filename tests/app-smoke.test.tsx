import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import App from "../App";
import { MOVEMENTS } from "../constants";

const nav = () => document.querySelector("nav")!;
const navLinks = () => Array.from(nav().querySelectorAll("a"));

describe("App.tsx — smoke", () => {
  it("renders without crashing", () => {
    render(<App />);
    expect(screen.getAllByText(/Fit For Cancer/i).length).toBeGreaterThan(0);
  });

  it("renders the 6 desktop navigation buttons", () => {
    render(<App />);
    const n = nav();
    expect(within(n as HTMLElement).getByText("Home")).toBeInTheDocument();
    expect(within(n as HTMLElement).getByText("Exercise")).toBeInTheDocument();
    expect(within(n as HTMLElement).getByText("Nutrition")).toBeInTheDocument();
    expect(within(n as HTMLElement).getByText("AI Chat")).toBeInTheDocument();
    expect(within(n as HTMLElement).getByText("Energy Bank")).toBeInTheDocument();
    expect(within(n as HTMLElement).getByText("Resources")).toBeInTheDocument();
  });

  it("renders the 6 mobile navigation buttons", () => {
    render(<App />);
    const mobileBar = document.querySelector(".fixed.bottom-0")!;
    expect(within(mobileBar as HTMLElement).getByText("Home")).toBeInTheDocument();
    expect(within(mobileBar as HTMLElement).getByText("Move")).toBeInTheDocument();
    expect(within(mobileBar as HTMLElement).getByText("Eat")).toBeInTheDocument();
    expect(within(mobileBar as HTMLElement).getByText("Chat")).toBeInTheDocument();
    expect(within(mobileBar as HTMLElement).getByText("Trends")).toBeInTheDocument();
    expect(within(mobileBar as HTMLElement).getByText("Resources")).toBeInTheDocument();
  });

  it("navigates to Exercise tab", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(navLinks().find((a) => a.textContent?.trim() === "Exercise")!);
    expect(await screen.findByText(/Safe Movements/i)).toBeInTheDocument();
  });

  it("navigates to Nutrition tab", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(navLinks().find((a) => a.textContent?.trim() === "Nutrition")!);
    expect(await screen.findByText(/Recovery Nutrition/i)).toBeInTheDocument();
  });
});
