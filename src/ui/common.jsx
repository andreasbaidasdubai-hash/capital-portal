import React from "react";

/* The B&B mark exactly as on baidas.ch (components/Site.tsx LogoIcon):
   same paths, the tighter viewBox 33.5 2.8 33 33, recolourable. */
export const Monogram = ({ size = 26, color = "#0E1B2A" }) => (
  <svg viewBox="33.5 2.8 33 33" width={size} height={size} aria-hidden="true" style={{ display: "block", flexShrink: 0 }}>
    <g fill={color}>
      <path d="M55.27,9.82c-.02-.14-.04-.27-.08-.41-.18-.74-.55-1.38-1.1-1.93l-4.09-4.09-15.82,15.82,4.09,4.09c.81.81,1.68,1.37,2.62,1.68.21.07.42.12.63.17,1.18.24,2.33.18,3.44-.2s2.09-.99,2.93-1.83c.83-.83,1.43-1.78,1.81-2.86.37-1.08.43-2.2.17-3.36-.14-.62-.38-1.22-.73-1.79.03.01.07.03.1.04.75.25,1.52.28,2.31.08.79-.2,1.52-.65,2.21-1.33.67-.67,1.12-1.4,1.36-2.18.19-.64.24-1.27.15-1.88ZM48.93,19.89c-.34.96-.9,1.83-1.66,2.59-.78.78-1.66,1.34-2.65,1.7-.99.35-2,.43-3.03.21-1.03-.21-1.97-.74-2.82-1.6l-3.46-3.46,8.7-8.7,3.24,3.24c.08.08.15.15.23.22h0c.89.89,1.44,1.84,1.65,2.85.22,1.01.15,1.99-.19,2.95ZM54.55,10.46c-.05.97-.52,1.9-1.4,2.79-.91.91-1.85,1.35-2.81,1.33-.96-.03-1.83-.43-2.6-1.2l-3.24-3.24,5.55-5.55.08-.08,3.47,3.46c.22.23.41.47.55.73.3.52.43,1.11.39,1.77Z" />
      <path d="M61.83,15.22c-.89-.89-1.87-1.49-2.93-1.77-.11-.03-.21-.06-.32-.08-1.18-.24-2.32-.18-3.44.2-1.11.38-2.09.99-2.93,1.83-.83.83-1.43,1.78-1.81,2.86-.37,1.08-.43,2.2-.18,3.36.14.62.38,1.22.73,1.79-.03-.01-.07-.03-.1-.04-.75-.25-1.52-.28-2.31-.08-.79.2-1.52.65-2.21,1.33s-1.12,1.4-1.35,2.18c-.22.73-.25,1.44-.1,2.14,0,.05.02.1.03.14.18.74.55,1.38,1.1,1.93l4.09,4.09,15.82-15.82-4.09-4.09ZM51.18,18.62c.34-.96.9-1.83,1.66-2.59.78-.78,1.66-1.34,2.65-1.7.99-.35,2-.43,3.03-.22.64.13,1.25.39,1.83.77h0c.34.23.67.51.99.82l3.47,3.47-.08.08-8.61,8.62-3.24-3.24c-.08-.08-.15-.15-.23-.22h0c-.89-.89-1.44-1.84-1.65-2.85-.22-1.01-.15-1.99.19-2.95ZM45.56,28.05c.05-.97.52-1.9,1.4-2.78.91-.91,1.85-1.35,2.81-1.33.96.03,1.83.43,2.6,1.19l3.24,3.24-5.64,5.63-3.47-3.47c-.69-.69-1-1.52-.95-2.49Z" />
      <path d="M50,3.39l-15.82,15.82-.11.11,15.93,15.93,15.93-15.93-15.93-15.93ZM55.66,28.42l-5.66,5.66-5.12-5.12-3.99-3.99-5.66-5.66,14.77-14.77.05.05,4.1,4.1,1.12,1.12,3.63,3.64,1.44,1.44h0s4.37,4.37,4.37,4.37l.05.05-9.11,9.11Z" />
    </g>
  </svg>
);

/* Full logo lockup exactly as on baidas.ch: mark + "Baidas & Baidas"
   in Poppins with the faded ampersand. No "Capital Portal" wordmark. */
export const LogoLockup = ({ iconSize = 28, fontSize = 19, color = "#0E1B2A", gap = 11 }) => (
  <span className="cp-lockup" style={{ display: "inline-flex", alignItems: "center", gap }}>
    <Monogram size={iconSize} color={color} />
    <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize, letterSpacing: "0.01em", color, whiteSpace: "nowrap" }}>
      Baidas<span style={{ fontSize: "0.66em", fontWeight: 600, opacity: 0.5, margin: "0 0.2em" }}>&amp;</span>Baidas
    </span>
  </span>
);

const ICONS = {
  plus: "M12 5v14M5 12h14",
  check: "M20 6L9 17l-5-5",
  alert: "M12 9v4M12 17h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z",
  arrow: "M5 12h14M13 6l6 6-6 6",
  x: "M18 6L6 18M6 6l12 12",
  trash: "M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14",
  wand: "M12 3v3M12 18v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M3 12h3M18 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1",
  layers: "M12 2l9 5-9 5-9-5zM3 12l9 5 9-5M3 17l9 5 9-5",
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM9 12l2 2 4-4",
  key: "M15 7a4 4 0 11-3.9 5H8v3H5v-3H2v-3h9.1A4 4 0 0115 7z",
  print: "M6 9V3h12v6M6 18H4a2 2 0 01-2-2v-4a2 2 0 012-2h16a2 2 0 012 2v4a2 2 0 01-2 2h-2M6 14h12v7H6z",
  refresh: "M23 4v6h-6M1 20v-6h6M3.5 9a9 9 0 0114.9-3.4L23 10M1 14l4.6 4.4A9 9 0 0020.5 15",
};

export const Ico = ({ n, s = 16 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={ICONS[n]} />
  </svg>
);

/* form field */
export const F = ({ l, h, children }) => (
  <label className="cp-fld"><span className="l">{l}</span>{children}{h && <span className="h">{h}</span>}</label>
);

/* segmented chip selector */
export const Chips = ({ opts, v, on }) => (
  <div className="cp-chips">
    {opts.map(([k, l]) => (
      <button key={k} type="button" className={"cp-chip" + (v === k ? " on" : "")} onClick={() => on(k)}>{l}</button>
    ))}
  </div>
);
