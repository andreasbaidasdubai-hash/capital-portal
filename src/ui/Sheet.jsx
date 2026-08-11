import React, { useState } from "react";
import { Ico, F, Chips } from "./common.jsx";
import { CLS, CLS_ORDER, CCY, CCY_DIGITAL, MARKETS } from "../engine/constants.js";
import { uid, today, addMonths, sortTranches, num, sgn, pct, grow } from "../engine/format.js";

const Mrow = ({ l, v, tone, strong }) => (
  <tr><td className="k">{l}</td><td className="v" style={strong ? { fontWeight: 700 } : null}><span className={tone || ""}>{v}</span></td></tr>
);

const SeriesBlock = ({ f, set, onLabel, offLabel }) => (<>
  <F l="Structure">
    <button type="button" className={"cp-chip-wide" + (f.series ? " on" : "")} onClick={() => set("series", !f.series)}>{f.series ? onLabel : offLabel}</button>
  </F>
  {f.series && (<>
    <div className="cp-two">
      <F l="Interval (months)"><input type="number" min="1" value={f.every} onChange={(e) => set("every", e.target.value)} /></F>
      <F l="How many"><input type="number" min="1" value={f.count} onChange={(e) => set("count", e.target.value)} /></F>
    </div>
    <p className="cp-fine">Each entry is created separately, so one can be delayed or settled without touching the rest.</p>
  </>)}
</>);

export default function Sheet({ sheet, s, close, save, saveMany, del, rates }) {
  const t = sheet.t;
  const [f, setF] = useState(() => {
    if (sheet.item) return { ...sheet.item, tranches: sheet.item.tranches || [] };
    if (t === "position") return { id: uid(), cls: "property", unitPrice: "", livePrice: true, liquidOk: true, downAmt: "", downPct: 10, downStatus: "paid", downDate: today(), name: "", place: "", entity: "", counterparty: "", ccy: "AED", price: "", feePct: 2, feeStatus: "paid", paid: "", value: "", debt: "", rate: "", amortPct: "", payFreq: 3, mortPlanned: false, mortDate: "", mortLtv: 60, mortAmt: "", mortRate: "", mortAmortPct: "", mortFeePct: 1, rentAmt: "", rentFreq: 1, rentStart: "", occ: 95, growth: 3, completeDate: "", completeValue: "", sellPlanned: false, sellDate: "", sellGross: "", sellProb: 75, exitPct: 2, units: "", note: "", tranches: [] };
    if (t === "commitment") return { id: uid(), label: "", counterparty: "", ccy: "AED", amount: "", due: today(), status: "scheduled", series: false, every: 3, count: 4 };
    if (t === "inflow") return { id: uid(), label: "", ccy: "CHF", amount: "", due: today(), probability: 75, status: "expected", kind: "capital", series: false, every: 1, count: 12 };
    return { ...s.fx, btcUSD: s.btcUSD };
  });
  const [gen, setGen] = useState({ open: false, count: 6, every: 3, first: today(), mode: "pct", pct: 10, amount: "" });
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const isReal = !!CLS[f.cls]?.real;
  const canPlan = !!CLS[f.cls]?.plan;
  const tr = sortTranches(f.tranches);
  const renumber = () => set("tranches", sortTranches(f.tranches).map((x, i, arr) => ({ ...x, label: `Instalment ${i + 1} of ${arr.length}` })));
  const trPaid = tr.filter((x) => x.status === "paid").reduce((a, x) => a + (Number(x.amount) || 0), 0);
  const trTotal = tr.reduce((a, x) => a + (Number(x.amount) || 0), 0);
  const feeAmt = (Number(f.price) || 0) * ((Number(f.feePct) || 0) / 100);
  const rentPaLive = (Number(f.rentAmt) || 0) * ((Number(f.occ ?? 100)) / 100) * (12 / Math.max(1, Number(f.rentFreq) || 1));
  const servicePaLive = (Number(f.debt) || 0) * (((Number(f.rate) || 0) + (Number(f.amortPct) || 0)) / 100);
  const netPa = rentPaLive - servicePaLive;
  const sellGrossLive = Number(f.sellGross) || Number(f.completeValue) || Number(f.value) || 0;
  const sellNetLive = sellGrossLive * (1 - (Number(f.exitPct) || 0) / 100) - (Number(f.debt) || 0);
  const downAmtLive = Number(f.downAmt) || 0;
  const downPaidLive = f.downStatus === "due" ? 0 : downAmtLive;
  const live = f.cls === "crypto" && f.livePrice !== false;
  const cryptoMv = (Number(f.units) || 0) * (live ? (Number(s.btcUSD) || 0) : (Number(f.unitPrice) || 0));
  const owedLive = !CLS[f.cls]?.real ? 0
    : ((tr.length || downAmtLive)
        ? (trTotal - trPaid) + (f.downStatus === "due" ? downAmtLive : 0)
        : (f.cls === "offplan" ? Math.max((Number(f.price) || 0) - (Number(f.paid) || 0), 0) : 0))
      + (f.feeStatus === "due" ? feeAmt : 0);
  const equityLive = (Number(f.value) || 0) - (Number(f.debt) || 0) - owedLive;
  const investedLive = (tr.length ? trPaid : Number(f.cls === "offplan" ? f.paid : f.price) || 0) + (Number(f.price) || 0) * ((Number(f.feePct) || 0) / 100);
  const setTr = (id, k, v) => set("tranches", sortTranches(tr.map((x) => (x.id === id ? { ...x, [k]: v } : x))));
  const addTr = () => set("tranches", sortTranches([...tr, { id: uid(), label: `Instalment ${tr.length + 1}`, amount: "", due: addMonths(tr.length ? (tr[tr.length - 1].due || today()) : today(), 3), status: "scheduled" }]));
  const rmTr = (id) => set("tranches", tr.filter((x) => x.id !== id));
  const runGen = () => {
    const n = Math.max(1, Math.min(40, Number(gen.count) || 1));
    const step = Math.max(1, Number(gen.every) || 1);
    const amt = gen.mode === "pct" ? ((Number(f.price) || 0) * (Number(gen.pct) || 0)) / 100 : Number(gen.amount) || 0;
    set("tranches", Array.from({ length: n }, (_, i) => ({ id: uid(), label: `Instalment ${i + 1} of ${n}`, amount: Math.round(amt), due: addMonths(gen.first, i * step), status: "scheduled" })));
    setGen((g) => ({ ...g, open: false }));
  };
  const mkSeries = (base, n, step) => Array.from({ length: n }, (_, i) => ({ ...base, id: uid(), series: false, label: n > 1 ? `${base.label} · ${i + 1} of ${n}` : base.label, due: addMonths(base.due, i * step) }));

  const go = () => {
    if (t === "rates") return rates({ fx: { CHF: 1, USD: +f.USD || 0, AED: +f.AED || 0, EUR: +f.EUR || 0 }, btcUSD: +f.btcUSD || 0, asOf: today() });
    if (t === "position") {
      const v = { ...f };
      if (v.cls === "crypto" && v.livePrice !== false) { v.ccy = "USD"; v.unitPrice = ""; }
      if (!CLS[v.cls]?.real) { v.feePct = 0; v.feeStatus = "paid"; v.downAmt = ""; v.downStatus = "paid"; }
      v.tranches = sortTranches(v.tranches);
      if (!canPlan) v.tranches = [];
      if (v.cls !== "offplan" && !v.tranches.length) v.paid = v.price;
      if (v.cls === "offplan" && !v.value) v.value = v.price;
      return save("positions", v);
    }
    const bucket = t === "commitment" ? "commitments" : "inflows";
    if (f.series && !sheet.item) {
      const n = Math.max(1, Math.min(60, +f.count || 1)), st = Math.max(1, +f.every || 1);
      return saveMany(bucket, mkSeries(f, n, st));
    }
    return save(bucket, f);
  };

  const TITLE = { position: "Position", commitment: "Capital commitment", inflow: "Proceeds or income", rates: "Rates & marks" }[t];
  const BUCKET = { position: "positions", commitment: "commitments", inflow: "inflows" }[t];
  const off = Math.abs((Number(f.price) || 0) - downAmtLive - trTotal) > 1;

  return (
    <div className="cp-scrim" onClick={close}>
      <div className="cp-sheet" onClick={(ev) => ev.stopPropagation()} role="dialog" aria-label={TITLE}>
        <div className="cp-shh"><span>{sheet.item ? "Edit" : "New"} · {TITLE}</span><button onClick={close} aria-label="Close"><Ico n="x" s={16} /></button></div>
        <div className="cp-shb">
          {t === "position" && (<>
            <F l="Asset class"><Chips opts={CLS_ORDER.map((c) => [c, CLS[c].label])} v={f.cls} on={(v) => set("cls", v)} /></F>
            <F l="Name"><input value={f.name} onChange={(ev) => set("name", ev.target.value)} placeholder="Al Reem · Tower A 1204" /></F>
            <div className="cp-two">
              <F l="Location"><input value={f.place} onChange={(ev) => set("place", ev.target.value)} placeholder="Abu Dhabi" /></F>
              <F l="Holding entity"><input value={f.entity} onChange={(ev) => set("entity", ev.target.value)} placeholder="Zug AG" /></F>
            </div>

            {f.cls === "crypto" ? (<>
              <F l="What is it">
                <button type="button" className={"cp-chip-wide" + (live ? " on" : "")}
                  onClick={() => { const n = !live; set("livePrice", n); if (n) { set("ccy", "USD"); set("unitPrice", ""); } }}>
                  {live ? "Bitcoin — priced automatically at spot" : "Another asset — I will set the price"}
                </button>
              </F>
              {live ? (<>
                <F l="Bitcoin held" h="Just the amount. The price comes from the daily rate refresh, so this stays current on its own.">
                  <input type="number" step="0.00000001" value={f.units} onChange={(ev) => set("units", ev.target.value)} placeholder="0.00000000" /></F>
                <div className="cp-livebox">
                  <div className="cp-lbrow"><span>Spot price</span><b>USD {num(s.btcUSD)}</b></div>
                  <div className="cp-lbrow"><span>{Number(f.units) || 0} BTC</span><b>USD {num((Number(f.units) || 0) * (Number(s.btcUSD) || 0))}</b></div>
                  <div className="cp-lbrow note"><span>Priced {s.asOf || "—"}{s.ratesSrc ? " · " + s.ratesSrc : ""}</span></div>
                </div>
                <F l="Total cost basis in USD" h="What you paid in dollars for the whole holding. Leave blank if you would rather not track the gain.">
                  <input type="number" value={f.price} onChange={(ev) => set("price", ev.target.value)} placeholder="0" /></F>
                {Number(f.price) > 0 && (
                  <div className="cp-tally"><span>Unrealised</span>
                    <b className={cryptoMv - Number(f.price) >= 0 ? "up" : "down"}>USD {sgn(cryptoMv - Number(f.price))}<em>{pct(((cryptoMv - Number(f.price)) / Number(f.price)) * 100, 1)}</em></b></div>
                )}
              </>) : (<>
                <F l="Priced in"><Chips opts={CCY_DIGITAL.map((c) => [c, c])} v={f.ccy} on={(v) => set("ccy", v)} /></F>
                <div className="cp-two">
                  <F l="Units held"><input type="number" step="0.00000001" value={f.units} onChange={(ev) => set("units", ev.target.value)} placeholder="0.0000" /></F>
                  <F l={f.ccy === "BTC" ? "Price per unit in BTC" : "Price per unit"}>
                    <input type="number" step={f.ccy === "BTC" ? "0.00000001" : "0.01"} value={f.unitPrice} onChange={(ev) => set("unitPrice", ev.target.value)} placeholder="0" /></F>
                </div>
                <F l="Total cost basis" h="What you paid for the whole holding, in the same currency.">
                  <input type="number" value={f.price} onChange={(ev) => set("price", ev.target.value)} placeholder="0" /></F>
              </>)}
            </>) : f.cls === "trading" ? (<>
              <F l="Currency"><Chips opts={CCY.map((c) => [c, c])} v={f.ccy} on={(v) => set("ccy", v)} /></F>
              <F l="Account value today" h="What the broker statement shows right now, cash and open positions together.">
                <input type="number" value={f.value} onChange={(ev) => set("value", ev.target.value)} placeholder="0" /></F>
              <F l="Net deposits" h="Everything you have paid in, less anything withdrawn. This is the cost basis your gain is measured against.">
                <input type="number" value={f.price} onChange={(ev) => set("price", ev.target.value)} placeholder="0" /></F>
              <div className="cp-tally"><span>Gain since inception</span>
                <b className={(Number(f.value) || 0) - (Number(f.price) || 0) >= 0 ? "up" : "down"}>{f.ccy} {sgn((Number(f.value) || 0) - (Number(f.price) || 0))}{Number(f.price) > 0 && <em>{pct((((Number(f.value) || 0) - Number(f.price)) / Number(f.price)) * 100, 1)}</em>}</b></div>
              <F l="Yield or interest % p.a." h="Optional. Cash sweep or dividend yield credited monthly into the income view.">
                <div className="cp-inline"><input type="number" step="0.05" value={f.rate} onChange={(ev) => set("rate", ev.target.value)} placeholder="0" /><span className="cp-unit">%</span></div></F>
              <F l="Treat as available liquidity?" h="On, and it counts towards cash for funding your instalments. Off, and it is held aside.">
                <button type="button" className={"cp-chip-wide" + (f.liquidOk !== false ? " on" : "")} onClick={() => set("liquidOk", f.liquidOk === false)}>
                  {f.liquidOk !== false ? "Yes — counts as cash" : "No — held separately"}</button></F>
            </>) : (<>
              <F l="Currency"><Chips opts={CCY.map((c) => [c, c])} v={f.ccy} on={(v) => set("ccy", v)} /></F>
              {f.cls === "cash" ? (<>
                <F l="Balance"><input type="number" value={f.value} onChange={(ev) => set("value", ev.target.value)} placeholder="0" /></F>
                <F l="Deposit interest % p.a." h="Credited monthly on this balance and carried into the timeline.">
                  <div className="cp-inline"><input type="number" step="0.05" value={f.rate} onChange={(ev) => set("rate", ev.target.value)} placeholder="0" /><span className="cp-unit">%</span><span className="cp-calc">= {f.ccy} {num(((Number(f.value) || 0) * (Number(f.rate) || 0)) / 100)} a year</span></div></F>
              </>) : (<>
                <div className="cp-grp">
                  <div className="cp-grph">Purchase price</div>
                  <F l={f.cls === "offplan" ? "Contract price" : "Purchase price"} h="The headline price of the asset. Profit is measured against this plus the costs below.">
                    <input type="number" value={f.price} onChange={(ev) => set("price", ev.target.value)} placeholder="0" /></F>
                  <F l="Transaction costs" h="Transfer fee, registration, brokerage. Pick a market or type your own percentage.">
                    <div className="cp-chips mb">
                      {MARKETS.map(([m, v]) => (<button key={m} type="button" className={"cp-chip" + (Number(f.feePct) === v ? " on" : "")} onClick={() => set("feePct", v)}>{m} {v}%</button>))}
                    </div>
                    <div className="cp-inline"><input type="number" step="0.1" value={f.feePct} onChange={(ev) => set("feePct", ev.target.value)} /><span className="cp-unit">%</span><span className="cp-calc">= {f.ccy} {num(feeAmt)}</span></div>
                  </F>
                  <F l="Are those costs already paid?"><Chips opts={[["paid", "Already paid"], ["due", "Still to pay"]]} v={f.feeStatus || "paid"} on={(v) => set("feeStatus", v)} /></F>
                  <div className="cp-tally"><span>Total acquisition cost</span><b>{f.ccy} {num((Number(f.price) || 0) + feeAmt)}</b></div>
                  {Number(f.completeValue) > 0 && (
                    <div className="cp-eqrow tot"><span>Profit at completion value</span>
                      <b className={Number(f.completeValue) - ((Number(f.price) || 0) + feeAmt) >= 0 ? "up" : "down"}>{f.ccy} {sgn(Number(f.completeValue) - ((Number(f.price) || 0) + feeAmt))}</b></div>
                  )}
                </div>

                <div className="cp-grp">
                  <div className="cp-grph">Capital in</div>
                  <F l="First payment to the seller" h="Only what went to the seller or developer. Transaction costs are entered above and counted separately, so do not include them here.">
                    <div className="cp-chips mb">
                      {[5, 10, 15, 20].map((g) => (<button key={g} type="button" className={"cp-chip" + (Number(f.downPct) === g ? " on" : "")} onClick={() => { set("downPct", g); set("downAmt", Math.round(((Number(f.price) || 0) * g) / 100)); }}>{g}%</button>))}
                    </div>
                    <input type="number" value={f.downAmt} onChange={(ev) => set("downAmt", ev.target.value)} placeholder="0" />
                    {Number(f.price) > 0 && downAmtLive > 0 && (<span className="cp-calcfull">{pct((downAmtLive / Number(f.price)) * 100, 1)} of the contract price</span>)}
                  </F>
                  {downAmtLive > 0 && (<>
                    <F l="Has it been paid?"><Chips opts={[["paid", "Paid"], ["due", "Still to pay"]]} v={f.downStatus || "paid"} on={(v) => set("downStatus", v)} /></F>
                    {f.downStatus === "due" && (<F l="Due on"><input type="date" value={f.downDate} onChange={(ev) => set("downDate", ev.target.value)} /></F>)}
                  </>)}
                  {f.cls === "offplan" && !tr.length && (
                    <F l="Paid to date" h="Or build the tranche schedule below and this is worked out for you.">
                      <input type="number" value={f.paid} onChange={(ev) => set("paid", ev.target.value)} placeholder="0" /></F>
                  )}
                </div>

                {canPlan && (
                  <div className="cp-grp">
                    <div className="cp-grph row"><span>Payment plan</span>{(!!tr.length || downAmtLive > 0) && <span className="stat">{num(downPaidLive + trPaid)} paid of {num(downAmtLive + trTotal)} {f.ccy}</span>}</div>

                    {!tr.length && !gen.open && (
                      <div className="cp-planempty">
                        <p>No tranches yet. Build the developer's schedule here and every instalment flows into the funding outlook.</p>
                        <div className="cp-rowb" style={{ marginTop: 0 }}>
                          <button type="button" className="cp-btn primary sm" onClick={() => setGen((g) => ({ ...g, open: true }))}><Ico n="wand" s={13} />Generate plan</button>
                          <button type="button" className="cp-btn ghost sm" onClick={addTr}><Ico n="plus" s={13} />Add one tranche</button>
                        </div>
                      </div>
                    )}

                    {gen.open && (
                      <div className="cp-genbox2">
                        <div className="cp-two">
                          <F l="How many"><input type="number" min="1" value={gen.count} onChange={(ev) => setGen((g) => ({ ...g, count: ev.target.value }))} /></F>
                          <F l="Every (months)"><input type="number" min="1" value={gen.every} onChange={(ev) => setGen((g) => ({ ...g, every: ev.target.value }))} /></F>
                        </div>
                        <F l="First instalment due"><input type="date" value={gen.first} onChange={(ev) => setGen((g) => ({ ...g, first: ev.target.value }))} /></F>
                        <F l="Each instalment">
                          <div className="cp-chips mb">
                            <button type="button" className={"cp-chip" + (gen.mode === "pct" ? " on" : "")} onClick={() => setGen((g) => ({ ...g, mode: "pct" }))}>% of price</button>
                            <button type="button" className={"cp-chip" + (gen.mode === "amt" ? " on" : "")} onClick={() => setGen((g) => ({ ...g, mode: "amt" }))}>Fixed amount</button>
                          </div>
                          {gen.mode === "pct" ? (
                            <div className="cp-inline"><input type="number" step="0.5" value={gen.pct} onChange={(ev) => setGen((g) => ({ ...g, pct: ev.target.value }))} /><span className="cp-unit">%</span><span className="cp-calc">= {f.ccy} {num(((Number(f.price) || 0) * (Number(gen.pct) || 0)) / 100)} each</span></div>
                          ) : (<input type="number" value={gen.amount} onChange={(ev) => setGen((g) => ({ ...g, amount: ev.target.value }))} placeholder="0" />)}
                        </F>
                        <div className="cp-rowb" style={{ marginTop: 4 }}>
                          <button type="button" className="cp-btn primary sm" onClick={runGen}>Create schedule</button>
                          <button type="button" className="cp-btn ghost sm" onClick={() => setGen((g) => ({ ...g, open: false }))}>Cancel</button>
                        </div>
                      </div>
                    )}

                    {!!tr.length && (<>
                      <div className="cp-trlist">{tr.map((x, i) => (
                        <div key={x.id} className={"cp-trrow" + (x.status === "paid" ? " done" : "")}>
                          <span className="trno">{i + 1}</span>
                          <input value={x.label} onChange={(ev) => setTr(x.id, "label", ev.target.value)} />
                          <input type="number" value={x.amount} onChange={(ev) => setTr(x.id, "amount", ev.target.value)} placeholder="0" />
                          <input className="td" type="date" value={x.due} onChange={(ev) => setTr(x.id, "due", ev.target.value)} />
                          <button type="button" className={"cp-trst " + x.status}
                            onClick={() => setTr(x.id, "status", x.status === "paid" ? "scheduled" : x.status === "scheduled" ? "delayed" : "paid")}>
                            {x.status === "paid" ? <><Ico n="check" s={11} />Paid</> : x.status === "delayed" ? <><Ico n="alert" s={11} />Delayed</> : <>Due</>}
                          </button>
                          <button type="button" className="cp-trx" onClick={() => rmTr(x.id)} aria-label="Remove tranche"><Ico n="x" s={12} /></button>
                        </div>
                      ))}</div>
                      <div className="cp-recon">
                        <div className="cp-rcrow"><span>First payment</span><b>{downAmtLive ? num(downAmtLive) : "—"}</b></div>
                        <div className="cp-rcrow"><span>Tranches ({tr.length})</span><b>{num(trTotal)}</b></div>
                        <div className="cp-rcrow sum"><span>Down payment plus plan</span><b>{f.ccy} {num(downAmtLive + trTotal)}</b></div>
                        <div className="cp-rcrow"><span>Contract price</span><b>{num(Number(f.price) || 0)}</b></div>
                        <div className={"cp-rcrow diff" + (off ? " off" : " ok")}>
                          <span>{off ? "Unaccounted for" : "Reconciled"}</span>
                          <b>{off ? sgn((Number(f.price) || 0) - downAmtLive - trTotal) : "✓"}</b>
                        </div>
                      </div>
                      <div className="cp-rowb">
                        <button type="button" className="cp-btn ghost sm" onClick={addTr}><Ico n="plus" s={13} />Add tranche</button>
                        <button type="button" className="cp-btn ghost sm" onClick={renumber}>Renumber</button>
                        <button type="button" className="cp-btn ghost sm" onClick={() => setGen((g) => ({ ...g, open: true }))}>Rebuild plan</button>
                      </div>
                    </>)}

                    <div className="cp-eqbox">
                      <div className="cp-eqrow"><span>First payment</span><b>{downPaidLive ? num(downPaidLive) : "—"}</b></div>
                      <div className="cp-eqrow"><span>Instalments paid</span><b>{trPaid ? num(trPaid) : "—"}</b></div>
                      <div className="cp-eqrow"><span>Transaction costs paid</span><b>{f.feeStatus === "due" ? "—" : num(feeAmt)}</b></div>
                      <div className="cp-eqrow tot"><span>Total cash out to date</span><b>{f.ccy} {num(downPaidLive + trPaid + (f.feeStatus === "due" ? 0 : feeAmt))}</b></div>
                      <div className="cp-eqrow due"><span>Still to fund</span><b>{f.ccy} {num((downAmtLive - downPaidLive) + (trTotal - trPaid) + (f.feeStatus === "due" ? feeAmt : 0))}</b></div>
                    </div>
                  </div>
                )}

                <div className="cp-grp">
                  <div className="cp-grph">Current position</div>
                  <F l="Current mark" h="Your own valuation today. Leave blank on off-plan to hold it at contract price.">
                    <input type="number" value={f.value} onChange={(ev) => set("value", ev.target.value)} placeholder="0" /></F>
                  <F l="Expected growth % a year" h="Your view on how this market moves. Compounded monthly, so the timeline shows the value rising instead of sitting flat.">
                    <div className="cp-chips mb">
                      {[0, 2, 3, 4, 5, 7].map((g) => (<button key={g} type="button" className={"cp-chip" + (Number(f.growth) === g ? " on" : "")} onClick={() => set("growth", g)}>{g}%</button>))}
                    </div>
                    <div className="cp-inline"><input type="number" step="0.5" value={f.growth} onChange={(ev) => set("growth", ev.target.value)} placeholder="0" /><span className="cp-unit">%</span><span className="cp-calc">{Number(f.growth) ? `≈ ${f.ccy} ${num(grow(Number(f.completeValue) || Number(f.value) || 0, Number(f.growth), 60))} in 5 years` : "held flat"}</span></div>
                  </F>
                  <F l="Expected exit cost %" h="Brokerage and transfer on disposal. Used for net proceeds only.">
                    <div className="cp-inline"><input type="number" step="0.1" value={f.exitPct} onChange={(ev) => set("exitPct", ev.target.value)} /><span className="cp-unit">%</span></div></F>
                  <div className="cp-eqbox">
                    <div className="cp-eqrow"><span>Market value</span><b>{num(Number(f.value) || 0)}</b></div>
                    <div className="cp-eqrow"><span>Less mortgage</span><b>{Number(f.debt) ? "−" + num(Number(f.debt)) : "—"}</b></div>
                    <div className="cp-eqrow"><span>Less still owed on contract</span><b className={owedLive ? "down" : ""}>{owedLive ? "−" + num(owedLive) : "—"}</b></div>
                    <div className="cp-eqrow tot"><span>Your equity</span><b className={equityLive < 0 ? "down" : ""}>{f.ccy} {num(equityLive)}</b></div>
                  </div>
                  {owedLive > 0 && Number(f.debt) > 0 && (
                    <div className="cp-softwarn">This position shows both a mortgage of {num(Number(f.debt))} and {num(owedLive)} still owed on the contract, and both are deducted. If the mortgage was drawn to pay the seller, mark those tranches or the first payment as paid, and let the mortgage stand as the debt. Otherwise the same purchase is counted twice.</div>
                  )}
                  {equityLive < 0 && (
                    <div className="cp-hardwarn">Equity is negative, which usually means the purchase is recorded as unpaid.{f.cls === "offplan" && !tr.length && !downAmtLive ? " This is Off-plan with no first payment and no tranches, so the whole contract price counts as outstanding. If it is already paid for, switch the class to Investment property." : " Check the first payment and the tranche statuses above."}</div>
                  )}
                </div>

                {isReal && (
                  <div className="cp-grp">
                    <div className="cp-grph">Completion &amp; realisation</div>
                    <F l="Completion or handover date" h="When the building is finished and the value re-marks."><input type="date" value={f.completeDate} onChange={(ev) => set("completeDate", ev.target.value)} /></F>
                    <F l="Estimated value on completion" h="What you expect it to be worth once finished. The timeline steps the mark up on that date."><input type="number" value={f.completeValue} onChange={(ev) => set("completeValue", ev.target.value)} placeholder="0" /></F>
                    {Number(f.completeValue) > 0 && Number(f.price) > 0 && (
                      <div className="cp-tally"><span>Uplift over contract price</span><b className={Number(f.completeValue) >= Number(f.price) ? "up" : "down"}>{f.ccy} {sgn(Number(f.completeValue) - Number(f.price))}</b></div>
                    )}
                    <F l="Do you plan to sell or realise it?">
                      <button type="button" className={"cp-chip-wide" + (f.sellPlanned ? " on" : "")} onClick={() => set("sellPlanned", !f.sellPlanned)}>{f.sellPlanned ? "Yes — proceeds land on the timeline" : "Hold, no sale planned"}</button></F>
                    {f.sellPlanned && (
                      <div className="cp-genbox2">
                        <F l="Expected completion of sale" h="For a Swiss development, when the proceeds actually reach you."><input type="date" value={f.sellDate} onChange={(ev) => set("sellDate", ev.target.value)} /></F>
                        <F l="Expected gross proceeds" h="Total sale price. Leave blank to use the completion value."><input type="number" value={f.sellGross} onChange={(ev) => set("sellGross", ev.target.value)} placeholder="0" /></F>
                        <F l={`How likely — ${f.sellProb}%`} h="The timeline weights the proceeds at this level."><input type="range" min="0" max="100" step="5" value={f.sellProb} onChange={(ev) => set("sellProb", Number(ev.target.value))} /></F>
                        <table className="cp-mini gap"><tbody>
                          <Mrow l="Gross proceeds" v={`${f.ccy} ${num(sellGrossLive)}`} />
                          <Mrow l={`Selling costs ${f.exitPct || 0}%`} v={"−" + num(sellGrossLive * ((Number(f.exitPct) || 0) / 100))} tone="down" />
                          <Mrow l="Mortgage repaid" v={Number(f.debt) ? "−" + num(Number(f.debt)) : "—"} tone={Number(f.debt) ? "down" : ""} />
                          <Mrow l="Cash you receive" v={num(sellNetLive)} strong />
                          <Mrow l="Profit over capital deployed" v={sgn(sellNetLive - investedLive)} tone={sellNetLive - investedLive >= 0 ? "up" : "down"} strong />
                        </tbody></table>
                      </div>
                    )}
                  </div>
                )}

                {isReal && (
                  <div className="cp-grp">
                    <div className="cp-grph">Financing</div>
                    <F l="Mortgage outstanding today" h="Leave at zero if the property is unencumbered."><input type="number" value={f.debt} onChange={(ev) => set("debt", ev.target.value)} placeholder="0" /></F>
                    {Number(f.debt) > 0 && (<>
                      <div className="cp-two">
                        <F l="Interest rate % p.a."><input type="number" step="0.05" value={f.rate} onChange={(ev) => set("rate", ev.target.value)} placeholder="0" /></F>
                        <F l="Amortisation % p.a." h="Of the original loan."><input type="number" step="0.1" value={f.amortPct} onChange={(ev) => set("amortPct", ev.target.value)} placeholder="0" /></F>
                      </div>
                      <F l="Paid every"><Chips opts={[[1, "Month"], [3, "Quarter"], [6, "Half year"], [12, "Year"]]} v={Number(f.payFreq) || 3} on={(v) => set("payFreq", v)} /></F>
                    </>)}
                    <F l="Mortgage still to be taken">
                      <button type="button" className={"cp-chip-wide" + (f.mortPlanned ? " on" : "")} onClick={() => set("mortPlanned", !f.mortPlanned)}>{f.mortPlanned ? "Planned — releases cash on drawdown" : "No mortgage planned"}</button></F>
                    {f.mortPlanned && (
                      <div className="cp-genbox2">
                        <F l="Drawdown date" h="Usually handover, or whenever the bank releases funds."><input type="date" value={f.mortDate} onChange={(ev) => set("mortDate", ev.target.value)} /></F>
                        <F l="Loan amount" h="Leave blank to use the loan-to-value below against the current mark."><input type="number" value={f.mortAmt} onChange={(ev) => set("mortAmt", ev.target.value)} placeholder="0" /></F>
                        {!f.mortAmt && (
                          <F l={`Loan to value — ${f.mortLtv}%`}>
                            <input type="range" min="0" max="80" step="5" value={f.mortLtv} onChange={(ev) => set("mortLtv", Number(ev.target.value))} />
                            <span className="cp-calcfull">= {f.ccy} {num(((Number(f.value) || 0) * (Number(f.mortLtv) || 0)) / 100)} released</span>
                          </F>
                        )}
                        <div className="cp-two">
                          <F l="Interest rate % p.a."><input type="number" step="0.05" value={f.mortRate} onChange={(ev) => set("mortRate", ev.target.value)} placeholder="0" /></F>
                          <F l="Amortisation % p.a."><input type="number" step="0.1" value={f.mortAmortPct} onChange={(ev) => set("mortAmortPct", ev.target.value)} placeholder="0" /></F>
                        </div>
                        <F l="Arrangement fees %" h="Taken off the amount that reaches your account."><div className="cp-inline"><input type="number" step="0.1" value={f.mortFeePct} onChange={(ev) => set("mortFeePct", ev.target.value)} /><span className="cp-unit">%</span></div></F>
                      </div>
                    )}
                    <F l="Rental income" h="What the property brings in once let. Leave at zero if it does not produce income."><input type="number" value={f.rentAmt} onChange={(ev) => set("rentAmt", ev.target.value)} placeholder="0" /></F>
                    {Number(f.rentAmt) > 0 && (<>
                      <F l="Received every"><Chips opts={[[1, "Month"], [3, "Quarter"], [6, "Half year"], [12, "Year"]]} v={Number(f.rentFreq) || 1} on={(v) => set("rentFreq", v)} /></F>
                      <div className="cp-two">
                        <F l="First rent from"><input type="date" value={f.rentStart} onChange={(ev) => set("rentStart", ev.target.value)} /></F>
                        <F l={`Occupancy ${f.occ}%`}><input type="range" min="50" max="100" step="5" value={f.occ} onChange={(ev) => set("occ", Number(ev.target.value))} /></F>
                      </div>
                      <div className="cp-tally"><span>Net after debt service, per year</span><b className={netPa >= 0 ? "up" : "down"}>{f.ccy} {sgn(netPa)}</b></div>
                    </>)}
                  </div>
                )}
              </>)}
            </>)}
            <F l="Note"><input value={f.note} onChange={(ev) => set("note", ev.target.value)} placeholder="Optional" /></F>
          </>)}

          {t === "commitment" && (<>
            <p className="cp-fine" style={{ marginTop: 0 }}>For anything not tied to a purchase — construction draws, mortgage payments, tax. Off-plan tranches belong on the position itself.</p>
            <F l="Obligation"><input value={f.label} onChange={(ev) => set("label", ev.target.value)} placeholder="Construction draw" /></F>
            <F l="Counterparty"><input value={f.counterparty} onChange={(ev) => set("counterparty", ev.target.value)} placeholder="Contractor, bank" /></F>
            <F l="Currency"><Chips opts={CCY.map((c) => [c, c])} v={f.ccy} on={(v) => set("ccy", v)} /></F>
            <F l="Amount per instalment"><input type="number" value={f.amount} onChange={(ev) => set("amount", ev.target.value)} placeholder="0" /></F>
            <F l="Due date"><input type="date" value={f.due} onChange={(ev) => set("due", ev.target.value)} /></F>
            <F l="Status"><Chips opts={[["scheduled", "Scheduled"], ["delayed", "Delayed"], ["settled", "Settled"]]} v={f.status} on={(v) => set("status", v)} /></F>
            {!sheet.item && <SeriesBlock f={f} set={set} onLabel="Payment plan — generate schedule" offLabel="Single payment" />}
          </>)}

          {t === "inflow" && (<>
            <F l="What kind of receipt is this?" h="Earnings are salary, dividends or fees — money you make. Capital is a sale, a drawdown or a repayment — money moving, not earned.">
              <Chips opts={[["income", "Earnings"], ["capital", "Capital receipt"]]} v={f.kind || "capital"} on={(v) => set("kind", v)} /></F>
            <F l="Source"><input value={f.label} onChange={(ev) => set("label", ev.target.value)} placeholder={f.kind === "income" ? "Salary · Baidas & Baidas AG" : "Sale proceeds · Dübendorf"} /></F>
            <F l="Currency"><Chips opts={CCY.map((c) => [c, c])} v={f.ccy} on={(v) => set("ccy", v)} /></F>
            <F l="Gross amount"><input type="number" value={f.amount} onChange={(ev) => set("amount", ev.target.value)} placeholder="0" /></F>
            <F l="Expected date"><input type="date" value={f.due} onChange={(ev) => set("due", ev.target.value)} /></F>
            <F l={`Probability — ${f.probability}%`} h="The ladder counts this at the weight you set. Contracted rent belongs near 100%, a hoped-for exit does not.">
              <input type="range" min="0" max="100" step="5" value={f.probability} onChange={(ev) => set("probability", +ev.target.value)} /></F>
            <F l="Status"><Chips opts={[["expected", "Expected"], ["received", "Received"]]} v={f.status} on={(v) => set("status", v)} /></F>
            {!sheet.item && <SeriesBlock f={f} set={set} onLabel="Recurring — generate schedule" offLabel="One-off receipt" />}
          </>)}

          {t === "rates" && (<>
            <p className="cp-fine" style={{ marginTop: 0 }}>Value of one unit expressed in Swiss francs.</p>
            {["USD", "AED", "EUR"].map((c) => <F key={c} l={`1 ${c} in CHF`}><input type="number" step="0.0001" value={f[c]} onChange={(ev) => set(c, ev.target.value)} /></F>)}
            <F l="Bitcoin spot (USD)"><input type="number" value={f.btcUSD} onChange={(ev) => set("btcUSD", ev.target.value)} placeholder="0" /></F>
          </>)}
        </div>
        <div className="cp-shf">
          {sheet.item && BUCKET && <button className="cp-btn danger" onClick={() => del(BUCKET, sheet.item.id)}><Ico n="trash" s={13} />Delete</button>}
          <button className="cp-btn primary grow" onClick={go}>Save</button>
        </div>
      </div>
    </div>
  );
}
