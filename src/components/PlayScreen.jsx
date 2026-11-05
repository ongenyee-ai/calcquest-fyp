import { useEffect, useReducer, useRef, useState } from 'react';
import Tex from './Tex.jsx';
import SymbolicInput from './SymbolicInput.jsx';
import HintSheet from './HintSheet.jsx';
import { ArrowLeft, Bulb, Heart } from './Icons.jsx';
import { currentQuestion, initSession, progressInfo, sessionReducer, STARTING_HEARTS } from '../game/session.js';
import { MINI_TEST_PASS_MARK } from '../game/scoring.js';
import { checkMcqAnswer } from '../checking/mcq.js';
import { checkSymbolicAnswer } from '../checking/symbolic.js';
import { feedbackFor } from '../data/diagnoses.js';
import { logEvent } from '../analytics/log.js';

/** Wireframes 3–5: question screen, hearts, progress, hint pop-up. */
export default function PlayScreen({ node, onExit, onPassed }) {
  const [state, dispatch] = useReducer(sessionReducer, node.bank, initSession);
  const question = currentQuestion(state);
  const [selected, setSelected] = useState(null);
  const [typed, setTyped] = useState('');
  const shownAt = useRef(Date.now());
  const lastLogged = useRef(null);
  const passedReported = useRef(false);

  // New question: clear the inputs, restart the timer, log it once.
  useEffect(() => {
    setSelected(null);
    setTyped('');
    shownAt.current = Date.now();
    if (question) {
      const key = `${state.phase}:${question.id}`;
      if (lastLogged.current !== key) {
        lastLogged.current = key;
        logEvent('question_shown', { node: node.id, question: question.id, tier: question.tier, phase: state.phase });
      }
    }
  }, [question?.id, state.phase]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (state.phase === 'passed' && !passedReported.current) {
      passedReported.current = true;
      logEvent('node_passed', { node: node.id, ...state.result });
      onPassed(state.result);
    }
    if (state.phase === 'outOfHearts' || state.phase === 'failedTest') lastLogged.current = null;
    if (state.phase === 'outOfHearts') logEvent('out_of_hearts', { node: node.id });
    if (state.phase === 'failedTest') logEvent('mini_test_failed', { node: node.id, results: state.miniResults });
  }, [state.phase]); // eslint-disable-line react-hooks/exhaustive-deps

  function submit() {
    if (!question || state.feedback) return;
    const check =
      question.type === 'symbolic'
        ? checkSymbolicAnswer(typed, question.answer.expression)
        : checkMcqAnswer(question, selected);
    logEvent('answer_submitted', {
      node: node.id,
      question: question.id,
      phase: state.phase,
      answer: question.type === 'symbolic' ? typed : selected,
      status: check.status,
      method: check.method,
      diagnosis: check.diagnosis ?? null,
      attempt: (state.attempts[question.id] ?? 0) + 1,
      hintLevelBefore: state.hintLevel[question.id] ?? 0,
      ms: Date.now() - shownAt.current,
    });
    dispatch({ type: 'SUBMIT', check });
  }

  function openHint() {
    logEvent('hint_viewed', { node: node.id, question: question.id, level: Math.max(1, state.hintLevel[question.id] ?? 0) });
    dispatch({ type: 'OPEN_HINT' });
  }

  function nextHint() {
    logEvent('hint_viewed', { node: node.id, question: question.id, level: Math.min(3, (state.hintLevel[question.id] ?? 0) + 1) });
    dispatch({ type: 'NEXT_HINT' });
  }

  // ----- phase screens -------------------------------------------------------

  if (state.phase === 'miniIntro') {
    return (
      <PhaseCard
        title="Mini-test"
        onExit={onExit}
        body={`Practice done. Now ${state.miniTest.length} test questions: one try each and no hints. Get ${MINI_TEST_PASS_MARK} right to unlock the next level.`}
        action="Start mini-test"
        onAction={() => dispatch({ type: 'START_MINI_TEST' })}
        hearts={state.hearts}
      />
    );
  }

  if (state.phase === 'failedTest') {
    const score = state.miniResults.filter(r => r.correct).length;
    return (
      <PhaseCard
        title="Not this time"
        onExit={onExit}
        body={`You scored ${score} / ${state.miniTest.length} on the mini-test. You need ${MINI_TEST_PASS_MARK} to pass. Your practice progress is kept, so you can go straight back into the test.`}
        action="Retry mini-test"
        onAction={() => dispatch({ type: 'START_MINI_TEST' })}
        hearts={state.hearts}
      />
    );
  }

  if (state.phase === 'outOfHearts') {
    return (
      <PhaseCard
        title="Out of hearts"
        onExit={onExit}
        body="You've used all three hearts. This level restarts from the beginning, but the rest of your progress is safe."
        action="Restart level"
        onAction={() => {
          logEvent('node_restarted', { node: node.id });
          dispatch({ type: 'RESTART' });
        }}
        hearts={0}
      />
    );
  }

  if (state.phase === 'passed' || !question) return null;

  // ----- question screen -----------------------------------------------------

  const info = progressInfo(state);
  const isTest = state.phase === 'miniTest';
  const fb = state.feedback;
  const canCheck = !fb && (question.type === 'symbolic' ? typed.trim().length > 0 : selected !== null);
  const hintLevel = state.hintLevel[question.id] ?? 0;

  return (
    <main className="play">
      <TopBar info={info} hearts={state.hearts} onExit={onExit} answeredCurrent={!isTest && fb?.kind === 'correct'} />

      <section className="card question-card">
        <div className="question-meta">
          <span className={`tag ${isTest ? 'tag-test' : ''}`}>{isTest ? 'Mini-test' : `Practice · tier ${question.tier}`}</span>
          {!isTest && hintLevel > 0 && <span className="tag tag-hint">Hint used · XP halved</span>}
        </div>
        <p className="question-prompt" aria-label={question.prompt}>
          {question.type === 'symbolic' ? 'Differentiate:' : 'Choose the derivative:'}
        </p>
        <div className="question-math">
          <Tex display tex={question.promptLatex} />
        </div>

        {question.type === 'symbolic' ? (
          <SymbolicInput
            value={typed}
            onChange={v => {
              setTyped(v);
              if (fb?.kind === 'unreadable') dispatch({ type: 'TRY_AGAIN' });
            }}
            onSubmit={submit}
            disabled={fb && fb.kind !== 'unreadable'}
          />
        ) : (
          <div className="options" role="radiogroup" aria-label="Answer options">
            {question.options.map(opt => {
              const isSelected = selected === opt.id;
              const reveal = fb && isTest && isSelected ? (fb.kind === 'correct' ? 'is-right' : 'is-wrong') : '';
              const right = fb?.kind === 'correct' && isSelected ? 'is-right' : '';
              return (
                <button
                  key={opt.id}
                  role="radio"
                  aria-checked={isSelected}
                  className={`option ${isSelected ? 'is-selected' : ''} ${reveal || right}`}
                  onClick={() => !fb && setSelected(opt.id)}
                  disabled={Boolean(fb)}
                >
                  <span className="option-key">{opt.id.toUpperCase()}</span>
                  <Tex tex={opt.latex} />
                </button>
              );
            })}
          </div>
        )}

        {fb?.kind === 'unreadable' && (
          <p className="inline-error" role="alert">
            {fb.unknownSymbols?.length
              ? `Your answer uses ${fb.unknownSymbols.join(', ')}. Answer in terms of x only.`
              : fb.status === 'inconclusive'
                ? "We couldn't check that answer reliably. Try writing it a different way."
                : "We couldn't read that answer. Check your brackets and operators. No heart lost."}
          </p>
        )}
      </section>

      {fb?.kind === 'correct' && (
        <footer className="feedback-bar is-correct" role="status">
          <div>
            <strong>{fb.test ? 'Correct!' : 'Nice work!'}</strong> +{fb.xp} XP
            {fb.usedHint && <span className="muted"> (halved for using a hint)</span>}
            {fb.tierUp && <span className="muted"> · Three in a row, the questions get harder.</span>}
          </div>
          <button className="btn btn-success" onClick={() => dispatch({ type: 'CONTINUE' })} autoFocus>
            Continue
          </button>
        </footer>
      )}

      {fb?.kind === 'wrong' && isTest && (
        <footer className="feedback-bar is-wrong" role="status">
          <div>
            <strong>Not quite.</strong> You lost a heart. Tests give one try per question.
          </div>
          <button className="btn btn-danger" onClick={() => dispatch({ type: 'CONTINUE' })} autoFocus>
            Continue
          </button>
        </footer>
      )}

      {!fb && (
        <footer className="action-bar">
          {!isTest ? (
            <button className="btn btn-ghost" onClick={openHint}>
              <Bulb /> Hint
            </button>
          ) : (
            <span className="muted">No hints in the mini-test.</span>
          )}
          <button className="btn btn-primary" onClick={submit} disabled={!canCheck}>
            Check
          </button>
        </footer>
      )}

      {fb?.kind === 'wrong' && !isTest && (
        <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="wrong-title">
          <div className="sheet sheet-small">
            <h2 id="wrong-title">Not quite! You lost a heart.</h2>
            {feedbackFor(fb.diagnosis) && <p className="diagnosis">{feedbackFor(fb.diagnosis)}</p>}
            <div className="row row-center">
              <button className="btn btn-ghost" onClick={openHint}>
                <Bulb /> Hint
              </button>
              <button className="btn btn-primary" onClick={() => dispatch({ type: 'TRY_AGAIN' })} autoFocus>
                Try again
              </button>
            </div>
          </div>
        </div>
      )}

      {state.hintOpen && (
        <HintSheet
          question={question}
          level={hintLevel}
          autoOpened={state.autoHint}
          onNext={nextHint}
          onClose={() => dispatch({ type: 'CLOSE_HINT' })}
        />
      )}
    </main>
  );
}

function TopBar({ info, hearts, onExit, answeredCurrent = false }) {
  // While the "correct" bar is showing, the current question already counts as done.
  const number = answeredCurrent ? info.done : info.done + 1;
  return (
    <header className="topbar">
      <button className="btn-icon" onClick={onExit} aria-label="Leave level">
        <ArrowLeft />
      </button>
      <div className="progress" aria-label={`${info.label}: ${info.done} of ${info.total} done`}>
        <div className="progress-dots">
          {Array.from({ length: info.total }, (_, i) => (
            <span key={i} className={`dot ${i < info.done ? 'is-done' : i === info.done ? 'is-current' : ''}`} />
          ))}
        </div>
        <span className="progress-label">
          {info.label} · Q {Math.min(number, info.total)}/{info.total}
        </span>
      </div>
      <div className="hearts" aria-label={`${hearts} of ${STARTING_HEARTS} hearts left`}>
        {Array.from({ length: STARTING_HEARTS }, (_, i) => (
          <Heart key={i} filled={i < hearts} />
        ))}
      </div>
    </header>
  );
}

function PhaseCard({ title, body, action, onAction, onExit, hearts }) {
  return (
    <main className="play">
      <header className="topbar">
        <button className="btn-icon" onClick={onExit} aria-label="Leave level">
          <ArrowLeft />
        </button>
        <div className="progress" />
        <div className="hearts" aria-label={`${hearts} of ${STARTING_HEARTS} hearts left`}>
          {Array.from({ length: STARTING_HEARTS }, (_, i) => (
            <Heart key={i} filled={i < hearts} />
          ))}
        </div>
      </header>
      <section className="card phase-card">
        <h1>{title}</h1>
        <p>{body}</p>
        <button className="btn btn-primary btn-big" onClick={onAction}>
          {action}
        </button>
      </section>
    </main>
  );
}
