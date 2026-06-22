# Waitlist form — how it works & how to make it capture emails securely

The "Join the waitlist" form on the homepage is built to be **safe by default**
and to never expose `fintley.app` to abuse. This documents how it behaves today
and the two ways to turn on real email capture when you're ready.

## Why the form can't take down the site

`fintley.app` is a **static site** (just HTML/CSS/JS on a CDN/Pages host). There
is no origin server behind it for the form to overload — so the form itself can't
be used to DDoS the website. Any real "capture" happens at a **separate endpoint**
you choose. All abuse protection therefore lives at that endpoint, plus the
client-side guards already in the page.

## What's already hardened in the page

- **Honeypot field** (`company`) — hidden from people, tempting to bots. If it's
  filled, the submit is silently dropped and never sent.
- **Client-side throttle** — one submit per 20 seconds per browser
  (`localStorage`), and an in-flight guard so a click can't be spammed.
- **Strict email validation** + 120-char cap before anything is sent.
- **No secrets in the page.** Requests go out with `credentials: "omit"` and a
  12-second timeout. There is nothing in the client a scraper could steal.
- **No third-party scripts unless you opt in.** Cloudflare Turnstile only loads
  if you set a sitekey (see below). With no sitekey, zero external JS is pulled.

> Client-side guards are convenience/first-line only. **The real rate limiting and
> bot-verification must live on your endpoint** — a determined attacker can bypass
> any browser-side check.

## Default behavior (no backend yet)

Out of the box the form's `data-endpoint` is empty. On a valid submit it opens the
visitor's own mail client pre-addressed to `hello@fintley.app`. This needs **no
server**, has **no attack surface on your side**, and works the day you deploy.

## Turning on real capture

Set two attributes on `<form id="waitlistForm">` in `index.html`:

```html
<form class="wl-form" id="waitlistForm" novalidate
      data-endpoint="https://your-endpoint.example/subscribe"
      data-turnstile-sitekey="0xAAAA_your_turnstile_sitekey">
```

The form will then `POST` JSON `{ email, token, source }` to your endpoint and show
inline success/error. The `token` is the Cloudflare Turnstile token (empty if you
leave the sitekey blank). **Your endpoint must respond with CORS headers** allowing
`https://fintley.app`.

### Option A — Cloudflare Worker + Turnstile + KV rate limit (recommended)

This matches the infrastructure the app already uses (`proxy/`). It gives you
bot-blocking (Turnstile), per-IP rate limiting (KV), and you control the data.

1. In the Cloudflare dashboard, create a **Turnstile** widget for `fintley.app`.
   Put the **sitekey** in `data-turnstile-sitekey` and keep the **secret** as a
   Worker secret.
2. Create a KV namespace `WAITLIST` (stores emails + per-IP counters).
3. Deploy this Worker and point `data-endpoint` at its URL:

```js
// worker.js — dependency-free
const ORIGIN = "https://fintley.app";
const MAX_PER_IP_PER_DAY = 5;

export default {
  async fetch(req, env) {
    const cors = {
      "Access-Control-Allow-Origin": ORIGIN,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };
    if (req.method === "OPTIONS") return new Response(null, { headers: cors });
    if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405, headers: cors });

    let body;
    try { body = await req.json(); } catch { return json({ error: "bad" }, 400, cors); }
    const email = String(body.email || "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 120)
      return json({ error: "invalid email" }, 400, cors);

    // 1) Verify Turnstile (server-side — this is the real bot gate)
    const ip = req.headers.get("CF-Connecting-IP") || "";
    const verify = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret: env.TURNSTILE_SECRET, response: body.token || "", remoteip: ip }),
    }).then((r) => r.json()).catch(() => ({ success: false }));
    if (!verify.success) return json({ error: "failed challenge" }, 403, cors);

    // 2) Per-IP rate limit (cheap denial-of-wallet / spam backstop)
    const key = "ip:" + ip + ":" + new Date().toISOString().slice(0, 10);
    const count = parseInt((await env.WAITLIST.get(key)) || "0", 10);
    if (count >= MAX_PER_IP_PER_DAY) return json({ error: "rate limited" }, 429, cors);
    await env.WAITLIST.put(key, String(count + 1), { expirationTtl: 86400 });

    // 3) Store (dedup on email). Swap for your ESP/Sheet/Airtable if preferred.
    await env.WAITLIST.put("email:" + email, new Date().toISOString());
    return json({ ok: true }, 200, cors);
  },
};
function json(obj, status, cors) {
  return new Response(JSON.stringify(obj), {
    status, headers: { "Content-Type": "application/json", ...cors },
  });
}
```

```
wrangler kv:namespace create WAITLIST
wrangler secret put TURNSTILE_SECRET
wrangler deploy
```

### Option B — a hosted form service (fastest)

Services like **Formspree** or **Web3Forms** give you an endpoint with built-in
spam filtering. Paste their endpoint into `data-endpoint`. Still:

- Turn on their **spam/abuse protection** (hCaptcha/honeypot) in the dashboard.
- Optionally keep `data-turnstile-sitekey` set so the page also sends a Turnstile
  token. (If the service ignores it, that's harmless — the field is just unused.)
- Confirm they return CORS headers for `https://fintley.app` (both do).

## Quick checklist before launch

- [ ] Pick Option A or B and set `data-endpoint`.
- [ ] Set `data-turnstile-sitekey` (Option A; optional for B).
- [ ] Confirm the endpoint allows CORS from `https://fintley.app`.
- [ ] Add the endpoint's origin to the Content-Security-Policy `connect-src` (and
  `form-action`) in **both** `_headers` and the `<meta http-equiv="Content-Security-Policy">`
  in `index.html` — otherwise the browser will block the POST.
- [ ] Submit once and verify the email lands; submit 6× and verify the rate limit.
- [ ] Confirm a forged/empty Turnstile token is rejected (Option A).
