/* ── the sample / real book ────────────────────────────────
   Extracted verbatim from the original single-file app (lines 3010–3071).
   buildSeedBook() builds the fourteen-position book + commitments;
   seed(up) preserves the original mutation semantics; buildSeedState()
   returns a full stand-alone state (used by the engine tests). */

import { BLANK } from "./constants.js";
import { uid, today, addMonths } from "./format.js";

function buildSeedBook() {
  const D = ["2026-03-15", "2026-10-15", "2027-03-15", "2027-10-15", "2028-03-15", "2028-10-15", "2029-03-15"];
  const LBL = ["Mar 26", "Oct 26", "Mar 27", "Oct 27", "Mar 28", "Oct 28", "Mar 29"];
  const past = (d) => d < today();

  /* name, paid so far, seven instalments, total price, value at completion, [sale date, net proceeds] */
  const BOOK = [
    ["Saadiyat Lagoons · 4 bed", 3008888, [0, 319805, 0, 0, 0, 0, 0], 6971241, 9500000, ["2026-10-15", 4887647]],
    ["Saadiyat Lagoons · 6 bed", 5176179, [0, 465126, 0, 0, 0, 0, 0], 11223907, 14500000, null],
    ["Grove 1", 880000, [649000, 0, 0, 0, 0, 0, 0], 1529000, 2000000, null],
    ["Grove 2", 880000, [649000, 0, 0, 0, 0, 0, 0], 1529000, 2000000, null],
    ["Grove 3", 880000, [649000, 0, 0, 0, 0, 0, 0], 1529000, 2000000, null],
    ["Grove 4", 880000, [649000, 0, 0, 0, 0, 0, 0], 1529000, 2000000, null],
    ["Grove 5", 880000, [649000, 0, 0, 0, 0, 0, 0], 1529000, 2000000, null],
    ["Reem · 3-bed Townhouse", 936936, [275415, 275415, 275415, 275415, 275415, 275415, 0], 5343576, 6500000, ["2028-10-15", 3745850]],
    ["Al-Barari · 2 bed", 243991, [930164, 243991, 487981, 731972, 0, 0, 0], 5078004, 5800000, ["2027-10-15", 3360095]],
    ["Ramhan · 3-bed Villa", 1364888, [682444, 682444, 682444, 682444, 682444, 1364888, 682444], 13648888, 16500000, null],
    ["Reem Flow 1", 0, [415000, 213875, 427750, 213875, 427750, 427750, 0], 4332520, 5000000, ["2029-03-15", 2793480]],
    ["Reem Flow 2", 0, [427000, 216400, 432800, 216400, 432800, 432800, 0], 4274589, 5000000, ["2029-03-15", 2883611]],
    ["Reem Flow 3", 0, [432000, 207325, 414650, 207325, 414650, 414650, 0], 4271162, 5000000, ["2029-03-15", 2819438]],
    ["Ramhan · 5-bed Villa", 0, [0, 2100000, 0, 930000, 930000, 930000, 1860000], 18972000, 24500000, ["2029-03-15", 10750000]],
  ];

  const positions = BOOK.map(([name, paid, ins, price, value, sale]) => {
    const tranches = [];

    ins.forEach((amt, i) => {
      if (!amt) return;
      tranches.push({ id: uid(), label: LBL[i] + " instalment", amount: amt, due: D[i], status: past(D[i]) ? "paid" : "scheduled" });
    });
    const handover = price - paid - ins.reduce((a, b) => a + b, 0);
    const handoverDue = sale ? addMonths(sale[0], 1) : addMonths(D[6], 6);
    if (handover > 0) tranches.push({ id: uid(), label: "Handover balance", amount: Math.round(handover), due: handoverDue, status: "scheduled" });

    return {
      id: uid(), cls: "offplan", name, place: name.startsWith("Grove") || name.includes("Reem") || name.includes("Al-Barari") ? "Dubai" : "Abu Dhabi",
      entity: "Personal", ccy: "AED", price, feePct: 0, feeStatus: "paid",
      downAmt: paid, downPct: price > 0 ? Math.round((paid / price) * 1000) / 10 : 0, downStatus: "paid", downDate: "2026-03-01",
      value: price, growth: 0, completeDate: handoverDue, completeValue: value,
      sellPlanned: !!sale, sellDate: sale ? sale[0] : "", sellGross: sale ? sale[1] : "", sellProb: 100,
      exitPct: 0, debt: "", rate: "", amortPct: "", payFreq: 6, rentAmt: "", rentFreq: 1, occ: 95, tranches,
    };
  });

  positions.push(
    { id: uid(), cls: "cash", name: "Cash", place: "UAE", entity: "Personal", ccy: "AED", value: 14000000, rate: "" },
    { id: uid(), cls: "development", name: "Birmensdorf", place: "Switzerland", entity: "Zug AG", ccy: "AED",
      price: 12500000, downAmt: 12500000, downStatus: "paid", downDate: "2026-03-01", feePct: 0, feeStatus: "paid",
      value: 12500000, growth: 0, completeDate: "2027-12-31", completeValue: 12500000,
      sellPlanned: true, sellDate: "2027-12-31", sellGross: 12500000, sellProb: 100, exitPct: 0,
      debt: "", rate: "", amortPct: "", payFreq: 6, rentAmt: "", rentFreq: 1, occ: 95, tranches: [],
      note: "Proceeds expected end of 2027 — held as an asset until then, not as cash" },
  );

  const commitments = [
    { id: uid(), label: "DIFC apartment purchase", counterparty: "—", ccy: "AED", amount: 2600000, due: "2026-10-15", status: "scheduled" },
  ];

  return { positions, commitments };
}

/* Original mutation semantics — spreads onto the existing state. */
export function seed(up) {
  const { positions, commitments } = buildSeedBook();
  up((st) => ({ ...st, base: "AED", asOf: today(), positions, commitments, inflows: [] }));
}

/* Stand-alone full state, based on BLANK — used by tests and previews. */
export function buildSeedState() {
  const { positions, commitments } = buildSeedBook();
  return { ...BLANK, base: "AED", asOf: today(), positions, commitments, inflows: [] };
}
