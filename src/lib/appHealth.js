const MAX_EVENTS = 40;
const listeners = new Set();
let events = [];

function notify() {
  listeners.forEach((listener) => listener(events));
}

export function recordHealthEvent({
  type = 'application',
  severity = 'error',
  message,
  context = {},
}) {
  if (!message) return;
  events = [
    {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type,
      severity,
      message: String(message).slice(0, 500),
      context,
      createdAt: new Date().toISOString(),
    },
    ...events,
  ].slice(0, MAX_EVENTS);
  notify();
}

export function getHealthEvents() {
  return events;
}

export function subscribeToHealthEvents(listener) {
  listeners.add(listener);
  listener(events);
  return () => listeners.delete(listener);
}

export function clearHealthEvents() {
  events = [];
  notify();
}

export function installGlobalHealthListeners() {
  if (window.__veloraHealthListenersInstalled) return;
  window.__veloraHealthListenersInstalled = true;

  window.addEventListener('error', (event) => {
    recordHealthEvent({
      type: 'unexpected-exception',
      message: event.error?.message || event.message || 'Unexpected application error.',
      context: { source: event.filename, line: event.lineno },
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    recordHealthEvent({
      type: 'unhandled-promise',
      message: event.reason?.message || String(event.reason || 'Unhandled promise rejection.'),
    });
  });
}
