import React from "react";
import { num, compact, pct, MON } from "../engine/format.js";
import { CountUp, NavChart } from "./charts.jsx";

const mDate = (key) => { const [y, m] = key.split("-"); return `${MON[Number(m) - 1]} ${y.slice(2)}`; };
const ZERO = { delay: 0, haircut: 0, rate: 0, growth: 0 };

export default function Liquidity({ e, s, stress, setStress, horizon, setHorizon }) {
  const ccy = s.base;
  const safe = e.runway == null;
  const on = stress && (stress.delay || stress.haircut || stress.rate || stress.growth);
  const set = (k, v) => setStress((o) => ({ ...o, [k]: v }));

  return (
    <>
      <div className="cp-section-h" style={{ marginTop: 4 }}>
        <h2>Liquidity</h2>
        <span className="note">cash walked forward — deposits in, instalments &amp; costs out</span>
      </div>

      {/* scenario & horizon */}
      <section className="cp-panel" style={{ marginBottom: 8 }}>
        <div className="cp-section-h" style={{ marginBottom: 14 }}>
          <span className="eyebrow">Stress test &amp; horizon</span>
          {on ? <button className="cp-btn ghost sm" onClick={() => setStress(ZERO)}>Reset scenario</button> : null}
        </div>
        <div style={{ marginBottom: 18 }}>
          <span className="eyebrow" style={{ display: "block", marginBottom: 8 }}>Horizon</span>
          <div className="cp-lens" style={{ display: "inline-flex", width: "auto", marginLeft: 0 }}>
            {[[12, "1 yr"], [36, "3 yr"], [60, "5 yr"], [120, "10 yr"]].map(([m, l]) => (
              <button key={m} className={horizon === m ? "on" : ""} onClick={() => setHorizon(m)}>{l}</button>
            ))}
          </div>
        </div>
        <div className="cp-scenario-grid">
          <Slider label="Proceeds delayed" value={stress.delay} min={0} max={12} step={1} unit=" months" signed={false} onChange={(v) => set("delay", v)} />
          <Slider label="Marks haircut" value={stress.haircut} min={0} max={30} step={1} unit="%" signed={false} onChange={(v) => set("haircut", v)} />
          <Slider label="Interest-rate shift" value={stress.rate} min={-2} max={5} step={0.5} unit=" pp" signed onChange={(v) => set("rate", v)} />
          <Slider label="Growth adjustment" value={stress.growth} min={-5} max={5} step={0.5} unit="%" signed onChange={(v) => set("growth", v)} />
        </div>
      </section>

      <div className="cp-stats">
        <Stat l="Liquid now" v={e.liquid} note="cash & deposits" />
        <Stat l="Low point" v={e.low} note={e.lowKey ? mDate(e.lowKey) : "—"} tone={safe ? "" : "down"} />
        <Stat l="12-month cover" v={e.coverage} dp={0} suffix="%" note="of next year's outgoings" />
        <div className="cp-stat">
          <span className="eyebrow">Funding gap</span>
          <div className={"cp-stat-v " + (safe ? "up" : "down")}>{safe ? "None" : "Month " + e.runway}</div>
          <div className="cp-stat-note">{safe ? "no breach in projection" : "cash goes negative"}</div>
        </div>
      </div>

      <section className="cp-section">
        <div className="cp-section-h">
          <h2>Cash balance, projected</h2>
          <span className="note">closing cash each month · {Math.round(horizon / 12)}-year view{on ? " · stressed" : ""}</span>
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
              ? <>Cash never falls below <b className="fig">{num(e.low)} {ccy}</b> (low point {mDate(e.lowKey)}). Coverage of the next twelve months' outgoings runs at <b className="fig">{pct(e.coverage, 0)}</b>{on ? ", under this scenario" : ""}.</>
              : <>Projected cash turns negative around month {e.runway}. The low point is <b className="fig">{num(e.low)} {ccy}</b> in {mDate(e.lowKey)} — plan a drawdown or a sale before then.</>}
          </div>
        </div>
      </section>
    </>
  );
}

function Slider({ label, value, min, max, step, unit, signed, onChange }) {
  const shown = (signed && value > 0 ? "+" : "") + value + unit;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 7 }}>
        <span className="eyebrow">{label}</span>
        <span className="fig" style={{ fontSize: 12.5, color: value ? "var(--ink)" : "var(--soft)", fontWeight: 600 }}>{shown}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} style={{ width: "100%" }} />
    </div>
  );
}

const Stat = ({ l, v, note, tone, dp = 0, suffix = "" }) => (
  <div className="cp-stat">
    <span className="eyebrow">{l}</span>
    <div className={"cp-stat-v" + (tone ? " " + tone : "")}><CountUp value={v} dp={dp} suffix={suffix} /></div>
    <div className="cp-stat-note">{note}</div>
  </div>
);
