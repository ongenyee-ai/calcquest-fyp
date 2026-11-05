import { useState } from 'react';
import MainMenu from './components/MainMenu.jsx';
import LevelMap from './components/LevelMap.jsx';
import Tutorial from './components/Tutorial.jsx';
import PlayScreen from './components/PlayScreen.jsx';
import Results from './components/Results.jsx';
import { displayedStreak, loadProgress, recordNodeComplete, resetProgress, saveProgress } from './game/progress.js';
import { clearEvents, logEvent } from './analytics/log.js';

/**
 * Top-level screen switching. Screens: menu -> map -> tutorial | play -> results.
 * No router library: four screens do not need one yet.
 */
export default function App() {
  const [progress, setProgress] = useState(loadProgress);
  const [screen, setScreen] = useState({ name: 'menu' });

  function updateProgress(next) {
    setProgress(next);
    saveProgress(next);
  }

  function openNode(node) {
    logEvent('node_opened', { node: node.id });
    setScreen({ name: node.kind === 'tutorial' ? 'tutorial' : 'play', node, key: Date.now() });
  }

  const streak = displayedStreak(progress.streak);

  switch (screen.name) {
    case 'map':
      return <LevelMap progress={progress} onBack={() => setScreen({ name: 'menu' })} onOpenNode={openNode} />;

    case 'tutorial':
      return (
        <Tutorial
          onBack={() => setScreen({ name: 'map' })}
          onComplete={() => {
            logEvent('tutorial_completed', { node: screen.node.id });
            updateProgress(recordNodeComplete(progress, screen.node.id));
            setScreen({ name: 'map' });
          }}
        />
      );

    case 'play':
      return (
        <PlayScreen
          key={screen.key}
          node={screen.node}
          onExit={() => {
            logEvent('node_left', { node: screen.node.id });
            setScreen({ name: 'map' });
          }}
          onPassed={result => {
            updateProgress(recordNodeComplete(progress, screen.node.id, result));
            setScreen({ name: 'results', node: screen.node, result });
          }}
        />
      );

    case 'results':
      return <Results node={screen.node} result={screen.result} streak={streak} onContinue={() => setScreen({ name: 'map' })} />;

    default:
      return (
        <MainMenu
          streak={streak}
          totalXp={progress.totalXp}
          onPlay={() => setScreen({ name: 'map' })}
          onReset={() => {
            clearEvents();
            setProgress(resetProgress());
          }}
        />
      );
  }
}
