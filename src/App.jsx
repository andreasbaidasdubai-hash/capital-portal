import React, { useState, useEffect, useCallback, useRef } from "react";
import "./ui/theme.css";
import { BLANK } from "./engine/constants.js";
import { useEngine } from "./engine/engine.js";
import { seed } from "./engine/seed.js";
import { fetchRates } from "./engine/rates.js";
import {
  subtle, genKey, wrapDK, unwrapDK, sealState, openState,
  readVault, writeVault, downloadVault, KEY,
} from "./engine/vault.js";
import { Setup, Unlock } from "./ui/Gate.jsx";
import Portal from "./ui/Portal.jsx";

const ZERO = { delay: 0, haircut: 0, rate: 0, growth: 0 };

export default function App() {
  const [s, setS] = useState(BLANK);
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState("");
  const [flash, setFlash] = useState("");
  const [view, setView] = useState("Overview");
  const [mode, setMode] = useState("edit");
  const [sheet, setSheet] = useState(null);

  const [vault, setVault] = useState(null);
  const [gate, setGate] = useState("boot"); // boot | setup | unlock | open
  const [role, setRole] = useState("owner");
  const [legacy, setLegacy] = useState(null);
  const [rateMsg, setRateMsg] = useState("");
  const dk = useRef(null);
  const vaultRef = useRef(null);
  useEffect(() => { vaultRef.current = vault; }, [vault]);

  useEffect(() => {
    (async () => {
      const v = await readVault();
      if (v) { setVault(v); setGate("unlock"); }
      else {
        try { const old = await window.storage.get(KEY); if (old && old.value) setLegacy(JSON.parse(old.value)); } catch { }
        setGate("setup");
      }
      setReady(true);
    })();
  }, []);

  const save = useCallback(async (n) => {
    setS(n);
    if (!dk.current) return;
    try {
      const blob = await sealState(dk.current, n);
      const r = await writeVault({ ...vaultRef.current, ...blob });
      setErr(r ? "" : "Changes did not save. Check your connection, then re-enter the last edit.");
    } catch { setErr("Changes did not save. Check your connection, then re-enter the last edit."); }
  }, []);
  const ref = useRef(save); useEffect(() => { ref.current = save; }, [save]);
  const up = useCallback((fn) => setS((c) => { const n = fn(c); ref.current(n); return n; }), []);

  const lock = useCallback(() => {
    dk.current = null; setS(BLANK); setSheet(null); setGate("unlock"); setView("Overview"); setMode("edit");
  }, []);

  useEffect(() => {
    if (gate !== "open") return;
    let t = setTimeout(lock, 15 * 60 * 1000);
    const bump = () => { clearTimeout(t); t = setTimeout(lock, 15 * 60 * 1000); };
    const evts = ["pointerdown", "keydown", "wheel"];
    evts.forEach((n) => window.addEventListener(n, bump, { passive: true }));
    return () => { clearTimeout(t); evts.forEach((n) => window.removeEventListener(n, bump)); };
  }, [gate, lock]);

  const doSetup = async (owner, viewer, importLegacy) => {
    const key = await genKey();
    const init = importLegacy && legacy ? { ...BLANK, ...legacy, fx: { ...BLANK.fx, ...(legacy.fx || {}) } } : BLANK;
    const slots = { owner: await wrapDK(key, owner) };
    if (viewer) slots.viewer = await wrapDK(key, viewer);
    const blob = await sealState(key, init);
    const v = { v: 1, slots, ...blob };
    const ok = await writeVault(v);
    if (!ok) throw new Error("save failed");
    dk.current = key; setVault(v); vaultRef.current = v; setS(init); setRole("owner"); setGate("open");
  };

  const doUnlock = async (pass) => {
    let key = null, who = null;
    try { key = await unwrapDK(vault.slots.owner, pass); who = "owner"; } catch { }
    if (!key && vault.slots.viewer) {
      try { key = await unwrapDK(vault.slots.viewer, pass); who = "viewer"; } catch { }
    }
    if (!key) throw new Error("bad passphrase");
    const state = await openState(key, vault);
    dk.current = key; setS({ ...BLANK, ...state, fx: { ...BLANK.fx, ...(state.fx || {}) } });
    setRole(who); setMode(who === "viewer" ? "view" : "edit"); setGate("open");
  };

  const onBackup = () => { if (vaultRef.current) { downloadVault(vaultRef.current); up((c) => ({ ...c, backupAt: new Date().toISOString() })); } };
  const onRestore = async (ev) => {
    const file = ev.target.files && ev.target.files[0];
    ev.target.value = "";
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      if (!parsed || !parsed.slots || !parsed.ct) throw new Error("shape");
      await writeVault(parsed);
      setVault(parsed); vaultRef.current = parsed;
      dk.current = null; setS(BLANK); setGate("unlock");
    } catch { setErr("That file is not a Capital Portal backup."); }
  };

  const setSlot = async (which, pass) => {
    const next = { ...vault, slots: { ...vault.slots } };
    if (pass === null) delete next.slots[which];
    else next.slots[which] = await wrapDK(dk.current, pass);
    await writeVault(next); setVault(next); vaultRef.current = next;
  };

  const refreshRates = useCallback(async (manual) => {
    if (manual) setRateMsg("Fetching…");
    try {
      const r = await fetchRates();
      up((c) => ({ ...c, fx: { ...c.fx, ...r.fx }, btcUSD: r.btcUSD || c.btcUSD, asOf: r.date, ratesAt: new Date().toISOString(), ratesSrc: r.src }));
      setRateMsg("Updated from " + r.src + ".");
    } catch {
      setRateMsg(manual ? "Could not reach the rate service. Your entered rates are unchanged." : "");
    }
  }, [up]);

  useEffect(() => {
    if (gate !== "open" || role !== "owner" || s.autoRates === false) return;
    const last = s.ratesAt ? Date.parse(s.ratesAt) : 0;
    if (Date.now() - last < 12 * 3600 * 1000) return;
    const t = setTimeout(() => refreshRates(false), 1200);
    return () => clearTimeout(t);
  }, [gate, role, s.autoRates, s.ratesAt, refreshRates]);

  /* One-time migration (HANDOVER known item): positions saved before v36 may
     carry a stale 2% acquisition/exit fee on cash, trading or crypto, where it
     is meaningless. Clear it once, then remember we did. Real-estate keeps its
     exit cost — agent commission on a property sale is real. */
  useEffect(() => {
    if (gate !== "open" || role !== "owner" || s.feesMigrated) return;
    up((c) => ({
      ...c,
      feesMigrated: true,
      positions: (c.positions || []).map((p) =>
        (p.cls === "cash" || p.cls === "trading" || p.cls === "crypto")
          ? { ...p, exitPct: 0, feePct: 0 }
          : p),
    }));
  }, [gate, role, s.feesMigrated, up]);

  const e = useEngine(s, ZERO, 60);
  const edit = mode === "edit" && role === "owner";

  const upsert = (b, item) => up((c) => {
    const l = c[b] || [], i = l.findIndex((x) => x.id === item.id);
    return { ...c, [b]: i >= 0 ? l.map((x) => (x.id === item.id ? item : x)) : [...l, item] };
  });
  const drop = (b, id) => up((c) => ({ ...c, [b]: (c[b] || []).filter((x) => x.id !== id) }));
  const saveMany = (b, arr) => up((c) => ({ ...c, [b]: [...(c[b] || []), ...arr] }));

  if (!ready) return <div className="cp"><div className="cp-gate-wrap"><div className="eyebrow">Opening vault…</div></div></div>;
  if (!subtle) return (
    <div className="cp"><div className="cp-gate-wrap"><div className="cp-gate">
      <h1>Encryption unavailable</h1>
      <p className="gp">This browser is not exposing the Web Crypto API, so the ledger cannot be encrypted. Open the app in Chrome, Safari or Firefox over https and it will work.</p>
    </div></div></div>
  );
  if (gate === "setup") return <Setup onGo={doSetup} legacy={legacy} />;
  if (gate === "unlock") return <Unlock onGo={doUnlock} hasViewer={!!vault?.slots?.viewer} />;

  return (
    <Portal
      s={s} e={e} view={view} setView={setView} role={role} mode={mode} setMode={setMode}
      setBase={(c) => up((x) => ({ ...x, base: c }))} lock={lock} edit={edit}
      err={err} flash={flash} setFlash={setFlash}
      sheet={sheet} openSheet={setSheet} closeSheet={() => setSheet(null)}
      save={(b, i) => { upsert(b, i); setSheet(null); }}
      saveMany={(b, arr) => { saveMany(b, arr); setSheet(null); }}
      del={(b, id) => { drop(b, id); setSheet(null); }}
      ratesSave={(p) => { up((c) => ({ ...c, ...p })); setSheet(null); }}
      admin={{
        hasViewer: !!vault?.slots?.viewer, setSlot, lock,
        onBackup, onRestore, onRates2: () => refreshRates(true), rateMsg,
        onAuto: () => up((c) => ({ ...c, autoRates: c.autoRates === false })),
        onWipe: () => up(() => ({ ...BLANK, base: s.base, fx: s.fx, btcUSD: s.btcUSD })),
        onSeed: () => seed(up),
      }}
    />
  );
}
