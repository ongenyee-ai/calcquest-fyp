/**
 * CAS equivalence spike — CalcQuest FYP
 *
 * Question: can we automatically tell whether a student's typed derivative
 * is equivalent to the correct one, given that students type the same answer
 * in many different forms?
 *
 * Two candidate methods are compared:
 *   1. Symbolic  — simplify(student - correct) and check it reduces to 0.
 *   2. Numerical — evaluate both at several sample x values and compare.
 *
 * Run:  node spike-cas.mjs
 *
 * The output table is a finding for Chapter 4. Cases that fail are not a
 * failure of the project; they define the scope of automated checking.
 */

import { simplify, parse, evaluate } from 'mathjs';

// ---------------------------------------------------------------------------
// Test cases: forms students actually type, plus wrong answers that must be
// rejected. `same: true` means the two expressions ARE equivalent.
// ---------------------------------------------------------------------------
const CASES = [
  // --- L1 power rule ---
  { topic: 'L1', label: 'reordered terms',        correct: '4x^3 - 6x',      student: '-6x + 4x^3',          same: true  },
  { topic: 'L1', label: 'factored form',          correct: '4x^3 - 6x',      student: '2x*(2x^2 - 3)',       same: true  },
  { topic: 'L1', label: 'explicit multiplication',correct: '4x^3 - 6x',      student: '4*x^3 - 6*x',         same: true  },
  { topic: 'L1', label: 'dropped the x',          correct: '4x^3 - 6x',      student: '4x^3 - 6',            same: false },
  { topic: 'L1', label: 'constant not vanished',  correct: '4x^3 - 6x',      student: '4x^3 - 6x + 6',       same: false },

  // --- roots and fractional powers ---
  { topic: 'L1', label: 'root as neg. power',     correct: '1/(2*sqrt(x))',  student: '0.5*x^(-1/2)',        same: true  },
  { topic: 'L1', label: 'fraction coefficient',   correct: '1/(2*sqrt(x))',  student: '(1/2)*x^(-1/2)',      same: true  },
  { topic: 'L1', label: 'cube root derivative',   correct: '(1/3)*x^(-2/3)', student: '1/(3*x^(2/3))',       same: true  },

  // --- negative powers ---
  { topic: 'L1', label: 'neg. power as fraction', correct: '-3*x^(-4)',      student: '-3/x^4',              same: true  },
  { topic: 'L1', label: 'sign lost',              correct: '-3*x^(-4)',      student: '3/x^4',               same: false },

  // --- L2 product rule (coming next, worth testing now) ---
  { topic: 'L2', label: 'product rule reordered', correct: 'sin(x) + x*cos(x)', student: 'x*cos(x) + sin(x)', same: true  },
  { topic: 'L2', label: 'product rule expanded',  correct: '2x*e^x + x^2*e^x',  student: 'e^x*(x^2 + 2x)',    same: true  },

  // --- L3 quotient rule ---
  { topic: 'L3', label: 'quotient unsimplified',  correct: '(x*cos(x) - sin(x))/x^2',
                                                   student: 'cos(x)/x - sin(x)/x^2',  same: true  },

  // --- L4 chain rule ---
  { topic: 'L4', label: 'chain rule',             correct: '2*x*cos(x^2)',   student: 'cos(x^2)*2x',         same: true  },
  { topic: 'L4', label: 'chain rule, no inner',   correct: '2*x*cos(x^2)',   student: 'cos(x^2)',            same: false },

  // --- implicit multiplication, the way students really type ---
  { topic: 'raw', label: 'student typed "6x-1"',  correct: '6*x - 1',        student: '6x-1',                same: true  },
  { topic: 'raw', label: 'student typed "2x^5"',  correct: '10*x^4',         student: '10x^4',               same: true  },

  // --- trig identity (hard case) ---
  { topic: 'hard',label: 'trig identity',         correct: '1',              student: 'sin(x)^2 + cos(x)^2', same: true  },
];

// ---------------------------------------------------------------------------
// Method 1: symbolic. simplify(a - b) and see whether it reduces to zero.
// ---------------------------------------------------------------------------
function symbolicEquivalent(a, b) {
  try {
    const diff = simplify(`(${a}) - (${b})`);
    return diff.toString().replace(/\s/g, '') === '0';
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Method 2: numerical. Evaluate both at several x values and compare.
// Irrational sample points avoid accidental agreement at nice numbers.
// Points where either side is undefined are skipped; we require a minimum
// number of valid points before trusting the verdict.
// ---------------------------------------------------------------------------
const SAMPLES = [0.37, 1.23, 2.71, 3.49, 5.11, 7.83];
const TOLERANCE = 1e-9;
const MIN_VALID = 4;

function numericEquivalent(a, b) {
  let valid = 0;
  try {
    const fa = parse(a).compile();
    const fb = parse(b).compile();
    for (const x of SAMPLES) {
      let va, vb;
      try {
        va = fa.evaluate({ x });
        vb = fb.evaluate({ x });
      } catch {
        continue;                      // undefined at this point, skip it
      }
      if (!Number.isFinite(va) || !Number.isFinite(vb)) continue;
      const scale = Math.max(1, Math.abs(va), Math.abs(vb));
      if (Math.abs(va - vb) > TOLERANCE * scale) return false;
      valid++;
    }
  } catch {
    return false;
  }
  return valid >= MIN_VALID;
}

// ---------------------------------------------------------------------------
// Run and report
// ---------------------------------------------------------------------------
const results = CASES.map(c => {
  const sym = symbolicEquivalent(c.correct, c.student);
  const num = numericEquivalent(c.correct, c.student);
  return { ...c, sym, num, symOk: sym === c.same, numOk: num === c.same };
});

const pad = (s, n) => String(s).padEnd(n);
const mark = ok => (ok ? ' ok ' : 'FAIL');

console.log('\nCAS equivalence spike — CalcQuest\n');
console.log(pad('topic', 6) + pad('case', 30) + pad('expect', 8) + pad('symbolic', 10) + 'numeric');
console.log('-'.repeat(72));

for (const r of results) {
  console.log(
    pad(r.topic, 6) +
    pad(r.label, 30) +
    pad(r.same ? 'same' : 'differ', 8) +
    pad(`${r.sym ? 'same' : 'differ'} ${mark(r.symOk)}`, 10) +
    `${r.num ? 'same' : 'differ'} ${mark(r.numOk)}`
  );
}

const symPass = results.filter(r => r.symOk).length;
const numPass = results.filter(r => r.numOk).length;
const total = results.length;

console.log('-'.repeat(72));
console.log(`symbolic: ${symPass}/${total} correct`);
console.log(`numeric:  ${numPass}/${total} correct\n`);

const symFails = results.filter(r => !r.symOk).map(r => `${r.topic} ${r.label}`);
const numFails = results.filter(r => !r.numOk).map(r => `${r.topic} ${r.label}`);

if (symFails.length) console.log('symbolic failed on:\n  ' + symFails.join('\n  ') + '\n');
if (numFails.length) console.log('numeric failed on:\n  ' + numFails.join('\n  ') + '\n');

// False accepts are the dangerous failure: marking a wrong answer correct.
const falseAccepts = results.filter(r => !r.same && (r.sym || r.num));
if (falseAccepts.length) {
  console.log('WARNING — wrong answers accepted as correct:');
  for (const r of falseAccepts) {
    console.log(`  ${r.label}: symbolic=${r.sym} numeric=${r.num}`);
  }
  console.log('');
} else {
  console.log('No wrong answer was accepted by either method.\n');
}
