import React from "react";
import { num, compact, pct, MON } from "../engine/format.js";
import { CountUp } from "./charts.jsx";

const shortDay = (iso) => (iso ? `${MON[Number(iso.slice(5, 7)) - 1]} ${iso.slice(2, 4)}` : "—");

export default function Income({ e, s, edit, onAddIncome, onEditPos, onEditInflow }) {
  const ccy = s.base;
  const deposits = e.priced.filter((p) => p.depositPa > 0);
  const idle = e.priced.filter((p) => (p.cls === "cash" || p.cls === "trading") && !(Number(p.rate) > 0));
  const rentals = e.priced.filter((p) => p.rentPa > 0);
  const earnings = (e.earnings || []).filter((f) => f.status !== "received");
  const afterDebt = e.incomeRun - e.servicePa;
  const empty = deposits.length === 0 && rentals.length === 0 && earnings.length === 0;

  return (
    <>
      <div className="cp-section-h" style={{ marginTop: 4 }}>
        <h2>Income</h2>
        {edit && <button className="cp-btn primary sm" onClick={onAddIncome}>+ Add income</button>}
      </div>

      <div className="cp-stats">
        <Stat l="Income run-rate" v={e.incomeRun} note="per year, at today's book" tone={e.incomeRun > 0 ? "up" : ""} />
        <Stat l="After debt service" v={afterDebt} note={`less ${compact(e.servicePa)} debt cost`} tone={afterDebt > 0 ? "up" : afterDebt < 0 ? "down" : ""} />
        <Stat l="Next 12 months" v={e.income12} note="income received" />
        <Stat l="Idle cash" v={e.idleCash} note="earning nothing" tone={e.idleCash > 0 ? "down" : ""} />
      </div>

      {empty && (
        <section className="cp-section">
          <div className="cp-panel cream">
            <div style={{ fontSize: 15, color: "var(--ink)", fontWeight: 500, marginBottom: 4 }}>No income tracked yet</div>
            <p className="cp-fine" style={{ marginTop: 0 }}>
              Add an interest rate to a cash or savings position, rent to a property, or a company salary as recurring income — each then flows through here and into the cash timeline.
            </p>
          </div>
        </section>
      )}

      {/* Interest & deposits */}
      {(deposits.length > 0 || idle.length > 0) && (
        <section className="cp-section">
          <div className="cp-section-h"><h2>Interest &amp; deposits</h2><span className="note">cash and savings earning a rate</span></div>
          <div className="cp-tbl-wrap">
            <table className="cp-tbl">
              <thead><tr><th>Account</th><th className="r">Balance</th><th className="r">Rate</th><th className="r">Interest / year</th></tr></thead>
              <tbody>
                {deposits.map((p) => (
                  <tr key={p.id} onClick={() => edit && onEditPos && onEditPos(p)} style={{ cursor: edit ? "pointer" : "default" }}>
                    <td><span className="name">{p.name}</span><div className="place">{p.place || "—"}</div></td>
                    <td className="r num">{num(p.mark)}</td>
                    <td className="r num">{pct(Number(p.rate) || 0)}</td>
                    <td className="r num up">{num(Math.round(p.depositPa))}</td>
                  </tr>
                ))}
                {idle.map((p) => (
                  <tr key={p.id} onClick={() => edit && onEditPos && onEditPos(p)} style={{ cursor: edit ? "pointer" : "default" }}>
                    <td><span className="name">{p.name}</span><div className="place">no interest set</div></td>
                    <td className="r num">{num(p.mark)}</td>
                    <td className="r num" style={{ color: "var(--soft)" }}>—</td>
                    <td className="r num down">0</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="cp-cardlist">
            {[...deposits, ...idle].map((p) => (
              <div className="cp-dcard tap" key={p.id} onClick={() => edit && onEditPos && onEditPos(p)}>
                <div className="cp-dcard-h">
                  <div><div className="cp-dcard-t">{p.name}</div><div className="cp-dcard-sub">{p.depositPa > 0 ? `${pct(Number(p.rate) || 0)} on ${compact(p.mark)}` : "no interest set"}</div></div>
                  <div className={"cp-dcard-v " + (p.depositPa > 0 ? "up" : "down")}>{num(Math.round(p.depositPa))}<span style={{ fontSize: 10, color: "var(--soft)", fontWeight: 400 }}>/yr</span></div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Rent */}
      {rentals.length > 0 && (
        <section className="cp-section">
          <div className="cp-section-h"><h2>Rental income</h2><span className="note">net of debt service</span></div>
          <div className="cp-tbl-wrap">
            <table className="cp-tbl">
              <thead><tr><th>Property</th><th className="r">Rent / year</th><th className="r">Debt service</th><th className="r">Net / year</th></tr></thead>
              <tbody>
                {rentals.map((p) => (
                  <tr key={p.id} onClick={() => edit && onEditPos && onEditPos(p)} style={{ cursor: edit ? "pointer" : "default" }}>
                    <td><span className="name">{p.name}</span><div className="place">{p.place || "—"}</div></td>
                    <td className="r num">{num(Math.round(p.rentPa))}</td>
                    <td className="r num">{p.servicePa ? "−" + num(Math.round(p.servicePa)) : "—"}</td>
                    <td className={"r num " + (p.netRentPa >= 0 ? "up" : "down")}>{num(Math.round(p.netRentPa))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="cp-cardlist">
            {rentals.map((p) => (
              <div className="cp-dcard tap" key={p.id} onClick={() => edit && onEditPos && onEditPos(p)}>
                <div className="cp-dcard-h">
                  <div><div className="cp-dcard-t">{p.name}</div><div className="cp-dcard-sub">rent {compact(p.rentPa)}/yr</div></div>
                  <div className={"cp-dcard-v " + (p.netRentPa >= 0 ? "up" : "down")}>{num(Math.round(p.netRentPa))}<span style={{ fontSize: 10, color: "var(--soft)", fontWeight: 400 }}>/yr net</span></div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Company & other earnings */}
      {earnings.length > 0 && (
        <section className="cp-section">
          <div className="cp-section-h"><h2>Company &amp; other income</h2><span className="note">salary, dividends, fees</span></div>
          <div className="cp-tbl-wrap">
            <table className="cp-tbl">
              <thead><tr><th>Source</th><th className="r">Next due</th><th className="r">Likelihood</th><th className="r">Amount</th></tr></thead>
              <tbody>
                {earnings.map((f) => (
                  <tr key={f.id} onClick={() => edit && onEditInflow && onEditInflow(f)} style={{ cursor: edit ? "pointer" : "default" }}>
                    <td><span className="name">{f.label}</span></td>
                    <td className="r num" style={{ whiteSpace: "nowrap" }}>{shortDay(f.due)}</td>
                    <td className="r num">{pct(Number(f.probability) ?? 100, 0)}</td>
                    <td className="r num up">{f.ccy} {num(Number(f.amount) || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="cp-cardlist">
            {earnings.map((f) => (
              <div className="cp-dcard tap" key={f.id} onClick={() => edit && onEditInflow && onEditInflow(f)}>
                <div className="cp-dcard-h">
                  <div><div className="cp-dcard-t">{f.label}</div><div className="cp-dcard-sub">{shortDay(f.due)} · {pct(Number(f.probability) ?? 100, 0)}</div></div>
                  <div className="cp-dcard-v up">{f.ccy} {num(Number(f.amount) || 0)}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}

const Stat = ({ l, v, note, tone }) => (
  <div className="cp-stat">
    <span className="eyebrow">{l}</span>
    <div className={"cp-stat-v" + (tone ? " " + tone : "")}><CountUp value={v} /></div>
    <div className="cp-stat-note">{note}</div>
  </div>
);
