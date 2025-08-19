/* bank.js — generators + standards maps — v1.0 */

/* ---------- Standards families ---------- */
const STD = {
  M: {
    G2_OA_2:'NY-2.OA.2', G2_OA_3:'NY-2.OA.3',
    G3_NBT:'NY-3.NBT.*', G3_NF:'NY-3.NF.*', G3_OA:'NY-3.OA.*',
    G4_NF:'NY-4.NF.*', G4_MD:'NY-4.MD.*',
    G5_NBT:'NY-5.NBT.*',
    G6_RP:'NY-6.RP.*', G6_NS:'NY-6.NS.*', G6_EE:'NY-6.EE.*',
    G7_NS:'NY-7.NS.*', G7_EE:'NY-7.EE.*', G7_G:'NY-7.G.*',
    G8_F:'NY-8.F.*', G8_G:'NY-8.G.*'
  },
  E: { RL:'NY-ELA.RL.*', RI:'NY-ELA.RI.*', L:'NY-ELA.L.*', W:'NY-ELA.W.*' }
};

/* Report mapping: skill tag -> standards family label */
const TAG_TO_STD = {
  'arithmetic':'NY-3.OA.*','parity':'NY-2.OA.3',
  'place-value':'NY-3.NBT.*','rounding':'NY-3.NBT.*',
  'fractions':'NY-3–5.NF.*','geometry':'NY-4.MD.*','decimals':'NY-5.NBT.*',
  'percent':'NY-6.RP.*','unit-rate':'NY-6.RP.*',
  'integers':'NY-6–7.NS.*','equations':'NY-6–7.EE.*','angles':'NY-7.G.*',
  'functions':'NY-8.F.*','pythagorean':'NY-8.G.*',
  'mainidea':'NY-ELA.RI/RL.*','inference':'NY-ELA.RI/RL.*',
  'vocab':'NY-ELA.L.*','homophones':'NY-ELA.L.*',
  'grammar':'NY-ELA.L.*','punctuation':'NY-ELA.L.*','context':'NY-ELA.RI.*'
};

/* ---------- helpers ---------- */
const R = (n)=> Math.floor(Math.random()*n);
const pick = (arr)=> arr[R(arr.length)];
const within = (min,max)=> Math.floor(Math.random()*(max-min+1))+min;
const shuffle = (arr)=> arr.map(v=>[Math.random(),v]).sort((a,b)=>a[0]-b[0]).map(x=>x[1]);
const choiceSet = (c,wr)=> {
  const opts = shuffle([c, ...wr]).slice(0,4);
  return opts.length<4 ? shuffle([...opts, ...wr].slice(0,4)) : opts;
};

/* ---------- Math generators (varied difficulty) ---------- */
function genG2_OA_2(){ const a=within(1,10), b=within(1,10); const c=String(a+b);
  const wr=[a+b+1,a+b-1,a+b+2].filter(x=>x>0).map(String);
  return {t:`What is ${a} + ${b}?`, c, a:choiceSet(c,wr), tag:'arithmetic', std:STD.M.G2_OA_2, lvl:2.5}; }
function genG2_OA_3(){ const n=within(2,99); const c=(n%2===0)?'Even':'Odd';
  return {t:`Is ${n} even or odd?`, c, a:choiceSet(c,['Even','Odd']), tag:'parity', std:STD.M.G2_OA_3, lvl:2.5}; }

function genG3_NBT(){
  const th=within(1,9), h=within(0,9), t=within(0,9), o=within(0,9);
  const num = th*1000 + h*100 + t*10 + o;
  const mode = pick(['value','round10','round100']);
  if(mode==='value'){
    const d = pick([['thousands',th,1000],['hundreds',h,100],['tens',t,10],['ones',o,1]]);
    const c = String(d[1]*d[2]); const wr=[d[2],d[1],d[1]*10].map(String);
    return {t:`What is the value of the digit in the ${d[0]} place of ${num}?`, c, a:choiceSet(c,wr), tag:'place-value', std:STD.M.G3_NBT, lvl:3.5};
  } else if(mode==='round10'){
    const c = Math.round(num/10)*10; const wr=[c+10,c-10,Math.round(num/100)*100];
    return {t:`Round ${num} to the nearest ten.`, c:String(c), a:choiceSet(String(c), wr.map(String)), tag:'rounding', std:STD.M.G3_NBT, lvl:3.5};
  } else {
    const c = Math.round(num/100)*100; const wr=[c+100,c-100,Math.round(num/10)*10];
    return {t:`Round ${num} to the nearest hundred.`, c:String(c), a:choiceSet(String(c), wr.map(String)), tag:'rounding', std:STD.M.G3_NBT, lvl:3.7};
  }
}
function genFracEquiv(){ const base=[[1,2],[2,3],[3,4]][R(3)], k=within(2,4);
  const c=`${base[0]*k}/${base[1]*k}`; const wr=[`${base[0]}/${base[1]+1}`,`${base[0]+1}/${base[1]}`,`${base[0]*k}/${base[1]*k+1}`];
  return {t:`Which fraction is equivalent to ${base[0]}/${base[1]}?`, c, a:choiceSet(c,wr), tag:'fractions', std:STD.M.G3_NF, lvl:4.5}; }
function genAddLikeDen(){ const den=pick([4,6,8,10,12]); const a1=within(1,den-1), a2=within(1,den-1);
  const num=a1+a2, c=`${num}/${den}`; const wr=[`${a1}/${den}`,`${a2}/${den}`,`${Math.abs(a1-a2)}/${den}`];
  return {t:`Compute: ${a1}/${den} + ${a2}/${den}`, c, a:choiceSet(c,wr), tag:'fractions', std:STD.M.G4_NF, lvl:4.8}; }
function genAreaPerim(){ const w=within(3,12), h=within(3,12), mode=pick(['area','perim']);
  if(mode==='area'){ const c=String(w*h), wr=[w+h,w*h+2,w*h-2].map(String);
    return {t:`Area of a rectangle ${w} by ${h}?`, c, a:choiceSet(c,wr), tag:'geometry', std:STD.M.G4_MD, lvl:4.6}; }
  const p=2*(w+h); const wr=[w+h,p+2,p-2].map(String);
  return {t:`Perimeter of a rectangle ${w} by ${h}?`, c:String(p), a:choiceSet(String(p), wr), tag:'geometry', std:STD.M.G4_MD, lvl:4.6}; }
function genDecCompare(){ const a=(within(10,99)/100).toFixed(2), b=(within(10,99)/100).toFixed(2);
  const big=parseFloat(a)>parseFloat(b)?a:b; const wr=[(parseFloat(big)-0.01).toFixed(2),'Equal',(parseFloat(big)+0.01).toFixed(2)];
  return {t:`Which is greater? ${a} or ${b}`, c:big, a:choiceSet(big,wr), tag:'decimals', std:STD.M.G5_NBT, lvl:5.0}; }
function genPercentOf(){ const base=[40,50,60,80,120][R(5)], pct=[10,15,20,25,30][R(5)];
  const c=String(Math.round(base*pct/100)); const wr=[Math.round(base*(pct+5)/100),Math.round(base*(pct-5)/100),Math.round(base*(pct)/100)+2].map(String);
  return {t:`What is ${pct}% of ${base}?`, c, a:choiceSet(c,wr), tag:'percent', std:STD.M.G6_RP, lvl:6.0}; }
function genUnitRate(){ const qty=[3,4,5,6][R(4)], cost=[6,8,10,12,15][R(5)];
  const c=(cost/qty).toFixed(2); const wr=[(cost/(qty+1)).toFixed(2),(cost/(qty-1)).toFixed(2),(cost/qty+0.25).toFixed(2)];
  return {t:`${qty} apples cost $${cost}. Cost per apple?`, c, a:choiceSet(c,wr), tag:'unit-rate', std:STD.M.G6_RP, lvl:6.2}; }
function genIntAddSub(){ const a=within(-9,9), b=within(-9,9); const c=String(a+b); const wr=[a-b,-a+b,a+b+1].map(String);
  return {t:`Compute: ${a} + (${b})`, c, a:choiceSet(c,wr), tag:'integers', std:STD.M.G7_NS, lvl:6.8}; }
function genOneStepEq(){ const x=within(2,12), b=within(2,10); const c=String(x); const wr=[x+1,x-1,b,x+b].map(String);
  return {t:`Solve for x: x + ${b} = ${x+b}`, c, a:choiceSet(c,wr), tag:'equations', std:STD.M.G6_EE, lvl:6.5}; }
function genTriangleAngle(){ const a1=within(35,85), a2=within(35,85); let c=180-a1-a2; if(c<=10)c+=20;
  const wr=[c+10,c-10,a1].map(String);
  return {t:`A triangle has angles ${a1}° and ${a2}°. Find the third angle.`, c:String(c), a:choiceSet(String(c),wr), tag:'angles', std:STD.M.G7_G, lvl:7.0}; }
function genSlope(){ const x1=within(0,6), y1=within(0,10), x2=x1+within(1,6), y2=y1+within(-5,5);
  const c=String(((y2-y1)/(x2-x1)).toFixed(2)); const wr=[((y2-y1)/(x2-x1)+0.5).toFixed(2),((y2-y1)/(x2-x1)-0.5).toFixed(2),((y2+y1)/(x2-x1)).toFixed(2)];
  return {t:`Slope between (${x1},${y1}) and (${x2},${y2})?`, c, a:choiceSet(c,wr), tag:'functions', std:STD.M.G8_F, lvl:8.0}; }
function genPyth(){ const a=[3,5,6,7][R(4)], b=[4,12,8,24][R(4)]; const h=Math.round(Math.sqrt(a*a+b*b));
  const wr=[a+b,h+1,h-1].map(String);
  return {t:`Right triangle legs ${a} and ${b}. Hypotenuse length?`, c:String(h), a:choiceSet(String(h),wr), tag:'pythagorean', std:STD.M.G8_G, lvl:8.0}; }

/* Pool of math generators (we’ll sample repeatedly to build a 120+ bank) */
const MATH_GENS = [
  genG2_OA_2, genG2_OA_3, genG3_NBT, genFracEquiv, genAddLikeDen,
  genAreaPerim, genDecCompare, genPercentOf, genUnitRate, genIntAddSub,
  genOneStepEq, genTriangleAngle, genSlope, genPyth
];

/* ---------- ELA generators ---------- */
const PASSAGES = [
  { text:`The clouds gathered and the wind howled. Soon, droplets tapped the window.`,
    qMI:{t:'What is most likely happening?', c:'A storm is starting', w:['A sunny day','A parade','A quiet night'], std:STD.E.RI},
    qINF:{t:'Which clue best supports your answer?', c:'Wind howled and droplets tapped the window', w:['The day is sunny','People are cheering','Birds are chirping'], std:STD.E.RI}
  },
  { text:`Many plants bend toward light. Gardeners rotate pots so stems stay straight.`,
    qMI:{t:'What is the main idea?', c:'Plants grow toward light', w:['Plants hate water','Pots are heavy','Gardens are loud'], std:STD.E.RI}
  },
  { text:`Maya practiced every day before the recital. When the curtain rose, she smiled with confidence.`,
    qINF:{t:'What can you infer?', c:'Maya felt ready to perform', w:['Maya forgot her part','Maya was late','Maya left early'], std:STD.E.RL}
  }
];
const SYN = [['eager','excited'],['scarce','rare'],['plentiful','abundant'],['assist','help'],['silent','quiet'],['purchase','buy']];
const ANT = [['scarce','plentiful'],['difficult','easy'],['ancient','modern'],['expand','shrink']];
const HOMO = [{sent:`___ bringing ___ books over ___.`, c:`They're, their, there`, w:[`Their, there, they're`,`There, they're, their`,`They're, there, their`]}];
const SV_AGR = [{t:`Choose the correct sentence.`, c:`The dogs run fast.`, w:[`The dogs runs fast.`,`The dog run fast.`,`The dogs running fast.`]}];
const COMMA = [{t:`Which sentence uses the comma correctly?`, c:`After the game, we went for pizza.`, w:[`After the game we went, for pizza.`,`After, the game we went for pizza.`,`After the game we, went for pizza.`]}];

function genFromPassage(){ const p=pick(PASSAGES); const use=(p.qMI && p.qINF) ? pick(['mi','inf']) : (p.qMI ? 'mi':'inf');
  const d=(use==='mi')? p.qMI:p.qINF;
  return {t:`Read: “${p.text}” ${d.t}`, c:d.c, a:choiceSet(d.c,d.w), tag:(use==='mi'?'mainidea':'inference'), std:d.std, lvl:5.0}; }
function genSynonym(){ const [w,s]=pick(SYN); const wr=shuffle(SYN.map(x=>x[1]).filter(x=>x!==s)).slice(0,3);
  return {t:`Choose the best synonym for “${w}”.`, c:s, a:choiceSet(s,wr), tag:'vocab', std:STD.E.L, lvl:4.0}; }
function genAntonym(){ const [w,a]=pick(ANT); const wr=shuffle(ANT.map(x=>x[1]).filter(x=>x!==a)).slice(0,3);
  return {t:`Choose the antonym of “${w}”.`, c:a, a:choiceSet(a,wr), tag:'vocab', std:STD.E.L, lvl:5.0}; }
function genHomophone(){ const h=pick(HOMO); return {t:h.sent, c:h.c, a:choiceSet(h.c,h.w), tag:'homophones', std:STD.E.L, lvl:4.5}; }
function genSV(){ const s=pick(SV_AGR); return {t:s.t, c:s.c, a:choiceSet(s.c,s.w), tag:'grammar', std:STD.E.L, lvl:4.5}; }
function genComma(){ const s=pick(COMMA); return {t:s.t, c:s.c, a:choiceSet(s.c,s.w), tag:'punctuation', std:STD.E.L, lvl:4.5}; }
function genContextClue(){ const blanks=[
  {sent:`She spoke in a ___ voice so she wouldn’t wake the baby.`, c:'soft', w:['loud','angry','rapid']},
  {sent:`The desert is known for its ___ rainfall.`, c:'scarce', w:['plentiful','daily','stormy']},
  {sent:`He was so ___ to start that he arrived early.`, c:'eager', w:['confused','tired','reluctant']}
]; const b=pick(blanks);
  return {t:b.sent, c:b.c, a:choiceSet(b.c,b.w), tag:'context', std:STD.E.RI, lvl:3.5}; }

const ELA_GENS = [genFromPassage,genSynonym,genAntonym,genHomophone,genSV,genComma,genContextClue];

/* ---------- export to window ---------- */
window.BANK = { MATH_GENS, ELA_GENS, TAG_TO_STD, STD, utils:{pick,within,shuffle,choiceSet} };

