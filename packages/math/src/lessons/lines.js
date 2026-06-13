// All lesson narration, as plain text keyed by clip id. Plain JS (no JSX/React) so the
// node gen-voice script AND the app can both import it. gen-voice renders every line here
// with the SLOW/warm teaching voice profile. Beat modules set each beat's caption from
// LESSON_LINES[say], so the spoken line and the on-screen caption never drift.
// `lc-1..lc-5` are shared count words reused across counting-type lessons.

export const LESSON_LINES = {
  // ── shared count words ──
  'lc-1': 'One.',
  'lc-2': 'Two.',
  'lc-3': 'Three.',
  'lc-4': 'Four.',
  'lc-5': 'Five!',

  // ── Counting ──
  'lcount-intro': "Counting is how we find out how many. Let's count these apples together!",
  'lcount-howmany': 'The last number we say tells us how many. There are five apples!',
  'lcount-again': "Let's try again. Count these stars.",
  'lcount-three': 'Three stars! Count each one, and the last number is how many.',
  'lcount-star': "You're a counting star! Tap Play and count some yourself.",

  // ── Compare (Bigger or Smaller) ──
  'lcmp-1': "Sometimes we want to know which group has more. Let's compare two plates of cookies!",
  'lcmp-2': 'This plate has three cookies. This one has five.',
  'lcmp-3': 'Five is more than three — see how this side is taller?',
  'lcmp-4': 'We show it with this sign. Think of it as a hungry mouth that always opens to eat the bigger number. Chomp!',
  'lcmp-5': 'So three is less than five.',
  'lcmp-6': 'What if both sides are the same? Here are four and four.',
  'lcmp-7': 'When they match, we use the equals sign.',
  'lcmp-8': "And here, six is more than two, so the mouth opens the other way.",
  'lcmp-9': 'Remember: the open mouth always points at the bigger number. Now you try!',

  // ── Friends of 10 (number bonds) ──
  'lbnd-1': 'Friends of ten are two numbers that add up to exactly ten. Here is a ten-frame — ten little boxes.',
  'lbnd-2': "Let's drop in six counters.",
  'lbnd-3': 'Now count the empty boxes: one, two, three, four. Four are left!',
  'lbnd-4': 'Six and four make ten. They are friends of ten!',
  'lbnd-5': "Let's find another pair. This time we put in seven.",
  'lbnd-6': 'Three empty boxes. So seven and three make ten too.',
  'lbnd-7': 'One more — just two counters.',
  'lbnd-8': 'Eight empty boxes. Two and eight are friends of ten!',
  'lbnd-9': 'Every pair that fills the whole frame is a friend of ten. Now you try!',

  // ── Adding to 20 ──
  'ladd-1': 'Adding means putting groups together to find how many there are in all.',
  'ladd-2': 'Four blocks and three blocks, pushed together, make seven.',
  'ladd-3': "Let's try a bigger one: eight blocks and five blocks.",
  'ladd-4': 'Altogether that is thirteen.',
  'ladd-5': 'There is another way — counting on. Start at nine and hop up four.',
  'ladd-6': 'Ten, eleven, twelve, thirteen. Nine plus four is thirteen!',
  'ladd-7': 'Put together, or count on — both find the total. Your turn!',

  // ── Taking Away (subtraction) ──
  'lsub-1': 'Subtracting means taking some away and seeing what is left.',
  'lsub-2': 'Eight blocks, take away three, and five are left.',
  'lsub-3': 'Another one: ten blocks, take away four.',
  'lsub-4': 'Six are left. Ten minus four is six.',
  'lsub-5': 'We can also hop backward. Start at twelve and hop back five.',
  'lsub-6': 'Eleven, ten, nine, eight, seven. Twelve minus five is seven!',
  'lsub-7': 'Take away, or hop back — both show what is left. You try!',

  // ── Tens & Ones (place value) ──
  'lpv-1': "Big numbers are built from tens and ones. Let's build twenty-three.",
  'lpv-2': 'Two tall ten-rods make twenty, and three little ones make three.',
  'lpv-3': "Two tens and three ones — that's twenty-three!",
  'lpv-4': "Let's build forty. Four ten-rods, and no ones at all.",
  'lpv-5': 'Four tens is forty.',
  'lpv-6': 'And the number seven is just seven ones — no tens yet.',
  'lpv-7': 'The left digit counts the tens, the right digit counts the ones. Now you try!',

  // ── Hundreds ──
  'lhun-1': 'When we gather ten ten-rods together, they bundle into one hundred.',
  'lhun-2': 'Big numbers have three places: hundreds, tens, and ones. Here is three hundred forty-five.',
  'lhun-3': 'The three means three hundreds, the four means four tens, and the five means five ones.',
  'lhun-4': 'Three hundred, plus forty, plus five, makes three hundred forty-five.',
  'lhun-5': 'Now read two hundred eight. Two hundreds, zero tens, and eight ones. The zero holds the tens place open.',
  'lhun-6': 'Each place is ten times bigger than the one to its right. Now you try!',

  // ── Skip Counting ──
  'lskip-1': "Skip counting means hopping by the same amount each time. Let's hop by fives.",
  'lskip-2': 'Five, ten, fifteen, twenty! Much faster than counting by ones.',
  'lskip-3': 'Now we hop by twos.',
  'lskip-4': 'Two, four, six, eight, ten.',
  'lskip-5': 'And by tens — the longest hops of all.',
  'lskip-6': 'Ten, twenty, thirty, forty, fifty!',
  'lskip-7': 'Skip counting helps you count fast — and it gets you ready for times tables. You try!',

  // ── Even or Odd ──
  'leo-1': 'A number is even if it splits into perfect pairs, with none left over.',
  'leo-2': 'Eight splits into four pairs — even!',
  'leo-3': 'But seven leaves one little dot all alone.',
  'leo-4': 'Seven is odd — one left over.',
  'leo-5': 'Six makes three pairs with none left — so six is even.',
  'leo-6': 'A quick trick: even numbers end in 0, 2, 4, 6, or 8. Odd ones end in 1, 3, 5, 7, or 9. You try!',

  // ── Long Addition (column method + carry) ──
  'lla-1': 'For bigger numbers, we stack them — ones under ones, tens under tens.',
  'lla-2': 'Always start on the right, with the ones. Four plus two is six.',
  'lla-3': 'Then the tens. Three plus one is four.',
  'lla-4': 'Thirty-four plus twelve is forty-six!',
  'lla-5': "Now, what if the ones add up to ten or more? Let's try twenty-seven plus forty-eight.",
  'lla-6': "Seven plus eight is fifteen. Fifteen is too big for one box, so we write the five and carry the one ten up to the tens column.",
  'lla-7': 'Now the tens: the carried one, plus two, plus four, makes seven.',
  'lla-8': 'Twenty-seven plus forty-eight is seventy-five!',
  'lla-9': 'Line up the digits, add each column, and carry whenever you reach ten. You try!',

  // ── Long Subtraction (column method + borrow) ──
  'lls-1': 'We stack subtraction the same way — ones under ones — and start on the right.',
  'lls-2': 'Eight minus three is five.',
  'lls-3': 'Then the tens: four minus two is two.',
  'lls-4': 'Forty-eight minus twenty-three is twenty-five.',
  'lls-5': "Sometimes the top digit is too small. Try fifty-two minus twenty-seven.",
  'lls-6': "Two minus seven? We can't do that, so we borrow. We take one ten from the five, so it becomes four, and the two ones become twelve.",
  'lls-7': 'Now twelve minus seven is five.',
  'lls-8': 'And four minus two is two.',
  'lls-9': 'Fifty-two minus twenty-seven is twenty-five! Borrow whenever the top digit is too small. You try!',

  // ── Rounding ──
  'lrnd-1': 'A round number ends in zero — like ten, twenty, thirty. They are nice and tidy to work with.',
  'lrnd-2': "Rounding finds the nearest round number. Is forty-seven closer to forty, or to fifty?",
  'lrnd-3': 'Forty-seven is past the middle, so it rounds up to fifty.',
  'lrnd-4': 'Now forty-three. It sits below the middle, so it rounds down to forty.',
  'lrnd-5': 'And exactly halfway, like forty-five? The rule is: halfway always rounds up — to fifty.',
  'lrnd-6': 'Look at the ones digit: five or more rounds up, less than five rounds down. You try!',

  // ── Story Problems ──
  'lwp-1': 'Story problems hide math inside words. Maya has three apples.',
  'lwp-2': 'She gets five more.',
  'lwp-3': 'How many apples does she have now?',
  'lwp-4': "The word 'more' tells us to add. So we add three and five.",
  'lwp-5': 'Three plus five is eight apples!',
  'lwp-6': 'Here is a different one. Sam had eight stickers.',
  'lwp-7': 'He gave away three.',
  'lwp-8': 'How many stickers are left?',
  'lwp-9': "'Gave away' and 'left' tell us to subtract. Eight minus three is five.",
  'lwp-10': 'Read slowly, find the numbers, and look for the action word. You try!',

  // ── Groups & Arrays (multiply concept) ──
  'lmul-1': 'Multiplying is a fast way to add equal groups. Here are three groups of four.',
  'lmul-2': "Four plus four plus four is twelve. That's the same as three times four.",
  'lmul-3': 'We can line the same dots up in a neat rectangle — three rows of four.',
  'lmul-4': 'Three rows of four is twelve. Rows times columns!',
  'lmul-5': 'Multiplying just counts equal groups really fast. What is two times five?',
  'lmul-6': 'Two groups of five is ten.',
  'lmul-7': 'Equal groups, or a rectangle — both show what times means. You try!',

  // ── Tables 2, 5, 10 (what a times table is) ──
  'ltt-1': "A times table is just the list of answers for one number. Don't worry — it looks big, but it's really your friend.",
  'ltt-2': 'Here is the five times table. The answers are just skip counting by five: five, ten, fifteen,',
  'ltt-3': 'twenty, twenty-five, and all the way up to fifty.',
  'ltt-4': 'The two times table is simply doubling: two, four, six, eight.',
  'ltt-5': 'Tens are the easiest of all — just add a zero. Ten, twenty, thirty.',
  'ltt-6': 'And the very biggest fact, ten times ten, is one hundred.',
  'ltt-7': "You'll learn these by heart, and then big multiplying becomes easy. You try!",

  // ── Tables 3, 4, 6 (doubling tricks) ──
  'lt36-1': 'The threes, fours, and sixes each have a handy trick. Let me show you.',
  'lt36-2': 'Threes are skip counting by three: three, six, nine, twelve.',
  'lt36-3': 'Fours are double-doubles — double the number, then double again. Six, twelve, twenty-four.',
  'lt36-4': 'And sixes are just double the threes! Three fours are twelve, so six fours are twenty-four.',
  'lt36-5': 'Skip count for threes, double-double for fours, and double the threes for sixes. You try!',

  // ── Tables 7, 8, 9 (the tricky ones) ──
  'lt79-1': 'Sevens, eights, and nines feel tricky — but they hide some cool tricks.',
  'lt79-2': "The nine times table is magic: every answer's two digits add up to nine. Eighteen — one plus eight is nine!",
  'lt79-3': "Here's the other nine trick: the tens digit is always one less than the number you times by. Nine fours — the four drops to three, so thirty-six.",
  'lt79-4': 'Eights are double the fours. And you already know lots of sevens — seven times two is just the twos table!',
  'lt79-5': 'Use the nine tricks, double the fours for eights, and remember you already know half your sevens. You try!',

  // ── Division Facts ──
  'ldiv-1': 'Dividing means splitting into equal groups. Twelve cookies shared among three friends.',
  'ldiv-2': 'Each friend gets four. Twelve divided by three is four.',
  'ldiv-3': 'Division is the opposite of multiplying. Three times four is twelve, so twelve divided by three is four.',
  'ldiv-4': 'That means your times tables help you divide! What is fifteen divided by five?',
  'ldiv-5': 'Five groups of three — so fifteen divided by five is three.',
  'ldiv-6': 'To divide, just ask: what number times the divisor gives this? You try!',

  // ── Long Multiplication × 1 digit (column method) ──
  'llm-1': "To multiply a big number, we go column by column. Let's do twenty-three times four.",
  'llm-2': 'Start with the ones: four times three is twelve. Write the two, carry the one.',
  'llm-3': 'Now the tens: four times two is eight, plus the carried one makes nine.',
  'llm-4': 'Twenty-three times four is ninety-two!',
  'llm-5': 'Always multiply the ones first, then the tens, carrying when you go over nine. You try!',

  // ── Long Multiplication × 2 digits (partial products) ──
  'llm2-1': "For two big numbers, we split the job in two. Let's do twenty-three times fourteen.",
  'llm2-2': 'Fourteen is ten and four. First multiply by the four: twenty-three times four is ninety-two.',
  'llm2-3': 'Then multiply by the ten: twenty-three times ten is two hundred thirty.',
  'llm2-4': 'Last, add the two parts together: ninety-two plus two hundred thirty.',
  'llm2-5': 'Twenty-three times fourteen is three hundred twenty-two! Split, multiply each part, then add. You try!',

  // ── Long Division (Divide, Multiply, Subtract, Bring down) ──
  'lld-1': "Long division shares a big number step by step. Let's do eighty-four divided by four.",
  'lld-2': 'Divide: how many fours fit in eight? Two. We write the two up on top.',
  'lld-3': 'Multiply: two times four is eight, and we write it underneath.',
  'lld-4': 'Subtract: eight minus eight is zero. Then bring down the next digit, the four.',
  'lld-5': 'Divide again: how many fours fit in four? One. Write it on top.',
  'lld-6': 'Multiply one by four, subtract, and nothing is left. Eighty-four divided by four is twenty-one!',
  'lld-7': 'Just repeat the steps: Divide, Multiply, Subtract, Bring down. You try!',

  // ── What is a Fraction? ──
  'lfr-1': 'A fraction is a piece of a whole. Imagine cutting a pizza into four equal slices.',
  'lfr-2': 'Now take three of those four slices — that is three-quarters.',
  'lfr-3': 'The bottom number, four, says how many equal parts. The top number, three, says how many we have.',
  'lfr-4': 'Here is one-half — just one of two equal parts.',
  'lfr-5': 'Bottom tells the equal parts, top tells how many you have. You try!',

  // ── Equivalent Fractions ──
  'leq-1': 'Equivalent fractions look different but are exactly the same amount. Watch one-half.',
  'leq-2': 'Slice each half into two — now it reads two-quarters, but the shaded part is the same!',
  'leq-3': 'The trick is to multiply the top and the bottom by the same number.',
  'leq-4': 'One-third becomes two-sixths the very same way.',
  'leq-5': 'Multiply top and bottom by the same number and the value never changes. You try!',

  // ── Compare Fractions ──
  'lcf-1': 'To compare fractions, picture the pieces. Which is bigger: one-half or one-third?',
  'lcf-2': 'Same one slice, but halves are bigger than thirds — so one-half is more.',
  'lcf-3': 'When the bottoms match, just compare the tops. Three-fifths beats two-fifths.',
  'lcf-4': 'Bigger pieces, or more pieces — picture it. You try!',

  // ── Add Fractions ──
  'laf-1': 'To add fractions with the same bottom, we just add the tops. One-quarter plus two-quarters.',
  'laf-2': 'One piece plus two pieces is three pieces — three-quarters. The bottom stays the same!',
  'laf-3': 'Another one: two-fifths plus one-fifth makes three-fifths.',
  'laf-4': 'What if the bottoms are different, like one-half plus one-quarter? First we make them match.',
  'laf-5': 'Change one-half into two-quarters. Now two-quarters plus one-quarter is three-quarters.',
  'laf-6': 'Same bottoms: add the tops. Different bottoms: make them match first. You try!',

  // ── Mixed Numbers ──
  'lmx-1': 'A mixed number is a whole number and a fraction together — like one and a half.',
  'lmx-2': 'One whole, plus one-half of another, makes one and a half.',
  'lmx-3': 'Two and three-quarters means two whole ones and three-quarter slices.',
  'lmx-4': 'A whole number sitting next to a fraction — that is a mixed number. You try!',

  // ── Fraction × Whole ──
  'lmw-1': 'Multiplying a fraction by a whole number is just repeated adding. Three times one-quarter.',
  'lmw-2': 'One-quarter, plus one-quarter, plus one-quarter — that is three-quarters.',
  'lmw-3': 'So three times one-quarter is three-quarters. Just multiply the top by the whole number.',
  'lmw-4': 'Multiply the top by the whole number and keep the bottom. You try!',

  // ── Decimal Places ──
  'ldp-1': 'A decimal shows a part smaller than one. The point separates the whole from the part.',
  'ldp-2': 'This whole square is split into a hundred. Three shaded columns are three tenths — zero point three.',
  'ldp-3': 'Each tiny square is one hundredth. Forty-five squares is zero point four five.',
  'ldp-4': 'Decimals and fractions name the same part two ways. Zero point five is the same as one-half.',
  'ldp-5': 'The first place after the point is tenths, the next is hundredths. You try!',

  // ── Compare Decimals ──
  'lcd-1': 'To compare decimals, line up the points and look place by place. Which is bigger: zero point five, or zero point four five?',
  'lcd-2': "Five tenths fills more than forty-five hundredths, so zero point five wins. Don't be fooled by extra digits!",
  'lcd-3': 'Compare the tenths first, then the hundredths. You try!',

  // ── Add Decimals ──
  'lad-1': 'To add decimals, line up the decimal points so tenths sit under tenths. One point two plus three point four.',
  'lad-2': 'Then add just like whole numbers. One point two plus three point four is four point six.',
  'lad-3': 'Line up the points, then add. You try!',

  // ── × and ÷ by 10, 100 ──
  'lpw-1': 'Multiplying by ten makes a number ten times bigger — the point hops one place to the right.',
  'lpw-2': 'So three point four times ten becomes thirty-four.',
  'lpw-3': 'Dividing by ten makes it ten times smaller — the point hops to the left.',
  'lpw-4': 'Times ten hops right, divide by ten hops left. By a hundred, hop twice! You try!',

  // ── Money & Change ──
  'lmo-1': "Money is counted in cents. Let's add up coins, starting with the biggest.",
  'lmo-2': "A quarter is twenty-five cents, plus a dime is ten more — thirty-five cents.",
  'lmo-3': 'Add a nickel and three pennies to keep counting up.',
  'lmo-4': 'Start with the biggest coins and count up. You try!',

  // ── Telling Time ──
  'lti-1': 'A clock has two hands. The short hand points to the hour, the long hand to the minutes.',
  'lti-2': 'Short hand on three, long hand straight up on twelve — that is three o-clock.',
  'lti-3': 'When the long hand points straight down at the six, it is half past.',
  'lti-4': 'Short hand is the hour, long hand is the minutes. You try!',

  // ── Elapsed Time ──
  'lel-1': 'Elapsed time is how long something takes — from a start time to an end time.',
  'lel-2': 'From two o-clock, count on one hour to three, then thirty more minutes — one and a half hours.',
  'lel-3': 'Count on from the start time to the end time. You try!',

  // ── Length & Weight / Conversions ──
  'lun-1': 'We measure with units, and we pick the right size. One meter is a hundred centimeters.',
  'lun-2': 'So two meters is two hundred centimeters.',
  'lun-3': 'To change a big unit into a small one, we multiply. One kilogram is a thousand grams.',
  'lun-4': 'Big unit to small unit: multiply. You try!',

  // ── Name the Shapes ──
  'lsh-1': 'Shapes are named by how many sides they have. Count the sides!',
  'lsh-2': 'Three sides make a triangle.',
  'lsh-3': 'Four equal sides make a square.',
  'lsh-4': 'Five sides make a pentagon.',
  'lsh-5': 'Count the sides to name the shape. You try!',

  // ── Symmetry ──
  'lsy-1': 'A shape has symmetry if you can fold it so both halves match exactly.',
  'lsy-2': 'Fold the butterfly down the middle — the wings line up perfectly. That fold is a line of symmetry.',
  'lsy-3': 'A heart is symmetric too — its two halves match.',
  'lsy-4': 'If the halves match across a fold, the shape is symmetric. You try!',

  // ── Angles ──
  'lan-1': 'An angle measures how far something turns, in degrees.',
  'lan-2': 'A square corner is a right angle — exactly ninety degrees.',
  'lan-3': 'A smaller turn, less than a corner, is an acute angle.',
  'lan-4': 'A bigger turn, more than a corner, is an obtuse angle.',
  'lan-5': 'Right is ninety, acute is smaller, obtuse is bigger. You try!',

  // ── Perimeter ──
  'lpe-1': 'Perimeter is the distance all the way around a shape. Walk along every edge.',
  'lpe-2': 'Add the four sides: three plus two plus three plus two is ten.',
  'lpe-3': 'Add up all the sides to find the perimeter. You try!',

  // ── Area ──
  'lar-1': 'Area is how much space fits inside a shape. Count the unit squares.',
  'lar-2': 'Three columns and two rows make six squares. Area is rows times columns.',
  'lar-3': 'Multiply the rows by the columns to find area. You try!',

  // ── Volume ──
  'lvo-1': 'Volume is how much space a solid fills. Count the unit cubes.',
  'lvo-2': 'Each layer has six cubes, and there are two layers — twelve cubes in all.',
  'lvo-3': 'Cubes in one layer, times the number of layers, gives the volume. You try!',
};
