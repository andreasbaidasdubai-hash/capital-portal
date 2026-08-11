import React, { useState } from "react";
import { Ico, F } from "./common.jsx";
import { num } from "../engine/format.js";

export default function Admin({ s, role, hasViewer, setSlot, lock, onBackup, onRestore, onRates2, rateMsg, onAuto, onWipe, onSeed, onEditRates }) {
  const backupAt = s.backupAt;
  const staleBackup = !backupAt || (Date.now() - Date.parse(backupAt)) > 7 * 864e5;
  const [pane, setPane] = useState(null);
  const [a, setA] = useState(""); const [b, setB] = useState(""); const [msg, setMsg] = useState("");
  const [wipeArmed, setWipeArmed] = useState(false);
  const reset = () => { setA(""); setB(""); setPane(null); };
  const apply = async (which) => {
    if (a.length < 10 || a !== b) return;
    await setSlot(which, a); setMsg(which === "owner" ? "Your passphrase has been changed." : "View-only passphrase saved.");
    reset();
  };
  const empty = !s.positions.length && !s.commitments.length;

  return (
    <>
      <div className="cp-section-h" style={{ marginTop: 4 }}><h2>Admin</h2></div>

      <div className="cp-cols">
        {/* Access */}
        <section className="cp-panel">
          <div className="cp-section-h" style={{ marginBottom: 12 }}>
            <span className="eyebrow">Encryption &amp; access</span>
            <button className="cp-btn ghost sm" onClick={lock}><Ico n="shield" s={13} />Lock now</button>
          </div>
          <table className="cp-mini"><tbody>
            <Row k="Encryption" v="AES-256-GCM" sub="PBKDF2-SHA256, 210,000 rounds" />
            <Row k="Stored" v={typeof window !== "undefined" && window.__standalone ? "On this device" : "In your account"} />
            <Row k="Signed in as" v={role === "owner" ? "Owner" : "View only"} />
            <Row k="View-only passphrase" v={hasViewer ? "Set" : "Not set"} />
            <Row k="Automatic lock" v="15 minutes idle" />
            <Row k="Last backup" v={backupAt ? backupAt.slice(0, 10) : "never"} />
          </tbody></table>

          {staleBackup && (
            <div className="cp-nudge">
              <Ico n="alert" s={13} />
              <span>{backupAt ? "Your last backup is over a week old." : "You have never backed this up."} Clearing browser data would erase the vault permanently.</span>
            </div>
          )}

          {role === "owner" && (<>
            {msg && <div className="cp-ok" style={{ marginTop: 14 }}>{msg}</div>}
            {!pane && (
              <div className="cp-rowb">
                <button className="cp-btn ghost sm" onClick={() => { setPane("owner"); setMsg(""); }}><Ico n="key" s={13} />Change my passphrase</button>
                <button className="cp-btn ghost sm" onClick={() => { setPane("viewer"); setMsg(""); }}><Ico n="key" s={13} />{hasViewer ? "Change" : "Add"} view-only</button>
                {hasViewer && <button className="cp-btn danger sm" onClick={async () => { await setSlot("viewer", null); setMsg("View-only access removed."); }}>Remove view-only</button>}
              </div>
            )}
            {pane && (
              <div className="cp-genbox">
                <F l={pane === "owner" ? "New passphrase" : "View-only passphrase"}>
                  <input type="password" value={a} onChange={(e) => setA(e.target.value)} placeholder="at least 10 characters" autoComplete="new-password" /></F>
                <F l="Confirm"><input type="password" value={b} onChange={(e) => setB(e.target.value)} autoComplete="new-password" /></F>
                {a && a.length < 10 && <div className="cp-warn">Too short.</div>}
                {b && a !== b && <div className="cp-warn">The two entries do not match.</div>}
                <div className="cp-rowb" style={{ marginTop: 4 }}>
                  <button className="cp-btn primary sm" disabled={a.length < 10 || a !== b} onClick={() => apply(pane)}>Save</button>
                  <button className="cp-btn ghost sm" onClick={reset}>Cancel</button>
                </div>
              </div>
            )}
          </>)}
        </section>

        {/* Backup / data */}
        <section className="cp-panel">
          <div className="cp-section-h" style={{ marginBottom: 12 }}><span className="eyebrow">Backup &amp; data</span></div>
          <p className="cp-fine" style={{ marginTop: 0 }}>
            The vault lives in this browser, tied to this web address. Updating the portal leaves it untouched. Moving to a
            different address — such as your own subdomain — starts an empty vault there: download a backup first and restore it on the new address.
          </p>
          <div className="cp-rowb">
            <button className="cp-btn ghost sm" onClick={onBackup}><Ico n="layers" s={13} />Download encrypted backup</button>
            <label className="cp-btn ghost sm cp-filebtn">
              <Ico n="layers" s={13} />Restore from backup
              <input type="file" accept=".json,application/json" onChange={onRestore} />
            </label>
          </div>
          {empty && onSeed && (
            <div className="cp-genbox">
              <div style={{ fontSize: 13.5, color: "var(--ink)", fontWeight: 500, marginBottom: 4 }}>Empty vault</div>
              <p className="cp-fine" style={{ marginTop: 0 }}>Load the sample fourteen-position book to explore, or restore your own backup above.</p>
              <button className="cp-btn sm" onClick={onSeed}><Ico n="layers" s={13} />Load sample portfolio</button>
            </div>
          )}
          <p className="cp-fine">The backup file is the same ciphertext held here — useless without a passphrase, so safe to keep in cloud storage. Restoring replaces what is on this device.</p>
        </section>
      </div>

      {/* Rates */}
      <section className="cp-panel" style={{ marginTop: 24 }}>
        <div className="cp-section-h" style={{ marginBottom: 12 }}>
          <span className="eyebrow">Exchange rates — value of one unit in {s.base}</span>
          {role === "owner" && (
            <div style={{ display: "flex", gap: 8 }}>
              {onEditRates && <button className="cp-btn ghost sm" onClick={onEditRates}><Ico n="key" s={13} />Enter manually</button>}
              <button className="cp-btn ghost sm" onClick={onRates2}><Ico n="refresh" s={13} />Refresh now</button>
            </div>
          )}
        </div>
        <table className="cp-mini"><tbody>
          {["USD", "AED", "EUR", "CHF"].map((c) => (
            <Row key={c} k={c} v={s.fx?.[c] != null ? Number(s.fx[c]).toFixed(5) + " CHF" : "—"} />
          ))}
          <Row k="Bitcoin" v={s.btcUSD ? "$" + num(s.btcUSD) : "—"} />
          <Row k="Rates updated" v={s.ratesAt ? s.ratesAt.slice(0, 10) + (s.ratesSrc ? " · " + s.ratesSrc : "") : "manual"} />
        </tbody></table>
        {rateMsg && <div className="cp-ok" style={{ marginTop: 12 }}>{rateMsg}</div>}
        {role === "owner" && (
          <button className="cp-btn ghost sm" style={{ marginTop: 14 }} onClick={onAuto}>
            <Ico n="check" s={13} />{s.autoRates === false ? "Auto-refresh is off" : "Auto-refresh twice daily is on"}
          </button>
        )}
      </section>

      {/* Danger */}
      {role === "owner" && !empty && (
        <section className="cp-panel" style={{ marginTop: 24, borderColor: "rgba(180,82,63,0.3)" }}>
          <div className="cp-section-h" style={{ marginBottom: 8 }}><span className="eyebrow" style={{ color: "var(--down)" }}>Danger zone</span></div>
          <p className="cp-fine" style={{ marginTop: 0 }}>Emptying the ledger removes every position, commitment and inflow from the vault. It cannot be undone unless you have a backup.</p>
          {!wipeArmed
            ? <button className="cp-btn danger sm" onClick={() => setWipeArmed(true)}><Ico n="trash" s={13} />Empty the ledger</button>
            : <div className="cp-rowb">
                <button className="cp-btn danger sm" onClick={() => { onWipe(); setWipeArmed(false); }}>Yes, empty everything</button>
                <button className="cp-btn ghost sm" onClick={() => setWipeArmed(false)}>Cancel</button>
              </div>}
        </section>
      )}
    </>
  );
}

const Row = ({ k, v, sub }) => (
  <tr><td className="k">{k}{sub && <span className="sub">{sub}</span>}</td><td className="v">{v}</td></tr>
);
