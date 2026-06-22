/* ============================================================
   Fintley marketing site interactions
   Vanilla JS, no dependencies. Progressive enhancement: every
   value has a sensible static fallback if JS never runs.
   ============================================================ */
(function () {
  "use strict";

  var reduce =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- footer year ---------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---------- helpers ---------- */
  function colorForScore(s) {
    if (s >= 90) return "var(--green)";
    if (s >= 70) return "var(--blue)";
    if (s >= 55) return "var(--sky)";
    if (s >= 40) return "var(--orange)";
    return "var(--red)";
  }

  function animateCount(el, to, dur) {
    if (reduce) { el.textContent = String(to); return; }
    var start = null;
    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = String(Math.round(to * eased));
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = String(to);
    }
    requestAnimationFrame(step);
  }

  function applyScore(scoreEl, value, doCount) {
    scoreEl.style.setProperty("--score", value);
    scoreEl.style.setProperty("--score-color", colorForScore(value));
    var val = scoreEl.querySelector(".score__val");
    if (val) {
      if (doCount) animateCount(val, value, 1100);
      else val.textContent = String(value);
    }
  }

  /* Pre-zero the rings so they fill on reveal (skip for reduced motion). */
  if (!reduce) {
    document.querySelectorAll(".score").forEach(function (s) {
      s.style.setProperty("--score", 0);
    });
  }

  /* ---------- scroll reveal ---------- */
  var revealEls = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
  if (reduce || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("is-in"); });
  } else {
    var revObs = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            revObs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );
    revealEls.forEach(function (el) { revObs.observe(el); });
  }

  /* ---------- hero phone ring ---------- */
  var heroScore = document.querySelector(".hero .score");
  function fireHero() {
    if (heroScore) applyScore(heroScore, parseInt(heroScore.getAttribute("data-score"), 10) || 92, true);
  }
  if (heroScore) {
    if (reduce || !("IntersectionObserver" in window)) {
      fireHero();
    } else {
      var heroObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { fireHero(); heroObs.disconnect(); }
        });
      }, { threshold: 0.4 });
      heroObs.observe(heroScore);
    }
  }

  /* ---------- Forecast interactive demo ---------- */
  var PRESETS = {
    bargain: {
      score: 92, verdict: "Incredible investment", mascot: "excited",
      blurb: "Everything lines up here, and the price is the standout. Deals like this don't sit long.",
      pillars: { price: 88, cash: 79, market: 74, location: 81 }
    },
    fair: {
      score: 64, verdict: "Worth a look", mascot: "neutral",
      blurb: "Decent bones, but you're paying close to full price. Worth a look before you jump in.",
      pillars: { price: 55, cash: 60, market: 66, location: 70 }
    },
    over: {
      score: 31, verdict: "Fintley says pass", mascot: "neutral",
      blurb: "The numbers don't work at this price. Fintley would keep scrolling.",
      pillars: { price: 18, cash: 30, market: 45, location: 52 }
    }
  };

  var fcScore = document.querySelector(".fc__ring .score");
  var fcMascot = document.getElementById("fcMascot");
  var fcVerdict = document.getElementById("fcVerdict");
  var fcBlurb = document.getElementById("fcBlurb");
  var fcButtons = Array.prototype.slice.call(document.querySelectorAll(".fc__preset"));
  var pillarFills = {};
  document.querySelectorAll(".fc__pillars .pillar").forEach(function (p) {
    pillarFills[p.getAttribute("data-pillar")] = p.querySelector(".pillar__fill");
  });
  var currentPreset = "bargain";

  if (!reduce) {
    Object.keys(pillarFills).forEach(function (k) {
      if (pillarFills[k]) pillarFills[k].style.setProperty("--v", "0%");
    });
  }

  function applyPreset(key, doCount) {
    var p = PRESETS[key];
    if (!p) return;
    currentPreset = key;
    if (fcScore) applyScore(fcScore, p.score, doCount);
    if (fcVerdict) fcVerdict.textContent = p.verdict;
    if (fcBlurb) fcBlurb.textContent = p.blurb;
    if (fcMascot) {
      fcMascot.src = "assets/fintley/fintley-" + p.mascot + "-transparent.svg";
      if (!reduce) {
        fcMascot.style.transform = "scale(0.82)";
        setTimeout(function () { fcMascot.style.transform = ""; }, 30);
      }
    }
    Object.keys(p.pillars).forEach(function (k) {
      if (pillarFills[k]) pillarFills[k].style.setProperty("--v", p.pillars[k] + "%");
    });
  }

  fcButtons.forEach(function (b) {
    b.setAttribute("aria-pressed", b.classList.contains("is-active") ? "true" : "false");
    b.addEventListener("click", function () {
      fcButtons.forEach(function (x) {
        x.classList.remove("is-active");
        x.setAttribute("aria-pressed", "false");
      });
      b.classList.add("is-active");
      b.setAttribute("aria-pressed", "true");
      applyPreset(b.getAttribute("data-preset"), true);
    });
  });

  /* animate the forecast block into life when it scrolls in */
  var fcBlock = document.querySelector(".fc");
  if (fcBlock) {
    if (reduce || !("IntersectionObserver" in window)) {
      applyPreset(currentPreset, true);
    } else {
      var fcObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { applyPreset(currentPreset, true); fcObs.disconnect(); }
        });
      }, { threshold: 0.35 });
      fcObs.observe(fcBlock);
    }
  }

  /* ---------- Deal Lab calculator ---------- */
  var VALUE = 245000, TERM = 360, CLOSING = 0.03, NOI_FACTOR = 0.65;
  var dpDown = document.getElementById("dpDown");
  var dpRate = document.getElementById("dpRate");
  var dpRent = document.getElementById("dpRent");

  if (dpDown && dpRate && dpRent) {
    var outDown = document.getElementById("outDown");
    var outRate = document.getElementById("outRate");
    var outRent = document.getElementById("outRent");
    var outCash = document.getElementById("outCash");
    var outCashYr = document.getElementById("outCashYr");
    var outCap = document.getElementById("outCap");
    var outCoc = document.getElementById("outCoc");
    var outMort = document.getElementById("outMort");

    function money(n) { return "$" + Math.round(n).toLocaleString("en-US"); }
    function signed(n) {
      var r = Math.round(n);
      return (r >= 0 ? "+$" : "-$") + Math.abs(r).toLocaleString("en-US");
    }

    function calc() {
      var down = +dpDown.value, rate = +dpRate.value, rent = +dpRent.value;
      outDown.textContent = down + "%";
      outRate.textContent = rate.toFixed(1) + "%";
      outRent.textContent = money(rent);

      var loan = VALUE * (1 - down / 100);
      var mr = rate / 100 / 12;
      var mort = mr > 0
        ? (loan * mr * Math.pow(1 + mr, TERM)) / (Math.pow(1 + mr, TERM) - 1)
        : loan / TERM;
      var noiMonthly = NOI_FACTOR * rent;
      var cash = noiMonthly - mort;
      var capRate = ((noiMonthly * 12) / VALUE) * 100;
      var cashIn = VALUE * (down / 100) + VALUE * CLOSING;
      var coc = ((cash * 12) / cashIn) * 100;

      outMort.textContent = money(mort);
      outCap.textContent = capRate.toFixed(1) + "%";
      outCoc.textContent = coc.toFixed(1) + "%";

      outCash.textContent = signed(cash);
      outCash.classList.toggle("pos", cash >= 0);
      outCash.classList.toggle("neg", cash < 0);

      var yr = Math.round(cash) * 12;
      outCashYr.textContent =
        (yr < 0 ? "-$" : "$") + Math.abs(yr).toLocaleString("en-US") + " / year";
    }

    ["input", "change"].forEach(function (ev) {
      dpDown.addEventListener(ev, calc);
      dpRate.addEventListener(ev, calc);
      dpRent.addEventListener(ev, calc);
    });
    calc();
  }

  /* ---------- Waitlist form ---------- */
  var form = document.getElementById("waitlistForm");
  if (form) {
    var emailEl = document.getElementById("wl_email");
    var hpEl = document.getElementById("wl_company");
    var statusEl = document.getElementById("wlStatus");
    var btn = document.getElementById("wlSubmit");
    var sending = false;
    var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    function setStatus(msg, kind) {
      statusEl.textContent = msg;
      statusEl.className = "wl-form__status" + (kind ? " is-" + kind : "");
    }

    /* Optional bot protection: only loads Cloudflare Turnstile if a sitekey
       is configured. With no sitekey, no third-party script is pulled in. */
    var siteKey = (form.getAttribute("data-turnstile-sitekey") || "").trim();
    var tsBox = document.getElementById("wlTurnstile");
    if (siteKey && tsBox) {
      tsBox.className += " cf-turnstile";
      tsBox.setAttribute("data-sitekey", siteKey);
      var ts = document.createElement("script");
      ts.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
      ts.async = true; ts.defer = true;
      document.head.appendChild(ts);
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (sending) return;

      /* Honeypot: bots fill hidden fields. Silently accept, never send. */
      if (hpEl && hpEl.value) { setStatus("You're on the list.", "ok"); form.reset(); return; }

      var email = (emailEl.value || "").trim();
      if (!EMAIL_RE.test(email) || email.length > 120) {
        setStatus("Please enter a valid email address.", "err");
        emailEl.focus();
        return;
      }

      /* Client-side throttle: one try per 20s, on top of any server limit. */
      var now = Date.now();
      var last = +(localStorage.getItem("wl_last") || 0);
      if (now - last < 20000) {
        setStatus("Just a moment, try again in a few seconds.", "err");
        return;
      }

      var endpoint = (form.getAttribute("data-endpoint") || "").trim();

      /* No backend configured → open the user's own mail client. Zero
         server-side attack surface; the static site never receives a POST. */
      if (!endpoint) {
        localStorage.setItem("wl_last", String(now));
        var subject = encodeURIComponent("Add me to the Fintley waitlist");
        var body = encodeURIComponent("Please add this email to the Fintley launch waitlist: " + email);
        setStatus("Opening your email app to confirm…", "ok");
        window.location.href = "mailto:hello@fintley.app?subject=" + subject + "&body=" + body;
        return;
      }

      /* Backend mode: the endpoint MUST enforce its own rate limiting and
         verify the Turnstile token. We send no credentials and no secrets. */
      sending = true;
      btn.disabled = true;
      setStatus("Adding you…");
      var token = (window.turnstile && siteKey) ? window.turnstile.getResponse() : "";
      var ctrl = new AbortController();
      var timer = setTimeout(function () { ctrl.abort(); }, 12000);

      fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email, token: token, source: "fintley.app" }),
        signal: ctrl.signal,
        mode: "cors",
        credentials: "omit"
      })
        .then(function (r) {
          clearTimeout(timer);
          if (!r.ok) throw new Error("bad");
          localStorage.setItem("wl_last", String(now));
          setStatus("You're on the list. We'll email you the moment Fintley launches.", "ok");
          form.reset();
          if (window.turnstile && siteKey) try { window.turnstile.reset(); } catch (e2) {}
        })
        .catch(function () {
          clearTimeout(timer);
          setStatus("Hmm, that didn't go through. Email hello@fintley.app and we'll add you.", "err");
        })
        .then(function () { sending = false; btn.disabled = false; });
    });
  }
})();
