# CalcQuest

An AI-assisted gamified web platform for undergraduate calculus learning.

Final Year Project, B.Eng. Electrical and Electronic Engineering, Nanyang Technological University.
Author: Ong En Yee · Supervisor: A/P Ling Keck Voon · AY2026/27

---

## What this is

Calculus is cumulative, and gaps that open in the first year compound through every later
module that assumes mathematical fluency. Large cohorts make individual feedback impractical,
so students who fall behind usually stay behind.

CalcQuest is a web platform that teaches differentiation through short, Duolingo-style practice
sessions. Two things make it different from a quiz app:

- **The AI tutor never gives the answer.** It produces hints at three escalating levels — a
  conceptual nudge, a method hint, then a worked example on a *different* question. At hint time
  the model is never shown the correct-answer field, and any response that leaks the answer
  string is discarded in favour of a static hint.
- **Every wrong option is diagnostic.** Distractors are authored to match specific known errors
  (coefficient dropped, exponent increased instead of decreased, integrated instead of
  differentiated), and each is tagged in the question bank. A wrong answer therefore tells us
  *which* misconception the student holds, which is what the evaluation chapter analyses.

Scope is deliberately one chapter — differentiation — so that the gamification, the AI layer and
the assessment logic can be integrated properly against six specific learning objectives rather
than spread thinly across a syllabus.

## Status

| Area | State |
| --- | --- |
| Design docs, skill tree, learning objectives, AI strategy | Complete |
| UI wireframes | Complete (low-fidelity) |
| L1 Power Rule question bank | Complete (11 questions) |
| Playable L1 prototype | In progress |
| Symbolic answer checking (CAS) | Not started |
| LLM hint integration | Not started |
| Persistence and analytics | Not started |
| GEAP deployment | Blocked — awaiting confirmation of deployment unit |

Tracked against `docs/CalcQuest_Gantt.xlsx`.

## The skill tree

Six sequential nodes. A node unlocks only after the previous node's mini-test is passed.

| Node | Topic | Objective | Content |
| --- | --- | --- | --- |
| L0 | What is a Derivative? | LO1 | Tutorial, guided, no scoring |
| L1 | First Steps: Power Rule | LO2 | 8 questions + 3-question mini-test |
| L2 | Side by Side: Product Rule | LO3 | 8 questions + mini-test |
| L3 | Fair Share: Quotient Rule | LO3 | 8 questions + mini-test |
| L4 | Inside Out: Chain Rule | LO4 | 8 questions + mini-test |
| L5 | Boss: Rule Mixer | LO5, LO6 | 10 mixed + 5-question final test |

Game mechanics: XP per question, three hearts per node, daily streak, 1–3 stars per node based on
accuracy and hint usage, and deterministic adaptive difficulty (three correct in a row tiers up;
two wrong on one question tiers down and offers a hint).

## Architecture

```
Browser (React + Vite)
  ├── question bank (JSON, versioned in-repo)
  ├── game state — hearts, XP, streak, node progress
  ├── answer checking
  │     ├── MCQ        → option id comparison
  │     ├── numeric    → tolerance comparison
  │     └── symbolic   → CAS equivalence (math.js)
  └── hint request ──► serverless function ──► LLM
                         │
                         ├── correct-answer field stripped from the payload
                         ├── response validated against the answer string
                         └── prompt version + response logged for evaluation
```

Deliberately no accounts and no database in the first milestone. Everything runs client-side so
the game loop can be finished and demonstrated before persistence is introduced.

## Repository layout

```
docs/                      design and planning documents
  ideation.md              project direction
  learning_objectives.md   LO1–LO6
  skill_tree.md            node progression and rules
  ai_strategy.md           hint prompts, guardrails, adaptive rules
  chapter1_introduction.md report Chapter 1 draft
  GAI_Paper_Trail.md       mandatory NTU declaration log
  wireframes/              hand-drawn low-fidelity screens
src/                       application source
  data/questions/          question bank, one JSON file per node
  components/              UI components
  game/                    state machine, scoring, adaptive difficulty
  checking/                answer checking
```

## Running it locally

Requires Node.js 20 or later.

```bash
git clone https://github.com/ongenyee-ai/calcquest-fyp.git
cd calcquest-fyp
npm install
npm run dev
```

The dev server prints a `http://localhost:5173` URL.

## Question bank format

Each node is one JSON file in `src/data/questions/`. The diagnostic `diagnosis` field on every
distractor is what makes the error analysis in Chapter 5 possible, so it is required.

```json
{
  "id": "L1-T1-001",
  "tier": 1,
  "type": "mcq",
  "isMiniTest": false,
  "prompt": "What is the derivative of x^3?",
  "promptLatex": "\\frac{d}{dx}\\left(x^{3}\\right)",
  "options": [
    { "id": "a", "latex": "3x^{2}", "correct": true },
    { "id": "b", "latex": "x^{2}", "correct": false, "diagnosis": "power-reduced-coefficient-dropped" }
  ],
  "fallbackHints": ["...", "...", "..."]
}
```

`fallbackHints` are the three static hints served when the LLM is unavailable or its response
fails validation. Every question must have them; the platform is never allowed to depend on the
model being reachable.

## Evaluation

Efficacy is measured through a localised user study with NTU EEE undergraduates:
platform usage analytics, pre- and post-tests, and a qualitative feedback survey.

## Use of generative AI

All generative-AI assistance is logged in `docs/GAI_Paper_Trail.md` in line with NTU
requirements.
