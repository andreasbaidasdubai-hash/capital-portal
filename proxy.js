/* ── Edge access gate ───────────────────────────────────────────────
   Runs on every request before anything is served. The portal (and all
   of its static files) stay invisible until the visitor authenticates
   with HTTP Basic Auth against the owner credentials.

   Credentials live ONLY in Vercel environment variables, never in code:
     PORTAL_USER   – the login name
     PORTAL_PASS   – the login password
   Set both in the capital-portal Vercel project (Production), then
   redeploy. Until they are set, the gate fails CLOSED (nobody gets in).

   This gate is additive: it does not touch the encrypted vault, the
   engine, or any stored data. It only decides who may load the app. */

import { next } from "@vercel/functions";

export default function proxy(request) {
  const USER = process.env.PORTAL_USER;
  const PASS = process.env.PORTAL_PASS;

  // Fail closed: no credentials configured → let nobody in.
  if (!USER || !PASS) {
    // TEMP DIAGNOSTIC (names/counts only — never values): remove after debugging.
    let dbg = "";
    try {
      const keys = Object.keys(process.env || {});
      const portalKeys = keys.filter((k) => k.indexOf("PORTAL") !== -1);
      dbg = ` [diag hasUser=${!!USER} hasPass=${!!PASS} portalKeys=${portalKeys.join("|") || "none"} envCount=${keys.length}]`;
    } catch (e) {
      dbg = " [diag process.env threw: " + (e && e.message) + "]";
    }
    return new Response(
      "Portal access is not configured. Set PORTAL_USER and PORTAL_PASS in the Vercel project settings, then redeploy." + dbg,
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }

  const header = request.headers.get("authorization") || "";
  if (header.startsWith("Basic ")) {
    let decoded = "";
    try {
      decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
    } catch {
      decoded = "";
    }
    const idx = decoded.indexOf(":");
    if (idx !== -1) {
      const u = decoded.slice(0, idx);
      const p = decoded.slice(idx + 1);
      if (timingSafeEqual(u, USER) && timingSafeEqual(p, PASS)) {
        return next(); // authenticated → serve the portal
      }
    }
  }

  // Not authenticated → ask the browser for the login, serve nothing else.
  return new Response("Authentication required.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Capital Portal", charset="UTF-8"',
      "Cache-Control": "no-store",
    },
  });
}

/* length-aware, branch-constant comparison to avoid leaking match length */
function timingSafeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) {
    return false;
  }
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}
