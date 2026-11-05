import { getHint, HINT_LEVELS } from '../hints/hintProvider.js';
import { Bulb } from './Icons.jsx';

/** Wireframe 5: three escalating hints. Never the final answer. */
export default function HintSheet({ question, level, autoOpened, onNext, onClose }) {
  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="hint-title">
      <div className="sheet">
        <h2 id="hint-title">
          <Bulb /> Hints
        </h2>
        {autoOpened && <p className="sheet-intro">That's two tries on this one. Here's a nudge before you go again.</p>}

        <ol className="hint-list">
          {HINT_LEVELS.map(({ level: n, name }) => {
            const unlocked = n <= level;
            return (
              <li key={n} className={unlocked ? 'is-open' : 'is-locked'}>
                <span className="hint-level">
                  Level {n} · {name}
                </span>
                {unlocked ? <p>{getHint(question, n).text}</p> : <p className="muted">Locked</p>}
              </li>
            );
          })}
        </ol>

        <p className="sheet-note">Using a hint halves the XP for this question.</p>

        <div className="row row-end">
          {level < 3 && (
            <button className="btn btn-ghost" onClick={onNext}>
              Show next hint
            </button>
          )}
          <button className="btn btn-primary" onClick={onClose}>
            Back to question
          </button>
        </div>
      </div>
    </div>
  );
}
