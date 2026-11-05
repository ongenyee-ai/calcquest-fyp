/**
 * The game loop for one node, as a pure reducer.
 *
 * Pure means: no React, no network, no localStorage. Given a state and an
 * action it returns the next state, which is what makes it testable from the
 * command line (src/game/session.test.js) and easy to reason about in the
 * report. The React screen only dispatches actions and draws the state.
 *
 * Phases:
 *   practice  -> adaptive practice questions, hints allowed
 *   miniIntro -> "mini-test next" card
 *   miniTest  -> fixed test questions, one attempt each, no hints
 *   passed    -> node complete (results screen)
 *   failedTest-> mini-test below the pass mark, retry the test
 *   outOfHearts -> all hearts lost, restart the node
 */

import { pickNextQuestion, tierAfterCorrect, tierAfterWrong } from './adaptive.js';
import { questionXp, computeStars, MINI_TEST_PASS_MARK } from './scoring.js';

export const STARTING_HEARTS = 3;

export function initSession(bank) {
  const practice = bank.questions.filter(q => !q.isMiniTest);
  const miniTest = bank.questions.filter(q => q.isMiniTest);
  const first = pickNextQuestion(practice, [], 1);
  return {
    node: bank.node,
    practice,
    miniTest,
    phase: 'practice',
    hearts: STARTING_HEARTS,
    xp: 0,
    tier: 1,
    correctInARow: 0,
    currentId: first ? first.id : null,
    answeredIds: [],
    attempts: {},          // question id -> wrong attempts so far
    hintLevel: {},         // question id -> highest hint level viewed (0–3)
    firstTryCorrect: 0,
    miniIndex: 0,
    miniResults: [],       // { id, correct }
    feedback: null,        // { kind: 'correct'|'wrong'|'unreadable', ... }
    hintOpen: false,
    autoHint: false,       // hint was opened by the 2-wrong rule
    result: null,          // { stars, xp, accuracy, hintsUsed } once passed
  };
}

export function currentQuestion(state) {
  const pool = state.phase === 'miniTest' ? state.miniTest : state.practice;
  return pool.find(q => q.id === state.currentId) ?? null;
}

export function hintsUsedCount(state) {
  return Object.values(state.hintLevel).filter(level => level > 0).length;
}

/** Number shown as "Q n / total" in the top bar. */
export function progressInfo(state) {
  if (state.phase === 'miniTest') {
    return { done: state.miniIndex, total: state.miniTest.length, label: 'Mini-test' };
  }
  return { done: state.answeredIds.length, total: state.practice.length, label: 'Practice' };
}

export function sessionReducer(state, action) {
  switch (action.type) {
    case 'SUBMIT':
      return state.phase === 'miniTest' ? submitMiniTest(state, action) : submitPractice(state, action);
    case 'CONTINUE':
      return advance(state);
    case 'TRY_AGAIN':
      return { ...state, feedback: null };
    case 'OPEN_HINT': {
      if (state.phase !== 'practice') return state;
      const id = state.currentId;
      const level = Math.max(1, state.hintLevel[id] ?? 0);
      return { ...state, hintOpen: true, autoHint: false, feedback: null, hintLevel: { ...state.hintLevel, [id]: level } };
    }
    case 'NEXT_HINT': {
      const id = state.currentId;
      const level = Math.min(3, (state.hintLevel[id] ?? 0) + 1);
      return { ...state, hintLevel: { ...state.hintLevel, [id]: level } };
    }
    case 'CLOSE_HINT':
      return { ...state, hintOpen: false, autoHint: false };
    case 'START_MINI_TEST':
      return {
        ...state,
        phase: 'miniTest',
        miniIndex: 0,
        miniResults: [],
        currentId: state.miniTest.at(0)?.id ?? null,
        feedback: null,
      };
    case 'RESTART':
      return initSession({ node: state.node, questions: [...state.practice, ...state.miniTest] });
    default:
      return state;
  }
}

/** action.check = { status: 'correct'|'incorrect'|'unreadable'|'inconclusive', diagnosis?, unknownSymbols? } */
function submitPractice(state, { check }) {
  const q = currentQuestion(state);
  if (!q || state.feedback) return state;

  if (check.status === 'unreadable' || check.status === 'inconclusive') {
    // A typing problem is not a calculus mistake: no heart lost.
    return { ...state, feedback: { kind: 'unreadable', status: check.status, unknownSymbols: check.unknownSymbols } };
  }

  const wrongSoFar = state.attempts[q.id] ?? 0;

  if (check.status === 'correct') {
    const usedHint = (state.hintLevel[q.id] ?? 0) > 0;
    const gained = questionXp(q, usedHint);
    const next = tierAfterCorrect(state.tier, state.correctInARow + 1);
    return {
      ...state,
      xp: state.xp + gained,
      tier: next.tier,
      correctInARow: next.correctInARow,
      answeredIds: [...state.answeredIds, q.id],
      firstTryCorrect: state.firstTryCorrect + (wrongSoFar === 0 ? 1 : 0),
      feedback: { kind: 'correct', xp: gained, usedHint, tierUp: next.tier > state.tier },
    };
  }

  // Wrong answer.
  const wrong = wrongSoFar + 1;
  const hearts = state.hearts - 1;
  const next = tierAfterWrong(state.tier, wrong);
  const attempts = { ...state.attempts, [q.id]: wrong };

  if (hearts <= 0) {
    return { ...state, hearts: 0, attempts, phase: 'outOfHearts', feedback: null, hintOpen: false };
  }

  if (next.offerHint) {
    // Second wrong attempt on this question: tier down and open a Level-1 hint.
    const level = Math.max(1, state.hintLevel[q.id] ?? 0);
    return {
      ...state,
      hearts,
      attempts,
      tier: next.tier,
      correctInARow: 0,
      hintLevel: { ...state.hintLevel, [q.id]: level },
      hintOpen: true,
      autoHint: true,
      feedback: null,
    };
  }

  return {
    ...state,
    hearts,
    attempts,
    tier: next.tier,
    correctInARow: 0,
    feedback: { kind: 'wrong', diagnosis: check.diagnosis ?? null },
  };
}

function submitMiniTest(state, { check }) {
  const q = currentQuestion(state);
  if (!q || state.feedback) return state;

  if (check.status === 'unreadable' || check.status === 'inconclusive') {
    return { ...state, feedback: { kind: 'unreadable', status: check.status, unknownSymbols: check.unknownSymbols } };
  }

  const correct = check.status === 'correct';
  const miniResults = [...state.miniResults, { id: q.id, correct }];
  const hearts = correct ? state.hearts : state.hearts - 1;
  const xp = correct ? state.xp + questionXp(q, false) : state.xp;

  if (hearts <= 0) {
    return { ...state, hearts: 0, miniResults, phase: 'outOfHearts', feedback: null };
  }

  return {
    ...state,
    hearts,
    xp,
    miniResults,
    feedback: correct
      ? { kind: 'correct', xp: questionXp(q, false), usedHint: false, test: true }
      : { kind: 'wrong', diagnosis: check.diagnosis ?? null, test: true },
  };
}

function advance(state) {
  if (state.phase === 'practice') {
    // Only a correct answer moves practice on; a wrong one uses TRY_AGAIN.
    if (state.feedback?.kind !== 'correct') return state;
    const next = pickNextQuestion(state.practice, state.answeredIds, state.tier);
    if (!next) return { ...state, phase: 'miniIntro', feedback: null, currentId: null };
    return { ...state, currentId: next.id, feedback: null };
  }

  if (state.phase === 'miniTest') {
    if (!state.feedback) return state;
    const miniIndex = state.miniIndex + 1;
    if (miniIndex < state.miniTest.length) {
      return { ...state, miniIndex, currentId: state.miniTest.at(miniIndex).id, feedback: null };
    }
    const score = state.miniResults.filter(r => r.correct).length;
    if (score < MINI_TEST_PASS_MARK) {
      return { ...state, miniIndex, phase: 'failedTest', feedback: null };
    }
    const hintsUsed = hintsUsedCount(state);
    const stars = computeStars({
      firstTryCorrect: state.firstTryCorrect,
      practiceCount: state.practice.length,
      hintsUsed,
    });
    return {
      ...state,
      miniIndex,
      phase: 'passed',
      feedback: null,
      result: {
        stars,
        xp: state.xp,
        accuracy: state.practice.length ? state.firstTryCorrect / state.practice.length : 0,
        hintsUsed,
        miniScore: score,
        miniTotal: state.miniTest.length,
      },
    };
  }

  return state;
}
