/* ── encrypted vault ───────────────────────────────────────
   Extracted verbatim from the original single-file app (lines 511–587).
   A random AES-256-GCM data key encrypts the ledger; that key is wrapped
   separately with the owner passphrase (and an optional view-only one),
   PBKDF2-SHA256 at 210,000 rounds. Storage holds ciphertext only.

   DO NOT rename the VAULT storage key — real data lives there. */

export const VAULT = "capital-portal-vault-v1";
export const KEY = "capital-portal-v4"; // legacy plaintext key, import-only

/* Standalone builds have no host storage, so fall back to this device. */
if (typeof window !== "undefined" && !window.storage) {
  const P = "cp:";
  window.storage = {
    async get(key) {
      const v = localStorage.getItem(P + key);
      if (v === null) throw new Error("not found");
      return { key, value: v, shared: false };
    },
    async set(key, value) { localStorage.setItem(P + key, value); return { key, value, shared: false }; },
    async delete(key) { localStorage.removeItem(P + key); return { key, deleted: true, shared: false }; },
    async list(prefix = "") {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(P + prefix)) keys.push(k.slice(P.length));
      }
      return { keys, prefix, shared: false };
    },
  };
  window.__standalone = true;
}

const ITER = 210000;
export const subtle = typeof crypto !== "undefined" && crypto.subtle ? crypto.subtle : null;
const te = new TextEncoder(), td = new TextDecoder();

function toB64(buf) {
  const u = new Uint8Array(buf); let out = ""; const CH = 0x8000;
  for (let i = 0; i < u.length; i += CH) out += String.fromCharCode.apply(null, u.subarray(i, i + CH));
  return btoa(out);
}
const fromB64 = (str) => Uint8Array.from(atob(str), (c) => c.charCodeAt(0));
const rand = (n) => crypto.getRandomValues(new Uint8Array(n));

async function deriveKEK(pass, salt) {
  const base = await subtle.importKey("raw", te.encode(pass), "PBKDF2", false, ["deriveKey"]);
  return subtle.deriveKey({ name: "PBKDF2", salt, iterations: ITER, hash: "SHA-256" },
    base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
}
export async function wrapDK(dk, pass) {
  const salt = rand(16), iv = rand(12);
  const kek = await deriveKEK(pass, salt);
  const raw = await subtle.exportKey("raw", dk);
  const wrapped = await subtle.encrypt({ name: "AES-GCM", iv }, kek, raw);
  return { salt: toB64(salt), iv: toB64(iv), k: toB64(wrapped) };
}
export async function unwrapDK(slot, pass) {
  const kek = await deriveKEK(pass, fromB64(slot.salt));
  const raw = await subtle.decrypt({ name: "AES-GCM", iv: fromB64(slot.iv) }, kek, fromB64(slot.k));
  return subtle.importKey("raw", raw, { name: "AES-GCM" }, true, ["encrypt", "decrypt"]);
}
export async function sealState(dk, state) {
  const iv = rand(12);
  const ct = await subtle.encrypt({ name: "AES-GCM", iv }, dk, te.encode(JSON.stringify(state)));
  return { iv: toB64(iv), ct: toB64(ct) };
}
export async function openState(dk, blob) {
  const plain = await subtle.decrypt({ name: "AES-GCM", iv: fromB64(blob.iv) }, dk, fromB64(blob.ct));
  return JSON.parse(td.decode(plain));
}
export async function genKey() {
  return subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
}
export function downloadVault(v) {
  const blob = new Blob([JSON.stringify(v, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `capital-portal-${new Date().toISOString().slice(0, 10)}.vault.json`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const readVault = async () => {
  try { const r = await window.storage.get(VAULT); return r && r.value ? JSON.parse(r.value) : null; }
  catch { return null; }
};
export const writeVault = (v) => window.storage.set(VAULT, JSON.stringify(v));
