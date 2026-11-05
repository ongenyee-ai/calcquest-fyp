import { useState } from 'react';
import { Bolt, Flame } from './Icons.jsx';
import { downloadEvents, readEvents } from '../analytics/log.js';

/** Wireframe 1: main menu with PLAY, streak and XP. */
export default function MainMenu({ streak, totalXp, onPlay, onReset }) {
  const eventCount = readEvents().length;
  const [confirming, setConfirming] = useState(false);

  return (
    <main className="menu">
      <div className="menu-stats">
        <span className="chip chip-streak" title="Daily streak">
          <Flame /> {streak} day{streak === 1 ? '' : 's'}
        </span>
        <span className="chip chip-xp" title="Total XP">
          <Bolt /> {totalXp} XP
        </span>
      </div>

      <div className="menu-hero">
        <p className="eyebrow">NTU EEE · Differentiation</p>
        <h1 className="wordmark">
          Calc<span>Quest</span>
        </h1>
        <p className="tagline">Short practice sessions. Hints that guide you, never give the answer away.</p>
        <button className="btn btn-primary btn-big" onClick={onPlay}>
          ▶ Play
        </button>
        <p className="press-start" aria-hidden="true">PRESS PLAY TO START</p>
      </div>

      <details className="research-tools">
        <summary>Researcher tools</summary>
        <p>
          {eventCount} event{eventCount === 1 ? '' : 's'} logged in this browser.
        </p>
        <div className="row">
          <button className="btn btn-ghost" onClick={downloadEvents}>
            Download usage log (JSON)
          </button>
          {confirming ? (
            <>
              <button
                className="btn btn-danger"
                onClick={() => {
                  onReset();
                  setConfirming(false);
                }}
              >
                Yes, erase progress and log
              </button>
              <button className="btn btn-ghost" onClick={() => setConfirming(false)}>
                Cancel
              </button>
            </>
          ) : (
            <button className="btn btn-ghost" onClick={() => setConfirming(true)}>
              Reset progress
            </button>
          )}
        </div>
      </details>
    </main>
  );
}
