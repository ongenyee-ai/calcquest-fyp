/**
 * Tests for the symbolic answer checker.
 *
 * Run from the repo root:   node src/checking/symbolic.test.js
 *
 * No test framework — this is deliberately plain so there is nothing extra to
 * learn or install. Each case states what a student typed, what the stored
 * answer is, and what the checker should conclude.
 */

import { checkSymbolicAnswer, normaliseInput } from './symbolic.js';

const CASES = [
  // --- L1: equivalent forms that must be accepted ---
  ['4x^3 - 6x',        '4*x^3 - 6*x', 'correct', 'exact form'],
  ['-6x + 4x^3',       '4*x^3 - 6*x', 'correct', 'terms reordered'],
  ['2x(2x^2 - 3)',     '4*x^3 - 6*x', 'correct', 'factored'],
  ['4*x^3 - 6*x',      '4*x^3 - 6*x', 'correct', 'explicit multiplication'],
  ['4x³ - 6x',         '4*x^3 - 6*x', 'correct', 'superscript typed'],
  ['4x^3 − 6x',        '4*x^3 - 6*x', 'correct', 'unicode minus'],
  ['dy/dx = 4x^3 - 6x','4*x^3 - 6*x', 'correct', 'restated the question'],

  // --- L1: wrong answers that must be rejected ---
  ['4x^3 - 6',         '4*x^3 - 6*x', 'incorrect', 'dropped the x'],
  ['4x^3 - 6x + 6',    '4*x^3 - 6*x', 'incorrect', 'constant did not vanish'],
  ['4x^2 - 6x',        '4*x^3 - 6*x', 'incorrect', 'exponent not reduced'],
  ['12x^2 - 6x',       '4*x^3 - 6*x', 'incorrect', 'differentiated twice'],

  // --- roots and fractional powers (where simplify struggles) ---
  ['1/(2sqrt(x))',     '1/(2*sqrt(x))', 'correct', 'exact form'],
  ['0.5x^(-1/2)',      '1/(2*sqrt(x))', 'correct', 'decimal coefficient'],
  ['(1/2)x^(-1/2)',    '1/(2*sqrt(x))', 'correct', 'fraction coefficient'],
  ['1/(2√x)',          '1/(2*sqrt(x))', 'correct', 'root glyph typed'],
  ['1/sqrt(x)',        '1/(2*sqrt(x))', 'incorrect', 'missing the 2'],

  // --- negative powers ---
  ['-3/x^4',           '-3*x^(-4)',   'correct',   'written as a fraction'],
  ['3/x^4',            '-3*x^(-4)',   'incorrect', 'sign lost'],
  ['-3x^(-3)',         '-3*x^(-4)',   'incorrect', 'exponent increased'],

  // --- product and chain rule, for the nodes coming next ---
  ['x*cos(x) + sin(x)','sin(x) + x*cos(x)', 'correct',   'product rule reordered'],
  ['cos(x^2)*2x',      '2*x*cos(x^2)',      'correct',   'chain rule reordered'],
  ['cos(x^2)',         '2*x*cos(x^2)',      'incorrect', 'inner derivative missing'],

  // --- constants ---
  ['0',                '0',           'correct',   'zero'],
  ['5',                '0',           'incorrect', 'constant not differentiated'],

  // --- unreadable: a typing mistake, not a calculus mistake ---
  ['4x^3 - ',          '4*x^3 - 6*x', 'unreadable', 'trailing operator'],
  ['((4x^3 - 6x',      '4*x^3 - 6*x', 'unreadable', 'unbalanced bracket'],
  ['',                 '4*x^3 - 6*x', 'unreadable', 'empty'],
  ['i dont know',      '4*x^3 - 6*x', 'unreadable', 'prose'],
];

let passed = 0;
const failures = [];

console.log('\nsymbolic answer checker\n');
console.log('input'.padEnd(22) + 'expected'.padEnd(13) + 'actual'.padEnd(13) + 'via'.padEnd(10) + 'case');
console.log('-'.repeat(88));

for (const [input, correct, expected, label] of CASES) {
  const result = checkSymbolicAnswer(input, correct);
  const ok = result.status === expected;
  if (ok) passed++;
  else failures.push({ input, expected, actual: result.status, label });

  console.log(
    (input || '(empty)').padEnd(22) +
    expected.padEnd(13) +
    result.status.padEnd(13) +
    String(result.method ?? '—').padEnd(10) +
    (ok ? '' : 'FAIL  ') + label
  );
}

console.log('-'.repeat(88));
console.log(`${passed}/${CASES.length} passed\n`);

if (failures.length) {
  console.log('failures:');
  for (const f of failures) {
    console.log(`  "${f.input}" (${f.label}) — expected ${f.expected}, got ${f.actual}`);
  }
  console.log('');
  process.exitCode = 1;
}

// The dangerous failure mode: a wrong answer accepted as correct.
const falseAccepts = failures.filter(f => f.expected === 'incorrect' && f.actual === 'correct');
if (falseAccepts.length) {
  console.log('WARNING — wrong answers accepted as correct. Fix before shipping.\n');
} else {
  console.log('No wrong answer was accepted as correct.\n');
}

// Show the normaliser's work on a few awkward inputs.
console.log('normaliser:');
for (const sample of ['4x³ − 6x', '1/(2√x)', 'dy/dx = 6x - 1', '2 × x ÷ 3']) {
  console.log(`  ${sample.padEnd(20)} →  ${normaliseInput(sample)}`);
}
console.log('');
