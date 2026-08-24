// game.js — "Could You Pass Your Kid's Class?"
// State machine: goTo(n) shows screen n (0-9) and runs its onEnter hook.
// Screens: 0 title, 1 details, 2 worry, 3 round1, 4 round2, 5 round3, 6 round4, 7 score, 8 reflection, 9 close.
// All game state lives in the in-memory `state` object below — no localStorage/sessionStorage.
// Usage analytics (session_start/question_answered/session_complete/session_closed) are posted
// to Supabase — see the "Usage analytics" block below and supabase/schema.sql for the table + RLS.

const WEBHOOK_URL = ""; // optional POST target for the reflection screen — left empty, fails silently.
const SESSION_SECONDS = 180; // 3-minute overall timer shown top-right.

let state = { responses: {}, roundScore: 0, current: 0 };

const appEl = document.getElementById("app");
const pipsEl = document.getElementById("pips");
const voiceBtn = document.getElementById("voice-btn");
const sessionTimerEl = document.getElementById("session-timer");
const sessionTimerText = sessionTimerEl.querySelector("span");

/* =========================================================================
   Icon library — hand-built line icons (no emoji), all single-colour via
   currentColor so they inherit whatever text colour their container sets.
   ========================================================================= */
const ICONS = {
  volumeOn:
    '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>',
  volumeOff:
    '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>',
  play:
    '<svg class="icon" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="6 3 20 12 6 21 6 3"></polygon></svg>',
  chevronDown:
    '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>',
  close:
    '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>',
  search:
    '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>',
  eye:
    '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>',
  chat:
    '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>',
  code:
    '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>',
  user:
    '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>',
  bag:
    '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path><path d="M3 6h18"></path><path d="M16 10a4 4 0 0 1-8 0"></path></svg>',
  target:
    '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>',
  check:
    '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>',
  helpCircle:
    '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
  bot:
    '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v3"></path><rect x="4" y="7" width="16" height="13" rx="3"></rect><line x1="9" y1="13" x2="9" y2="14"></line><line x1="15" y1="13" x2="15" y2="14"></line><path d="M4 13H2"></path><path d="M22 13h-2"></path></svg>',
  sparkle:
    '<svg class="icon" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2z"></path></svg>',
};

let screenEls = [];
let activeRoundTimer = null;
let sessionInterval = null;
let sessionRemaining = SESSION_SECONDS;
let voiceMuted = false;
let currentAudioFile = null;

/* =========================================================================
   Usage analytics — anonymous, append-only events posted straight to
   Supabase. Uses only the public "publishable" key (safe to expose — it is
   locked to INSERT-only via a Row Level Security policy, see
   supabase/schema.sql). No secret keys, no server, no localStorage: the
   session id lives only in memory for the current playthrough.
   ========================================================================= */
const SUPABASE_URL = "https://bdjyrgnwedpkrrclzxwe.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_h-ZVHHb7WXe-XimcyaKdCA_YQwAAL1I";
const ANALYTICS_ENDPOINT = `${SUPABASE_URL}/rest/v1/game_events`;
const SCREEN_NAMES = ["title", "details", "worry", "round1", "round2", "round3", "round4", "score", "reflection", "close"];
const ROUND_SCREEN_NAMES = { 1: "round1", 2: "round2", 3: "round3", 4: "round4" };

let sessionId = null;
let sessionEnded = false;

function makeSessionId() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function trackEvent(eventType, screen, payload) {
  if (!sessionId) return;
  fetch(ANALYTICS_ENDPOINT, {
    method: "POST",
    keepalive: true, // survives page unload — used for the session_closed beacon
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      session_id: sessionId,
      event_type: eventType,
      screen: screen || null,
      payload: payload || {},
      user_agent: navigator.userAgent,
    }),
  }).catch(() => {});
}

function trackSessionClosed() {
  if (!sessionId || sessionEnded) return;
  sessionEnded = true;
  trackEvent("session_closed", SCREEN_NAMES[state.current] || null, {
    ...state.responses,
    screenIndex: state.current,
  });
}
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") trackSessionClosed();
});
window.addEventListener("pagehide", trackSessionClosed);

/* =========================================================================
   Sound effects — synthesized with WebAudio, no files required.
   ========================================================================= */
let audioCtx = null;
function ensureAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === "suspended") audioCtx.resume();
}
function beep({ freq = 440, duration = 0.08, type = "sine", gain = 0.15, freqEnd = null }) {
  try {
    ensureAudio();
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    if (freqEnd) osc.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 1), audioCtx.currentTime + duration);
    g.gain.value = gain;
    g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
    osc.connect(g).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration + 0.02);
  } catch (e) {
    /* audio unsupported — game continues silently */
  }
}
const sfx = {
  click: () => beep({ freq: 600, duration: 0.05, type: "triangle", gain: 0.12 }),
  correct: () => {
    beep({ freq: 660, duration: 0.1, type: "sine", gain: 0.18 });
    setTimeout(() => beep({ freq: 880, duration: 0.15, type: "sine", gain: 0.18 }), 90);
  },
  wrong: () => beep({ freq: 200, duration: 0.28, type: "sawtooth", gain: 0.1, freqEnd: 80 }),
  whoosh: () => beep({ freq: 220, duration: 0.3, type: "sine", gain: 0.09, freqEnd: 660 }),
  tick: () => beep({ freq: 900, duration: 0.03, type: "square", gain: 0.05 }),
  celebrate: () => [0, 90, 180, 270].forEach((d, i) => setTimeout(() => beep({ freq: 520 + i * 110, duration: 0.13, type: "sine", gain: 0.15 }), d)),
};

/* =========================================================================
   Narrator voice — prefers a matching mp3 in "Voice assets/", falls back to
   the browser's built-in speech synthesis. Toggled by the voice button.
   ========================================================================= */
function stopNarration() {
  if (currentAudioFile) {
    currentAudioFile.pause();
    currentAudioFile = null;
  }
  if ("speechSynthesis" in window) speechSynthesis.cancel();
}
function fallbackSpeak(text) {
  if (voiceMuted || !("speechSynthesis" in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 0.98;
  u.pitch = 1.0;
  const voices = speechSynthesis.getVoices();
  const preferred =
    voices.find((v) => /en/i.test(v.lang) && /female/i.test(v.name)) || voices.find((v) => /en/i.test(v.lang));
  if (preferred) u.voice = preferred;
  speechSynthesis.speak(u);
}
function speakLine(id) {
  if (voiceMuted) return;
  stopNarration();
  const text = NARRATION[id];
  if (!text) return;
  const audio = new Audio(encodeURI(`Voice assets/${id}.mp3`));
  currentAudioFile = audio;
  audio.addEventListener("canplaythrough", () => audio.play().catch(() => fallbackSpeak(text)));
  audio.addEventListener("error", () => fallbackSpeak(text));
  audio.load();
}

/* =========================================================================
   Image helper — degrades to an emoji if a file is missing/unloadable.
   ========================================================================= */
window.handleImgError = function (imgEl, iconKey) {
  const div = document.createElement("div");
  div.className = imgEl.className.replace(/\bcard-img\b/, "").trim() + " img-fallback";
  div.innerHTML = ICONS[iconKey] || ICONS.sparkle;
  imgEl.replaceWith(div);
};
function imgTag(src, iconKey, cls) {
  return `<img src="${encodeURI(src)}" class="${cls}" onerror="handleImgError(this,'${iconKey}')" alt="">`;
}

/* =========================================================================
   Monochrome ✓ / ✗ badge — functional indicator, distinct from the
   colourful "kidish" emoji used for skill/round branding.
   ========================================================================= */
function monoBadge(isGood) {
  return `<span class="mono-badge ${isGood ? "good" : "bad"}">${isGood ? "✓" : "✗"}</span>`;
}

/* =========================================================================
   Session timer — 3:00 countdown, top-right. Never blocks; on expiry it
   gently locks any unanswered rounds and jumps to the reveal.
   ========================================================================= */
function updateSessionDisplay() {
  const clamped = Math.max(sessionRemaining, 0);
  const m = Math.floor(clamped / 60);
  const s = clamped % 60;
  sessionTimerText.textContent = `${m}:${String(s).padStart(2, "0")}`;
  sessionTimerEl.classList.toggle("low", clamped <= 30);
}
function startSessionTimer() {
  clearInterval(sessionInterval);
  sessionRemaining = SESSION_SECONDS;
  updateSessionDisplay();
  sessionInterval = setInterval(() => {
    sessionRemaining--;
    updateSessionDisplay();
    if (sessionRemaining <= 0) {
      clearInterval(sessionInterval);
      handleSessionTimeout();
    }
  }, 1000);
}
function handleSessionTimeout() {
  if (!state.responses.r1) recordRoundAnswer(1, null, false, SESSION_SECONDS * 1000);
  if (!state.responses.r2) recordRoundAnswer(2, null, false, SESSION_SECONDS * 1000);
  if (!state.responses.r3) recordRoundAnswer(3, null, false, SESSION_SECONDS * 1000);
  if (!state.responses.r4) recordRoundAnswer(4, null, false, SESSION_SECONDS * 1000);
  if (state.current < 7) goTo(7);
}

/* =========================================================================
   Round ring timer — reusable ~15-20s countdown ring. A slow tap never
   fails; on expiry it auto-locks a guess so the round always resolves.
   ========================================================================= */
function startRingTimer(screenEl, seconds, onExpire) {
  const fill = screenEl.querySelector(".timer-ring-fill");
  const num = screenEl.querySelector(".timer-ring-num");
  const circumference = 2 * Math.PI * 18;
  fill.style.strokeDasharray = `${circumference}`;
  let remaining = seconds;
  const start = performance.now();
  num.textContent = remaining;
  const tick = () => {
    const elapsed = (performance.now() - start) / 1000;
    remaining = Math.max(seconds - elapsed, 0);
    const ratio = remaining / seconds;
    fill.style.strokeDashoffset = `${circumference * (1 - ratio)}`;
    num.textContent = Math.ceil(remaining);
    const isUrgent = remaining <= seconds * 0.25;
    const isWarn = !isUrgent && remaining <= seconds * 0.5;
    fill.classList.toggle("warn", isWarn);
    fill.classList.toggle("urgent", isUrgent);
    num.classList.toggle("warn", isWarn);
    num.classList.toggle("urgent", isUrgent);
    if (isUrgent && remaining > 0 && Math.floor(remaining * 2) !== Math.floor((remaining + 0.1) * 2)) sfx.tick();
    if (remaining <= 0) {
      clearInterval(activeRoundTimer.interval);
      onExpire(Math.round(seconds * 1000));
    }
  };
  const interval = setInterval(tick, 100);
  tick();
  activeRoundTimer = { interval, elapsedMs: () => Math.round(performance.now() - start) };
  return activeRoundTimer;
}
function stopRingTimer() {
  if (activeRoundTimer) {
    clearInterval(activeRoundTimer.interval);
    activeRoundTimer = null;
  }
}

/* =========================================================================
   Response bookkeeping
   ========================================================================= */
function recordRoundAnswer(roundNum, choice, correct, ms) {
  state.responses["r" + roundNum] = { choice, correct, ms };
  if (correct) state.roundScore++;
  updatePips();
  trackEvent("question_answered", ROUND_SCREEN_NAMES[roundNum], { choice, correct, ms, auto: choice === null });
}

/* =========================================================================
   Progress pips (4-segment, top bar centre) — one per round.
   ========================================================================= */
function updatePips() {
  const roundForScreen = { 3: 0, 4: 1, 5: 2, 6: 3 };
  const pips = pipsEl.querySelectorAll(".pip");
  pips.forEach((pip, i) => {
    const answered = !!state.responses["r" + (i + 1)];
    pip.classList.toggle("done", answered);
    pip.classList.toggle("active", roundForScreen[state.current] === i && !answered);
  });
}

/* =========================================================================
   Confetti burst (finale screen)
   ========================================================================= */
function burstConfetti(container) {
  const colors = ["#D9A954", "#F1D9A4", "#FFFFFF", "#B9A4FF"];
  for (let i = 0; i < 26; i++) {
    const piece = document.createElement("div");
    piece.className = "confetti-piece";
    piece.style.left = Math.random() * 100 + "%";
    piece.style.background = colors[i % colors.length];
    piece.style.animationDuration = 1.6 + Math.random() * 1.2 + "s";
    piece.style.animationDelay = Math.random() * 0.4 + "s";
    container.appendChild(piece);
    setTimeout(() => piece.remove(), 3200);
  }
}

/* =========================================================================
   Screen builders — each returns an HTML string for its .screen div.
   ========================================================================= */

// ----- Screen 0 · Title ---------------------------------------------------
function renderScreen0() {
  return `
    <div class="screen-content center">
      <div class="grow"></div>
      ${imgTag(ASSETS.skaiLogo, "sparkle", "hero-logo")}
      <div class="eyebrow">SKAI Space</div>
      <h1 class="title-hero">${TITLE.title}</h1>
      <p class="subtitle">${TITLE.subtitle}</p>
      <div class="grow"></div>
      <button class="btn btn-amber" id="s0-cta" style="width:100%;">${ICONS.play} ${TITLE.cta}</button>
    </div>`;
}
function attachScreen0(el) {
  el.querySelector("#s0-cta").addEventListener("click", () => {
    sfx.click();
    state = { responses: {}, roundScore: 0, current: 0 };
    sessionId = makeSessionId();
    sessionEnded = false;
    trackEvent("session_start", "title", { referrer: document.referrer || null });
    goTo(1);
  });
}

// ----- Screen 1 · Parent details (capture #1) -------------------------------
function renderScreenDetails() {
  const stateOptions = INDIA_GEO.map((s) => `<option value="${s.state}">${s.state}</option>`).join("");
  const gradeOptions = GRADE_OPTIONS.map((g) => `<option value="${g}">${g}</option>`).join("");
  return `
    <div class="screen-content">
      <div class="card glass-tile details-card">
        <div class="eyebrow">${DETAILS_Q.eyebrow}</div>
        <h2>${DETAILS_Q.title}</h2>
        <p class="subtitle">${DETAILS_Q.sub}</p>
        <div class="field">
          <label for="d-name">${DETAILS_Q.fields.name.label}</label>
          <input type="text" id="d-name" placeholder="${DETAILS_Q.fields.name.placeholder}" autocomplete="name">
        </div>
        <div class="field">
          <label for="d-grade">${DETAILS_Q.fields.grade.label}</label>
          <select id="d-grade">
            <option value="" disabled selected>${DETAILS_Q.fields.grade.placeholder}</option>
            ${gradeOptions}
          </select>
        </div>
        <div class="field">
          <label for="d-phone">${DETAILS_Q.fields.phone.label}</label>
          <div class="phone-input-wrap">
            <span class="phone-prefix">+91</span>
            <input type="tel" id="d-phone" inputmode="numeric" maxlength="10" placeholder="${DETAILS_Q.fields.phone.placeholder}" autocomplete="tel-national">
          </div>
          <span class="field-hint" id="d-phone-hint">${DETAILS_Q.phoneHint}</span>
        </div>
        <div class="field-row">
          <div class="field">
            <label for="d-state">${DETAILS_Q.fields.state.label}</label>
            <select id="d-state">
              <option value="" disabled selected>${DETAILS_Q.fields.state.placeholder}</option>
              ${stateOptions}
            </select>
          </div>
          <div class="field">
            <label for="d-city">${DETAILS_Q.fields.city.label}</label>
            <select id="d-city" disabled>
              <option value="" disabled selected>${DETAILS_Q.fields.city.placeholder}</option>
            </select>
          </div>
        </div>
      </div>
      <button class="btn btn-amber" id="sd-cta" disabled style="width:100%;">${DETAILS_Q.cta}</button>
    </div>`;
}
function attachScreenDetails(el) {
  const nameInput = el.querySelector("#d-name");
  const gradeSelect = el.querySelector("#d-grade");
  const phoneInput = el.querySelector("#d-phone");
  const phoneHint = el.querySelector("#d-phone-hint");
  const stateSelect = el.querySelector("#d-state");
  const citySelect = el.querySelector("#d-city");
  const ctaBtn = el.querySelector("#sd-cta");

  function validate() {
    const phoneDigits = phoneInput.value.replace(/\D/g, "");
    const phoneOk = phoneDigits.length === 10;
    const allOk = nameInput.value.trim().length > 0 && !!gradeSelect.value && phoneOk && !!stateSelect.value && !!citySelect.value;
    phoneHint.classList.toggle("valid", phoneOk);
    phoneHint.classList.toggle("invalid", phoneInput.value.length > 0 && !phoneOk);
    ctaBtn.disabled = !allOk;
    return allOk;
  }

  nameInput.addEventListener("input", validate);
  gradeSelect.addEventListener("change", validate);
  phoneInput.addEventListener("input", () => {
    phoneInput.value = phoneInput.value.replace(/\D/g, "").slice(0, 10);
    validate();
  });
  stateSelect.addEventListener("change", () => {
    const found = INDIA_GEO.find((s) => s.state === stateSelect.value);
    citySelect.innerHTML =
      `<option value="" disabled selected>${DETAILS_Q.fields.city.placeholder}</option>` +
      (found ? found.cities.map((c) => `<option value="${c}">${c}</option>`).join("") : "");
    citySelect.disabled = !found;
    validate();
  });
  citySelect.addEventListener("change", validate);

  ctaBtn.addEventListener("click", () => {
    if (!validate()) return;
    sfx.click();
    state.responses.details = {
      name: nameInput.value.trim(),
      grade: gradeSelect.value,
      phone: "+91" + phoneInput.value,
      state: stateSelect.value,
      city: citySelect.value,
    };
    trackEvent("question_answered", "details", state.responses.details);
    sessionId = sessionId || makeSessionId();
    startSessionTimer();
    goTo(2);
  });
}
function onEnterScreenDetails() {
  speakLine("s_details_prompt");
}

// ----- Screen 1 · The honest question (capture #1) -------------------------
function renderScreen1() {
  const opts = WORRY_Q.options
    .map((o) => `<button class="option-btn" data-id="${o.id}">${o.label}</button>`)
    .join("");
  return `
    <div class="screen-content">
      <div class="card glass-tile">
        <div class="eyebrow">${WORRY_Q.eyebrow}</div>
        <p>${WORRY_Q.prompt}</p>
        <div class="option-list">${opts}</div>
      </div>
      <div class="aha-box hidden" id="s1-ack">${WORRY_Q.ack}</div>
    </div>`;
}
function attachScreen1(el) {
  const buttons = el.querySelectorAll(".option-btn");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      sfx.click();
      buttons.forEach((b) => (b.disabled = true));
      btn.classList.add("correct");
      state.responses.worry = btn.dataset.id;
      trackEvent("question_answered", "worry", { choice: btn.dataset.id });
      el.querySelector("#s1-ack").classList.remove("hidden");
      speakLine("s_worry_ack");
      setTimeout(() => goTo(3), 1200);
    });
  });
}
function onEnterScreen1() {
  speakLine("s_worry_prompt");
}

// ----- Screen 2 · Round 1 · Real or AI? (capture #2) ------------------------
let round1Order = null;
function renderScreen2() {
  if (!round1Order) {
    round1Order = Math.random() < 0.5 ? ["real", "aiFake"] : ["aiFake", "real"];
  }
  const cardHtml = (kind) => {
    const src = kind === "real" ? ASSETS.realPortrait : ASSETS.aiFakePortrait;
    return `<div class="portrait-card glass-tile" data-kind="${kind}">${imgTag(src, "user", "card-img")}</div>`;
  };
  return `
    <div class="screen-content">
      <div class="round-banner">
        <span class="round-banner-icon">${ICONS[ROUND1.iconKey]}</span>
        <span class="round-banner-label">${ROUND1.banner}</span>
        <div class="timer-ring-wrap">
          <svg viewBox="0 0 44 44"><circle class="timer-ring-track" cx="22" cy="22" r="18"/><circle class="timer-ring-fill" cx="22" cy="22" r="18"/></svg>
          <div class="timer-ring-num">${ROUND1.timerSeconds}</div>
        </div>
      </div>
      <p>${ROUND1.prompt}</p>
      <div class="portrait-row">${round1Order.map(cardHtml).join("")}</div>
      <p class="reveal-caption hidden" id="r1-caption">${ROUND1.captionOnFake}</p>
      <div class="aha-box hidden" id="r1-aha">${ROUND1.aha}</div>
      <button class="btn btn-amber hidden" id="r1-next" style="width:100%;">Next round →</button>
    </div>`;
}
function attachScreen2(el) {
  const cards = el.querySelectorAll(".portrait-card");
  let selectedCard = null;
  function resolve(kind, ms) {
    stopRingTimer();
    const correct = kind === "aiFake";
    cards.forEach((c) => {
      c.style.pointerEvents = "none";
      if (c.dataset.kind === "aiFake") {
        c.classList.add("correct");
        c.insertAdjacentHTML("beforeend", monoBadge(true));
      } else if (c === selectedCard) {
        c.classList.add("wrong");
        c.insertAdjacentHTML("beforeend", monoBadge(false));
      }
    });
    el.querySelector("#r1-caption").classList.remove("hidden");
    el.querySelector("#r1-aha").classList.remove("hidden");
    el.querySelector("#r1-next").classList.remove("hidden");
    correct ? sfx.correct() : sfx.wrong();
    speakLine(correct ? "s_r1_reveal_correct" : "s_r1_reveal_wrong");
    recordRoundAnswer(1, kind, correct, ms);
  }
  cards.forEach((card) => {
    card.addEventListener("click", () => {
      if (state.responses.r1) return;
      sfx.click();
      selectedCard = card;
      resolve(card.dataset.kind, activeRoundTimer ? activeRoundTimer.elapsedMs() : 0);
    });
  });
  el.querySelector("#r1-next").addEventListener("click", () => {
    sfx.whoosh();
    goTo(4);
  });
}
function onEnterScreen2(el) {
  speakLine("s_r1_prompt");
  startRingTimer(el, ROUND1.timerSeconds, () => {
    const cards = el.querySelectorAll(".portrait-card");
    const randomPick = cards[Math.floor(Math.random() * cards.length)];
    randomPick.click();
  });
}

// ----- Screen 3 · Round 2 · Spot the Trap (capture #3) ----------------------
function renderScreen3() {
  const opts = ROUND2.options
    .map((o) => `<button class="option-btn glass-tile" data-id="${o.id}" data-correct="${o.correct}">${o.label}</button>`)
    .join("");
  const stars = "★★★★★";
  const reviews = Array.from({ length: ROUND2.card.reviews })
    .map(() => `<div class="reveal-caption">${stars} “Great deal, ordered instantly!”</div>`)
    .join("");
  return `
    <div class="screen-content">
      <div class="round-banner">
        <span class="round-banner-icon">${ICONS[ROUND2.iconKey]}</span>
        <span class="round-banner-label">${ROUND2.banner}</span>
        <div class="timer-ring-wrap">
          <svg viewBox="0 0 44 44"><circle class="timer-ring-track" cx="22" cy="22" r="18"/><circle class="timer-ring-fill" cx="22" cy="22" r="18"/></svg>
          <div class="timer-ring-num">${ROUND2.timerSeconds}</div>
        </div>
      </div>
      <div class="shop-card glass-tile">
        ${imgTag(ASSETS.fakeDealProduct, "bag", "card-img")}
        <div class="shop-badge">${ROUND2.card.urgency}</div>
        <div class="shop-timer" id="r2-countdown">${ROUND2.card.countdown}</div>
        <div class="shop-body">
          <div class="shop-price-row">
            <span class="shop-mrp">${ROUND2.card.mrp}</span>
            <span class="shop-price">${ROUND2.card.price}</span>
          </div>
          <div class="shop-stars">${stars} (312)</div>
        </div>
      </div>
      ${reviews}
      <p>${ROUND2.prompt}</p>
      <div class="option-list">${opts}</div>
      <p class="reveal-caption hidden" id="r2-reveal">${ROUND2.reveal}</p>
      <button class="btn btn-amber hidden" id="r2-next" style="width:100%;">Next round →</button>
    </div>`;
}
function attachScreen3(el) {
  const buttons = el.querySelectorAll(".option-btn");
  function resolve(choiceId, ms) {
    stopRingTimer();
    const chosen = ROUND2.options.find((o) => o.id === choiceId);
    const correct = !!(chosen && chosen.correct);
    buttons.forEach((b) => {
      b.disabled = true;
      if (b.dataset.correct === "true") {
        b.classList.add("correct");
        b.insertAdjacentHTML("beforeend", monoBadge(true));
      } else if (b.dataset.id === choiceId) {
        b.classList.add("wrong");
        b.insertAdjacentHTML("beforeend", monoBadge(false));
      }
    });
    el.querySelector("#r2-reveal").classList.remove("hidden");
    el.querySelector("#r2-next").classList.remove("hidden");
    correct ? sfx.correct() : sfx.wrong();
    speakLine("s_r2_reveal");
    recordRoundAnswer(2, choiceId, correct, ms);
  }
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (state.responses.r2) return;
      sfx.click();
      resolve(btn.dataset.id, activeRoundTimer ? activeRoundTimer.elapsedMs() : 0);
    });
  });
  el.querySelector("#r2-next").addEventListener("click", () => {
    sfx.whoosh();
    goTo(5);
  });
  // cosmetic countdown to sell the "manufactured urgency" — purely decorative
  let secs = 179;
  const countdownEl = el.querySelector("#r2-countdown");
  const cosmetic = setInterval(() => {
    if (state.responses.r2 || !document.body.contains(el)) return clearInterval(cosmetic);
    secs = secs > 0 ? secs - 1 : 179;
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    countdownEl.textContent = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }, 1000);
}
function onEnterScreen3(el) {
  speakLine("s_r2_prompt");
  startRingTimer(el, ROUND2.timerSeconds, () => {
    const buttons = el.querySelectorAll(".option-btn");
    buttons[Math.floor(Math.random() * buttons.length)].click();
  });
}

// ----- Screen 4 · Round 3 · Talk to the Machine (capture #4) ----------------
function renderScreen4() {
  const opts = ROUND3.options
    .map((o) => `<button class="option-btn glass-tile" data-id="${o.id}">${o.label}</button>`)
    .join("");
  return `
    <div class="screen-content">
      <div class="round-banner">
        <span class="round-banner-icon">${ICONS[ROUND3.iconKey]}</span>
        <span class="round-banner-label">${ROUND3.banner}</span>
        <div class="timer-ring-wrap">
          <svg viewBox="0 0 44 44"><circle class="timer-ring-track" cx="22" cy="22" r="18"/><circle class="timer-ring-fill" cx="22" cy="22" r="18"/></svg>
          <div class="timer-ring-num">${ROUND3.timerSeconds}</div>
        </div>
      </div>
      <div class="tutor-avatar-wrap">${imgTag(ASSETS.aiTutorAvatar, "bot", "")}</div>
      <p>${ROUND3.setup}</p>
      <div class="option-list" id="r3-options">${opts}</div>
      <div class="chat-reply-box" id="r3-chat"></div>
      <div class="aha-box hidden" id="r3-aha">${ROUND3.aha}</div>
      <button class="btn btn-amber hidden" id="r3-next" style="width:100%;">Next round →</button>
    </div>`;
}
function attachScreen4(el) {
  const buttons = el.querySelectorAll(".option-btn");
  const chatBox = el.querySelector("#r3-chat");
  function resolve(choiceId, ms) {
    stopRingTimer();
    const chosen = ROUND3.options.find((o) => o.id === choiceId);
    const correct = !!(chosen && chosen.correct);
    buttons.forEach((b) => {
      b.disabled = true;
      if (b.dataset.id === choiceId) {
        b.classList.add(correct ? "correct" : "wrong");
        b.insertAdjacentHTML("beforeend", monoBadge(correct));
      }
    });
    chatBox.innerHTML = `<div class="chat-bubble-user">${chosen.label}</div><div class="typing-dots"><span></span><span></span><span></span></div>`;
    setTimeout(() => {
      chatBox.innerHTML = `<div class="chat-bubble-user">${chosen.label}</div><div class="chat-bubble-ai">${chosen.reply}</div>`;
      el.querySelector("#r3-aha").classList.remove("hidden");
      el.querySelector("#r3-next").classList.remove("hidden");
      correct ? sfx.correct() : sfx.wrong();
      speakLine("s_r3_aha");
    }, 700);
    recordRoundAnswer(3, choiceId, correct, ms);
  }
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (state.responses.r3) return;
      sfx.click();
      resolve(btn.dataset.id, activeRoundTimer ? activeRoundTimer.elapsedMs() : 0);
    });
  });
  el.querySelector("#r3-next").addEventListener("click", () => {
    sfx.whoosh();
    goTo(6);
  });
}
function onEnterScreen4(el) {
  speakLine("s_r3_prompt");
  startRingTimer(el, ROUND3.timerSeconds, () => {
    const buttons = el.querySelectorAll(".option-btn");
    buttons[Math.floor(Math.random() * buttons.length)].click();
  });
}

// ----- Screen 5 · Round 4 · Bug Hunt (capture #5) ---------------------------
function renderScreen5() {
  const stepsHtml = ROUND4.steps
    .map((s, i) => `<div class="step-row"><span class="step-num">${i + 1}</span>${s}</div>`)
    .join("");
  const opts = ROUND4.options
    .map((o) => `<button class="option-btn glass-tile" data-id="${o.id}" data-correct="${o.correct}">${o.label}</button>`)
    .join("");
  return `
    <div class="screen-content">
      <div class="round-banner">
        <span class="round-banner-icon">${ICONS[ROUND4.iconKey]}</span>
        <span class="round-banner-label">${ROUND4.banner}</span>
        <div class="timer-ring-wrap">
          <svg viewBox="0 0 44 44"><circle class="timer-ring-track" cx="22" cy="22" r="18"/><circle class="timer-ring-fill" cx="22" cy="22" r="18"/></svg>
          <div class="timer-ring-num">${ROUND4.timerSeconds}</div>
        </div>
      </div>
      <p>${ROUND4.setup}</p>
      <div class="steps-card glass-tile">${stepsHtml}</div>
      <div class="option-list">${opts}</div>
      <p class="reveal-caption hidden" id="r4-reveal">${ROUND4.reveal}</p>
      <div class="aha-box hidden" id="r4-aha">${ROUND4.aha}</div>
      <button class="btn btn-amber hidden" id="r4-next" style="width:100%;">See your result →</button>
    </div>`;
}
function attachScreen5(el) {
  const buttons = el.querySelectorAll(".option-btn");
  function resolve(choiceId, ms) {
    stopRingTimer();
    const chosen = ROUND4.options.find((o) => o.id === choiceId);
    const correct = !!(chosen && chosen.correct);
    buttons.forEach((b) => {
      b.disabled = true;
      if (b.dataset.correct === "true") {
        b.classList.add("correct");
        b.insertAdjacentHTML("beforeend", monoBadge(true));
      } else if (b.dataset.id === choiceId) {
        b.classList.add("wrong");
        b.insertAdjacentHTML("beforeend", monoBadge(false));
      }
    });
    el.querySelector("#r4-reveal").classList.remove("hidden");
    el.querySelector("#r4-aha").classList.remove("hidden");
    el.querySelector("#r4-next").classList.remove("hidden");
    correct ? sfx.correct() : sfx.wrong();
    speakLine("s_r4_reveal");
    recordRoundAnswer(4, choiceId, correct, ms);
  }
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (state.responses.r4) return;
      sfx.click();
      resolve(btn.dataset.id, activeRoundTimer ? activeRoundTimer.elapsedMs() : 0);
    });
  });
  el.querySelector("#r4-next").addEventListener("click", () => {
    sfx.whoosh();
    goTo(7);
  });
}
function onEnterScreen5(el) {
  speakLine("s_r4_prompt");
  startRingTimer(el, ROUND4.timerSeconds, () => {
    const buttons = el.querySelectorAll(".option-btn");
    buttons[Math.floor(Math.random() * buttons.length)].click();
  });
}

// ----- Screen 6 · The reveal — score + skill map ----------------------------
function renderScreen6() {
  const rounds = [ROUND1, ROUND2, ROUND3, ROUND4];
  const rows = rounds
    .map(
      (r) => `
      <div class="skill-row glass-tile" data-round="${r.missionLink.title}">
        <div class="skill-icon">${ICONS[r.missionLink.iconKey]}</div>
        <div>
          <div class="skill-title">${r.missionLink.title}</div>
          <div class="skill-subject">${r.missionLink.subject}</div>
          <div class="skill-line">${r.missionLink.line}</div>
        </div>
      </div>`
    )
    .join("");
  return `
    <div class="screen-content">
      <div class="grow" style="flex:0;"></div>
      <div class="card glass-tile" style="text-align:center;">
        <div class="score-icon">${ICONS.target}</div>
        <div class="score-big" id="s6-score">You scored 0 / ${SCORE_MAX}.</div>
        <div class="score-headline" id="s6-headline"></div>
        <p class="reveal-caption" style="margin-top:10px;">${SCORE_REASSURANCE}</p>
      </div>
      ${rows}
      <p class="footer-note">${SKILL_MAP_FOOTER}</p>
      <button class="btn btn-amber" id="s6-continue" style="width:100%;">Continue →</button>
    </div>`;
}
function attachScreen6(el) {
  el.querySelectorAll(".skill-row").forEach((row) => row.addEventListener("click", () => sfx.click()));
  el.querySelector("#s6-continue").addEventListener("click", () => {
    sfx.whoosh();
    goTo(8);
  });
}
function onEnterScreen6(el) {
  const score = state.roundScore;
  const band = SCORE_BANDS.find((b) => score >= b.min && score <= b.max) || SCORE_BANDS[0];
  el.querySelector("#s6-score").textContent = `You scored ${score} / ${SCORE_MAX}.`;
  el.querySelector("#s6-headline").textContent = band.headline;
  speakLine("s_score");
}

// ----- Screen 7 · Reflection (capture #6) -----------------------------------
function renderScreen7() {
  const opts = REFLECTION_Q.options
    .map((o) => `<button class="option-btn glass-tile" data-id="${o.id}">${o.label}</button>`)
    .join("");
  return `
    <div class="screen-content">
      <div class="card glass-tile">
        <div class="eyebrow">${REFLECTION_Q.eyebrow}</div>
        <p>${REFLECTION_Q.prompt}</p>
        <div class="option-list">${opts}</div>
      </div>
      <button class="btn btn-amber hidden" id="s7-continue" style="width:100%;">Continue →</button>
    </div>`;
}
function attachScreen7(el) {
  const buttons = el.querySelectorAll(".option-btn");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      sfx.click();
      buttons.forEach((b) => (b.disabled = true));
      btn.classList.add("correct");
      state.responses.reflection = btn.dataset.id;
      state.responses.score = state.roundScore;
      state.responses.ts = new Date().toISOString();
      sendResults();
      trackEvent("question_answered", "reflection", { choice: btn.dataset.id });
      trackEvent("session_complete", "reflection", state.responses);
      sessionEnded = true;
      el.querySelector("#s7-continue").classList.remove("hidden");
    });
  });
  el.querySelector("#s7-continue").addEventListener("click", () => {
    sfx.whoosh();
    goTo(9);
  });
}
function onEnterScreen7() {
  speakLine("s_reflection_prompt");
}
function sendResults() {
  if (!WEBHOOK_URL) return;
  fetch(WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(state.responses),
  }).catch(() => {});
}

// ----- Screen 8 · Close ------------------------------------------------------
function renderScreen8() {
  return `
    <div class="screen-content center" id="s8-container" style="position:relative;overflow:hidden;">
      <div class="grow"></div>
      <h2 class="finale-headline">${CLOSE.headline}</h2>
      <p class="subtitle">${CLOSE.sub}</p>
      <div class="grow"></div>
      <button class="btn btn-amber" id="s8-primary" style="width:100%;">${CLOSE.ctaPrimary}</button>
      <button class="btn btn-ghost" id="s8-replay" style="width:100%;">${CLOSE.ctaSecondary}</button>
      <button class="link-text" id="s8-share">${CLOSE.ctaShare}</button>
    </div>`;
}
function attachScreen8(el) {
  el.querySelector("#s8-primary").addEventListener("click", () => {
    sfx.click();
    openMissionModal();
  });
  el.querySelector("#s8-replay").addEventListener("click", () => {
    sfx.click();
    openKidGame();
  });
  el.querySelector("#s8-share").addEventListener("click", () => {
    sfx.click();
    const text = `${CLOSE.shareMessage} ${location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  });
}
function onEnterScreen8(el) {
  sfx.celebrate();
  speakLine("s_close");
  burstConfetti(el.querySelector("#s8-container"));
}

/* =========================================================================
   Mission map sheet — the full grade-by-grade mission list, opened from the
   close screen's "See the full mission list" CTA. Rendered natively (rather
   than an embedded PDF) so it stays fast and legible on a phone screen.
   ========================================================================= */
function renderMissionModal() {
  const gradesHtml = MISSION_MAP.map(
    (g) => `
      <div class="mm-grade" data-grade="${g.grade}">
        <button class="mm-grade-head">
          <span>Grade ${g.grade}</span>
          <span class="mm-grade-count">${g.units.length} units${ICONS.chevronDown}</span>
        </button>
        <div class="mm-grade-body">
          <div class="mm-grade-units">
            ${g.units
              .map(
                (u, i) => `
              <div class="mm-unit">
                <div class="mm-unit-domain">${i + 1}. ${u.domain}</div>
                <div class="mm-unit-row"><span class="mm-tag">Self-paced</span><span class="mm-unit-name">${u.self}</span><span class="mm-skill">${u.selfSkill}</span></div>
                <div class="mm-unit-row"><span class="mm-tag mm-tag-group">Group · ${u.groupType === "D" ? "digital" : "kit"}</span><span class="mm-unit-name">${u.group}</span><span class="mm-skill">${u.groupSkill}</span></div>
              </div>`
              )
              .join("")}
          </div>
        </div>
      </div>`
  ).join("");
  return `
    <div class="mm-overlay" id="mission-modal">
      <div class="mm-sheet">
        <div class="mm-header">
          <div>
            <div class="mm-title">${MISSION_MAP_META.title}</div>
            <div class="mm-sub">${MISSION_MAP_META.sub}</div>
          </div>
          <button class="mm-close" id="mm-close-btn" aria-label="Close">${ICONS.close}</button>
        </div>
        <div class="mm-body">${gradesHtml}</div>
      </div>
    </div>`;
}
function closeMissionModal(modal) {
  modal.classList.remove("open");
  setTimeout(() => modal.remove(), 260);
}
function openMissionModal() {
  const wrap = document.createElement("div");
  wrap.innerHTML = renderMissionModal();
  const modal = wrap.firstElementChild;
  document.getElementById("phone").appendChild(modal);
  requestAnimationFrame(() => modal.classList.add("open"));
  modal.querySelector("#mm-close-btn").addEventListener("click", () => closeMissionModal(modal));
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeMissionModal(modal);
  });
  modal.querySelectorAll(".mm-grade-head").forEach((head) => {
    head.addEventListener("click", () => {
      sfx.click();
      head.parentElement.classList.toggle("expanded");
    });
  });
  const chosenGrade = state.responses.details && state.responses.details.grade;
  const gradeNum = chosenGrade && chosenGrade.match(/\d+/);
  const match = gradeNum && modal.querySelector(`.mm-grade[data-grade="${gradeNum[0]}"]`);
  if (match) {
    match.classList.add("expanded");
    setTimeout(() => match.scrollIntoView({ block: "start", behavior: "smooth" }), 320);
  }
  trackEvent("mission_list_opened", SCREEN_NAMES[state.current] || null, {});
}

/* =========================================================================
   Kids mini-game · "Can You Spot the Fake AI?" — opened from the close
   screen's "Your child's turn" button. Self-contained mini state machine
   (its own KG_STEPS array + kgGoTo) so it doesn't disturb the parent flow's
   screen/pip/session-timer bookkeeping. Reuses existing components (glass
   tiles, timer ring, sfx, confetti, ICONS) rather than inventing new ones.
   ========================================================================= */
let kgState = { step: 0, deck: null, deckIndex: 0, answers: {}, challengeResolved: false };

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// One-card-at-a-time swipe deck: drag right = Real, drag left = Fake, or
// tap a button (Fake / Not sure / Real) below — buttons are the only way to
// answer "Not sure" since there's no natural swipe direction for it, and
// they also make the whole interaction reachable without touch/drag.
function kgSetupSwipeCard(card, onAnswer) {
  const stampReal = card.querySelector(".kg-stamp-real");
  const stampFake = card.querySelector(".kg-stamp-fake");
  const threshold = 90;
  let dragging = false;
  let startX = 0;
  let startY = 0;
  let dx = 0;

  function onPointerDown(e) {
    dragging = true;
    startX = e.clientX;
    startY = e.clientY;
    card.style.transition = "none";
    card.setPointerCapture(e.pointerId);
  }
  function onPointerMove(e) {
    if (!dragging) return;
    dx = e.clientX - startX;
    const dy = e.clientY - startY;
    card.style.transform = `translate(${dx}px, ${dy * 0.15}px) rotate(${dx / 18}deg)`;
    stampReal.style.opacity = Math.max(0, Math.min(1, dx / threshold));
    stampFake.style.opacity = Math.max(0, Math.min(1, -dx / threshold));
  }
  function onPointerUp() {
    if (!dragging) return;
    dragging = false;
    card.style.transition = "transform 260ms ease, opacity 260ms ease";
    if (dx > threshold) flyAway("real");
    else if (dx < -threshold) flyAway("fake");
    else {
      card.style.transform = "";
      stampReal.style.opacity = 0;
      stampFake.style.opacity = 0;
    }
    dx = 0;
  }
  function flyAway(answer) {
    if (card._kgAnswered) return;
    card._kgAnswered = true;
    card.removeEventListener("pointerdown", onPointerDown);
    card.removeEventListener("pointermove", onPointerMove);
    card.removeEventListener("pointerup", onPointerUp);
    card.removeEventListener("pointercancel", onPointerUp);
    card.style.transition = "transform 260ms ease, opacity 260ms ease";
    if (answer === "real") card.style.transform = "translate(520px, -40px) rotate(24deg)";
    else if (answer === "fake") card.style.transform = "translate(-520px, -40px) rotate(-24deg)";
    else card.style.transform = "translate(0, -60px) scale(0.7)";
    card.style.opacity = "0";
    setTimeout(() => onAnswer(answer), 220);
  }
  card.addEventListener("pointerdown", onPointerDown);
  card.addEventListener("pointermove", onPointerMove);
  card.addEventListener("pointerup", onPointerUp);
  card.addEventListener("pointercancel", onPointerUp);
  card._kgFlyAway = flyAway;
}

function kgStepIntro() {
  return `
    <div class="grow"></div>
    <div class="eyebrow">${KID_GAME.intro.eyebrow}</div>
    <h1 class="title-hero">${KID_GAME.intro.title}</h1>
    <p class="subtitle">${KID_GAME.intro.sub}</p>
    <div class="grow"></div>
    <button class="btn btn-amber" id="kg-start" style="width:100%;">${ICONS.play} ${KID_GAME.intro.cta}</button>`;
}
function kgAttachIntro(body) {
  body.querySelector("#kg-start").addEventListener("click", () => {
    sfx.click();
    trackEvent("kid_game_started", "kid_intro", {});
    kgGoTo(1);
  });
}

function kgStepChallenge() {
  if (!kgState.deck) {
    kgState.deck = shuffleArray(KID_GAME.challenge.images.slice());
    kgState.deckIndex = 0;
    kgState.answers = {};
  }
  const cards = kgState.deck
    .map(
      (img, i) => `
      <div class="kg-swipe-card glass-tile" style="z-index:${kgState.deck.length - i};">
        <img src="${encodeURI(img.src)}" onerror="handleImgError(this,'user')" alt="">
        <div class="kg-stamp kg-stamp-real">REAL</div>
        <div class="kg-stamp kg-stamp-fake">FAKE</div>
      </div>`
    )
    .join("");
  return `
    <div class="round-banner">
      <span class="round-banner-icon">${ICONS[KID_GAME.challenge.iconKey]}</span>
      <span class="round-banner-label">${KID_GAME.challenge.banner}</span>
      <div class="timer-ring-wrap">
        <svg viewBox="0 0 44 44"><circle class="timer-ring-track" cx="22" cy="22" r="18"/><circle class="timer-ring-fill" cx="22" cy="22" r="18"/></svg>
        <div class="timer-ring-num">${KID_GAME.challenge.timerSeconds}</div>
      </div>
    </div>
    <p>${KID_GAME.challenge.instructions}</p>
    <div class="kg-progress" id="kg-progress">Picture 1 of ${kgState.deck.length}</div>
    <div class="kg-deck">${cards}</div>
    <p class="kg-swipe-hint">Swipe the picture, or tap a button</p>
    <div class="kg-swipe-actions">
      <button class="kg-action-btn kg-action-fake" data-answer="fake">${ICONS.close}<span>Fake</span></button>
      <button class="kg-action-btn kg-action-confused" data-answer="confused">${ICONS.helpCircle}<span>Not sure</span></button>
      <button class="kg-action-btn kg-action-real" data-answer="real">${ICONS.check}<span>Real</span></button>
    </div>`;
}
function kgAttachChallenge(body) {
  kgState.challengeResolved = false;
  const cards = Array.from(body.querySelectorAll(".kg-swipe-card"));
  const progressEl = body.querySelector("#kg-progress");

  function updateProgress() {
    progressEl.textContent = `Picture ${Math.min(kgState.deckIndex + 1, cards.length)} of ${cards.length}`;
  }
  function finishChallenge(timedOut) {
    if (kgState.challengeResolved) return;
    kgState.challengeResolved = true;
    stopRingTimer();
    const score = kgState.deck.filter((img) => kgState.answers[img.id] === (img.isFake ? "fake" : "real")).length;
    trackEvent("kid_game_answered", "kid_challenge", {
      answers: kgState.answers,
      score,
      scoreMax: KID_GAME.scoreMax,
      timedOut: !!timedOut,
    });
    score === KID_GAME.scoreMax ? sfx.correct() : sfx.wrong();
    setTimeout(() => kgGoTo(2), timedOut ? 0 : 300);
  }
  function wireCard(index) {
    kgSetupSwipeCard(cards[index], (answer) => {
      if (kgState.challengeResolved) return;
      kgState.answers[kgState.deck[index].id] = answer;
      kgState.deckIndex = index + 1;
      if (kgState.deckIndex >= cards.length) finishChallenge(false);
      else {
        updateProgress();
        wireCard(kgState.deckIndex);
      }
    });
  }
  body.querySelectorAll(".kg-action-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (kgState.challengeResolved || kgState.deckIndex >= cards.length) return;
      sfx.click();
      const card = cards[kgState.deckIndex];
      if (card._kgFlyAway) card._kgFlyAway(btn.dataset.answer);
    });
  });
  updateProgress();
  wireCard(kgState.deckIndex);
  body._kgFinish = finishChallenge;
}
function kgOnEnterChallenge(overlay, body) {
  startRingTimer(body, KID_GAME.challenge.timerSeconds, () => {
    while (kgState.deckIndex < kgState.deck.length) {
      kgState.answers[kgState.deck[kgState.deckIndex].id] = "confused";
      kgState.deckIndex++;
    }
    if (body._kgFinish) body._kgFinish(true);
  });
}

function kgStepReveal() {
  const deck = kgState.deck;
  const score = deck.filter((img) => kgState.answers[img.id] === (img.isFake ? "fake" : "real")).length;
  const confusedCount = deck.filter((img) => kgState.answers[img.id] === "confused").length;
  const band = KID_GAME.scoreBands.find((b) => score >= b.min && score <= b.max) || KID_GAME.scoreBands[0];
  const rows = deck
    .map((img) => {
      const answer = kgState.answers[img.id];
      const correctAnswer = img.isFake ? "fake" : "real";
      let tag, mark;
      if (answer === "confused") {
        tag = img.isFake ? "AI · you weren't sure" : "Real · you weren't sure";
        mark = "muted";
      } else if (answer === correctAnswer) {
        tag = img.isFake ? "AI · you caught it!" : "Real · you got it!";
        mark = "good";
      } else {
        tag = img.isFake ? "AI · you missed this one" : "Real · false alarm";
        mark = "bad";
      }
      return `
        <div class="kg-reveal-row glass-tile">
          <img src="${encodeURI(img.src)}" class="kg-reveal-thumb" onerror="handleImgError(this,'user')" alt="">
          <div>
            <div class="kg-reveal-tag ${img.isFake ? "fake" : "real"}">${tag}</div>
            <div class="kg-reveal-note">${img.explain}</div>
          </div>
          <div class="kg-mark ${mark}">${mark === "bad" ? "✗" : mark === "muted" ? "?" : "✓"}</div>
        </div>`;
    })
    .join("");
  return `
    <div class="card glass-tile" style="text-align:center;">
      <div class="score-icon">${ICONS.target}</div>
      <div class="score-big">You got ${score} of ${deck.length} right${confusedCount ? `, unsure on ${confusedCount}` : ""}.</div>
      <div class="score-headline">${band.headline}</div>
      <p class="reveal-caption" style="margin-top:10px;">${KID_GAME.reassurance}</p>
    </div>
    ${rows}
    <div class="aha-box">${KID_GAME.aha}</div>
    <button class="btn btn-amber" id="kg-reveal-next" style="width:100%;">Next →</button>`;
}
function kgAttachReveal(body) {
  body.querySelector("#kg-reveal-next").addEventListener("click", () => {
    sfx.whoosh();
    kgGoTo(3);
  });
}

function kgStepCfu() {
  const opts = KID_GAME.cfu.options.map((o) => `<button class="option-btn glass-tile" data-id="${o.id}">${o.label}</button>`).join("");
  return `
    <div class="card glass-tile">
      <div class="eyebrow">${KID_GAME.cfu.eyebrow}</div>
      <p>${KID_GAME.cfu.prompt}</p>
      <div class="option-list">${opts}</div>
    </div>`;
}
function kgAttachCfu(body) {
  const buttons = body.querySelectorAll(".option-btn");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      sfx.click();
      buttons.forEach((b) => (b.disabled = true));
      btn.classList.add("correct");
      trackEvent("kid_game_cfu", "kid_cfu", { choice: btn.dataset.id });
      setTimeout(() => kgGoTo(4), 900);
    });
  });
}

function kgStepClose() {
  return `
    <div class="grow"></div>
    <h2 class="finale-headline">${KID_GAME.close.headline}</h2>
    <p class="subtitle">${KID_GAME.close.sub}</p>
    <div class="grow"></div>
    <button class="btn btn-amber" id="kg-done" style="width:100%;">${KID_GAME.close.cta}</button>`;
}
function kgAttachClose(body) {
  body.querySelector("#kg-done").addEventListener("click", () => {
    sfx.click();
    closeKidGame();
  });
}
function kgOnEnterClose(overlay, body) {
  sfx.celebrate();
  burstConfetti(overlay);
}

const KG_STEPS = [
  { render: kgStepIntro, attach: kgAttachIntro, center: true },
  { render: kgStepChallenge, attach: kgAttachChallenge, onEnter: kgOnEnterChallenge, center: false },
  { render: kgStepReveal, attach: kgAttachReveal, center: false },
  { render: kgStepCfu, attach: kgAttachCfu, center: false },
  { render: kgStepClose, attach: kgAttachClose, onEnter: kgOnEnterClose, center: true },
];

let kgOverlayEl = null;

function kgGoTo(n) {
  stopRingTimer();
  kgState.step = n;
  const overlay = kgOverlayEl;
  if (!overlay) return;
  const body = overlay.querySelector(".kg-body");
  const def = KG_STEPS[n];
  body.className = "kg-body screen-content" + (def.center ? " center" : "");
  body.innerHTML = def.render();
  def.attach(body);
  if (def.onEnter) def.onEnter(overlay, body);
  body.scrollTop = 0;
}

function closeKidGame() {
  stopRingTimer();
  const overlay = kgOverlayEl;
  if (!overlay) return;
  kgOverlayEl = null;
  overlay.classList.remove("open");
  setTimeout(() => overlay.remove(), 260);
}

function openKidGame() {
  kgState = { step: 0, deck: null, deckIndex: 0, answers: {}, challengeResolved: false };
  const wrap = document.createElement("div");
  wrap.innerHTML = `
    <div class="kg-overlay">
      <button class="kg-close" id="kg-close-btn" aria-label="Close">${ICONS.close}</button>
      <div class="kg-body screen-content center"></div>
    </div>`;
  const overlay = wrap.firstElementChild;
  kgOverlayEl = overlay;
  document.getElementById("phone").appendChild(overlay);
  overlay.querySelector("#kg-close-btn").addEventListener("click", () => {
    sfx.click();
    closeKidGame();
  });
  requestAnimationFrame(() => overlay.classList.add("open"));
  kgGoTo(0);
}

/* =========================================================================
   State machine
   ========================================================================= */
const SCREEN_DEFS = [
  { render: renderScreen0, attach: attachScreen0, bg: "hero" },
  { render: renderScreenDetails, attach: attachScreenDetails, onEnter: onEnterScreenDetails, bg: "ambient" },
  { render: renderScreen1, attach: attachScreen1, onEnter: onEnterScreen1, bg: "ambient" },
  { render: renderScreen2, attach: attachScreen2, onEnter: onEnterScreen2, bg: "ambient" },
  { render: renderScreen3, attach: attachScreen3, onEnter: onEnterScreen3, bg: "ambient" },
  { render: renderScreen4, attach: attachScreen4, onEnter: onEnterScreen4, bg: "ambient" },
  { render: renderScreen5, attach: attachScreen5, onEnter: onEnterScreen5, bg: "ambient" },
  { render: renderScreen6, attach: attachScreen6, onEnter: onEnterScreen6, bg: "ambient" },
  { render: renderScreen7, attach: attachScreen7, onEnter: onEnterScreen7, bg: "ambient" },
  { render: renderScreen8, attach: attachScreen8, onEnter: onEnterScreen8, bg: "finale" },
];

function buildAllScreens() {
  round1Order = null;
  appEl.innerHTML = "";
  screenEls = SCREEN_DEFS.map((def, i) => {
    const div = document.createElement("div");
    div.className = `screen screen-bg-${def.bg}`;
    div.id = `screen-${i}`;
    div.innerHTML = def.render();
    appEl.appendChild(div);
    def.attach(div);
    return div;
  });
}

function goTo(n) {
  stopRingTimer();
  state.current = n;
  screenEls.forEach((el, i) => el.classList.toggle("active", i === n));
  updatePips();
  const def = SCREEN_DEFS[n];
  if (def.onEnter) def.onEnter(screenEls[n]);
  window.scrollTo(0, 0);
}

function resetGame() {
  clearInterval(sessionInterval);
  stopNarration();
  state = { responses: {}, roundScore: 0, current: 0 };
  sessionId = null;
  sessionEnded = false;
  sessionRemaining = SESSION_SECONDS;
  updateSessionDisplay();
  buildAllScreens();
  goTo(0);
}

/* =========================================================================
   Top bar wiring (logo, timer, voice toggle — all top-right)
   ========================================================================= */
function updateVoiceIcon() {
  voiceBtn.innerHTML = voiceMuted ? ICONS.volumeOff : ICONS.volumeOn;
}
function initTopbar() {
  updateSessionDisplay();
  updateVoiceIcon();
  voiceBtn.addEventListener("click", () => {
    sfx.click();
    voiceMuted = !voiceMuted;
    updateVoiceIcon();
    voiceBtn.classList.toggle("muted", voiceMuted);
    if (voiceMuted) stopNarration();
  });
}

/* =========================================================================
   Background image variables (with graceful fallback if a file is missing)
   ========================================================================= */
function setBgVars() {
  const root = document.documentElement;
  root.style.setProperty("--hero-url", `url("${encodeURI(ASSETS.heroTitleBg)}")`);
  root.style.setProperty("--ambient-url", `url("${encodeURI(ASSETS.ambientBg)}")`);
  root.style.setProperty("--finale-url", `url("${encodeURI(ASSETS.finaleBg)}")`);
}

/* =========================================================================
   Boot
   ========================================================================= */
function boot() {
  setBgVars();
  initTopbar();
  buildAllScreens();
  goTo(0);
  if ("speechSynthesis" in window) speechSynthesis.getVoices();
}
document.addEventListener("DOMContentLoaded", boot);
