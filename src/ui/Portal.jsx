import React from "react";
import { LogoLockup, Ico } from "./common.jsx";
import Overview from "./Overview.jsx";
import Positions from "./Positions.jsx";
import Cashflow from "./Cashflow.jsx";
import Liquidity from "./Liquidity.jsx";
import Admin from "./Admin.jsx";
import Sheet from "./Sheet.jsx";

export const TABS = ["Overview", "Positions", "Cashflow", "Liquidity", "Admin"];

/* The post-unlock application shell: header, tabs, view switch, footer.
   Used by App (wrapped in the vault gate) and by the seed-data preview. */
export default function Portal({
  s, e, view, setView, role, mode, setMode, setBase, lock,
  edit, err, flash, setFlash, admin,
  sheet, openSheet, closeSheet, save, saveMany, del, ratesSave,
}) {
  const addPos = () => openSheet({ t: "position" });
  const editPos = (p) => openSheet({ t: "position", item: s.positions.find((x) => x.id === p.id) || p });
  const addCommit = () => openSheet({ t: "commitment" });
  const addInflow = () => openSheet({ t: "inflow" });
  const editRates = () => openSheet({ t: "rates" });
  const editOutgoing = (o) => {
    if (o.src === "commitment" && o.raw) openSheet({ t: "commitment", item: o.raw });
    else if (o.posId) { const p = s.positions.find((x) => x.id === o.posId); if (p) openSheet({ t: "position", item: p }); }
  };
  return (
    <div className="cp">
      <header className="cp-hdr">
        <div className="cp-hdr-in">
          <div className="cp-brand">
            <LogoLockup iconSize={27} fontSize={19} />
          </div>
          <div className="cp-hdr-r">
            <div className="cp-pill" role="group" aria-label="Reporting currency">
              {["AED", "CHF", "USD"].map((c) => (
                <button key={c} className={"cp-pill-b" + (s.base === c ? " on" : "")} aria-pressed={s.base === c}
                  onClick={() => setBase(c)}>{c}</button>
              ))}
            </div>
            {role === "owner"
              ? <button className={"cp-mode" + (edit ? " live" : "")} onClick={() => setMode(edit ? "view" : "edit")}>{edit ? "Editing" : "Read only"}</button>
              : <span className="cp-mode">View only</span>}
            <button className="cp-icon-btn" onClick={lock} title="Lock now" aria-label="Lock now"><Ico n="shield" s={14} /></button>
          </div>
        </div>
        <nav className="cp-tabs" aria-label="Sections">
          {TABS.map((t) => (
            <button key={t} className={"cp-tab" + (view === t ? " on" : "")} aria-current={view === t} onClick={() => setView(t)}>{t}</button>
          ))}
        </nav>
      </header>

      {err && <div style={{ background: "var(--down)", color: "#fff", fontSize: 12.5, padding: "8px 16px", textAlign: "center" }}>{err}</div>}
      {flash && (
        <div style={{ maxWidth: 1040, margin: "12px auto 0", padding: "0 24px" }}>
          <div className="cp-nudge" style={{ marginTop: 0 }}>
            <Ico n="alert" s={13} /><span>{flash}</span>
            <button className="cp-btn ghost sm" style={{ marginLeft: "auto" }} onClick={() => setFlash("")}>Dismiss</button>
          </div>
        </div>
      )}

      <main className="cp-main">
        {view === "Overview" && <Overview e={e} s={s} setView={setView} />}
        {view === "Positions" && <Positions e={e} s={s} edit={edit} onAdd={addPos} onEdit={editPos} />}
        {view === "Cashflow" && <Cashflow e={e} s={s} edit={edit} onAddCommit={addCommit} onAddInflow={addInflow} onEdit={editOutgoing} />}
        {view === "Liquidity" && <Liquidity e={e} s={s} />}
        {view === "Admin" && <Admin s={s} role={role} {...admin} onEditRates={editRates} />}
      </main>

      <footer className="cp-foot">
        <span>Encrypted · held on this device only</span>
        <span>{e.priced.length} positions · base {s.base}</span>
      </footer>

      {sheet && <Sheet sheet={sheet} s={s} close={closeSheet} save={save} saveMany={saveMany} del={del} rates={ratesSave} />}
    </div>
  );
}
