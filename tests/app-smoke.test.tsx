import { afterEach, describe, it, expect, vi } from "vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
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
  afterEach(() => {
    cleanup();
    window.localStorage.clear();
    window.sessionStorage.clear();
    vi.unstubAllGlobals();
  });

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

  it("renders the mobile bottom navigation links", () => {
    renderWithRouter("/");
    expect(screen.getByText("Move")).toBeInTheDocument();
    expect(screen.getByText("Eat")).toBeInTheDocument();
    expect(screen.getByText("Trends")).toBeInTheDocument();
    expect(screen.getByText("Chat")).toBeInTheDocument();
  });

  it("renders the lazy-loaded tabs without error", () => {
    renderWithRouter("/exercise");
    expect(screen.getByText(/Safe Movements/i)).toBeInTheDocument();
  });

  it("updates the exercise zone filter", async () => {
    const user = userEvent.setup();
    renderWithRouter("/exercise");

    expect(screen.getByText("Brisk Walking")).toBeInTheDocument();
    await user.click(screen.getByRole("radio", { name: /red/i }));

    expect(screen.queryByText("Brisk Walking")).not.toBeInTheDocument();
    expect(screen.getByText('Diaphragmatic "Belly" Breathing')).toBeInTheDocument();
  });

  it("updates the nutrition search filter", async () => {
    const user = userEvent.setup();
    renderWithRouter("/nutrition");

    expect(screen.getByText("Protein-Packed Berry Smoothie")).toBeInTheDocument();
    await user.type(screen.getByLabelText(/search recipes/i), "watermelon");

    expect(screen.queryByText("Protein-Packed Berry Smoothie")).not.toBeInTheDocument();
    expect(screen.getByText("Hydrating Watermelon & Mint Cooler")).toBeInTheDocument();
  });

  it("shares the chat fatigue score with the rest of the app", async () => {
    const user = userEvent.setup();
    renderWithRouter("/assistant");

    await user.click(screen.getByRole("button", { name: "8" }));
    await user.click(within(nav()).getByText("Home"));

    expect(screen.getByText(/Red Zone Active/i)).toBeInTheDocument();
  });

  it("sends chat messages to the Gemini API and saves the first check-in", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ text: "Personalised oncology guidance." }),
    });
    vi.stubGlobal("fetch", fetchMock);

    renderWithRouter("/assistant");

    await user.click(screen.getByRole("button", { name: "8" }));
    await user.type(screen.getByRole("textbox", { name: /health assistant message/i }), "Post chemo fatigue");
    await user.click(screen.getByRole("button", { name: /send message/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(await screen.findByText("Personalised oncology guidance.")).toBeInTheDocument();
    expect(screen.queryByText(/The AI assistant will respond here/i)).not.toBeInTheDocument();

    const requestBody = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(requestBody.context.fatigueScore).toBe(8);
    expect(requestBody.context.fatigueZone).toBe("🔴 Red");

    const history = JSON.parse(window.localStorage.getItem("energy_history") || "[]");
    expect(history).toHaveLength(1);
    expect(history[0]).toMatchObject({ score: 8, note: "Post chemo fatigue" });
  });

  it("clears saved browser data from Resources", async () => {
    const user = userEvent.setup();
    window.localStorage.setItem("fit-for-cancer-fatigue-score", "8");
    window.localStorage.setItem("fit-for-cancer-fatigue-zone", "🔴 Red");
    window.localStorage.setItem("fit-for-cancer-daily-checkin-logged", "true");
    window.localStorage.setItem(
      "fit-for-cancer-patient-context",
      JSON.stringify({ timestamp: Date.now(), context: { cancerType: "breast" } }),
    );
    window.localStorage.setItem(
      "energy_history",
      JSON.stringify([{ id: 1, date: "2026-08-12", score: 8, note: "Post treatment" }]),
    );

    renderWithRouter("/resources");

    await user.click(await screen.findByRole("button", { name: /Privacy & Sensitive Data Handling/i }));
    await user.click(screen.getByRole("button", { name: /Clear Saved Browser Data/i }));

    expect(window.localStorage.getItem("fit-for-cancer-fatigue-score")).toBeNull();
    expect(window.localStorage.getItem("fit-for-cancer-fatigue-zone")).toBeNull();
    expect(window.localStorage.getItem("fit-for-cancer-daily-checkin-logged")).toBeNull();
    expect(window.localStorage.getItem("fit-for-cancer-patient-context")).toBeNull();
    expect(window.localStorage.getItem("energy_history")).toBeNull();
    expect(screen.getByText(/Saved browser data cleared/i)).toBeInTheDocument();
  });
});
