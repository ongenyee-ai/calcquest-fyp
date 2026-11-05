/**
 * XP and star rules. Kept in one place so the numbers can be tuned, and
 * quoted in the report, without hunting through UI code.
 *
 * Rules come from docs/skill_tree.md and docs/ai_strategy.md:
 *   - XP per question, scaled by difficulty tier
 *   - using any hint caps that question's XP at 50%
 *   - 1–3 stars per node from accuracy and hint usage
 */

/** Base XP by difficulty tier (1 = easiest). */
export const TIER_XP = { 1: 10, 2: 15, 3: 20 };

/** XP for a correct mini-test answer. Hints are not available in tests. */
export const MINI_TEST_XP = 20;

/** Share of XP kept when a hint was used on the question. */
export const HINT_XP_CAP = 0.5;

/** Mini-test questions a student must get right to pass the node. */
export const MINI_TEST_PASS_MARK = 2;

export function questionXp(question, usedHint) {
  if (question.isMiniTest) return MINI_TEST_XP;
  const base = TIER_XP[question.tier] ?? TIER_XP[1];
  return usedHint ? Math.round(base * HINT_XP_CAP) : base;
}

/**
 * Stars for a completed node.
 *
 * accuracy = practice questions answered correctly on the FIRST attempt,
 * divided by the number of practice questions. First-attempt accuracy is
 * used because a student can always reach the right answer by retrying.
 *
 *   accuracy >= 80%  -> 3 stars
 *   accuracy >= 50%  -> 2 stars
 *   otherwise        -> 1 star
 *   3 or more hints used -> one star fewer (never below 1)
 */
export function computeStars({ firstTryCorrect, practiceCount, hintsUsed }) {
  const accuracy = practiceCount ? firstTryCorrect / practiceCount : 0;
  let stars = accuracy >= 0.8 ? 3 : accuracy >= 0.5 ? 2 : 1;
  if (hintsUsed >= 3) stars -= 1;
  return Math.max(1, stars);
}
