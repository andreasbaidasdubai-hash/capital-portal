import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { computeEngine } from "./engine.js";
import { buildSeedState } from "./seed.js";

/* The four verification figures from HANDOVER.md. Every one is reconciled
   to the owner's spreadsheet to the dirham. They are time-sensitive: the
   seed marks instalments "paid" when their due date is in the past, so we
   freeze the clock to 2026-08-11 (after the Mar-2026 instalment, before
   Oct-2026) — the point at which the spreadsheet figures were taken.

   If any of these break, the change to the engine is wrong. */

const ZERO = { delay: 0, haircut: 0, rate: 0, growth: 0 };
const r0 = (n) => Math.round(n);

let e, state;

beforeAll(() => {
  // Fake the system clock so the seed's paid/scheduled split is deterministic.
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-08-11T12:00:00Z"));
  state = buildSeedState();
  e = computeEngine(state, ZERO, 60);
});

afterAll(() => {
  vi.useRealTimers();
});

describe("Capital Portal engine — spreadsheet reconciliation", () => {
  it("seeds the book — 14 off-plan units plus cash and Birmensdorf", () => {
    expect(state.positions).toHaveLength(16);
    expect(state.positions.filter((p) => p.cls === "offplan")).toHaveLength(14);
    expect(state.base).toBe("AED");
  });

  it("total paid across the off-plan book = 21,537,905", () => {
    const paid = e.priced
      .filter((p) => p.cls === "offplan")
      .reduce((a, p) => a + p.paid, 0);
    expect(r0(paid)).toBe(21_537_905);
  });

  it("total profit at completion = 20,539,113", () => {
    const profit = e.priced
      .filter((p) => p.cls === "offplan")
      .reduce((a, p) => a + p.profitAtComp, 0);
    expect(r0(profit)).toBe(20_539_113);
  });

  it("Reem Flow 1 — profit 667,480 at 2.61×", () => {
    const rf1 = e.priced.find((p) => p.name === "Reem Flow 1");
    expect(rf1).toBeTruthy();
    expect(r0(rf1.profitAtComp)).toBe(667_480);
    expect(rf1.multipleAtComp.toFixed(2)).toBe("2.61");
  });

  it("the seven instalment columns reconcile exactly", () => {
    const DUES = ["2026-03-15", "2026-10-15", "2027-03-15", "2027-10-15", "2028-03-15", "2028-10-15", "2029-03-15"];
    const EXPECTED = [6_407_023, 4_724_381, 2_721_040, 3_257_431, 3_163_059, 3_845_503, 2_542_444];
    const cols = DUES.map((due) =>
      state.positions
        .filter((p) => p.cls === "offplan")
        .flatMap((p) => p.tranches || [])
        .filter((t) => t.due === due)
        .reduce((a, t) => a + t.amount, 0),
    );
    expect(cols).toEqual(EXPECTED);
  });

  it("holds the identity invested + unreal = equity for every position", () => {
    for (const p of e.priced) {
      expect(p.invested + p.unreal).toBeCloseTo(p.equity, 6);
    }
  });
});
