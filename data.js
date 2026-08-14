// data.js — all copy/content for "Could You Pass Your Kid's Class?"
// Edit the strings/options here to change what the game says without touching game.js.

const ASSETS = {
  heroTitleBg: "Image assets/Hero_Title_Bg.png",
  ambientBg: "Image assets/Ambient content background.png",
  finaleBg: "Image assets/Finale background.png",
  realPortrait: "Image assets/The real-looking portrait.png",
  aiFakePortrait: "Image assets/The AI fake portrait (with a spot-the-tell flaw).png",
  fakeDealProduct: "Image assets/Fake-deal product image.png",
  aiTutorAvatar: "Image assets/AI tutor avatar.png",
  skaiLogo: "Image assets/SKAI Space_RBG(For Digital Use).webp",
};

// ---- Screen 0 · Title -------------------------------------------------
const TITLE = {
  title: "Could You Pass Your Kid's Class?",
  subtitle:
    "Your child's classroom now runs on AI. Take the 3-minute challenge — see if you could keep up.",
  cta: "▶ Take the challenge",
};

// ---- Screen 1 · The honest question (capture #1) -----------------------
const WORRY_Q = {
  emoji: "🤔",
  prompt:
    "Before we start — one honest question. When you picture your child's future in a world run by AI, what sits with you most?",
  options: [
    { id: "A", label: "Will they even have a job AI doesn't do?" },
    { id: "B", label: "I don't understand this stuff, so I can't guide them." },
    { id: "C", label: "Is their school actually teaching the right things?" },
    { id: "D", label: "Honestly… I try not to think about it." },
  ],
  ack: "You're not alone — most parents pick that too. Let's look at what your child is actually learning.",
};

// ---- Screen 2 · Round 1 · Real or AI? (capture #2) ----------------------
const ROUND1 = {
  banner: "🤖 Round 1 of 4 · Real or AI?",
  timerSeconds: 15,
  prompt: "One of these was made by AI. Which one?",
  correct: "aiFake", // the AI fake portrait is always correct
  captionOnFake:
    "The tells: too-perfect studio lighting, flawless skin, dreamy background blur. Real phone selfies look like the other one.",
  aha: "Even adults get this ~50/50 — a coin flip. Your child trains to spot the tells.",
  missionLink: {
    emoji: "🤖",
    title: "Round 1 → “Deepfake Detector”",
    subject: "AI & media literacy",
    line: "Your child trains an AI to tell real from fake.",
  },
};

// ---- Screen 3 · Round 2 · Spot the Trap (capture #3) --------------------
const ROUND2 = {
  banner: "🔎 Round 2 of 4 · Spot the Trap",
  timerSeconds: 18,
  card: {
    mrp: "MRP ₹4,999",
    price: "Now ₹999 — 80% OFF!",
    countdown: "⏰ 02:59",
    urgency: "🔥 Only 2 left!",
    reviews: 3,
  },
  prompt: "Real deal, or a trick? Tap what gives it away.",
  options: [
    { id: "A", label: "The countdown timer and the “Only 2 left” warning", correct: true },
    { id: "B", label: "The 4.9-star rating from 312 reviews", correct: false },
    { id: "C", label: "The product photo looks too professionally shot", correct: false },
    { id: "D", label: "Nothing looks off — it's a normal sale.", correct: false },
  ],
  reveal:
    "The ₹4,999 ‘MRP’ was never a real price; the timer resets on refresh. Your child learns to expose this with real data in a mission called Price Detective.",
  missionLink: {
    emoji: "🔎",
    title: "Round 2 → “Price Detective”",
    subject: "Data & digital literacy",
    line: "Your child uses real data to expose fake deals and false claims.",
  },
};

// ---- Screen 4 · Round 3 · Talk to the Machine (capture #4) --------------
const ROUND3 = {
  banner: "💬 Round 3 of 4 · Talk to the Machine",
  timerSeconds: 20,
  setup:
    "Your child is stuck on fractions. You want AI to actually help them learn — not just hand over the answer. Which message do you send?",
  options: [
    {
      id: "A",
      label: "Solve this and show all the working: 3/4 + 2/5",
      correct: false,
      reply: "Here's the working: find a common denominator, 20. 15/20 + 8/20 = 23/20 = 1 3/20. Done!",
      replyKind: "bare",
    },
    {
      id: "B",
      label: "You're a fractions expert — explain everything I need to know about adding fractions.",
      correct: false,
      reply:
        "A fraction represents a part of a whole, written as a numerator over a denominator. To add fractions, you need a common denominator... (keeps going for a while)",
      replyKind: "lecture",
    },
    {
      id: "C",
      label:
        "Act as a patient tutor for a 12-year-old. Explain adding fractions with one everyday example, then give me 2 practice questions and wait for my answers before telling me if I'm right.",
      correct: true,
      reply:
        "Sure! Think of a pizza cut into 4 slices and another cut into 5. If you eat 3/4 of the first and 2/5 of the second... Ready to try one? Q1: 1/2 + 1/3 = ?",
      replyKind: "dialogue",
    },
  ],
  aha: "That's called prompting — a real skill. Your child practises it weekly to make AI a tutor, not a cheat-sheet.",
  missionLink: {
    emoji: "💬",
    title: "Round 3 → “Study Buddy Bot”",
    subject: "Prompt engineering",
    line: "Your child builds AI tutors by learning how to ask.",
  },
};

// ---- Screen 5 · Round 4 · Bug Hunt (capture #5) --------------------------
const ROUND4 = {
  banner: "🧩 Round 4 of 4 · Bug Hunt",
  timerSeconds: 18,
  setup:
    "Your child's classmate coded these steps to make a robot water a plant. The robot keeps knocking the pot over. Which step is the bug?",
  steps: [
    "Move forward 4 steps",
    "Turn right 90°",
    "Move forward 1 step",
    "Pour the water",
  ],
  options: [
    { id: "A", label: "Step 1 — Move forward 4 steps", correct: false },
    { id: "B", label: "Step 2 — Turn right 90°", correct: false },
    { id: "C", label: "Step 3 — Move forward 1 step", correct: false },
    { id: "D", label: "Step 4 — Pour the water", correct: true },
  ],
  reveal:
    "There's no “stop” command before step 4 — the robot is still moving forward when it starts pouring, and that's what knocks the pot over. A missing step breaks things just as much as a wrong one.",
  aha: "That's computational thinking — breaking a task into exact steps and catching the ones that are missing. Your child debugs code like this every week.",
  missionLink: {
    emoji: "🧩",
    title: "Round 4 → “Bug Hunt”",
    subject: "STEM & computational thinking",
    line: "Your child breaks big problems into exact steps — and finds what's missing.",
  },
};

// ---- Screen 6 · The reveal — score + skill map --------------------------
const SCORE_BANDS = [
  { min: 0, max: 1, headline: "Tricky, isn't it? 😅" },
  { min: 2, max: 3, headline: "Sharp! 🎯" },
  { min: 4, max: 4, headline: "Rare — you'd fit right in. 🌟" },
];
const SCORE_MAX = 4;
const SCORE_REASSURANCE =
  "Most parents get 1 out of 4. That's exactly why this classroom exists.";
const SKILL_MAP_FOOTER =
  "4 of 16 missions your child does across AI, STEM, Data, and Entrepreneurship.";

// ---- Screen 7 · Reflection (capture #6) ---------------------------------
const REFLECTION_Q = {
  emoji: "💭",
  prompt:
    "Now that you've been inside it — how do you feel about what your child is learning here?",
  options: [
    { id: "A", label: "Relieved — this is what they actually need." },
    { id: "B", label: "Curious — I want to see more." },
    { id: "C", label: "Motivated — I want to learn some of this myself." },
  ],
};

// ---- Screen 8 · Close ----------------------------------------------------
const CLOSE = {
  headline: "You were taught to memorise. They're being taught to think — with the machine.",
  sub: "That's the gap this classroom closes. And now you've felt it too.",
  ctaPrimary: "See the full mission list",
  ctaSecondary: "↺ Play again",
  ctaShare: "Challenge another parent →",
  shareMessage:
    "I just took the \"Could You Pass Your Kid's Class?\" challenge — it shows exactly what AI is teaching kids now. Bet you can't score higher than me 👀",
  missionListUrl: "#", // wire your real link here
};

// ---- Narrator lines (spoken via TTS, or a matching mp3 in Voice assets/) --
const NARRATION = {
  s_title:
    "Could you pass your kid's class? Your child's classroom now runs on AI. Take the three minute challenge and see if you could keep up.",
  s_worry_prompt:
    "Before we start, one honest question. When you picture your child's future in a world run by AI, what sits with you most?",
  s_worry_ack:
    "You're not alone. Most parents pick that too. Let's look at what your child is actually learning.",
  s_r1_prompt:
    "Round one of four. Real or AI? One of these was made by AI. Which one?",
  s_r1_reveal_correct:
    "Nice catch! Even adults get this about fifty-fifty, a coin flip. Your child trains to spot the tells.",
  s_r1_reveal_wrong:
    "The tells were too-perfect studio lighting, flawless skin, and a dreamy background blur. Even adults get this about fifty-fifty. Your child trains to spot the tells.",
  s_r2_prompt:
    "Round two of four, spot the trap. Real deal, or a trick? Tap what gives it away.",
  s_r2_reveal:
    "The four thousand nine hundred ninety nine rupee price was never real, and the timer resets on refresh. Your child learns to expose this with real data.",
  s_r3_prompt:
    "Round three of four, talk to the machine. Your child is stuck on fractions. Which message actually helps them learn?",
  s_r3_aha:
    "That's called prompting, a real skill. Your child practises it weekly to make AI a tutor, not a cheat sheet.",
  s_r4_prompt:
    "Round four of four, bug hunt. The robot keeps knocking the pot over. Which step is the bug?",
  s_r4_reveal:
    "There's no stop command before step four, so the robot is still moving when it pours. A missing step breaks things just as much as a wrong one. Your child hunts for bugs exactly like this.",
  s_score: "Here's how you did.",
  s_reflection_prompt:
    "Now that you've been inside it, how do you feel about what your child is learning here?",
  s_close:
    "You were taught to memorise. They're being taught to think, with the machine. That's the gap this classroom closes.",
};
