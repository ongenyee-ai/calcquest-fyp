/**
 * Short feedback for each diagnostic distractor tag in the question bank.
 * This is the static version of the wrong-answer feedback (LO6); the LLM
 * feedback template in docs/ai_strategy.md can replace it later.
 *
 * Messages describe the mistake without giving the answer.
 */
export const DIAGNOSIS_FEEDBACK = {
  'power-reduced-coefficient-dropped': 'You reduced the power but lost the number that should come down in front.',
  'coefficient-applied-power-not-reduced': 'You brought the power down, but the exponent itself still needs to drop by one.',
  'integrated-instead-of-differentiated': 'That raises the power. It looks like integration, not differentiation.',
  'constant-unchanged': 'A constant on its own does not change, so its rate of change is not the constant itself.',
  'confused-with-derivative-of-x': 'That is the derivative of x, not of a constant.',
  'treated-whole-term-as-constant': 'Only a number on its own is a constant. This term still contains x.',
  'exponent-not-multiplied-into-coefficient': 'The exponent needs to multiply the number already in front.',
  'original-coefficient-dropped': 'The number already in front does not disappear.',
  'exponent-increased-not-decreased': 'Check the direction: reducing a negative exponent by one makes it more negative.',
  'sign-lost-on-negative-exponent': 'Bringing down a negative exponent brings its minus sign with it.',
  'sign-of-exponent-dropped': 'The exponent should stay negative.',
  'quotient-treated-termwise': 'Rewrite the fraction as a power of x first, instead of working on top and bottom separately.',
};

export function feedbackFor(diagnosis) {
  return DIAGNOSIS_FEEDBACK[diagnosis] ?? null;
}
