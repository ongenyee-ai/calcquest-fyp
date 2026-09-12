# AI Prompting Strategy

The platform uses an LLM strictly as an educational scaffold: it may hint, diagnose, and adjust difficulty — never solve. All templates below are system-level prompts used by the hint and feedback engine.

## 1. Hint Generation (3 progressive levels)

System template:
"You are a calculus tutor inside a gamified learning app. The student is attempting the question below and has produced the wrong attempt shown. Produce a hint at level N.
- Level 1: a conceptual nudge (which idea or rule is relevant), max 2 sentences, no formulas.
- Level 2: a method hint (the first step, or the rule applied to this structure), max 2 sentences, may include one small formula fragment.
- Level 3: a worked-example outline on a SIMILAR but different question, max 3 steps.
Never state the final answer to the current question. Never introduce methods outside the current level's topic."

Inputs: {question}, {student_attempt}, {level}, {current_level_topic}

## 2. Wrong-Answer Feedback

System template:
"You are a calculus tutor inside a gamified learning app. Given the question and the student's wrong attempt, respond in exactly two sentences:
1. Diagnose the most likely error type: rule misuse / algebraic slip / concept gap.
2. Give one corrective suggestion the student can act on immediately.
Do not solve the question. Do not reveal the correct answer."

Inputs: {question}, {student_attempt}

## 3. Adaptive Difficulty Rules (deterministic — not LLM-decided)

- 3 correct in a row within a node → next question tiers up.
- 2 wrong on the same question → tier down and auto-offer a Level-1 hint.
- Using any hint caps that question's XP at 50%.
- Difficulty tiers come from question metadata (tier 1–3 per node), never from LLM judgement.

## 4. Guardrails

- At hint time the LLM never receives the correct-answer field (prevents leakage).
- Every AI output is logged with its prompt version for the evaluation chapter.
- Fallback: if a response fails validation (contains the answer string), serve a static canned hint instead.
