/**
 * Tests for the game loop (session.js), the adaptive rules and scoring.
 *
 * Run from the repo root:   node src/game/session.test.js
 *
 * Same style as src/checking/symbolic.test.js: no framework, each check prints
 * a line, and the script exits with an error code if anything fails.
 */

import { readFileSync } from 'node:fs';
import { initSession, sessionReducer, currentQuestion } from './session.js';
import { computeStars, questionXp } from './scoring.js';
import { pickNextQuestion } from './adaptive.js';
import { bumpStreak } from './progress.js';
import { DIAGNOSIS_FEEDBACK } from '../data/diagnoses.js';

const bank = JSON.parse(readFileSync(new URL('../data/questions/L1_power_rule.json', import.meta.url)));

let passed = 0;
const failures = [];
function check(label, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) passed++;
  else failures.push({ label, actual, expected });
  console.log(`${ok ? ' ok ' : 'FAIL'}  ${label}${ok ? '' : `  (expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)})`}`);
}

const RIGHT = { type: 'SUBMIT', check: { status: 'correct' } };
const WRONG = { type: 'SUBMIT', check: { status: 'incorrect', diagnosis: 'x' } };
const TYPO = { type: 'SUBMIT', check: { status: 'unreadable' } };
const run = (state, ...actions) => actions.reduce(sessionReducer, state);

console.log('\ngame loop\n');

// --- start ---
let s = initSession(bank);
check('starts in practice with 3 hearts', [s.phase, s.hearts], ['practice', 3]);
check('first question is tier 1', currentQuestion(s).tier, 1);
check('8 practice + 3 mini-test questions', [s.practice.length, s.miniTest.length], [8, 3]);

// --- correct answer ---
s = run(initSession(bank), RIGHT);
check('correct tier-1 answer gives 10 XP', s.xp, 10);
check('correct answer waits for Continue', s.feedback.kind, 'correct');

// --- typing mistake costs nothing ---
s = run(initSession(bank), TYPO);
check('unreadable answer keeps all hearts', s.hearts, 3);

// --- wrong answer ---
s = run(initSession(bank), WRONG);
check('wrong answer costs a heart', s.hearts, 2);
check('wrong answer shows the pop-up', s.feedback.kind, 'wrong');

// --- two wrong on one question opens a hint ---
s = run(initSession(bank), WRONG, { type: 'TRY_AGAIN' }, WRONG);
check('2nd wrong on same question auto-opens the hint', [s.hintOpen, s.autoHint, s.hintLevel[s.currentId]], [true, true, 1]);

// --- hint halves XP ---
s = run(initSession(bank), { type: 'OPEN_HINT' }, { type: 'CLOSE_HINT' }, RIGHT);
check('hint caps XP at 50% (10 -> 5)', s.xp, 5);

// --- three wrong answers ends the run ---
s = run(initSession(bank), WRONG, { type: 'TRY_AGAIN' }, WRONG, { type: 'CLOSE_HINT' }, WRONG);
check('losing all hearts ends the level', [s.phase, s.hearts], ['outOfHearts', 0]);
s = run(s, { type: 'RESTART' });
check('restart refills hearts', [s.phase, s.hearts, s.xp], ['practice', 3, 0]);

// --- adaptive: three in a row tiers up ---
s = run(initSession(bank), RIGHT, { type: 'CONTINUE' }, RIGHT, { type: 'CONTINUE' }, RIGHT, { type: 'CONTINUE' });
check('3 correct in a row moves to tier 2', [s.tier, currentQuestion(s).tier], [2, 2]);

// --- full run to the mini-test and through it ---
s = initSession(bank);
for (let i = 0; i < 8; i++) s = run(s, RIGHT, { type: 'CONTINUE' });
check('all 8 practice questions lead to the mini-test intro', s.phase, 'miniIntro');
s = run(s, { type: 'START_MINI_TEST' });
check('mini-test starts on its first question', [s.phase, currentQuestion(s).isMiniTest], ['miniTest', true]);
check('no hints in the mini-test', run(s, { type: 'OPEN_HINT' }).hintOpen, false);
s = run(s, RIGHT, { type: 'CONTINUE' }, WRONG, { type: 'CONTINUE' }, RIGHT, { type: 'CONTINUE' });
check('2/3 on the mini-test passes', s.phase, 'passed');
check('perfect practice, no hints = 3 stars', s.result.stars, 3);

s = initSession(bank);
for (let i = 0; i < 8; i++) s = run(s, RIGHT, { type: 'CONTINUE' });
s = run(s, { type: 'START_MINI_TEST' }, WRONG, { type: 'CONTINUE' }, WRONG, { type: 'CONTINUE' }, WRONG);
check('3rd wrong answer overall in the test ends the run', s.phase, 'outOfHearts');
s = initSession(bank);
for (let i = 0; i < 8; i++) s = run(s, RIGHT, { type: 'CONTINUE' });
s = run(s, { type: 'START_MINI_TEST' }, WRONG, { type: 'CONTINUE' }, RIGHT, { type: 'CONTINUE' }, WRONG, { type: 'CONTINUE' });
check('1/3 on the mini-test fails it', s.phase, 'failedTest');
s = run(s, { type: 'START_MINI_TEST' });
check('retrying the test keeps practice progress', [s.phase, s.answeredIds.length, s.miniResults.length], ['miniTest', 8, 0]);

// --- scoring and streak rules ---
check('stars: 50% accuracy = 2', computeStars({ firstTryCorrect: 4, practiceCount: 8, hintsUsed: 0 }), 2);
check('stars: 3 hints lose a star', computeStars({ firstTryCorrect: 8, practiceCount: 8, hintsUsed: 3 }), 2);
check('stars never below 1', computeStars({ firstTryCorrect: 0, practiceCount: 8, hintsUsed: 5 }), 1);
check('tier-3 XP with hint = 10', questionXp({ tier: 3 }, true), 10);
check('pickNext prefers the current tier', pickNextQuestion(bank.questions.filter(q => !q.isMiniTest), [], 3).tier, 3);
check('streak +1 on the next day', bumpStreak({ count: 4, lastDay: '2026-11-05' }, '2026-11-06'), { count: 5, lastDay: '2026-11-06' });
check('streak unchanged same day', bumpStreak({ count: 4, lastDay: '2026-11-06' }, '2026-11-06').count, 4);
check('streak resets after a missed day', bumpStreak({ count: 4, lastDay: '2026-11-03' }, '2026-11-06').count, 1);
check('streak crosses a month end', bumpStreak({ count: 2, lastDay: '2026-11-30' }, '2026-12-01').count, 3);

// --- question bank checks ---
const tags = bank.questions.flatMap(q => (q.options ?? []).map(o => o.diagnosis).filter(Boolean));
check('every diagnosis tag has feedback text', tags.filter(t => !DIAGNOSIS_FEEDBACK[t]), []);
check('every question has 3 fallback hints', bank.questions.filter(q => q.fallbackHints?.length !== 3).map(q => q.id), []);

console.log(`\n${passed}/${passed + failures.length} passed\n`);
if (failures.length) process.exitCode = 1;
