/**
 * Usage analytics for the evaluation chapter.
 *
 * Every meaningful event (question shown, answer submitted, hint viewed, node
 * finished) is appended to a log in localStorage with a timestamp and an
 * anonymous participant id. The log can be downloaded as JSON from the main
 * menu, which is how data will be collected in the pilot before a backend
 * exists.
 *
 * Nothing here identifies a person: the participant id is a random string
 * generated on first visit.
 */

const LOG_KEY = 'calcquest.events.v1';
const PID_KEY = 'calcquest.participant.v1';
const MAX_EVENTS = 5000;

function participantId() {
  try {
    let id = localStorage.getItem(PID_KEY);
    if (!id) {
      id = `p-${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(PID_KEY, id);
    }
    return id;
  } catch {
    return 'p-unsaved';
  }
}

export function readEvents() {
  try {
    return JSON.parse(localStorage.getItem(LOG_KEY) || '[]');
  } catch {
    return [];
  }
}

export function logEvent(type, data = {}) {
  const event = { type, at: new Date().toISOString(), participant: participantId(), ...data };
  try {
    const events = readEvents();
    events.push(event);
    localStorage.setItem(LOG_KEY, JSON.stringify(events.slice(-MAX_EVENTS)));
  } catch {
    /* storage unavailable: analytics are best-effort */
  }
  if (import.meta.env?.DEV) console.debug('[calcquest]', type, data);
  return event;
}

export function clearEvents() {
  try {
    localStorage.removeItem(LOG_KEY);
  } catch {
    /* ignore */
  }
}

/** Trigger a browser download of the event log as a JSON file. */
export function downloadEvents() {
  const blob = new Blob([JSON.stringify(readEvents(), null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `calcquest-events-${participantId()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
