// React binding for the game store. Kept separate from gameStore.js so the store
// logic stays React-free and node-testable. Components select primitive/stable
// slices; the default selector returns the whole (referentially-stable) state.
import { useSyncExternalStore } from 'react';
import { gameStore } from './gameStore.js';

const identity = (s) => s;

// useGame(s => s.phase) — re-renders only when the selected slice changes by ===.
// Selectors should return a primitive or a stable reference (the store updates
// immutably, so the whole-state reference is stable when unchanged).
export function useGame(selector = identity, store = gameStore) {
  const getSnap = () => selector(store.get());
  return useSyncExternalStore(store.subscribe, getSnap, getSnap);
}

// Actions are stable for the life of the store — safe to use without memoizing.
export const useGameActions = (store = gameStore) => store.actions;
