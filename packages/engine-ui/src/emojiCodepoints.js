// Convert an emoji character to its OpenMoji SVG filename stem: the Unicode code points as
// uppercase hex, joined by '-', with the FE0F variation selector dropped (OpenMoji — like
// Twemoji — names files without it). Pure + DOM-free so it's shared by the <Emoji> component
// and the gen-emoji-assets build step, and unit-testable under node:test.
//   '💪' → '1F4AA'   ·   '⬅️' (2B05 FE0F) → '2B05'   ·   '🇺🇸' → '1F1FA-1F1F8'
// Returns '' for empty/non-string input so callers can fall back to the native glyph.
export function emojiToCodepoints(char) {
  if (typeof char !== 'string' || char.length === 0) return '';
  return [...char]
    .map((c) => c.codePointAt(0).toString(16).toUpperCase())
    .filter((hex) => hex !== 'FE0F')
    .join('-');
}
