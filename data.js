// data.js — all copy/content for "Could You Pass Your Kid's Class?"
// Edit the strings/options here to change what the game says without touching game.js.

const ASSETS = {
  heroTitleBg: "Image assets/Hero_Title_Bg.png",
  ambientBg: "Image assets/Ambient content background.png",
  finaleBg: "Image assets/Finale background.png",
  realPortrait: "Image assets/The real-looking portrait.png",
  aiFakePortrait: "Image assets/The AI fake portrait (with a spot-the-tell flaw).png",
  aiFakePortrait2: "Image assets/real_fake images.png",
  aiFakePortrait3: "Image assets/real_fake images 2.png",
  fakeDealProduct: "Image assets/Fake-deal product image.png",
  skaiLogo: "Image assets/SKAI Space_RBG(For Digital Use).webp",
  kidRealPhoto2: "Image assets/Screenshot 2026-08-24 131141.png",
  kidAiFakePhoto2: "Image assets/ChatGPT Image Aug 24, 2026, 01_09_53 PM (1).png",
};

// ---- Screen 0 · Title -------------------------------------------------
const TITLE = {
  title: "Could You Pass Your Kid's Class?",
  subtitle:
    "Your child's classroom now runs on AI. Take the 3-minute challenge — see if you could keep up.",
  cta: "Take the challenge",
};

// ---- Screen 1 · Parent details (capture #1) -----------------------------
const GRADE_OPTIONS = [
  "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9",
];

const DETAILS_Q = {
  eyebrow: "Before we begin",
  title: "A little about you",
  sub: "Just two things — takes five seconds.",
  fields: {
    name: { label: "Student's name", placeholder: "e.g. Aarav Sharma" },
    grade: { label: "Grade", placeholder: "Select grade" },
  },
  cta: "Start the challenge",
};

// ---- Screen 2 · The honest question, shown as a pop-up (capture #2) -----
const WORRY_Q = {
  eyebrow: "One honest question",
  prompt:
    "When you picture your child's future in a world run by AI, what sits with you most?",
  options: [
    { id: "A", label: "Will they even have a job AI doesn't do?" },
    { id: "B", label: "I don't understand this stuff, so I can't guide them." },
    { id: "C", label: "Is their school actually teaching the right things?" },
    { id: "D", label: "Honestly… I try not to think about it." },
  ],
  ack: "You're not alone — most parents pick that too.",
  cta: "Continue",
};

// ---- Screen 3 · "Take Challenge 1" interstitial --------------------------
const CHALLENGE1_INTRO = {
  eyebrow: "Challenge 1",
  title: "Real or AI?",
  sub: "You'll see 4 pictures, one at a time. Some are real. Some aren't.",
  cta: "Start Challenge 1",
};

// ---- Screen 4 · Challenge 1 · Real or AI? (capture #3) -------------------
const CHALLENGE1 = {
  banner: "Challenge 1 · Real or AI?",
  iconKey: "eye",
  timerSeconds: 45,
  instructions: "Look closely, then tap Real, AI, or It's confusing.",
  images: [
    {
      id: "real1",
      src: ASSETS.realPortrait,
      isFake: false,
      explain: "Real — a normal phone photo, a little imperfect, just like real life.",
    },
    {
      id: "fake1",
      src: ASSETS.aiFakePortrait,
      isFake: true,
      explain: "AI-made — too-perfect studio lighting, flawless skin, and a dreamy background blur.",
    },
    {
      id: "fake2",
      src: ASSETS.aiFakePortrait2,
      isFake: true,
      explain: "AI-made — the skin is unnaturally smooth and even, with none of the small blemishes a real camera picks up.",
    },
    {
      id: "fake3",
      src: ASSETS.aiFakePortrait3,
      isFake: true,
      explain: "AI-made — look at the background: it's a little too tidy and repetitive, a common AI tell.",
    },
  ],
  scoreMax: 4,
  aha: "Even adults get this ~50/50 — a coin flip. Your child trains to spot the tells.",
  missionLink: {
    iconKey: "eye",
    title: "Challenge 1 → “Deepfake Detector”",
    subject: "AI & media literacy",
    line: "Your child trains an AI to tell real from fake.",
  },
};

// ---- Screen 5 · Challenge 2 · Spot the Trap (capture #4) -----------------
const CHALLENGE2 = {
  banner: "Challenge 2 · Spot the Trap",
  iconKey: "search",
  timerSeconds: 60,
  card: {
    mrp: "MRP ₹4,999",
    price: "Now ₹999 — 80% OFF!",
    countdown: "02:59",
    urgency: "Only 2 left!",
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
  cta: "Confirm answer",
  missionLink: {
    iconKey: "search",
    title: "Challenge 2 → “Price Detective”",
    subject: "Data & digital literacy",
    line: "Your child uses real data to expose fake deals and false claims.",
  },
};

// ---- Screen 6 · The reveal — score + skill map --------------------------
const SCORE_BANDS = [
  { min: 0, max: 2, headline: "Tricky, isn't it?" },
  { min: 3, max: 4, headline: "Sharp." },
  { min: 5, max: 5, headline: "Rare — you'd fit right in." },
];
const SCORE_MAX = 5;
const SCORE_REASSURANCE =
  "Most parents get 2 out of 5. That's exactly why this classroom exists.";
const SKILL_MAP_FOOTER =
  "2 of 16 missions your child does across AI, STEM, Data, and Entrepreneurship.";

// ---- Screen 7 · Reflection (capture #5) ----------------------------------
const REFLECTION_Q = {
  eyebrow: "Quick reflection",
  prompt: "Now that you've been inside it — how do you feel about what your child is learning here?",
  options: [
    { id: "A", label: "Relieved — this is what they actually need." },
    { id: "B", label: "Curious — I want to see more." },
    { id: "C", label: "Motivated — I want to learn some of this myself." },
  ],
  cta: "Continue",
};

// ---- Screen 8 · Close ----------------------------------------------------
const CLOSE = {
  headline: "You were taught to memorise. They're being taught to think — with the machine.",
  sub: "That's the gap this classroom closes. And now you've felt it too.",
  ctaPrimary: "See the full mission list",
  ctaSecondary: "Your child's turn",
  ctaShare: "Challenge another parent →",
  shareMessage:
    "I just took the \"Could You Pass Your Kid's Class?\" challenge — it shows exactly what AI is teaching kids now. Bet you can't score higher than me.",
};

// ---- Phone gate — shown once, only if a parent taps "See the full mission
// list", so we can share the right follow-up with them ---------------------
const PHONE_GATE = {
  eyebrow: "One last thing",
  title: "Where should we send it?",
  sub: "Add your number and we'll open the full mission list.",
  field: { label: "Mobile number", placeholder: "10-digit mobile number" },
  hint: "Enter a valid 10-digit mobile number",
  cta: "Show me the missions",
};

// ---- Full mission map (shown in the "See the full mission list" sheet) --
const MISSION_MAP_META = {
  title: "SKAI Space · Mission Map",
  sub: "Grades 3–9 · 224 student missions · self-paced feeder + group mission per unit",
};

const MISSION_MAP = [
  { grade: 3, units: [
    { domain: "AI & Data", self: "CoinBot: Sort Smarter", selfSkill: "Comp. thinking", group: "The Rescue Centre Sort", groupType: "D", groupSkill: "Critical thinking" },
    { domain: "Design & Innov.", self: "The Bottle Detective", selfSkill: "Responsible action", group: "My Better Bottle", groupType: "D", groupSkill: "Empathy" },
    { domain: "Entrepreneurship", self: "Name It and Claim It", selfSkill: "Agency", group: "Brand Your Build", groupType: "D", groupSkill: "Communication" },
    { domain: "Structures & Mech.", self: "The Leaning Tower Fix", selfSkill: "Making & iteration", group: "Build the Un-Topple Tower", groupType: "K", groupSkill: "Responsible action" },
    { domain: "AI & Data", self: "Teach the Robot to Spot Fruit", selfSkill: "Comp. thinking", group: "Build the Class Fruit-Sorter", groupType: "K", groupSkill: "Comp. thinking" },
    { domain: "Design & Innov.", self: "Watch, Don't Ask", selfSkill: "Empathy", group: "The Problem Spotter Poster", groupType: "D", groupSkill: "Empathy" },
    { domain: "Electronics", self: "My Constellation, My Circuit", selfSkill: "Making & iteration", group: "The Correct-Answer Quiz Board", groupType: "K", groupSkill: "Responsible action" },
    { domain: "Entrepreneurship", self: "Who Wants This?", selfSkill: "Agency", group: "Find Your Product's Fan", groupType: "D", groupSkill: "Collaboration" },
    { domain: "Robotics", self: "The Marble Run Plan", selfSkill: "Creative thinking", group: "Build a Rolling Cart", groupType: "K", groupSkill: "Creative thinking" },
    { domain: "Structures & Mech.", self: "Bridge Before It Breaks", selfSkill: "Critical thinking", group: "Build a Shelf That Holds", groupType: "K", groupSkill: "Collaboration" },
    { domain: "AI & Data", self: "The Library Sorter", selfSkill: "Critical thinking", group: "The Library Sorter Rule book", groupType: "D", groupSkill: "Critical thinking" },
    { domain: "Design & Innov.", self: "Two Ways to Say It", selfSkill: "Coding", group: "Design a Sign Everyone Gets", groupType: "D", groupSkill: "Collaboration" },
    { domain: "Electronics", self: "Constellation Explorer & The Glow Mystery Box", selfSkill: "Making & iteration", group: "My Constellation Projector", groupType: "K", groupSkill: "Communication" },
    { domain: "Entrepreneurship", self: "The Little Shop Sign", selfSkill: "Agency", group: "Make a Shop Sign", groupType: "D", groupSkill: "Communication" },
    { domain: "Robotics", self: "Make It Move", selfSkill: "Creative thinking", group: "Build a Moving Machine", groupType: "K", groupSkill: "Creative thinking" },
    { domain: "Structures & Mech.", self: "The Wobbly Shelf", selfSkill: "Coding", group: "The Strongest Straw Bridge", groupType: "K", groupSkill: "Coding" },
  ]},
  { grade: 4, units: [
    { domain: "AI & Data", self: "The Two-Rule Sorter", selfSkill: "Comp. thinking", group: "Build a Two-Trait Sorter", groupType: "D", groupSkill: "Comp. thinking" },
    { domain: "Electronics", self: "What Does Each Part Do?", selfSkill: "Making & iteration", group: "Build a Working Torch", groupType: "K", groupSkill: "Communication" },
    { domain: "Robotics", self: "Steps in the Right Order", selfSkill: "Coding", group: "The Great Chocolate Race", groupType: "K", groupSkill: "Collaboration" },
    { domain: "Structures & Mech.", self: "Lift It With Less", selfSkill: "Agency", group: "Build a Lever Lifter", groupType: "K", groupSkill: "Responsible action" },
    { domain: "AI & Data", self: "Who Struggles Here?", selfSkill: "Critical thinking", group: "Design for the One Who Struggles", groupType: "D", groupSkill: "Critical thinking" },
    { domain: "Design & Innov.", self: "Name the Real Problem", selfSkill: "Empathy", group: "The Problem Statement Card", groupType: "D", groupSkill: "Empathy" },
    { domain: "Electronics", self: "The Two-Bulb Puzzle", selfSkill: "Making & iteration", group: "Build a Fair-Light Circuit", groupType: "K", groupSkill: "Communication" },
    { domain: "Entrepreneurship", self: "What Makes Yours Different?", selfSkill: "Creative thinking", group: "The One-Thing Pitch", groupType: "D", groupSkill: "Creative thinking" },
    { domain: "Robotics", self: "Plan the Step-Bot Path", selfSkill: "Responsible action", group: "Build a Step-Bot Path", groupType: "K", groupSkill: "Comp. thinking" },
    { domain: "Structures & Mech.", self: "The Seesaw for Everyone", selfSkill: "Agency", group: "The Universal Seesaw", groupType: "K", groupSkill: "Collaboration" },
    { domain: "AI & Data", self: "SCAM OR SAFE?", selfSkill: "Critical thinking", group: "The Digital Magazine", groupType: "D", groupSkill: "Collaboration" },
    { domain: "Design & Innov.", self: "Before and After", selfSkill: "Empathy", group: "Redesign One Everyday Thing", groupType: "D", groupSkill: "Empathy" },
    { domain: "Electronics", self: "The Sound Maker", selfSkill: "Making & iteration", group: "Build a Signal Buzzer", groupType: "K", groupSkill: "Communication" },
    { domain: "Entrepreneurship", self: "Same Thing, New Look", selfSkill: "Creative thinking", group: "Repackage It", groupType: "D", groupSkill: "Communication" },
    { domain: "Robotics", self: "The Chocolate Factory Line", selfSkill: "Coding", group: "The Factory Rescue Relay", groupType: "D", groupSkill: "Coding" },
    { domain: "Structures & Mech.", self: "The Pulley Shortcut", selfSkill: "Agency", group: "Build a Pulley Hoist", groupType: "K", groupSkill: "Responsible action" },
  ]},
  { grade: 5, units: [
    { domain: "Design & Innov.", self: "Many Ideas Before One", selfSkill: "Agency", group: "The Idea Wall", groupType: "D", groupSkill: "Collaboration" },
    { domain: "Electronics", self: "One Sensor, Two Jobs", selfSkill: "Making & iteration", group: "Sound Activated Lamp", groupType: "K", groupSkill: "Making & iteration" },
    { domain: "Entrepreneurship", self: "Who is this App for?", selfSkill: "Empathy", group: "App Expansion Pitch", groupType: "D", groupSkill: "Communication" },
    { domain: "Robotics", self: "Tune the Threshold", selfSkill: "Making & iteration", group: "Build a Reacting Bot", groupType: "K", groupSkill: "Coding" },
    { domain: "AI & Data", self: "Will the Stadium Sell Out?", selfSkill: "Comp. thinking", group: "Predicting the Final", groupType: "D", groupSkill: "Comp. thinking" },
    { domain: "Design & Innov.", self: "Wild Then Useful", selfSkill: "Agency", group: "Build the Right-Material Object", groupType: "K", groupSkill: "Collaboration" },
    { domain: "Electronics", self: "Series or Parallel?", selfSkill: "Comp. thinking", group: "Build a Brightness Dial", groupType: "K", groupSkill: "Making & iteration" },
    { domain: "Entrepreneurship", self: "Who Is This Really For?", selfSkill: "Empathy", group: "The Customer Profile", groupType: "D", groupSkill: "Communication" },
    { domain: "Robotics", self: "Sense and React", selfSkill: "Coding", group: "Build a Triangle-Braced Frame", groupType: "K", groupSkill: "Responsible action" },
    { domain: "Structures & Mech.", self: "Match the Material", selfSkill: "Creative thinking", group: "The Repair Bench", groupType: "K", groupSkill: "Creative thinking" },
    { domain: "AI & Data", self: "The Autocomplete Trap", selfSkill: "Critical thinking", group: "Train the Typing Bot", groupType: "D", groupSkill: "Critical thinking" },
    { domain: "Design & Innov.", self: "Ideas From Constraints", selfSkill: "Agency", group: "Rescue a Wild Idea", groupType: "D", groupSkill: "Collaboration" },
    { domain: "Electronics", self: "The Dimmer Puzzle", selfSkill: "Critical thinking", group: "Build a Never-Dark Circuit", groupType: "K", groupSkill: "Collaboration" },
    { domain: "Entrepreneurship", self: "Feature or Frill?", selfSkill: "Empathy", group: "Cut It to the Core", groupType: "D", groupSkill: "Communication" },
    { domain: "Robotics", self: "The Strongest Shape", selfSkill: "Responsible action", group: "Build a Two-Job Sensor Rig", groupType: "K", groupSkill: "Coding" },
    { domain: "Structures & Mech.", self: "Sink or Sail", selfSkill: "Creative thinking", group: "The Doghouse Build", groupType: "D", groupSkill: "Responsible action" },
  ]},
  { grade: 6, units: [
    { domain: "AI & Data", self: "The Fake News Detector", selfSkill: "Critical thinking", group: "The One-Tap Checker App", groupType: "D", groupSkill: "Responsible action" },
    { domain: "Design & Innov.", self: "Prototype to Think", selfSkill: "Creative thinking", group: "Paper-Test Your App", groupType: "D", groupSkill: "Creative thinking" },
    { domain: "Electronics", self: "The Right Warning", selfSkill: "Making & iteration", group: "Build a Noticed Alert", groupType: "K", groupSkill: "Making & iteration" },
    { domain: "Robotics", self: "The Self-Parking Rule", selfSkill: "Comp. thinking", group: "Build a Stop-in-Time Bot", groupType: "K", groupSkill: "Comp. thinking" },
    { domain: "AI & Data", self: "When the Model Is Wrong", selfSkill: "Responsible action", group: "Build a Card Prototype", groupType: "K", groupSkill: "Responsible action" },
    { domain: "Design & Innov.", self: "Cheap and Fast", selfSkill: "Creative thinking", group: "Storyboard the Solution", groupType: "D", groupSkill: "Empathy" },
    { domain: "Electronics", self: "From World to Signal", selfSkill: "Coding", group: "Build a Sensor Readout", groupType: "K", groupSkill: "Making & iteration" },
    { domain: "Entrepreneurship", self: "Make It, Sell It", selfSkill: "Agency", group: "The Market Stall Pitch", groupType: "D", groupSkill: "Agency" },
    { domain: "Robotics", self: "Tune the Alarm", selfSkill: "Coding", group: "LPG Gas Detector", groupType: "K", groupSkill: "Collaboration" },
    { domain: "Structures & Mech.", self: "Push or Pull?", selfSkill: "Critical thinking", group: "Build a Load-Smart Bridge", groupType: "K", groupSkill: "Collaboration" },
    { domain: "AI & Data", self: "Garbage In, Garbage Out", selfSkill: "Responsible action", group: "Build a Wrong-Answer Catcher", groupType: "D", groupSkill: "Communication" },
    { domain: "Design & Innov.", self: "Show, Don't Tell", selfSkill: "Empathy", group: "The Zomato Delivery Bot", groupType: "D", groupSkill: "Empathy" },
    { domain: "Electronics", self: "The Automatic Basketball Ref", selfSkill: "Coding", group: "Smoke Detector for Home", groupType: "K", groupSkill: "Communication" },
    { domain: "Entrepreneurship", self: "Would They Pay?", selfSkill: "Agency", group: "The Willing-to-Pay Test", groupType: "D", groupSkill: "Agency" },
    { domain: "Robotics", self: "Robo Driving Test", selfSkill: "Comp. thinking", group: "Design Your Self-Driving Car", groupType: "D", groupSkill: "Communication" },
    { domain: "Structures & Mech.", self: "The Overloaded Beam", selfSkill: "Critical thinking", group: "Build a Beam That Won't Sag", groupType: "K", groupSkill: "Collaboration" },
  ]},
  { grade: 7, units: [
    { domain: "AI & Data", self: "Pick the Playing XI", selfSkill: "Responsible action", group: "The Selection Table", groupType: "D", groupSkill: "Empathy" },
    { domain: "Entrepreneurship", self: "Problem First, Solution Second", selfSkill: "Communication", group: "The Problem-First Pitch", groupType: "D", groupSkill: "Collaboration" },
    { domain: "Robotics", self: "The Precise Turn", selfSkill: "Making & iteration", group: "Build a Precision Arm", groupType: "K", groupSkill: "Making & iteration" },
    { domain: "Structures & Mech.", self: "The Joint That Holds", selfSkill: "Comp. thinking", group: "Build a Strong-Joint Frame", groupType: "K", groupSkill: "Comp. thinking" },
    { domain: "AI & Data", self: "Bias In, Bias Out", selfSkill: "Responsible action", group: "Build the Fair Sorter", groupType: "K", groupSkill: "Responsible action" },
    { domain: "Design & Innov.", self: "Secure Messaging App", selfSkill: "Agency", group: "The User-Test Clinic", groupType: "D", groupSkill: "Critical thinking" },
    { domain: "Electronics", self: "The Blind Crossing Challenge", selfSkill: "Agency", group: "Smart Crossing for the Visually Impaired", groupType: "K", groupSkill: "Coding" },
    { domain: "Entrepreneurship", self: "Know Your Market", selfSkill: "Communication", group: "The Market-Fit Pitch", groupType: "D", groupSkill: "Collaboration" },
    { domain: "Robotics", self: "Torque and the Heavy Load", selfSkill: "Coding", group: "Build a Heavy-Lift Geartrain", groupType: "K", groupSkill: "Coding" },
    { domain: "Structures & Mech.", self: "Where Do Things Connect?", selfSkill: "Making & iteration", group: "Build a Connected Structure", groupType: "K", groupSkill: "Comp. thinking" },
    { domain: "AI & Data", self: "The Smart Attendance Camera", selfSkill: "Empathy", group: "The Unbiased Attendance System", groupType: "D", groupSkill: "Empathy" },
    { domain: "Design & Innov.", self: "Test It on a Real User", selfSkill: "Critical thinking", group: "The Five-User Study", groupType: "D", groupSkill: "Critical thinking" },
    { domain: "Electronics", self: "The Tap That Won't See You", selfSkill: "Comp. thinking", group: "Automatic Bin", groupType: "K", groupSkill: "Creative thinking" },
    { domain: "Entrepreneurship", self: "The Skewed Recommender", selfSkill: "Communication", group: "Fix the Recommender's Diet", groupType: "D", groupSkill: "Collaboration" },
    { domain: "Robotics", self: "How Do Gears on My Cycle Work?", selfSkill: "Agency", group: "Set Your F1 Team's Gearbox", groupType: "D", groupSkill: "Coding" },
    { domain: "Structures & Mech.", self: "The Control Dial", selfSkill: "Creative thinking", group: "Build a Controllable Output", groupType: "K", groupSkill: "Creative thinking" },
  ]},
  { grade: 8, units: [
    { domain: "AI & Data", self: "Where Do You Set the Alarm?", selfSkill: "Responsible action", group: "Smart Threshold App", groupType: "D", groupSkill: "Responsible action" },
    { domain: "Design & Innov.", self: "UI/UX Detective", selfSkill: "Agency", group: "Design the Right Screen", groupType: "D", groupSkill: "Critical thinking" },
    { domain: "Electronics", self: "Day or Night?", selfSkill: "Critical thinking", group: "Night-Safe Lamp", groupType: "K", groupSkill: "Critical thinking" },
    { domain: "Structures & Mech.", self: "The Wobbly Water Tank", selfSkill: "Creative thinking", group: "Steady Tower Build", groupType: "K", groupSkill: "Creative thinking" },
    { domain: "AI & Data", self: "Create My Plate!", selfSkill: "Responsible action", group: "Build the Digital Health Coach", groupType: "D", groupSkill: "Empathy" },
    { domain: "Design & Innov.", self: "Five Users, One App", selfSkill: "Creative thinking", group: "The Trade-off Clinic", groupType: "D", groupSkill: "Creative thinking" },
    { domain: "Electronics", self: "The Weak Signal", selfSkill: "Making & iteration", group: "Motor-Lift Rig", groupType: "K", groupSkill: "Making & iteration" },
    { domain: "Entrepreneurship", self: "The Free App Making Crores", selfSkill: "Comp. thinking", group: "Build an App That Lasts", groupType: "D", groupSkill: "Comp. thinking" },
    { domain: "Robotics", self: "Save The Clothes!", selfSkill: "Coding", group: "Weather Wise Bot", groupType: "K", groupSkill: "Collaboration" },
    { domain: "Structures & Mech.", self: "Where Should the Wall Be Thickest?", selfSkill: "Making & iteration", group: "Build the Right-Shaped Dam", groupType: "K", groupSkill: "Communication" },
    { domain: "AI & Data", self: "Deepfake Detective", selfSkill: "Empathy", group: "Build the Deepfake Detector", groupType: "D", groupSkill: "Empathy" },
    { domain: "Design & Innov.", self: "UI Detective", selfSkill: "Coding", group: "UX Detective: Squad Mode", groupType: "D", groupSkill: "Critical thinking" },
    { domain: "Electronics", self: "Plan Your Box", selfSkill: "Agency", group: "Alert Panel Build", groupType: "K", groupSkill: "Communication" },
    { domain: "Entrepreneurship", self: "Price It Right", selfSkill: "Comp. thinking", group: "The Viability Calculator", groupType: "D", groupSkill: "Communication" },
    { domain: "Robotics", self: "Two Senses Are Better", selfSkill: "Coding", group: "Weather-Wise Bot", groupType: "K", groupSkill: "Collaboration" },
    { domain: "Structures & Mech.", self: "Shake or Hold?", selfSkill: "Agency", group: "Build a Shake-Proof Tower", groupType: "K", groupSkill: "Collaboration" },
  ]},
  { grade: 9, units: [
    { domain: "Design & Innov.", self: "UI/UX Detective: The Systemic Cut", selfSkill: "Empathy", group: "Audit an App for Everyone It Excludes", groupType: "D", groupSkill: "Empathy" },
    { domain: "Entrepreneurship", self: "Map the Whole Ecosystem", selfSkill: "Responsible action", group: "Build the Impact-Tracking Model", groupType: "D", groupSkill: "Collaboration" },
    { domain: "Robotics", self: "Two Ways to Solve It", selfSkill: "Critical thinking", group: "Compare Two Control Algorithms", groupType: "K", groupSkill: "Coding" },
    { domain: "Structures & Mech.", self: "Fixed Budget, Maximum Span", selfSkill: "Creative thinking", group: "Build the Optimised Truss", groupType: "K", groupSkill: "Creative thinking" },
    { domain: "AI & Data", self: "The Recall Hearing", selfSkill: "Communication", group: "The Relaunch: Self-Driving 2.0", groupType: "D", groupSkill: "Communication" },
    { domain: "Design & Innov.", self: "Who Did We Forget?", selfSkill: "Empathy", group: "Redesign for the Forgotten User", groupType: "D", groupSkill: "Empathy" },
    { domain: "Electronics", self: "Where Does the Power Go?", selfSkill: "Coding", group: "Build the Power-Efficient Circuit", groupType: "K", groupSkill: "Making & iteration" },
    { domain: "Entrepreneurship", self: "Profit and Purpose in One Model", selfSkill: "Critical thinking", group: "The Sustainability Pitch", groupType: "D", groupSkill: "Responsible action" },
    { domain: "Robotics", self: "Design for a Real Brief", selfSkill: "Making & iteration", group: "Build the Brief-Ready Bot", groupType: "K", groupSkill: "Making & iteration" },
    { domain: "Structures & Mech.", self: "MERIDIAN - Hydraulics Recovery Protocol", selfSkill: "Comp. thinking", group: "Hydraulic Lift", groupType: "K", groupSkill: "Comp. thinking" },
    { domain: "AI & Data", self: "Ctrl + Alt + Build", selfSkill: "Communication", group: "The Dev Is in Detail", groupType: "D", groupSkill: "Communication" },
    { domain: "Design & Innov.", self: "The Ripple Effect", selfSkill: "Agency", group: "Map the Second-Order Effect", groupType: "D", groupSkill: "Responsible action" },
    { domain: "Electronics", self: "The Standby Drain", selfSkill: "Agency", group: "Build a Power-Monitor Tool", groupType: "K", groupSkill: "Collaboration" },
    { domain: "Entrepreneurship", self: "Startup Wiz", selfSkill: "Agency", group: "The Launch Night", groupType: "D", groupSkill: "Collaboration" },
    { domain: "Robotics", self: "When the Robot Disagrees With Itself", selfSkill: "Critical thinking", group: "Build the Conflict-Resolution Bot", groupType: "K", groupSkill: "Coding" },
    { domain: "Structures & Mech.", self: "The Weight You Don't See", selfSkill: "Comp. thinking", group: "Build a Wind-Tuned Tower", groupType: "K", groupSkill: "Creative thinking" },
  ]},
];

// ---- Kids mini-game · "Can You Spot the Fake AI?" ------------------------
// Launched from the close screen's "Your child's turn" button. Harder than
// the parent's challenge: 4 pictures, one at a time, swipe or tap.
const KID_GAME = {
  intro: {
    eyebrow: "Your turn!",
    title: "Can YOU Spot the Fake AI?",
    sub: "4 pictures, one at a time. Swipe or tap: Real, Fake, or Not sure.",
    cta: "Start my challenge",
  },
  challenge: {
    banner: "Real, Fake, or Not sure?",
    iconKey: "eye",
    timerSeconds: 45,
    instructions: "Swipe right for Real, left for Fake — or tap a button.",
    images: [
      {
        id: "real1",
        src: ASSETS.realPortrait,
        isFake: false,
        explain: "Real — a normal phone photo, a little imperfect, just like real life.",
      },
      {
        id: "fake1",
        src: ASSETS.aiFakePortrait,
        isFake: true,
        explain: "AI-made — too-perfect studio lighting, flawless skin, and a dreamy blurred background.",
      },
      {
        id: "real2",
        src: ASSETS.kidRealPhoto2,
        isFake: false,
        explain: "Real — notice the natural light and the everyday room in the background.",
      },
      {
        id: "fake2",
        src: ASSETS.kidAiFakePhoto2,
        isFake: true,
        explain: "AI-made — the skin texture and background are a little too smooth.",
      },
    ],
  },
  aha: "AI pictures often look *too* perfect. Once you know the tells, they're easier to spot.",
  scoreBands: [
    { min: 0, max: 1, headline: "Tricky, right? AI is getting good." },
    { min: 2, max: 3, headline: "Nice — sharp eyes!" },
    { min: 4, max: 4, headline: "Perfect! You caught every one." },
  ],
  scoreMax: 4,
  reassurance: "Most kids get 2 of 4 on their first try.",
  cfu: {
    eyebrow: "One quick question",
    prompt: "Want to learn how to spot a fake AI picture every time?",
    options: [
      { id: "A", label: "Yes — teach me the tricks!" },
      { id: "B", label: "I want to try more games like this." },
      { id: "C", label: "Maybe later." },
    ],
  },
  close: {
    headline: "Nice work, detective.",
    sub: "That's exactly what SKAI Space teaches every week.",
    cta: "Done",
  },
};
