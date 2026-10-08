/**
 * Answer checking for typed (symbolic) questions.
 *
 * The problem: a student's derivative can be correct but written in a form
 * that does not match the stored answer string. "4x^3 - 6x", "-6x + 4x^3" and
 * "2x(2x^2 - 3)" are the same derivative and three different strings, so
 * string comparison is useless here.
 *
 * The method, decided by the spike in docs/findings/cas-spike-output.txt:
 *
 *   1. Symbolic fast path — simplify(student - correct). If it reduces to
 *      zero, the two are provably equal and we accept immediately.
 *   2. Numerical fallback — evaluate both at a spread of sample points and
 *      compare. Slower to reason about, but it handled 18/18 spike cases
 *      where the symbolic method handled 14/18.
 *
 * Neither method accepted a wrong answer in the spike. Numerical agreement is
 * strong evidence rather than proof: two different functions could in
 * principle agree at every sample point. For derivatives of elementary
 * functions at irrational sample values this is vanishingly unlikely, and the
 * limitation is documented in the report rather than engineered away.
 */

import { simplify, parse } from 'mathjs';

/** Sample points. Irrational-ish values spread over both signs, so two
 *  different functions are very unlikely to agree at all of them by accident.
 *  Points where either expression is undefined are skipped, which is how
 *  domain-restricted answers like 1/(2*sqrt(x)) still get checked. */
const SAMPLE_POINTS = [
  0.37, 0.61, 1.23, 1.87, 2.71, 3.49, 5.11, 7.83,
  -0.53, -1.41, -2.29, -4.07,
];

/** Relative tolerance for floating-point comparison. */
const TOLERANCE = 1e-9;

/** Minimum number of points where BOTH expressions evaluate, before a
 *  numerical verdict is trusted. Below this we report 'inconclusive' rather
 *  than guessing. */
const MIN_VALID_POINTS = 4;

/** The only free variable an answer may use, plus the constants we accept.
 *  Anything else — t, y, or the words in "i dont know" — means the input is
 *  not an answer to this question. */
const ALLOWED_SYMBOLS = new Set(['x', 'pi', 'e']);

/** Function names mathjs understands, so the implicit-multiplication fix
 *  below does not mangle sin(x) into sin*(x). */
const FUNCTION_NAMES = new Set([
  'sin', 'cos', 'tan', 'sec', 'csc', 'cot',
  'asin', 'acos', 'atan', 'atan2',
  'sinh', 'cosh', 'tanh', 'asinh', 'acosh', 'atanh',
  'sqrt', 'cbrt', 'nthRoot', 'abs', 'sign',
  'log', 'log2', 'log10', 'ln', 'exp', 'pow',
  'floor', 'ceil', 'round',
]);

const SUPERSCRIPTS = '⁰¹²³⁴⁵⁶⁷⁸⁹';

/**
 * Tidy up what the student typed so mathjs can parse it.
 *
 * Students type the characters they see on screen and on the answer keypad —
 * a Unicode minus sign, a times symbol, a square-root glyph, superscripts —
 * and they write implicit multiplication the way it appears in a textbook.
 * None of that is what a parser expects, so it is translated here rather than
 * being treated as a mistake.
 */
export function normaliseInput(raw) {
  if (typeof raw !== 'string') return '';

  let s = raw.trim();

  // Students often restate the question before their answer.
  s = s.replace(/^\s*(dy\s*\/\s*dx|y\s*'|f\s*'\s*\(\s*x\s*\)|answer)\s*[:=]\s*/i, '');

  // Unicode minus, en dash, em dash → ASCII hyphen.
  s = s.replace(/[−–—]/g, '-');

  // Multiplication and division symbols.
  s = s.replace(/[×⋅·]/g, '*').replace(/÷/g, '/');

  // Superscript runs → ^(n), including a superscript minus for x⁻².
  // Wrapping in brackets keeps negative exponents unambiguous.
  s = s.replace(/[⁻⁰¹²³⁴-⁹]+/g, run => {
    const body = [...run]
      .map(ch => (ch === '⁻' ? '-' : SUPERSCRIPTS.indexOf(ch)))
      .join('');
    return `^(${body})`;
  });

  // Root glyph. "√(x+1)" keeps its brackets; bare "√x" gets them added, so
  // this no longer produces the meaningless identifier "sqrtx".
  s = s.replace(/√\s*\(/g, 'sqrt(');
  s = s.replace(/√\s*([A-Za-z0-9.]+)/g, 'sqrt($1)');

  // Constants.
  s = s.replace(/π/g, 'pi');

  // Implicit multiplication. mathjs reads "x(" as a function call, so a
  // student writing the factored form 2x(2x^2 - 3) gets an evaluation error
  // rather than a verdict. Insert the multiplication the student meant,
  // leaving real function calls alone.
  s = s.replace(/([A-Za-z_]\w*)\s*\(/g, (match, name) =>
    FUNCTION_NAMES.has(name) ? `${name}(` : `${name}*(`);
  s = s.replace(/(\d)\s*\(/g, '$1*(');          // 2(x + 1)
  s = s.replace(/\)\s*\(/g, ')*(');             // (x + 1)(x - 2)
  s = s.replace(/\)\s*([A-Za-z0-9])/g, ')*$1'); // (x + 1)x

  return s.replace(/\s+/g, ' ').trim();
}

/** Parse, returning null instead of throwing. */
function safeParse(expression) {
  try {
    return parse(expression);
  } catch {
    return null;
  }
}

/**
 * Collect any symbol the expression uses that is not x or a known constant.
 * Function names are skipped, since sin in sin(x) is a function, not a
 * variable the student has invented.
 */
function unknownSymbols(node) {
  const found = new Set();
  node.traverse((current, _path, parent) => {
    if (!current.isSymbolNode) return;
    if (parent && parent.isFunctionNode && parent.fn === current) return;
    if (!ALLOWED_SYMBOLS.has(current.name)) found.add(current.name);
  });
  return found;
}

/**
 * Symbolic check. Returns true only when the difference provably simplifies
 * to zero. A false result means "could not prove equal", NOT "different".
 */
function provablyEqual(studentExpr, correctExpr) {
  try {
    const difference = simplify(`(${studentExpr}) - (${correctExpr})`);
    return difference.toString().replace(/\s/g, '') === '0';
  } catch {
    return false;
  }
}

/**
 * Numerical check across the sample points.
 * Returns 'equal', 'different', or 'inconclusive' when too few points were
 * valid for either expression.
 */
function numericallyEqual(studentFn, correctFn) {
  let validPoints = 0;

  for (const x of SAMPLE_POINTS) {
    let studentValue, correctValue;

    try {
      studentValue = studentFn.evaluate({ x });
      correctValue = correctFn.evaluate({ x });
    } catch {
      continue;                               // undefined here, try the next point
    }

    // mathjs returns complex numbers for things like sqrt(-1); only compare
    // real finite results, and skip anything else.
    if (typeof studentValue !== 'number' || typeof correctValue !== 'number') continue;
    if (!Number.isFinite(studentValue) || !Number.isFinite(correctValue)) continue;

    const scale = Math.max(1, Math.abs(studentValue), Math.abs(correctValue));
    if (Math.abs(studentValue - correctValue) > TOLERANCE * scale) {
      return 'different';                     // one disagreement is enough
    }
    validPoints++;
  }

  return validPoints >= MIN_VALID_POINTS ? 'equal' : 'inconclusive';
}

/**
 * Check a typed answer against the stored correct answer.
 *
 * @param {string} studentInput  what the student typed
 * @param {string} correctAnswer the stored answer, as a mathjs expression
 * @returns {{status: 'correct'|'incorrect'|'unreadable'|'inconclusive',
 *            method: 'symbolic'|'numeric'|null,
 *            normalised: string,
 *            unknownSymbols?: string[]}}
 *
 * The four statuses exist because "wrong" and "I could not read that" are
 * different events. A student who mistypes a bracket has not made a calculus
 * error, so the game should ask them to retype rather than take a life.
 *
 * When status is 'unreadable' and unknownSymbols is present, the student used
 * a variable the question did not ask about — answering in terms of t, say.
 * The UI can say so specifically instead of giving a generic error.
 */
export function checkSymbolicAnswer(studentInput, correctAnswer) {
  const normalised = normaliseInput(studentInput);

  if (!normalised) {
    return { status: 'unreadable', method: null, normalised };
  }

  const studentNode = safeParse(normalised);
  if (!studentNode) {
    return { status: 'unreadable', method: null, normalised };
  }

  // Reject anything using variables the question did not ask about. This is
  // what separates a wrong answer from text that was never an answer: prose
  // like "i dont know" parses as a product of invented variables, and would
  // otherwise reach the sampler and come back inconclusive.
  const unknown = unknownSymbols(studentNode);
  if (unknown.size > 0) {
    return {
      status: 'unreadable',
      method: null,
      normalised,
      unknownSymbols: [...unknown],
    };
  }

  const correctNode = safeParse(correctAnswer);
  if (!correctNode) {
    // A broken stored answer is a bug in the question bank, not the student's
    // fault. Surface it loudly in development.
    console.error(`Question bank error: cannot parse answer "${correctAnswer}"`);
    return { status: 'inconclusive', method: null, normalised };
  }

  // 1. Proof, if it is available cheaply.
  if (provablyEqual(normalised, correctAnswer)) {
    return { status: 'correct', method: 'symbolic', normalised };
  }

  // 2. Otherwise sample. The spike showed simplify() often cannot prove
  //    equality for roots, fractional powers and trig identities, so a
  //    negative symbolic result is not treated as a wrong answer.
  const verdict = numericallyEqual(studentNode.compile(), correctNode.compile());

  if (verdict === 'equal')     return { status: 'correct',      method: 'numeric', normalised };
  if (verdict === 'different') return { status: 'incorrect',    method: 'numeric', normalised };
  return                              { status: 'inconclusive', method: 'numeric', normalised };
}
