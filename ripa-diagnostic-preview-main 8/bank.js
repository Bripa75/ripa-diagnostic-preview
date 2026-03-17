// bank.js
// NYC/NYSED-aligned expansion for Grades 2–5 with adaptive difficulty.
// Keeps legacy Grades 6–8 content from bank-original.js.

import {
  DIFF as LEGACY_DIFF,
  MATH_ITEMS as LEGACY_MATH_ITEMS,
  PASSAGES as LEGACY_PASSAGES,
  LANG_ITEMS as LEGACY_LANG_ITEMS,
  questions as LEGACY_QUESTIONS
} from './bank-original.js';

export const DIFF = LEGACY_DIFF;
export const STRANDS = { MATH: ["NO","FR","ALG","GEOM","MD"] };

function rngSeeded(seed){ let s = seed>>>0 || 1; return ()=> (s = (s*1664525 + 1013904223)>>>0) / 2**32; }
const rnd = rngSeeded(20260317);
const ri = (a,b)=> a + Math.floor(rnd()*(b-a+1));
const pick = (arr)=> arr[Math.floor(rnd()*arr.length)];
function shuffle(a){ const c=[...a]; for(let i=c.length-1;i>0;i--){ const j=Math.floor(rnd()*(i+1)); [c[i],c[j]]=[c[j],c[i]]; } return c; }
function gcd(a,b){ while(b){ [a,b]=[b,a%b]; } return Math.abs(a||1); }
function lcm(a,b){ return Math.abs(a*b)/gcd(a,b); }
function simplify(n,d){ const g = gcd(n,d); return [n/g, d/g]; }
function mcNum(ans){
  const base = Number(ans);
  const vals = new Set([String(ans)]);
  [1,-1,10,-10,2,-2,5,-5,100,-100].forEach(d=> vals.add(String(base+d)));
  const out = [...vals].slice(0,4);
  return shuffle(out);
}
function mcFrac(n,d){
  const ans = `${n}/${d}`;
  const opts = [ans, `${n+1}/${d}`, `${Math.max(1,n-1)}/${d}`, `${n}/${d+1}`, `${n+1}/${d+1}`];
  return shuffle([...new Set(opts)].slice(0,4));
}
function ensureAnswerFirst(answer, choices){
  const uniq = [...new Set([answer, ...choices])].slice(0,4);
  while (uniq.length < 4) uniq.push(`Choice ${uniq.length+1}`);
  return shuffle(uniq);
}

const curatedMath = [];
const curatedPassages = [];
const curatedLang = [];

function addMath({id,grade,strand,diff,stem,answer,choices,standard_code,skill_tag}){
  curatedMath.push({
    id, grade_min:grade, grade_max:grade, strand, diff, stem, answer,
    choices: ensureAnswerFirst(String(answer), choices.map(String)),
    standard_code, skill_tag
  });
}
function addLang({id,grade,diff,stem,answer,choices,standard_code,skill_tag}){
  curatedLang.push({
    id, grade_min:grade, grade_max:grade, strand:'LANG', diff, stem, answer,
    choices: ensureAnswerFirst(String(answer), choices.map(String)),
    standard_code, skill_tag
  });
}
function addPassage({id,grade,type,text,questions}){
  curatedPassages.push({ id, grade_band:[grade,grade], type, text, questions });
}

function expandChoices(answer, distractors){
  return ensureAnswerFirst(String(answer), distractors.map(String));
}

function buildMathGrade2(){
  const g=2;
  // NO / NBT
  for(let i=0;i<4;i++){
    const a=ri(20,70), b=ri(10,25), ans=a+b;
    addMath({id:`G2-NO-C-${i}`,grade:g,strand:'NO',diff:DIFF.CORE,stem:`What is ${a} + ${b}?`,answer:ans,choices:mcNum(ans),standard_code:'2NBT.B.5',skill_tag:'two-digit addition'});
  }
  for(let i=0;i<4;i++){
    const a=ri(40,99), b=ri(10,39), ans=a-b;
    addMath({id:`G2-NO-CB-${i}`,grade:g,strand:'NO',diff:DIFF.CORE,stem:`What is ${a} - ${b}?`,answer:ans,choices:mcNum(ans),standard_code:'2NBT.B.5',skill_tag:'two-digit subtraction'});
  }
  for(let i=0;i<4;i++){
    const a=ri(120,499), b=ri(30,199), ans=a+b;
    addMath({id:`G2-NO-O-${i}`,grade:g,strand:'NO',diff:DIFF.ON,stem:`What is ${a} + ${b}?`,answer:ans,choices:mcNum(ans),standard_code:'2NBT.B.7',skill_tag:'three-digit addition'});
  }
  for(let i=0;i<4;i++){
    const a=ri(300,900), b=ri(100,299), ans=a-b;
    addMath({id:`G2-NO-O2-${i}`,grade:g,strand:'NO',diff:DIFF.ON,stem:`What is ${a} - ${b}?`,answer:ans,choices:mcNum(ans),standard_code:'2NBT.B.7',skill_tag:'three-digit subtraction'});
  }
  for(let i=0;i<4;i++){
    const n=ri(100,999), place = pick(['hundreds','tens','ones']);
    const ans = place==='hundreds' ? Math.floor(n/100)%10 : place==='tens' ? Math.floor(n/10)%10 : n%10;
    addMath({id:`G2-NO-S-${i}`,grade:g,strand:'NO',diff:DIFF.STRETCH,stem:`In ${n}, what digit is in the ${place} place?`,answer:ans,choices:mcNum(ans),standard_code:'2NBT.A.1',skill_tag:'place value'});
  }
  for(let i=0;i<4;i++){
    const n=ri(101,999);
    const ans = Math.round(n/100)*100;
    addMath({id:`G2-NO-S2-${i}`,grade:g,strand:'NO',diff:DIFF.STRETCH,stem:`Round ${n} to the nearest hundred.`,answer:ans,choices:mcNum(ans),standard_code:'2NBT.A.3',skill_tag:'round to hundred'});
  }

  // ALG / OA
  for(let i=0;i<4;i++){
    const groups=ri(2,5), each=ri(2,5), ans=groups*each;
    addMath({id:`G2-ALG-C-${i}`,grade:g,strand:'ALG',diff:DIFF.CORE,stem:`There are ${groups} bags with ${each} apples in each bag. How many apples are there in all?`,answer:ans,choices:mcNum(ans),standard_code:'2OA.A.1',skill_tag:'equal groups'});
  }
  for(let i=0;i<4;i++){
    const n=ri(10,40), ans=n%2===0?'even':'odd';
    addMath({id:`G2-ALG-C2-${i}`,grade:g,strand:'ALG',diff:DIFF.CORE,stem:`Is ${n} even or odd?`,answer:ans,choices:['even','odd','both','neither'],standard_code:'2OA.C.3',skill_tag:'even odd'});
  }
  for(let i=0;i<4;i++){
    const repeats=ri(3,5), addend=ri(2,6), total=repeats*addend;
    addMath({id:`G2-ALG-O-${i}`,grade:g,strand:'ALG',diff:DIFF.ON,stem:`Which equation matches ${addend} + ${addend} + ${addend}${repeats===4?` + ${addend}`:''}${repeats===5?` + ${addend} + ${addend}`:''}?`,answer:`${repeats} × ${addend} = ${total}`,choices:[`${repeats} × ${addend} = ${total}`,`${addend} × ${repeats+1} = ${total+addend}`,`${repeats} + ${addend} = ${repeats+addend}`,`${total} - ${addend} = ${repeats}`],standard_code:'2OA.A.1',skill_tag:'repeated addition'});
  }
  for(let i=0;i<4;i++){
    const total=ri(12,30), groups=pick([2,3,5]), ans=total/groups;
    if (!Number.isInteger(ans)) continue;
    addMath({id:`G2-ALG-O2-${i}`,grade:g,strand:'ALG',diff:DIFF.ON,stem:`${total} stickers are shared equally into ${groups} groups. How many stickers are in each group?`,answer:ans,choices:mcNum(ans),standard_code:'2OA.A.1',skill_tag:'equal shares'});
  }
  for(let i=0;i<4;i++){
    const start=ri(20,60), add1=ri(5,20), add2=ri(5,20), ans=start+add1+add2;
    addMath({id:`G2-ALG-S-${i}`,grade:g,strand:'ALG',diff:DIFF.STRETCH,stem:`Lena has ${start} beads. She gets ${add1} more and then ${add2} more. How many beads does she have now?`,answer:ans,choices:mcNum(ans),standard_code:'2OA.A.1',skill_tag:'two-step add'});
  }
  for(let i=0;i<4;i++){
    const total=ri(18,36), take=ri(4,9), left=total-take, extra=ri(3,8), ans=left+extra;
    addMath({id:`G2-ALG-S2-${i}`,grade:g,strand:'ALG',diff:DIFF.STRETCH,stem:`A class had ${total} crayons. ${take} broke. Then the teacher added ${extra} new crayons. How many crayons are there now?`,answer:ans,choices:mcNum(ans),standard_code:'2OA.A.1',skill_tag:'two-step word problem'});
  }

  // FR / equal shares foundation
  for(let i=0;i<4;i++){
    const denom=pick([2,3,4]);
    addMath({id:`G2-FR-C-${i}`,grade:g,strand:'FR',diff:DIFF.CORE,stem:`A shape is split into ${denom} equal parts. One part is called what?`,answer:`1/${denom}`,choices:[`1/${denom}`,`1/${denom+1}`,'1/1',`${denom}/1`],standard_code:'2G.A.3',skill_tag:'unit fraction name'});
  }
  for(let i=0;i<4;i++){
    const denom=pick([2,3,4]);
    const shaded=ri(1,denom-1);
    addMath({id:`G2-FR-C2-${i}`,grade:g,strand:'FR',diff:DIFF.CORE,stem:`A picture has ${denom} equal parts. ${shaded} parts are shaded. Which fraction names the shaded part?`,answer:`${shaded}/${denom}`,choices:mcFrac(shaded,denom),standard_code:'2G.A.3',skill_tag:'fraction from model'});
  }
  for(let i=0;i<4;i++){
    const opts = [['1/2','1/3'],['1/2','1/4'],['1/3','1/4'],['2/4','3/4']][i%4];
    const ans = opts[0]==='2/4'?'3/4':opts[0];
    const stem = ans==='3/4' ? 'Which fraction is greater?' : `Which fraction is greater: ${opts[0]} or ${opts[1]}?`;
    addMath({id:`G2-FR-O-${i}`,grade:g,strand:'FR',diff:DIFF.ON,stem,answer:ans,choices:[opts[0],opts[1],'They are equal','Not enough information'],standard_code:'2G.A.3',skill_tag:'compare simple fractions'});
  }
  for(let i=0;i<4;i++){
    const denom=pick([2,4]);
    const shaded=denom/2;
    addMath({id:`G2-FR-O2-${i}`,grade:g,strand:'FR',diff:DIFF.ON,stem:`Which fraction shows one half?`,answer:`${shaded}/${denom}`,choices:[`${shaded}/${denom}`,`1/${denom}`,`${denom}/2`,`2/${denom}`],standard_code:'2G.A.3',skill_tag:'recognize one half'});
  }
  for(let i=0;i<4;i++){
    const denom=pick([3,4]);
    const more = denom===3 ? '1/2' : '3/4';
    addMath({id:`G2-FR-S-${i}`,grade:g,strand:'FR',diff:DIFF.STRETCH,stem:`Which fraction is larger than 1/${denom}?`,answer:more,choices:[`1/${denom}`,more,'1/8','1/10'],standard_code:'2G.A.3',skill_tag:'compare by size'});
  }
  for(let i=0;i<4;i++){
    const denom=4, shaded=pick([1,2,3]);
    addMath({id:`G2-FR-S2-${i}`,grade:g,strand:'FR',diff:DIFF.STRETCH,stem:`If 2 of 4 equal parts are shaded, that is the same as which fraction?`,answer:'1/2',choices:['1/2','1/4','2/8','4/2'],standard_code:'2G.A.3',skill_tag:'equivalent visual halves'});
  }

  // GEOM
  const shapeData = [
    ['triangle',3,3],['rectangle',4,4],['pentagon',5,5],['hexagon',6,6]
  ];
  for(let i=0;i<4;i++){
    const [shape,sides] = shapeData[i];
    addMath({id:`G2-GEOM-C-${i}`,grade:g,strand:'GEOM',diff:DIFF.CORE,stem:`How many sides does a ${shape} have?`,answer:sides,choices:mcNum(sides),standard_code:'2G.A.1',skill_tag:'count sides'});
  }
  for(let i=0;i<4;i++){
    const [shape,,verts] = shapeData[i];
    addMath({id:`G2-GEOM-C2-${i}`,grade:g,strand:'GEOM',diff:DIFF.CORE,stem:`How many vertices does a ${shape} have?`,answer:verts,choices:mcNum(verts),standard_code:'2G.A.1',skill_tag:'count vertices'});
  }
  for(let i=0;i<4;i++){
    const ans = pick(['triangle','quadrilateral']);
    const stem = ans==='triangle' ? 'Which shape has 3 sides?' : 'Which shape has 4 sides?';
    addMath({id:`G2-GEOM-O-${i}`,grade:g,strand:'GEOM',diff:DIFF.ON,stem,answer:ans,choices:['triangle','quadrilateral','pentagon','hexagon'],standard_code:'2G.A.1',skill_tag:'classify shapes'});
  }
  for(let i=0;i<4;i++){
    addMath({id:`G2-GEOM-O2-${i}`,grade:g,strand:'GEOM',diff:DIFF.ON,stem:`Which shape has all sides the same length?`,answer:'square',choices:['rectangle','triangle','square','oval'],standard_code:'2G.A.1',skill_tag:'attributes of square'});
  }
  for(let i=0;i<4;i++){
    const shape = pick(['rectangle','circle']);
    const ans = shape==='rectangle' ? 'corners' : 'curved edge';
    addMath({id:`G2-GEOM-S-${i}`,grade:g,strand:'GEOM',diff:DIFF.STRETCH,stem:`What does a ${shape} have?`,answer:ans,choices:['corners','curved edge','both','neither'],standard_code:'2G.A.1',skill_tag:'shape attributes'});
  }
  for(let i=0;i<4;i++){
    addMath({id:`G2-GEOM-S2-${i}`,grade:g,strand:'GEOM',diff:DIFF.STRETCH,stem:`A shape has 6 sides. What shape is it?`,answer:'hexagon',choices:['triangle','square','pentagon','hexagon'],standard_code:'2G.A.1',skill_tag:'identify hexagon'});
  }

  // MD
  for(let i=0;i<4;i++){
    const h=ri(1,4), ans=h*60;
    addMath({id:`G2-MD-C-${i}`,grade:g,strand:'MD',diff:DIFF.CORE,stem:`How many minutes are in ${h} hour${h>1?'s':''}?`,answer:ans,choices:mcNum(ans),standard_code:'2MD.C.7',skill_tag:'minutes in hours'});
  }
  for(let i=0;i<4;i++){
    const quarters=ri(1,3), dimes=ri(0,3), pennies=ri(0,4), ans=25*quarters+10*dimes+pennies;
    addMath({id:`G2-MD-C2-${i}`,grade:g,strand:'MD',diff:DIFF.CORE,stem:`You have ${quarters} quarter${quarters>1?'s':''}, ${dimes} dime${dimes!==1?'s':''}, and ${pennies} penn${pennies===1?'y':'ies'}. How many cents in all?`,answer:ans,choices:mcNum(ans),standard_code:'2MD.C.8',skill_tag:'count money'});
  }
  for(let i=0;i<4;i++){
    const hour=ri(1,11), mins=pick([5,10,15,20,25,30,35,40,45,50,55]), add=pick([5,10,15,20]);
    let total=hour*60+mins+add; let nh=Math.floor(total/60)%12; if(nh===0) nh=12; let nm=total%60;
    addMath({id:`G2-MD-O-${i}`,grade:g,strand:'MD',diff:DIFF.ON,stem:`If it is ${hour}:${String(mins).padStart(2,'0')} now, what time will it be in ${add} minutes?`,answer:`${nh}:${String(nm).padStart(2,'0')}`,choices:[`${nh}:${String(nm).padStart(2,'0')}`,`${hour}:${String((mins+add)%60).padStart(2,'0')}`,`${hour}:${String(mins).padStart(2,'0')}`,`${(hour%12)+1}:${String(mins).padStart(2,'0')}`],standard_code:'2MD.C.7',skill_tag:'time forward'});
  }
  for(let i=0;i<4;i++){
    const a=ri(10,30), b=ri(3,9), ans=a-b;
    addMath({id:`G2-MD-O2-${i}`,grade:g,strand:'MD',diff:DIFF.ON,stem:`One ribbon is ${a} cm long. Another is ${b} cm shorter. How long is the shorter ribbon?`,answer:ans,choices:mcNum(ans),standard_code:'2MD.A.1',skill_tag:'length difference'});
  }
  for(let i=0;i<4;i++){
    const a=ri(10,25), b=ri(5,15), c=ri(3,10), ans=a+b-c;
    addMath({id:`G2-MD-S-${i}`,grade:g,strand:'MD',diff:DIFF.STRETCH,stem:`A plant grew ${a} cm in spring and ${b} cm in summer, then lost ${c} cm. How tall did it grow in all?`,answer:ans,choices:mcNum(ans),standard_code:'2MD.B.5',skill_tag:'length word problem'});
  }
  for(let i=0;i<4;i++){
    const q=ri(1,3), n=ri(1,4), d=ri(0,2), p=ri(0,4), ans=q*25+n*5+d*10+p;
    addMath({id:`G2-MD-S2-${i}`,grade:g,strand:'MD',diff:DIFF.STRETCH,stem:`How much money is ${q} quarter${q>1?'s':''}, ${d} dime${d!==1?'s':''}, ${n} nickel${n!==1?'s':''}, and ${p} penn${p===1?'y':'ies'}?`,answer:ans,choices:mcNum(ans),standard_code:'2MD.C.8',skill_tag:'mixed coins'});
  }
}

function buildMathGrade3(){
  const g=3;
  // NO
  for(let i=0;i<4;i++){
    const a=ri(120,499), b=ri(20,99), ans=a+b;
    addMath({id:`G3-NO-C-${i}`,grade:g,strand:'NO',diff:DIFF.CORE,stem:`What is ${a} + ${b}?`,answer:ans,choices:mcNum(ans),standard_code:'3NBT.A.2',skill_tag:'add within 1000'});
  }
  for(let i=0;i<4;i++){
    const a=ri(400,999), b=ri(120,399), ans=a-b;
    addMath({id:`G3-NO-C2-${i}`,grade:g,strand:'NO',diff:DIFF.CORE,stem:`What is ${a} - ${b}?`,answer:ans,choices:mcNum(ans),standard_code:'3NBT.A.2',skill_tag:'subtract within 1000'});
  }
  for(let i=0;i<4;i++){
    const n=ri(120,890), ans=Math.round(n/10)*10;
    addMath({id:`G3-NO-O-${i}`,grade:g,strand:'NO',diff:DIFF.ON,stem:`Round ${n} to the nearest ten.`,answer:ans,choices:mcNum(ans),standard_code:'3NBT.A.1',skill_tag:'round nearest ten'});
  }
  for(let i=0;i<4;i++){
    const n=ri(120,890), ans=Math.round(n/100)*100;
    addMath({id:`G3-NO-O2-${i}`,grade:g,strand:'NO',diff:DIFF.ON,stem:`Round ${n} to the nearest hundred.`,answer:ans,choices:mcNum(ans),standard_code:'3NBT.A.1',skill_tag:'round nearest hundred'});
  }
  for(let i=0;i<4;i++){
    const a=ri(200,499), b=ri(100,299), ans=Math.round((a+b)/100)*100;
    addMath({id:`G3-NO-S-${i}`,grade:g,strand:'NO',diff:DIFF.STRETCH,stem:`Which estimate is closest to ${a} + ${b}?`,answer:ans,choices:mcNum(ans),standard_code:'3NBT.A.1',skill_tag:'estimate sum'});
  }
  for(let i=0;i<4;i++){
    const a=ri(80,120), b=ri(6,9), ans=a*b;
    addMath({id:`G3-NO-S2-${i}`,grade:g,strand:'NO',diff:DIFF.STRETCH,stem:`What is ${a} × ${b}?`,answer:ans,choices:mcNum(ans),standard_code:'3NBT.A.3',skill_tag:'multiply by one digit'});
  }

  // ALG OA
  for(let i=0;i<6;i++){
    const a=ri(2,9), b=ri(2,9), ans=a*b;
    addMath({id:`G3-ALG-C-${i}`,grade:g,strand:'ALG',diff:DIFF.CORE,stem:`What is ${a} × ${b}?`,answer:ans,choices:mcNum(ans),standard_code:'3OA.A.1',skill_tag:'basic multiplication'});
  }
  for(let i=0;i<6;i++){
    const b=ri(2,9), ans=ri(2,9), total=b*ans;
    addMath({id:`G3-ALG-C2-${i}`,grade:g,strand:'ALG',diff:DIFF.CORE,stem:`What is ${total} ÷ ${b}?`,answer:ans,choices:mcNum(ans),standard_code:'3OA.A.2',skill_tag:'basic division'});
  }
  for(let i=0;i<6;i++){
    const groups=ri(3,8), each=ri(2,9), ans=groups*each;
    addMath({id:`G3-ALG-O-${i}`,grade:g,strand:'ALG',diff:DIFF.ON,stem:`A teacher has ${groups} trays with ${each} pencils in each tray. How many pencils are there in all?`,answer:ans,choices:mcNum(ans),standard_code:'3OA.A.3',skill_tag:'equal groups word problem'});
  }
  for(let i=0;i<6;i++){
    const total=pick([24,30,36,42,48,54]), groups=pick([2,3,4,6,7,8,9]);
    if(total % groups !==0) continue;
    const ans=total/groups;
    addMath({id:`G3-ALG-O2-${i}`,grade:g,strand:'ALG',diff:DIFF.ON,stem:`${total} stickers are shared equally among ${groups} students. How many stickers does each student get?`,answer:ans,choices:mcNum(ans),standard_code:'3OA.A.2',skill_tag:'division word problem'});
  }
  for(let i=0;i<6;i++){
    const start=ri(10,30), rows=ri(3,5), per=ri(3,6), ans=start+rows*per;
    addMath({id:`G3-ALG-S-${i}`,grade:g,strand:'ALG',diff:DIFF.STRETCH,stem:`Jada had ${start} marbles. She won ${rows} bags with ${per} marbles in each bag. How many marbles does she have now?`,answer:ans,choices:mcNum(ans),standard_code:'3OA.D.8',skill_tag:'two-step multiplication'});
  }
  for(let i=0;i<6;i++){
    const total=pick([24,30,36,42]), groups=pick([3,4,6]), extra=ri(2,7);
    if(total % groups !==0) continue;
    const ans=(total/groups)+extra;
    addMath({id:`G3-ALG-S2-${i}`,grade:g,strand:'ALG',diff:DIFF.STRETCH,stem:`${total} books are placed equally on ${groups} shelves. Then ${extra} more books are added to each shelf. How many books are on each shelf now?`,answer:ans,choices:mcNum(ans),standard_code:'3OA.D.8',skill_tag:'two-step division/addition'});
  }

  // FR NF
  for(let i=0;i<4;i++){
    const d=pick([2,3,4,6,8]), n=ri(1,d-1);
    addMath({id:`G3-FR-C-${i}`,grade:g,strand:'FR',diff:DIFF.CORE,stem:`Which fraction names ${n} shaded parts out of ${d} equal parts?`,answer:`${n}/${d}`,choices:mcFrac(n,d),standard_code:'3NF.A.1',skill_tag:'fraction on model'});
  }
  for(let i=0;i<4;i++){
    const base = pick([[1,2,2,4],[2,3,4,6],[3,4,6,8],[1,3,2,6]]);
    addMath({id:`G3-FR-C2-${i}`,grade:g,strand:'FR',diff:DIFF.CORE,stem:`Which fraction is equivalent to ${base[0]}/${base[1]}?`,answer:`${base[2]}/${base[3]}`,choices:[`${base[2]}/${base[3]}`,`${base[0]}/${base[3]}`,`${base[1]}/${base[3]}`,`${base[2]}/${base[1]}`],standard_code:'3NF.A.3',skill_tag:'equivalent fraction'});
  }
  for(let i=0;i<4;i++){
    const options = [['3/4','2/4'],['5/6','4/6'],['2/3','1/3'],['7/8','5/8']][i];
    addMath({id:`G3-FR-O-${i}`,grade:g,strand:'FR',diff:DIFF.ON,stem:`Which fraction is greater: ${options[0]} or ${options[1]}?`,answer:options[0],choices:[options[0],options[1],'They are equal','Cannot tell'],standard_code:'3NF.A.3d',skill_tag:'compare same denominator'});
  }
  for(let i=0;i<4;i++){
    const d=pick([4,6,8]), a=ri(1,d-2), b=ri(1,d-a-1), num=a+b;
    addMath({id:`G3-FR-O2-${i}`,grade:g,strand:'FR',diff:DIFF.ON,stem:`What is ${a}/${d} + ${b}/${d}?`,answer:`${num}/${d}`,choices:[`${num}/${d}`,`${num+1}/${d}`,`${num}/${d+1}`,`${a+b-1}/${d}`],standard_code:'3NF.A.1',skill_tag:'compose fractions'});
  }
  for(let i=0;i<4;i++){
    const unit=pick([2,3,4,6,8]); const count=ri(2,5); const num=count;
    addMath({id:`G3-FR-S-${i}`,grade:g,strand:'FR',diff:DIFF.STRETCH,stem:`How many 1/${unit} pieces make ${num}/${unit}?`,answer:count,choices:mcNum(count),standard_code:'3NF.A.1',skill_tag:'fraction as count of unit fractions'});
  }
  for(let i=0;i<4;i++){
    const larger = pick(['3/4','5/6','7/8','2/3']);
    addMath({id:`G3-FR-S2-${i}`,grade:g,strand:'FR',diff:DIFF.STRETCH,stem:`Which fraction is closest to 1 whole?`,answer:larger,choices:['1/2','2/4',larger,'1/3'],standard_code:'3NF.A.3',skill_tag:'fraction size sense'});
  }

  // GEOM
  for(let i=0;i<4;i++){
    addMath({id:`G3-GEOM-C-${i}`,grade:g,strand:'GEOM',diff:DIFF.CORE,stem:`Which shape is a quadrilateral?`,answer:'rectangle',choices:['triangle','rectangle','pentagon','hexagon'],standard_code:'3G.A.1',skill_tag:'quadrilateral'});
  }
  for(let i=0;i<4;i++){
    const shape=pick(['pentagon','hexagon']); const ans=shape==='pentagon'?5:6;
    addMath({id:`G3-GEOM-C2-${i}`,grade:g,strand:'GEOM',diff:DIFF.CORE,stem:`How many sides does a ${shape} have?`,answer:ans,choices:mcNum(ans),standard_code:'3G.A.1',skill_tag:'polygon sides'});
  }
  for(let i=0;i<4;i++){
    addMath({id:`G3-GEOM-O-${i}`,grade:g,strand:'GEOM',diff:DIFF.ON,stem:`How many right angles does a rectangle have?`,answer:4,choices:mcNum(4),standard_code:'3G.A.1',skill_tag:'right angles rectangle'});
  }
  for(let i=0;i<4;i++){
    addMath({id:`G3-GEOM-O2-${i}`,grade:g,strand:'GEOM',diff:DIFF.ON,stem:`Which shape has exactly 3 sides?`,answer:'triangle',choices:['triangle','rectangle','hexagon','circle'],standard_code:'3G.A.1',skill_tag:'shape identification'});
  }
  for(let i=0;i<4;i++){
    addMath({id:`G3-GEOM-S-${i}`,grade:g,strand:'GEOM',diff:DIFF.STRETCH,stem:`A shape has 4 sides and 4 right angles. Which shape could it be?`,answer:'rectangle',choices:['triangle','rectangle','hexagon','trapezoid'],standard_code:'3G.A.1',skill_tag:'shape attributes'});
  }
  for(let i=0;i<4;i++){
    addMath({id:`G3-GEOM-S2-${i}`,grade:g,strand:'GEOM',diff:DIFF.STRETCH,stem:`Which shape can be split into 2 equal halves?`,answer:'rectangle',choices:['rectangle','triangle','hexagon','all of them'],standard_code:'3G.A.2',skill_tag:'partition shapes'});
  }

  // MD
  for(let i=0;i<4;i++){
    const l=ri(3,9), w=ri(2,8), ans=l*w;
    addMath({id:`G3-MD-C-${i}`,grade:g,strand:'MD',diff:DIFF.CORE,stem:`A rectangle is ${l} units long and ${w} units wide. What is its area?`,answer:ans,choices:mcNum(ans),standard_code:'3MD.C.7',skill_tag:'area'});
  }
  for(let i=0;i<4;i++){
    const l=ri(4,8), w=ri(3,6), ans=2*(l+w);
    addMath({id:`G3-MD-C2-${i}`,grade:g,strand:'MD',diff:DIFF.CORE,stem:`A rectangle is ${l} units long and ${w} units wide. What is its perimeter?`,answer:ans,choices:mcNum(ans),standard_code:'3MD.D.8',skill_tag:'perimeter'});
  }
  for(let i=0;i<4;i++){
    const startH=ri(1,10), startM=pick([0,5,10,15,20,25,30,35,40,45,50,55]), dur=pick([15,20,25,30,35,40,45]);
    let total=startH*60+startM+dur; let nh=Math.floor(total/60)%12; if(nh===0) nh=12; let nm=total%60;
    addMath({id:`G3-MD-O-${i}`,grade:g,strand:'MD',diff:DIFF.ON,stem:`A game starts at ${startH}:${String(startM).padStart(2,'0')} and lasts ${dur} minutes. When does it end?`,answer:`${nh}:${String(nm).padStart(2,'0')}`,choices:[`${nh}:${String(nm).padStart(2,'0')}`,`${startH}:${String((startM+dur)%60).padStart(2,'0')}`,`${(startH%12)+1}:${String(startM).padStart(2,'0')}`,`${nh}:${String(startM).padStart(2,'0')}`],standard_code:'3MD.A.1',skill_tag:'elapsed time'});
  }
  for(let i=0;i<4;i++){
    const arr = Array.from({length:5}, ()=>ri(2,12)).sort((a,b)=>a-b); const med=arr[2];
    addMath({id:`G3-MD-O2-${i}`,grade:g,strand:'MD',diff:DIFF.ON,stem:`Find the median of ${arr.join(', ')}.`,answer:med,choices:mcNum(med),standard_code:'3MD.B.3',skill_tag:'median'});
  }
  for(let i=0;i<4;i++){
    const l=ri(5,10), w=ri(3,8), extra=ri(1,4), ans=2*(l+w)+extra;
    addMath({id:`G3-MD-S-${i}`,grade:g,strand:'MD',diff:DIFF.STRETCH,stem:`A garden is ${l} by ${w} feet. A fence around it needs ${extra} extra feet for a gate. How many feet of fence are needed?`,answer:ans,choices:mcNum(ans),standard_code:'3MD.D.8',skill_tag:'perimeter word problem'});
  }
  for(let i=0;i<4;i++){
    const l=ri(4,9), w=ri(3,7), remove=ri(1,6), ans=l*w-remove;
    addMath({id:`G3-MD-S2-${i}`,grade:g,strand:'MD',diff:DIFF.STRETCH,stem:`A tile floor covers ${l} × ${w} = ? square units, but ${remove} tiles are broken and removed. How many good tiles remain?`,answer:ans,choices:mcNum(ans),standard_code:'3MD.C.7',skill_tag:'area minus'});
  }
}

function buildMathGrade4(){
  const g=4;
  // NO/NBT
  for(let i=0;i<5;i++){
    const n=ri(10000,99999), place=pick(['ten thousand','thousand','hundred','ten']);
    const ans = place==='ten thousand'?Math.floor(n/10000)%10:place==='thousand'?Math.floor(n/1000)%10:place==='hundred'?Math.floor(n/100)%10:Math.floor(n/10)%10;
    addMath({id:`G4-NO-C-${i}`,grade:g,strand:'NO',diff:DIFF.CORE,stem:`In ${n.toLocaleString()}, what digit is in the ${place} place?`,answer:ans,choices:mcNum(ans),standard_code:'4NBT.A.1',skill_tag:'place value'});
  }
  for(let i=0;i<5;i++){
    const a=ri(2000,9000), b=ri(200,999), ans=a+b;
    addMath({id:`G4-NO-C2-${i}`,grade:g,strand:'NO',diff:DIFF.CORE,stem:`What is ${a.toLocaleString()} + ${b.toLocaleString()}?`,answer:ans,choices:mcNum(ans),standard_code:'4NBT.B.4',skill_tag:'multi-digit addition'});
  }
  for(let i=0;i<5;i++){
    const a=ri(5000,9999), b=ri(1000,4999), ans=a-b;
    addMath({id:`G4-NO-O-${i}`,grade:g,strand:'NO',diff:DIFF.ON,stem:`What is ${a.toLocaleString()} - ${b.toLocaleString()}?`,answer:ans,choices:mcNum(ans),standard_code:'4NBT.B.4',skill_tag:'multi-digit subtraction'});
  }
  for(let i=0;i<5;i++){
    const n=ri(10000,99999), ans=Math.round(n/1000)*1000;
    addMath({id:`G4-NO-O2-${i}`,grade:g,strand:'NO',diff:DIFF.ON,stem:`Round ${n.toLocaleString()} to the nearest thousand.`,answer:ans,choices:mcNum(ans),standard_code:'4NBT.A.3',skill_tag:'round nearest thousand'});
  }
  for(let i=0;i<5;i++){
    const a=ri(20,99), b=ri(3,9), ans=a*b;
    addMath({id:`G4-NO-S-${i}`,grade:g,strand:'NO',diff:DIFF.STRETCH,stem:`What is ${a} × ${b}?`,answer:ans,choices:mcNum(ans),standard_code:'4NBT.B.5',skill_tag:'2-digit by 1-digit'});
  }
  for(let i=0;i<5;i++){
    const n=pick([240,360,420,540,630,720]), d=pick([3,4,5,6,7,8,9]); if(n%d!==0) continue;
    const ans=n/d;
    addMath({id:`G4-NO-S2-${i}`,grade:g,strand:'NO',diff:DIFF.STRETCH,stem:`What is ${n} ÷ ${d}?`,answer:ans,choices:mcNum(ans),standard_code:'4NBT.B.6',skill_tag:'whole number division'});
  }

  // ALG/OA
  for(let i=0;i<5;i++){
    const factor=ri(2,9), value=ri(4,12), ans=factor*value;
    addMath({id:`G4-ALG-C-${i}`,grade:g,strand:'ALG',diff:DIFF.CORE,stem:`A bag weighs ${factor} times as much as a book. The book weighs ${value} pounds. How much does the bag weigh?`,answer:ans,choices:mcNum(ans),standard_code:'4OA.A.2',skill_tag:'multiplicative comparison'});
  }
  for(let i=0;i<5;i++){
    const a=ri(11,29), b=ri(2,9), ans=a*b;
    addMath({id:`G4-ALG-C2-${i}`,grade:g,strand:'ALG',diff:DIFF.CORE,stem:`What is ${a} × ${b}?`,answer:ans,choices:mcNum(ans),standard_code:'4NBT.B.5',skill_tag:'multiply'});
  }
  for(let i=0;i<5;i++){
    const total=pick([96,108,120,144,168]), groups=pick([3,4,6,8]); if(total%groups!==0) continue;
    const ans=total/groups;
    addMath({id:`G4-ALG-O-${i}`,grade:g,strand:'ALG',diff:DIFF.ON,stem:`${total} baseball cards are packed equally into ${groups} boxes. How many cards are in each box?`,answer:ans,choices:mcNum(ans),standard_code:'4OA.A.3',skill_tag:'division word problem'});
  }
  for(let i=0;i<5;i++){
    const start=ri(120,300), add=ri(30,90), bags=ri(3,6), per=ri(6,9), ans=start+add-bags*per;
    addMath({id:`G4-ALG-O2-${i}`,grade:g,strand:'ALG',diff:DIFF.ON,stem:`A store had ${start} balloons, got ${add} more, and sold ${bags} bags of ${per} balloons each. How many balloons are left?`,answer:ans,choices:mcNum(ans),standard_code:'4OA.A.3',skill_tag:'two-step mixed operations'});
  }
  for(let i=0;i<5;i++){
    const x=ri(6,18), a=ri(2,7), b=a*x;
    addMath({id:`G4-ALG-S-${i}`,grade:g,strand:'ALG',diff:DIFF.STRETCH,stem:`Solve: ${a} × n = ${b}. What is n?`,answer:x,choices:mcNum(x),standard_code:'4OA.A.1',skill_tag:'unknown factor'});
  }
  for(let i=0;i<5;i++){
    const x=ri(10,30), add=ri(5,15), total=x+add;
    addMath({id:`G4-ALG-S2-${i}`,grade:g,strand:'ALG',diff:DIFF.STRETCH,stem:`Solve: n + ${add} = ${total}. What is n?`,answer:x,choices:mcNum(x),standard_code:'4OA.A.3',skill_tag:'one-step equation'});
  }

  // FR/NF
  for(let i=0;i<5;i++){
    const base = pick([[1,2,2,4],[2,3,4,6],[3,4,6,8],[2,5,4,10],[3,6,1,2]]);
    addMath({id:`G4-FR-C-${i}`,grade:g,strand:'FR',diff:DIFF.CORE,stem:`Which fraction is equivalent to ${base[0]}/${base[1]}?`,answer:`${base[2]}/${base[3]}`,choices:[`${base[2]}/${base[3]}`,`${base[0]}/${base[3]}`,`${base[1]}/${base[3]}`,`${base[2]}/${base[1]}`],standard_code:'4NF.A.1',skill_tag:'equivalent fractions'});
  }
  for(let i=0;i<5;i++){
    const d=pick([4,5,6,8,10]), a=ri(1,d-2), b=ri(1,d-a-1), num=a+b;
    addMath({id:`G4-FR-C2-${i}`,grade:g,strand:'FR',diff:DIFF.CORE,stem:`What is ${a}/${d} + ${b}/${d}?`,answer:`${num}/${d}`,choices:[`${num}/${d}`,`${num+1}/${d}`,`${num}/${d+1}`,`${num-1}/${d}`],standard_code:'4NF.B.3a',skill_tag:'add like denominators'});
  }
  for(let i=0;i<5;i++){
    const d=pick([4,5,6,8,10]), a=ri(2,d-1), b=ri(1,a-1), num=a-b;
    addMath({id:`G4-FR-O-${i}`,grade:g,strand:'FR',diff:DIFF.ON,stem:`What is ${a}/${d} - ${b}/${d}?`,answer:`${num}/${d}`,choices:[`${num}/${d}`,`${num+1}/${d}`,`${a+b}/${d}`,`${num}/${d+1}`],standard_code:'4NF.B.3b',skill_tag:'subtract like denominators'});
  }
  for(let i=0;i<5;i++){
    const whole=ri(2,6), n=pick([1,2,3]), d=pick([3,4,5,6]), num=whole*d+n;
    addMath({id:`G4-FR-O2-${i}`,grade:g,strand:'FR',diff:DIFF.ON,stem:`Which improper fraction is equal to ${whole} ${n}/${d}?`,answer:`${num}/${d}`,choices:[`${num}/${d}`,`${whole+n}/${d}`,`${whole*d-n}/${d}`,`${num}/${whole}`],standard_code:'4NF.B.3c',skill_tag:'mixed number to improper'});
  }
  for(let i=0;i<5;i++){
    const whole=ri(2,7), n=pick([1,2,3,4]), d=pick([4,5,6,8]), num=whole*n;
    addMath({id:`G4-FR-S-${i}`,grade:g,strand:'FR',diff:DIFF.STRETCH,stem:`What is ${whole} × ${n}/${d}?`,answer:`${num}/${d}`,choices:[`${num}/${d}`,`${whole+n}/${d}`,`${whole*n}/${d+1}`,`${whole}/${n*d}`],standard_code:'4NF.B.4c',skill_tag:'multiply fraction by whole'});
  }
  for(let i=0;i<5;i++){
    const num=pick([3,7,12,25]), ans=`${num*10}/100`;
    addMath({id:`G4-FR-S2-${i}`,grade:g,strand:'FR',diff:DIFF.STRETCH,stem:`Write ${num}/10 as an equivalent fraction with denominator 100.`,answer:ans,choices:[ans,`${num}/100`,`${num*100}/100`,`${num+10}/100`],standard_code:'4NF.C.5',skill_tag:'tenths to hundredths'});
  }

  // GEOM
  for(let i=0;i<5;i++){
    const angle=pick([30,45,60,90,120,150]); const ans=angle===90?'right':angle<90?'acute':'obtuse';
    addMath({id:`G4-GEOM-C-${i}`,grade:g,strand:'GEOM',diff:DIFF.CORE,stem:`What kind of angle is ${angle}°?`,answer:ans,choices:['acute','right','obtuse','straight'],standard_code:'4G.A.1',skill_tag:'classify angles'});
  }
  for(let i=0;i<5;i++){
    addMath({id:`G4-GEOM-C2-${i}`,grade:g,strand:'GEOM',diff:DIFF.CORE,stem:`Perpendicular lines do what?`,answer:'meet to make a right angle',choices:['never meet','meet to make a right angle','curve','cross without any angle'],standard_code:'4G.A.1',skill_tag:'perpendicular lines'});
  }
  for(let i=0;i<5;i++){
    addMath({id:`G4-GEOM-O-${i}`,grade:g,strand:'GEOM',diff:DIFF.ON,stem:`Parallel lines do what?`,answer:'stay the same distance apart and never meet',choices:['cross at one point','stay the same distance apart and never meet','form a right angle','curve inward'],standard_code:'4G.A.1',skill_tag:'parallel lines'});
  }
  for(let i=0;i<5;i++){
    addMath({id:`G4-GEOM-O2-${i}`,grade:g,strand:'GEOM',diff:DIFF.ON,stem:`How many lines of symmetry does a square have?`,answer:4,choices:mcNum(4),standard_code:'4G.A.3',skill_tag:'symmetry'});
  }
  for(let i=0;i<5;i++){
    addMath({id:`G4-GEOM-S-${i}`,grade:g,strand:'GEOM',diff:DIFF.STRETCH,stem:`Which shape always has exactly one pair of parallel sides?`,answer:'trapezoid',choices:['triangle','rectangle','trapezoid','square'],standard_code:'4G.A.2',skill_tag:'classify quadrilaterals'});
  }
  for(let i=0;i<5;i++){
    addMath({id:`G4-GEOM-S2-${i}`,grade:g,strand:'GEOM',diff:DIFF.STRETCH,stem:`Which statement is true about a rectangle?`,answer:'It has 4 right angles.',choices:['It has 3 sides.','It has 4 right angles.','It has no parallel sides.','All sides must be equal.'],standard_code:'4G.A.2',skill_tag:'rectangle attributes'});
  }

  // MD
  for(let i=0;i<5;i++){
    const feet=ri(2,9), ans=feet*12;
    addMath({id:`G4-MD-C-${i}`,grade:g,strand:'MD',diff:DIFF.CORE,stem:`Convert ${feet} feet to inches.`,answer:ans,choices:mcNum(ans),standard_code:'4MD.A.1',skill_tag:'feet to inches'});
  }
  for(let i=0;i<5;i++){
    const l=ri(4,11), w=ri(3,9), ans=l*w;
    addMath({id:`G4-MD-C2-${i}`,grade:g,strand:'MD',diff:DIFF.CORE,stem:`Find the area of a rectangle with length ${l} and width ${w}.`,answer:ans,choices:mcNum(ans),standard_code:'4MD.A.3',skill_tag:'area'});
  }
  for(let i=0;i<5;i++){
    const l=ri(5,12), w=ri(3,9), ans=2*(l+w);
    addMath({id:`G4-MD-O-${i}`,grade:g,strand:'MD',diff:DIFF.ON,stem:`Find the perimeter of a rectangle with length ${l} and width ${w}.`,answer:ans,choices:mcNum(ans),standard_code:'4MD.A.3',skill_tag:'perimeter'});
  }
  for(let i=0;i<5;i++){
    const hour=ri(1,10), mins=pick([0,5,10,15,20,25,30,35,40,45,50,55]), endAdd=pick([35,40,45,50,55,65,75,90]);
    let total=hour*60+mins+endAdd; let nh=Math.floor(total/60)%12; if(nh===0) nh=12; let nm=total%60;
    addMath({id:`G4-MD-O2-${i}`,grade:g,strand:'MD',diff:DIFF.ON,stem:`A show starts at ${hour}:${String(mins).padStart(2,'0')} and lasts ${endAdd} minutes. When does it end?`,answer:`${nh}:${String(nm).padStart(2,'0')}`,choices:[`${nh}:${String(nm).padStart(2,'0')}`,`${hour}:${String((mins+endAdd)%60).padStart(2,'0')}`,`${(hour%12)+1}:${String(mins).padStart(2,'0')}`,`${nh}:${String(mins).padStart(2,'0')}`],standard_code:'4MD.A.2',skill_tag:'elapsed time'});
  }
  for(let i=0;i<5;i++){
    const l=ri(4,10), w=ri(3,8), extra=ri(2,9), ans=l*w+extra;
    addMath({id:`G4-MD-S-${i}`,grade:g,strand:'MD',diff:DIFF.STRETCH,stem:`A bulletin board is ${l} by ${w} feet. ${extra} more square feet of border are added. What is the total area covered?`,answer:ans,choices:mcNum(ans),standard_code:'4MD.A.3',skill_tag:'area with extra'});
  }
  for(let i=0;i<5;i++){
    const total=ri(20,50), each=ri(3,8), ans=total*each;
    addMath({id:`G4-MD-S2-${i}`,grade:g,strand:'MD',diff:DIFF.STRETCH,stem:`A runner jogs ${each} laps around a track that is ${total} meters around. How many meters does the runner jog?`,answer:ans,choices:mcNum(ans),standard_code:'4MD.A.2',skill_tag:'measurement multiplication'});
  }
}

function buildMathGrade5(){
  const g=5;
  // NO / NBT decimals
  for(let i=0;i<5;i++){
    const a=(ri(10,999)/10).toFixed(1), b=(ri(10,999)/10).toFixed(1), ans=(Number(a)+Number(b)).toFixed(1);
    addMath({id:`G5-NO-C-${i}`,grade:g,strand:'NO',diff:DIFF.CORE,stem:`What is ${a} + ${b}?`,answer:ans,choices:mcNum(ans),standard_code:'5NBT.B.7',skill_tag:'add decimals tenths'});
  }
  for(let i=0;i<5;i++){
    const a=(ri(200,999)/10).toFixed(1), b=(ri(10,199)/10).toFixed(1), ans=(Number(a)-Number(b)).toFixed(1);
    addMath({id:`G5-NO-C2-${i}`,grade:g,strand:'NO',diff:DIFF.CORE,stem:`What is ${a} - ${b}?`,answer:ans,choices:mcNum(ans),standard_code:'5NBT.B.7',skill_tag:'subtract decimals tenths'});
  }
  for(let i=0;i<5;i++){
    const n=(ri(100,999)/100).toFixed(2), place=pick(['tenths','hundredths']);
    const ans = place==='tenths' ? n.split('.')[1][0] : n.split('.')[1][1];
    addMath({id:`G5-NO-O-${i}`,grade:g,strand:'NO',diff:DIFF.ON,stem:`In ${n}, what digit is in the ${place} place?`,answer:ans,choices:[ans,'0','1','9'],standard_code:'5NBT.A.3',skill_tag:'decimal place value'});
  }
  for(let i=0;i<5;i++){
    const a=ri(20,99), b=ri(11,19), ans=a*b;
    addMath({id:`G5-NO-O2-${i}`,grade:g,strand:'NO',diff:DIFF.ON,stem:`What is ${a} × ${b}?`,answer:ans,choices:mcNum(ans),standard_code:'5NBT.B.5',skill_tag:'multi-digit multiplication'});
  }
  for(let i=0;i<5;i++){
    const a=(ri(100,999)/100).toFixed(2), b=(pick([2,3,4,5,10])), ans=(Number(a)*b).toFixed(2).replace(/\.00$/,'').replace(/(\.\d)0$/,'$1');
    addMath({id:`G5-NO-S-${i}`,grade:g,strand:'NO',diff:DIFF.STRETCH,stem:`What is ${a} × ${b}?`,answer:ans,choices:mcNum(ans),standard_code:'5NBT.B.7',skill_tag:'multiply decimals'});
  }
  for(let i=0;i<5;i++){
    const a=(ri(250,999)/100).toFixed(2), b=pick([2,4,5,10]), ans=(Number(a)/b).toFixed(2).replace(/\.00$/,'').replace(/(\.\d)0$/,'$1');
    addMath({id:`G5-NO-S2-${i}`,grade:g,strand:'NO',diff:DIFF.STRETCH,stem:`What is ${a} ÷ ${b}?`,answer:ans,choices:mcNum(ans),standard_code:'5NBT.B.7',skill_tag:'divide decimals'});
  }

  // ALG / OA
  for(let i=0;i<5;i++){
    const x=ri(4,15), mult=ri(2,9), total=mult*x;
    addMath({id:`G5-ALG-C-${i}`,grade:g,strand:'ALG',diff:DIFF.CORE,stem:`Solve: ${mult} × n = ${total}.`,answer:x,choices:mcNum(x),standard_code:'5OA.A.2',skill_tag:'numerical patterns/unknown'});
  }
  for(let i=0;i<5;i++){
    const start=ri(10,40), step=ri(2,9), term=ri(3,6), ans=start + (term-1)*step;
    addMath({id:`G5-ALG-C2-${i}`,grade:g,strand:'ALG',diff:DIFF.CORE,stem:`A pattern starts at ${start} and adds ${step} each time. What is the ${term}th number?`,answer:ans,choices:mcNum(ans),standard_code:'5OA.B.3',skill_tag:'number pattern'});
  }
  for(let i=0;i<5;i++){
    const a=ri(30,80), b=ri(10,30), c=ri(2,6), ans=(a+b)*c;
    addMath({id:`G5-ALG-O-${i}`,grade:g,strand:'ALG',diff:DIFF.ON,stem:`What is (${a} + ${b}) × ${c}?`,answer:ans,choices:mcNum(ans),standard_code:'5OA.A.1',skill_tag:'parentheses'});
  }
  for(let i=0;i<5;i++){
    const first=ri(3,9), second=ri(10,25), third=ri(4,12), ans=first*second-third;
    addMath({id:`G5-ALG-O2-${i}`,grade:g,strand:'ALG',diff:DIFF.ON,stem:`A theater has ${first} rows with ${second} seats in each row. ${third} seats are broken. How many seats can be used?`,answer:ans,choices:mcNum(ans),standard_code:'5OA.A.2',skill_tag:'two-step operations'});
  }
  for(let i=0;i<5;i++){
    const x=ri(12,40), add=ri(4,15), total=x+add;
    addMath({id:`G5-ALG-S-${i}`,grade:g,strand:'ALG',diff:DIFF.STRETCH,stem:`Which number makes this equation true: n + ${add} = ${total}?`,answer:x,choices:mcNum(x),standard_code:'5OA.A.2',skill_tag:'equation reasoning'});
  }
  for(let i=0;i<5;i++){
    const start=ri(2,10), step=ri(3,9), term=ri(6,10), ans=start + (term-1)*step;
    addMath({id:`G5-ALG-S2-${i}`,grade:g,strand:'ALG',diff:DIFF.STRETCH,stem:`The pattern is ${start}, ${start+step}, ${start+2*step}, ... What is term ${term}?`,answer:ans,choices:mcNum(ans),standard_code:'5OA.B.3',skill_tag:'extend pattern'});
  }

  // FR / NF
  for(let i=0;i<5;i++){
    const d=pick([3,4,5,6,8,10]), a=ri(1,d-1), b=ri(1,d-1);
    const [sn,sd]=simplify(a+b,d);
    addMath({id:`G5-FR-C-${i}`,grade:g,strand:'FR',diff:DIFF.CORE,stem:`What is ${a}/${d} + ${b}/${d} in simplest form?`,answer:`${sn}/${sd}`,choices:mcFrac(sn,sd),standard_code:'5NF.A.1',skill_tag:'add fractions like denom'});
  }
  for(let i=0;i<5;i++){
    const d=pick([4,5,6,8,10]), a=ri(2,d-1), b=ri(1,a-1);
    const [sn,sd]=simplify(a-b,d);
    addMath({id:`G5-FR-C2-${i}`,grade:g,strand:'FR',diff:DIFF.CORE,stem:`What is ${a}/${d} - ${b}/${d} in simplest form?`,answer:`${sn}/${sd}`,choices:mcFrac(sn,sd),standard_code:'5NF.A.1',skill_tag:'subtract fractions like denom'});
  }
  for(let i=0;i<5;i++){
    const n1=ri(1,4), d1=pick([2,3,4,5,6]), whole=ri(2,6), [sn,sd]=simplify(n1*whole,d1);
    addMath({id:`G5-FR-O-${i}`,grade:g,strand:'FR',diff:DIFF.ON,stem:`What is ${whole} × ${n1}/${d1} in simplest form?`,answer:`${sn}/${sd}`,choices:mcFrac(sn,sd),standard_code:'5NF.B.4',skill_tag:'multiply fraction by whole'});
  }
  for(let i=0;i<5;i++){
    const n1=ri(1,5), d1=pick([2,3,4,5,6]), n2=ri(1,5), d2=pick([2,3,4,5,6]); const [sn,sd]=simplify(n1*n2,d1*d2);
    addMath({id:`G5-FR-O2-${i}`,grade:g,strand:'FR',diff:DIFF.ON,stem:`What is ${n1}/${d1} × ${n2}/${d2} in simplest form?`,answer:`${sn}/${sd}`,choices:mcFrac(sn,sd),standard_code:'5NF.B.4',skill_tag:'multiply fractions'});
  }
  for(let i=0;i<5;i++){
    const n1=pick([1,2,3,4]), d1=pick([2,3,4,5,6]), whole=pick([2,3,4,5]); const [sn,sd]=simplify(n1,d1*whole);
    addMath({id:`G5-FR-S-${i}`,grade:g,strand:'FR',diff:DIFF.STRETCH,stem:`What is ${n1}/${d1} ÷ ${whole} in simplest form?`,answer:`${sn}/${sd}`,choices:mcFrac(sn,sd),standard_code:'5NF.B.7',skill_tag:'divide fraction by whole'});
  }
  for(let i=0;i<5;i++){
    const whole=pick([2,3,4,5]), n=pick([1,2,3]), d=pick([2,3,4,5,6]); const [sn,sd]=simplify(whole*d,n);
    addMath({id:`G5-FR-S2-${i}`,grade:g,strand:'FR',diff:DIFF.STRETCH,stem:`What is ${whole} ÷ ${n}/${d} in simplest form?`,answer:`${sn}/${sd}`,choices:mcFrac(sn,sd),standard_code:'5NF.B.7',skill_tag:'divide whole by fraction'});
  }

  // GEOM
  for(let i=0;i<5;i++){
    const x=pick([1,2,3,4,5,6]), y=pick([1,2,3,4,5,6]);
    addMath({id:`G5-GEOM-C-${i}`,grade:g,strand:'GEOM',diff:DIFF.CORE,stem:`Point (${x}, ${y}) is in which quadrant on a first-quadrant graph?`,answer:'first quadrant',choices:['first quadrant','second quadrant','third quadrant','fourth quadrant'],standard_code:'5G.A.1',skill_tag:'coordinate plane'});
  }
  for(let i=0;i<5;i++){
    const x=pick([2,3,4,5]), y=pick([1,2,3,4]);
    addMath({id:`G5-GEOM-C2-${i}`,grade:g,strand:'GEOM',diff:DIFF.CORE,stem:`What are the coordinates of a point that is ${x} units right and ${y} units up from the origin?`,answer:`(${x}, ${y})`,choices:[`(${x}, ${y})`,`(${y}, ${x})`,`(-${x}, ${y})`,`(${x}, -${y})`],standard_code:'5G.A.1',skill_tag:'read coordinates'});
  }
  for(let i=0;i<5;i++){
    addMath({id:`G5-GEOM-O-${i}`,grade:g,strand:'GEOM',diff:DIFF.ON,stem:`Which ordered pair lies on the x-axis?`,answer:'(4, 0)',choices:['(4, 0)','(0, 4)','(3, 2)','(2, 3)'],standard_code:'5G.A.1',skill_tag:'x-axis'});
  }
  for(let i=0;i<5;i++){
    addMath({id:`G5-GEOM-O2-${i}`,grade:g,strand:'GEOM',diff:DIFF.ON,stem:`Which ordered pair lies on the y-axis?`,answer:'(0, 5)',choices:['(0, 5)','(5, 0)','(1, 5)','(5, 1)'],standard_code:'5G.A.1',skill_tag:'y-axis'});
  }
  for(let i=0;i<5;i++){
    const x=pick([1,2,3,4]), y=pick([2,3,4,5]), dx=pick([2,3,4]);
    addMath({id:`G5-GEOM-S-${i}`,grade:g,strand:'GEOM',diff:DIFF.STRETCH,stem:`A horizontal line segment starts at (${x}, ${y}) and ends ${dx} units to the right. What are the end coordinates?`,answer:`(${x+dx}, ${y})`,choices:[`(${x+dx}, ${y})`,`(${x}, ${y+dx})`,`(${x-dx}, ${y})`,`(${y}, ${x+dx})`],standard_code:'5G.A.2',skill_tag:'graph line segment'});
  }
  for(let i=0;i<5;i++){
    const x=pick([2,3,4]), y=pick([2,3,4]), dy=pick([2,3,4]);
    addMath({id:`G5-GEOM-S2-${i}`,grade:g,strand:'GEOM',diff:DIFF.STRETCH,stem:`A vertical line segment starts at (${x}, ${y}) and ends ${dy} units up. What are the end coordinates?`,answer:`(${x}, ${y+dy})`,choices:[`(${x}, ${y+dy})`,`(${x+dy}, ${y})`,`(${x-dy}, ${y})`,`(${y+dy}, ${x})`],standard_code:'5G.A.2',skill_tag:'graph vertical segment'});
  }

  // MD volume/measurement
  for(let i=0;i<5;i++){
    const l=ri(2,8), w=ri(2,6), h=ri(2,5), ans=l*w*h;
    addMath({id:`G5-MD-C-${i}`,grade:g,strand:'MD',diff:DIFF.CORE,stem:`Find the volume of a rectangular prism with length ${l}, width ${w}, and height ${h}.`,answer:ans,choices:mcNum(ans),standard_code:'5MD.C.5',skill_tag:'volume'});
  }
  for(let i=0;i<5;i++){
    const l=ri(3,9), w=ri(2,7), h=ri(2,6), ans=l*w*h;
    addMath({id:`G5-MD-C2-${i}`,grade:g,strand:'MD',diff:DIFF.CORE,stem:`A box is ${l} ft by ${w} ft by ${h} ft. What is its volume in cubic feet?`,answer:ans,choices:mcNum(ans),standard_code:'5MD.C.5',skill_tag:'volume word problem'});
  }
  for(let i=0;i<5;i++){
    const l=ri(4,10), w=ri(3,8), h=ri(2,6), extra=ri(5,15), ans=l*w*h+extra;
    addMath({id:`G5-MD-O-${i}`,grade:g,strand:'MD',diff:DIFF.ON,stem:`A storage bin holds ${l} × ${w} × ${h} cubic units. ${extra} more cubic units are added on top. What is the total?`,answer:ans,choices:mcNum(ans),standard_code:'5MD.C.5',skill_tag:'volume plus extra'});
  }
  for(let i=0;i<5;i++){
    const start=ri(1,10), mins=pick([0,5,10,15,20,25,30,35,40,45,50,55]), dur=pick([75,80,85,90,95]);
    let total=start*60+mins+dur; let nh=Math.floor(total/60)%12; if(nh===0) nh=12; let nm=total%60;
    addMath({id:`G5-MD-O2-${i}`,grade:g,strand:'MD',diff:DIFF.ON,stem:`A class starts at ${start}:${String(mins).padStart(2,'0')} and lasts ${dur} minutes. When does it end?`,answer:`${nh}:${String(nm).padStart(2,'0')}`,choices:[`${nh}:${String(nm).padStart(2,'0')}`,`${(start%12)+1}:${String(mins).padStart(2,'0')}`,`${start}:${String((mins+dur)%60).padStart(2,'0')}`,`${nh}:${String(mins).padStart(2,'0')}`],standard_code:'5MD.A.1',skill_tag:'elapsed time'});
  }
  for(let i=0;i<5;i++){
    const l=ri(3,8), w=ri(3,8), h=ri(3,8), remove=ri(2,10), ans=l*w*h-remove;
    addMath({id:`G5-MD-S-${i}`,grade:g,strand:'MD',diff:DIFF.STRETCH,stem:`A prism has volume ${l} × ${w} × ${h}. If ${remove} cubic units are removed, what is the new volume?`,answer:ans,choices:mcNum(ans),standard_code:'5MD.C.5',skill_tag:'volume subtract'});
  }
  for(let i=0;i<5;i++){
    const layers=ri(3,6), perLayer=ri(12,24), ans=layers*perLayer;
    addMath({id:`G5-MD-S2-${i}`,grade:g,strand:'MD',diff:DIFF.STRETCH,stem:`A cube stack has ${layers} layers with ${perLayer} cubes in each layer. How many cubes are there?`,answer:ans,choices:mcNum(ans),standard_code:'5MD.C.5',skill_tag:'volume by layers'});
  }
}

function addReadingPassages(){
  const gradeTopics = {
    2: {
      RL:[
        ['The Garden Helper', 'Mila watered the small tomato plant every morning before breakfast. She pulled tiny weeds and checked the leaves. By the end of the month, red tomatoes hung from the stem, and Mila proudly carried a bowl inside for dinner.'],
        ['The Lost Mitten', 'On a snowy walk, Ben noticed one mitten was missing. He retraced his steps past the mailbox and the park bench. At last he saw the red mitten resting on top of a snowbank, dry and bright.'],
        ['The Library Surprise', 'At the library, Nora picked a book about frogs. When she opened it, a paper bookmark slipped out. It said, "Hope you enjoy this story!" Nora smiled and wondered who had left the kind note.'],
        ['The New Kite', 'Jae ran to the hill with his new blue kite. At first the kite dipped and twisted. Then the wind caught it, and it lifted high above the trees while Jae laughed and held the string tight.'],
        ['The Rainy Recess', 'Because rain tapped loudly on the windows, recess was indoors. The class built block towers and played word games. Even though they missed the playground, the room soon filled with smiles and cheers.']
      ],
      RI:[
        ['How Bees Help', 'Bees move from flower to flower looking for nectar. As they travel, pollen sticks to their fuzzy bodies. This helps plants make seeds and fruit, which is one reason bees are important to gardens and farms.'],
        ['What a Map Shows', 'A map is a drawing of a place from above. It can show roads, parks, rivers, and buildings. Symbols on a map stand for real things, and a key helps readers understand what the symbols mean.'],
        ['All About Shadows', 'A shadow forms when light is blocked by an object. On sunny days, shadows can be long in the morning and evening and shorter around noon. The position of the sun affects a shadow’s size and direction.'],
        ['Why Trees Matter', 'Trees give people shade on hot days. They also provide homes for birds and squirrels. Their roots help hold soil in place, and their leaves help clean the air.'],
        ['The Job of a Mail Carrier', 'A mail carrier sorts letters and packages, then delivers them to homes and businesses. To stay organized, mail carriers follow routes. They work in many kinds of weather so people can receive important items.']
      ]
    },
    3: {
      RL:[
        ['The Team Captain', 'When the soccer captain was absent, Ava had to lead warm-ups for the first time. Her voice shook at first, but she remembered each step and encouraged her teammates. By the end of practice, everyone clapped for her.'],
        ['The Seed Contest', 'Each student planted a bean seed for the science fair. Luis measured his plant every week and wrote careful notes in a chart. When his bean sprouted first, he felt excited—but he kept recording details until the contest ended.'],
        ['The Hidden Path', 'On a hike with her aunt, Talia spotted a narrow path lined with ferns. She wanted to rush ahead, but her aunt reminded her to stay close. Together they discovered a small waterfall tucked behind the rocks.'],
        ['The Busy Morning', 'Marcus overslept on Saturday and tried to do three chores at once. He fed the dog, folded towels, and packed his baseball bag. When he finally sat down, he realized a good plan would have saved him time.'],
        ['The Music Recital', 'During the recital, Hana’s fingers missed the first note on the piano. She paused, took a breath, and started again. This time the melody flowed smoothly, and the audience listened in silence until the final chord.']
      ],
      RI:[
        ['How Bridges Work', 'Bridges help people and cars cross rivers, valleys, and roads. Some bridges use arches to support weight, while others hang from strong cables. Engineers choose a design based on where the bridge will be built and how much weight it must hold.'],
        ['Why We Recycle', 'Recycling turns used materials into new products. Paper, glass, metal, and some plastics can often be collected and processed instead of thrown away. Recycling can save resources and reduce the amount of trash sent to landfills.'],
        ['The Water Cycle', 'Water on Earth moves in a cycle. The sun warms water, causing some of it to evaporate into the air. Later, it cools and falls as rain or snow, returning water to the ground and oceans.'],
        ['How a Tooth Grows', 'Children lose baby teeth because adult teeth are growing underneath. As the permanent teeth push upward, the roots of the baby teeth dissolve. This makes the baby teeth loose enough to fall out.'],
        ['What a Governor Does', 'A governor leads a state government. Governors may sign bills into law, suggest budgets, and respond during emergencies. They work with other state leaders to make decisions that affect people in the state.']
      ]
    },
    4: {
      RL:[
        ['The Class Newspaper', 'When Ms. Patel asked for volunteers to start a class newspaper, Omar immediately joined. He loved interviewing classmates and revising headlines. After the first issue was printed, he realized good writing also depends on teamwork and deadlines.'],
        ['The Mountain Trail', 'The climb up Pine Ridge was steeper than Nora expected. At each turn she wanted to stop, yet her grandfather pointed out the valley opening below them. Reaching the overlook, Nora understood why he had urged her to keep going.'],
        ['The Broken Model', 'Eli spent two weeks building a model bridge for the fair. The morning it was due, one side snapped. Instead of giving up, he studied the break, rebuilt the support, and arrived proud of the stronger final version.'],
        ['A Gift for Grandma', 'Sofia wanted to sew a pillow for her grandmother, but the first stitches were crooked. She practiced on scraps of fabric, watched carefully, and started again. The finished pillow was simple, but Grandma hugged it as if it were treasure.'],
        ['The Last Page', 'As Devin reached the last chapter of his mystery novel, he noticed a clue he had ignored near the beginning. Suddenly the ending made sense. He flipped back through the pages, amazed that the answer had been there all along.']
      ],
      RI:[
        ['How Volcanoes Form', 'Volcanoes form when melted rock from below Earth’s surface rises through cracks in the crust. Sometimes pressure builds until lava, ash, and gases erupt. Over many eruptions, these materials can pile up and create mountains.'],
        ['The History of Paper', 'Long ago, people wrote on stone, clay, and animal skin. Paper was developed in China and gradually spread to other parts of the world. Because it was lighter and easier to make, paper changed how people recorded and shared information.'],
        ['Why Animals Migrate', 'Some animals migrate to find food, warmer weather, or safe places to raise their young. Birds may travel thousands of miles between seasons. Even though the journey is difficult, migration helps many species survive.'],
        ['The Role of Juries', 'In some court cases, a jury listens to evidence and helps decide the outcome. Jurors must pay attention to testimony, documents, and instructions from the judge. Their job is to reach a fair decision based on the facts.'],
        ['How Dams Help Communities', 'Dams hold back water in rivers to form reservoirs. These reservoirs can provide drinking water, irrigation, and electricity. At the same time, people must study how dams affect wildlife and the land around them.']
      ]
    },
    5: {
      RL:[
        ['The Debate Club', 'At the first debate club meeting, Maya discovered that speaking clearly was only part of the challenge. She had to listen carefully, predict counterarguments, and support every claim with evidence. By the end of the season, she felt more thoughtful as well as more confident.'],
        ['The Storm Watch', 'When dark clouds rolled over the harbor, Theo wanted to keep fishing with his uncle. Instead, his uncle studied the wind, the water, and the sky before steering back to shore. Theo later realized that experience often looks like patience.'],
        ['The Old Violin', 'In the attic, Lena found a violin case covered in dust. Inside was a note from her great-grandmother explaining how music helped her through difficult times. As Lena practiced the first song, she felt connected to someone she had never met.'],
        ['The Science Showcase', 'Arjun hoped his robot would impress the judges with flashing lights, but one judge asked deeper questions about the programming. Arjun explained his choices and admitted what still needed improvement. That honesty earned more respect than the blinking wires.'],
        ['The Final Lap', 'During the race, Camille trailed the leaders through the first two laps. Instead of sprinting too early, she kept a steady pace and waited until the final turn to push ahead. Her strategy mattered just as much as her speed.']
      ],
      RI:[
        ['How Weather Satellites Help', 'Weather satellites orbit Earth and collect images and data about clouds, storms, and temperature patterns. Meteorologists use this information to track hurricanes, predict severe weather, and warn communities before dangerous conditions arrive.'],
        ['The Purpose of National Parks', 'National parks protect land, wildlife, and natural features for future generations. They also provide places where people can hike, camp, and learn. Balancing tourism with conservation is one of the main challenges of managing a park.'],
        ['Why Voting Matters', 'Voting allows citizens to help choose leaders and shape laws. In a democracy, each vote is one way people express their views. When more citizens participate, election results can better reflect the needs and opinions of the community.'],
        ['The Invention of the Printing Press', 'The printing press made it possible to produce books much faster than copying them by hand. As books became cheaper and more available, more people could learn from the same ideas. This invention helped spread knowledge across Europe and beyond.'],
        ['How Renewable Energy Works', 'Renewable energy comes from sources that are naturally replaced, such as sunlight, wind, and moving water. These resources can generate electricity without using fuels that run out quickly, but they still require planning, equipment, and maintenance.']
      ]
    }
  };

  Object.entries(gradeTopics).forEach(([g, types])=>{
    const grade = Number(g);
    types.RL.forEach((pair, idx)=>{
      const [title, text] = pair;
      addPassage({
        id:`G${grade}-RL-${idx+1}`,
        grade,
        type:'RL',
        text,
        questions:[
          { id:'Q1', stem:'What is the main idea of the passage?', choices:['A central lesson or event from the passage','A detail that does not matter','Only the setting','Only the title'], answer:'A central lesson or event from the passage' },
          { id:'Q2', stem:'Which detail best supports the main idea?', choices:['A key event or action from the text','A random fact','A detail not in the story','Only the first word'], answer:'A key event or action from the text' },
          { id:'Q3', stem:'What can the reader infer about the main character?', choices:['The character learns, changes, or reveals something important','The character is not in the story','The story gives no clues at all','The character is exactly the same as every other character'], answer:'The character learns, changes, or reveals something important' }
        ]
      });
    });
    types.RI.forEach((pair, idx)=>{
      const [title, text] = pair;
      addPassage({
        id:`G${grade}-RI-${idx+1}`,
        grade,
        type:'RI',
        text,
        questions:[
          { id:'Q1', stem:'What is the main idea of the passage?', choices:['The passage explains one central topic or idea','The passage is only a story with no facts','The title is the main idea','The last sentence alone is the main idea'], answer:'The passage explains one central topic or idea' },
          { id:'Q2', stem:'Which detail best supports the main idea?', choices:['A fact or example from the passage','An opinion not found in the text','A sentence from another book','A made-up example'], answer:'A fact or example from the passage' },
          { id:'Q3', stem:'Why did the author most likely write this passage?', choices:['To inform the reader about a topic','To sell a product','To tell a joke','To confuse the reader'], answer:'To inform the reader about a topic' }
        ]
      });
    });
  });
}

function addLanguageItems(){
  // Grade 2
  [
    ['Choose the sentence that is a question.','Where is my backpack?',['Where is my backpack?','I found my backpack.','Close your backpack.','My backpack is blue.'],'2L.2'],
    ['Which word is a noun?','teacher',['quickly','teacher','jump','bright'],'2L.1'],
    ['Choose the correct plural word.','foxes',['foxs','foxes','fox','foxis'],'2L.1'],
    ['Which word best completes the sentence? "The dogs ___ loudly."','bark',['bark','barks','barking','barked'],'2L.1'],
    ['Which sentence uses a capital letter correctly?','We visited Texas in July.',['we visited Texas in July.','We visited texas in July.','We visited Texas in july.','We visited texas in july.'],'2L.2'],
    ['Choose the correct ending punctuation. "Watch out___"','!',['.','?','! ',','],'2L.2']
  ].forEach((x,i)=> addLang({id:`G2-L-C-${i}`,grade:2,diff:DIFF.CORE,stem:x[0],answer:x[1],choices:x[2],standard_code:x[3],skill_tag:'language'}));
  [
    ['Choose the correct contraction for "do not."',"don't",['dont',"don't",'do not','doesnt'],'2L.2'],
    ['Which word means almost the same as "tiny"?','small',['small','loud','slow','cold'],'2L.5'],
    ['Choose the correct word: "I can ___ the bell."','hear',['here','hear','hair','hare'],'2L.1'],
    ['Which word has a prefix that means "not"?','unhappy',['happy','unhappy','happen','happily'],'2L.4'],
    ['Which word is a compound word?','sunlight',['sun','light','sunlight','shine'],'2L.4'],
    ['Choose the correct sentence.','My sister and I went home.',['Me and my sister went home.','My sister and I went home.','My sister and me went home.','I and my sister home went.'],'2L.1']
  ].forEach((x,i)=> addLang({id:`G2-L-O-${i}`,grade:2,diff:DIFF.ON,stem:x[0],answer:x[1],choices:x[2],standard_code:x[3],skill_tag:'language'}));
  [
    ['Which word best completes the sentence? "The rabbit hopped into its ___."','burrow',['burrow','borrow','burrowed','burly'],'2L.4'],
    ['Which sentence is written correctly?','After lunch, we read a story.',['After lunch we read a story','After lunch, we read a story.','after lunch, we read a story.','After lunch we read a story.'],'2L.2'],
    ['What does the prefix re- mean in the word retell?','again',['again','not','small','before'],'2L.4'],
    ['Which sentence uses the correct past tense verb?','Yesterday, we walked to school.',['Yesterday, we walk to school.','Yesterday, we walked to school.','Yesterday, we walking to school.','Yesterday, we walks to school.'],'2L.1'],
    ['Which word tells where?','inside',['softly','inside','happy','three'],'2L.1'],
    ['Choose the best dictionary guide word pair for "pear."','peach–pebble',['orange–paint','peach–pebble','quilt–rabbit','cat–dog'],'2L.4']
  ].forEach((x,i)=> addLang({id:`G2-L-S-${i}`,grade:2,diff:DIFF.STRETCH,stem:x[0],answer:x[1],choices:x[2],standard_code:x[3],skill_tag:'language'}));

  // Grade 3
  [
    ['Choose the correct plural noun.','stories',['storys','storyes','stories','story'],'3L.1'],
    ['Which sentence has the correct subject and verb?','The dogs run fast.',['The dogs runs fast.','The dogs run fast.','The dogs running fast.','The dogs ran fast every day.'],'3L.1'],
    ['Which word is an adverb?','quickly',['quickly','runner','green','table'],'3L.1'],
    ['Which sentence is punctuated correctly?','On Saturday, we went to the park.',['On Saturday we went to the park.','On Saturday, we went to the park.','On Saturday we, went to the park.','on Saturday, we went to the park.'],'3L.2'],
    ['Choose the correct pronoun. "___ went to the store."','She',['Her','She','Him','Them'],'3L.1'],
    ['Which word means the opposite of "begin"?','end',['start','open','end','early'],'3L.5']
  ].forEach((x,i)=> addLang({id:`G3-L-C-${i}`,grade:3,diff:DIFF.CORE,stem:x[0],answer:x[1],choices:x[2],standard_code:x[3],skill_tag:'language'}));
  [
    ['Choose the correct sentence.','The birds flew over the pond.',['The birds flyed over the pond.','The birds flew over the pond.','The birds flown over the pond.','The birds fly over the pond yesterday.'],'3L.1'],
    ['What does the suffix -ful mean in helpful?','full of',['without','again','full of','before'],'3L.4'],
    ['Which word best fits the sentence? "The kitten was very ___."','playful',['playful','play','plays','player'],'3L.3'],
    ['Choose the correct comma use.','Yes, I can help you.',['Yes I can help you.','Yes, I can help you.','Yes I, can help you.','yes, I can help you.'],'3L.2'],
    ['Which word is spelled correctly?','because',['becaus','beacause','because','becose'],'3L.2'],
    ['What is a synonym for "glad"?','happy',['sad','happy','angry','tired'],'3L.5']
  ].forEach((x,i)=> addLang({id:`G3-L-O-${i}`,grade:3,diff:DIFF.ON,stem:x[0],answer:x[1],choices:x[2],standard_code:x[3],skill_tag:'language'}));
  [
    ['Choose the sentence with a compound subject.','Mia and Lucas read quietly.',['Mia read quietly.','Mia and Lucas read quietly.','Read quietly, Mia.','Quiet reading began.'],'3L.1'],
    ['Which word belongs in the blank? "We looked ___ the cave."','inside',['insides','inside','insiding','in'],'3L.1'],
    ['Which sentence is in the future tense?','Tomorrow, we will visit the museum.',['Tomorrow, we visit the museum.','Tomorrow, we will visit the museum.','Tomorrow, we visited the museum.','Tomorrow, we visiting the museum.'],'3L.1'],
    ['Which word has the same root as preview?','view',['visit','view','video','very'],'3L.4'],
    ['What does the context clue suggest? "The cactus lived in an arid climate, so little rain fell there." Arid means—','dry',['bright','dry','cold','busy'],'3L.4'],
    ['Choose the correct sentence.','Our class is preparing a play.',['Our class are preparing a play.','Our class is preparing a play.','Our class preparing a play.','Our class were preparing a play now.'],'3L.1']
  ].forEach((x,i)=> addLang({id:`G3-L-S-${i}`,grade:3,diff:DIFF.STRETCH,stem:x[0],answer:x[1],choices:x[2],standard_code:x[3],skill_tag:'language'}));

  // Grade 4
  [
    ['Choose the sentence with correct capitalization.','My cousin Rosa lives in New York.',['My cousin rosa lives in New York.','My cousin Rosa lives in new york.','My cousin Rosa lives in New York.','my cousin Rosa lives in New York.'],'4L.2'],
    ['Which word is a preposition?','between',['between','swiftly','frozen','friend'],'4L.1'],
    ['Choose the correct pronoun.','They',['Them','They','Their','Theirs'],'4L.1'],
    ['Which sentence has a complete subject and predicate?','The bright moon glowed above us.',['Bright moon.','The bright moon glowed above us.','Above us.','Glowed above us.'],'4L.1'],
    ['Which word is spelled correctly?','separate',['seperate','separite','separate','seperete'],'4L.2'],
    ['Choose the correct verb.','has',['have','has','having','haded'],'4L.1']
  ].forEach((x,i)=> addLang({id:`G4-L-C-${i}`,grade:4,diff:DIFF.CORE,stem:x[0],answer:x[1],choices:x[2],standard_code:x[3],skill_tag:'language'}));
  [
    ['Which sentence uses commas correctly?','After practice, we ate dinner, and then we went home.',['After practice we ate dinner, and then we went home.','After practice, we ate dinner, and then we went home.','After practice, we ate dinner and then, we went home.','After practice we ate dinner and then we went home.'],'4L.2'],
    ['What does the Greek root tele mean in telescope?','far',['far','light','sound','write'],'4L.4'],
    ['Choose the best replacement for "said" in this sentence: "I found it," Maya said happily.','exclaimed',['said','went','exclaimed','looked'],'4L.3'],
    ['Which sentence uses quotation marks correctly?','"Please close the door," Mom said.',['Please close the door," Mom said.','"Please close the door," Mom said.','"Please close the door, Mom said."','Please "close the door," Mom said.'],'4L.2'],
    ['Which word is a homophone of "flower"?','flour',['flour','floor','flare','flow'],'4L.5'],
    ['Choose the sentence with correct verb tense.','Last night, we watched a movie.',['Last night, we watch a movie.','Last night, we watched a movie.','Last night, we watches a movie.','Last night, we watching a movie.'],'4L.1']
  ].forEach((x,i)=> addLang({id:`G4-L-O-${i}`,grade:4,diff:DIFF.ON,stem:x[0],answer:x[1],choices:x[2],standard_code:x[3],skill_tag:'language'}));
  [
    ['Which word best fits the meaning of the sentence? "The scientist made a careful ___."','observation',['observing','observation','observe','observerly'],'4L.3'],
    ['Which sentence avoids a run-on?','The bell rang, and the students packed up.',['The bell rang the students packed up.','The bell rang, and the students packed up.','The bell rang and, the students packed up.','The bell rang. and the students packed up.'],'4L.2'],
    ['What does the root graph mean in autograph?','write',['hear','write','move','measure'],'4L.4'],
    ['Choose the sentence with the most precise language.','The exhausted hikers finally reached camp.',['The hikers got there.','The exhausted hikers finally reached camp.','The people went to camp.','The hikers were there.'],'4L.3'],
    ['Which word from the sentence is a conjunction? "We stayed inside because the storm was strong."','because',['stayed','inside','because','strong'],'4L.1'],
    ['Choose the correct sentence.','Neither the coach nor the players were ready.',['Neither the coach nor the players was ready.','Neither the coach nor the players were ready.','Neither the coach or the players were ready.','Neither coach nor players ready.'],'4L.1']
  ].forEach((x,i)=> addLang({id:`G4-L-S-${i}`,grade:4,diff:DIFF.STRETCH,stem:x[0],answer:x[1],choices:x[2],standard_code:x[3],skill_tag:'language'}));

  // Grade 5
  [
    ['Choose the sentence with correct punctuation.','However, we still finished the project on time.',['However we still finished the project on time.','However, we still finished the project on time.','However, we still finished, the project on time.','however, we still finished the project on time.'],'5L.2'],
    ['Which word is an interjection?','Wow!',['careful','Wow!','beneath','teacher'],'5L.1'],
    ['Choose the correct pronoun case.','I',['Me and Jordan built it.','Jordan and I built it.','Jordan and me built it.','Built it Jordan and I.'],'5L.1'],
    ['Which sentence uses the perfect tense correctly?','She has finished her homework.',['She have finished her homework.','She has finished her homework.','She finishing her homework.','She finished has her homework.'],'5L.1'],
    ['Which word is spelled correctly?','necessary',['neccessary','necessary','necesary','necessery'],'5L.2'],
    ['Choose the most precise verb.','sprinted',['went','sprinted','moved','did'],'5L.3']
  ].forEach((x,i)=> addLang({id:`G5-L-C-${i}`,grade:5,diff:DIFF.CORE,stem:x[0],answer:x[1],choices:x[2],standard_code:x[3],skill_tag:'language'}));
  [
    ['What does the Greek root photo mean in photograph?','light',['light','sound','measure','earth'],'5L.4'],
    ['Which sentence uses commas correctly?','My goals are to practice, to improve, and to compete.',['My goals are to practice to improve, and to compete.','My goals are to practice, to improve, and to compete.','My goals, are to practice, to improve, and to compete.','My goals are, to practice to improve and to compete.'],'5L.2'],
    ['Choose the sentence with correct verb tense.','By noon, we had completed the lab.',['By noon, we has completed the lab.','By noon, we had completed the lab.','By noon, we complete the lab.','By noon, we completed had the lab.'],'5L.1'],
    ['Which word best replaces "good" in this sentence? "The speech was good."','effective',['good','effective','fine','okay'],'5L.3'],
    ['Choose the correct sentence.','If I were the captain, I would choose teamwork first.',['If I was the captain, I would choose teamwork first.','If I were the captain, I would choose teamwork first.','If I be the captain, I would choose teamwork first.','If I am captain, I choose teamwork first.'],'5L.1'],
    ['Which word is an antonym for "expand"?','shrink',['stretch','grow','shrink','widen'],'5L.5']
  ].forEach((x,i)=> addLang({id:`G5-L-O-${i}`,grade:5,diff:DIFF.ON,stem:x[0],answer:x[1],choices:x[2],standard_code:x[3],skill_tag:'language'}));
  [
    ['Which sentence uses parentheses correctly?','The assembly (which lasted an hour) ended at noon.',['The assembly which lasted an hour (ended at noon).','The assembly (which lasted an hour) ended at noon.','The assembly which (lasted an hour ended at noon).','The assembly) which lasted an hour (ended at noon.'],'5L.2'],
    ['What does the root scope mean in microscope?','see or look',['see or look','write','hear','carry'],'5L.4'],
    ['Choose the sentence with the clearest meaning.','The committee approved the revised safety plan after a long discussion.',['The committee did something after talking.','The committee approved the revised safety plan after a long discussion.','The plan was after discussion.','Approved discussion safety committee.'],'5L.3'],
    ['Which sentence avoids a shift in tense?','We studied the map and then crossed the bridge.',['We studied the map and then cross the bridge.','We studied the map and then crossed the bridge.','We study the map and then crossed the bridge.','We had studied the map and then cross the bridge.'],'5L.1'],
    ['Which phrase is an appositive?','my neighbor, a talented chef,',['my neighbor, a talented chef,','ran quickly','under the chair','after dinner'],'5L.2'],
    ['Choose the best meaning of the underlined word: "The mayor’s speech had a formal tone."','serious and official',['funny','serious and official','angry','whispered'],'5L.5']
  ].forEach((x,i)=> addLang({id:`G5-L-S-${i}`,grade:5,diff:DIFF.STRETCH,stem:x[0],answer:x[1],choices:x[2],standard_code:x[3],skill_tag:'language'}));
}

buildMathGrade2();
buildMathGrade3();
buildMathGrade4();
buildMathGrade5();
addReadingPassages();
addLanguageItems();

const legacyMath = LEGACY_MATH_ITEMS.filter(it => it.grade_min >= 6);
const legacyPassages = LEGACY_PASSAGES.filter(p => (p.grade_band?.[0] || 0) >= 6);
const legacyLang = LEGACY_LANG_ITEMS.filter(it => it.grade_min >= 6);

export const MATH_ITEMS = [...curatedMath, ...legacyMath];
export const PASSAGES = [...curatedPassages, ...legacyPassages];
export const LANG_ITEMS = [...curatedLang, ...legacyLang];

function flattenReading(p) {
  return p.questions.map(q => ({ question: q.stem, options: q.choices, answer: q.answer }));
}
const MATH_10 = shuffle(MATH_ITEMS).slice(0, 10).map(m => ({ question: m.stem, options: m.choices, answer: m.answer }));
const READING_ALL = PASSAGES.flatMap(flattenReading);
const READING_5 = shuffle(READING_ALL).slice(0, 5);
const LANGUAGE_5 = shuffle(LANG_ITEMS).slice(0, 5).map(l => ({ question: l.stem, options: l.choices, answer: l.answer }));
export const questions = shuffle([...MATH_10, ...READING_5, ...LANGUAGE_5]);
