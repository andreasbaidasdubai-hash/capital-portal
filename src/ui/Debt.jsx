import React from "react";
import { num, compact, pct, MON } from "../engine/format.js";
import { CountUp } from "./charts.jsx";

const shortDay = (iso) => (iso ? `${MON[Number(iso.slice(5, 7)) - 1]} ${iso.slice(2, 4)}` : "—");

export default function Debt({ e, s, edit, onEditPos }) {
  const ccy = s.base;
  const mortgages = e.priced.filter((p) => p.debt > 0);
  const planned = e.priced.filter((p) => p.plannedAmt > 0);
  const coverage = e.servicePa > 0 ? e.incomeRun / e.servicePa : null;
  const net = e.incomeRun - e.servicePa;
  const empty = mortgages.length === 0 && planned.length === 0;

  return (
    <>
      <div className="cp-section-h" style={{ marginTop: 4 }}>
        <h2>Debt</h2>
        <span className="note">mortgages, debt service &amp; cover</span>
      </div>

      <div className="cp-stats">
        <Stat l="Total debt" v={e.debt} note="mortgages outstanding" tone={e.debt > 0 ? "down" : ""} />
        <Stat l="Debt service" v={e.servicePa} note="interest + amortisation / yr" tone={e.servicePa > 0 ? "down" : ""} />
        <Stat l="Loan to value" v={e.ltv} dp={1} suffix="%" note="debt ÷ gross marks" />
        <Stat l="Cost, next 12m" v={e.debtCost12} note="scheduled payments" />
      </div>

      {empty && (
        <section className="cp-section">
          <div className="cp-panel cream">
            <div style={{ fontSize: 15, color: "var(--ink)", fontWeight: 500, marginBottom: 4 }}>No mortgages on file</div>
            <p className="cp-fine" style={{ marginTop: 0 }}>
              Add a mortgage (outstanding today, or a planned drawdown) on any property in its editor — under <b>Financing</b> — and it appears here with its yearly cost, matched against your income.
            </p>
          </div>
        </section>
      )}

      {/* Income vs debt service */}
      {(e.servicePa > 0 || e.incomeRun > 0) && (
        <section className="cp-section">
          <div className="cp-panel" style={{ borderColor: net >= 0 ? "var(--line)" : "rgba(180,82,63,0.35)" }}>
            <div className="cp-section-h" style={{ marginBottom: 14 }}><span className="eyebrow">Income vs debt service</span></div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 24, alignItems: "baseline" }}>
              <Line l="Income p.a." v={e.incomeRun} tone="up" />
              <Line l="Debt service p.a." v={-e.servicePa} tone="down" />
              <Line l="Net" v={net} tone={net >= 0 ? "up" : "down"} strong />
              {coverage != null && (
                <div style={{ marginLeft: "auto" }}>
                  <div className="eyebrow" style={{ display: "block", marginBottom: 4 }}>Cover</div>
                  <div className="fig" style={{ fontSize: 20, fontWeight: 600, color: coverage >= 1 ? "var(--up)" : "var(--down)" }}>{coverage.toFixed(2)}×</div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Mortgages */}
      {mortgages.length > 0 && (
        <section className="cp-section">
          <div className="cp-section-h"><h2>Mortgages</h2></div>
          <div className="cp-tbl-wrap">
            <table className="cp-tbl">
              <thead><tr><th>Property</th><th className="r">Debt</th><th className="r">Rate</th><th className="r">Amort</th><th className="r">Service / yr</th><th className="r">LTV</th></tr></thead>
              <tbody>
                {mortgages.map((p) => (
                  <tr key={p.id} onClick={() => edit && onEditPos && onEditPos(p)} style={{ cursor: edit ? "pointer" : "default" }}>
                    <td><span className="name">{p.name}</span><div className="place">{p.place || "—"}</div></td>
                    <td className="r num">{num(p.debt)}</td>
                    <td className="r num">{pct(Number(p.rate) || 0)}</td>
                    <td className="r num">{pct(Number(p.amortPct) || 0)}</td>
                    <td className="r num down">{num(Math.round(p.servicePa))}</td>
                    <td className="r num">{pct(p.ltv)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="cp-cardlist">
            {mortgages.map((p) => (
              <div className="cp-dcard tap" key={p.id} onClick={() => edit && onEditPos && onEditPos(p)}>
                <div className="cp-dcard-h">
                  <div><div className="cp-dcard-t">{p.name}</div><div className="cp-dcard-sub">{pct(Number(p.rate) || 0)} · LTV {pct(p.ltv)}</div></div>
                  <div className="cp-dcard-v">{compact(p.debt)}</div>
                </div>
                <div className="cp-dcard-rows">
                  <div className="cp-dcard-kv"><span className="k">Service / yr</span><span className="v down">{num(Math.round(p.servicePa))}</span></div>
                  <div className="cp-dcard-kv"><span className="k">Amortisation</span><span className="v">{pct(Number(p.amortPct) || 0)}</span></div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Planned drawdowns */}
      {planned.length > 0 && (
        <section className="cp-section">
          <div className="cp-section-h"><h2>Planned drawdowns</h2><span className="note">mortgages still to be taken</span></div>
          <div className="cp-tbl-wrap">
            <table className="cp-tbl">
              <thead><tr><th>Property</th><th className="r">Drawdown</th><th className="r">Rate</th><th className="r">Amount</th></tr></thead>
              <tbody>
                {planned.map((p) => (
                  <tr key={p.id} onClick={() => edit && onEditPos && onEditPos(p)} style={{ cursor: edit ? "pointer" : "default" }}>
                    <td><span className="name">{p.name}</span></td>
                    <td className="r num" style={{ whiteSpace: "nowrap" }}>{shortDay(p.mortDate)}</td>
                    <td className="r num">{pct(Number(p.mortRate) || 0)}</td>
                    <td className="r num up">{num(Math.round(p.plannedAmt))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="cp-cardlist">
            {planned.map((p) => (
              <div className="cp-dcard tap" key={p.id} onClick={() => edit && onEditPos && onEditPos(p)}>
                <div className="cp-dcard-h">
                  <div><div className="cp-dcard-t">{p.name}</div><div className="cp-dcard-sub">{shortDay(p.mortDate)} · {pct(Number(p.mortRate) || 0)}</div></div>
                  <div className="cp-dcard-v up">{compact(p.plannedAmt)}</div>
                </div>
              </div>
            ))}
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

const Line = ({ l, v, tone, strong }) => (
  <div>
    <div className="eyebrow" style={{ display: "block", marginBottom: 4 }}>{l}</div>
    <div className={"fig " + (tone || "")} style={{ fontSize: strong ? 22 : 18, fontWeight: strong ? 700 : 500 }}>{v < 0 ? "−" : ""}{num(Math.abs(Math.round(v)))}</div>
  </div>
);
