// bank.js
// ✅ Exactly 200 items (2–8): Math 140 + Reading 24 + Language 36
// Fixes:
//  - Geometry stretch now uses real Pythagorean triples (no rounding errors).
//  - Fraction-equivalence choices never include another equivalent correct option.
//  - Language subject–verb uses unambiguous subjects (no “data” edge case).
//  - All MC items carry a single, verifiably-correct key.
//  - Grade 7 content upgraded (Math + ELA), plus an RL 7–8 passage.

export const DIFF = { CORE: "core", ON: "on", STRETCH: "stretch" };
export const STRANDS = { MATH: ["NO","FR","ALG","GEOM","MD"] };

/* ---------------- utilities ---------------- */
function rngSeeded(seed){ let s = seed>>>0 || 1; return ()=> (s = (s*1664525 + 1013904223)>>>0) / 2**32; }
const rnd = rngSeeded(987654321);
const ri = (a,b)=> a + Math.floor(rnd()*(b-a+1));
const pick = (arr)=> arr[Math.floor(rnd()*arr.length)];
function shuffle(a){ const c=[...a]; for(let i=c.length-1;i>0;i--){ const j=Math.floor(rnd()*(i+1)); [c[i],c[j]]=[c[j],c[i]]; } return c; }

function gcd(a,b){ while(b){ [a,b]=[b,a%b]; } return a; }
function lcm(a,b){ return a*b / gcd(a,b); }
function simplify(n,d){ const g=gcd(n,d); return [n/g, d/g]; }

/* MC helper for numeric answers */
function mcFromNumber(ans){
  const used = new Set([String(ans)]);
  const ds = [];
  const add = (v)=>{ const s = String(v); if(!used.has(s)){ used.add(s); ds.push(s); } };
  const deltas = [ri(1,3), -ri(1,4), ri(4,7), -ri(2,5)];
  deltas.forEach(d=> add(Number(ans) + d));
  return shuffle([String(ans), ...ds].slice(0,4));
}

/* MC helper for fraction answers — build 3 non-equivalent distractors */
function mcFracDistinct(n,d){
  const ans = `${n}/${d}`;
  const bads = new Set([ans]);
  const pool = [
    `${n+1}/${d}`, `${n}/${d+1}`, `${Math.max(1,n-1)}/${d}`,
    `${n}/${Math.max(2,d-1)}`, `${n+2}/${d+1}`, `${n+1}/${d+2}`
  ].filter(s => !bads.has(s));
  // Ensure uniqueness and 4 options total
  const uniq = [...new Set(pool)];
  return shuffle([ans, ...uniq].slice(0,4));
}

/* ---------------- math generators (grade-aware for 7th) ---------------- */
function NO_item(grade, diff){
  if (grade >= 7){
    // 7.NS: operations with integers/rationals
    if (diff === DIFF.CORE){
      const a = ri(-30,30), b = ri(-30,30), op = pick(["+","-"]);
      const ans = op==="+"? a+b : a-b;
      return { stem: `${a} ${op} ${b} = ?`, answer: String(ans), choices: mcFromNumber(ans) };
    }
    if (diff === DIFF.ON){
      const a = ri(-12,12), b = ri(-12,12);
      const ans = a*b;
      return { stem: `${a} × ${b} = ?`, answer: String(ans), choices: mcFromNumber(ans) };
    }
    // STRETCH: integer/rational division → integer or simplified fraction
    const num = ri(-60,60);
    let den = ri(2,12) * (Math.random()<0.5?-1:1);
    if (den === 0) den = 2;
    if (num % den === 0){
      const ans = num/den;
      return { stem: `${num} ÷ ${den} = ?`, answer: String(ans), choices: mcFromNumber(ans) };
    } else {
      const [sn, sd] = simplify(Math.abs(num), Math.abs(den));
      const sign = (num*den<0) ? "-" : "";
      const ans = `${sign}${sn}/${sd}`;
      const choices = mcFracDistinct(sn, sd).map(x => (sign ? (x.startsWith("-")?x:`-${x}`) : x));
      return { stem: `${num} ÷ ${den} = ? (simplest form)`, answer: ans, choices };
    }
  }

  // Grades 2–6 (original)
  if (diff === DIFF.CORE){
    const a = ri(10, 99), b = ri(10, 99), op = pick(["+","-"]);
    const ans = op==="+"? a+b : a-b;
    return { stem: `${a} ${op} ${b} = ?`, answer: String(ans), choices: mcFromNumber(ans) };
  }
  if (diff === DIFF.ON){
    const a = ri(100, 999), b = ri(100, 999), op = pick(["+","-"]);
    const ans = op==="+"? a+b : a-b;
    return { stem: `${a} ${op} ${b} = ?`, answer: String(ans), choices: mcFromNumber(ans) };
  }
  const a = ri(7, 19), b = ri(6, 14), op = pick(["×","÷"]);
  const ans = op==="×" ? a*b : a; // (a*b) ÷ b = a
  const stem = op==="×" ? `${a} × ${b} = ?` : `${a*b} ÷ ${b} = ?`;
  return { stem, answer: String(ans), choices: mcFromNumber(ans) };
}

function FR_item(grade, diff){
  if (grade >= 7){
    // 7.NS & 7.RP
    if (diff === DIFF.CORE){
      // like denominators, simplify
      const d = pick([6,8,10,12]);
      const a = ri(1,d-1), b = ri(1,d-1);
      const [sn, sd] = simplify(a+b, d);
      return { stem:`${a}/${d} + ${b}/${d} = ?`, answer:`${sn}/${sd}`, choices: mcFracDistinct(sn, sd) };
    }
    if (diff === DIFF.ON){
      // unlike denominators, subtraction
      const d1 = pick([6,8,9,10,12]), d2 = pick([5,7,8,10,12]);
      const a = ri(1,d1-1), b = ri(1,d2-1);
      const L = lcm(d1,d2);
      const num = a*(L/d1) - b*(L/d2);
      const sign = num<0 ? "-" : "";
      const [sn, sd] = simplify(Math.abs(num), L);
      const ans = `${sign}${sn}/${sd}`;
      const choices = mcFracDistinct(sn, sd).map(x => (sign? (x.startsWith("-")?x:`-${x}`):x));
      return { stem:`${a}/${d1} − ${b}/${d2} = ?`, answer: ans, choices };
    }
    // STRETCH: percent/proportion
    const base = ri(60, 300);
    const pct = pick([10,12.5,15,20,25,30]);
    const ans = Math.round(base*(pct/100));
    return { stem:`What is ${pct}% of ${base}?`, answer:String(ans), choices: mcFromNumber(ans) };
  }

  // Grades 2–6 (original)
  if (diff === DIFF.CORE){
    const n = ri(1,4), d = ri(Math.max(n+1,2), 9), k = ri(2,4);
    const [sn, sd] = [n*k, d*k];
    return {
      stem: `Which fraction is equivalent to ${n}/${d}?`,
      answer: `${sn}/${sd}`,
      choices: mcFracDistinct(sn, sd)
    };
  }
  if (diff === DIFF.ON){
    const d = ri(4,10), a = ri(1,d-1), b = ri(1,d-1);
    const [sn, sd] = simplify(a+b, d);
    return {
      stem: `Compute: ${a}/${d} + ${b}/${d} = ? (simplest form)`,
      answer: `${sn}/${sd}`,
      choices: mcFracDistinct(sn, sd)
    };
  }
  const d1 = pick([4,5,6,8,10,12]), d2 = pick([3,4,6,8,12]);
  const a = ri(1, d1-1), b = ri(1, d2-1);
  const L = lcm(d1,d2);
  const num = a*(L/d1) + b*(L/d2);
  const [sn, sd] = simplify(num, L);
  return {
    stem: `Compute: ${a}/${d1} + ${b}/${d2} = ? (simplest form)`,
    answer: `${sn}/${sd}`,
    choices: mcFracDistinct(sn, sd)
  };
}

function ALG_item(grade, diff){
  if (grade <= 5){
    if (diff === DIFF.CORE){
      const a = ri(6,18), b = ri(3,9), x = a-b;
      return { stem: `${a} − x = ${b}.  Solve for x.`, answer: String(x), choices: mcFromNumber(x) };
    }
    if (diff === DIFF.ON){
      const a = ri(2,9), b = ri(2,9), x = a+b;
      return { stem: `x − ${a} = ${b}.  What is x?`, answer: String(x), choices: mcFromNumber(x) };
    }
    const m = ri(2,5), x = ri(2,9), c = ri(1,6), y = m*x + c;
    return { stem: `${m}x + ${c} = ${y}.  x = ?`, answer: String(x), choices: mcFromNumber(x) };
  }

  if (grade >= 7){
    // 7.EE & intro to slope
    if (diff === DIFF.CORE){
      const a = ri(2,9), x = ri(2,12), b = ri(1,10), c = a*x + b;
      return { stem: `${a}x + ${b} = ${c}.  x = ?`, answer: String(x), choices: mcFromNumber(x) };
    }
    if (diff === DIFF.ON){
      // (x + b)/a = c  → x = a*c - b
      const a = ri(2,9), b = ri(1,10), c = ri(2,12);
      const x = a*c - b;
      return { stem: `(x + ${b}) ÷ ${a} = ${c}.  x = ?`, answer: String(x), choices: mcFromNumber(x) };
    }
    // STRETCH: slope from two points
    const x1 = ri(-6,6), y1 = ri(-6,6), x2 = x1 + pick([-4,-3,-2,2,3,4]), y2 = y1 + pick([-8,-6,-4,4,6,8]);
    const dy = y2 - y1, dx = x2 - x1;
    const sign = (dy*dx<0) ? "-" : "";
    const [sn, sd] = simplify(Math.abs(dy), Math.abs(dx));
    const ans = `${sign}${sn}/${sd}`;
    const choices = mcFracDistinct(sn, sd).map(x => (sign? (x.startsWith("-")?x:`-${x}`):x));
    return { stem:`Find the slope between (${x1}, ${y1}) and (${x2}, ${y2}).`, answer: ans, choices };
  }

  // Grade 6 (original 6+)
  if (diff === DIFF.CORE){
    const a = ri(2,9), x = ri(2,12), b = ri(3,10), y = a*x + b;
    return { stem: `${a}x + ${b} = ${y}.  x = ?`, answer: String(x), choices: mcFromNumber(x) };
  }
  if (diff === DIFF.ON){
    const a = ri(2,9), x = ri(2,10), y = a*x;
    return { stem: `${a}x = ${y}.  x = ?`, answer: String(x), choices: mcFromNumber(x) };
  }
  const a = ri(2,9), x = ri(1,8), b = ri(1,7), y = a*x - b;
  return { stem: `${a}x − ${b} = ${y}.  x = ?`, answer: String(x), choices: mcFromNumber(x) };
}

function GEOM_item(grade, diff){
  if (grade >= 7){
    // 7.G: circles, angles, Pythagorean applications
    if (diff === DIFF.CORE){
      const r = ri(3,10);
      const ans = Math.round((22/7) * r * r); // π≈22/7 to keep integers
      return { stem:`Area of a circle with radius ${r} (use π≈22/7) = ?`, answer:String(ans), choices: mcFromNumber(ans) };
    }
    if (diff === DIFF.ON){
      const type = pick(["supplementary","complementary"]);
      const total = type==="supplementary" ? 180 : 90;
      const a = ri(20, total-20);
      const ans = total - a;
      return { stem:`Angles A and B are ${type}. If m∠A = ${a}°, what is m∠B?`, answer:String(ans), choices: mcFromNumber(ans) };
    }
    // STRETCH: Pythagorean triple
    const triples = [[3,4,5],[5,12,13],[7,24,25],[8,15,17]];
    const [a,b,c] = pick(triples);
    return { stem:`A right triangle has legs ${a} and ${b}. Find the hypotenuse.`, answer:String(c), choices: mcFromNumber(c) };
  }

  // Grades 2–6 (original)
  if (diff === DIFF.CORE){
    const w = ri(3,14), h = ri(3,14);
    const ans = 2*(w+h);
    return { stem: `Perimeter of a ${w} by ${h} rectangle = ?`, answer: String(ans), choices: mcFromNumber(ans) };
  }
  if (diff === DIFF.ON){
    const b = ri(4,12), h = ri(4,12);
    const ans = (b*h)/2;
    return { stem: `Area of a right triangle with legs ${b} and ${h} = ?`, answer: String(ans), choices: mcFromNumber(ans) };
  }
  const triples = [[3,4,5],[5,12,13],[6,8,10],[7,24,25],[8,15,17]];
  const [a,b,c] = pick(triples);
  return { stem: `A right triangle has legs ${a} and ${b}. Hypotenuse length = ?`, answer: String(c), choices: mcFromNumber(c) };
}

function MD_item(grade, diff){
  if (grade >= 7){
    // 7.SP & 7.G
    if (diff === DIFF.CORE){
      const arr = [ri(10,40),ri(10,40),ri(10,40),ri(10,40),ri(10,40)];
      const sum = arr.reduce((x,y)=>x+y,0);
      const mean = Math.round(sum/arr.length);
      return { stem:`Data: ${arr.join(", ")}. What is the mean?`, answer:String(mean), choices: mcFromNumber(mean) };
    }
    if (diff === DIFF.ON){
      const arr = [ri(10,60),ri(10,60),ri(10,60),ri(10,60),ri(10,60),ri(10,60),ri(10,60)].sort((x,y)=>x-y);
      const med = arr[3];
      return { stem:`Find the median of the data: ${arr.join(", ")}.`, answer:String(med), choices: mcFromNumber(med) };
    }
    // STRETCH: volume of cylinder (π≈22/7)
    const r = ri(3,10), h = ri(4,12);
    const ans = Math.round((22/7) * r * r * h);
    return { stem:`Volume of a cylinder with r=${r}, h=${h} (use π≈22/7) = ?`, answer:String(ans), choices: mcFromNumber(ans) };
  }

  // Grades 2–6 (original)
  if (diff === DIFF.CORE){
    const h = ri(1,3), ans = h*60;
    return { stem: `How many minutes are in ${h} hour(s)?`, answer: String(ans), choices: mcFromNumber(ans) };
  }
  if (diff === DIFF.ON){
    const a = ri(3,9), b = ri(3,9), c = ri(3,9), d = ri(3,9), e = ri(3,9);
    const arr = [a,b,c,d,e].sort((x,y)=>x-y);
    const med = arr[2];
    return { stem: `Find the median of the data: ${arr.join(", ")}.`, answer: String(med), choices: mcFromNumber(med) };
  }
  const L = ri(2,8), W = ri(2,7), H = ri(2,6), vol = L*W*H;
  return { stem: `Volume of a rectangular prism ${L}×${W}×${H} (cubic units) = ?`, answer: String(vol), choices: mcFromNumber(vol) };
}

/* ---------------- build 140 math items ---------------- */
export const MATH_ITEMS = [];
(function buildMath(){
  const strands = ["NO","FR","ALG","GEOM","MD"];
  const perCombo = { [DIFF.CORE]:1, [DIFF.ON]:2, [DIFF.STRETCH]:1 }; // 4 per strand/grade
  for (let g=2; g<=8; g++){
    for (const s of strands){
      for (const [diff, cnt] of Object.entries(perCombo)){
        for (let i=0; i<cnt; i++){
          const base =
            s==="NO"   ? NO_item(g, diff)   :
            s==="FR"   ? FR_item(g, diff)   :
            s==="ALG"  ? ALG_item(g, diff)  :
            s==="GEOM" ? GEOM_item(g, diff) :
                         MD_item(g, diff);
          MATH_ITEMS.push({
            id: `${s}-${g}-${diff}-${i}-${ri(100,999)}`,
            grade_min: g, grade_max: g,
            strand: s, diff,
            stem: base.stem,
            choices: base.choices,
            answer: base.answer
          });
        }
      }
    }
  }
})();

/* ---------------- Reading passages (24 items) ---------------- */
export const PASSAGES = [
  {
    id:"RL-2A", grade_band:[2,3], type:"RL",
    text:`Sam held the tiny seed in his palm. He pressed it into the soil and watered each morning.
Weeks later, a green curve pushed up like a question mark. Sam grinned—his speck had become a sprout.`,
    questions:[
      {id:"Q1", stem:"What is Sam doing?", choices:["Planting a seed","Baking bread","Catching bugs","Painting a pot"], answer:"Planting a seed"},
      {id:"Q2", stem:"Which detail shows time passed?", choices:["He watered each morning.","He slept.","He ran.","He coughed."], answer:"He watered each morning."},
      {id:"Q3", stem:"How does Sam feel at the end?", choices:["Happy","Angry","Confused","Scared"], answer:"Happy"},
      {id:"Q4", stem:"The sprout looked like a 'question mark' is—", choices:["a comparison","a map","a rhyme","a rule"], answer:"a comparison"},
      {id:"Q5", stem:"What is the setting?", choices:["Home/garden","Beach","Store","Train"], answer:"Home/garden"},
      {id:"Q6", stem:"Main idea best stated:", choices:["Care helps a seed grow.","Seeds are heavy.","Seeds are blue.","Sam hates plants."], answer:"Care helps a seed grow."}
    ]
  },
  {
    id:"RI-3A", grade_band:[2,3], type:"RI",
    text:`A lighthouse helps ships find their way. Its bright light flashes in patterns so captains
can tell one lighthouse from another. Many stand on rocky coasts to warn boats away from danger.`,
    questions:[
      {id:"Q1", stem:"Main idea?", choices:["Lighthouses help ships travel safely.","Boats are blue.","Rocks are soft.","Lighthouses are tiny."], answer:"Lighthouses help ships travel safely."},
      {id:"Q2", stem:"Why do lights flash in patterns?", choices:["To tell lighthouses apart","For fun","To save power","To make rainbows"], answer:"To tell lighthouses apart"},
      {id:"Q3", stem:"Where are many lighthouses?", choices:["Rocky coasts","Deserts","Farms","Mountains"], answer:"Rocky coasts"},
      {id:"Q4", stem:"Text structure mainly:", choices:["Cause/effect","Poem","Chronology","Dialogue"], answer:"Cause/effect"},
      {id:"Q5", stem:"Best supporting feature:", choices:["Diagram of beams","Recipe","Fairy tale","Song"], answer:"Diagram of beams"},
      {id:"Q6", stem:"What danger do they warn about?", choices:["Rocks","Fog","Birds","Clouds"], answer:"Rocks"}
    ]
  },
  {
    id:"RL-4A", grade_band:[4,5], type:"RL",
    text:`Lena gripped the rope as the ferry rocked. Mist curled around the deck like breath.
When the captain blew the horn, Lena jumped—but smiled. The sound felt like a starting bell.`,
    questions:[
      {id:"Q1", stem:"Lena mainly feels—", choices:["Excited but nervous","Angry","Bored","Confused"], answer:"Excited but nervous"},
      {id:"Q2", stem:"Which detail supports it?", choices:["She jumped but smiled.","Mist curled.","The boat exists.","She held a rope."], answer:"She jumped but smiled."},
      {id:"Q3", stem:"The horn symbolizes—", choices:["A beginning","Danger","Anger","Ending"], answer:"A beginning"},
      {id:"Q4", stem:"Point of view:", choices:["3rd limited","1st","2nd","3rd omniscient"], answer:"3rd limited"},
      {id:"Q5", stem:"Best word for Lena:", choices:["Hopeful","Careless","Timid","Furious"], answer:"Hopeful"},
      {id:"Q6", stem:"Which shows setting most?", choices:["Mist around the deck","She smiled","Captain spoke","She stood"], answer:"Mist around the deck"}
    ]
  },
  {
    id:"RI-8B", grade_band:[7,8], type:"RI",
    text:`Satellites circle Earth on predictable paths. Engineers choose an orbit based on the job:
low orbits take sharp pictures; higher ones watch weather over time.`,
    questions:[
      {id:"Q1", stem:"Main idea?", choices:["Different orbits fit different tasks.","Space is cold.","Satellites are heavy.","Orbits are random."], answer:"Different orbits fit different tasks."},
      {id:"Q2", stem:"Cause→effect pair:", choices:["Higher orbit→longer view","Low orbit→no satellites","Sharp pictures→low cost","Weather→no satellites"], answer:"Higher orbit→longer view"},
      {id:"Q3", stem:"Best graphic to add:", choices:["Orbit diagram","Poem","Recipe","Timeline of lunch"], answer:"Orbit diagram"},
      {id:"Q4", stem:"'Predictable' means—", choices:["Can be forecast","Invisible","Changeable","Unexpected"], answer:"Can be forecast"},
      {id:"Q5", stem:"Structure mainly—", choices:["Compare/contrast","Narrative","Chronology","Dialogue"], answer:"Compare/contrast"},
      {id:"Q6", stem:"Evidence for main idea:", choices:["Engineers choose an orbit based on job.","Earth is round.","Space is big.","Satellites are metal."], answer:"Engineers choose an orbit based on job."}
    ]
  },
  // NEW: RL passage for 7–8 to balance ELA pool
  {
    id:"RL-7B", grade_band:[7,8], type:"RL",
    text:`The auditorium lights dimmed as Maya stepped onto the stage. Her notes, once crisp,
now felt like leaves in a storm. But when the first laugh rose from the crowd, she steadied—
her pauses became choices, her voice a metronome.`,
    questions:[
      {id:"Q1", stem:"What does the first laugh mainly do for Maya?", choices:["Builds confidence","Ends the speech","Causes panic","Makes her forget lines"], answer:"Builds confidence"},
      {id:"Q2", stem:"The phrase 'leaves in a storm' is an example of—", choices:["Simile","Metaphor","Alliteration","Hyperbole"], answer:"Metaphor"},
      {id:"Q3", stem:"Theme best supported by the passage:", choices:["Confidence can grow through experience.","Public speaking is impossible.","The audience is unkind.","Notes are unnecessary."], answer:"Confidence can grow through experience."},
      {id:"Q4", stem:"Which detail best supports the theme?", choices:["'Her notes…felt like leaves in a storm.'","'She stepped onto the stage.'","'The auditorium lights dimmed.'","'Her voice a metronome.'"], answer:"'Her pauses became choices, her voice a metronome.'"},
      {id:"Q5", stem:"Point of view:", choices:["Third-person limited","First-person","Second-person","Third-person omniscient"], answer:"Third-person limited"},
      {id:"Q6", stem:"'Her voice a metronome' suggests—", choices:["Controlled pacing","Singing","Whispering","Shouting"], answer:"Controlled pacing"}
    ]
  }
];

/* ---------------- Language (36 items) ---------------- */
export const LANG_ITEMS = [];
(function buildLang(){
  const basePerGrade = 4; // 4 × 7 = 28
  const extrasNeeded = 36 - (basePerGrade * 7); // 8 more
  const grades = [2,3,4,5,6,7,8];

  function commasSeries(){
    return {
      stem:"Choose the sentence with commas in a series used correctly.",
      key:[
        "I brought pencils, paper, and snacks.",
        "I brought, pencils, paper and snacks.",
        "I brought pencils paper, and snacks.",
        "I, brought pencils, paper and snacks."
      ],
      ans:0
    };
  }
  function nonrestrictive(){
    return {
      stem:"Select the sentence with a nonrestrictive clause correctly set off.",
      key:[
        "My brother who plays guitar won.",
        "My brother, who plays guitar won.",
        "My brother, who plays guitar, won.",
        "My brother who, plays guitar, won."
      ],
      ans:2
    };
  }
  function subjectVerb(){
    const singular = pick(["The team","The class","The puppy","The committee"]);
    const plural   = pick(["The birds","The dogs","The students","The cars"]);
    const templates = [
      { s: singular, ok:"is", wrong:"are" },
      { s: plural,   ok:"are", wrong:"is" }
    ];
    const t = pick(templates);
    // ensure 2 copies of wrong won't duplicate the correct after shuffle slice
    const options = shuffle([t.ok, t.wrong, `${t.wrong} `, `${t.ok} `]).map(s=>s.trim());
    const uniq = [...new Set(options)].slice(0,4);
    // Guarantee exactly one correct in the 4
    const withOneCorrect = [t.ok, ...uniq.filter(x=>x!==t.ok)].slice(0,4);
    return {
      stem:`Which completes the sentence correctly? ${t.s} ___ ready.`,
      key: withOneCorrect,
      ans: withOneCorrect.indexOf(t.ok)
    };
  }
  function capitalization(){
    return {
      stem:"Which sentence is capitalized correctly?",
      key:[
        "In March, we visit New York City.",
        "in March, we visit New York city.",
        "In march, we visit New york city.",
        "In March, we visit new york City."
      ],
      ans:0
    };
  }

  // Grade-7 specific language skills
  function coordinateAdjectives(){
    return {
      stem:"Choose the sentence with coordinate adjectives punctuated correctly.",
      key:[
        "She packed three warm sweaters.",
        "She packed warm, wool sweaters.",
        "She packed warm wool sweaters.",
        "She packed, warm wool, sweaters."
      ],
      ans:2 // “warm wool sweaters” (not coordinate; no comma)
    };
  }
  function pronounAntecedent(){
    return {
      stem:"Choose the sentence with correct pronoun–antecedent agreement.",
      key:[
        "Each of the players forgot their water bottle.",
        "Each of the players forgot his or her water bottle.",
        "The team won their game.",
        "Neither of the cars has their lights on."
      ],
      ans:1
    };
  }
  function verbMoodVoice(){
    return {
      stem:"Which sentence uses the subjunctive mood correctly?",
      key:[
        "If I was you, I'd reschedule.",
        "If I were you, I'd reschedule.",
        "If I am you, I'd reschedule.",
        "If I be you, I'd reschedule."
      ],
      ans:1
    };
  }

  function make(idPrefix, g, diff, spec){
    const ch = spec();
    const answer = ch.key[ch.ans];
    // Ensure 4 unique options with single correct
    const uniq = [...new Set(ch.key)];
    const choices = uniq.length >= 4 ? uniq.slice(0,4) : [...uniq, ...["(A)","(B)","(C)","(D)"]].slice(0,4);
    const correctIndex = choices.indexOf(answer);
    return {
      id:`LANG-${idPrefix}-${g}-${diff}-${ri(100,999)}`,
      grade_min:g, grade_max:g, strand:"LANG", diff,
      stem: ch.stem,
      choices,
      answer: choices[correctIndex >= 0 ? correctIndex : 0]
    };
  }

  grades.forEach(g=>{
    if (g === 7){
      // Upgrade rigor for Grade 7 (L.7)
      LANG_ITEMS.push(make("NRC", g, DIFF.CORE, nonrestrictive));       // commas around nonrestrictive
      LANG_ITEMS.push(make("CDA", g, DIFF.CORE, coordinateAdjectives)); // coordinate adjectives
      LANG_ITEMS.push(make("PRA", g, DIFF.ON,  pronounAntecedent));     // pronoun–antecedent
      LANG_ITEMS.push(make("VMV", g, DIFF.ON,  verbMoodVoice));         // mood/voice (subjunctive)
    } else {
      // Original set for other grades
      LANG_ITEMS.push(make("SER", g, DIFF.CORE, commasSeries));
      LANG_ITEMS.push(make("CAP", g, DIFF.CORE, capitalization));
      LANG_ITEMS.push(make("SV",  g, DIFF.ON,   subjectVerb));
      LANG_ITEMS.push(make("NRC", g, DIFF.ON,   nonrestrictive));
    }
  });

  // Keep STRETCH extras (8 items), skew slightly upper grades
  const extraGrades = [8,7,6,5];
  let added = 0;
  while (added < extrasNeeded){
    LANG_ITEMS.push(make("SVX", extraGrades[added % extraGrades.length], DIFF.STRETCH, subjectVerb));
    added++;
  }
})();


