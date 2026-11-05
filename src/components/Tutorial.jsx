import { useState } from 'react';
import Tex from './Tex.jsx';
import { ArrowLeft } from './Icons.jsx';

/** L0: guided tutorial, no scoring and no hearts (docs/skill_tree.md). */

const W = 420, H = 280;
const X_MIN = -2.5, X_MAX = 2.5, Y_MIN = -1, Y_MAX = 6.5;
const sx = x => ((x - X_MIN) / (X_MAX - X_MIN)) * W;
const sy = y => H - ((y - Y_MIN) / (Y_MAX - Y_MIN)) * H;

function SlopeExplorer() {
  const [a, setA] = useState(1);
  const slope = 2 * a;
  const curve = Array.from({ length: 101 }, (_, i) => {
    const x = X_MIN + (i / 100) * (X_MAX - X_MIN);
    return `${i === 0 ? 'M' : 'L'}${sx(x).toFixed(1)} ${sy(x * x).toFixed(1)}`;
  }).join(' ');
  const tangentAt = x => slope * (x - a) + a * a;

  return (
    <div className="explorer">
      <svg viewBox={`0 0 ${W} ${H}`} className="explorer-graph" role="img" aria-label={`Tangent to y = x squared at x = ${a}`}>
        <line x1={0} x2={W} y1={sy(0)} y2={sy(0)} className="axis" />
        <line x1={sx(0)} x2={sx(0)} y1={0} y2={H} className="axis" />
        <path d={curve} className="curve" />
        <line x1={sx(X_MIN)} y1={sy(tangentAt(X_MIN))} x2={sx(X_MAX)} y2={sy(tangentAt(X_MAX))} className="tangent" />
        <circle cx={sx(a)} cy={sy(a * a)} r="6" className="point" />
        <text x={sx(-1.95)} y={sy(6.05)} className="graph-label">y = x²</text>
      </svg>
      <label className="explorer-control">
        <span>
          Move the point: x = <strong>{a.toFixed(1)}</strong>
        </span>
        <input type="range" min="-2" max="2" step="0.1" value={a} onChange={e => setA(Number(e.target.value))} />
      </label>
      <p className="explorer-readout">
        Slope of the tangent at this point: <strong>{slope.toFixed(1)}</strong>
        <span className="muted"> · that is the derivative of x² at x = {a.toFixed(1)}</span>
      </p>
    </div>
  );
}

const STEPS = [
  {
    title: 'A derivative is a rate of change',
    body: (
      <>
        <p>
          The derivative tells you how fast one quantity changes when another one changes. You already use this in
          EEE: the current through a capacitor depends on how fast its voltage changes.
        </p>
        <div className="formula">
          <Tex display tex="i = C\,\frac{dv}{dt}" />
        </div>
        <p>If the voltage is steady, the derivative is zero and no current flows. If it changes quickly, the current is large.</p>
      </>
    ),
  },
  {
    title: 'Slope at a point',
    body: (
      <>
        <p>
          On a graph, the derivative at a point is the slope of the tangent line there. Drag the slider and watch how
          the slope of <Tex tex="y = x^2" /> changes from point to point.
        </p>
        <SlopeExplorer />
      </>
    ),
  },
  {
    title: 'How it is written',
    body: (
      <>
        <p>These all mean "the derivative of y with respect to x":</p>
        <div className="formula">
          <Tex display tex="\frac{dy}{dx} \qquad f'(x) \qquad \frac{d}{dx}\big(f(x)\big)" />
        </div>
        <p>
          You found that the slope of <Tex tex="x^2" /> at any point is twice the x value. In the next level you will
          learn the rule that gives this result straight away: the power rule.
        </p>
      </>
    ),
  },
];

export default function Tutorial({ onBack, onComplete }) {
  const [step, setStep] = useState(0);
  const current = STEPS.at(step);
  const last = step === STEPS.length - 1;

  return (
    <main className="tutorial">
      <header className="screen-head">
        <button className="btn-icon" onClick={onBack} aria-label="Back to map">
          <ArrowLeft />
        </button>
        <h1>L0 · What is a Derivative?</h1>
        <span className="step-count">
          {step + 1} / {STEPS.length}
        </span>
      </header>

      <section className="card tutorial-card">
        <h2>{current.title}</h2>
        {current.body}
      </section>

      <footer className="action-bar">
        <button className="btn btn-ghost" onClick={() => setStep(s => s - 1)} disabled={step === 0}>
          Back
        </button>
        <button className="btn btn-primary" onClick={() => (last ? onComplete() : setStep(s => s + 1))}>
          {last ? 'Finish tutorial' : 'Next'}
        </button>
      </footer>
    </main>
  );
}
