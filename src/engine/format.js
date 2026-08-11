/* ── formatting & date utils ───────────────────────────────
   Extracted verbatim from the original single-file app (lines 45–81).
   These are pure helpers shared by the engine and the UI. Do not
   change their behaviour — the engine's figures depend on them. */

export const uid = () => Math.random().toString(36).slice(2, 10);
export const today = () => new Date().toISOString().slice(0, 10);
export const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const addMonths = (iso, n) => {
  const d = new Date(iso + "T00:00:00");
  d.setMonth(d.getMonth() + n);
  return d.toISOString().slice(0, 10);
};

export const num = (n, dp = 0) => {
  if (!isFinite(n)) return "—";
  const neg = n < 0;
  const s = Math.abs(n).toFixed(dp).replace(/\B(?=(\d{3})+(?!\d))/g, "’");
  return (neg ? "−" : "") + s;
};
export const sgn = (n) => (n > 0 ? "+" : n < 0 ? "−" : "") + num(Math.abs(n));
export const compact = (n) => {
  const a = Math.abs(n), g = n < 0 ? "−" : "";
  if (a >= 1e6) return g + (a / 1e6).toFixed(a >= 1e7 ? 1 : 2) + "M";
  if (a >= 1e3) return g + (a / 1e3).toFixed(0) + "K";
  return g + a.toFixed(0);
};
export const pct = (n, dp = 1) => (isFinite(n) ? n.toFixed(dp) + "%" : "—");
export const mKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
export const mLabel = (k) => ({ m: MON[Number(k.split("-")[1]) - 1], y: k.split("-")[0].slice(2) });
export const monthsBetween = (from, to) => {
  if (!from || !to) return 0;
  const a = new Date(from + "T00:00:00"), b = new Date(to + "T00:00:00");
  return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
};
export const grow = (v, gPct, months) => v * Math.pow(1 + (gPct || 0) / 100, months / 12);
export const byDue = (a, b) => (a.due || "9999-99").localeCompare(b.due || "9999-99");
export const sortTranches = (list) => [...(list || [])].sort(byDue);
export const shortDate = (iso) => (iso ? `${MON[Number(iso.slice(5, 7)) - 1]} ${iso.slice(2, 4)}` : "—");
