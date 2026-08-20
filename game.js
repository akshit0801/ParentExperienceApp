// game.js — "Could You Pass Your Kid's Class?"
// State machine: goTo(n) shows screen n (0-8) and runs its onEnter hook.
// Screens: 0 title, 1 worry, 2 round1, 3 round2, 4 round3, 5 round4, 6 score, 7 reflection, 8 close.
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
const brandLogo = document.getElementById("brand-logo");

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
const SCREEN_NAMES = ["title", "worry", "round1", "round2", "round3", "round4", "score", "reflection", "close"];
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
window.handleImgError = function (imgEl, emoji) {
  const div = document.createElement("div");
  div.className = imgEl.className.replace(/\bcard-img\b/, "").trim() + " img-fallback";
  div.style.cssText = "display:flex;align-items:center;justify-content:center;font-size:40px;width:100%;height:100%;";
  div.textContent = emoji;
  imgEl.replaceWith(div);
};
function imgTag(src, emoji, cls) {
  return `<img src="${encodeURI(src)}" class="${cls}" onerror="handleImgError(this,'${emoji}')" alt="">`;
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
  if (state.current < 6) goTo(6);
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
    fill.classList.toggle("urgent", remaining <= 4);
    if (remaining <= 4 && remaining > 0 && Math.floor(remaining * 2) !== Math.floor((remaining + 0.1) * 2)) sfx.tick();
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
  const roundForScreen = { 2: 0, 3: 1, 4: 2, 5: 3 };
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
  const colors = ["#FFC24B", "#6C5CE7", "#8B7CFF", "#34D399", "#FB7185"];
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
      ${imgTag(ASSETS.skaiLogo, "✨", "hero-logo")}
      <div class="eyebrow">SKAI Space</div>
      <h1 class="title-hero">${TITLE.title}</h1>
      <p class="subtitle">${TITLE.subtitle}</p>
      <div class="grow"></div>
      <button class="btn btn-amber" id="s0-cta" style="width:100%;">${TITLE.cta}</button>
    </div>`;
}
function attachScreen0(el) {
  el.querySelector("#s0-cta").addEventListener("click", () => {
    sfx.click();
    state = { responses: {}, roundScore: 0, current: 0 };
    sessionId = makeSessionId();
    sessionEnded = false;
    trackEvent("session_start", "title", { referrer: document.referrer || null });
    startSessionTimer();
    goTo(1);
  });
}

// ----- Screen 1 · The honest question (capture #1) -------------------------
function renderScreen1() {
  const opts = WORRY_Q.options
    .map((o) => `<button class="option-btn" data-id="${o.id}">${o.label}</button>`)
    .join("");
  return `
    <div class="screen-content">
      <div class="card glass-tile">
        <p>${WORRY_Q.emoji} ${WORRY_Q.prompt}</p>
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
      setTimeout(() => goTo(2), 1200);
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
    return `<div class="portrait-card glass-tile" data-kind="${kind}">${imgTag(src, "🧑", "card-img")}</div>`;
  };
  return `
    <div class="screen-content">
      <div class="round-banner">
        <span>${ROUND1.banner}</span>
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
    goTo(3);
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
        <span>${ROUND2.banner}</span>
        <div class="timer-ring-wrap">
          <svg viewBox="0 0 44 44"><circle class="timer-ring-track" cx="22" cy="22" r="18"/><circle class="timer-ring-fill" cx="22" cy="22" r="18"/></svg>
          <div class="timer-ring-num">${ROUND2.timerSeconds}</div>
        </div>
      </div>
      <div class="shop-card glass-tile">
        ${imgTag(ASSETS.fakeDealProduct, "🛍️", "card-img")}
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
    goTo(4);
  });
  // cosmetic countdown to sell the "manufactured urgency" — purely decorative
  let secs = 179;
  const countdownEl = el.querySelector("#r2-countdown");
  const cosmetic = setInterval(() => {
    if (state.responses.r2 || !document.body.contains(el)) return clearInterval(cosmetic);
    secs = secs > 0 ? secs - 1 : 179;
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    countdownEl.textContent = `⏰ ${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
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
        <span>${ROUND3.banner}</span>
        <div class="timer-ring-wrap">
          <svg viewBox="0 0 44 44"><circle class="timer-ring-track" cx="22" cy="22" r="18"/><circle class="timer-ring-fill" cx="22" cy="22" r="18"/></svg>
          <div class="timer-ring-num">${ROUND3.timerSeconds}</div>
        </div>
      </div>
      <div class="tutor-avatar-wrap">${imgTag(ASSETS.aiTutorAvatar, "🤖", "")}</div>
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
    goTo(5);
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
        <span>${ROUND4.banner}</span>
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
    goTo(6);
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
        <div class="skill-emoji">${r.missionLink.emoji}</div>
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
    goTo(7);
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
        <p>${REFLECTION_Q.emoji} ${REFLECTION_Q.prompt}</p>
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
    goTo(8);
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
      <h2 class="finale-headline">🎉 ${CLOSE.headline}</h2>
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
    if (CLOSE.missionListUrl && CLOSE.missionListUrl !== "#") window.open(CLOSE.missionListUrl, "_blank");
  });
  el.querySelector("#s8-replay").addEventListener("click", () => {
    sfx.click();
    resetGame();
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
   State machine
   ========================================================================= */
const SCREEN_DEFS = [
  { render: renderScreen0, attach: attachScreen0, bg: "hero" },
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
  buildAllScreens();
  goTo(0);
}

/* =========================================================================
   Top bar wiring (logo, timer, voice toggle — all top-right)
   ========================================================================= */
function initTopbar() {
  brandLogo.src = encodeURI(ASSETS.skaiLogo);
  brandLogo.onerror = () => (brandLogo.outerHTML = "<span style='font-weight:800;color:var(--accent);'>SKAI</span>");
  updateSessionDisplay();
  voiceBtn.addEventListener("click", () => {
    sfx.click();
    voiceMuted = !voiceMuted;
    voiceBtn.textContent = voiceMuted ? "🔇" : "🔊";
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
