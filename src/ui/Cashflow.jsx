import React, { useState } from "react";
import { num, compact, MON } from "../engine/format.js";
import { today, addMonths } from "../engine/format.js";

const mDate = (key) => { const [y, m] = key.split("-"); return `${MON[Number(m) - 1]} ${y.slice(2)}`; };
const shortDay = (iso) => (iso ? `${MON[Number(iso.slice(5, 7)) - 1]} ${iso.slice(8, 10)}, ${iso.slice(2, 4)}` : "—");
const cleanLabel = (s) => s.replace(/ — (realised|completes)$/, "");

export default function Cashflow({ e, s, edit, onAddCommit, onAddInflow, onEdit }) {
  const [tab, setTab] = useState("out");
  const [range, setRange] = useState("12m");
  const t0 = today();
  const cut12 = addMonths(t0, 12);
  const out = e.outgoings
    .filter((o) => o.status !== "paid" && o.status !== "settled" && o.due && o.due >= t0 && (range === "all" || o.due < cut12))
    .slice(0, range === "12m" ? 40 : 120);
  const sells = e.events.filter((ev) => ev.kind === "sell");

  return (
    <>
      <div className="cp-section-h" style={{ marginTop: 4 }}>
        <h2>Cashflow</h2>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {edit && <button className="cp-btn ghost sm" onClick={onAddCommit}>+ Commitment</button>}
          {edit && <button className="cp-btn ghost sm" onClick={onAddInflow}>+ Income</button>}
          <div className="cp-lens">
            <button className={tab === "out" ? "on" : ""} onClick={() => setTab("out")}>Outgoings</button>
            <button className={tab === "in" ? "on" : ""} onClick={() => setTab("in")}>Realisations</button>
          </div>
        </div>
      </div>

      <div className="cp-stats">
        <Kpi l="Out, next 12m" v={compact(e.out12)} />
        <Kpi l="In, next 12m" v={compact(e.in12)} tone="up" />
        <Kpi l="Still owed & committed" v={compact(e.obligations)} />
        <Kpi l="Expected sale profit" v={compact(e.profitExpected)} tone="up" />
        <Kpi l="Next payment" v={e.nextOut ? compact(e.nextOut.base) : "—"} note={e.nextOut ? shortDay(e.nextOut.due) : ""} />
      </div>

      {tab === "out" && (
        <section className="cp-section">
          <div className="cp-section-h">
            <h2>Scheduled outgoings</h2>
            <div className="cp-lens">
              <button className={range === "12m" ? "on" : ""} onClick={() => setRange("12m")}>Next 12 months</button>
              <button className={range === "all" ? "on" : ""} onClick={() => setRange("all")}>All upcoming</button>
            </div>
          </div>
          <div className="cp-tbl-wrap">
            <table className="cp-tbl">
              <thead><tr><th>Due</th><th>Item</th><th>Counterparty</th><th className="r">Amount</th></tr></thead>
              <tbody>
                {out.map((o) => (
                  <tr key={o.id} onClick={() => edit && onEdit && onEdit(o)} style={{ cursor: edit ? "pointer" : "default" }}>
                    <td className="num" style={{ whiteSpace: "nowrap" }}>{shortDay(o.due)}</td>
                    <td><span className="name">{o.posName ? o.posName : o.label}</span>{o.posName && <div className="place">{o.label}</div>}</td>
                    <td style={{ color: "var(--body)", fontSize: 12.5 }}>{o.counterparty || "—"}</td>
                    <td className="r num">{num(Math.round(o.base))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="cp-cardlist">
            {out.map((o) => (
              <div className="cp-dcard tap" key={o.id} onClick={() => edit && onEdit && onEdit(o)}>
                <div className="cp-dcard-h">
                  <div>
                    <div className="cp-dcard-t">{o.posName ? o.posName : o.label}</div>
                    <div className="cp-dcard-sub">{shortDay(o.due)}{o.posName ? ` · ${o.label}` : ""}{o.counterparty && o.counterparty !== "—" ? ` · ${o.counterparty}` : ""}</div>
                  </div>
                  <div className="cp-dcard-v">{num(Math.round(o.base))}</div>
                </div>
              </div>
            ))}
          </div>
          {out.length === 0 && <p className="cp-fine">Nothing scheduled ahead.</p>}
        </section>
      )}

      {tab === "in" && (
        <section className="cp-section">
          <div className="cp-section-h"><h2>Realisations ahead</h2><span className="note">planned sales &amp; the proceeds they release</span></div>
          <div className="cp-tbl-wrap">
            <table className="cp-tbl">
              <thead><tr><th>Month</th><th>Position</th><th className="r">Net proceeds</th><th className="r">Profit</th></tr></thead>
              <tbody>
                {sells.map((m, i) => (
                  <tr key={i}>
                    <td className="num" style={{ whiteSpace: "nowrap" }}>{mDate(m.key)}</td>
                    <td><span className="name">{cleanLabel(m.label)}</span></td>
                    <td className="r num up">{num(Math.round(m.amt))}</td>
                    <td className="r num">{m.profit != null ? num(Math.round(m.profit)) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="cp-cardlist">
            {sells.map((m, i) => (
              <div className="cp-dcard" key={i}>
                <div className="cp-dcard-h">
                  <div>
                    <div className="cp-dcard-t">{cleanLabel(m.label)}</div>
                    <div className="cp-dcard-sub">{mDate(m.key)}{m.profit != null ? ` · profit ${num(Math.round(m.profit))}` : ""}</div>
                  </div>
                  <div className="cp-dcard-v up">{num(Math.round(m.amt))}</div>
                </div>
              </div>
            ))}
          </div>
          {sells.length === 0 && <p className="cp-fine">No planned realisations in the current book.</p>}
        </section>
      )}
    </>
  );
}

const Kpi = ({ l, v, note, tone }) => (
  <div className="cp-stat">
    <span className="eyebrow">{l}</span>
    <div className={"cp-stat-v" + (tone ? " " + tone : "")}>{v}</div>
    <div className="cp-stat-note">{note || " "}</div>
  </div>
);
