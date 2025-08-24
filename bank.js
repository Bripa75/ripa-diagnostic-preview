// bank.js
// ✅ Exactly 200 items total across grades 2–8.
//   - Math: 140 generated items (5 strands × 7 grades × 4 each)
//   - Reading: 4 passages × 6 Q = 24 items total
//   - Language: 36 generated grammar/conventions items
//
// Items include: { id, grade_min, grade_max, strand, diff, stem, choices, answer }
// Math items are all multiple-choice (with algorithmic distractors) to keep UI consistent.

export const DIFF = { CORE: "core", ON: "on", STRETCH: "stretch" };
export const STRANDS = { MATH: ["NO","FR","ALG","GEOM","MD"] };

// ---------- utilities ----------
function rngSeeded(seed){ let s = seed>>>0 || 1; return ()=> (s = (s*1664525 + 1013904223)>>>0) / 2**32; }
const rnd = rngSeeded(987654321);
const ri = (a,b)=> a + Math.floor(rnd()*(b-a+1));
const pick = (arr)=> arr[Math.floor(rnd()*arr.length)];
function shuffle(a){ const c=[...a]; for(let i=c.length-1;i>0;i--){ const j=Math.floor(rnd()*(i+1)); [c[i],c[j]]=[c[j],c[i]]; } return c; }

// numeric & fraction helpers
function mcFromNumber(ans){
  const used = new Set([ans]);
  const ds = [];
  const deltas = [ri(1,3), ri(2,5), -ri(1,4), ri(6,9)];
  deltas.forEach(d=>{
    const v = ans + d;
    if(!used.has(v)){ used.add(v); ds.push(v); }
  });
  const opts = shuffle([ans, ...ds].slice(0,4)).map(v=> String(v));
  return opts;
}
function mcFromFraction(n,d){
  const ans = `${n}/${d}`;
  const used = new Set([ans]);
  const cands = [
    `${n+1}/${d}`, `${n}/${d+1}`, `${n-1}/${d}`, `${n*2}/${d*2}`
  ].filter(s=> !used.has(s));
  const opts = shuffle([ans, ...cands].slice(0,4));
  return opts;
}

// ---------- math item generators (per strand) ----------
function NO_item(grade, diff, idx){
  // Numbers & Operations
  if (diff === DIFF.CORE){
    const a = ri(10, 99), b = ri(10, 99);
    const op = pick(["+","-"]);
    const ans = op==="+"? a+b : a-b;
    return {
      stem: `${a} ${op} ${b} = ?`,
      answer: String(ans),
      choices: mcFromNumber(ans)
    };
  } else if (diff === DIFF.ON){
    const a = ri(100, 999), b = ri(100, 999);
    const op = pick(["+","-"]);
    const ans = op==="+"? a+b : a-b;
    return {
      stem: `${a} ${op} ${b} = ?`,
      answer: String(ans),
      choices: mcFromNumber(ans)
    };
  }
  // stretch: multiplication/division
  const a = ri(7, 19), b = ri(6, 14);
  const op = pick(["×","÷"]);
  const ans = op==="×" ? a*b : Math.floor((a*b)/b);
  return {
    stem: op==="×" ? `${a} × ${b} = ?` : `${a*b} ÷ ${b} = ?`,
    answer: String(ans),
    choices: mcFromNumber(ans)
  };
}

function FR_item(grade, diff, idx){
  if (diff === DIFF.CORE){
    // equivalence (scale up)
    const n = ri(1,4), d = ri(Math.max(n+1,2), 9), k = ri(2,4);
    return {
      stem: `Which fraction is equivalent to ${n}/${d}?`,
      answer: `${n*k}/${d*k}`,
      choices: mcFromFraction(n*k, d*k) // include some wrong variants
    };
  } else if (diff === DIFF.ON){
    // same denominator addition
    const d = ri(4,10), a = ri(1,d-1), b = ri(1,d-1);
    const num = a+b, den = d;
    const simp = simplify(num, den);
    return {
      stem: `Compute: ${a}/${d} + ${b}/${d} = ?`,
      answer: `${simp[0]}/${simp[1]}`,
      choices: mcFromFraction(simp[0], simp[1])
    };
  }
  // stretch: unlike denominators with small LCM
  const d1 = pick([4,5,6,8,10,12]), d2 = pick([3,4,6,8,12]);
  const a = ri(1, d1-1), b = ri(1, d2-1);
  const num = a*(lcm(d1,d2)/d1) + b*(lcm(d1,d2)/d2);
  const den = lcm(d1,d2);
  const [sn, sd] = simplify(num, den);
  return {
    stem: `Compute: ${a}/${d1} + ${b}/${d2} = ?`,
    answer: `${sn}/${sd}`,
    choices: mcFromFraction(sn, sd)
  };
}
function ALG_item(grade, diff, idx){
  if (grade <= 5){
    if (diff === DIFF.CORE){
      const a = ri(6,18), b = ri(3,9);
      const x = a-b;
      return { stem: `${a} − x = ${b}.  Solve for x.`, answer: String(x), choices: mcFromNumber(x) };
    } else if (diff === DIFF.ON){
      const a = ri(2,9), b = ri(2,9), x = a+b;
      return { stem: `x − ${a} = ${b}.  What is x?`, answer: String(x), choices: mcFromNumber(x) };
    }
    const m = ri(2,5), x = ri(2,9), c = ri(1,6), y = m*x + c;
    return { stem: `${m}x + ${c} = ${y}.  x = ?`, answer: String(x), choices: mcFromNumber(x) };
  }
  // grades 6–8
  if (diff === DIFF.CORE){
    const a = ri(2,9), x = ri(2,12), b = ri(3,10);
    const y = a*x + b;
    return { stem: `${a}x + ${b} = ${y}.  x = ?`, answer: String(x), choices: mcFromNumber(x) };
  } else if (diff === DIFF.ON){
    const a = ri(2,9), x = ri(2,10), y = a*x;
    return { stem: `${a}x = ${y}.  x = ?`, answer: String(x), choices: mcFromNumber(x) };
  }
  // stretch: two-step with negatives allowed (keep simple)
  const a = ri(2,9), x = ri(1,8), b = ri(1,7);
  const y = a*x - b;
  return { stem: `${a}x − ${b} = ${y}.  x = ?`, answer: String(x), choices: mcFromNumber(x) };
}
function GEOM_item(grade, diff, idx){
  if (diff === DIFF.CORE){
    const w = ri(3,14), h = ri(3,14);
    return { stem: `Perimeter of a ${w} by ${h} rectangle = ?`, answer: String(2*(w+h)), choices: mcFromNumber(2*(w+h)) };
  } else if (diff === DIFF.ON){
    const b = ri(4,12), h = ri(4,12);
    return { stem: `Area of a right triangle with legs ${b} and ${h} = ?`, answer: String((b*h)/2), choices: mcFromNumber((b*h)/2) };
  }
  // stretch: Pythagorean
  const a = pick([3,5,6,7,8]), b = pick([4,12,8,24,15]);
  const c = Math.round(Math.sqrt(a*a + b*b));
  return { stem: `A right triangle has legs ${a} and ${b}. Hypotenuse length = ?`, answer: String(c), choices: mcFromNumber(c) };
}
function MD_item(grade, diff, idx){
  if (diff === DIFF.CORE){
    const h = ri(1,3);
    const ans = h*60;
    return { stem: `How many minutes are in ${h} hour(s)?`, answer: String(ans), choices: mcFromNumber(ans) };
  } else if (diff === DIFF.ON){
    const a = ri(3,9), b = ri(3,9), c = ri(3,9), d = ri(3,9), e = ri(3,9);
    const arr = [a,b,c,d,e].sort((x,y)=>x-y);
    const med = arr[2];
    return { stem: `Find the median of the data: ${arr.join(", ")}.`, answer: String(med), choices: mcFromNumber(med) };
  }
  // stretch: volume prism
  const l = ri(2,8), w = ri(2,7), h = ri(2,6);
  const vol = l*w*h;
  return { stem: `Volume of a rectangular prism ${l}×${w}×${h} (cubic units) = ?`, answer: String(vol), choices: mcFromNumber(vol) };
}

// helpers for fractions
function gcd(a,b){ while(b){ [a,b]=[b,a%b]; } return a; }
function lcm(a,b){ return a*b / gcd(a,b); }
function simplify(n,d){ const g=gcd(n,d); return [n/g, d/g]; }

// ---------- build 140 math items ----------
export const MATH_ITEMS = [];
(function buildMath(){
  const strands = ["NO","FR","ALG","GEOM","MD"];
  const perCombo = { [DIFF.CORE]:1, [DIFF.ON]:2, [DIFF.STRETCH]:1 }; // 4 per strand/grade
  for (let g=2; g<=8; g++){
    for (const s of strands){
      for (const [diff, cnt] of Object.entries(perCombo)){
        for (let i=0; i<cnt; i++){
          const base =
            s==="NO"   ? NO_item(g, diff, i)   :
            s==="FR"   ? FR_item(g, diff, i)   :
            s==="ALG"  ? ALG_item(g, diff, i)  :
            s==="GEOM" ? GEOM_item(g, diff, i) :
                         MD_item(g, diff, i);
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

// ---------- Reading passages (24 total questions) ----------
export const PASSAGES = [
  // (2–3) RL
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
      {id:"Q6", stem:"Main idea best stated:", choices:["Seeds are heavy.","Care helps a seed grow.","Seeds are blue.","Sam hates plants."], answer:"Care helps a seed grow."}
    ]
  },
  // (2–3) RI
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
  // (4–5) RL
  {
    id:"RL-4A", grade_band:[4,5], type:"RL",
    text:`Lena gripped the rope as the ferry rocked. Mist curled around the deck like breath.
When the captain blew the horn, Lena jumped—but smiled. The sound felt like a starting bell.`,
    questions:[
      {id:"Q1", stem:"Lena mainly feels—", choices:["Excited but nervous","Angry","Bored","Confused"], answer:"Excited but nervous"},
      {id:"Q2", stem:"Which detail supports it?", choices:["She jumped but smiled.","The mist curled.","The boat exists.","She held a rope."], answer:"She jumped but smiled."},
      {id:"Q3", stem:"The horn symbolizes—", choices:["A beginning","Danger","Anger","Ending"], answer:"A beginning"},
      {id:"Q4", stem:"Point of view:", choices:["3rd limited","1st","2nd","3rd omniscient"], answer:"3rd limited"},
      {id:"Q5", stem:"Best word for Lena:", choices:["Hopeful","Careless","Timid","Furious"], answer:"Hopeful"},
      {id:"Q6", stem:"Which shows setting most?", choices:["Mist around the deck","She smiled","Captain spoke","She stood"], answer:"Mist around the deck"}
    ]
  },
  // (7–8) RI
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
  }
];

// ---------- Language items (36 total) ----------
export const LANG_ITEMS = [];
(function buildLang(){
  const basePerGrade = 4;   // 4 × 7 = 28
  const extrasNeeded = 36 - (basePerGrade * 7); // need 8 more
  const grades = [2,3,4,5,6,7,8];

  // templates
  function commasSeries(g, diff){
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
  function nonrestrictive(g, diff){
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
  function subjectVerb(g,diff){
    const s = pick(["The team","The birds","The class","The data"]);
    const ok = pick(["is","are"]) === "is" ? "is" : "are"; // randomize answer
    const wrong = ok==="is" ? "are" : "is";
    const correct = (s==="The team" || s==="The class" || s==="The data") ? "is" : "are";
    return {
      stem:`Which completes the sentence correctly? ${s} ___ ready.`,
      key:[correct, wrong, ok, wrong===ok?correct:wrong],
      ans:0
    };
  }
  function capitalization(g,diff){
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

  function make(idPrefix, g, diff, spec){
    const ch = spec(g,diff);
    LANG_ITEMS.push({
      id:`LANG-${idPrefix}-${g}-${diff}-${ri(100,999)}`,
      grade_min:g, grade_max:g, strand:"LANG", diff,
      stem: ch.stem,
      choices: ch.key,
      answer: ch.key[ch.ans]
    });
  }

  grades.forEach(g=>{
    make("SER", g, DIFF.CORE, commasSeries);
    make("CAP", g, DIFF.CORE, capitalization);
    make("SV",  g, DIFF.ON,   subjectVerb);
    make("NRC", g, DIFF.ON,   nonrestrictive);
  });

  // add extras on upper grades to reach 36
  const extraGrades = [8,7,6,5];
  let added = 0;
  while (added < extrasNeeded){
    const g = extraGrades[added % extraGrades.length];
    make("SVX", g, DIFF.STRETCH, subjectVerb);
    added++;
  }
})();

