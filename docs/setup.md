# Development Setup

How to get the project running on a Mac from nothing. Written for someone who has used VS Code
for HTML/CSS/PHP coursework but has not set up a JavaScript build tool before.

---

## 1. Install Node.js

Node is the runtime that lets you run JavaScript outside a browser. `npm` is its package
manager, equivalent to what Composer is for PHP. Installing Node gets you both.

Download the LTS installer from https://nodejs.org and run it. Then check it worked:

```bash
node --version    # should print v20.x.x or higher
npm --version
```

If `node` is not found after installing, quit and reopen Terminal — the installer edits your
shell's PATH and existing terminal windows do not pick that up.

## 2. Create the project

From inside your cloned repo:

```bash
cd ~/IE4727/calcquest-fyp        # wherever you keep it
npm create vite@latest . -- --template react
```

The `.` means "create it here, in the current folder" rather than in a new subfolder. Vite will
warn that the directory is not empty — that is expected, since your `docs/` folder and README
are already there. Choose to continue; it will not delete them.

Then install the dependencies and start the dev server:

```bash
npm install
npm run dev
```

Open the `http://localhost:5173` URL it prints. Leave this running while you work: Vite watches
your files and the browser updates the moment you save. Stop it with `Ctrl + C`.

### What Vite actually does

You write modern JavaScript split across many small files. Browsers cannot efficiently load
hundreds of separate files, and some syntax (JSX) they do not understand at all. Vite transforms
and bundles everything in the background. In development it does this instantly on save; for
deployment, `npm run build` produces a `dist/` folder of plain HTML, CSS and JS that any web
server can host. That `dist/` folder is what eventually gets deployed.

## 3. Install the project libraries

```bash
npm install mathjs katex
```

- **mathjs** — computer algebra. This is what decides whether a student's typed answer is
  equivalent to the correct one. `x*cos(x) + sin(x)` and `sin(x) + x*cos(x)` are the same
  derivative but different strings, so string comparison cannot work. mathjs can parse,
  simplify and compare both.
- **katex** — renders LaTeX as proper mathematical notation in the browser.

Add MathLive later, when you build the symbolic input screen (wireframe 4). It provides the
math keyboard with the π, √ and exponent buttons.

## 4. Folder structure to create

```
src/
  data/questions/
    L1_power_rule.json     ← start here; the question bank is the spine
  game/
    state.js               ← hearts, XP, streak, progression
    scoring.js             ← XP rules, star calculation
    adaptive.js            ← the tier-up / tier-down rules
  checking/
    mcq.js
    symbolic.js            ← mathjs equivalence lives here
  components/
    MainMenu.jsx
    LevelMap.jsx
    Question.jsx
    HintSheet.jsx
    Results.jsx
  App.jsx
```

Create these as you need them, not all at once. But put the question JSON in first — every other
file is shaped by what that file contains.

## 5. Git hygiene

Vite generates a `.gitignore` that already excludes `node_modules/` and `dist/`. Keep it.
`node_modules` is tens of thousands of files that `npm install` can recreate at any time, so it
must never be committed.

Commit in small, labelled pieces rather than one large dump at the end of a week. Your commit
history is evidence of sustained work, and your supervisor can see it:

```bash
git add src/data/questions/L1_power_rule.json
git commit -m "Add L1 power rule question bank with diagnostic distractors"
git push
```

Write messages that say what changed and why, not "update" or "fix".

## 6. Build order

Do these in sequence. Each step produces something that runs.

1. **Question bank for L1.** 11 questions, every distractor tagged with its diagnosis.
   No code involved; this is content work.
2. **Render one question.** Hardcode it. Get KaTeX displaying the notation correctly.
   This will take longer than you expect and it is better to find that out now.
3. **MCQ flow.** Select an option, check it, show right or wrong, advance.
4. **Hearts and XP.** Wrong answers cost a heart, correct ones add XP.
5. **Hint popup with static hints.** Use the `fallbackHints` already in the JSON.
   No LLM yet — this proves the interaction before adding a network dependency.
6. **Results screen.** Stars, accuracy, hints used.
7. **Level map.** Lock states and progression.

That is the Semester 1 demo. Everything after it — symbolic input, the real LLM hints,
persistence, analytics — builds on a game loop that already works.

### Spike this early, out of order

Before step 2, spend one afternoon on a throwaway file that does nothing except check whether
mathjs can correctly compare a handful of derivative answers in the forms students actually type.
If it cannot handle your cases, you need to know in October, not in February. This is the
highest-risk unknown in the whole build.

```js
import { simplify, parse } from 'mathjs';

function equivalent(a, b) {
  try {
    return simplify(`(${a}) - (${b})`).toString() === '0';
  } catch {
    return false;
  }
}

console.log(equivalent('4x^3 - 6x', '-6x + 4x^3'));   // expect true
console.log(equivalent('1/(2*sqrt(x))', '0.5*x^(-1/2)'));
```

Note what fails. The failures are a legitimate findings section in Chapter 4.

## 7. Before you build anything else

Confirm with your supervisor what GEAP actually accepts as a deployment: a static site, a
container, or something agent-shaped. The answer changes the architecture, and finding out late
is the kind of thing that costs weeks. Until you know, build a normal web app that could be
containerised.
