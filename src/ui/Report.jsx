import React from "react";
import { num, compact, pct, MON } from "../engine/format.js";
import { LogoLockup, Ico } from "./common.jsx";

const mDate = (key) => { const [y, m] = key.split("-"); return `${MON[Number(m) - 1]} ${y.slice(2)}`; };
const CLEAN = (s) => s.replace(/ — (realised|completes)$/, "");

export default function Report({ e, s, horizon, onClose }) {
  const ccy = s.base;
  const bookProfit = e.priced.filter((p) => p.cls === "offplan").reduce((a, p) => a + p.profitAtComp, 0);
  const allocTotal = e.byClass.reduce((a, [, v]) => a + v, 0) || 1;
  const offplan = e.priced.filter((p) => p.cls === "offplan").sort((a, b) => b.profitAtComp - a.profitAtComp);
  const sells = e.events.filter((ev) => ev.kind === "sell");
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="cp cp-report-scrim">
      <div className="cp-report-bar cp-noprint">
        <span>Statement preview</span>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="cp-btn primary sm" onClick={() => window.print()}><Ico n="print" s={13} />Print / Save PDF</button>
          <button className="cp-btn ghost sm" onClick={onClose}>Close</button>
        </div>
      </div>

      <div className="cp-report" role="document">
        <header className="cp-rep-head">
          <LogoLockup iconSize={30} fontSize={20} />
          <div className="cp-rep-meta">
            <div>Capital statement</div>
            <div className="dim">As of {s.asOf || today} · base {ccy}</div>
            <div className="dim">Private &amp; confidential</div>
          </div>
        </header>

        <div className="cp-rep-hero">
          <span className="eyebrow">Net asset value</span>
          <div className="cp-rep-nav fig">{num(e.nav)} <span className="ccy">{ccy}</span></div>
          <div className="dim">Gross marks {compact(e.gross)} · less debt {compact(e.debt)} · less obligations {compact(e.obligations)}</div>
        </div>

        <div className="cp-rep-cols">
          <RepSec title="Position">
            <Row k="Liquid (cash & deposits)" v={num(e.liquid)} />
            <Row k="Deployed capital" v={num(e.deployed)} />
            <Row k="Gross marks" v={num(e.gross)} />
            <Row k="Debt" v={e.debt ? "−" + num(e.debt) : "—"} />
            <Row k="Owed & committed" v={"−" + num(e.obligations)} />
            <Row k="Net asset value" v={num(e.nav)} strong />
          </RepSec>
          <RepSec title="Return outlook">
            <Row k="Profit at completion (book)" v={num(Math.round(bookProfit))} up />
            <Row k="Expected sale profit" v={num(Math.round(e.profitExpected))} up />
            <Row k="Return multiple" v={e.multiple.toFixed(2) + "×"} />
            <Row k="Income run-rate p.a." v={num(Math.round(e.incomeRun))} />
            <Row k="Debt service p.a." v={e.servicePa ? "−" + num(Math.round(e.servicePa)) : "—"} />
            <Row k="Loan to value" v={pct(e.ltv)} />
          </RepSec>
        </div>

        <RepSec title="Allocation by asset class" wide>
          <table className="cp-rep-tbl"><tbody>
            {e.byClass.map(([label, v]) => (
              <tr key={label}><td>{label}</td><td className="r">{pct((v / allocTotal) * 100, 0)}</td><td className="r">{num(Math.round(v))}</td></tr>
            ))}
          </tbody></table>
        </RepSec>

        {offplan.length > 0 && (
          <RepSec title="Off-plan book" wide>
            <table className="cp-rep-tbl">
              <thead><tr><th>Position</th><th>Location</th><th className="r">Capital in</th><th className="r">At completion</th><th className="r">Profit</th></tr></thead>
              <tbody>
                {offplan.map((p) => (
                  <tr key={p.id}>
                    <td>{p.name}</td><td>{p.place || "—"}</td>
                    <td className="r">{num(Math.round(p.equity))}</td>
                    <td className="r">{num(Math.round(p.completeVal))}</td>
                    <td className="r up">{num(Math.round(p.profitAtComp))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </RepSec>
        )}

        {sells.length > 0 && (
          <RepSec title="Realisations ahead" wide>
            <table className="cp-rep-tbl">
              <thead><tr><th>Month</th><th>Position</th><th className="r">Net proceeds</th><th className="r">Profit</th></tr></thead>
              <tbody>
                {sells.map((m, i) => (
                  <tr key={i}><td>{mDate(m.key)}</td><td>{CLEAN(m.label)}</td>
                    <td className="r">{num(Math.round(m.amt))}</td>
                    <td className="r">{m.profit != null ? num(Math.round(m.profit)) : "—"}</td></tr>
                ))}
              </tbody>
            </table>
          </RepSec>
        )}

        <RepSec title="Liquidity" wide>
          <Row k="Liquid now" v={num(e.liquid)} />
          <Row k={"Low point" + (e.lowKey ? " (" + mDate(e.lowKey) + ")" : "")} v={num(e.low)} />
          <Row k="12-month coverage" v={pct(e.coverage, 0)} />
          <Row k="Funding gap" v={e.runway == null ? "None in projection" : "Month " + e.runway} />
        </RepSec>

        <footer className="cp-rep-foot">
          Baidas &amp; Baidas — Capital Portal. Encrypted and held on device; figures reflect the ledger as of {s.asOf || today}, over a {Math.round(horizon / 12)}-year horizon. This statement is indicative and private.
        </footer>
      </div>
    </div>
  );
}

const RepSec = ({ title, children, wide }) => (
  <section className={"cp-rep-sec" + (wide ? " wide" : "")}>
    <div className="cp-rep-sec-t">{title}</div>
    {children}
  </section>
);
const Row = ({ k, v, strong, up }) => (
  <div className={"cp-rep-row" + (strong ? " strong" : "")}>
    <span>{k}</span><span className={"fig" + (up ? " up" : "")}>{v}</span>
  </div>
);
