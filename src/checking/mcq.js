/**
 * Multiple-choice checking. Returns the same shape as checkSymbolicAnswer so
 * the game loop treats both question types the same way. A wrong option
 * carries its `diagnosis` tag from the question bank, which is what the error
 * analysis in the evaluation chapter is built on.
 */
export function checkMcqAnswer(question, optionId) {
  const option = question.options?.find(o => o.id === optionId);
  if (!option) return { status: 'unreadable', method: 'mcq' };
  if (option.correct) return { status: 'correct', method: 'mcq' };
  return { status: 'incorrect', method: 'mcq', diagnosis: option.diagnosis ?? null };
}
