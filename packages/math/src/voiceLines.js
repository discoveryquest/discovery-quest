// Luna's spoken lines. The keys/order here map 1:1 to the pre-generated
// audio files in public/voice/<voice>/ (e.g. praise[2] →
// /voice/jessica/praise-2.mp3), produced by scripts/gen-voice.mjs.
// To switch voices: run `node scripts/gen-voice.mjs --voice <Name>` and
// point ACTIVE_VOICE at the new folder.

export const ACTIVE_VOICE = 'jessica';

// Lesson narration (the lesson engine) now lives in ./lessons/lines.js (plain JS,
// shared with gen-voice) — co-located with the beat scripts. Generated with a slower,
// warmer teaching voice profile (gen-voice `slow`).

export const VOICE_LINES = {
  greeting: ["Let's try one! I'll help you every step of the way!"],
  praise: ['Nice!', 'You got it!', 'Awesome!', 'Perfect!', 'Woohoo!', 'Brilliant!', 'Super!'],
  oops: [
    'Hmm, not quite — try again!',
    'Almost! Give it one more go!',
    'Oopsie — look closely and try again!',
  ],
  hint: ['Hmm, let me help you!'],
  solved: [
    'Woohoo! You solved the whole thing!',
    'Perfect! Not a single slip — you solved it all!',
  ],
  chat: [
    'Hoot hoot! Keep going, superstar!',
    "You've got this — one digit at a time!",
    'Math is more fun together!',
  ],
  rankup: [
    'Zoom! You just flew past someone on the leaderboard!',
    'Look at you climb! Up, up, up you go!',
  ],
  first: ["Hoot hoot! FIRST PLACE! You're the champion of the Number Lab!"],
  position: [
    "Ooh, look how high you are! One more problem and you'll catch the next friend!",
    "You're climbing so fast! Let's zoom past the next one together!",
  ],
  champion: ["You're number ONE! Can you keep your crown? Let's solve another!"],
  blast: ['Blast from the past! Do you remember this one?'],
  blastmiss: ["It's been a while — let's practice this one again soon!"],
  gem: ['You earned a Memory Gem! Your brain is getting stronger!'],
  // start screen & map
  obwelcome: ["Hi! I'm Luna! Let's make your hero!"],
  herewego: ['Here we go — adventure time!'],
  mapwelcome: ['This is your quest map! Tap a glowing station and press play!'],
  pressplay: ['Ready? Press play!'],
  lockedmsg: ['This one is still locked. Earn a star at the station before it!'],
  soonmsg: ["I'm still building this station — coming soon!"],
  // interactive-hint teaching narration (one per hint kind)
  hintmul: ['Find your first number on the side, then slide across to where it meets your other number on top. That is your answer!'],
  hintdiv: ['Look across the row for your big number — the number at the top of that column is how many times it fits!'],
  hintline: ['Start on the first number, then hop along the line. Count every hop out loud, and see where you land!'],
  // concept intros — multiple ways to SEE an idea before practicing
  conceptmul: ['Multiplying is just a fast way to add the same number again and again! Here are three ways to see it — tap to explore each one.'],
  repaddmul: ['Look — three groups of four. Add four, three times: four, eight, twelve!'],
  arraymul: ['Now line them up: three rows of four. Count the whole rectangle — twelve!'],
  // operations wave
  conceptadd: ['Adding means putting groups together to make a bigger group. Here are two ways to see it!'],
  conceptsub: ['Subtracting means taking some away — or counting backwards. Let me show you!'],
  conceptdiv: ['Dividing means sharing fairly into equal groups. Here are two ways to see it!'],
  conceptcount: ['Counting means saying the numbers in order as you point to each thing. Let us count together!'],
  conceptbonds: ['Number bonds are two parts that snap together to make a whole. Let us find the missing part!'],
  combineblocks: ['Five blocks, and three more. Slide them together and count them all — eight!'],
  takeaway: ['Start with eight blocks, then take three away. Count what is left — five!'],
  sharegroups: ['Twelve blocks shared into three groups. Deal them out, one each, until they are gone — four in each group!'],
  countdots: ['Point to each one and count out loud: one, two, three, four, five!'],
  tenframe: ['Fill the ten-frame. How many more squares until it is full?'],
  // place-value wave
  conceptpv: ['Big numbers are built from tens and ones! A tall rod is ten, a little block is one. Count the rods, then the blocks.'],
  baseten: ['Two rods of ten and three single blocks. Ten, twenty... twenty-one, twenty-two, twenty-three!'],
  conceptcompare: ['To compare numbers, look at the biggest place first. More tens means a bigger number!'],
  comparecards: ['Forty-two and twenty-eight. Forty-two has more tens, so it is the bigger one!'],
  conceptevenodd: ['Even numbers split into pairs with none left over. Odd numbers always have one left all alone!'],
  evenodddots: ['Six makes three pairs, with none left over — so six is even!'],
  conceptskip: ['Skip counting hops by the same amount each time — a super fast way to count! Let us hop by five.'],
  skiphops: ['Five, ten, fifteen, twenty — each hop adds five more!'],
  // fractions wave
  conceptfrac: ['A fraction is part of a whole! The bottom number says how many equal pieces, and the top says how many we have.'],
  fracpie: ['Cut the pie into four equal slices, and color three. That is three quarters!'],
  fracbar: ['The same fraction as a bar: four equal parts, three of them filled. Three out of four!'],
  conceptequiv: ['Different fractions can be exactly the same size! One half is the same as two quarters.'],
  equivpies: ['One big half, or two smaller quarters — the colored amount is exactly the same!'],
  conceptcompfrac: ['To compare fractions, see which one covers more of the whole. More shading means bigger!'],
  compfracs: ['One half covers more of the pie than one third — so one half is the bigger fraction!'],
  conceptaddfrac: ['When the slices are the same size, adding fractions is easy — just add the top numbers!'],
  addfracs: ['One quarter plus two quarters. Count the colored slices — three quarters!'],
  // rounding & word-problems wave
  conceptround: ['Rounding means jumping to the nearest round number. Past the middle? Jump up. Before it? Jump down!'],
  roundline: ['Forty-seven is past the middle, closer to fifty — so it rounds up to fifty!'],
  conceptword: ['Story problems hide a math question inside! Read carefully, find the numbers, and decide what to do.'],
  wordhide: ['Mia has five apples and gets three more. "More" means add — five plus three is eight!'],
  // decimals wave
  conceptdecplace: ['A decimal point splits the whole ones from tiny parts! Split one whole square into ten strips — each strip is one tenth.'],
  decgrid: ['This big square is one whole. Shade three strips — that is three tenths, or zero point three!'],
  conceptcompdec: ['To compare decimals, line up the points and check each place. More digits does not always mean bigger!'],
  compdec: ['Zero point five fills half the square. Zero point four five fills a little less — so zero point five is bigger!'],
  conceptadddec: ['Adding decimals is just like whole numbers — but line up the decimal points first, so tenths add to tenths!'],
  adddec: ['Line up the points: one point two plus three point four. Add each column — four point six!'],
  conceptpow10: ['Multiplying by ten makes everything ten times bigger, so the decimal point hops one place to the right!'],
  pow10hop: ['Three point four, times ten — the point hops one spot to the right — thirty-four!'],
  // measure wave
  conceptmoney: ['Count money by starting with the biggest coins first, then adding the smaller ones!'],
  moneycount: ['A twenty-five and a ten — twenty-five, then thirty-five. Thirty-five cents!'],
  concepttime: ['The short hand points to the hour, the long hand counts the minutes — each number is five minutes!'],
  clockread: ['The short hand is past the three, the long hand points to the six — that is half past, so three thirty!'],
  conceptelapsed: ['Elapsed time is how long something lasts. Start at the beginning, hop forward, and see where you end up!'],
  elapsedread: ['Starts at two o’clock and lasts one and a half hours — that brings us to three thirty!'],
  conceptunits: ['Bigger units hold lots of smaller ones! One meter is a hundred centimeters. Going smaller, multiply; going bigger, divide!'],
  unitladder: ['One meter equals a hundred centimeters. So two meters is two hundred centimeters!'],
  // geometry wave
  conceptshapes: ['Every flat shape is made of straight sides! Count the sides all the way around, and that tells you its name.'],
  shapesides: ['Trace around the square — one side, two, three, four. Four straight sides means it is a square!'],
  conceptsym: ['A shape is symmetric if you can fold it so both halves match exactly! That fold line is called the line of symmetry.'],
  symfold: ['Fold the butterfly right down the middle — the left wing lands perfectly on the right. It is symmetric!'],
  conceptangle: ['An angle measures how far something turns! A square corner is ninety degrees — a perfect quarter turn.'],
  angleturn: ['Watch the arm sweep open from the bottom line. A square corner like this is ninety degrees!'],
  conceptperim: ['Perimeter is the distance all the way around the edge — like a fence around a garden. Add up every side!'],
  perimtrace: ['Walk around the edge: three plus two plus three plus two. The perimeter is ten!'],
  conceptarea: ['Area is how much space is inside a shape — count the little squares that fill it up. Rows times columns!'],
  areafill: ['Three across and two down fills six little squares. The area is six!'],
  conceptvol: ['Volume is how many little cubes fit inside a box! Count one layer, then stack the layers up.'],
  vollayers: ['Six cubes fill one layer, and two layers stack up — twelve cubes fill the whole box!'],
};

export const voiceKey = (category, index) => `${category}-${index}`;

// ── Concatenative speech fragments ──────────────────────────────────────────
// Luna reads the actual math out loud by stitching tiny clips together:
// numbers 0..NUM_MAX in two intonations (n-X mid-sentence, e-X sentence-final)
// plus the phrase fragments below. Generated with previous_text/next_text
// conditioning so each clip carries natural mid-sentence prosody.

export const NUM_MAX = 100;

export const FRAGMENT_WORDS = {
  whatis: 'What is',
  plus: 'plus',
  minus: 'minus',
  times: 'times',
  is: 'is',
  howmany: 'How many times does',
  gointo: 'go into',
  itfits: 'It fits',
  timesx: 'times!',
  writethe: 'write the',
  carrythe: 'and carry the',
  borrow: 'Time to borrow ten from the next column!',
  answeris: 'The answer is',
  thousand: 'thousand',
  hundred: 'hundred',
  // facts wave (Worlds 1–2)
  howmanydots: 'How many dots do you see?',
  whichbigger: 'Which number is bigger?',
  whichsmaller: 'Which number is smaller?',
  pluswhat: 'plus what makes',
  howmanyhundreds: 'How many hundreds?',
  howmanytens: 'How many tens?',
  howmanyones: 'How many ones?',
  whatnumber: 'What number is that altogether?',
  comesnext: 'What number comes next?',
  typeeven: 'Find the even number!',
  typeodd: 'Find the odd number!',
  // tables wave (World 4)
  howmanyrows: 'How many rows?',
  howmanyeach: 'How many in each row?',
  // fraction wave (Fraction Forest)
  outof: 'out of',
  howmanyparts: 'How many equal parts are there?',
  howmanyshaded: 'How many parts are shaded?',
  whichmore: 'Which pie shows more? Type its number!',
  samehow: 'is the same as how many out of',
  howmanywhole: 'How many whole pies can you make?',
  leftover: 'How many slices are left over?',
  // decimal wave (Decimal Docks)
  point: 'point',
  whichtensd: 'Which digit is in the tens place?',
  whichonesd: 'Which digit is in the ones place?',
  whichtenths: 'Which digit is in the tenths place?',
  whichhundredths: 'Which digit is in the hundredths place?',
  asdecimal: 'as a decimal! Type the missing digits!',
  hopq: 'Watch the decimal point hop! What number do you get?',
  // measure wave (Measure Marsh)
  howmuchmoney: 'How much money is that, in cents?',
  howmuchchange: 'How much change do you get back?',
  whathour: 'What hour does the little hand point to?',
  whatminutes: 'How many minutes does the big hand show?',
  endhour: 'What hour does it end at?',
  endminutes: 'And how many minutes?',
  whichlonger: 'Which one is longer? Type its number!',
  whichheavier: 'Which one is heavier? Type its number!',
  convertq: 'Can you convert it? Type the answer!',
  cents: 'cents',
  meters: 'meters',
  centimeters: 'centimeters',
  millimeters: 'millimeters',
  kilograms: 'kilograms',
  grams: 'grams',
  oclock: "o'clock",
  minutesw: 'minutes',
  // geometry wave (Geometry Galaxy)
  howmanysides: 'How many sides does this shape have?',
  whichsym: 'Which one folds perfectly in half? Type its number!',
  anglesq: 'How many degrees?',
  perimq: 'What is the perimeter — the distance all the way around?',
  areaq: 'What is the area? Count the little squares!',
  volq: 'How many little cubes fit inside?',
  degreesw: 'degrees',
  // rounding & stories (World 3)
  roundten: 'Which ten is it closest to?',
  roundhundred: 'Which hundred is it closest to?',
  roundthousand: 'Which thousand is it closest to?',
  storytime: 'Story time! Read it carefully — what is it really asking?',
};

// Compose clip keys that read out any whole number (used for final answers).
// Values ≤ NUM_MAX are a single natural clip; larger ones are built from
// thousands/hundreds blocks, e.g. 1047 → one, thousand, forty-seven.
export function numClips(v) {
  if (v <= NUM_MAX) return [`e-${v}`];
  const parts = [];
  const th = Math.floor(v / 1000);
  const rem = v % 1000;
  if (th) parts.push(`n-${Math.min(th, NUM_MAX)}`, 'w-thousand');
  const h = Math.floor(rem / 100);
  const r2 = rem % 100;
  if (h) parts.push(`n-${h}`, 'w-hundred');
  if (r2) parts.push(`e-${r2}`);
  return parts;
}
