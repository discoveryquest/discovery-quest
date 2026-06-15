// Build a Sentence (foreign-language) — read the native-language meaning, then order the
// scrambled English word tiles to build the English sentence. Each tile speaks its word
// (tokenAudio). Renders via the SentenceBuilder board (opt-in tap-audio + localized strings).
//   item = { en, ru, band? }; the en sentence's words become the scrambled tiles.

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const shuffle = (arr) => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};

// `items` is the sentencesRu array ({ en, ru, band? } objects).
export function genSentenceRu(items, ctx = {}) {
  const it = pick(items);
  const tokens = shuffle(it.en.split(' '));
  return {
    kind: 'sentenceRu',
    word: it.en, // reveal the finished English sentence
    result: it.en,
    steps: [
      {
        focus: [], targets: ['ans-0'], effects: [], preEffects: [],
        chip: { label: 'Предложение', color: '#34D399' },
        banner: 'Собери предложение',
        prompt: '«' + it.ru + '»',
        tokens,
        inputKind: 'build',
        lower: true, // tokens already carry proper case; never re-case them
        tokenAudio: true, // tap a tile → speak('word-<token>')
        placeholder: 'нажимай на слова…',
        readsLabel: 'Получилось:',
        expected: it.en,
        hint: 'Получилось: ' + it.en,
        sayQ: ['q-build'],
        sayA: [],
      },
    ],
  };
}
