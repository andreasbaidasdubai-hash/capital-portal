import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import "./ui/fonts.js";
import "./ui/theme.css";
import { computeEngine } from "./engine/engine.js";
import { buildSeedState } from "./engine/seed.js";
import Portal from "./ui/Portal.jsx";

/* Design/functionality preview: renders the full post-unlock Portal against
   the real seeded book, bypassing the vault so every tab can be reviewed
   without a passphrase. Not shipped — index.html / App.jsx is the real app. */
const ZERO = { delay: 0, haircut: 0, rate: 0, growth: 0 };

function Preview() {
  const [s, setS] = useState(() => buildSeedState());
  const [view, setView] = useState("Overview");
  const [mode, setMode] = useState("edit");
  const [flash, setFlash] = useState("");
  const [sheet, setSheet] = useState(null);
  const [stress, setStress] = useState(ZERO);
  const [horizon, setHorizon] = useState(60);
  const [caseMode, setCaseMode] = useState("base");
  const e = computeEngine(s, stress, horizon, caseMode);
  const noop = () => setFlash("Preview mode — vault actions are disabled here.");

  const upsert = (b, item) => setS((c) => {
    const l = c[b] || [], i = l.findIndex((x) => x.id === item.id);
    return { ...c, [b]: i >= 0 ? l.map((x) => (x.id === item.id ? item : x)) : [...l, item] };
  });
  const drop = (b, id) => setS((c) => ({ ...c, [b]: (c[b] || []).filter((x) => x.id !== id) }));
  const saveMany = (b, arr) => setS((c) => ({ ...c, [b]: [...(c[b] || []), ...arr] }));

  return (
    <Portal
      s={s} e={e} view={view} setView={setView} role="owner" mode={mode} setMode={setMode}
      setBase={(c) => setS((x) => ({ ...x, base: c }))} lock={noop} edit={mode === "edit"}
      stress={stress} setStress={setStress} horizon={horizon} setHorizon={setHorizon}
      caseMode={caseMode} setCaseMode={setCaseMode}
      err="" flash={flash} setFlash={setFlash}
      sheet={sheet} openSheet={setSheet} closeSheet={() => setSheet(null)}
      save={(b, i) => { upsert(b, i); setSheet(null); }}
      saveMany={(b, arr) => { saveMany(b, arr); setSheet(null); }}
      del={(b, id) => { drop(b, id); setSheet(null); }}
      ratesSave={(p) => { setS((c) => ({ ...c, ...p })); setSheet(null); }}
      admin={{ hasViewer: false, setSlot: noop, lock: noop, onBackup: noop, onRestore: noop, onRates2: noop, rateMsg: "", onAuto: noop, onWipe: noop, onSeed: () => setS(buildSeedState()) }}
    />
  );
}

createRoot(document.getElementById("root")).render(<React.StrictMode><Preview /></React.StrictMode>);
