// bank.js — question generators + tags + utils

(function(){
  const STD = {
    M: {
      G2_OA:'NY-2.OA.*', G3_NBT:'NY-3.NBT.*', G3_NF:'NY-3.NF.*',
      G4_MD:'NY-4.MD.*',  G4_NF:'NY-4.NF.*',
      G5_NBT:'NY-5.NBT.*', G6_RP:'NY-6.RP.*', G6_EE:'NY-6.EE.*',
      G7_NS:'NY-7.NS.*', G7_G:'NY-7.G.*', G8_F:'NY-8.F.*', G8_G:'NY-8.G.*'
    },
    E: { RL:'NY-ELA.RL.*', RI:'NY-ELA.RI.*', L:'NY-ELA.L.*' }
  };

  // Small helpers
  const within = (min,max)=> Math.floor(Math.random()*(max-min+1))+min;
  const pick = arr => arr[Math.floor(Math.random()*arr.length)];
  function shuffle(arr){ return arr.map(v=>[Math.random(),v]).sort((a,b)=>a[0]-b[0]).map(x=>x[1]); }
  function choiceSet(correct, wrongs){
    const opts = shuffle([correct, ...wrongs]).slice(0,4);
    return opts.length<4 ? shuffle([...opts, ...wrongs].slice(0,4)) : opts;
  }

  // ======== Math generators (each returns {t,a[],c,tag,std,lvl}) ========
  function g2_add(){ const a=within(1,10), b=within(1,10), c=String(a+b);
    return {t:`What is ${a}+${b}?`, a:choiceSet(c,[a+b+1,a+b-1,a+b+2].map(String)), c, tag:'arithmetic', std:STD.M.G2_OA, lvl:2.3}; }
  function g3_place(){ const th=within(1,9), h=within(0,9), t=within(0,9), o=within(0,9);
    const num=th*1000+h*100+t*10+o; const value=[['thousands',th,1000],['hundreds',h,100],['tens',t,10],['ones',o,1]][within(0,3)];
    const c=String(value[1]*value[2]); return {t:`Value of the ${value[0]} digit in ${num}?`, a:choiceSet(c,[value[2],value[1],value[1]*10].map(String)), c, tag:'place-value', std:STD.M.G3_NBT, lvl:3.4}; }
  function g3_frac_equiv(){ const base=[[1,2],[2,3],[3,4]][within(0,2)], k=within(2,4);
    const c=`${base[0]*k}/${base[1]*k}`; return {t:`Which fraction is equivalent to ${base[0]}/${base[1]}?`, a:choiceSet(c,[`${base[0]}/${base[1]+1}`,`${base[0]+1}/${base[1]}`,`${base[0]*k}/${base[1]*k+1}`]), c, tag:'fractions', std:STD.M.G3_NF, lvl:3.8}; }
  function g4_area(){ const w=within(3,12), h=within(3,12); const c=String(w*h);
    return {t:`Area of a rectangle ${w}×${h}?`, a:choiceSet(c,[w+h,w*h+2,w*h-2].map(String)), c, tag:'geometry', std:STD.M.G4_MD, lvl:4.4}; }
  function g4_add_like_den(){ const den=pick([4,6,8,10,12]); const a1=within(1,den-1), a2=within(1,den-1);
    const num=a1+a2, c=`${num}/${den}`; return {t:`${a1}/${den} + ${a2}/${den} = ?`, a:choiceSet(c,[`${a1}/${den}`,`${a2}/${den}`,`${Math.abs(a1-a2)}/${den}`]), c, tag:'fractions', std:STD.M.G4_NF, lvl:4.7}; }
  function g5_dec_compare(){ const a=(within(10,99)/100).toFixed(2), b=(within(10,99)/100).toFixed(2); const bigger=parseFloat(a)>parseFloat(b)?a:b;
    return {t:`Which is greater? ${a} or ${b}`, a:choiceSet(bigger,[(parseFloat(bigger)-0.01).toFixed(2),'Equal',(parseFloat(bigger)+0.01).toFixed(2)]), c:bigger, tag:'decimals', std:STD.M.G5_NBT, lvl:5.0}; }
  function g6_percent(){ const base=[40,50,60,80,120][within(0,4)], pct=[10,15,20,25,30][within(0,4)];
    const c=String(Math.round(base*pct/100)); return {t:`${pct}% of ${base} = ?`, a:choiceSet(c,[Math.round(base*(pct+5)/100),Math.round(base*(pct-5)/100),Math.round(base*pct/100)+2].map(String)), c, tag:'percent', std:STD.M.G6_RP, lvl:6.0}; }
  function g6_one_step(){ const x=within(2,12), b=within(2,10); const c=String(x);
    return {t:`Solve x: x + ${b} = ${x+b}`, a:choiceSet(c,[x+1,x-1,b,x+b].map(String)), c, tag:'equations', std:STD.M.G6_EE, lvl:6.4}; }
  function g7_ints(){ const a=within(-9,9), b=within(-9,9), c=String(a+b);
    return {t:`Compute: ${a} + (${b})`, a:choiceSet(c,[a-b,-a+b,a+b+1].map(String)), c, tag:'integers', std:STD.M.G7_NS, lvl:6.8}; }
  function g7_triangle(){ const a1=within(35,85), a2=within(35,85); let cVal=180-a1-a2; if(cVal<=10)cVal+=20;
    return {t:`Triangle with angles ${a1}° and ${a2}°. Third angle?`, a:choiceSet(String(cVal),[cVal+10,cVal-10,a1].map(String)), c:String(cVal), tag:'angles', std:STD.M.G7_G, lvl:7.0}; }
  function g8_slope(){ const x1=within(0,6), y1=within(0,10), x2=x1+within(1,6), y2=y1+within(-5,5);
    const c=((y2-y1)/(x2-x1)).toFixed(2); return {t:`Slope between (${x1},${y1}) and (${x2},${y2})?`, a:choiceSet(c,[((y2-y1)/(x2-x1)+0.5).toFixed(2),((y2-y1)/(x2-x1)-0.5).toFixed(2),((y2+y1)/(x2-x1)).toFixed(2)]), c, tag:'functions', std:STD.M.G8_F, lvl:8.0}; }

  const MATH_GENS = [g2_add,g3_place,g3_frac_equiv,g4_area,g4_add_like_den,g5_dec_compare,g6_percent,g6_one_step,g7_ints,g7_triangle,g8_slope];

  // ======== ELA generators ========
  const PASSAGES = [
    { text:`The clouds gathered and the wind howled. Soon, droplets tapped the window.`,
      q:{t:'What is most likely happening?', c:'A storm is starting', w:['A sunny day','A parade','A quiet night'], std:STD.E.RI}, lvl:4.6 },
    { text:`Many plants bend toward light. Gardeners rotate pots so stems stay straight.`,
      q:{t:'What is the main idea?', c:'Plants grow toward light', w:['Plants hate water','Pots are heavy','Gardens are loud'], std:STD.E.RI}, lvl:4.8 },
    { text:`Maya practiced every day before the recital. When the curtain rose, she smiled with confidence.`,
      q:{t:'What can you infer?', c:'Maya felt ready to perform', w:['Maya forgot her part','Maya was late','Maya left early'], std:STD.E.RL}, lvl:5.2 }
  ];
  const SYN = [['eager','excited'],['scarce','rare'],['plentiful','abundant'],['assist','help'],['silent','quiet'],['purchase','buy']];
  const ANT = [['scarce','plentiful'],['difficult','easy'],['ancient','modern'],['expand','shrink']];
  function e_passage(){ const p=pick(PASSAGES); const d=p.q;
    return {t:`Read: “${p.text}” ${d.t}`, a:choiceSet(d.c,d.w), c:d.c, tag:'reading', std:d.std, lvl:p.lvl}; }
  function e_syn(){ const [w,s]=pick(SYN); const wrongs=shuffle(SYN.map(x=>x[1]).filter(x=>x!==s)).slice(0,3);
    return {t:`Choose a synonym for “${w}”.`, a:choiceSet(s,wrongs), c:s, tag:'vocab', std:STD.E.L, lvl:4.2}; }
  function e_ant(){ const [w,a]=pick(ANT); const wrongs=shuffle(ANT.map(x=>x[1]).filter(x=>x!==a)).slice(0,3);
    return {t:`Choose an antonym for “${w}”.`, a:choiceSet(a,wrongs), c:a, tag:'vocab', std:STD.E.L, lvl:4.8}; }

  const ELA_GENS = [e_passage,e_syn,e_ant];

  window.BANK = {
    MATH_GENS, ELA_GENS,
    TAG_TO_STD: {
      'arithmetic':'NY-2–3.OA.*','place-value':'NY-3.NBT.*','fractions':'NY-3–5.NF.*',
      'geometry':'NY-4.MD.*','decimals':'NY-5.NBT.*','percent':'NY-6.RP.*','equations':'NY-6.EE.*',
      'integers':'NY-6–7.NS.*','angles':'NY-7.G.*','functions':'NY-8.F.*',
      'reading':'NY-ELA.RI/RL.*','vocab':'NY-ELA.L.*'
    },
    utils:{ within, pick, shuffle, choiceSet }
  };
})();

