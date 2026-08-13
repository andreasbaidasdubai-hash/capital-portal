/* ═══════════════════════════════════════════════════════════
   CAPITAL PORTAL — financial engine
   Extracted verbatim from the original single-file app (lines 157–498).
   The body of computeEngine() is the exact contents of the original
   useMemo callback, unchanged. useEngine() re-wraps it in useMemo so
   runtime behaviour and memoisation are identical.

   DO NOT change the maths here without a corresponding decision — it is
   reconciled to the owner's spreadsheet to the dirham and is pinned by
   engine.test.js. The identity `invested + unreal = equity` must hold.
   ═══════════════════════════════════════════════════════════ */

import { useMemo } from "react";
import { BLANK, CLS, CLS_ORDER } from "./constants.js";
import { sortTranches, today, monthsBetween, grow, mKey, addMonths, num } from "./format.js";

export function computeEngine(s, stress, horizon = 60, caseMode = "base") {
  const fx0 = s.fx || BLANK.fx;
  const fx = { ...fx0, BTC: (Number(s.btcUSD) || 0) * (fx0.USD || 0) };
  const bx = fx[s.base] || 1;
  const conv = (a, c) => ((Number(a) || 0) * (fx[c] ?? 1)) / bx;
  const hc = 1 - (stress.haircut || 0) / 100;

  const priced = s.positions.map((p) => {
    const isReal = !!CLS[p.cls]?.real;
    const tr = sortTranches(Array.isArray(p.tranches) ? p.tranches : []);
    const hasPlan = tr.length > 0;
    const trPaidN = tr.filter((t) => t.status === "paid").reduce((a, t) => a + (Number(t.amount) || 0), 0);
    const trOpen = tr.filter((t) => t.status !== "paid");
    const trDueN = trOpen.reduce((a, t) => a + (Number(t.amount) || 0), 0);
    const nextT = [...trOpen].sort((a, b) => (a.due || "").localeCompare(b.due || ""))[0] || null;
    const downAmtN = Number(p.downAmt) || 0;
    const downPaidN = p.downStatus === "due" ? 0 : downAmtN;
    const downDueN = p.downStatus === "due" ? downAmtN : 0;

    let mark;
    if (p.cls === "crypto") {
      const live = p.livePrice !== false;
      const unit = live ? (Number(s.btcUSD) || 0) : (Number(p.unitPrice) || 0);
      mark = conv((Number(p.units) || 0) * unit, live ? "USD" : p.ccy);
    } else mark = conv(p.value, p.ccy);
    if (p.cls !== "cash") mark *= hc;

    const price = conv(p.price, p.ccy);
    const feePct = Number(p.feePct) || 0;
    const acqFee = isReal ? price * (feePct / 100) : 0;
    const feeOpen = p.feeStatus === "due" ? acqFee : 0;
    const paid = (hasPlan || downAmtN)
      ? conv(trPaidN + downPaidN, p.ccy)
      : (p.cls === "offplan" ? conv(p.paid, p.ccy) : price);
    const debt = isReal ? conv(p.debt, p.ccy) : 0;
    const invested = p.cls === "cash" ? mark : paid + (acqFee - feeOpen) - debt;
    const cutM = p.sellPlanned && p.sellDate ? p.sellDate.slice(0, 7) : null;
    const trDueLive = cutM
      ? trOpen.filter((t) => !t.due || t.due.slice(0, 7) < cutM).reduce((a, t) => a + (Number(t.amount) || 0), 0)
      : trDueN;
    const cancelled = hasPlan ? conv(trDueN - trDueLive, p.ccy) : 0;
    const remaining = ((hasPlan || downAmtN)
      ? conv(trDueLive + downDueN, p.ccy)
      : (p.cls === "offplan" ? Math.max(price - paid, 0) : 0)) + feeOpen;
    const owedAll = ((hasPlan || downAmtN)
      ? conv(trDueN + downDueN, p.ccy)
      : (p.cls === "offplan" ? Math.max(price - paid, 0) : 0)) + feeOpen;
    const totalCost = p.cls === "cash" ? 0
      : paid + acqFee + ((hasPlan || downAmtN) ? conv(trDueN + downDueN, p.ccy) : (p.cls === "offplan" ? Math.max(price - paid, 0) : 0));
    const equity = mark - debt - owedAll;
    const exitPct = Number(p.exitPct) || 0;
    const exitCost = mark * (exitPct / 100);
    const netProceeds = mark - exitCost - debt - owedAll;
    const unreal = p.cls === "cash" ? 0 : mark - totalCost;
    const roic = totalCost > 0 ? (unreal / totalCost) * 100 : 0;
    const planPct = hasPlan && trPaidN + trDueN > 0 ? (trPaidN / (trPaidN + trDueN)) * 100 : 0;

    const rentPa = conv(p.rentAmt, p.ccy) * ((Number(p.occ ?? 100)) / 100) * (12 / Math.max(1, Number(p.rentFreq) || 1));
    const depositPa = (p.cls === "cash" || p.cls === "trading") ? (mark * (Number(p.rate) || 0)) / 100 : 0;
    const servicePa = debt * ((Number(p.rate) || 0) / 100) + debt * ((Number(p.amortPct) || 0) / 100);
    const plannedAmt = p.mortPlanned && p.mortDate ? (p.mortAmt ? conv(p.mortAmt, p.ccy) : mark * ((Number(p.mortLtv) || 0) / 100)) : 0;
    // Bull case swaps in an optional optimistic completion value per position;
    // base case (or no bull value entered) is byte-for-byte the original.
    const completeValueSel = (caseMode === "bull" && Number(p.completeValueBull) > 0) ? Number(p.completeValueBull) : (Number(p.completeValue) || 0);
    const completeVal = conv(completeValueSel, p.ccy);
    const grossUplift = completeVal > 0 ? completeVal - totalCost : 0;
    const g = p.cls === "cash" ? 0 : (Number(p.growth) || 0) + (stress.growth || 0);
    const t0d = today();
    const mToSale = p.sellDate ? Math.max(0, monthsBetween(t0d, p.sellDate)) : 0;
    const mToComp = p.completeDate ? Math.max(0, monthsBetween(t0d, p.completeDate)) : 0;
    const projSale = completeVal
      ? grow(completeVal, g, Math.max(0, mToSale - mToComp))
      : grow(mark, g, mToSale);
    const valueLater = p.cls === "cash" ? mark
      : (completeVal ? grow(completeVal, g, Math.max(0, horizon - mToComp)) : grow(mark, g, horizon));
    const planned = !!p.sellPlanned;
    const salePrice = mark;
    const sellCosts = salePrice * ((Number(p.exitPct) || 0) / 100);
    const cashOnExit = p.cls === "cash" ? mark : salePrice - sellCosts - debt - owedAll;
    const exitProfit = p.cls === "cash" ? 0 : cashOnExit - invested;
    const exitReturn = invested > 0 ? (exitProfit / invested) * 100 : 0;
    const compValRaw = conv(completeValueSel, p.ccy) || mark;
    const exitCostComp = compValRaw * ((Number(p.exitPct) || 0) / 100);
    const netAtComp = p.cls === "cash" ? mark : compValRaw - exitCostComp - debt - owedAll;
    const profitAtComp = p.cls === "cash" ? 0 : netAtComp - invested;
    const multipleAtComp = invested > 0 ? netAtComp / invested : 0;
    const sellGrossV = planned ? salePrice : 0;
    const sellNet = sellGrossV > 0 ? sellGrossV * (1 - (Number(p.exitPct) || 0) / 100) - debt : 0;
    const sellProfit = sellGrossV > 0 ? sellNet - invested - remaining : 0;

    return { ...p, isReal, tr, hasPlan, nextT, planPct, mark, price, acqFee, feePct, feeOpen, paid, invested, debt, equity, exitCost, netProceeds, unreal, roic, remaining, cancelled, owedAll, totalCost, grossUplift, compValRaw, exitCostComp, netAtComp, profitAtComp, multipleAtComp, planned, salePrice, sellCosts, cashOnExit, exitProfit, exitReturn, downPaid: conv(downPaidN, p.ccy), downDue: conv(downDueN, p.ccy), rentPa, depositPa, servicePa, netRentPa: rentPa - servicePa, plannedAmt, completeVal, completeValueSel, growth: g, valueLater, sellGrossV, sellNet, sellProfit, yieldPct: invested > 0 ? (rentPa / invested) * 100 : 0, ltv: mark > 0 ? (debt / mark) * 100 : 0 };
  });

  const sum = (k, f = () => true) => priced.filter(f).reduce((a, p) => a + (p[k] || 0), 0);
  const gross = sum("mark");
  const debt = sum("debt");
  const liquid = sum("mark", (p) => p.cls === "cash" || (p.cls === "trading" && p.liquidOk !== false));
  const deployed = sum("invested", (p) => p.cls !== "cash");
  const feesPaid = sum("acqFee") - sum("feeOpen");
  const unreal = sum("unreal");
  const exitNowNet = sum("cashOnExit", (p) => p.cls !== "cash");
  const exitCompNet = sum("netAtComp", (p) => p.cls !== "cash");
  const netIfSold = sum("netProceeds", (p) => p.cls !== "cash") + liquid;
  const remaining = sum("remaining");
  const commitOpen = s.commitments.filter((c) => c.status !== "settled").reduce((a, c) => a + conv(c.amount, c.ccy), 0);
  const obligations = sum("owedAll") + commitOpen;
  const nav = gross - debt - obligations;

  const group = (fn) => {
    const m = {};
    for (const p of priced) { const k = (fn(p) || "").trim() || "Unassigned"; m[k] = (m[k] || 0) + p.equity; }
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  };
  const byClass = CLS_ORDER.filter((c) => priced.some((p) => p.cls === c))
    .map((c) => [CLS[c].label, priced.filter((p) => p.cls === c).reduce((a, p) => a + p.equity, 0)]);
  const byPlace = group((p) => p.place);
  const byEntity = group((p) => p.entity);
  const ex = {};
  for (const p of priced) { const c = p.cls === "crypto" ? "BTC" : p.ccy; ex[c] = (ex[c] || 0) + p.equity; }
  const byCcy = Object.entries(ex).sort((a, b) => b[1] - a[1]);

  /* one merged schedule of everything going out */
  const outgoings = [];
  for (const p of priced) {
    const cut = p.sellPlanned && p.sellDate ? p.sellDate.slice(0, 7) : null;
    for (const t of p.tr) {
      if (cut && t.status !== "paid" && t.due && t.due.slice(0, 7) >= cut) continue;
      outgoings.push({
        id: t.id, src: "tranche", posId: p.id, posName: p.name, label: t.label || "Instalment",
        counterparty: p.counterparty || p.entity || "", ccy: p.ccy, amount: Number(t.amount) || 0,
        base: conv(t.amount, p.ccy), due: t.due, status: t.status,
      });
    }
    if (p.downDue > 0) {
      outgoings.push({
        id: p.id + "-down", src: "down", posId: p.id, posName: p.name, label: "Down payment",
        counterparty: p.counterparty || "", ccy: p.ccy, amount: Number(p.downAmt) || 0,
        base: p.downDue, due: p.downDate || today(), status: "scheduled",
      });
    }
    if (p.feeOpen > 0 && !(cut && (p.nextT?.due || today()).slice(0, 7) >= cut)) {
      outgoings.push({
        id: p.id + "-fee", src: "fee", posId: p.id, posName: p.name,
        label: `Acquisition costs ${p.feePct}%`, counterparty: "", ccy: p.ccy,
        amount: (Number(p.price) || 0) * (p.feePct / 100), base: p.feeOpen,
        due: p.nextT?.due || today(), status: "scheduled",
      });
    }
  }
  for (const c of s.commitments) {
    outgoings.push({
      id: c.id, src: "commitment", label: c.label, counterparty: c.counterparty, ccy: c.ccy,
      amount: Number(c.amount) || 0, base: conv(c.amount, c.ccy), due: c.due, status: c.status, raw: c,
    });
  }
  outgoings.sort((a, b) => (a.due || "").localeCompare(b.due || ""));

  /* ── month-by-month simulation ── */
  const months = [];
  const st = new Date(); st.setDate(1);
  for (let i = 0; i < horizon; i++) { const d = new Date(st); d.setMonth(d.getMonth() + i); months.push(mKey(d)); }
  const idx = Object.fromEntries(months.map((k, i) => [k, i]));
  const rows = months.map((k) => ({ key: k, out: 0, inn: 0, items: [], debt: 0, marks: 0, owed: 0, income: 0, debtCost: 0 }));
  const shift = stress.rate || 0;

  for (const o of outgoings) {
    if (o.status === "settled" || o.status === "paid" || !o.due) continue;
    const k = o.due.slice(0, 7);
    if (!(k in idx)) continue;
    rows[idx[k]].out += o.base;
    rows[idx[k]].items.push({ dir: "out", label: o.posName ? `${o.posName} · ${o.label}` : o.label, amt: o.base, status: o.status, cp: o.counterparty });
  }
  for (const f of s.inflows) {
    if (f.status === "received" || !f.due) continue;
    const k = addMonths(f.due, stress.delay || 0).slice(0, 7);
    if (!(k in idx)) continue;
    const raw = conv(f.amount, f.ccy);
    const a = raw * ((Number(f.probability) ?? 100) / 100);
    rows[idx[k]].inn += a;
    if (f.kind === "income") rows[idx[k]].income += a;
    rows[idx[k]].items.push({ dir: "in", label: f.label, amt: a, prob: f.probability, raw });
  }

  /* financing, revaluation and realisation: walk each position forward */
  const events = [];
  for (const p of priced) {
    if (p.cls === "cash" || p.cls === "trading") {
      const r = Number(p.rate) || 0;
      if (r > 0) {
        const m = (p.mark * r) / 100 / 12;
        for (let i = 0; i < horizon; i++) {
          rows[i].inn += m; rows[i].income += m;
          rows[i].items.push({ dir: "in", label: `${p.name} · ${p.cls === "trading" ? "yield" : "deposit interest"}`, amt: m, prob: 100, raw: m });
        }
      }
      continue;
    }

    const legs = [];
    if (p.isReal && p.debt > 0) legs.push({ tag: "Mortgage", bal: p.debt, orig: p.debt, rate: (Number(p.rate) || 0) + shift, amortPct: Number(p.amortPct) || 0, every: Math.max(1, Number(p.payFreq) || 3), from: 0 });
    if (p.isReal && p.mortPlanned && p.mortDate) {
      const di = idx[p.mortDate.slice(0, 7)];
      const amt = p.plannedAmt;
      if (di != null && amt > 0) {
        const fee = amt * ((Number(p.mortFeePct) || 0) / 100);
        rows[di].inn += amt - fee;
        rows[di].items.push({ dir: "in", label: `${p.name} · mortgage drawdown`, amt: amt - fee, prob: 100, raw: amt });
        events.push({ i: di, key: months[di], kind: "draw", label: `${p.name} — mortgage drawn`, amt: amt - fee });
        legs.push({ tag: "New mortgage", bal: 0, orig: amt, rate: (Number(p.mortRate) || 0) + shift, amortPct: Number(p.mortAmortPct) || 0, every: Math.max(1, Number(p.payFreq) || 3), from: di, draw: amt });
      }
    }

    const rentAmt = conv(p.rentAmt, p.ccy) * ((Number(p.occ ?? 100)) / 100);
    const rentEvery = Math.max(1, Number(p.rentFreq) || 1);
    const rentFrom = p.rentStart ? (idx[p.rentStart.slice(0, 7)] ?? (p.rentStart.slice(0, 7) < months[0] ? 0 : null)) : 0;

    const compIdx = p.completeDate ? idx[p.completeDate.slice(0, 7)] : null;
    const compVal = conv(p.completeValueSel, p.ccy) * hc;
    const sellIdx = p.sellPlanned && p.sellDate ? idx[p.sellDate.slice(0, 7)] : null;
    const sellProb = (Number(p.sellProb) ?? 100) / 100;
    const explicitGross = p.sellGross ? conv(p.sellGross, p.ccy) * hc : null;
    const gMonthly = Math.pow(1 + ((p.cls === "cash" ? 0 : (Number(p.growth) || 0) + (stress.growth || 0))) / 100, 1 / 12);

    const owedItems = [];
    for (const t of p.tr) {
      if (t.status === "paid" || !t.due) continue;
      const k = idx[t.due.slice(0, 7)];
      owedItems.push({ at: k == null ? (t.due.slice(0, 7) < months[0] ? 0 : horizon) : k, amt: conv(t.amount, p.ccy) });
    }
    if (p.downDue > 0) owedItems.push({ at: idx[(p.downDate || today()).slice(0, 7)] ?? 0, amt: p.downDue });
    if (p.feeOpen > 0) owedItems.push({ at: idx[(p.nextT?.due || today()).slice(0, 7)] ?? 0, amt: p.feeOpen });
    let owed = owedItems.reduce((a, o) => a + o.amt, 0);

    let mark = p.mark, sold = false;
    for (let i = 0; i < horizon; i++) {
      owed -= owedItems.filter((o) => o.at === i).reduce((a, o) => a + o.amt, 0);
      if (!sold && i > 0) mark *= gMonthly;
      if (!sold && compIdx != null && i === compIdx && compVal > 0) {
        const step = compVal - mark;
        mark = compVal;
        events.push({ i, key: months[i], kind: "complete", label: `${p.name} — completes`, amt: step });
      }

      if (!sold && sellIdx != null && i === sellIdx) {
        const debtOut = legs.reduce((a, L) => a + Math.max(L.bal, 0), 0);
        const gross = (explicitGross != null ? explicitGross : mark) * sellProb;
        const costs = gross * ((Number(p.exitPct) || 0) / 100);
        const net = gross - costs - debtOut;
        rows[i].inn += net;
        rows[i].items.push({ dir: "in", label: `${p.name} · sale proceeds`, amt: net, prob: Math.round(sellProb * 100), raw: gross });
        events.push({ i, key: months[i], kind: "sell", label: `${p.name} — realised`, amt: net, profit: net - p.invested - p.remaining });
        legs.forEach((L) => { L.bal = 0; });
        mark = 0; sold = true; owed = 0;
      }

      if (!sold) {
        for (const L of legs) {
          if (i === L.from && L.draw) { L.bal = L.draw; continue; }
          if (i < L.from || L.bal <= 0) continue;
          if ((i - L.from) % L.every !== 0) continue;
          const yr = L.every / 12;
          const interest = L.bal * (L.rate / 100) * yr;
          const amort = Math.min(L.bal, L.orig * (L.amortPct / 100) * yr);
          const pay = interest + amort;
          if (pay > 0) {
            rows[i].out += pay; rows[i].debtCost += pay;
            rows[i].items.push({ dir: "out", label: `${p.name} · ${L.tag}`, amt: pay, status: "scheduled", cp: `${num(interest)} interest + ${num(amort)} amortisation` });
          }
          L.bal -= amort;
        }
        if (rentAmt > 0 && rentFrom != null && i >= rentFrom && (i - rentFrom) % rentEvery === 0) {
          rows[i].inn += rentAmt; rows[i].income += rentAmt;
          rows[i].items.push({ dir: "in", label: `${p.name} · rent`, amt: rentAmt, prob: 100, raw: rentAmt });
        }
      }

      rows[i].marks += mark;
      rows[i].owed += Math.max(owed, 0);
      rows[i].debt += legs.reduce((a, L) => a + Math.max(L.bal, 0), 0);
    }
  }
  events.sort((a, b) => a.i - b.i);

  const commitByMonth = new Array(rows.length).fill(0);
  for (const o of outgoings) {
    if (o.src !== "commitment" || o.status === "settled" || !o.due) continue;
    const k = idx[o.due.slice(0, 7)];
    if (k != null) commitByMonth[k] += o.base;
  }
  const commitAfter = new Array(rows.length + 1).fill(0);
  for (let i = rows.length - 1; i >= 0; i--) commitAfter[i] = commitAfter[i + 1] + commitByMonth[i];

  let bal = liquid, low = Infinity, lowKey = null, cReq = 0, cIn = 0;
  for (let ri = 0; ri < rows.length; ri++) {
    const r = rows[ri];
    r.open = bal; r.net = r.inn - r.out; bal += r.net; r.close = bal;
    cReq += r.out; cIn += r.inn;
    r.cumReq = cReq; r.cumAvail = liquid + cIn;
    r.oblig = r.owed + commitAfter[ri + 1];
    r.navT = r.marks + r.close - r.debt - r.oblig;
    if (r.close < low) { low = r.close; lowKey = r.key; }
  }
  const breach = rows.find((r) => r.close < 0) || null;
  const out12 = rows.slice(0, 12).reduce((a, r) => a + r.out, 0);
  const in12 = rows.slice(0, 12).reduce((a, r) => a + r.inn, 0);
  const t0 = today();
  const nextOut = outgoings.find((o) => o.status !== "paid" && o.status !== "settled" && o.due && o.due >= t0) || null;
  const plannedDraw = priced.reduce((a, p) => a + (p.plannedAmt || 0), 0);
  const cancelled = priced.reduce((a, p) => a + (p.cancelled || 0), 0);
  const totalCost = priced.reduce((a, p) => a + (p.totalCost || 0), 0);
  const grossUplift = priced.reduce((a, p) => a + (p.grossUplift || 0), 0);
  const profitExpected = events.filter((x) => x.kind === "sell").reduce((a, x) => a + (x.profit || 0), 0);
  const nextEvent = events[0] || null;
  const rentPa = priced.reduce((a, p) => a + p.rentPa, 0);
  const depositPa = priced.reduce((a, p) => a + p.depositPa, 0);
  const depositBase = priced.filter((p) => p.depositPa > 0).reduce((a, p) => a + p.mark, 0);
  const idleCash = priced.filter((p) => (p.cls === "cash" || p.cls === "trading") && !(Number(p.rate) > 0)).reduce((a, p) => a + p.mark, 0);
  const rentCapital = priced.filter((p) => p.rentPa > 0).reduce((a, p) => a + (p.invested || p.mark), 0);
  const servicePa = priced.reduce((a, p) => a + p.servicePa, 0);
  const income12 = rows.slice(0, 12).reduce((a, r) => a + r.income, 0);
  const earnPa = s.inflows.filter((f) => f.kind === "income" && f.status !== "received" && f.due &&
    f.due >= today() && f.due < addMonths(today(), 12))
    .reduce((a, f) => a + conv(f.amount, f.ccy) * ((Number(f.probability) ?? 100) / 100), 0);
  const earnings = s.inflows.filter((f) => f.kind === "income");
  const debtCost12 = rows.slice(0, 12).reduce((a, r) => a + r.debtCost, 0);
  const incomeRun = rentPa + depositPa + earnPa;

  return {
    conv, priced, outgoings, nextOut, gross, debt, nav, liquid, deployed, feesPaid, unreal, netIfSold, remaining,
    plannedDraw, cancelled, totalCost, grossUplift, obligations, commitOpen, earnPa, earnings,
    exitNowNet, exitCompNet,
    navExitNow: exitNowNet + liquid - commitOpen,
    navExitComp: exitCompNet + liquid - commitOpen, owedAllTotal: sum("owedAll"), rentPa, depositPa, depositBase, idleCash, rentCapital, servicePa, netRentPa: rentPa - servicePa, incomeRun, income12, debtCost12,
    netIncome12: income12 - debtCost12, events, profitExpected, nextEvent,
    ltv: gross > 0 ? (debt / gross) * 100 : 0,
    liquidRatio: nav > 0 ? (liquid / nav) * 100 : 0,
    multiple: deployed > 0 ? (gross - liquid) / deployed : 0,
    byClass, byPlace, byEntity, byCcy,
    ladder: rows, low, lowKey, breach, out12, in12,
    runway: breach ? rows.indexOf(breach) : null,
    coverage: out12 > 0 ? ((liquid + in12) / out12) * 100 : Infinity,
  };
}

export function useEngine(s, stress, horizon = 60, caseMode = "base") {
  return useMemo(() => computeEngine(s, stress, horizon, caseMode), [s, stress, horizon, caseMode]);
}
