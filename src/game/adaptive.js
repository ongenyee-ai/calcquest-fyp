/**
 * Deterministic adaptive difficulty (docs/ai_strategy.md, section 3).
 * The LLM never decides difficulty; tiers come from question metadata.
 *
 *   - 3 correct in a row          -> next question tiers up
 *   - 2 wrong on the same question -> tier down, and a Level-1 hint is offered
 */

export const MIN_TIER = 1;
export const MAX_TIER = 3;
export const CORRECT_IN_A_ROW_TO_TIER_UP = 3;
export const WRONG_ON_ONE_QUESTION_TO_TIER_DOWN = 2;

export function tierAfterCorrect(tier, correctInARow) {
  if (correctInARow >= CORRECT_IN_A_ROW_TO_TIER_UP) {
    return { tier: Math.min(MAX_TIER, tier + 1), correctInARow: 0 };
  }
  return { tier, correctInARow };
}

export function tierAfterWrong(tier, wrongOnThisQuestion) {
  if (wrongOnThisQuestion >= WRONG_ON_ONE_QUESTION_TO_TIER_DOWN) {
    return { tier: Math.max(MIN_TIER, tier - 1), offerHint: true };
  }
  return { tier, offerHint: false };
}

/**
 * Choose the next practice question: an unanswered one at the current tier
 * if there is one, otherwise the unanswered question whose tier is closest
 * (preferring the easier side on a tie). Bank order breaks remaining ties,
 * so the sequence is reproducible for the user study.
 */
export function pickNextQuestion(questions, answeredIds, tier) {
  const remaining = questions.filter(q => !answeredIds.includes(q.id));
  if (remaining.length === 0) return null;
  let best = remaining.at(0);
  let bestScore = Infinity;
  for (const q of remaining) {
    const distance = Math.abs(q.tier - tier);
    const score = distance * 2 + (q.tier > tier ? 1 : 0);
    if (score < bestScore) {
      best = q;
      bestScore = score;
    }
  }
  return best;
}
