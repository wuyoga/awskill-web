import type { AgentName } from "@/lib/data/catalog";

const NONE = "Not found by static scan or manual review";
const PENDING = "Security assessment not completed yet";

type SkillEn = {
  description: string;
  tags: string[];
  riskSummary: string;
  /** Permission reasons in the same order as data.ts: read, write, shell, network, credentials, delete. */
  reasons: string[];
  useCases: [string, string][];
  notFor: string;
  prerequisites: string;
  notes?: Partial<Record<AgentName, string>>;
};

export const skillEn: Record<string, SkillEn> = {
  "frontend-design": {
    description:
      "Builds production-grade frontends with a clear visual direction, avoiding templated, generic AI aesthetics.",
    tags: ["UI design", "React", "Responsive"],
    riskSummary:
      "No credential access, system directory changes or unknown network requests found.",
    reasons: [
      "Understands existing screens and components",
      "Limited to the working directory",
      "Only runs build and local preview commands",
      NONE,
      NONE,
      NONE,
    ],
    useCases: [
      [
        "Set a visual direction",
        "Decide type, color, layout and motion before coding to avoid template output.",
      ],
      [
        "Build complete interfaces",
        "Turn design decisions into runnable, responsive and accessible code.",
      ],
      [
        "Improve existing pages",
        "Spot weak hierarchy, low contrast and inconsistencies, then fix them.",
      ],
    ],
    notFor:
      "Backend-only work, pixel-perfect replication without a reference design, complex interactions without a browser to verify.",
    prerequisites: "Node.js 18+",
    notes: {
      Cursor:
        "Works once converted to a rule, but referenced example files are not loaded automatically.",
    },
  },
  "agent-browser": {
    description:
      "Lets the Agent navigate pages, fill forms, take screenshots and extract content for end-to-end checks and automation.",
    tags: ["Browser", "Testing", "Automation"],
    riskSummary:
      "Runs commands and visits arbitrary pages; can read session data when a signed-in browser profile is used.",
    reasons: [
      "Reads configuration files only",
      "Writes screenshots and extracted results only",
      "Starts the browser CLI process",
      "Visits pages specified by the task",
      "Can read cookies when using a signed-in profile",
      NONE,
    ],
    useCases: [
      ["End-to-end flow checks", "Sign in, submit forms and save a screenshot of every step."],
      ["Web content extraction", "Pull tables and lists out of complex pages as structured data."],
      ["Automate repetitive tasks", "Hand fixed back-office routines to the Agent and keep a log."],
    ],
    notFor:
      "Sites with complex CAPTCHAs, payment confirmations, or scraping that violates a site's terms.",
    prerequisites: "Node.js 20+, Chromium",
    notes: {
      Cursor: "The CLI must be added to PATH manually before the Agent can call it.",
      Windsurf: "On Windows, Chromium must be installed manually on first run.",
    },
  },
  "find-skills": {
    description:
      "Finds and installs the right Agent Skill from a task description, extending what your Agent can do.",
    tags: ["Skill discovery", "Workflow", "CLI"],
    riskSummary:
      "Downloads and installs third-party Skills; installed content needs its own review.",
    reasons: [
      "Reads the list of installed Skills",
      "Writes to the Skill install directory",
      "Calls npx install commands",
      "Queries the Skill index and downloads",
      NONE,
      NONE,
    ],
    useCases: [
      [
        "Find Skills by task",
        "Describe a need in plain language and get candidates with install commands.",
      ],
      ["Fill capability gaps", "Suggests specialist Skills when a task gets stuck."],
      ["Standardize team toolkits", "Quickly install the team's agreed Skill set in new projects."],
    ],
    notFor: "Offline environments or controlled projects that forbid installing third-party code.",
    prerequisites: "Node.js 18+",
    notes: { Windsurf: "Search works, but the IDE must be restarted after installing." },
  },
  "systematic-debugging": {
    description:
      "Guides the Agent through observe, hypothesize, verify and review loops to locate complex software bugs.",
    tags: ["Debugging", "Code quality", "Method"],
    riskSummary: "Only reads and edits project code; commands are limited to running tests.",
    reasons: [
      "Reads relevant source and logs",
      "Fixes code and adds tests",
      "Only runs tests and repro scripts",
      NONE,
      NONE,
      NONE,
    ],
    useCases: [
      ["Track down flaky bugs", "Reproduce reliably first, then narrow down instead of guessing."],
      [
        "Verify root-cause hypotheses",
        "Every hypothesis gets a verification step and a recorded result.",
      ],
      ["Protect fixes with tests", "Adds regression tests after the fix so the bug stays fixed."],
    ],
    notFor: "Quick trial-and-error prototyping, or projects without a runnable test setup.",
    prerequisites: "None",
    notes: { Cursor: "The rule loads, but verification steps are often skipped in long tasks." },
  },
  "requesting-code-review": {
    description:
      "Reviews changes against a checklist before merging, flagging defects, missing tests and maintainability issues.",
    tags: ["Code review", "Git", "Quality"],
    riskSummary: "Read-only review; commands are limited to reading Git diffs.",
    reasons: [
      "Reads the changes and their context",
      "Does not modify code during review",
      "Only runs git diff / git log",
      NONE,
      NONE,
      NONE,
    ],
    useCases: [
      [
        "Self-review before merging",
        "Catch obvious defects and missing tests before opening a PR.",
      ],
      ["Review others' changes", "Produce structured feedback against a shared checklist."],
      ["Codify team standards", "Turn the team's review rules into reusable checks."],
    ],
    notFor: "Replacing a security audit, or reviews that need lots of unwritten business context.",
    prerequisites: "A Git repository",
    notes: { Codex: "Sub-agent review steps are unsupported; falls back to a single review pass." },
  },
  brainstorming: {
    description:
      "Clarifies goals, constraints and acceptance criteria through step-by-step questions before implementation.",
    tags: ["Requirements", "PRD", "Planning"],
    riskSummary: "Conversation only, plus writing a requirements doc. Runs no commands.",
    reasons: [
      "Reads existing docs for context",
      "Writes the requirements doc only",
      "Runs no commands",
      NONE,
      NONE,
      NONE,
    ],
    useCases: [
      ["Clarify fuzzy requirements", "Asks one question at a time to converge on goals and scope."],
      ["Compare approaches", "Lists 2–3 options with trade-offs before committing to one."],
      ["Write a spec", "Produces a design doc ready to hand to implementation."],
    ],
    notFor: "Small changes where the requirement is already clear.",
    prerequisites: "None",
    notes: { Windsurf: "Tends to end clarification early when there are many questions." },
  },
  "skill-creator": {
    description:
      "Walks you from requirements and folder structure to a test checklist for a clean, maintainable new Skill.",
    tags: ["Skill authoring", "Docs", "Standards"],
    riskSummary: "Only creates Skill folders and files; commands limited to validation scripts.",
    reasons: [
      "Reads existing Skills as references",
      "Creates Skill folders and files",
      "Runs structure validation scripts",
      NONE,
      NONE,
      NONE,
    ],
    useCases: [
      ["Create a new Skill", "Generates SKILL.md, scripts and reference files to spec."],
      [
        "Improve an existing Skill",
        "Checks that the description triggers correctly and trims redundancy.",
      ],
      ["Write a test checklist", "Adds reproducible acceptance cases for the Skill."],
    ],
    notFor: "Users who only want to use existing Skills, not write or maintain them.",
    prerequisites: "Python 3.10+",
  },
  "webapp-testing": {
    description:
      "Verifies key flows of local web apps with browser automation and outputs screenshots and reproducible issue logs.",
    tags: ["E2E", "Browser", "Testing"],
    riskSummary: "Runs Playwright and starts a local server; network access limited to localhost.",
    reasons: [
      "Reads app code to find entry points",
      "Writes test scripts and screenshots",
      "Starts the local server and Playwright",
      "Localhost only",
      NONE,
      NONE,
    ],
    useCases: [
      ["Verify key flows", "Walk through sign-up, checkout and other core paths locally."],
      ["Regression checks", "Re-test automatically after each change and compare screenshots."],
      ["Reproduce issues", "Turn user reports into repeatable test scripts."],
    ],
    notFor: "Testing in production, or flows needing real payments or third-party sign-in.",
    prerequisites: "Python 3.10+, Playwright",
    notes: { Cursor: "Playwright browsers must be installed manually." },
  },
  pptx: {
    description:
      "Creates, edits and analyzes PowerPoint decks, including layouts, charts and speaker notes.",
    tags: ["Slides", "PPT", "Office"],
    riskSummary:
      "Listed but not yet assessed. Review its Python scripts yourself before installing.",
    reasons: [PENDING, PENDING, PENDING, PENDING, PENDING, PENDING],
    useCases: [
      ["Generate decks from outlines", "Turn a text outline into laid-out slides."],
      ["Batch-edit existing files", "Unify fonts, colors and footers."],
      ["Extract deck content", "Export slide text and notes into a document."],
    ],
    notFor: "Launch-grade decks with complex animation and precise design.",
    prerequisites: "Python 3.10+, LibreOffice",
  },
};

type ReviewEn = {
  title: string;
  task: string;
  acceptance: string[];
  summary: string;
  dimensions: string[];
  notes: Record<string, string>;
  evidence: string[];
};

export const reviewEn: Record<string, ReviewEn> = {
  "frontend-design-vs-baseline": {
    title: "Does a frontend design Skill really cut the “AI look”?",
    task: "Redesign a basic SaaS dashboard into a polished, responsive interface",
    acceptance: [
      "No layout errors at desktop, tablet and phone widths",
      "Body text contrast meets WCAG AA",
      "Keep existing data and interactions; add no dependencies",
    ],
    summary:
      "Clear visual direction and strong responsive results; inheriting an existing design system still needs human guidance.",
    dimensions: ["Visual direction", "Code completeness", "Responsiveness", "Accessibility"],
    notes: {
      "frontend-design":
        "Sets a visual direction and keeps checking type and spacing; needed to be told about the existing design rules.",
      baseline:
        "Delivered the features, but colors and layout drifted toward a generic template; overflowed on mobile.",
    },
    evidence: [
      "Full screenshots at three widths",
      "Lighthouse accessibility report",
      "Full chat and command log",
      "Final code diff",
    ],
  },
  "systematic-debugging-vs-baseline": {
    title: "Do Agents fix bugs faster when they verify hypotheses first?",
    task: "Locate and fix an intermittent state sync bug in a React app",
    acceptance: [
      "Reproduce the bug reliably",
      "Identify the root cause with evidence",
      "Add a passing regression test",
    ],
    summary:
      "Stable debugging path that verifies hypotheses before editing code, cutting wasted attempts.",
    dimensions: ["Root cause", "Fix correctness", "Regression safety", "Transparency"],
    notes: {
      "systematic-debugging":
        "Took longer, but fixed it in one pass and left a reusable regression test.",
      baseline: "Masked the bug by adding a delay instead of finding the actual race condition.",
    },
    evidence: [
      "Repro script",
      "Hypothesis and verification log",
      "Regression test results",
      "Final code diff",
    ],
  },
  "browser-automation-compare": {
    title: "Browser automation: agent-browser or webapp-testing?",
    task: "Automate sign-in, form submission and result screenshots",
    acceptance: [
      "Complete 3 steps and save a screenshot of each",
      "Output a reproducible error on failure",
      "Do not modify business code",
    ],
    summary:
      "Both complete the main flow; agent-browser recovers better from failures, webapp-testing leaves reusable test scripts.",
    dimensions: ["Flow stability", "Failure recovery", "Evidence output", "Setup cost"],
    notes: {
      "agent-browser":
        "Main flow is stable; complex CAPTCHAs and cross-origin pop-ups need a human.",
      "webapp-testing":
        "Generated Playwright scripts are reusable, but recovery is slow when selectors break.",
    },
    evidence: ["Per-step screenshots", "Generated test scripts", "Retry log", "Full command log"],
  },
};

type WorkflowEn = {
  title: string;
  summary: string;
  time: string;
  steps: [string, string, string][];
};

export const workflowEn: Record<string, WorkflowEn> = {
  "prd-to-frontend": {
    title: "From PRD to a shippable frontend page",
    summary:
      "Clarify requirements, set a visual direction, then check responsiveness, interaction and accessibility in a real browser.",
    time: "About 45–60 min",
    steps: [
      [
        "Clarify page goals, users and acceptance criteria",
        "PRD or a one-line brief",
        "Page requirements doc",
      ],
      [
        "Set a visual direction and build a responsive UI",
        "Page requirements doc",
        "Runnable page code",
      ],
      [
        "Verify key flows at three widths with screenshots",
        "Locally running page",
        "Screenshots and issue list",
      ],
    ],
  },
  "debug-and-protect": {
    title: "Find and fix a complex bug",
    summary:
      "Reproduce, hypothesize, verify the root cause, then protect the fix with tests and review.",
    time: "About 30 min",
    steps: [
      ["Reproduce and verify the root cause", "Bug report and logs", "Root cause and fix"],
      ["Regression-test the fix in a browser", "Fixed application", "Regression test script"],
      ["Check change quality before merging", "Git diff", "Review comments"],
    ],
  },
  "skill-toolbox": {
    title: "Build your own Skill toolkit",
    summary:
      "Find the right Skills, check their source and risk, then create Skills for your team.",
    time: "About 20 min",
    steps: [
      [
        "Find candidate Skills by task",
        "List of common team tasks",
        "Candidate Skills and install commands",
      ],
      ["Turn team standards into a new Skill", "Team standards doc", "Installable team Skill"],
    ],
  },
};

export const agentCopyEn: Record<AgentName, string> = {
  "Claude Code":
    "Anthropic's command-line coding Agent, with the most complete Skill verification coverage today.",
  Codex: "OpenAI's coding Agent, with project-level Skill installs and reusable workflows.",
  Cursor: "An editor-first AI development environment; Skills are converted to .mdc rules.",
  Windsurf: "An AI IDE for multi-step coding tasks; compatibility testing is still expanding.",
};
