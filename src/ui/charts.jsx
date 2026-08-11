import React, { useState, useRef, useEffect, useMemo } from "react";
import { num, MON } from "../engine/format.js";

const prefersReduced = () =>
  typeof window !== "undefined" && window.matchMedia &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* Animated number — counts to its value once, on mount / when value changes. */
export function CountUp({ value, dp = 0, className = "", prefix = "", suffix = "" }) {
  const [n, setN] = useState(() => (prefersReduced() ? value : 0));
  useEffect(() => {
    if (prefersReduced()) { setN(value); return; }
    const dur = 900, t0 = performance.now();
    let raf = 0, done = false;
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / dur);
      setN(value * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick); else done = true;
    };
    raf = requestAnimationFrame(tick);
    // Safety net: if the frame loop is suspended (hidden tab / non-compositing
    // context), rAF never fires — force the final value so it never hangs at 0.
    const fallback = setTimeout(() => { if (!done) setN(value); }, dur + 120);
    return () => { cancelAnimationFrame(raf); clearTimeout(fallback); };
  }, [value]);
  return <span className={className}>{prefix}{num(n, dp)}{suffix}</span>;
}

const mLabel = (key) => {
  const [y, m] = key.split("-");
  return `${MON[Number(m) - 1]} ${y.slice(2)}`;
};

/* Net-asset-value projection — step area + line, milestone markers, hover crosshair. */
export function NavChart({ ladder, events = [], field = "navT", height = 260 }) {
  const [hover, setHover] = useState(null);
  const [drawn, setDrawn] = useState(prefersReduced());
  const wrapRef = useRef(null);
  const pathRef = useRef(null);

  const W = 1000, H = height, padL = 8, padR = 8, padB = 26, padT = 18;
  const data = ladder;
  const vals = data.map((d) => d[field]);
  const min = Math.min(...vals), max = Math.max(...vals);
  const lo = min - (max - min) * 0.12, hi = max + (max - min) * 0.10;
  const x = (i) => padL + (i / (data.length - 1)) * (W - padL - padR);
  const y = (v) => padT + (1 - (v - lo) / (hi - lo)) * (H - padT - padB);

  const linePath = useMemo(() => data.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(d[field]).toFixed(1)}`).join(" "), [data]);
  const areaPath = `${linePath} L${x(data.length - 1).toFixed(1)} ${(H - padB).toFixed(1)} L${x(0).toFixed(1)} ${(H - padB).toFixed(1)} Z`;

  useEffect(() => {
    if (prefersReduced()) { setDrawn(true); return; }
    const id = requestAnimationFrame(() => setDrawn(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // year ticks
  const ticks = [];
  data.forEach((d, i) => { const m = d.key.slice(5); if (m === "01" || i === 0) ticks.push({ i, label: d.key.slice(0, 4) }); });

  // milestones — map events to month index
  const idx = Object.fromEntries(data.map((d, i) => [d.key, i]));
  const miles = events.filter((e) => idx[e.key] != null).map((e) => ({ ...e, i: idx[e.key] }));

  const onMove = (ev) => {
    const rect = wrapRef.current.getBoundingClientRect();
    const px = ((ev.clientX - rect.left) / rect.width) * W;
    let best = 0, bd = Infinity;
    data.forEach((d, i) => { const dd = Math.abs(x(i) - px); if (dd < bd) { bd = dd; best = i; } });
    setHover(best);
  };

  const len = pathRef.current ? pathRef.current.getTotalLength() : 1400;

  return (
    <div className="cp-chart-wrap" ref={wrapRef} onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
      <svg className="cp-chart" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ height }}>
        <defs>
          <linearGradient id="navFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0E1B2A" stopOpacity="0.10" />
            <stop offset="100%" stopColor="#0E1B2A" stopOpacity="0.0" />
          </linearGradient>
        </defs>
        {/* gridlines at each tick */}
        {ticks.map((t) => <line key={t.i} className="grid-line" x1={x(t.i)} y1={padT} x2={x(t.i)} y2={H - padB} />)}
        <line className="axis-line" x1={padL} y1={H - padB} x2={W - padR} y2={H - padB} />
        <path className="nav-area" d={areaPath} style={{ opacity: drawn ? 1 : 0, transition: "opacity 0.6s 0.3s ease" }} />
        <path ref={pathRef} className="nav-line" d={linePath}
          style={{ strokeDasharray: len, strokeDashoffset: drawn ? 0 : len, transition: "stroke-dashoffset 1.1s ease" }} />
        {/* milestone markers */}
        {miles.map((m, k) => (
          <g key={k} style={{ opacity: drawn ? 1 : 0, transition: `opacity 0.4s ${0.8 + k * 0.03}s ease` }}>
            <circle className={"mdot " + (m.kind === "sell" ? "sell" : "")} cx={x(m.i)} cy={y(data[m.i][field])} r="3.5" />
          </g>
        ))}
        {/* hover crosshair */}
        {hover != null && <line className="cp-cursor" x1={x(hover)} y1={padT} x2={x(hover)} y2={H - padB} />}
        {hover != null && <circle cx={x(hover)} cy={y(data[hover][field])} r="4" fill="#0E1B2A" />}
        {ticks.map((t) => <text key={"t" + t.i} className="axtick" x={x(t.i)} y={H - 8} textAnchor={t.i === 0 ? "start" : "middle"}>{t.label}</text>)}
      </svg>
      {hover != null && (
        <div className="cp-tip show" style={{ left: `${(x(hover) / W) * 100}%`, top: `${(y(data[hover][field]) / H) * 100}%` }}>
          <div className="lbl">{mLabel(data[hover].key)}</div>
          <div className="k">{num(data[hover][field])}</div>
        </div>
      )}
    </div>
  );
}

/* Allocation donut — direct-labelled legend carries identity, colour is secondary. */
export function Donut({ segments, size = 160 }) {
  const [hover, setHover] = useState(null);
  const total = segments.reduce((a, s) => a + s.value, 0);
  const R = 70, C = 2 * Math.PI * R;
  let acc = 0;
  const arcs = segments.map((s, i) => {
    const frac = s.value / total;
    const dash = frac * C;
    const seg = { ...s, i, frac, dash, offset: -acc * C };
    acc += frac;
    return seg;
  });
  return (
    <svg className="cp-donut" width={size} height={size} viewBox="0 0 180 180">
      {arcs.map((s) => (
        <circle key={s.i} cx="90" cy="90" r={R} stroke={s.color}
          strokeWidth={hover === s.i ? 22 : 16}
          strokeDasharray={`${s.dash} ${C - s.dash}`} strokeDashoffset={s.offset}
          onMouseEnter={() => setHover(s.i)} onMouseLeave={() => setHover(null)}
          style={{ transition: "stroke-width 0.15s" }}>
          <animate attributeName="stroke-dasharray" from={`0 ${C}`} to={`${s.dash} ${C - s.dash}`} dur="0.7s" fill="freeze" />
        </circle>
      ))}
    </svg>
  );
}
