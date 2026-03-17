// bank.js
// Coverage-focused item bank for Grades 2–8
// Math strands: NO, FR, ALG, GEOM, MD  (mapped to CCSS clusters per grade)
// English: Reading passages (RL/RI) + Language items (grammar/usage)

// ================== Enums ==================
export const DIFF = { CORE: "core", ON: "on", STRETCH: "stretch" };
export const STRANDS = { MATH: ["NO","FR","ALG","GEOM","MD"] };

// ================== Utilities ==================
function rngSeeded(seed){ let s = seed>>>0 || 1; return ()=> (s = (s*1664525 + 1013904223)>>>0) / 2**32; }
const rnd = rngSeeded(987654321);
const ri = (a,b)=> a + Math.floor(rnd()*(b-a+1));
const pick = (arr)=> arr[Math.floor(rnd()*arr.length)];
function shuffle(a){ const c=[...a]; for(let i=c.length-1;i>0;i--){ const j=Math.floor(rnd()*(i+1)); [c[i],c[j]]=[c[j],c[i]]; } return c; }
const between = (n,a,b)=> n>=a && n<=b;

function gcd(a,b){ while(b){ [a,b]=[b,a%b]; } return a; }
function lcm(a,b){ return a*b / gcd(a,b); }
function simplify(n,d){ const g=gcd(n,d); return [n/g, d/g]; }

// MC helper for numeric answers
function mcFromNumber(ans){
  const used = new Set([String(ans)]);
  const ds = [];
  const add = (v)=>{ const s = String(v); if(!used.has(s)){ used.add(s); ds.push(s); } };
  const deltas = [ri(1,3), -ri(1,4), ri(4,7), -ri(2,5)];
  deltas.forEach(d=> add(Number(ans) + d));
  return shuffle([String(ans), ...ds].slice(0,4));
}

// MC helper for fraction answers — build 3 non-equivalent distractors
function mcFracDistinct(n,d){
  const ans = `${n}/${d}`;
  const bads = new Set([ans]);
  const pool = [
    `${n+1}/${d}`, `${n}/${d+1}`, `${Math.max(1,n-1)}/${d}`,
    `${n}/${Math.max(2,d-1)}`, `${n+2}/${d+1}`, `${n+1}/${d+2}`
  ].filter(s => !bads.has(s));
  const uniq = [...new Set(pool)];
  return shuffle([ans, ...uniq].slice(0,4));
}

// ================== Math Generators (grade-aware) ==================
// NO: Number & Operations (we also tuck some EE/NS/RP flavor here by grade)
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

  if (grade === 6){
    // 6.NS/6.EE: decimals & expressions basics
    if (diff === DIFF.CORE){
      const a = +(ri(10,999)/10).toFixed(1), b = +(ri(10,999)/10).toFixed(1);
      const ans = +(a + b).toFixed(1);
      return { stem:`${a} + ${b} = ?`, answer:String(ans), choices: mcFromNumber(ans) };
    }
    if (diff === DIFF.ON){
      const a = ri(2,9), b = ri(1,9), x = a*b;
      return { stem:`${a}x = ${a*b}.  x = ?`, answer:String(x), choices: mcFromNumber(x) };
    }
    // STRETCH: divide fractions by fractions (result simplified)
    const n1 = ri(1,9), d1 = ri(2,9), n2 = ri(1,9), d2 = ri(2,9);
    const num = n1*d2, den = d1*n2; const [sn, sd] = simplify(num, den);
    return { stem:`${n1}/${d1} ÷ ${n2}/${d2} = ? (simplest form)`, answer:`${sn}/${sd}`, choices: mcFracDistinct(sn, sd) };
  }

  // Grades 2–5 baseline
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

// FR: Fractions / Ratios / Percent (we fold RP here for simplicity)
function FR_item(grade, diff){
  if (grade === 6){
    // 6.RP: unit rates / equivalent ratios / percent as rate
    if (diff === DIFF.CORE){
      const miles = ri(30,90), hours = pick([2,3]);
      const ans = Math.round((miles/hours)*10)/10;
      return { stem:`${miles} miles in ${hours} hours. Unit rate (miles/hour) = ?`, answer:String(ans), choices: mcFromNumber(ans) };
    }
    if (diff === DIFF.ON){
      const a=ri(2,6), b=ri(3,8); const k = ri(2,5);
      return { stem:`Which ratio is equivalent to ${a}:${b}?`, answer:`${a*k}:${b*k}`, choices: shuffle([`${a*k}:${b*k}`, `${a}:${b*k}`, `${a+k}:${b}`, `${a}:${b+k}`]) };
    }
    // STRETCH: percent problems
    const base = ri(50,200), p = pick([10,12.5,15,20,25,30]);
    const ans = Math.round(base*(p/100));
    return { stem:`What is ${p}% of ${base}?`, answer:String(ans), choices: mcFromNumber(ans) };
  }

  if (grade >= 7){
    // 7.NS & 7.RP
    if (diff === DIFF.CORE){
      const d = pick([6,8,10,12]);
      const a = ri(1,d-1), b = ri(1,d-1);
      const [sn, sd] = simplify(a+b, d);
      return { stem:`${a}/${d} + ${b}/${d} = ?`, answer:`${sn}/${sd}`, choices: mcFracDistinct(sn, sd) };
    }
    if (diff === DIFF.ON){
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
    const p = pick([10,12.5,15,20,25,30]);
    const ans = Math.round(base*(p/100));
    return { stem:`What is ${p}% of ${base}?`, answer:String(ans), choices: mcFromNumber(ans) };
  }

  // Grades 2–5
  if (diff === DIFF.CORE){
    const n = ri(1,4), d = ri(Math.max(n+1,2), 9), k = ri(2,4);
    const [sn, sd] = [n*k, d*k];
    return { stem: `Which fraction is equivalent to ${n}/${d}?`, answer: `${sn}/${sd}`, choices: mcFracDistinct(sn, sd) };
  }
  if (diff === DIFF.ON){
    const d = ri(4,10), a = ri(1,d-1), b = ri(1,d-1);
    const [sn, sd] = simplify(a+b, d);
    return { stem: `Compute: ${a}/${d} + ${b}/${d} = ? (simplest form)`, answer: `${sn}/${sd}`, choices: mcFracDistinct(sn, sd) };
  }
  const d1 = pick([4,5,6,8,10,12]), d2 = pick([3,4,6,8,12]);
  const a = ri(1, d1-1), b = ri(1, d2-1);
  const L = lcm(d1,d2);
  const num = a*(L/d1) + b*(L/d2);
  const [sn, sd] = simplify(num, L);
  return { stem: `Compute: ${a}/${d1} + ${b}/${d2} = ? (simplest form)`, answer: `${sn}/${sd}`, choices: mcFracDistinct(sn, sd) };
}

// ALG: Expressions & Equations (grade 8 gets systems/exponents)
function ALG_item(grade, diff){
  if (grade >= 8){
    if (diff === DIFF.CORE){
      // slope-intercept: solve y = mx + b for y given x
      const m = ri(-4,4)||2, b = ri(-6,6), x = ri(-5,5), y = m*x + b;
      return { stem:`For y = ${m}x + ${b}, what is y when x = ${x}?`, answer:String(y), choices: mcFromNumber(y) };
    }
    if (diff === DIFF.ON){
      // small-integer system
      const x = ri(-3,3), y = ri(-3,3);
      const a=ri(1,3), b=ri(1,3), c=ri(1,3), d=ri(1,3);
      const e = a*x + b*y, f = c*x + d*y;
      const stem = `${a}x + ${b}y = ${e};  ${c}x + ${d}y = ${f}.  What is x?`;
      return { stem, answer:String(x), choices: mcFromNumber(x) };
    }
    // STRETCH: exponent laws
    const a = ri(2,5), b = ri(1,4), c = ri(1,4);
    const ans = `x^${b+c}`;
    const choices = shuffle([`x^${b+c}`, `x^${b-c}`, `x^${b*c}`, `x^${Math.max(1,b-c)}`]);
    return { stem:`Simplify: x^${b} · x^${c}`, answer: ans, choices };
  }

  if (grade >= 7){
    // 7.EE & intro to slope
    if (diff === DIFF.CORE){
      const a = ri(2,9), x = ri(2,12), b = ri(1,10), c = a*x + b;
      return { stem: `${a}x + ${b} = ${c}.  x = ?`, answer: String(x), choices: mcFromNumber(x) };
    }
    if (diff === DIFF.ON){
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

  if (grade === 6){
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

  // Grades 2–5 simples
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

// GEOM: Geometry (G6 surface area; G7 circles/angles/Pythag; G8 transformations + volume)
function GEOM_item(grade, diff){
  if (grade === 6){
    if (diff === DIFF.CORE){
      const b = ri(4,12), h = ri(4,12);
      const ans = (b*h)/2;
      return { stem:`Area of a triangle with base ${b} and height ${h} = ?`, answer:String(ans), choices: mcFromNumber(ans) };
    }
    if (diff === DIFF.ON){
      const L=ri(3,8), W=ri(3,8), H=ri(3,8);
      const sa = 2*(L*W + L*H + W*H);
      return { stem:`Surface area of a rectangular prism ${L}×${W}×${H} = ?`, answer:String(sa), choices: mcFromNumber(sa) };
    }
    // STRETCH: area of composite rectilinear figure
    const a = ri(4,10), b = ri(3,8), c = ri(2,6); // L-shape pieces
    const area = a*b + (a-c)*c;
    return { stem:`Area of an L-shaped figure (rectangles ${a}×${b} and ${(a-c)}×${c}) = ?`, answer:String(area), choices: mcFromNumber(area) };
  }

  if (grade >= 8){
    if (diff === DIFF.CORE){
      // transformation: which preserves distance?
      const opts = ["Rotation","Translation","Reflection","Dilation by factor 2"];
      return { stem:"Which transformation does NOT preserve distance?", choices: shuffle(opts), answer:"Dilation by factor 2" };
    }
    if (diff === DIFF.ON){
      // volume of a cone: V = 1/3 π r^2 h  (π≈22/7)
      const r = ri(3,8), h = ri(4,10);
      const ans = Math.round((22/7) * r * r * h / 3);
      return { stem:`Volume of a cone with r=${r}, h=${h} (use π≈22/7) = ?`, answer:String(ans), choices: mcFromNumber(ans) };
    }
    // STRETCH: volume of a sphere: 4/3 π r^3
    const r = ri(2,7);
    const ans = Math.round((4/3) * (22/7) * r * r * r);
    return { stem:`Volume of a sphere with r=${r} (use π≈22/7) = ?`, answer:String(ans), choices: mcFromNumber(ans) };
  }

  if (grade >= 7){
    if (diff === DIFF.CORE){
      const r = ri(3,10);
      const ans = Math.round((22/7) * r * r);
      return { stem:`Area of a circle with radius ${r} (use π≈22/7) = ?`, answer:String(ans), choices: mcFromNumber(ans) };
    }
    if (diff === DIFF.ON){
      const type = pick(["supplementary","complementary"]);
      const total = type==="supplementary" ? 180 : 90;
      const a = ri(20, total-20);
      const ans = total - a;
      return { stem:`Angles A and B are ${type}. If m∠A = ${a}°, what is m∠B?`, answer:String(ans), choices: mcFromNumber(ans) };
    }
    const triples = [[3,4,5],[5,12,13],[7,24,25],[8,15,17]];
    const [A,B,C] = pick(triples);
    return { stem:`A right triangle has legs ${A} and ${B}. Find the hypotenuse.`, answer:String(C), choices: mcFromNumber(C) };
  }

  // Grades 2–5 baseline
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

// MD: Measurement & Data (includes stats; add prob for G7; association for G8)
function MD_item(grade, diff){
  if (grade === 6){
    if (diff === DIFF.CORE){
      const arr = [ri(10,40),ri(10,40),ri(10,40),ri(10,40),ri(10,40)];
      const sum = arr.reduce((x,y)=>x+y,0);
      const mean = Math.round(sum/arr.length);
      return { stem:`Data: ${arr.join(", ")}. What is the mean?`, answer:String(mean), choices: mcFromNumber(mean) };
    }
    if (diff === DIFF.ON){
      const a = [ri(1,9),ri(1,9),ri(1,9),ri(1,9),ri(1,9)];
      const arr = a.sort((x,y)=>x-y);
      const med = arr[2];
      return { stem:`Find the median of the data: ${arr.join(", ")}.`, answer:String(med), choices: mcFromNumber(med) };
    }
    // STRETCH: Mean Absolute Deviation (MAD) small data
    const arr = [ri(6,12),ri(6,12),ri(6,12),ri(6,12),ri(6,12)];
    const mean = arr.reduce((a,b)=>a+b,0)/arr.length;
    const mad = Math.round(arr.reduce((s,v)=>s+Math.abs(v-mean),0)/arr.length);
    return { stem:`Data: ${arr.join(", ")}. Approximate MAD = ?`, answer:String(mad), choices: mcFromNumber(mad) };
  }

  if (grade === 7){
    if (diff === DIFF.CORE){
      // Simple probability of a single event
      const reds = ri(1,5), blues = ri(1,5);
      const total = reds + blues;
      const ans = `${reds}/${total}`;
      return { stem:`Bag has ${reds} red and ${blues} blue marbles. P(red) = ?`, answer:ans, choices: mcFracDistinct(reds, total) };
    }
    if (diff === DIFF.ON){
      // Compound (independent, with replacement)
      const r = ri(1,4), b = ri(1,4), g = ri(1,4);
      const total = r+b+g;
      const num = r * b, den = total*total; const [sn,sd] = simplify(num,den);
      return { stem:`Bag: R=${r}, B=${b}, G=${g}. With replacement, P(red then blue) = ?`, answer:`${sn}/${sd}`, choices: mcFracDistinct(sn,sd) };
    }
    // STRETCH: random sampling inference (conceptual)
    const choices = ["Likely representative","Biased (convenience)","Biased (voluntary response)","Biased (too small)"];
    return { stem:`A school surveys only students in the cafeteria at lunch about homework time. The sample is—`, choices: shuffle(choices), answer:"Biased (convenience)" };
  }

  if (grade >= 8){
    if (diff === DIFF.CORE){
      // association in scatter plot (concept)
      const opts = ["Positive association","Negative association","No association","Not enough information"];
      return { stem:"As x increases, y tends to decrease in a scatter plot. The association is—", choices: shuffle(opts), answer:"Negative association" };
    }
    if (diff === DIFF.ON){
      // two-way table marginal probability
      const a=ri(8,12), b=ri(4,9), c=ri(5,10), d=ri(6,11);
      const total = a+b+c+d; const yes = a+c;
      const [sn,sd] = simplify(yes, total);
      return { stem:`Two-way table totals: Yes=[${a}+${c}], No=[${b}+${d}]. P(Yes) = ?`, answer:`${sn}/${sd}`, choices: mcFracDistinct(sn,sd) };
    }
    // STRETCH: cylinder vs sphere volume comparison (reasoning)
    const r = ri(3,7), h = ri(6,14);
    const Vc = Math.round((22/7)*r*r*h);
    const Vs = Math.round((4/3)*(22/7)*r*r*r);
    const ans = Vc>Vs ? "Cylinder" : "Sphere";
    return { stem:`Which has the larger volume (π≈22/7)? Cylinder r=${r},h=${h} vs Sphere r=${r}`, choices: shuffle(["Cylinder","Sphere","Equal","Cannot determine"]), answer: ans };
  }

  // Grades 2–5 baseline
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

// ================== Build Math Items (140 total as before) ==================
export const MATH_ITEMS = [];
(function buildMath(){
  const strands = ["NO","FR","ALG","GEOM","MD"];
  const perCombo = { [DIFF.CORE]:1, [DIFF.ON]:2, [DIFF.STRETCH]:1 }; // 4 per strand/grade → 20 per grade
  // Keep generator pool for grades 4–8 unchanged.
  for (let g=4; g<=8; g++){
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

  // -------- Curated, standards-aligned pool for grades 2–3 (new foundation) --------
  // We keep items multiple-choice and strand-tagged so the adaptive engine can target skills.
  function mc(grade, strand, diff, stem, answer, choices){
    MATH_ITEMS.push({
      id: `CUR-${strand}-${grade}-${diff}-${ri(1000,9999)}`,
      grade_min: grade,
      grade_max: grade,
      strand,
      diff,
      stem,
      choices,
      answer,
    });
  }

  // ===== Grade 2 =====
  // Number & Operations (2.NBT)
  mc(2,'NO',DIFF.CORE,'What is 17 + 8?','25',['23','24','25','26']);
  mc(2,'NO',DIFF.CORE,'What is 43 − 19?','24',['22','24','26','28']);
  mc(2,'NO',DIFF.ON,'What is 276 + 58?','334',['324','334','344','354']);
  mc(2,'NO',DIFF.ON,'What is 500 − 236?','264',['254','264','274','284']);
  mc(2,'NO',DIFF.STRETCH,'What is 708 + 295?','1003',['903','993','1003','1103']);
  mc(2,'NO',DIFF.STRETCH,'What is 1,000 − 407?','593',['503','593','607','703']);

  // Operations / Algebraic Thinking (equal groups intro, even/odd)
  mc(2,'ALG',DIFF.CORE,'Which number is even?','14',['11','13','14','15']);
  mc(2,'ALG',DIFF.CORE,'There are 4 bags. Each bag has 3 apples. How many apples in all?','12',['7','10','12','16']);
  mc(2,'ALG',DIFF.ON,'Fill in the blank: 5 + 5 + 5 = __ × 5','3',['2','3','4','5']);
  mc(2,'ALG',DIFF.ON,'Which equation shows 18 split into 3 equal groups?','18 ÷ 3 = 6',['18 − 3 = 15','18 + 3 = 21','18 ÷ 3 = 6','18 × 3 = 54']);
  mc(2,'ALG',DIFF.STRETCH,'A row has 6 chairs. There are 4 equal rows. How many chairs?','24',['20','22','24','26']);

  // Fractions as equal parts (2.G.3 style)
  mc(2,'FR',DIFF.CORE,'A shape is split into 2 equal parts. One part is called…','one-half',['one-third','one-fourth','one-half','one-whole']);
  mc(2,'FR',DIFF.CORE,'Which fraction means 3 equal parts and you have 1 part?','1/3',['1/2','1/3','1/4','3/1']);
  mc(2,'FR',DIFF.ON,'Which shows 3/4?','4 equal parts, 3 shaded',['3 equal parts, 1 shaded','4 equal parts, 1 shaded','4 equal parts, 3 shaded','2 equal parts, 1 shaded']);
  mc(2,'FR',DIFF.STRETCH,'Which is bigger?','1/2',['1/3','1/4','1/2','All are equal']);

  // Geometry (shapes)
  mc(2,'GEOM',DIFF.CORE,'How many sides does a triangle have?','3',['2','3','4','5']);
  mc(2,'GEOM',DIFF.ON,'A rectangle is split into 4 equal parts. Each part is…','one-fourth',['one-half','one-third','one-fourth','one-eighth']);
  mc(2,'GEOM',DIFF.STRETCH,'Which shape has 6 sides?','hexagon',['triangle','square','pentagon','hexagon']);

  // Measurement & Data (time, money)
  mc(2,'MD',DIFF.CORE,'How many cents are in 3 quarters?','75',['25','50','75','100']);
  mc(2,'MD',DIFF.ON,'You have 2 dimes and 3 pennies. How many cents is that?','23',['13','20','23','25']);
  mc(2,'MD',DIFF.ON,'If it is 3:10 now, what time will it be in 15 minutes?','3:25',['3:15','3:20','3:25','3:35']);
  mc(2,'MD',DIFF.STRETCH,'A pencil is 12 cm long. Another pencil is 7 cm long. How many cm longer is the first pencil?','5',['4','5','6','7']);

  // ===== Grade 3 =====
  // Number & Operations (3.NBT)
  mc(3,'NO',DIFF.CORE,'What is 386 + 47?','433',['423','433','443','453']);
  mc(3,'NO',DIFF.CORE,'What is 700 − 458?','242',['232','242','252','262']);
  mc(3,'NO',DIFF.ON,'Round 268 to the nearest ten.','270',['260','265','270','280']);
  mc(3,'NO',DIFF.STRETCH,'Which estimate is closest to 498 + 207?','700',['600','700','800','900']);

  // Operations / Algebraic Thinking (3.OA)
  mc(3,'ALG',DIFF.CORE,'What is 7 × 6?','42',['36','40','42','48']);
  mc(3,'ALG',DIFF.CORE,'What is 54 ÷ 9?','6',['5','6','7','8']);
  mc(3,'ALG',DIFF.ON,'Solve for the missing number: __ × 8 = 56','7',['6','7','8','9']);
  mc(3,'ALG',DIFF.ON,'A box has 5 rows of 4 markers. How many markers?','20',['9','16','20','24']);
  mc(3,'ALG',DIFF.STRETCH,'Two-step: 24 stickers are shared equally by 6 kids. Then each kid gets 3 more stickers. How many stickers does each kid have now?','7',['6','7','8','9']);

  // Fractions (3.NF)
  mc(3,'FR',DIFF.CORE,'Which fraction is at the same point as 2/4?','1/2',['1/3','1/2','2/3','3/4']);
  mc(3,'FR',DIFF.ON,'Which is greater?','3/4',['2/4','3/4','1/4','All are equal']);
  mc(3,'FR',DIFF.STRETCH,'Which fraction is equivalent to 3/6?','1/2',['1/3','1/2','2/3','3/4']);

  // Measurement & Data (3.MD)
  mc(3,'MD',DIFF.CORE,'A movie starts at 4:15 and ends at 4:45. How many minutes long is it?','30',['20','25','30','35']);
  mc(3,'MD',DIFF.ON,'A rectangle is 6 units long and 4 units wide. What is the area?','24',['10','20','24','28']);
  mc(3,'MD',DIFF.STRETCH,'A rectangle has perimeter 18. Three sides are 4, 4, and 5. What is the missing side?','5',['4','5','6','7']);

  // Geometry (3.G)
  mc(3,'GEOM',DIFF.CORE,'Which shape is a quadrilateral?','rectangle',['triangle','rectangle','pentagon','hexagon']);
  mc(3,'GEOM',DIFF.ON,'How many vertices does a pentagon have?','5',['4','5','6','8']);
  mc(3,'GEOM',DIFF.STRETCH,'A shape is split into 8 equal parts. One part is called…','1/8',['1/4','1/6','1/8','8/1']);

  // ===== Grade 4 (new foundation – keep grades 5–8 unchanged) =====
  // Number & Operations (4.NBT)
  mc(4,'NO',DIFF.CORE,'What is 36,405 rounded to the nearest thousand?','36,000',['35,000','36,000','36,400','37,000']);
  mc(4,'NO',DIFF.CORE,'What is 8,372 − 1,958?','6,414',['6,314','6,414','6,514','6,614']);
  mc(4,'NO',DIFF.ON,'What is 4,680 + 2,395?','7,075',['6,975','7,075','7,175','7,275']);
  mc(4,'NO',DIFF.ON,'Which number is the greatest?','503,210',['503,120','503,201','503,210','503,012']);
  mc(4,'NO',DIFF.STRETCH,'Estimate 298 × 7 by rounding 298 to the nearest hundred.','2,100',['1,400','2,000','2,100','2,800']);

  // Operations & Algebraic Thinking (4.OA)
  mc(4,'ALG',DIFF.CORE,'Interpret: 6 × 4 means…','6 groups of 4',['6 + 4','4 − 6','6 groups of 4','6 divided by 4']);
  mc(4,'ALG',DIFF.CORE,'A coat costs 3 times as much as a hat. A hat costs $12. How much is the coat?','$36',['$15','$24','$36','$48']);
  mc(4,'ALG',DIFF.ON,'What is 23 × 6?','138',['128','132','138','148']);
  mc(4,'ALG',DIFF.ON,'What is 864 ÷ 6?','144',['124','134','144','154']);
  mc(4,'ALG',DIFF.STRETCH,'Two-step: A store sold 6 boxes of pencils. Each box had 24 pencils. They had 150 pencils at first. How many pencils are left?','6',['4','6','8','10']);

  // Fractions (4.NF)
  mc(4,'FR',DIFF.CORE,'Which fraction is equivalent to 3/6?','1/2',['1/3','1/2','2/3','3/4']);
  mc(4,'FR',DIFF.CORE,'Which is greater?','5/8',['1/2','5/8','3/8','They are equal']);
  mc(4,'FR',DIFF.ON,'What is 3/8 + 2/8?','5/8',['4/8','5/8','6/8','7/8']);
  mc(4,'FR',DIFF.ON,'What is 2 3/5 − 1 1/5?','1 2/5',['1 1/5','1 2/5','1 3/5','2 2/5']);
  mc(4,'FR',DIFF.STRETCH,'Convert 7/10 to an equivalent fraction with denominator 100.','70/100',['7/100','17/100','70/100','700/100']);

  // Measurement & Data (4.MD)
  mc(4,'MD',DIFF.CORE,'Convert 3 feet to inches.','36',['9','12','24','36']);
  mc(4,'MD',DIFF.ON,'A rectangle has length 9 units and width 4 units. What is the area?','36',['13','18','36','40']);
  mc(4,'MD',DIFF.ON,'A rectangle has perimeter 26 units. If one side is 7 units, what is the other side?','6',['5','6','7','8']);
  mc(4,'MD',DIFF.STRETCH,'A movie starts at 2:35 and ends at 4:05. How long is the movie?','1 hour 30 minutes',['1 hour 20 minutes','1 hour 30 minutes','1 hour 40 minutes','2 hours']);

  // Geometry (4.G)
  mc(4,'GEOM',DIFF.CORE,'Which angle is obtuse?','120°',['45°','90°','120°','180°']);
  mc(4,'GEOM',DIFF.ON,'Which pair of lines is perpendicular?','Lines that meet to form a right angle',['Lines that never meet','Lines that are curved','Lines that meet to form a right angle','Lines that are the same line']);
  mc(4,'GEOM',DIFF.STRETCH,'How many lines of symmetry does a square have?','4',['1','2','3','4']);
})();

// ================== Reading Passages ==================
export const PASSAGES = [
  // RL 2–3
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
  // RI 2–3
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
  // RL 2–3 (extra medium passage)
  {
    id:"RL-2B", grade_band:[2,3], type:"RL",
    text:`Maya was getting ready to go outside when she noticed one mitten was gone. She looked under the couch, behind the door, and inside her backpack. Nothing.

Then Maya heard a soft meow. Her cat, Pepper, was sitting by the window. Pepper had something fluffy under his paw. Maya walked closer and laughed. It was her mitten!

Maya gently took the mitten and patted Pepper. "You were keeping it safe," she said. Then she put on both mittens and went outside to play.`,
    questions:[
      {id:"Q1", stem:"Why did Maya laugh?", choices:["She found her mitten under the couch.","Pepper was holding her missing mitten.","She did not want to go outside.","She lost both mittens."], answer:"Pepper was holding her missing mitten."},
      {id:"Q2", stem:"What can you infer about Pepper?", choices:["He wanted to help Maya.","He was afraid of mittens.","He did not like Maya.","He was looking for food."], answer:"He wanted to help Maya."},
      {id:"Q3", stem:"Which detail shows Maya searched carefully?", choices:["She patted Pepper.","She looked under the couch.","She went outside.","She laughed."], answer:"She looked under the couch."},
      {id:"Q4", stem:"What is the setting?", choices:["Outside in a park","At home","At a store","On a bus"], answer:"At home"},
      {id:"Q5", stem:"How does Maya feel at the end?", choices:["Worried","Happy","Angry","Sleepy"], answer:"Happy"},
      {id:"Q6", stem:"Main idea best stated:", choices:["Pets always hide things.","Looking carefully can solve a problem.","Mittens are expensive.","Windows are cold."], answer:"Looking carefully can solve a problem."}
    ]
  },
  // RI 2–3 (extra medium passage)
  {
    id:"RI-3B", grade_band:[2,3], type:"RI",
    text:`Bees are small insects, but they do big work. When a bee visits a flower, it sips sweet nectar. While the bee drinks, yellow pollen sticks to its body.

Next, the bee flies to another flower. Some of the pollen falls off. This helps the new flower make seeds. This process is called pollination.

Pollination helps many plants grow, including fruits and vegetables. That means bees help farmers and people, too.`,
    questions:[
      {id:"Q1", stem:"What is the main idea of the passage?", choices:["Bees are dangerous insects.","Bees help plants grow by moving pollen.","Bees only visit one flower.","Bees sleep inside flowers."], answer:"Bees help plants grow by moving pollen."},
      {id:"Q2", stem:"What is pollination?", choices:["When pollen moves to another flower.","When flowers change colors.","When nectar turns into honey.","When bees sleep in hives."], answer:"When pollen moves to another flower."},
      {id:"Q3", stem:"Which detail supports the main idea?", choices:["Bees are small insects.","Pollen sticks to the bee’s body.","Flowers smell nice.","Vegetables are healthy."], answer:"Pollen sticks to the bee’s body."},
      {id:"Q4", stem:"What do bees sip from flowers?", choices:["Nectar","Water","Seeds","Leaves"], answer:"Nectar"},
      {id:"Q5", stem:"Why are bees helpful to people?", choices:["They help fruits and vegetables grow.","They make rocks softer.","They make storms stop.","They turn flowers into trees."], answer:"They help fruits and vegetables grow."},
      {id:"Q6", stem:"This passage is mostly—", choices:["A story","Information","A poem","A letter"], answer:"Information"}
    ]
  },
  // RL 4–5
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
  // RL 4–5 (second medium passage)
  {
    id:"RL-4B", grade_band:[4,5], type:"RL",
    text:`Nina wanted to learn the skateboard trick called an ollie. After school, she practiced in the empty parking lot.
At first, the board clacked loudly and shot away from her feet. Nina sighed, then tried again. She watched her shadow
to check her posture and paid attention to where her knees bent. Each attempt was a little better.

On Friday, her friend Mateo came to cheer her on. “Pick one small goal,” he said. “Just get the front wheels to lift.”
Nina nodded. She focused on that one part, and the board finally hopped—only an inch, but it was real.

Nina laughed and held up her hand for a high-five. “Next week,” she said, “I’m going for two inches.”`,
    questions:[
      {id:"Q1", stem:"What is Nina trying to do?", choices:["Learn an ollie","Win a race","Build a ramp","Fix a bike"], answer:"Learn an ollie"},
      {id:"Q2", stem:"Which detail shows Nina is improving?", choices:["The board clacked loudly.","Each attempt was a little better.","She practiced after school.","The parking lot was empty."], answer:"Each attempt was a little better."},
      {id:"Q3", stem:"What advice does Mateo give?", choices:["Stop practicing","Buy a new board","Pick one small goal","Practice only on weekends"], answer:"Pick one small goal"},
      {id:"Q4", stem:"Why does Nina watch her shadow?", choices:["To see the time","To check her posture","To find Mateo","To scare birds"], answer:"To check her posture"},
      {id:"Q5", stem:"How does Nina feel at the end?", choices:["Proud and excited","Embarrassed","Angry","Bored"], answer:"Proud and excited"},
      {id:"Q6", stem:"Theme best supported by the story:", choices:["Small steps lead to progress.","Luck matters most.","Friends always agree.","Practice is pointless."], answer:"Small steps lead to progress."}
    ]
  },
  // --- PATCH: RI 4–5 (added) ---
  {
    id:"RI-5A", grade_band:[4,5], type:"RI",
    text:`Deserts form where evaporation is greater than precipitation. Some plants store water in thick stems. Others grow only after rare storms, racing to flower and drop seeds.`,
    questions:[
      {id:"Q1", stem:"Main idea?", choices:["Deserts are defined by low rainfall.","Deserts are always hot.","Deserts have no life.","All deserts are the same."], answer:"Deserts are defined by low rainfall."},
      {id:"Q2", stem:"Best text structure here:", choices:["Cause/effect","Chronology","Problem/solution","Dialogue"], answer:"Cause/effect"},
      {id:"Q3", stem:"Which detail supports the main idea?", choices:["Evaporation can exceed precipitation.","Deserts are sandy.","Animals run fast.","People vacation there."], answer:"Evaporation can exceed precipitation."},
      {id:"Q4", stem:"Which graphic would help most?", choices:["Rainfall bar chart","A poem","A recipe","A song"], answer:"Rainfall bar chart"},
      {id:"Q5", stem:"Meaning of 'adapt' here:", choices:["Change to survive","Move away","Sleep","Complain"], answer:"Change to survive"},
      {id:"Q6", stem:"Evidence for plant strategies:", choices:["Thick stems and quick life cycles after rain.","They are blue.","They are tall.","They are pets."], answer:"Thick stems and quick life cycles after rain."}
    ]
  },
  // RI 4–5 (second medium passage)
  {
    id:"RI-4B", grade_band:[4,5], type:"RI",
    text:`If you’ve ever noticed a patch of moss on a sidewalk, you’ve seen a plant that likes moisture and shade.
Mosses do not have flowers or seeds like many other plants. Instead, they reproduce using tiny spores.
Spores are much smaller than seeds and can be carried by wind, water, or animals.

Because mosses do not have deep roots, they absorb water through their leaves. That is why moss often grows in places
that stay damp, such as near streams, on rocks, or on the north side of trees. Moss can also help the environment.
It can slow down water as it runs over the ground, which may reduce erosion.

People sometimes use moss in gardens to create soft, green ground cover. However, moss is sensitive. If it dries out
for too long or is stepped on often, it may stop growing.`,
    questions:[
      {id:"Q1", stem:"What is the main idea of the passage?", choices:["Moss grows best in hot deserts.","Moss has deep roots.","Moss has special features that help it live in damp places.","Moss is dangerous to people."], answer:"Moss has special features that help it live in damp places."},
      {id:"Q2", stem:"How do mosses reproduce, according to the passage?", choices:["With seeds","With spores","With fruit","With pinecones"], answer:"With spores"},
      {id:"Q3", stem:"Why does moss often grow in damp areas?", choices:["It needs deep soil.","It absorbs water through its leaves.","It makes its own rain.","It only grows near people."], answer:"It absorbs water through its leaves."},
      {id:"Q4", stem:"What does the word erosion mean in this passage?", choices:["The ground wearing away","The ground turning to ice","The ground getting taller","The ground growing plants"], answer:"The ground wearing away"},
      {id:"Q5", stem:"Which detail supports the idea that moss is sensitive?", choices:["Moss is green.","Moss grows near streams.","If it dries out for too long, it may stop growing.","Spores can be carried by wind."], answer:"If it dries out for too long, it may stop growing."},
      {id:"Q6", stem:"Which heading best fits this passage?", choices:["How to Train a Dog","All About Moss","The Fastest Cars","The History of Skateboards"], answer:"All About Moss"}
    ]
  },
  // --- PATCH: RL 6 (added) ---
  {
    id:"RL-6A", grade_band:[6,6], type:"RL",
    text:`Jae stared at the chessboard. The obvious move glittered like a shortcut—but his coach's voice echoed: 'Win the position, not the piece.' He breathed, counted, and slid the quiet pawn.`,
    questions:[
      {id:"Q1", stem:"Theme best supported:", choices:["Patience and strategy beat impulse.","Winning requires luck.","Coaches always decide.","Chess is easy."], answer:"Patience and strategy beat impulse."},
      {id:"Q2", stem:"'Glittered like a shortcut' is—", choices:["Simile","Metaphor","Alliteration","Hyperbole"], answer:"Simile"},
      {id:"Q3", stem:"Which detail supports the theme?", choices:["He breathed and counted.","The board has pieces.","He sat.","It was Tuesday."], answer:"He breathed and counted."},
      {id:"Q4", stem:"POV:", choices:["3rd limited","1st","2nd","3rd omniscient"], answer:"3rd limited"},
      {id:"Q5", stem:"Tone is mostly—", choices:["Focused","Angry","Silly","Hopeless"], answer:"Focused"},
      {id:"Q6", stem:"The 'quiet pawn' suggests—", choices:["A subtle plan","A random move","A blunder","A resignation"], answer:"A subtle plan"}
    ]
  },
  // --- PATCH: RI 6 (added) ---
  {
    id:"RI-6A", grade_band:[6,6], type:"RI",
    text:`A claim is a statement that can be supported or challenged. Strong explanations connect claims to evidence with reasoning. For example, a scientist may link a temperature trend to ocean data and a model.`,
    questions:[
      {id:"Q1", stem:"Main idea?", choices:["Claims need evidence and reasoning.","Models are poems.","Temperature is random.","Science has opinions only."], answer:"Claims need evidence and reasoning."},
      {id:"Q2", stem:"Best graphic to add:", choices:["Diagram linking claim→evidence→reasoning","Photo of a scientist","Cartoon","Recipe"], answer:"Diagram linking claim→evidence→reasoning"},
      {id:"Q3", stem:"'Supported' most nearly means—", choices:["Backed by evidence","Made up","Ignored","Hidden"], answer:"Backed by evidence"},
      {id:"Q4", stem:"Which sentence is evidence, not a claim?", choices:["Ocean temperatures increased 0.2°C per decade in the dataset.","We should care about oceans.","Models are always right.","The sea is interesting."], answer:"Ocean temperatures increased 0.2°C per decade in the dataset."},
      {id:"Q5", stem:"Text structure mainly—", choices:["Definition with example","Dialogue","Chronology","Narrative"], answer:"Definition with example"},
      {id:"Q6", stem:"What connects evidence to claims?", choices:["Reasoning","Opinion","Luck","Rhymes"], answer:"Reasoning"}
    ]
  },
  // RI 7–8
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
  // RL 7–8
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

// ================== Language Items (expanded) ==================
export const LANG_ITEMS = [];
(function buildLang(){
  const grades = [4,5,6,7,8];

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
  function subjectVerb(){
    const singular = pick(["The team","The class","The puppy","The committee"]);
    const plural   = pick(["The birds","The dogs","The students","The cars"]);
    const templates = [
      { s: singular, ok:"is", wrong:"are" },
      { s: plural,   ok:"are", wrong:"is" }
    ];
    const t = pick(templates);
    const options = shuffle([t.ok, t.wrong, `${t.wrong} `, `${t.ok} `]).map(s=>s.trim());
    const uniq = [...new Set(options)].slice(0,4);
    const withOneCorrect = [t.ok, ...uniq.filter(x=>x!==t.ok)].slice(0,4);
    return {
      stem:`Which completes the sentence correctly? ${t.s} ___ ready.`,
      key: withOneCorrect,
      ans: withOneCorrect.indexOf(t.ok)
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
  function coordinateAdjectives(){
    return {
      stem:"Choose the sentence with coordinate adjectives punctuated correctly.",
      key:[
        "She packed three warm sweaters.",
        "She packed warm, wool sweaters.",
        "She packed warm wool sweaters.",
        "She packed, warm wool, sweaters."
      ],
      ans:2
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
  function verbTenseShift(){
    return {
      stem:"Choose the sentence with correct verb tense consistency.",
      key:[
        "She finishes the essay and turned it in.",
        "She finished the essay and turns it in.",
        "She finished the essay and turned it in.",
        "She finishes the essay and had turned it in."
      ],
      ans:2
    };
  }
  function pronounCase(){
    return {
      stem:"Which pronoun completes the sentence correctly? The coach spoke to Luis and ___.",
      key:["I","me","we","they"],
      ans:1
    };
  }
  function modifiers(){
    return {
      stem:"Choose the sentence with the modifier placed correctly.",
      key:[
        "Running down the hall, the backpack slipped from my shoulder.",
        "Running down the hall, I slipped off my backpack.",
        "I slipped running down the hall my backpack off.",
        "Running down the hall slipped my backpack."
      ],
      ans:1
    };
  }
  function punctuation78(){
    return {
      stem:"Choose the sentence with correct semicolon/colon use.",
      key:[
        "Bring the following: pencils, paper, and water.",
        "Bring the following; pencils, paper, and water.",
        "We were late; because the bus broke down.",
        "We were late: the bus broke down."
      ],
      ans:0
    };
  }
  function rootsAffixes(){
    return {
      stem:"What does 'telegraph' most nearly mean (tele=far)?",
      key:["A device for writing at a distance","A device for writing nearby","A tool for speaking loudly","A tool for measuring time"],
      ans:0
    };
  }
  function contextClues(){
    return {
      stem:"'Arid' most nearly means dry; which clue word in the sentence signals this meaning?",
      key:["because","however","although","and"],
      ans:0
    };
  }
  function confusables(){
    return {
      stem:"Choose the correct word: We went ___ the store.",
      key:["to","too","two","tow"],
      ans:0
    };
  }

  function make(idPrefix, g, diff, spec){
    const ch = spec();
    const answer = ch.key[ch.ans];
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
    if (g === 4 || g === 5){
      LANG_ITEMS.push(make("SER", g, DIFF.CORE, commasSeries));
      LANG_ITEMS.push(make("SV",  g, DIFF.ON,   subjectVerb));
      LANG_ITEMS.push(make("TNS", g, DIFF.ON,   verbTenseShift));
      LANG_ITEMS.push(make("PC",  g, DIFF.CORE, pronounCase));
      LANG_ITEMS.push(make("CTX", g, DIFF.CORE, contextClues));
      LANG_ITEMS.push(make("ROOT",g, DIFF.STRETCH, rootsAffixes));
    } else if (g === 6){
      LANG_ITEMS.push(make("NRC", g, DIFF.CORE, nonrestrictive));
      LANG_ITEMS.push(make("SV",  g, DIFF.ON,   subjectVerb));
      LANG_ITEMS.push(make("MOD", g, DIFF.ON,   modifiers));
      LANG_ITEMS.push(make("TNS", g, DIFF.CORE, verbTenseShift));
      LANG_ITEMS.push(make("ROOT",g, DIFF.STRETCH, rootsAffixes));
      LANG_ITEMS.push(make("CON", g, DIFF.CORE, confusables));
    } else if (g === 7){
      LANG_ITEMS.push(make("NRC", g, DIFF.CORE, nonrestrictive));
      LANG_ITEMS.push(make("CDA", g, DIFF.CORE, coordinateAdjectives));
      LANG_ITEMS.push(make("PRA", g, DIFF.ON,  pronounAntecedent));
      LANG_ITEMS.push(make("VMV", g, DIFF.ON,  verbMoodVoice));
      LANG_ITEMS.push(make("P78", g, DIFF.STRETCH, punctuation78));
      LANG_ITEMS.push(make("MOD", g, DIFF.ON,   modifiers));
    } else if (g === 8){
      LANG_ITEMS.push(make("NRC", g, DIFF.CORE, nonrestrictive));
      LANG_ITEMS.push(make("P78", g, DIFF.ON,   punctuation78));
      LANG_ITEMS.push(make("VMV", g, DIFF.ON,   verbMoodVoice));
      LANG_ITEMS.push(make("PRA", g, DIFF.CORE, pronounAntecedent));
      LANG_ITEMS.push(make("TNS", g, DIFF.CORE, verbTenseShift));
      LANG_ITEMS.push(make("MOD", g, DIFF.STRETCH, modifiers));
    }
  });

  // -------- Curated, standards-aligned pool for grades 2–3 (new foundation) --------
  function mc(grade, diff, stem, answer, choices){
    LANG_ITEMS.push({
      id: `CUR-LANG-${grade}-${diff}-${ri(1000,9999)}`,
      grade_min: grade,
      grade_max: grade,
      strand: "LANG",
      diff,
      stem,
      choices,
      answer,
    });
  }

  // ===== Grade 2 =====
  mc(2, DIFF.CORE, 'Choose the sentence that is a question.', 'Where is my book?', [
    'Where is my book?',
    'I like pizza.',
    'Close the door.',
    'Wow, that is cool!'
  ]);
  mc(2, DIFF.CORE, 'Which word is a noun?', 'dog', ['quickly','dog','run','blue']);
  mc(2, DIFF.CORE, 'Choose the correct plural word.', 'buses', ['bus','buss','buses','bus']);
  mc(2, DIFF.ON, "Choose the correct contraction for do not.", "don't", ['dont',"don't",'do not','doesnt']);
  mc(2, DIFF.ON, 'Choose the correct sentence with capitals and end punctuation.', 'My friend Sam is here.', [
    'my friend Sam is here',
    'My friend sam is here',
    'My friend Sam is here.',
    'My friend Sam is here'
  ]);
  mc(2, DIFF.STRETCH, 'Which word best completes the sentence? “She ___ to school.”', 'walks', ['walk','walks','walking','walked']);

  // ===== Grade 3 =====
  mc(3, DIFF.CORE, 'Which sentence has a compound subject?', 'Tom and Mia play soccer.', [
    'Tom plays soccer.',
    'Tom and Mia play soccer.',
    'Tom plays soccer today.',
    'Soccer is fun.'
  ]);
  mc(3, DIFF.CORE, 'Choose the correct verb: “The dogs ___ loud.”', 'bark', ['bark','barks','barking','barked']);
  mc(3, DIFF.ON, 'Choose the sentence with the correct comma.', 'On Saturday, we went to the park.', [
    'On Saturday we went, to the park.',
    'On Saturday, we went to the park.',
    'On Saturday we went to the park,',
    'On, Saturday we went to the park.'
  ]);
  mc(3, DIFF.ON, 'Choose the correct pronoun: “___ went to the store.”', 'She', ['Her','She','Him','Me']);
  mc(3, DIFF.STRETCH, 'Choose the correct sentence (past tense).', 'We ran to the bus stop.', [
    'We run to the bus stop.',
    'We running to the bus stop.',
    'We ran to the bus stop.',
    'We will run to the bus stop.'
  ]);
})();

// ================== (Optional) Simple 20-item flat pool ==================
// Your app doesn’t need this, but it’s kept for compatibility with older code.
// It samples 10 Math, 5 Reading (any band), 5 Language.
function flattenReading(p) {
  return p.questions.map(q => ({
    question: q.stem,
    options: q.choices,
    answer: q.answer
  }));
}
const MATH_10 = shuffle(MATH_ITEMS).slice(0, 10).map(m => ({
  question: m.stem,
  options: m.choices,
  answer: m.answer
}));
const READING_ALL = PASSAGES.flatMap(flattenReading);
const READING_5 = shuffle(READING_ALL).slice(0, 5);
const LANGUAGE_5 = shuffle((()=>LANG_ITEMS)()).slice(0, 5).map(l => ({
  question: l.stem,
  options: l.choices,
  answer: l.answer
}));
export const questions = shuffle([...MATH_10, ...READING_5, ...LANGUAGE_5]);
