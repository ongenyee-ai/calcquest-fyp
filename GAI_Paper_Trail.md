Project initiated. Tracking all AI prompts and usage here as per NTU guidelines.

## 11 September 2026

### Prompt / Assistance Used
Asked an AI assistant to help structure the initial project ideation document for my FYP.

### Output Used
The AI assistant helped organise the project direction into the following categories:
- Topic
- Target audience
- Core game mechanics
- AI integration
- Platform

### How I Used It
I reviewed the suggested structure and used it to create the initial `docs/ideation.md` file in my GitHub repository. The final project direction remains my own and will be refined through supervisor consultation and further research.


   ## 11 September 2026 (Session 2)
   ### Prompt / Assistance Used
   Asked AI to fix grammar for my condensed chapter 1 , did the draft during hw0288 lesson.
   ### How I Used It
   I reviewed the condensed draft, verified all facts and citations [1]-[3], and committed it to the repository.


## 12 September 2026 

### Prompt / Assistance Used
AI assistant drafted feedback prompt templates and adaptive-difficulty rules.

### How I Used It
I reviewed and edited the templates into docs/ai_strategy.md. The constraint that the AI never reveals final answers is my own design decision, matching my Chapter 1 scope.

## 8 October 2026

### Prompt / Assistance Used
Worked with an AI assistant across a full build session covering repository
setup, the L1 question bank, a design revision, and the answer-checking logic.

### Output Used
- Repository README (docs/.. , README.md): AI-drafted from my existing design
  documents. Content is a restatement of decisions I had already made in
  ideation.md, skill_tree.md and ai_strategy.md.
- docs/setup.md: AI-drafted environment and build-order guide.
- src/data/questions/L1_power_rule.json: AI-drafted 11 questions for the Power
  Rule node. The diagnostic-distractor approach was proposed by the AI; I
  reviewed every question and every error tag for mathematical correctness.
- Desktop prototype (docs/prototype/): AI-built clickable mockup of the game
  loop, based on my hand-drawn wireframes.
- spike-cas.mjs: AI-written experiment comparing symbolic and numerical methods
  for checking equivalence of typed derivative answers.
- src/checking/symbolic.js and symbolic.test.js: AI-written answer-checking
  module and test suite.

### How I Used It
I ran every piece of code myself and verified the output. The CAS spike
produced the result that numerical sampling handled 18/18 test cases against
symbolic simplification's 14/18, with no false accepts by either method; I
saved that output to docs/findings/ as the evidence for choosing the numerical
method. The first run of the checker test suite failed 3 of 28 cases; I
reported the failures, the AI diagnosed and fixed them, and I re-ran the suite
to confirm 28/28.

### Decisions I made myself
- Desktop-first rather than mobile-first layout, after reviewing an initial
  mobile-oriented prototype against my own wireframes and rejecting it.
- React with Vite as the frontend stack.
- Scope and sequencing of the build, prioritising a working game loop over
  breadth of content.

### Verification
All mathematics in the question bank checked by hand. All code executed and
its output inspected. No output was accepted without being run.