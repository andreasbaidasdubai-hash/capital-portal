import React from "react";
import { num, compact, pct, MON } from "../engine/format.js";
import { CountUp, NavChart, Donut } from "./charts.jsx";

const CCOLORS = ["#23557E", "#B77F35", "#3E8168", "#9C4655", "#5E77A6", "#7A5B9C"];
const cleanLabel = (s) => s.replace(/ — (realised|completes)$/, "");
const mDate = (key) => { const [y, m] = key.split("-"); return `${MON[Number(m) - 1]} ${y.slice(2)}`; };

export default function Overview({ e, s, setView }) {
  const ccy = s.base;
  const projected = e.ladder[e.ladder.length - 1].navT;
  const growth = projected - e.nav;
  const growthPct = e.nav ? (growth / e.nav) * 100 : 0;

  const allocTotal = e.byClass.reduce((a, [, v]) => a + v, 0) || 1;
  const segments = e.byClass.map(([label, value], i) => ({ label, value, color: CCOLORS[i % CCOLORS.length] }));
  const upcoming = e.events.filter((ev) => ev.kind === "sell").slice(0, 6);
  const bookProfit = e.priced.filter((p) => p.cls === "offplan").reduce((a, p) => a + p.profitAtComp, 0);
  const top = e.priced
    .filter((p) => p.cls === "offplan")
    .map((p) => ({ name: p.name, place: p.place, equity: p.equity, profit: p.profitAtComp, mult: p.invested > 0 ? p.multipleAtComp : null }))
    .sort((a, b) => b.profit - a.profit)
    .slice(0, 7);

  return (
    <>
      <section className="cp-hero">
        <span className="eyebrow">Net asset value</span>
        <div className="cp-hero-fig">
          <CountUp value={e.nav} />
          <span className="cp-hero-ccy">{ccy}</span>
        </div>
        <div className="cp-hero-sub">
          <span>Gross marks <b className="fig">{compact(e.gross)}</b>, less obligations <b className="fig">{compact(e.obligations)}</b></span>
          {projected !== e.nav && (
            <span className="cp-delta">
              <span className="eyebrow">Projected {mDate(e.ladder[e.ladder.length - 1].key)}</span>
              <b className="fig up">{compact(projected)}</b>
              <span className="up fig">▲ {pct(growthPct, 0)}</span>
            </span>
          )}
        </div>
      </section>

      <div className="cp-stats">
        <Stat l="Liquid" v={e.liquid} note="cash & deposits" />
        <Stat l="Deployed capital" v={e.deployed} note="own capital in, ex-cash" />
        <Stat l="Profit at completion" v={bookProfit} note="full off-plan book" tone="up" />
        <Stat l="Owed & committed" v={e.obligations} note="unpaid contracts" />
        <Stat l="Return" v={e.multiple} dp={2} suffix="×" note="on deployed capital" />
      </div>

      <section className="cp-section">
        <div className="cp-section-h">
          <h2>Net asset value, projected</h2>
          <span className="note">{e.ladder.length}-month walk · marks step at completion, sales release cash</span>
        </div>
        <NavChart ladder={e.ladder} events={e.events} />
      </section>

      <section className="cp-section cp-cols">
        <div>
          <div className="cp-section-h"><h2>Allocation</h2></div>
          <div className="cp-alloc">
            <Donut segments={segments} />
            <div className="cp-legend">
              {segments.map((sg) => (
                <div className="cp-leg-row" key={sg.label}>
                  <span className="cp-leg-sw" style={{ background: sg.color }} />
                  <span className="cp-leg-name">{sg.label}</span>
                  <span className="cp-leg-pct">{pct((sg.value / allocTotal) * 100, 0)}</span>
                  <span className="cp-leg-val">{compact(sg.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div>
          <div className="cp-section-h"><h2>Realisations ahead</h2>{setView && <button className="cp-btn ghost sm" onClick={() => setView("Cashflow")}>Full schedule</button>}</div>
          <div className="cp-miles">
            {upcoming.length === 0 && <p className="cp-fine">No planned realisations in the current book.</p>}
            {upcoming.map((m, i) => (
              <div className="cp-mile" key={i}>
                <span className="cp-mile-date">{mDate(m.key)}</span>
                <div>
                  <div className="cp-mile-label">{cleanLabel(m.label)}</div>
                  <div className="cp-mile-kind">net proceeds{m.profit != null ? ` · profit ${num(Math.round(m.profit))}` : ""}</div>
                </div>
                <span className="cp-mile-amt fig up">{compact(m.amt)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {e.runway == null && e.low != null && (
        <section className="cp-section">
          <div className="cp-panel cream cp-liq">
            <div className="cp-liq-badge">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
            </div>
            <div className="cp-liq-t">
              <div style={{ fontSize: 15, color: "var(--ink)", fontWeight: 500 }}>Liquidity holds through the plan</div>
              <div style={{ fontSize: 13, color: "var(--body)", marginTop: 3 }}>
                Cash never falls below <b className="fig">{num(e.low)} {ccy}</b> (low point {mDate(e.lowKey)}). Coverage of the next twelve months' outgoings runs at <b className="fig">{pct(e.coverage, 0)}</b>. No funding gap in the projection.
              </div>
            </div>
          </div>
        </section>
      )}

      {top.length > 0 && (
        <section className="cp-section">
          <div className="cp-section-h">
            <h2>Off-plan book</h2>
            {setView && <button className="cp-btn ghost sm" onClick={() => setView("Positions")}>All positions</button>}
          </div>
          <div className="cp-tbl-wrap">
            <table className="cp-tbl">
              <thead><tr><th>Position</th><th className="r">Capital in</th><th className="r">Profit at completion</th><th className="r">Multiple</th></tr></thead>
              <tbody>
                {top.map((p) => (
                  <tr key={p.name}>
                    <td><span className="name">{p.name}</span><div className="place">{p.place}</div></td>
                    <td className="r num">{num(p.equity)}</td>
                    <td className="r num up">{num(Math.round(p.profit))}</td>
                    <td className="r mult">{p.mult != null ? p.mult.toFixed(2) + "×" : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}

const Stat = ({ l, v, note, tone, dp = 0, suffix = "" }) => (
  <div className="cp-stat">
    <span className="eyebrow">{l}</span>
    <div className={"cp-stat-v" + (tone ? " " + tone : "")}><CountUp value={v} dp={dp} suffix={suffix} /></div>
    <div className="cp-stat-note">{note}</div>
  </div>
);
