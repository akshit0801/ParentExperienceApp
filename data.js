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

// Every Indian state + union territory, each with its major cities —
// powers the state → city cascading dropdown on the details screen.
const INDIA_GEO = [
  { state: "Andaman and Nicobar Islands", cities: ["Port Blair"] },
  { state: "Andhra Pradesh", cities: ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Tirupati", "Amaravati"] },
  { state: "Arunachal Pradesh", cities: ["Itanagar", "Naharlagun", "Pasighat", "Tawang"] },
  { state: "Assam", cities: ["Guwahati", "Dibrugarh", "Silchar", "Jorhat", "Tezpur"] },
  { state: "Bihar", cities: ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Darbhanga"] },
  { state: "Chandigarh", cities: ["Chandigarh"] },
  { state: "Chhattisgarh", cities: ["Raipur", "Bhilai", "Bilaspur", "Durg", "Korba"] },
  { state: "Dadra and Nagar Haveli and Daman and Diu", cities: ["Daman", "Diu", "Silvassa"] },
  { state: "Delhi", cities: ["New Delhi", "Dwarka", "Rohini", "Saket", "Karol Bagh"] },
  { state: "Goa", cities: ["Panaji", "Margao", "Vasco da Gama", "Mapusa"] },
  { state: "Gujarat", cities: ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Gandhinagar", "Bhavnagar"] },
  { state: "Haryana", cities: ["Gurugram", "Faridabad", "Panipat", "Ambala", "Karnal", "Hisar"] },
  { state: "Himachal Pradesh", cities: ["Shimla", "Manali", "Dharamshala", "Solan", "Mandi"] },
  { state: "Jammu and Kashmir", cities: ["Srinagar", "Jammu", "Anantnag", "Baramulla"] },
  { state: "Jharkhand", cities: ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro", "Hazaribagh"] },
  { state: "Karnataka", cities: ["Bengaluru", "Mysuru", "Mangaluru", "Hubballi", "Belagavi", "Shivamogga"] },
  { state: "Kerala", cities: ["Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur", "Kollam", "Kannur"] },
  { state: "Ladakh", cities: ["Leh", "Kargil"] },
  { state: "Lakshadweep", cities: ["Kavaratti"] },
  { state: "Madhya Pradesh", cities: ["Bhopal", "Indore", "Jabalpur", "Gwalior", "Ujjain"] },
  { state: "Maharashtra", cities: ["Mumbai", "Pune", "Nagpur", "Nashik", "Aurangabad", "Thane"] },
  { state: "Manipur", cities: ["Imphal", "Thoubal", "Bishnupur"] },
  { state: "Meghalaya", cities: ["Shillong", "Tura", "Jowai"] },
  { state: "Mizoram", cities: ["Aizawl", "Lunglei", "Champhai"] },
  { state: "Nagaland", cities: ["Kohima", "Dimapur", "Mokokchung"] },
  { state: "Odisha", cities: ["Bhubaneswar", "Cuttack", "Rourkela", "Puri", "Sambalpur"] },
  { state: "Puducherry", cities: ["Puducherry", "Karaikal", "Mahe", "Yanam"] },
  { state: "Punjab", cities: ["Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Mohali", "Bathinda"] },
  { state: "Rajasthan", cities: ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Ajmer", "Bikaner"] },
  { state: "Sikkim", cities: ["Gangtok", "Namchi", "Gyalshing"] },
  { state: "Tamil Nadu", cities: ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Tirunelveli"] },
  { state: "Telangana", cities: ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar", "Khammam"] },
  { state: "Tripura", cities: ["Agartala", "Udaipur", "Dharmanagar"] },
  { state: "Uttar Pradesh", cities: ["Lucknow", "Kanpur", "Agra", "Varanasi", "Noida", "Ghaziabad", "Prayagraj", "Meerut"] },
  { state: "Uttarakhand", cities: ["Dehradun", "Haridwar", "Rishikesh", "Nainital", "Haldwani"] },
  { state: "West Bengal", cities: ["Kolkata", "Howrah", "Durgapur", "Siliguri", "Asansol"] },
];

const DETAILS_Q = {
  eyebrow: "Before we begin",
  title: "A little about you",
  sub: "So we can tailor the challenge to your child — takes ten seconds.",
  fields: {
    name: { label: "Your name", placeholder: "e.g. Priya Sharma" },
    grade: { label: "Child's grade", placeholder: "Select grade" },
    phone: { label: "Mobile number", placeholder: "10-digit mobile number" },
    state: { label: "State", placeholder: "Select state" },
    city: { label: "City", placeholder: "Select city" },
  },
  phoneHint: "Enter a valid 10-digit mobile number",
  cta: "Start the challenge",
};

// ---- Screen 2 · The honest question (capture #2) -----------------------
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
  ack: "You're not alone — most parents pick that too. Let's look at what your child is actually learning.",
};

// ---- Screen 3 · Round 1 · Real or AI? (capture #3) ----------------------
const ROUND1 = {
  banner: "Round 1 of 4 · Real or AI?",
  iconKey: "eye",
  timerSeconds: 30,
  prompt: "One of these was made by AI. Which one?",
  correct: "aiFake", // the AI fake portrait is always correct
  captionOnFake:
    "The tells: too-perfect studio lighting, flawless skin, dreamy background blur. Real phone selfies look like the other one.",
  aha: "Even adults get this ~50/50 — a coin flip. Your child trains to spot the tells.",
  missionLink: {
    iconKey: "eye",
    title: "Round 1 → “Deepfake Detector”",
    subject: "AI & media literacy",
    line: "Your child trains an AI to tell real from fake.",
  },
};

// ---- Screen 4 · Round 2 · Spot the Trap (capture #4) --------------------
const ROUND2 = {
  banner: "Round 2 of 4 · Spot the Trap",
  iconKey: "search",
  timerSeconds: 30,
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
  missionLink: {
    iconKey: "search",
    title: "Round 2 → “Price Detective”",
    subject: "Data & digital literacy",
    line: "Your child uses real data to expose fake deals and false claims.",
  },
};

// ---- Screen 5 · Round 3 · Talk to the Machine (capture #5) --------------
const ROUND3 = {
  banner: "Round 3 of 4 · Talk to the Machine",
  iconKey: "chat",
  timerSeconds: 30,
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
    iconKey: "chat",
    title: "Round 3 → “Study Buddy Bot”",
    subject: "Prompt engineering",
    line: "Your child builds AI tutors by learning how to ask.",
  },
};

// ---- Screen 6 · Round 4 · Bug Hunt (capture #6) --------------------------
const ROUND4 = {
  banner: "Round 4 of 4 · Bug Hunt",
  iconKey: "code",
  timerSeconds: 30,
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
    iconKey: "code",
    title: "Round 4 → “Bug Hunt”",
    subject: "STEM & computational thinking",
    line: "Your child breaks big problems into exact steps — and finds what's missing.",
  },
};

// ---- Screen 7 · The reveal — score + skill map --------------------------
const SCORE_BANDS = [
  { min: 0, max: 1, headline: "Tricky, isn't it?" },
  { min: 2, max: 3, headline: "Sharp." },
  { min: 4, max: 4, headline: "Rare — you'd fit right in." },
];
const SCORE_MAX = 4;
const SCORE_REASSURANCE =
  "Most parents get 1 out of 4. That's exactly why this classroom exists.";
const SKILL_MAP_FOOTER =
  "4 of 16 missions your child does across AI, STEM, Data, and Entrepreneurship.";

// ---- Screen 8 · Reflection (capture #7) ---------------------------------
const REFLECTION_Q = {
  eyebrow: "Quick reflection",
  prompt: "Now that you've been inside it — how do you feel about what your child is learning here?",
  options: [
    { id: "A", label: "Relieved — this is what they actually need." },
    { id: "B", label: "Curious — I want to see more." },
    { id: "C", label: "Motivated — I want to learn some of this myself." },
  ],
};

// ---- Screen 9 · Close ----------------------------------------------------
const CLOSE = {
  headline: "You were taught to memorise. They're being taught to think — with the machine.",
  sub: "That's the gap this classroom closes. And now you've felt it too.",
  ctaPrimary: "See the full mission list",
  ctaSecondary: "Your child's turn",
  ctaShare: "Challenge another parent →",
  shareMessage:
    "I just took the \"Could You Pass Your Kid's Class?\" challenge — it shows exactly what AI is teaching kids now. Bet you can't score higher than me.",
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
// the parent's round: 5 pictures, 2 are AI, child must find both.
// Placeholder file paths below (kg2/kg3/kg4) don't exist yet — the existing
// image-fallback system shows a clean icon instead of a broken image until
// real files are dropped in at these exact paths.
const KID_GAME = {
  intro: {
    eyebrow: "Your turn!",
    title: "Can YOU Spot the Fake AI?",
    sub: "Mum or Dad just tried this. Yours is harder — 4 pictures, one at a time. Swipe or tap to say Real, Fake, or Not sure.",
    cta: "Start my challenge",
  },
  challenge: {
    banner: "Real, Fake, or Not sure?",
    iconKey: "eye",
    timerSeconds: 45,
    instructions: "Swipe right for Real, left for Fake — or tap a button below. It's OK to say you're not sure.",
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
        explain: "AI-made — too-perfect studio lighting, flawless skin, and a dreamy blurred background are classic AI tells.",
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
        explain: "AI-made — look closely at the skin texture and background details; AI often smooths these too much.",
      },
    ],
  },
  aha: "AI pictures often look *too* perfect — flawless skin, dreamy backgrounds, and small mistakes in hands, ears, or edges. Once you know the tells, they get much easier to spot.",
  scoreBands: [
    { min: 0, max: 1, headline: "Tricky, right? AI is getting good." },
    { min: 2, max: 3, headline: "Nice — sharp eyes!" },
    { min: 4, max: 4, headline: "Perfect! You caught every one." },
  ],
  scoreMax: 4,
  reassurance: "Most kids get 2 of 4 on their first try. Now you know exactly what to look for.",
  cfu: {
    eyebrow: "One quick question",
    prompt: "Would you like to learn how to spot a fake AI picture every time?",
    options: [
      { id: "A", label: "Yes — teach me the tricks!" },
      { id: "B", label: "I want to try more games like this." },
      { id: "C", label: "Maybe later." },
    ],
  },
  close: {
    headline: "Nice work, detective.",
    sub: "Spotting real from fake is a real skill — and it's exactly what SKAI Space teaches every week.",
    cta: "Done",
  },
};

// ---- Narrator lines (spoken via TTS, or a matching mp3 in Voice assets/) --
const NARRATION = {
  s_title:
    "Could you pass your kid's class? Your child's classroom now runs on AI. Take the three minute challenge and see if you could keep up.",
  s_details_prompt:
    "Quick one before we start. Tell us a little about you and your child.",
  s_worry_prompt:
    "One honest question. When you picture your child's future in a world run by AI, what sits with you most?",
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
