import React, { useState, useMemo } from "react";
import { num, pct, compact } from "../engine/format.js";
import { CLS, CLS_ORDER } from "../engine/constants.js";

const CLS_COLOR = {
  development: "#0E1B2A", property: "#23557E", offplan: "#3E8168",
  cash: "#B77F35", crypto: "#9C4655", trading: "#5E77A6", other: "#7A5B9C",
};
const LENSES = [["position", "Position"], ["financing", "Financing"], ["exit", "Exit today"], ["future", "At completion"]];

export default function Positions({ e, s, edit, onEdit, onAdd }) {
  const [lens, setLens] = useState("position");
  const [cls, setCls] = useState("all");
  const [q, setQ] = useState("");

  const rows = useMemo(() => {
    let list = e.priced.filter((p) => cls === "all" || p.cls === cls);
    if (q.trim()) { const t = q.toLowerCase(); list = list.filter((p) => (p.name || "").toLowerCase().includes(t) || (p.place || "").toLowerCase().includes(t)); }
    return [...list].sort((a, b) => b.equity - a.equity);
  }, [e.priced, cls, q]);

  const classesPresent = CLS_ORDER.filter((c) => e.priced.some((p) => p.cls === c));
  const cols = COLS[lens];

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
        <div className="cp-lens">
          {LENSES.map(([k, l]) => <button key={k} className={lens === k ? "on" : ""} onClick={() => setLens(k)}>{l}</button>)}
        </div>
      </div>

      {/* desktop table */}
      <div className="cp-tbl-wrap">
        <table className="cp-tbl">
          <thead>
            <tr>
              <th>Position</th>
              {cols.map((c) => <th key={c.k} className="r">{c.h}</th>)}
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
      </div>

      {rows.length === 0 && <p className="cp-fine">No positions match this filter.</p>}
    </>
  );
}

const money = (v) => num(Math.round(v));
const COLS = {
  position: [
    { k: "mark", h: "Mark", f: (p) => money(p.mark) },
    { k: "equity", h: "Equity", f: (p) => money(p.equity) },
    { k: "unreal", h: "Unrealised", f: (p) => (p.unreal ? num(Math.round(p.unreal)) : "—"), tone: (p) => (p.unreal > 0 ? "up" : p.unreal < 0 ? "down" : "") },
  ],
  financing: [
    { k: "paid", h: "Paid", f: (p) => money(p.paid) },
    { k: "owed", h: "Owed", f: (p) => (p.owedAll ? money(p.owedAll) : "—") },
    { k: "debt", h: "Debt", f: (p) => (p.debt ? money(p.debt) : "—") },
    { k: "ltv", h: "LTV", f: (p) => (p.debt ? pct(p.ltv) : "—") },
  ],
  exit: [
    { k: "mark", h: "Mark", f: (p) => money(p.mark) },
    { k: "cost", h: "Exit costs", f: (p) => (p.sellCosts ? money(p.sellCosts) : "—") },
    { k: "net", h: "Net if sold", f: (p) => money(p.cashOnExit), tone: () => "up" },
  ],
  future: [
    { k: "cv", h: "Value at completion", f: (p) => (p.completeVal ? money(p.completeVal) : "—") },
    { k: "profit", h: "Profit at completion", f: (p) => (p.profitAtComp ? num(Math.round(p.profitAtComp)) : "—"), tone: (p) => (p.profitAtComp > 0 ? "up" : "") },
    { k: "mult", h: "Multiple", f: (p) => (p.invested > 0 ? p.multipleAtComp.toFixed(2) + "×" : "—") },
  ],
};
