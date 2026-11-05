import { Bolt, Flame, Star } from './Icons.jsx';

/** Wireframe 6: stars, XP, streak and CONTINUE. */
export default function Results({ node, result, streak, onContinue }) {
  return (
    <main className="results">
      <section className="card results-card">
        <p className="eyebrow">
          {node.id} · {node.subtitle}
        </p>
        <h1>Level complete!</h1>
        <div className="results-stars" aria-label={`${result.stars} of 3 stars`}>
          {[1, 2, 3].map(n => (
            <Star key={n} filled={n <= result.stars} size={56} />
          ))}
        </div>
        <dl className="stats">
          <div>
            <dt>XP earned</dt>
            <dd>
              <Bolt /> {result.xp}
            </dd>
          </div>
          <div>
            <dt>First-try accuracy</dt>
            <dd>{Math.round(result.accuracy * 100)}%</dd>
          </div>
          <div>
            <dt>Mini-test</dt>
            <dd>
              {result.miniScore} / {result.miniTotal}
            </dd>
          </div>
          <div>
            <dt>Hints used</dt>
            <dd>{result.hintsUsed}</dd>
          </div>
          <div>
            <dt>Streak</dt>
            <dd>
              <Flame /> {streak}
            </dd>
          </div>
        </dl>
        <button className="btn btn-primary btn-big" onClick={onContinue}>
          Continue
        </button>
      </section>
    </main>
  );
}
