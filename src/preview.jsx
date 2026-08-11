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
  const e = computeEngine(s, ZERO, 60);
  const noop = () => setFlash("Preview mode — editing and vault actions are disabled here.");
  return (
    <Portal
      s={s} e={e} view={view} setView={setView} role="owner" mode={mode} setMode={setMode}
      setBase={(c) => setS((x) => ({ ...x, base: c }))} lock={noop} edit={mode === "edit"}
      onAdd={noop} onEdit={noop} err="" flash={flash} setFlash={setFlash}
      admin={{ hasViewer: false, setSlot: noop, lock: noop, onBackup: noop, onRestore: noop, onRates2: noop, rateMsg: "", onAuto: noop, onWipe: noop, onSeed: noop }}
    />
  );
}

createRoot(document.getElementById("root")).render(<React.StrictMode><Preview /></React.StrictMode>);
