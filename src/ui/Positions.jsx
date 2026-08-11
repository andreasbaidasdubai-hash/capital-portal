import React, { useState, useMemo } from "react";
import { num, pct, compact } from "../engine/format.js";
import { CLS, CLS_ORDER } from "../engine/constants.js";

const CLS_COLOR = {
  development: "#0E1B2A", property: "#23557E", offplan: "#3E8168",
  cash: "#B77F35", crypto: "#9C4655", trading: "#5E77A6", other: "#7A5B9C",
};
const LENSES = [["position", "Position"], ["financing", "Financing"], ["exit", "Exit today"], ["future", "At completion"]];
const DEFAULT_SORT = { position: "equity", financing: "paid", exit: "net", future: "profit" };

export default function Positions({ e, s, edit, onEdit, onAdd }) {
  const [lens, setLens] = useState("position");
  const [cls, setCls] = useState("all");
  const [place, setPlace] = useState("all");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState({ key: "equity", dir: "desc" });

  const cols = COLS[lens];
  const colByKey = (k) => cols.find((c) => c.k === k);

  const switchLens = (l) => { setLens(l); setSort({ key: DEFAULT_SORT[l], dir: "desc" }); };
  const clickSort = (key) => setSort((o) => (o.key === key ? { key, dir: o.dir === "asc" ? "desc" : "asc" } : { key, dir: key === "name" ? "asc" : "desc" }));

  const rows = useMemo(() => {
    let list = e.priced.filter((p) => (cls === "all" || p.cls === cls) && (place === "all" || (p.place || "") === place));
    if (q.trim()) { const t = q.toLowerCase(); list = list.filter((p) => (p.name || "").toLowerCase().includes(t) || (p.place || "").toLowerCase().includes(t)); }
    const acc = sort.key === "name" ? null : colByKey(sort.key);
    return [...list].sort((a, b) => {
      if (sort.key === "name") { const r = (a.name || "").localeCompare(b.name || ""); return sort.dir === "asc" ? r : -r; }
      const av = acc ? (acc.n(a) || 0) : 0, bv = acc ? (acc.n(b) || 0) : 0;
      return sort.dir === "asc" ? av - bv : bv - av;
    });
  }, [e.priced, cls, place, q, sort, lens]);

  const classesPresent = CLS_ORDER.filter((c) => e.priced.some((p) => p.cls === c));
  const places = [...new Set(e.priced.map((p) => p.place).filter(Boolean))].sort();
  const totals = cols.map((c) => (c.total ? rows.reduce((a, p) => a + (c.n(p) || 0), 0) : null));
  const totTone = (c, v) => (c.k === "net" || c.k === "profit" ? "up" : c.k === "unreal" ? (v > 0 ? "up" : v < 0 ? "down" : "") : "");
  const Ar = ({ k }) => (sort.key === k ? <span className="cp-ar">{sort.dir === "asc" ? "▲" : "▼"}</span> : null);

  return (
    <>
      <div className="cp-section-h" style={{ marginTop: 4 }}>
        <h2>Positions</h2>
        {edit && <button className="cp-btn primary sm" onClick={onAdd}>+ Add position</button>}
      </div>

      <div className="cp-filters">
        <button className={"cp-chip" + (cls === "all" ? " on" : "")} onClick={() => setCls("all")}>All</button>
        {classesPresent.map((c) => (
          <button key={c} className={"cp-chip" + (cls === c ? " on" : "")} onClick={() => setCls(c)}>{CLS[c].label}</button>
        ))}
        <input className="cp-search" placeholder="Search…" value={q} onChange={(ev) => setQ(ev.target.value)} />
      </div>

      <div className="cp-controls">
        {places.length > 1 && (
          <select className="cp-select" value={place} onChange={(ev) => setPlace(ev.target.value)} aria-label="Filter by location">
            <option value="all">All locations</option>
            {places.map((pl) => <option key={pl} value={pl}>{pl}</option>)}
          </select>
        )}
        <select className="cp-select" value={sort.key} onChange={(ev) => clickSort(ev.target.value)} aria-label="Sort by">
          <option value="name">Sort: Name</option>
          {cols.map((c) => <option key={c.k} value={c.k}>Sort: {c.h}</option>)}
        </select>
        <button className="cp-btn ghost sm" onClick={() => setSort((o) => ({ ...o, dir: o.dir === "asc" ? "desc" : "asc" }))} title="Toggle direction">
          {sort.dir === "asc" ? "Ascending ▲" : "Descending ▼"}
        </button>
        <div className="cp-lens" style={{ marginLeft: "auto" }}>
          {LENSES.map(([k, l]) => <button key={k} className={lens === k ? "on" : ""} onClick={() => switchLens(k)}>{l}</button>)}
        </div>
      </div>

      {/* desktop table */}
      <div className="cp-tbl-wrap">
        <table className="cp-tbl">
          <thead>
            <tr>
              <th className={"cp-th-sort" + (sort.key === "name" ? " act" : "")} onClick={() => clickSort("name")}>Position<Ar k="name" /></th>
              {cols.map((c) => (
                <th key={c.k} className={"r cp-th-sort" + (sort.key === c.k ? " act" : "")} onClick={() => clickSort(c.k)}>{c.h}<Ar k={c.k} /></th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} onClick={() => edit && onEdit && onEdit(p)} style={{ cursor: edit ? "pointer" : "default" }}>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    <span className="cp-badge" style={{ background: CLS_COLOR[p.cls] }}>{CLS[p.cls].short}</span>
                    <div><span className="name">{p.name}</span><div className="place">{p.place || "—"}</div></div>
                  </div>
                </td>
                {cols.map((c) => <td key={c.k} className={"r num" + (c.tone ? " " + c.tone(p) : "")}>{c.f(p)}</td>)}
              </tr>
            ))}
          </tbody>
          {rows.length > 0 && (
            <tfoot>
              <tr>
                <td className="tl">Total · {rows.length}</td>
                {cols.map((c, i) => (
                  <td key={c.k} className={"r num " + (c.total ? totTone(c, totals[i]) : "")}>{c.total ? num(Math.round(totals[i])) : ""}</td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* mobile cards */}
      <div className="cp-pcards">
        {rows.map((p) => (
          <div className="cp-pcard" key={p.id} onClick={() => edit && onEdit && onEdit(p)}>
            <div className="cp-pcard-h">
              <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <span className="cp-badge" style={{ background: CLS_COLOR[p.cls] }}>{CLS[p.cls].short}</span>
                <span className="name">{p.name}</span>
              </div>
              <span className="fig" style={{ fontWeight: 600 }}>{compact(p.equity)}</span>
            </div>
            <div className="cp-pcard-g">
              {cols.map((c) => (
                <div key={c.k}><div className="k">{c.h}</div><div className={"v" + (c.tone ? " " + c.tone(p) : "")}>{c.f(p)}</div></div>
              ))}
            </div>
          </div>
        ))}
        {rows.length > 0 && (
          <div className="cp-totcard">
            <div className="th">Total · {rows.length} position{rows.length > 1 ? "s" : ""}</div>
            {cols.map((c, i) => (c.total ? (
              <div className="cp-totrow" key={c.k}><span className="k">{c.h}</span><span className={"v " + totTone(c, totals[i])}>{num(Math.round(totals[i]))}</span></div>
            ) : null))}
          </div>
        )}
      </div>

      {rows.length === 0 && <p className="cp-fine">No positions match this filter.</p>}
    </>
  );
}

const money = (v) => num(Math.round(v));
const COLS = {
  position: [
    { k: "mark", h: "Mark", f: (p) => money(p.mark), n: (p) => p.mark, total: true },
    { k: "equity", h: "Equity", f: (p) => money(p.equity), n: (p) => p.equity, total: true },
    { k: "unreal", h: "Unrealised", f: (p) => (p.unreal ? num(Math.round(p.unreal)) : "—"), n: (p) => p.unreal, total: true, tone: (p) => (p.unreal > 0 ? "up" : p.unreal < 0 ? "down" : "") },
  ],
  financing: [
    { k: "paid", h: "Paid", f: (p) => money(p.paid), n: (p) => p.paid, total: true },
    { k: "owed", h: "Owed", f: (p) => (p.owedAll ? money(p.owedAll) : "—"), n: (p) => p.owedAll, total: true },
    { k: "debt", h: "Debt", f: (p) => (p.debt ? money(p.debt) : "—"), n: (p) => p.debt, total: true },
    { k: "ltv", h: "LTV", f: (p) => (p.debt ? pct(p.ltv) : "—"), n: (p) => p.ltv },
  ],
  exit: [
    { k: "mark", h: "Mark", f: (p) => money(p.mark), n: (p) => p.mark, total: true },
    { k: "cost", h: "Exit costs", f: (p) => (p.sellCosts ? money(p.sellCosts) : "—"), n: (p) => p.sellCosts, total: true },
    { k: "net", h: "Net if sold", f: (p) => money(p.cashOnExit), n: (p) => p.cashOnExit, total: true, tone: () => "up" },
    { k: "profit", h: "Exit profit", f: (p) => (p.cls === "cash" ? "—" : num(Math.round(p.exitProfit))), n: (p) => p.exitProfit, total: true, tone: (p) => (p.cls === "cash" ? "" : p.exitProfit >= 0 ? "up" : "down") },
  ],
  future: [
    { k: "cv", h: "Value at completion", f: (p) => (p.completeVal ? money(p.completeVal) : "—"), n: (p) => p.completeVal, total: true },
    { k: "profit", h: "Profit at completion", f: (p) => (p.profitAtComp ? num(Math.round(p.profitAtComp)) : "—"), n: (p) => p.profitAtComp, total: true, tone: (p) => (p.profitAtComp > 0 ? "up" : "") },
    { k: "mult", h: "Multiple", f: (p) => (p.invested > 0 ? p.multipleAtComp.toFixed(2) + "×" : "—"), n: (p) => (p.invested > 0 ? p.multipleAtComp : 0) },
  ],
};
