/* ── live FX rates ─────────────────────────────────────────
   Extracted verbatim from the original single-file app (lines 88–120).
   Two independent sources so one being down is survivable. Everything is
   stored as: value of one unit in CHF. These two endpoints (plus the BTC
   fallback) are the ONLY third-party requests the app is permitted. */

import { today } from "./format.js";

export async function fetchRates() {
  const grab = async (url, ms = 8000) => {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), ms);
    try {
      const r = await fetch(url, { signal: ctl.signal, cache: "no-store" });
      if (!r.ok) throw new Error("http " + r.status);
      return await r.json();
    } finally { clearTimeout(t); }
  };
  const inv = (v) => (Number(v) > 0 ? 1 / Number(v) : 0);

  try {
    const j = await grab("https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/chf.json");
    const c = j.chf || {};
    const fx = { CHF: 1, USD: inv(c.usd), AED: inv(c.aed), EUR: inv(c.eur) };
    if (fx.USD && fx.AED && fx.EUR) {
      const btcChf = inv(c.btc);
      return { fx, btcUSD: btcChf && fx.USD ? btcChf / fx.USD : 0, date: j.date || today(), src: "Currency API" };
    }
  } catch { /* try the fallback */ }

  const j = await grab("https://open.er-api.com/v6/latest/CHF");
  const r = j.rates || {};
  const fx = { CHF: 1, USD: inv(r.USD), AED: inv(r.AED), EUR: inv(r.EUR) };
  if (!fx.USD) throw new Error("no rates returned");
  let btcUSD = 0;
  try {
    const b = await grab("https://api.coinbase.com/v2/exchange-rates?currency=BTC");
    btcUSD = Number(b?.data?.rates?.USD) || 0;
  } catch { /* bitcoin stays on the manual figure */ }
  return { fx, btcUSD, date: today(), src: "exchangerate-api" };
}
