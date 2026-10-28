/* ── Edge access gate ───────────────────────────────────────────────
   Runs on every request before anything is served. The portal (and all
   of its static files) stay invisible until the visitor authenticates
   with HTTP Basic Auth.

   NOTE on credentials: Vercel Routing Middleware does NOT receive custom
   project environment variables at runtime (only system VERCEL_* vars),
   so the login is kept here in code. This repository is PRIVATE, so only
   the owner can read it. To change the login, edit the two constants
   below and redeploy (git push).

   This gate is additive: it does not touch the encrypted vault, the
   engine, or any stored data. It only decides who may load the app. */

import { next } from "@vercel/functions";

const PORTAL_USER = "andreas";
const PORTAL_PASS = "e6fd94cf2ad0a2a8d1ad594a";

export default function proxy(request) {
  const header = request.headers.get("authorization") || "";
  if (header.startsWith("Basic ")) {
    let decoded = "";
    try {
      decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
    } catch {
      decoded = "";
    }
    const idx = decoded.indexOf(":");
    if (
      idx !== -1 &&
      timingSafeEqual(decoded.slice(0, idx), PORTAL_USER) &&
      timingSafeEqual(decoded.slice(idx + 1), PORTAL_PASS)
    ) {
      return next(); // authenticated → serve the portal
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
