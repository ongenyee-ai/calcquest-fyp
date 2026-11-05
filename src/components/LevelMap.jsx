import { useState } from 'react';
import { NODES, nodeStatus } from '../data/nodes.js';
import { ArrowLeft, Check, Lock, Star } from './Icons.jsx';

/** Wireframe 2: the level map L0–L5, joined by a dashed path, with lock states. */

// Node positions as percentages of the map area, tracing the wireframe's path.
const POSITIONS = [
  { x: 9, y: 20 },
  { x: 27, y: 44 },
  { x: 45, y: 26 },
  { x: 61, y: 56 },
  { x: 77, y: 34 },
  { x: 91, y: 66 },
];

export default function LevelMap({ progress, onBack, onOpenNode }) {
  const [notice, setNotice] = useState(null);
  const path = POSITIONS.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x} ${p.y}`).join(' ');

  function handleClick(node, status) {
    if (status === 'locked') {
      setNotice(`Finish the previous level to unlock ${node.id}.`);
    } else if (status === 'comingSoon') {
      setNotice(`${node.id} · ${node.subtitle} is coming soon. Questions for this level are still being written.`);
    } else {
      setNotice(null);
      onOpenNode(node);
    }
  }

  return (
    <main className="map">
      <header className="screen-head">
        <button className="btn-icon" onClick={onBack} aria-label="Back to menu">
          <ArrowLeft />
        </button>
        <h1>Differentiation</h1>
      </header>

      <div className="map-area">
        <svg className="map-path" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <path d={path} vectorEffect="non-scaling-stroke" />
        </svg>

        {NODES.map((node, i) => {
          const status = nodeStatus(node, i, progress);
          const pos = POSITIONS.at(i);
          const stars = progress.stars[node.id] ?? 0;
          return (
            <div key={node.id} className={`map-node is-${status}`} style={{ left: `${pos.x}%`, top: `${pos.y}%` }}>
              <button
                className="map-dot"
                onClick={() => handleClick(node, status)}
                aria-label={`${node.id} ${node.subtitle}, ${status}`}
              >
                {status === 'locked' ? <Lock /> : status === 'complete' ? <Check /> : <span>{node.id}</span>}
              </button>
              <div className="map-label">
                <strong>
                  {node.id} · {node.subtitle}
                </strong>
                <span>{node.title}</span>
                {node.kind !== 'tutorial' && status === 'complete' && (
                  <span className="map-stars" aria-label={`${stars} stars`}>
                    {[1, 2, 3].map(n => (
                      <Star key={n} filled={n <= stars} size={16} />
                    ))}
                  </span>
                )}
                {status === 'comingSoon' && <span className="tag">Coming soon</span>}
              </div>
            </div>
          );
        })}
      </div>

      <p className="map-note">{notice ?? 'Each level ends with a mini-test. Pass it to unlock the next level.'}</p>
    </main>
  );
}
