import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  savePatientContext,
  loadPatientContext,
  clearPatientContext,
  getEnergyHistory,
  saveDailyCheckIn,
} from "../utils/patientContextStorage";

beforeEach(() => {
  window.localStorage.clear();
});

describe("savePatientContext / loadPatientContext", () => {
  it("round-trips a valid context", () => {
    savePatientContext({ cancerType: "breast" });
    const loaded = loadPatientContext();
    expect(loaded).toEqual({ cancerType: "breast" });
  });

  it("returns null after the 14-day expiry and clears the key", () => {
    vi.useFakeTimers();
    const start = Date.now();
    vi.setSystemTime(start);

    savePatientContext({ cancerType: "prostate" });
    expect(loadPatientContext()).toEqual({ cancerType: "prostate" });

    // Advance past 14 days
    vi.advanceTimersByTime(14 * 24 * 60 * 60 * 1000 + 1);

    expect(loadPatientContext()).toBeNull();
    expect(window.localStorage.getItem("fit-for-cancer-patient-context")).toBeNull();

    vi.useRealTimers();
  });

  it("returns null and clears on corrupt JSON", () => {
    window.localStorage.setItem("fit-for-cancer-patient-context", "not-json");
    expect(loadPatientContext()).toBeNull();
    expect(window.localStorage.getItem("fit-for-cancer-patient-context")).toBeNull();
  });

  it("returns null and clears on wrong-shape record", () => {
    window.localStorage.setItem(
      "fit-for-cancer-patient-context",
      JSON.stringify({ timestamp: "nope" }),
    );
    expect(loadPatientContext()).toBeNull();
    expect(window.localStorage.getItem("fit-for-cancer-patient-context")).toBeNull();
  });
});

describe("getEnergyHistory", () => {
  it("returns valid entries", () => {
    const entries = [
      { id: 1, date: "2024-01-01", score: 7, note: "good" },
      { id: 2, date: "2024-01-02", score: 3, note: "tired" },
    ];
    window.localStorage.setItem("energy_history", JSON.stringify(entries));
    expect(getEnergyHistory()).toEqual(entries);
  });

  it("returns [] for non-array data and removes the key", () => {
    window.localStorage.setItem("energy_history", JSON.stringify({}));
    expect(getEnergyHistory()).toEqual([]);
    expect(window.localStorage.getItem("energy_history")).toBeNull();
  });

  it("filters out malformed entries from a mixed array", () => {
    const mixed = [
      { id: 1, date: "2024-01-01", score: 5, note: "ok" },
      { id: "x", date: "2024-01-02", score: 3, note: "bad" },
      { id: 3, date: 123, score: 4, note: "bad-date" },
    ];
    window.localStorage.setItem("energy_history", JSON.stringify(mixed));
    const history = getEnergyHistory();
    expect(history).toHaveLength(1);
    expect(history[0].id).toBe(1);
  });
});

describe("saveDailyCheckIn", () => {
  it("appends an entry and caps at 30", () => {
    vi.useFakeTimers();
    let now = Date.now();
    vi.setSystemTime(now);

    // Save 31 entries with advancing time so ids differ
    for (let i = 0; i < 31; i++) {
      saveDailyCheckIn(i % 10, `note-${i}`);
      now += 1000;
      vi.setSystemTime(now);
    }

    const history = getEnergyHistory();
    expect(history).toHaveLength(30);
    // The first entry (id=0) should be gone; the last entry should be note-30
    expect(history[0].note).toBe("note-1");
    expect(history[29].note).toBe("note-30");

    vi.useRealTimers();
  });
});
