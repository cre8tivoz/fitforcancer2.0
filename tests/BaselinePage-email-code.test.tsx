import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import BaselinePage from "../components/BaselinePage.js";

const { createAuthClientMock } = vi.hoisted(() => ({ createAuthClientMock: vi.fn() }));
vi.mock("@neondatabase/auth", () => ({ createAuthClient: createAuthClientMock }));

describe("BaselinePage email-code sign-in", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("keeps the callable SDK client in state and loads protected settings after code verification", async () => {
    const email = "owner@example.test";
    const authClient = Object.assign(vi.fn(), {
      getSession: vi.fn()
        .mockResolvedValueOnce({ data: null, error: null })
        .mockResolvedValueOnce({ data: { user: { email } }, error: null }),
      token: vi.fn().mockResolvedValue({ data: { token: "session-jwt" }, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    });
    createAuthClientMock.mockReturnValue(authClient);

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.startsWith("/api/baseline-auth?action=config")) return new Response(JSON.stringify({ url: "https://app.example.test/api/auth" }), { status: 200 });
      if (url === "/api/baseline-auth") return new Response(JSON.stringify({ ok: true }), { status: 200 });
      if (url === "/api/baseline") return new Response(JSON.stringify({ draft: { warmth: "high" }, history: [] }), { status: 200 });
      throw new Error(`Unexpected request ${url} ${init?.method || "GET"}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<MemoryRouter><BaselinePage /></MemoryRouter>);
    fireEvent.change(await screen.findByLabelText("Email address"), { target: { value: email } });
    fireEvent.click(screen.getByRole("button", { name: "Send sign-in code" }));
    fireEvent.change(await screen.findByLabelText("Email code"), { target: { value: "123456" } });
    fireEvent.click(screen.getByRole("button", { name: "Verify code" }));

    await screen.findByText("Draft settings");
    expect(authClient).not.toHaveBeenCalled();
    expect(authClient.getSession).toHaveBeenCalledTimes(2);
    expect(authClient.token).toHaveBeenCalled();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("/api/baseline", expect.objectContaining({ headers: expect.objectContaining({ Authorization: "Bearer session-jwt" }) })));
  });
});
