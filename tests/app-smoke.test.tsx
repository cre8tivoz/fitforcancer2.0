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
    expect(within(n).getByText("ATHENA")).toBeInTheDocument();
  });

  it("renders the mobile bottom navigation links", () => {
    renderWithRouter("/");
    expect(screen.getByText("Move")).toBeInTheDocument();
    expect(screen.getByText("Eat")).toBeInTheDocument();
    expect(screen.getByText("Trends")).toBeInTheDocument();
    expect(screen.getAllByText("ATHENA").length).toBeGreaterThan(0);
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

  it("locks an ATHENA energy score without calling Gemini and shares it with the app", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    renderWithRouter("/assistant");

    await user.click(screen.getByRole("button", { name: /set energy score to 8/i }));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByText(/I see you've selected 8 today/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Nutrition" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Movement" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Just a chat" })).toBeInTheDocument();

    await user.click(within(nav()).getByText("Home"));
    expect(screen.getByText(/Red Zone Active/i)).toBeInTheDocument();
  });

  it("preserves the current energy score until a replacement is selected", async () => {
    const user = userEvent.setup();
    renderWithRouter("/assistant");

    await user.click(screen.getByRole("button", { name: /set energy score to 8/i }));
    await user.click(screen.getByRole("button", { name: /change energy score/i }));

    expect(screen.getByText(/Update Your Energy \(currently 8\/10\)/i)).toBeInTheDocument();
    expect(screen.getByText(/current 8\/10 stays active until you choose a replacement/i)).toBeInTheDocument();

    const historyBefore = JSON.parse(window.localStorage.getItem("energy_history") || "[]");
    expect(historyBefore).toHaveLength(1);
    expect(historyBefore[0]).toMatchObject({ score: 8 });

    await user.click(within(nav()).getByText("Home"));
    expect(screen.getByText(/Red Zone Active/i)).toBeInTheDocument();

    const historyAfter = JSON.parse(window.localStorage.getItem("energy_history") || "[]");
    expect(historyAfter).toHaveLength(1);
    expect(historyAfter[0]).toMatchObject({ score: 8 });
  });

  it("sends the first real ATHENA message with the selected energy context", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ text: "That sounds like a rough day. Let's keep this manageable." }),
    });
    vi.stubGlobal("fetch", fetchMock);

    renderWithRouter("/assistant");

    await user.click(screen.getByRole("button", { name: /set energy score to 8/i }));
    expect(fetchMock).not.toHaveBeenCalled();

    await user.type(screen.getByRole("textbox", { name: /message ATHENA/i }), "Post chemo fatigue");
    await user.click(screen.getByRole("button", { name: /send message to ATHENA/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(await screen.findByText(/rough day/i)).toBeInTheDocument();

    const requestBody = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(requestBody.context.fatigueScore).toBe(8);
    expect(requestBody.context.fatigueZone).toBe("🔴 Red");

    const history = JSON.parse(window.localStorage.getItem("energy_history") || "[]");
    expect(history).toHaveLength(1);
    expect(history[0]).toMatchObject({ score: 8, note: "" });
  });

  it("freezes energy changes and reset while an ATHENA response is pending", async () => {
    const user = userEvent.setup();
    let resolveFetch!: (value: unknown) => void;
    const fetchMock = vi.fn().mockImplementation(
      () => new Promise((resolve) => {
        resolveFetch = resolve;
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    renderWithRouter("/assistant");

    await user.click(screen.getByRole("button", { name: /set energy score to 8/i }));
    await user.click(screen.getByRole("button", { name: /change energy score/i }));
    await user.type(screen.getByRole("textbox", { name: /message ATHENA/i }), "I feel wiped out today");
    await user.click(screen.getByRole("button", { name: /send message to ATHENA/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(screen.getByRole("button", { name: /change energy score/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /set energy score to 4/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /reset ATHENA conversation/i })).toBeDisabled();

    resolveFetch({
      ok: true,
      status: 200,
      json: async () => ({ text: "Let's keep today simple." }),
    });

    expect(await screen.findByText(/keep today simple/i)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole("button", { name: /set energy score to 4/i })).not.toBeDisabled());
  });

  it("explains who ATHENA is and how she is tuned", async () => {
    const user = userEvent.setup();
    renderWithRouter("/assistant");

    await user.click(screen.getByText("Who is ATHENA?"));

    expect(screen.getByText(/Greek mythology/i)).toBeInTheDocument();
    expect(screen.getByText(/wisdom and practical strategy/i)).toBeInTheDocument();
    expect(screen.getByText(/sources come forward when you ask/i)).toBeInTheDocument();
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
