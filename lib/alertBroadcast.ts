type Listener = (payload: string) => void;

declare global {
  var __alertListeners: Set<Listener> | undefined;
}

// Use globalThis so all route handler module instances share the same Set
const listeners: Set<Listener> =
  globalThis.__alertListeners ?? (globalThis.__alertListeners = new Set());

export function addAlertListener(fn: Listener) {
  listeners.add(fn);
}

export function removeAlertListener(fn: Listener) {
  listeners.delete(fn);
}

export function broadcastAlertEvent(event: string, data: unknown) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const fn of listeners) {
    try {
      fn(payload);
    } catch {
      listeners.delete(fn);
    }
  }
}
