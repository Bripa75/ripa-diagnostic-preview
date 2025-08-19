/* bank.js  —  generators + standards maps  —  v1.0 */

// Standards tags (families)
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

// Tag → standards family for the report
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

// Utils
const rand = (n)=> Math.floor(Math.random()*n);
const pick = (arr)=> arr[rand(arr.length)];
const within = (min,max)=> Math.floor(Math.random()*(max-min+1))+min;
const shuffle = (arr)=> arr.map(v=>[Math.random(),v]).sort((a,b)=>a[0]-b[0]).map(x=>x[1]);
const choiceSet = (correct, wrongs)=>{
  const opts = shuffle([correct, ...wrongs]).slice(0,4);
  return opts.length<4 ? shuffle([...opts, ...wrongs].slice(0,4)) : opts;
};

// -------- Math generators (sample set; extend as needed) --------
function genG2_OA_2(){ const a=within(1,10), b=within(1,10); const c=String(a+b);
  const wrongs=[a+b+1,a+b-1,a+b+2].filter(x=>x>0).map(String);
  return {t:`What is ${a} + ${b}?`, c, a:choiceSet(c,wrongs), tag:'arithmetic', std:STD.M.G2_OA_2, lvl:2.5}; }
function genG2_OA_3(){ const n=within(2,99); const c=(n%2===0)?'Even':'Odd';
  return {t:`Is ${n} even or odd?`, c, a:choiceSet(c,['Even','Odd']), tag:'parity', std:STD.M.G2_OA_3, lvl:2.5}; }
function genG3_NBT(){
  const th=within(1,9), h=within(0,9), t=within(0,9), o=within(0,9);
  const num = th*1000 + h*100 + t*10 + o;
  const mode = pick(['value','round10','round100']);
  if(mode==='value'){
    const digit = pick([['thousands',th,1000],['hundreds',h,100],['tens',t,10],['ones',o,1]]);
    const c = String(digit[1]*digit[2]); const wrongs=[digit[2],digit[1],digit[1]*10].map(String);
    return {t:`What is the value of the digit in the ${digit[0]} place of ${num}?`, c, a:choiceSet(c,wrongs), tag:'place-value', std:STD.M.G3_NBT, lvl:3.5};
  } else if(mode==='round10'){
    const rounded = Math.round(num/10)*10; const wrongs=[rounded+10,rounded-10,Math.round(num/100)*100];
    return {t:`Round ${num} to the nearest ten.`, c:String(rounded), a:choiceSet(String(rounded), wrongs.map(String)), tag:'rounding', std:STD.M.G3_NBT, lvl:3.5};
  } else {
    const rounded = Math.round(num/100)*100; const wrongs=[rounded+100,rounded-100,Math.round(num/10)*10];
    return {t:`Round ${num} to the nearest hundred.`, c:String(rounded), a:choiceSet(String(rounded), wrongs.map(String)), tag:'rounding', std:STD.M.G3_NBT, lvl:3.7};
  }
}
function genFracEquiv(){ const base=[[1,2],[2,3],[3,4]][rand(3)], k=within(2,4);
  const c=`${base[0]*k}/${base[1]*k}`; const wrongs=[`${base[0]}/${base[1]+1}`,`${base[0]+1}/${base[1]}`,`${base[0]*k}/${base[1]*k+1}`];
  return {t:`Which fraction is equivalent to ${base[0]}/${base[1]}?`, c, a:choiceSet(c,wrongs), tag:'fractions', std:STD.M.G3_NF, lvl:4.5}; }
function genAddLikeDen(){ const den=pick([4,6,8,10,12]); const a1=within(1,den-1), a2=within(1,den-1);
  const num=a1+a2, c=`${num}/${den}`; const wrongs=[`${a1}/${den}`,`${a2}/${den}`,`${Math.abs(a1-a2)}/${den}`];
  return {t:`Compute: ${a1}/${den} + ${a2}/${den}`, c, a:choiceSet(c,wrongs), tag:'fractions', std:STD.M.G4_NF, lvl:4.8}; }
function genAreaPerim(){ const w=within(3,12), h=within(3,12), mode=pick(['area','perim']);
  if(mode==='area'){ const c=String(w*h), wrongs=[w+h,w*h+2,w*h-2].map(String);
    return {t:`Area of a rectangle ${w} by ${h}?`, c, a:choiceSet(c,wrongs), tag:'geometry', std:STD.M.G4_MD, lvl:4.6}; }
  else { const p=2*(w+h); const wrongs=[w+h,p+2,p-2].map(String);
    return {t:`Perimeter of a rectangle ${w} by ${h}?`, c:String(p), a:choiceSet(String(p), wrongs), tag:'geometry', std:STD.M.G4_MD, lvl:4.6}; } }
function genDecCompare(){ const a=(within(10,99)/100).toFixed(2), b=(within(10,99)/100).toFixed(2);
  const bigger=parseFloat(a)>parseFloat(b)?a:b; const wrongs=[(parseFloat(bigger)-0.01).toFixed(2),'Equal',(parseFloat(bigger)+0.01).toFixed(2)];
  return {t:`Which is greater? ${a} or ${b}`, c:bigger, a:choiceSet(bigger,wrongs), tag:'decimals', std:STD.M.G
