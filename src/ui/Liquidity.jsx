import React from "react";
import { num, compact, pct, MON } from "../engine/format.js";
import { CountUp, NavChart } from "./charts.jsx";

const mDate = (key) => { const [y, m] = key.split("-"); return `${MON[Number(m) - 1]} ${y.slice(2)}`; };

export default function Liquidity({ e, s }) {
  const ccy = s.base;
  const safe = e.runway == null;
  return (
    <>
      <div className="cp-section-h" style={{ marginTop: 4 }}>
        <h2>Liquidity</h2>
        <span className="note">cash on hand walked forward — deposits in, instalments &amp; costs out</span>
      </div>

      <div className="cp-stats">
        <Stat l="Liquid now" v={e.liquid} note="cash & deposits" />
        <Stat l="Low point" v={e.low} note={e.lowKey ? mDate(e.lowKey) : "—"} tone={safe ? "" : "down"} />
        <Stat l="12-month cover" v={e.coverage} dp={0} suffix="%" note="of next year's outgoings" />
        <Stat l="Out / in, 12m" v={e.out12} note={`in ${compact(e.in12)}`} />
        <div className="cp-stat">
          <span className="eyebrow">Funding gap</span>
          <div className={"cp-stat-v " + (safe ? "up" : "down")}>{safe ? "None" : "Month " + e.runway}</div>
          <div className="cp-stat-note">{safe ? "no breach in projection" : "cash goes negative"}</div>
        </div>
      </div>

      <section className="cp-section">
        <div className="cp-section-h">
          <h2>Cash balance, projected</h2>
          <span className="note">closing cash each month</span>
        </div>
        <NavChart ladder={e.ladder} events={e.events} field="close" />
      </section>

      <section className="cp-section">
        <div className={"cp-panel " + (safe ? "cream" : "")} style={safe ? {} : { borderColor: "rgba(180,82,63,0.35)" }}>
          <div style={{ fontSize: 15, color: "var(--ink)", fontWeight: 500, marginBottom: 4 }}>
            {safe ? "Liquidity holds through the plan" : "Liquidity gap ahead"}
          </div>
          <div style={{ fontSize: 13, color: "var(--body)" }}>
            {safe
              ? <>Cash never falls below <b className="fig">{num(e.low)} {ccy}</b> (low point {mDate(e.lowKey)}). Coverage of the next twelve months' outgoings runs at <b className="fig">{pct(e.coverage, 0)}</b>.</>
              : <>Projected cash turns negative around month {e.runway}. The low point is <b className="fig">{num(e.low)} {ccy}</b> in {mDate(e.lowKey)} — plan a drawdown or a sale before then.</>}
          </div>
        </div>
      </section>
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
