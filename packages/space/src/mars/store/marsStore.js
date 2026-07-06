import { useSyncExternalStore } from 'react';

// Tiny external store for HUD/scene state shared across the R3F tree and the DOM
// overlay — no new dependency. State object ref is stable between sets, so
// useSyncExternalStore is happy. Default view is third-person so the player (and
// screenshots) see Luna on Mars; press V to go first-person.
let state = { view: 'third', gravityMode: 'mars', wind: 0 };
const listeners = new Set();

export const marsStore = {
  getState: () => state,
  set: (patch) => { state = { ...state, ...patch }; listeners.forEach((l) => l()); },
  subscribe: (l) => { listeners.add(l); return () => listeners.delete(l); },
  toggleView: () => marsStore.set({ view: state.view === 'first' ? 'third' : 'first' }),
  toggleGravity: () => marsStore.set({ gravityMode: state.gravityMode === 'mars' ? 'earth' : 'mars' }),
};

export function useMarsState() {
  return useSyncExternalStore(marsStore.subscribe, marsStore.getState, marsStore.getState);
}
