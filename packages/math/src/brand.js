// Personalized branding: once a hero has a name, the game becomes THEIRS —
// "Maya's Math Quest". Before onboarding (or with no name) it stays Luna's.
// (Pairs with the yoursmathquest domain idea: the URL asks the question,
// the title answers it.)

import { loadSave } from '@discoveryquest/engine/save';

export function possessive(name) {
  const n = name?.trim();
  if (!n) return "Luna's";
  return /s$/i.test(n) ? `${n}'` : `${n}'s`;
}

export function brandOwner() {
  return possessive(loadSave().profile.name);
}

export function applyDocumentTitle() {
  if (typeof document !== 'undefined') {
    document.title = `${brandOwner()} Math Quest`;
  }
}
