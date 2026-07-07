import { useSyncExternalStore } from 'react';

// Tiny external store for HUD/scene state shared across the R3F tree and the DOM
// overlay — no new dependency. State object ref is stable between sets, so
// useSyncExternalStore is happy. Default view is third-person so the player (and
// screenshots) see Luna on Mars; press V to go first-person.
let state = {
  view: 'third',
  gravityMode: 'mars',
  wind: 0,
  interaction: { selectedId: null, heldId: null, prompt: '' },
  rockResetSeq: 0,
  // Rover exploded-view tour: 'closed' → 'open' (parts fly apart, camera flies in)
  // → 'closing' (parts ease back home; when reassembled the driver flips to
  // 'closed'). roverPartIndex = -1 means "nothing picked yet" (show the hint).
  roverTour: 'closed',
  roverPartIndex: -1,
};
const listeners = new Set();

export const marsStore = {
  getState: () => state,
  set: (patch) => { state = { ...state, ...patch }; listeners.forEach((l) => l()); },
  subscribe: (l) => { listeners.add(l); return () => listeners.delete(l); },
  toggleView: () => marsStore.set({ view: state.view === 'first' ? 'third' : 'first' }),
  toggleGravity: () => marsStore.set({ gravityMode: state.gravityMode === 'mars' ? 'earth' : 'mars' }),
  setInteraction: (interaction) => marsStore.set({ interaction }),
  resetRocks: () => marsStore.set({ rockResetSeq: state.rockResetSeq + 1 }),
  // Tour phase machine. openRoverTour starts the fly-apart; closeRoverTour begins
  // reassembly; finishCloseTour is called by the animation driver once the parts
  // have eased fully home so control returns to the player exactly on the beat.
  openRoverTour: () => { if (state.roverTour === 'closed') marsStore.set({ roverTour: 'open', roverPartIndex: -1 }); },
  closeRoverTour: () => { if (state.roverTour !== 'closed') marsStore.set({ roverTour: 'closing' }); },
  finishCloseTour: () => marsStore.set({ roverTour: 'closed', roverPartIndex: -1 }),
  setRoverPartIndex: (roverPartIndex) => marsStore.set({ roverPartIndex }),
};

export function useMarsState() {
  return useSyncExternalStore(marsStore.subscribe, marsStore.getState, marsStore.getState);
}
