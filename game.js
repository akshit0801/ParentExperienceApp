// game.js — "Could You Pass Your Kid's Class?"
// State machine: goTo(n) shows screen n (0-8) and runs its onEnter hook.
// Screens: 0 title, 1 details, 2 worry (popup), 3 challenge1 intro, 4 challenge1,
// 5 challenge2, 6 score, 7 reflection, 8 close.
// All game state lives in the in-memory `state` object below — no localStorage/sessionStorage.
// Usage analytics (session_start/question_answered/session_complete/session_closed) are posted
// to Supabase — see the "Usage analytics" block below and supabase/schema.sql for the table + RLS.

const WEBHOOK_URL = ""; // optional POST target for the reflection screen — left empty, fails silently.

let state = { responses: {}, roundScore: 0, current: 0 };

const appEl = document.getElementById("app");
const pipsEl = document.getElementById("pips");
const backBtn = document.getElementById("back-btn");

/* =========================================================================
   Icon library — hand-built line icons (no emoji), all single-colour via
   currentColor so they inherit whatever text colour their container sets.
   ========================================================================= */
const ICONS = {
  chevronDown:
    '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>',
  chevronLeft:
    '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>',
  close:
    '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>',
  search:
    '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>',
  eye:
    '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>',
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
  sparkle:
    '<svg class="icon" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2z"></path></svg>',
};

let screenEls = [];
let activeRoundTimer = null;

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
const SCREEN_NAMES = ["title", "details", "worry", "challenge1_intro", "round1", "round2", "score", "reflection", "close"];
const ROUND_SCREEN_NAMES = { 1: "round1", 2: "round2" };

let sessionId = null;
let sessionEnded = false;

function makeSessionId() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

/* =========================================================================
   School + salesperson attribution — read once from ?school=CODE (e.g.
   ?school=DPS_NOIDA) on load. The code is only ever used to look up a
   matching row in the `schools` table (see supabase/schema.sql); nothing
   from the URL is stored or sent anywhere directly. A missing/malformed/
   unknown/inactive code silently resolves to "no attribution" — parents and
   teachers are never asked about school or salesperson. Once resolved,
   the school_id/salesperson_id are cached in sessionStorage so a same-tab
   refresh keeps attribution without the URL needing to still carry it, and
   trackEvent() below stamps them onto every analytics event automatically.
   ========================================================================= */
const SCHOOL_ATTRIBUTION_KEY = "kg_school_attribution_v1";
const SCHOOL_CODE_PATTERN = /^[A-Z0-9_-]{2,40}$/;

function readStoredAttribution() {
  try {
    const raw = sessionStorage.getItem(SCHOOL_ATTRIBUTION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}
function writeStoredAttribution(attr) {
  try {
    if (attr) sessionStorage.setItem(SCHOOL_ATTRIBUTION_KEY, JSON.stringify(attr));
    else sessionStorage.removeItem(SCHOOL_ATTRIBUTION_KEY);
  } catch (e) {
    /* storage unavailable (e.g. private mode) — attribution just won't survive a refresh */
  }
}
async function resolveAttribution() {
  const rawCode = new URLSearchParams(window.location.search).get("school");
  if (!rawCode) return readStoredAttribution(); // no param this load — keep whatever was already resolved

  const code = rawCode.trim().toUpperCase();
  if (!SCHOOL_CODE_PATTERN.test(code)) {
    writeStoredAttribution(null);
    return null;
  }
  try {
    const url = `${SUPABASE_URL}/rest/v1/schools?school_code=eq.${encodeURIComponent(code)}&is_active=eq.true&select=id,salesperson_id`;
    const res = await fetch(url, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    });
    const rows = res.ok ? await res.json() : [];
    if (!Array.isArray(rows) || rows.length !== 1) {
      writeStoredAttribution(null);
      return null;
    }
    const attr = { school_id: rows[0].id, salesperson_id: rows[0].salesperson_id || null };
    writeStoredAttribution(attr);
    return attr;
  } catch (e) {
    writeStoredAttribution(null);
    return null;
  }
}
let attribution = null;
const attributionReady = resolveAttribution().then((a) => {
  attribution = a;
});

function trackEvent(eventType, screen, payload) {
  if (!sessionId) return;
  const sid = sessionId;
  attributionReady.finally(() => {
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
        session_id: sid,
        event_type: eventType,
        screen: screen || null,
        payload: payload || {},
        user_agent: navigator.userAgent,
        school_id: attribution ? attribution.school_id : null,
        salesperson_id: attribution ? attribution.salesperson_id : null,
      }),
    }).catch(() => {});
  });
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
   Sound effects — synthesized with WebAudio, no files required. Short UI
   confirmation sounds only — no spoken narration anywhere in the app.
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
   Image helper — degrades to an icon if a file is missing/unloadable.
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
   Mission card — the "your child learns this" payoff. Deliberately used
   twice: inline the moment a challenge ends (so the good news lands right
   after the sting, not 4 screens later), then again as a lighter recap on
   the score screen. Collapsed it names the mission; tapping it opens what
   the child actually does in that mission.
   ========================================================================= */
function missionCardHTML(missionLink, opts) {
  const o = opts || {};
  return `
    <div class="mission-card${o.compact ? " mission-card--compact" : ""}" data-mission="${missionLink.name}">
      <button class="mission-head" type="button" aria-expanded="false">
        <span class="skill-icon">${ICONS[missionLink.iconKey]}</span>
        <span class="mission-text">
          <span class="mission-eyebrow">${o.eyebrow || missionLink.subject}</span>
          <span class="skill-title">${o.heading || missionLink.name}</span>
          <span class="skill-line">${missionLink.line}</span>
          <span class="mission-hint">${MISSION_REVEAL.hint}</span>
        </span>
        <span class="mission-chevron">${ICONS.chevronDown}</span>
      </button>
      <div class="mission-body">
        <div class="mission-detail">
          <div class="mission-detail-inner">
            <div class="mission-detail-label">${MISSION_REVEAL.detailLabel}</div>
            <p class="mission-detail-text">${missionLink.detail || missionLink.line}</p>
          </div>
        </div>
      </div>
    </div>`;
}

// Nudges an element's own scroll container just far enough to show all of
// it. Used after a card expands so the detail never opens below the fold.
function keepInView(el) {
  const scroller = el.closest(".screen-content, .mm-body, .kg-body");
  if (!scroller) return;
  const over = el.getBoundingClientRect().bottom - scroller.getBoundingClientRect().bottom;
  if (over > 0) scroller.scrollBy({ top: over + 16, behavior: "smooth" });
}

// Wires every not-yet-wired mission card under `root` for tap-to-expand.
function wireMissionCards(root) {
  root.querySelectorAll(".mission-card").forEach((card) => {
    const head = card.querySelector(".mission-head");
    if (head._wired) return;
    head._wired = true;
    head.addEventListener("click", () => {
      sfx.click();
      const open = !card.classList.contains("expanded");
      card.classList.toggle("expanded", open);
      head.setAttribute("aria-expanded", String(open));
      if (open) {
        setTimeout(() => keepInView(card), 280); // after the 0fr→1fr panel opens
        trackEvent("mission_card_expanded", SCREEN_NAMES[state.current] || null, { mission: card.dataset.mission });
      }
    });
  });
}

// Drops the reveal card into a challenge screen's slot and fades it in.
function revealMissionInline(slotEl, missionLink) {
  slotEl.innerHTML = missionCardHTML(missionLink, { eyebrow: MISSION_REVEAL.eyebrow, heading: missionLink.name });
  wireMissionCards(slotEl);
  // Two frames: the first lays the slot out in its faded-out state, the
  // second starts the transition (one frame would skip the fade).
  requestAnimationFrame(() => requestAnimationFrame(() => slotEl.classList.add("visible")));
  // The card and the "next" button are the last things on the screen, so
  // scrolling to the end brings the whole reveal into view at once.
  const scroller = slotEl.closest(".screen-content");
  if (scroller) setTimeout(() => scroller.scrollTo({ top: scroller.scrollHeight, behavior: "smooth" }), 220);
  trackEvent("mission_reveal_shown", SCREEN_NAMES[state.current] || null, { mission: missionLink.name });
}

/* =========================================================================
   Ring timer — reusable countdown ring shared by both challenges. A slow
   tap never fails; on expiry it auto-locks a guess so it always resolves.
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
function recordChallenge1Result(score, answers, timedOut) {
  state.responses.r1 = { score, scoreMax: CHALLENGE1.scoreMax, answers, timedOut };
  state.roundScore += score;
  updatePips();
  trackEvent("question_answered", ROUND_SCREEN_NAMES[1], { score, scoreMax: CHALLENGE1.scoreMax, answers, timedOut });
}

/* =========================================================================
   Progress pips (2-segment, top bar centre) — one per challenge.
   ========================================================================= */
function updatePips() {
  const roundForScreen = { 4: 0, 5: 1 };
  // The pips track progress through the two challenges, so they'd be
  // meaningless anywhere else — on the title screen no round has started,
  // and the pip pair would sit alone in the corner (the back button is
  // hidden there, so space-between pushes them hard left).
  pipsEl.classList.toggle("hidden", !(state.current in roundForScreen));
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
  const colors = ["#FFC24B", "#F1D9A4", "#FFFFFF", "#3EC6E0"];
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

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/* =========================================================================
   Screen builders — each returns an HTML string for its .screen div.
   ========================================================================= */

// ----- Screen 0 · Title ---------------------------------------------------
function renderTitle() {
  return `
    <div class="screen-content center">
      <div class="grow"></div>
      ${imgTag(ASSETS.skaiLogo, "sparkle", "hero-logo")}
      <div class="eyebrow">SKAI Space</div>
      <h1 class="title-hero">${TITLE.title}</h1>
      <p class="subtitle">${TITLE.subtitle}</p>
      <div class="grow"></div>
      <p class="title-cue">${TITLE.cue}</p>
      <button class="btn btn-amber" id="s0-cta" style="width:100%;">${TITLE.cta}</button>
    </div>`;
}
function attachTitle(el) {
  el.querySelector("#s0-cta").addEventListener("click", () => {
    sfx.click();
    state = { responses: {}, roundScore: 0, current: 0 };
    sessionId = makeSessionId();
    sessionEnded = false;
    // Screens are built once and reused (their attach() closures hold
    // per-playthrough state like "confirmed"/"selected"). The back button
    // makes it possible to return here and start over mid-session, so a
    // full rebuild is required — otherwise other screens would still think
    // their old answers/timers are live even though `state` was just reset.
    buildAllScreens();
    trackEvent("session_start", "title", { referrer: document.referrer || null });
    goTo(1);
  });
}

// ----- Screen 1 · Parent details — name + grade only (capture #1) ---------
function renderDetails() {
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
      </div>
      <button class="btn btn-amber" id="sd-cta" disabled style="width:100%;">${DETAILS_Q.cta}</button>
    </div>`;
}
function attachDetails(el) {
  const nameInput = el.querySelector("#d-name");
  const gradeSelect = el.querySelector("#d-grade");
  const ctaBtn = el.querySelector("#sd-cta");

  function validate() {
    const allOk = nameInput.value.trim().length > 0 && !!gradeSelect.value;
    ctaBtn.disabled = !allOk;
    return allOk;
  }

  nameInput.addEventListener("input", validate);
  gradeSelect.addEventListener("change", validate);

  ctaBtn.addEventListener("click", () => {
    if (!validate()) return;
    sfx.click();
    state.responses.details = {
      name: nameInput.value.trim(),
      grade: gradeSelect.value,
    };
    trackEvent("question_answered", "details", state.responses.details);
    sessionId = sessionId || makeSessionId();
    goTo(2);
  });
}

// ----- Screen 2 · The honest question — shown as a pop-up (capture #2) ----
// Two states on one screen. First the question card (eyebrow + prompt +
// options + confirm); once they confirm, that card gives way to a single
// acknowledgement card which carries the forward action itself. The
// reassurance never sits in the options area, so it cannot read as a
// fifth, disabled choice.
function renderWorry() {
  const opts = WORRY_Q.options
    .map((o) => `<button class="option-btn" data-id="${o.id}">${o.label}</button>`)
    .join("");
  return `
    <div class="popup-scrim"></div>
    <div class="screen-content center">
      <div class="card glass-tile" id="wq-question">
        <div class="eyebrow">${WORRY_Q.eyebrow}</div>
        <p>${WORRY_Q.prompt}</p>
        <div class="option-list" id="wq-options">${opts}</div>
        <button class="btn btn-amber" id="wq-continue" disabled style="width:100%;margin-top:14px;">${WORRY_Q.cta}</button>
      </div>
      <div class="card glass-tile ack-card hidden" id="wq-ack">
        <p class="ack-card-text">${WORRY_Q.ack}</p>
        <button class="btn btn-amber" id="wq-ack-cta" style="width:100%;">${WORRY_Q.ackCta}</button>
      </div>
    </div>`;
}
function attachWorry(el) {
  const buttons = Array.from(el.querySelectorAll("#wq-options .option-btn"));
  const continueBtn = el.querySelector("#wq-continue");
  const questionCard = el.querySelector("#wq-question");
  const ackCard = el.querySelector("#wq-ack");
  const ackCtaBtn = el.querySelector("#wq-ack-cta");
  const contentEl = el.querySelector(".screen-content");
  let selected = state.responses.worry || null;

  function paintSelection() {
    buttons.forEach((b) => b.classList.toggle("selected", b.dataset.id === selected));
    continueBtn.disabled = !selected;
  }
  // Retires the question card and brings the acknowledgement card in its
  // place. `animate` is false only when restoring the already-settled state
  // after a back-navigation, where there's no beat to play.
  function showAck(animate) {
    if (!ackCard.classList.contains("hidden")) return;
    const swap = () => {
      questionCard.classList.add("hidden");
      ackCard.classList.remove("hidden");
      // With the tall options gone, even out the screen's top-bar clearance
      // padding so the short card sits at the optical centre, not low.
      contentEl.classList.add("ack-centered");
      // Two frames: the first lays the card out faded, the second animates.
      if (animate) requestAnimationFrame(() => requestAnimationFrame(() => ackCard.classList.add("visible")));
      else ackCard.classList.add("visible");
    };
    if (!animate) return swap();
    questionCard.classList.add("leaving");
    setTimeout(swap, 200); // let the question card recede first
  }
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      sfx.click();
      selected = btn.dataset.id;
      paintSelection();
    });
  });
  // Confirming the answer is what captures it — and the only thing that
  // brings the acknowledgement up.
  continueBtn.addEventListener("click", () => {
    if (!selected) return;
    sfx.click();
    state.responses.worry = selected;
    trackEvent("question_answered", "worry", { choice: selected });
    showAck(true);
  });
  // The acknowledgement card itself is the gate into the first challenge.
  ackCtaBtn.addEventListener("click", () => {
    sfx.whoosh();
    goTo(3);
  });
  if (selected) showAck(false); // returning via the back button
  paintSelection();
}

// ----- Screen 3 · "Take Challenge 1" interstitial --------------------------
function renderChallenge1Intro() {
  return `
    <div class="screen-content center">
      <div class="grow"></div>
      <div class="eyebrow">${CHALLENGE1_INTRO.eyebrow}</div>
      <h1 class="title-hero">${CHALLENGE1_INTRO.title}</h1>
      <p class="subtitle">${CHALLENGE1_INTRO.sub}</p>
      <div class="grow"></div>
      <button class="btn btn-amber" id="c1i-cta" style="width:100%;">${CHALLENGE1_INTRO.cta}</button>
    </div>`;
}
function attachChallenge1Intro(el) {
  el.querySelector("#c1i-cta").addEventListener("click", () => {
    sfx.click();
    goTo(4);
  });
}

// ----- Screen 4 · Challenge 1 · Real or AI? (capture #3) ------------------
let challenge1Api = null;
function renderChallenge1() {
  return `
    <div class="screen-content">
      <div class="round-banner">
        <span class="round-banner-icon">${ICONS[CHALLENGE1.iconKey]}</span>
        <span class="round-banner-label">${CHALLENGE1.banner}</span>
        <div class="timer-ring-wrap">
          <svg viewBox="0 0 44 44"><circle class="timer-ring-track" cx="22" cy="22" r="18"/><circle class="timer-ring-fill" cx="22" cy="22" r="18"/></svg>
          <div class="timer-ring-num">${CHALLENGE1.timerSeconds}</div>
        </div>
      </div>
      <p>${CHALLENGE1.instructions}</p>
      <div class="kg-progress" id="c1-progress">Image 1 of ${CHALLENGE1.images.length}</div>
      <div class="ch1-image-wrap glass-tile">
        <img id="c1-img" alt="">
        <div class="img-fallback hidden" id="c1-img-fallback">${ICONS.user}</div>
      </div>
      <div class="kg-swipe-actions">
        <button class="kg-action-btn kg-action-fake" data-id="ai">${ICONS.close}<span>AI</span></button>
        <button class="kg-action-btn kg-action-confused" data-id="confused">${ICONS.helpCircle}<span>It's confusing</span></button>
        <button class="kg-action-btn kg-action-real" data-id="real">${ICONS.check}<span>Real</span></button>
      </div>
      <p class="reveal-caption hidden" id="c1-explain"></p>
      <div class="mission-slot" id="c1-mission"></div>
      <button class="btn btn-amber" id="c1-confirm" disabled style="width:100%;">Confirm answer</button>
      <button class="btn btn-amber hidden" id="c1-next" style="width:100%;">${CHALLENGE1.nextCta}</button>
    </div>`;
}
function attachChallenge1(el) {
  const progressEl = el.querySelector("#c1-progress");
  const imgEl = el.querySelector("#c1-img");
  const fallbackEl = el.querySelector("#c1-img-fallback");
  const explainEl = el.querySelector("#c1-explain");
  const confirmBtn = el.querySelector("#c1-confirm");
  const nextBtn = el.querySelector("#c1-next");
  const missionSlot = el.querySelector("#c1-mission");
  const actionBtns = Array.from(el.querySelectorAll(".kg-action-btn"));

  let deck = null;
  let index = 0;
  let answers = {};
  let score = 0;
  let selected = null;
  let resolved = false;
  let advanceTimeoutId = null;

  function lockBoard() {
    confirmBtn.classList.add("hidden");
    nextBtn.classList.remove("hidden");
    actionBtns.forEach((b) => (b.disabled = true));
  }

  // Single exit for the whole challenge — whether the parent answered the
  // last image or the ring ran out, the mission reveal always lands here.
  function finish(timedOut) {
    if (resolved) return;
    resolved = true;
    stopRingTimer();
    clearTimeout(advanceTimeoutId);
    advanceTimeoutId = null;
    recordChallenge1Result(score, answers, timedOut);
    lockBoard();
    revealMissionInline(missionSlot, CHALLENGE1.missionLink);
  }

  imgEl.addEventListener("error", () => {
    imgEl.classList.add("hidden");
    fallbackEl.classList.remove("hidden");
  });

  function showImage(i) {
    selected = null;
    const img = deck[i];
    imgEl.classList.remove("hidden");
    fallbackEl.classList.add("hidden");
    imgEl.src = encodeURI(img.src);
    progressEl.textContent = `Image ${i + 1} of ${deck.length}`;
    explainEl.classList.add("hidden");
    confirmBtn.disabled = true;
    confirmBtn.classList.remove("hidden");
    nextBtn.classList.add("hidden");
    actionBtns.forEach((b) => {
      b.disabled = false;
      b.classList.remove("selected", "correct", "wrong");
    });
  }

  function confirmCurrent(choice) {
    if (resolved) return;
    const img = deck[index];
    const correctId = img.isFake ? "ai" : "real";
    const correct = choice === correctId;
    if (correct) score++;
    answers[img.id] = choice;
    actionBtns.forEach((b) => {
      b.disabled = true;
      if (b.dataset.id === correctId) b.classList.add("correct");
      else if (b.dataset.id === choice) b.classList.add("wrong");
    });
    explainEl.textContent = img.explain;
    explainEl.classList.remove("hidden");
    confirmBtn.classList.add("hidden");
    correct ? sfx.correct() : sfx.wrong();
    if (index < deck.length - 1) {
      advanceTimeoutId = setTimeout(() => {
        advanceTimeoutId = null;
        index++;
        showImage(index);
      }, 1100);
    } else {
      finish(false);
    }
  }

  actionBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.disabled) return;
      sfx.click();
      selected = btn.dataset.id;
      actionBtns.forEach((b) => b.classList.toggle("selected", b === btn));
      confirmBtn.disabled = false;
    });
  });
  confirmBtn.addEventListener("click", () => {
    if (!selected) return;
    sfx.click();
    confirmCurrent(selected);
  });
  nextBtn.addEventListener("click", () => {
    sfx.whoosh();
    goTo(5);
  });

  function start() {
    clearTimeout(advanceTimeoutId);
    advanceTimeoutId = null;
    deck = shuffleArray(CHALLENGE1.images.slice());
    index = 0;
    answers = {};
    score = 0;
    resolved = false;
    missionSlot.classList.remove("visible");
    missionSlot.innerHTML = "";
    showImage(0);
    startRingTimer(el.closest(".screen"), CHALLENGE1.timerSeconds, () => {
      if (resolved) return;
      // Only the image currently on screen might have a pending (unconfirmed)
      // selection — every later image was never shown, so it's "confused".
      const currentIndex = index;
      while (index < deck.length) {
        const img = deck[index];
        answers[img.id] = index === currentIndex && selected ? selected : "confused";
        index++;
      }
      score = deck.filter((img) => answers[img.id] === (img.isFake ? "ai" : "real")).length;
      finish(true);
    });
  }

  challenge1Api = { start };
}
function onEnterChallenge1() {
  if (state.responses.r1) return; // already completed — DOM already shows the reveal state
  if (challenge1Api) challenge1Api.start();
}

// ----- Screen 5 · Challenge 2 · Spot the Trap (capture #4) ----------------
function renderChallenge2() {
  const opts = CHALLENGE2.options
    .map((o) => `<button class="option-btn glass-tile" data-id="${o.id}" data-correct="${o.correct}">${o.label}</button>`)
    .join("");
  const stars = "★★★★★";
  const reviews = Array.from({ length: CHALLENGE2.card.reviews })
    .map(() => `<div class="reveal-caption">${stars} “Great deal, ordered instantly!”</div>`)
    .join("");
  return `
    <div class="screen-content">
      <div class="round-banner">
        <span class="round-banner-icon">${ICONS[CHALLENGE2.iconKey]}</span>
        <span class="round-banner-label">${CHALLENGE2.banner}</span>
        <div class="timer-ring-wrap">
          <svg viewBox="0 0 44 44"><circle class="timer-ring-track" cx="22" cy="22" r="18"/><circle class="timer-ring-fill" cx="22" cy="22" r="18"/></svg>
          <div class="timer-ring-num">${CHALLENGE2.timerSeconds}</div>
        </div>
      </div>
      <div class="shop-card glass-tile">
        ${imgTag(ASSETS.fakeDealProduct, "bag", "card-img")}
        <div class="shop-badge">${CHALLENGE2.card.urgency}</div>
        <div class="shop-timer" id="c2-countdown">${CHALLENGE2.card.countdown}</div>
        <div class="shop-body">
          <div class="shop-price-row">
            <span class="shop-mrp">${CHALLENGE2.card.mrp}</span>
            <span class="shop-price">${CHALLENGE2.card.price}</span>
          </div>
          <div class="shop-stars">${stars} (312)</div>
        </div>
      </div>
      ${reviews}
      <p>${CHALLENGE2.prompt}</p>
      <div class="option-list" id="c2-options">${opts}</div>
      <p class="reveal-caption hidden" id="c2-reveal">${CHALLENGE2.reveal}</p>
      <div class="mission-slot" id="c2-mission"></div>
      <button class="btn btn-amber" id="c2-confirm" disabled style="width:100%;">${CHALLENGE2.cta}</button>
      <button class="btn btn-amber hidden" id="c2-next" style="width:100%;">${CHALLENGE2.nextCta}</button>
    </div>`;
}
function attachChallenge2(el) {
  const buttons = Array.from(el.querySelectorAll("#c2-options .option-btn"));
  const confirmBtn = el.querySelector("#c2-confirm");
  const nextBtn = el.querySelector("#c2-next");
  const missionSlot = el.querySelector("#c2-mission");
  let selected = state.responses.r2 ? state.responses.r2.choice : null;
  let confirmed = !!state.responses.r2;

  function paintSelection() {
    buttons.forEach((b) => b.classList.toggle("selected", b.dataset.id === selected));
    confirmBtn.disabled = !selected;
  }
  function lockIn(ms) {
    stopRingTimer();
    confirmed = true;
    const chosen = CHALLENGE2.options.find((o) => o.id === selected);
    const correct = !!(chosen && chosen.correct);
    buttons.forEach((b) => {
      b.disabled = true;
      if (b.dataset.correct === "true") {
        b.classList.add("correct");
        b.insertAdjacentHTML("beforeend", monoBadge(true));
      } else if (b.dataset.id === selected) {
        b.classList.add("wrong");
        b.insertAdjacentHTML("beforeend", monoBadge(false));
      }
    });
    el.querySelector("#c2-reveal").classList.remove("hidden");
    confirmBtn.classList.add("hidden");
    nextBtn.classList.remove("hidden");
    if (ms !== undefined) {
      correct ? sfx.correct() : sfx.wrong();
      recordRoundAnswer(2, selected, correct, ms);
    }
    revealMissionInline(missionSlot, CHALLENGE2.missionLink);
  }
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (confirmed) return;
      sfx.click();
      selected = btn.dataset.id;
      paintSelection();
    });
  });
  confirmBtn.addEventListener("click", () => {
    if (!selected) return;
    sfx.click();
    lockIn(activeRoundTimer ? activeRoundTimer.elapsedMs() : 0);
  });
  nextBtn.addEventListener("click", () => {
    sfx.whoosh();
    goTo(6);
  });

  if (confirmed) {
    buttons.forEach((b) => {
      b.disabled = true;
      if (b.dataset.correct === "true") {
        b.classList.add("correct");
        b.insertAdjacentHTML("beforeend", monoBadge(true));
      } else if (b.dataset.id === selected) {
        b.classList.add("wrong");
        b.insertAdjacentHTML("beforeend", monoBadge(false));
      }
    });
    el.querySelector("#c2-reveal").classList.remove("hidden");
    confirmBtn.classList.add("hidden");
    nextBtn.classList.remove("hidden");
    revealMissionInline(missionSlot, CHALLENGE2.missionLink);
  }
  paintSelection();

  // cosmetic countdown to sell the "manufactured urgency" — purely decorative
  let secs = 179;
  const countdownEl = el.querySelector("#c2-countdown");
  const cosmetic = setInterval(() => {
    if (state.responses.r2 || !document.body.contains(el)) return clearInterval(cosmetic);
    secs = secs > 0 ? secs - 1 : 179;
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    countdownEl.textContent = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }, 1000);

  el._c2Timeout = () => {
    if (confirmed) return;
    if (!selected) {
      const buttonsLeft = buttons.filter((b) => !b.disabled);
      selected = buttonsLeft[Math.floor(Math.random() * buttonsLeft.length)].dataset.id;
    }
    lockIn(CHALLENGE2.timerSeconds * 1000);
  };
}
function onEnterChallenge2(el) {
  if (state.responses.r2) return; // already completed — DOM already shows the reveal state
  startRingTimer(el, CHALLENGE2.timerSeconds, () => {
    if (el._c2Timeout) el._c2Timeout();
  });
}

// ----- Screen 6 · Recap — the count they caught + the two missions ----------
// Both missions were already revealed inline right after their challenge, so
// this screen is a lighter recap plus the "see all missions" step — not the
// first place the parent hears the good news.
function renderScore() {
  const rows = [CHALLENGE1, CHALLENGE2]
    .map((r) => missionCardHTML(r.missionLink, { eyebrow: r.missionLink.subject, heading: r.missionLink.title, compact: true }))
    .join("");
  return `
    <div class="screen-content">
      <div class="grow" style="flex:0;"></div>
      <div class="card glass-tile" style="text-align:center;">
        <div class="score-icon">${ICONS.target}</div>
        <div class="score-big" id="s6-score"></div>
        <div class="score-headline" id="s6-headline"></div>
        <p class="reveal-caption" style="margin-top:10px;">${SCORE_REASSURANCE}</p>
      </div>
      <div class="recap-label">${SCORE_RECAP_LABEL}</div>
      ${rows}
      <p class="footer-note">${SKILL_MAP_FOOTER}</p>
      <button class="btn btn-ghost" id="s6-missions" style="width:100%;">${SCORE_MISSIONS_CTA}</button>
      <button class="btn btn-amber" id="s6-continue" style="width:100%;">Continue →</button>
    </div>`;
}
function attachScore(el) {
  wireMissionCards(el);
  el.querySelector("#s6-missions").addEventListener("click", () => {
    sfx.click();
    if (state.responses.phone) openMissionModal();
    else openPhoneGate(() => openMissionModal());
  });
  el.querySelector("#s6-continue").addEventListener("click", () => {
    sfx.whoosh();
    goTo(7);
  });
}
function onEnterScore(el) {
  const score = state.roundScore;
  const band = SCORE_BANDS.find((b) => score >= b.min && score <= b.max) || SCORE_BANDS[0];
  el.querySelector("#s6-score").textContent = SCORE_LINE.replace("{n}", score);
  el.querySelector("#s6-headline").textContent = band.headline;
}

// ----- Screen 7 · Reflection (capture #5) -----------------------------------
function renderReflection() {
  const opts = REFLECTION_Q.options
    .map((o) => `<button class="option-btn glass-tile" data-id="${o.id}">${o.label}</button>`)
    .join("");
  return `
    <div class="screen-content">
      <div class="card glass-tile">
        <div class="eyebrow">${REFLECTION_Q.eyebrow}</div>
        <p>${REFLECTION_Q.prompt}</p>
        <div class="option-list" id="s7-options">${opts}</div>
      </div>
      <button class="btn btn-amber" id="s7-confirm" disabled style="width:100%;">${REFLECTION_Q.cta}</button>
      <button class="btn btn-amber hidden" id="s7-continue" style="width:100%;">Continue →</button>
    </div>`;
}
function attachReflection(el) {
  const buttons = Array.from(el.querySelectorAll("#s7-options .option-btn"));
  const confirmBtn = el.querySelector("#s7-confirm");
  const continueBtn = el.querySelector("#s7-continue");
  let selected = state.responses.reflection || null;
  let confirmed = !!state.responses.reflection;

  function paintSelection() {
    buttons.forEach((b) => b.classList.toggle("selected", b.dataset.id === selected));
    confirmBtn.disabled = !selected;
  }
  function lockIn() {
    confirmed = true;
    buttons.forEach((b) => {
      b.disabled = true;
      b.classList.toggle("correct", b.dataset.id === selected);
    });
    confirmBtn.classList.add("hidden");
    continueBtn.classList.remove("hidden");
  }
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (confirmed) return;
      sfx.click();
      selected = btn.dataset.id;
      paintSelection();
    });
  });
  confirmBtn.addEventListener("click", () => {
    if (!selected) return;
    sfx.click();
    state.responses.reflection = selected;
    state.responses.score = state.roundScore;
    state.responses.ts = new Date().toISOString();
    sendResults();
    trackEvent("question_answered", "reflection", { choice: selected });
    trackEvent("session_complete", "reflection", state.responses);
    sessionEnded = true;
    lockIn();
  });
  continueBtn.addEventListener("click", () => {
    sfx.whoosh();
    goTo(8);
  });
  if (confirmed) lockIn();
  paintSelection();
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
function renderClose() {
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
function attachClose(el) {
  el.querySelector("#s8-primary").addEventListener("click", () => {
    sfx.click();
    if (state.responses.phone) openMissionModal();
    else openPhoneGate(() => openMissionModal());
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
function onEnterClose(el) {
  sfx.celebrate();
  burstConfetti(el.querySelector("#s8-container"));
}

/* =========================================================================
   Phone gate — shown once, only if the parent taps "See the full mission
   list", so a phone number is only ever asked for right when it's needed
   (never up front). Reuses the same sheet chrome as the mission modal.
   ========================================================================= */
function renderPhoneGate() {
  return `
    <div class="mm-overlay" id="phone-gate">
      <div class="mm-sheet">
        <div class="mm-header">
          <div>
            <div class="mm-title">${PHONE_GATE.title}</div>
            <div class="mm-sub">${PHONE_GATE.sub}</div>
          </div>
          <button class="mm-close" id="pg-close-btn" aria-label="Close">${ICONS.close}</button>
        </div>
        <div class="mm-body">
          <div class="field">
            <label for="pg-phone">${PHONE_GATE.field.label}</label>
            <div class="phone-input-wrap">
              <span class="phone-prefix">+91</span>
              <input type="tel" id="pg-phone" inputmode="numeric" maxlength="10" placeholder="${PHONE_GATE.field.placeholder}" autocomplete="tel-national">
            </div>
            <span class="field-hint" id="pg-phone-hint">${PHONE_GATE.hint}</span>
          </div>
          <button class="btn btn-amber" id="pg-cta" disabled style="width:100%;">${PHONE_GATE.cta}</button>
        </div>
      </div>
    </div>`;
}
function closePhoneGate(modal) {
  modal.classList.remove("open");
  setTimeout(() => modal.remove(), 260);
}
function openPhoneGate(onSuccess) {
  const wrap = document.createElement("div");
  wrap.innerHTML = renderPhoneGate();
  const modal = wrap.firstElementChild;
  document.getElementById("phone").appendChild(modal);
  requestAnimationFrame(() => modal.classList.add("open"));

  const phoneInput = modal.querySelector("#pg-phone");
  const phoneHint = modal.querySelector("#pg-phone-hint");
  const ctaBtn = modal.querySelector("#pg-cta");

  function validate() {
    const digits = phoneInput.value.replace(/\D/g, "");
    const ok = digits.length === 10;
    phoneHint.classList.toggle("valid", ok);
    phoneHint.classList.toggle("invalid", phoneInput.value.length > 0 && !ok);
    ctaBtn.disabled = !ok;
    return ok;
  }
  phoneInput.addEventListener("input", () => {
    phoneInput.value = phoneInput.value.replace(/\D/g, "").slice(0, 10);
    validate();
  });
  modal.querySelector("#pg-close-btn").addEventListener("click", () => closePhoneGate(modal));
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closePhoneGate(modal);
  });
  ctaBtn.addEventListener("click", () => {
    if (!validate()) return;
    sfx.click();
    state.responses.phone = "+91" + phoneInput.value;
    trackEvent("question_answered", "phone_gate", { phone: state.responses.phone });
    closePhoneGate(modal);
    onSuccess();
  });
}

/* =========================================================================
   Mission map sheet — the full grade-by-grade mission list, opened from the
   close screen's "See the full mission list" CTA (after the phone gate
   above). Rendered natively (rather than an embedded PDF) so it stays fast
   and legible on a phone screen.
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
   screen/pip bookkeeping. Reuses existing components (glass tiles, timer
   ring, sfx, confetti, ICONS) rather than inventing new ones.
   ========================================================================= */
let kgState = { step: 0, deck: null, deckIndex: 0, answers: {}, challengeResolved: false };

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
    <button class="btn btn-amber" id="kg-start" style="width:100%;">${KID_GAME.intro.cta}</button>`;
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
        tag = img.isFake ? "AI · not sure" : "Real · not sure";
        mark = "muted";
      } else if (answer === correctAnswer) {
        tag = img.isFake ? "AI · caught it!" : "Real · got it!";
        mark = "good";
      } else {
        tag = img.isFake ? "AI · missed this one" : "Real · false alarm";
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
      <div class="score-big">${score} of ${deck.length} right${confusedCount ? `, ${confusedCount} unsure` : ""}.</div>
      <div class="score-headline">${band.headline}</div>
      <p class="reveal-caption" style="margin-top:10px;">${KID_GAME.reassurance}</p>
    </div>
    ${rows}
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
  { render: renderTitle, attach: attachTitle, bg: "hero" },
  { render: renderDetails, attach: attachDetails, bg: "ambient" },
  { render: renderWorry, attach: attachWorry, bg: "ambient", popup: true },
  { render: renderChallenge1Intro, attach: attachChallenge1Intro, bg: "ambient" },
  { render: renderChallenge1, attach: attachChallenge1, onEnter: onEnterChallenge1, bg: "ambient" },
  { render: renderChallenge2, attach: attachChallenge2, onEnter: onEnterChallenge2, bg: "ambient" },
  { render: renderScore, attach: attachScore, onEnter: onEnterScore, bg: "ambient" },
  { render: renderReflection, attach: attachReflection, bg: "ambient" },
  { render: renderClose, attach: attachClose, onEnter: onEnterClose, bg: "finale" },
];

function buildAllScreens() {
  appEl.innerHTML = "";
  screenEls = SCREEN_DEFS.map((def, i) => {
    const div = document.createElement("div");
    div.className = `screen screen-bg-${def.bg}` + (def.popup ? " screen-popup" : "");
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
  backBtn.classList.toggle("hidden", n === 0);
  const def = SCREEN_DEFS[n];
  if (def.onEnter) def.onEnter(screenEls[n]);
  window.scrollTo(0, 0);
  // Screens are reused (never re-rendered), so their own internal scroll
  // position (from .screen-content's overflow-y:auto) can be left stale
  // from a previous visit — reset it whenever a screen becomes active.
  const content = screenEls[n].querySelector(".screen-content");
  if (content) content.scrollTop = 0;
}

function resetGame() {
  state = { responses: {}, roundScore: 0, current: 0 };
  sessionId = null;
  sessionEnded = false;
  buildAllScreens();
  goTo(0);
}

/* =========================================================================
   Top bar wiring — back button only. There is deliberately no persistent
   session countdown: the two per-challenge ring timers are the only clocks.
   ========================================================================= */
function initTopbar() {
  backBtn.addEventListener("click", () => {
    if (state.current <= 0) return;
    sfx.click();
    goTo(state.current - 1);
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
}
document.addEventListener("DOMContentLoaded", boot);
