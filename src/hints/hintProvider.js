/**
 * Where hints come from.
 *
 * Right now every hint is the static `fallbackHints` text in the question
 * bank. This is deliberate (docs/setup.md, build step 5): it proves the hint
 * interaction before adding a network dependency.
 *
 * When the LLM is connected, only this file changes. The planned flow, from
 * docs/ai_strategy.md:
 *   1. Send { question prompt, student's last attempt, level, topic } to a
 *      serverless function. The correct-answer field is NOT sent.
 *   2. The function calls the model with the level-specific template.
 *   3. If the reply contains the answer string, or the call fails or times
 *      out, return the static fallback hint instead.
 *   4. Log the prompt version and the reply for the evaluation chapter.
 */

export const HINT_LEVELS = [
  { level: 1, name: 'Nudge' },
  { level: 2, name: 'Method' },
  { level: 3, name: 'Worked example' },
];

/** @returns {{ text: string, source: 'static' | 'llm' }} */
export function getHint(question, level) {
  const text = question.fallbackHints?.at(level - 1) ?? 'No hint available for this question yet.';
  return { text, source: 'static' };
}
