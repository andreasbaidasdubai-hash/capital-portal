/* ── domain constants ──────────────────────────────────────
   Extracted verbatim from the original single-file app (lines 8–43).
   NOTE: the field names inside positions/tranches and the class ids
   below are part of the stored-data contract. Adding is safe; renaming
   or removing silently corrupts saved vaults. Do not rename. */

export const CCY = ["CHF", "USD", "AED", "EUR"];
export const CCY_DIGITAL = ["BTC", "USD", "CHF", "EUR", "AED"];

export const CLS = {
  development: { label: "Development", short: "DEV", real: true, plan: true },
  property: { label: "Investment property", short: "PROP", real: true },
  offplan: { label: "Off-plan", short: "OFF", real: true, plan: true },
  cash: { label: "Cash & deposits", short: "CASH" },
  crypto: { label: "Digital assets", short: "DIG" },
  trading: { label: "Trading account", short: "TRD" },
  other: { label: "Other", short: "OTH", real: true, plan: true },
};
export const CLS_ORDER = ["development", "property", "offplan", "cash", "crypto", "trading", "other"];

/* acquisition cost presets, editable per position */
export const MARKETS = [
  ["Abu Dhabi", 2],
  ["Dubai", 4],
  ["Dubai + agency", 6],
  ["Switzerland", 1],
  ["None", 0],
];

export const BLANK = {
  base: "CHF",
  fx: { CHF: 1, USD: 0.808, AED: 0.22001, EUR: 0.9335 },
  btcUSD: 64957,
  asOf: "",
  autoRates: true,
  ratesAt: "",
  ratesSrc: "",
  positions: [],
  commitments: [],
  inflows: [],
};
