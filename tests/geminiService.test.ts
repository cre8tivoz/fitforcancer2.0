import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getGeminiResponse } from "../services/geminiService";

beforeEach(() => {
  window.sessionStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const makeFetchResponse = (status: number, body: unknown) =>
  vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  });

describe("getGeminiResponse (client)", () => {
  it("sends request without x-chat-access-password when no password is stored", async () => {
    const fetchMock = makeFetchResponse(200, { text: "hello" });
    vi.stubGlobal("fetch", fetchMock);

    const result = await getGeminiResponse([{ role: "user", content: "hi" }]);

    expect(result).toBe("hello");
    const callHeaders = fetchMock.mock.calls[0][1].headers;
    expect(callHeaders["x-chat-access-password"]).toBeUndefined();
  });

  it("sends request with stored password header", async () => {
    window.sessionStorage.setItem("fit-for-cancer-chat-access-password", "secret");
    const fetchMock = makeFetchResponse(200, { text: "ok" });
    vi.stubGlobal("fetch", fetchMock);

    const result = await getGeminiResponse([{ role: "user", content: "hi" }]);

    expect(result).toBe("ok");
    const callHeaders = fetchMock.mock.calls[0][1].headers;
    expect(callHeaders["x-chat-access-password"]).toBe("secret");
  });

  it("prompts on 401, retries with password, and returns 200 result", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: "Chat access is restricted" }),
        text: async () => JSON.stringify({ error: "Chat access is restricted" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ text: "ok" }),
        text: async () => JSON.stringify({ text: "ok" }),
      });
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("prompt", () => "pw");

    const result = await getGeminiResponse([{ role: "user", content: "hi" }]);

    expect(result).toBe("ok");
    expect(window.sessionStorage.getItem("fit-for-cancer-chat-access-password")).toBe("pw");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("returns error string when user cancels the password prompt", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: "Chat access is restricted" }),
      text: async () => JSON.stringify({ error: "Chat access is restricted" }),
    });
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("prompt", () => null);

    const result = await getGeminiResponse([{ role: "user", content: "hi" }]);

    expect(result).toBe("Chat access is restricted");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("removes stored password when retry also returns 401", async () => {
    window.sessionStorage.setItem("fit-for-cancer-chat-access-password", "oldpw");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: "Chat access is restricted" }),
      text: async () => JSON.stringify({ error: "Chat access is restricted" }),
    });
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("prompt", () => "newpw");

    const result = await getGeminiResponse([{ role: "user", content: "hi" }]);

    expect(result).toBe("Chat access is restricted");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(window.sessionStorage.getItem("fit-for-cancer-chat-access-password")).toBeNull();
  });
});
