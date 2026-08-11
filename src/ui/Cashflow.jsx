import React, { useState } from "react";
import { num, compact, MON } from "../engine/format.js";
import { today } from "../engine/format.js";

const mDate = (key) => { const [y, m] = key.split("-"); return `${MON[Number(m) - 1]} ${y.slice(2)}`; };
const shortDay = (iso) => (iso ? `${MON[Number(iso.slice(5, 7)) - 1]} ${iso.slice(8, 10)}, ${iso.slice(2, 4)}` : "—");
const cleanLabel = (s) => s.replace(/ — (realised|completes)$/, "");

export default function Cashflow({ e, s }) {
  const [tab, setTab] = useState("out");
  const t0 = today();
  const out = e.outgoings
    .filter((o) => o.status !== "paid" && o.status !== "settled" && o.due && o.due >= t0)
    .slice(0, 24);
  const sells = e.events.filter((ev) => ev.kind === "sell");

  return (
    <>
      <div className="cp-section-h" style={{ marginTop: 4 }}>
        <h2>Cashflow</h2>
        <div className="cp-lens">
          <button className={tab === "out" ? "on" : ""} onClick={() => setTab("out")}>Outgoings</button>
          <button className={tab === "in" ? "on" : ""} onClick={() => setTab("in")}>Realisations</button>
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
          <div className="cp-section-h"><h2>Scheduled outgoings</h2><span className="note">unpaid instalments, down payments, costs &amp; commitments</span></div>
          <div className="cp-tbl-wrap">
            <table className="cp-tbl">
              <thead><tr><th>Due</th><th>Item</th><th>Counterparty</th><th className="r">Amount</th></tr></thead>
              <tbody>
                {out.map((o) => (
                  <tr key={o.id}>
                    <td className="num" style={{ whiteSpace: "nowrap" }}>{shortDay(o.due)}</td>
                    <td><span className="name">{o.posName ? o.posName : o.label}</span>{o.posName && <div className="place">{o.label}</div>}</td>
                    <td style={{ color: "var(--body)", fontSize: 12.5 }}>{o.counterparty || "—"}</td>
                    <td className="r num">{num(Math.round(o.base))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
