import { useRef } from 'react';
import { parse } from 'mathjs';
import Tex from './Tex.jsx';
import { normaliseInput } from '../checking/symbolic.js';

/**
 * Wireframe 4: typed answer box with a small maths keypad and a live preview.
 * The preview shows the student how their typing was read, so a bracket
 * mistake is visible before they press Check. (MathLive can replace this
 * later; the checker only needs the plain-text answer.)
 */

const KEYS = [
  { label: 'x', insert: 'x' },
  { label: 'x²', insert: '^2' },
  { label: 'xⁿ', insert: '^(' },
  { label: '√', insert: 'sqrt(' },
  { label: '(', insert: '(' },
  { label: ')', insert: ')' },
  { label: '+', insert: ' + ' },
  { label: '−', insert: ' - ' },
  { label: '×', insert: '*' },
  { label: '÷', insert: '/' },
  { label: 'π', insert: 'pi' },
];

function previewTex(text) {
  const normalised = normaliseInput(text);
  if (!normalised) return null;
  try {
    // mathjs writes implicit multiplication as '~' (a space); drop it so 4x reads as 4x.
    return parse(normalised).toTex({ parenthesis: 'auto', implicit: 'hide' }).replace(/~/g, '');
  } catch {
    return null;
  }
}

export default function SymbolicInput({ value, onChange, onSubmit, disabled }) {
  const inputRef = useRef(null);
  const tex = previewTex(value);

  function insert(text) {
    const el = inputRef.current;
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? value.length;
    const next = value.slice(0, start) + text + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      el?.focus();
      const caret = start + text.length;
      el?.setSelectionRange(caret, caret);
    });
  }

  return (
    <div className="symbolic">
      <label className="symbolic-label" htmlFor="answer">
        Type your answer
      </label>
      <input
        id="answer"
        ref={inputRef}
        className="symbolic-input"
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' && value.trim()) onSubmit();
        }}
        placeholder="e.g. 4x^3 - 6x"
        autoComplete="off"
        spellCheck="false"
        disabled={disabled}
      />
      <div className="keypad" role="group" aria-label="Maths keypad">
        {KEYS.map(k => (
          <button key={k.label} type="button" className="key" onClick={() => insert(k.insert)} disabled={disabled}>
            {k.label}
          </button>
        ))}
        <button type="button" className="key key-wide" onClick={() => onChange('')} disabled={disabled}>
          Clear
        </button>
      </div>
      <div className="preview" aria-live="polite">
        <span className="muted">Read as:</span> {tex ? <Tex tex={tex} /> : <span className="muted">…</span>}
      </div>
    </div>
  );
}
