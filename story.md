# story.md — "Could You Pass Your Kid's Class?"

**Solo, phone-first, \~3-minute parent mission · 8 screens · captures 5 MCQ responses** Companion to the assets in `Image assets/`. Hand this file \+ that folder to Claude Code in VS Code and build to it exactly.

**The point of the game:** a parent in their 40s quietly fears the AI-shaped world their child is entering and can't tell if school is preparing them. This drops the parent *inside* three real SWIFT AI missions as fast MCQs, then reveals the skill behind each — turning anxiety into pride. Never shames a wrong answer.

---

## Tech \+ look (fast)

Vanilla HTML/CSS/JS, single page, runs by double-clicking `index.html`. No frameworks, no build step, **no localStorage/sessionStorage** — all state in one in-memory `state` object. Portrait-first (390×844), scales to laptop. Optional `POST state.responses` to a `WEBHOOK_URL` const at the end (fail silently if empty).

```css
:root{
  --bg:#0E1030; --bg-2:#171a44; --surface:#1E2150; --surface-2:#262a63;
  --ink:#EEF0FF; --muted:#A7ADE0; --brand:#6C5CE7; --brand-2:#8B7CFF;
  --accent:#FFC24B; --good:#34D399; --bad:#FB7185; --line:rgba(255,255,255,.10);
  --radius:20px; --shadow:0 12px 40px rgba(0,0,0,.35);
}
```

Poppins/Sora headings, Inter body, 18px base, ≥56px option buttons, 200–250ms fades. Top bar: SKAI Space logo (left), a 3-segment round pip (centre), count-up timer (right). Rounds use an animated \~15–20s timer ring; a slow tap never fails (timer just auto-locks a guess).

## Asset map (quote exactly — spaces/parentheses kept as in the folder)

| Where | File |
| :---- | :---- |
| Screen 0 title bg | `Image assets/Hero_Title_Bg.png` |
| Screens 1,3,4,6 content bg | `Image assets/Ambient content background.png` |
| Screen 7 finale bg | `Image assets/Finale background.png` |
| Round 1 "real" card | `Image assets/The real-looking portrait.png` |
| Round 1 "AI fake" card (correct answer) | `Image assets/The AI fake portrait (with a spot-the-tell flaw).png` |
| Round 2 product | `Image assets/Fake-deal product image.png` |
| Round 3 AI avatar (transparent PNG) | `Image assets/AI tutor avatar.png` |
| Top-bar / branding logo | `Image assets/SKAI Space_RBG(For Digital Use).webp` |
| *No icon assets were generated — use emoji (🤖 🔎 💬) for the skill-map rows and CSS for pips/timer/burst.* |  |

---

## Screen-by-screen

**Screen 0 · Title.** Background \= `Image assets/Hero_Title_Bg.png` (indigo→violet neural field), SKAI logo top-centre. Title **"Could You Pass Your Kid's Class?"**, sub *"Your child's classroom now runs on AI. Take the 3-minute challenge — see if you could keep up."* Amber button **▶ Take the challenge**. → init `state = {responses:{}, roundScore:0}`, go Screen 1\.

**Screen 1 · The honest question (capture \#1).** Background \= `Ambient content background.png`. Card: *"Before we start — one honest question. When you picture your child's future in a world run by AI, what sits with you most?"* Options (no wrong answer): A *"Will they even have a job AI doesn't do?"* · B *"I don't understand this stuff, so I can't guide them."* · C *"Is their school actually teaching the right things?"* · D *"Honestly… I try not to think about it."* On tap: gentle line *"You're not alone — most parents pick that too. Let's look at what your child is actually learning."* (\~1.2s) → `state.responses.worry`, go Screen 2\.

**Screen 2 · Round 1 · Real or AI? (capture \#2)** — *mirrors Mission 1.4 Deepfake Detector.* Banner *"Round 1 of 3 · Real or AI?"*, timer ring (\~15s). Two cards side-by-side (stacked on phone): one shows `The real-looking portrait.png`, the other `The AI fake portrait (with a spot-the-tell flaw).png` — **randomise which is A vs B each play**. Prompt: *"One of these was made by AI. Which one?"* **Correct \= the AI fake portrait.** Reveal: correct card glows `--good`, the other `--bad`; caption on the fake: *"The tells: too-perfect studio lighting, flawless skin, dreamy background blur. Real phone selfies look like the other one."* Aha line: *"Even adults get this \~50/50 — a coin flip. Your child trains to spot the tells."* → `state.responses.r1={choice,correct,ms}`; `if(correct) roundScore++`. **Next round →**

**Screen 3 · Round 2 · Spot the Trap (capture \#3)** — *mirrors Mission 3.2 Price Detective.* Background \= ambient. Banner *"Round 2 of 3 · Spot the Trap"*, timer ring (\~18s). Build an HTML shopping card containing `Fake-deal product image.png`, with overlaid HTML text: *"MRP ₹4,999 · Now ₹999 — 80% OFF\!"*, a red countdown *"⏰ 02:59"*, *"🔥 Only 2 left\!"*, 3 five-star reviews. Prompt: *"Real deal, or a trick? Tap what gives it away."* Options — A *The countdown \+ "2 left" (manufactured urgency)* ✅ · B *The bright colours* · C *The brand name* · D *"Nothing — looks like a normal sale."* Reveal highlights the dark patterns: *"The ₹4,999 'MRP' was never a real price; the timer resets on refresh. Your child learns to expose this with real data in a mission called Price Detective."* → `state.responses.r2`; update score. **Next round →**

**Screen 4 · Round 3 · Talk to the Machine (capture \#4)** — *mirrors Mission 1.2 Study Buddy Bot.* Background \= ambient, with `AI tutor avatar.png` (transparent) floating top of card. Banner *"Round 3 of 3 · Talk to the Machine"*, timer ring (\~20s). Setup: *"Your child is stuck on fractions. You want AI to actually help them learn — not just hand over the answer. Which message do you send?"* Three chat-bubble options: A *"Solve this: 3/4 \+ 2/5"* · B *"Explain fractions."* · C *"Act as a patient tutor for a 12-year-old. Explain adding fractions with one everyday example, then give me 2 practice questions and wait for my answers before telling me if I'm right."* ✅ On tap, animate the avatar's "reply": A dumps a bare answer, B dumps a lecture, C runs a mini back-and-forth. Aha: *"That's called prompting — a real skill. Your child practises it weekly to make AI a tutor, not a cheat-sheet."* → `state.responses.r3`; update score. **See your result →**

**Screen 5 · The reveal — score \+ skill map.** Background \= ambient. Big **"You scored X / 3."** Warm band (0–1 *"Tricky, isn't it?"* · 2 *"Sharp\!"* · 3 *"Rare — you'd fit right in."*) \+ reassurance *"Most parents get 1 out of 3\. That's exactly why this classroom exists."* Then three tappable rows linking each round to the real mission: 🤖 **Round 1 → "Deepfake Detector"** · *AI & media literacy* — *"Your child trains an AI to tell real from fake."* 🔎 **Round 2 → "Price Detective"** · *Data & digital literacy* — *"Your child uses real data to expose fake deals and false claims."* 💬 **Round 3 → "Study Buddy Bot"** · *Prompt engineering* — *"Your child builds AI tutors by learning how to ask."* Footer: *"3 of 16 missions your child does across AI, STEM, Data, and Entrepreneurship."* **Continue →**

**Screen 6 · Reflection (capture \#5).** Background \= ambient. *"Now that you've been inside it — how do you feel about what your child is learning here?"* A *"Relieved — this is what they actually need."* · B *"Curious — I want to see more."* · C *"Motivated — I want to learn some of this myself."* · D *"Still unsure — show me more."* → `state.responses.reflection`; **POST `state.responses`** here. **Continue →**

**Screen 7 · Close.** Background \= `Image assets/Finale background.png` (amber dawn glow). Large: **"You were taught to memorise. They're being taught to think — with the machine."** Sub *"That's the gap this classroom closes. And now you've felt it too."* Amber CTA **"See the full mission list"** (wire your link) \+ secondary **↺ Play again** (reset state → Screen 0\) \+ *"Challenge another parent →"* (copies the link).

---

## Capture payload (Screen 6 → webhook)

```javascript
state.responses = {
  worry:'A|B|C|D',
  r1:{choice:'A|B', correct:true,  ms:4200},
  r2:{choice:'A|B|C|D', correct:false, ms:6100},
  r3:{choice:'A|B|C', correct:true,  ms:8300},
  score:2,                         // /3, derived from roundScore
  reflection:'A|B|C|D',
  ts:'<ISO string>'
};
```

## Build prompt (paste into Claude Code)

> Build a single-page browser game **"Could You Pass Your Kid's Class?"** — solo, \~3-min, phone-first, for parents. Full spec is `story.md` in this folder; the images are in `Image assets/` (reference them by the exact filenames in the asset-map table, spaces and parentheses included). **Read story.md first and build exactly to it.** Files: `index.html`, `styles.css`, `game.js`, `data.js`. Vanilla HTML/CSS/JS, no frameworks/build step, runs by double-click. No localStorage/sessionStorage — one in-memory `state`. Use the CSS variables verbatim; 18px base, ≥56px buttons, 200–250ms fades, animated timer ring, 3-segment round pip. Screen state machine `goTo(n)` for 0–7, each with `onEnter()`. `data.js` holds the worry MCQ, 3 rounds (content, correct answer, aha-line), skill-map rows, reflection MCQ. Randomise Round-1 card positions. Capture into `state.responses` per the payload; `POST` to a `WEBHOOK_URL` const on Screen 6 (fail silently if empty). Never shame a wrong answer. Degrade gracefully with emoji fallback if an image is missing. Comment `game.js` by screen. After building, walk all 8 screens, log `state.responses`, confirm no console errors, and give a 3-line "how to run \+ how to edit the questions" note.

### Folder to build

```
parent-reality-check/
├── index.html
├── styles.css
├── game.js
├── data.js
├── story.md
└── Image assets/   (the 8 files above — keep names exactly)
```

*End.*  
