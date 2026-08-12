import React, { useState } from "react";
import { LogoLockup, Ico, F } from "./common.jsx";

export function Setup({ onGo, legacy, onRestore }) {
  const [a, setA] = useState(""); const [b, setB] = useState("");
  const [useViewer, setUseViewer] = useState(false); const [vp, setVp] = useState("");
  const [imp, setImp] = useState(!!legacy);
  const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  const weak = a.length > 0 && a.length < 10;
  const ok = a.length >= 10 && a === b && (!useViewer || (vp.length >= 10 && vp !== a));

  const go = async () => {
    setBusy(true); setErr("");
    try { await onGo(a, useViewer ? vp : null, imp); }
    catch { setErr("Could not create the vault. Check your connection and try again."); setBusy(false); }
  };

  return (
    <div className="cp">
      <div className="cp-gate-wrap"><div className="cp-gate">
        <div className="brand"><LogoLockup iconSize={30} fontSize={20} /></div>
        <h1>Set a passphrase.</h1>
        <p className="gp">Your ledger is encrypted with it before anything is stored. Nobody can read the vault without it — including me, and including anyone who gets at the stored file.</p>

        <F l="Passphrase"><input type="password" value={a} onChange={(e) => setA(e.target.value)} placeholder="at least 10 characters" autoComplete="new-password" /></F>
        {weak && <div className="cp-warn">Too short. Use a phrase of several words rather than one word.</div>}
        <F l="Confirm passphrase"><input type="password" value={b} onChange={(e) => setB(e.target.value)} autoComplete="new-password" /></F>
        {b && a !== b && <div className="cp-warn">The two entries do not match.</div>}

        <F l="Second passphrase for viewing only">
          <button className={"cp-chip-wide" + (useViewer ? " on" : "")} onClick={() => setUseViewer(!useViewer)}>
            {useViewer ? "Yes — a read-only passphrase" : "No, just mine"}
          </button>
        </F>
        {useViewer && (<>
          <F l="View-only passphrase" h="Give this one to someone who should see the portal with every edit control removed.">
            <input type="password" value={vp} onChange={(e) => setVp(e.target.value)} placeholder="at least 10 characters" autoComplete="new-password" /></F>
          {vp && vp === a && <div className="cp-warn">It must be different from your own passphrase.</div>}
        </>)}

        {legacy && (
          <F l="Existing data">
            <button className={"cp-chip-wide" + (imp ? " on" : "")} onClick={() => setImp(!imp)}>
              {imp ? "Import what I entered before" : "Start with an empty ledger"}
            </button>
          </F>
        )}

        <div className="cp-danger">
          <Ico n="alert" s={15} />
          <span>There is no reset and no recovery. If the passphrase is lost the ledger cannot be opened by anyone. Store it in a password manager now.</span>
        </div>

        {err && <div className="cp-warn">{err}</div>}
        <button className="cp-btn primary full" disabled={!ok || busy} onClick={go}>
          {busy ? "Encrypting…" : "Create encrypted vault"}
        </button>

        {onRestore && (
          <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid var(--line)" }}>
            <span className="l" style={{ display: "block", fontSize: 10.5, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--soft)", marginBottom: 8 }}>Already have a vault?</span>
            <p style={{ margin: "0 0 12px", fontSize: 13, lineHeight: 1.55, color: "var(--body)" }}>
              Your ledger is stored encrypted on each device on its own — it does not sync. If you've used the portal before, or you're on a new device, restore your backup here to bring it onto this one, then unlock with your usual passphrase.
            </p>
            <label className="cp-btn ghost full cp-filebtn">
              <Ico n="layers" s={14} />Restore from a backup file
              <input type="file" accept=".json,application/json" onChange={onRestore} />
            </label>
          </div>
        )}
      </div></div>
    </div>
  );
}

export function Unlock({ onGo, hasViewer }) {
  const [p, setP] = useState(""); const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  const go = async () => {
    if (!p) return;
    setBusy(true); setErr("");
    try { await onGo(p); }
    catch { setErr("That passphrase does not open this vault."); setBusy(false); setP(""); }
  };
  return (
    <div className="cp">
      <div className="cp-gate-wrap"><div className="cp-gate narrow">
        <div className="brand"><LogoLockup iconSize={30} fontSize={20} /></div>
        <h1>Locked.</h1>
        <p className="gp">Enter your passphrase to decrypt the ledger.{hasViewer && " The view-only passphrase works here too."}</p>
        <F l="Passphrase">
          <input type="password" value={p} autoFocus autoComplete="current-password"
            onChange={(e) => setP(e.target.value)} onKeyDown={(e) => e.key === "Enter" && go()} />
        </F>
        {err && <div className="cp-warn">{err}</div>}
        <button className="cp-btn primary full" disabled={busy || !p} onClick={go}>{busy ? "Decrypting…" : "Unlock"}</button>
      </div></div>
    </div>
  );
}
