// app.js — Adaptive engine (20 Q total): 10 Math then 10 English.
// Difficulty moves up on correct, down on incorrect. Grades 2–8.
// Shows live progress, locks the test on completion, and renders a final report.

import {
  DIFF,
  MATH_ITEMS, PASSAGES, LANG_ITEMS
} from './bank.js';

/* ---------- Config ---------- */
const TARGET = { math: 10, english: 10 };   // 20 total

/* ---------- Helpers ---------- */
const between = (n,a,b)=> n>=a && n<=b;
const pickOne = (arr)=> arr[Math.floor(Math.random()*arr.length)];
const pct = (c,t)=> t ? Math.round(100*c/t) : 0;

function makeEnglishQuestionEnvelope(p, q, diffTag){
  // Flatten passage + question to a single renderable item
  return {
    id: `E-${p.id}-${q.id}`,
    domain: p.type,             // RL or RI
    diff: diffTag,              // 'core' | 'on' | 'stretch'
    stem: q.stem,
    choices: q.choices,
    answer: q.answer,
    context: p.text
  };
}

/* Map index→difficulty for passage questions (keeps you from editing the bank) */
function qIndexToDiff(i){
  // 0–1 core, 2–3 on, 4–5 stretch (safe for 4–6 Q passages)
  if (i <= 1) return DIFF.CORE;
  if (i <= 3) return DIFF.ON;
  return DIFF.STRETCH;
}

/* Build grade-scoped pools */
function buildPools(grade){
  // Math pools by difficulty
  const mathByDiff = {
    [DIFF.CORE]:    MATH_ITEMS.filter(it => it.diff===DIFF.CORE    && between(grade, it.grade_min, it.grade_max)),
    [DIFF.ON]:      MATH_ITEMS.filter(it => it.diff===DIFF.ON      && between(grade, it.grade_min, it.grade_max)),
    [DIFF.STRETCH]: MATH_ITEMS.filter(it => it.diff===DIFF.STRETCH && between(grade, it.grade_min, it.grade_max)),
  };

  // English: flatten RL/RI passage questions to items + include Language items
  const englishPool = { [DIFF.CORE]:[], [DIFF.ON]:[], [DIFF.STRETCH]:[] };
  PASSAGES.forEach(p=>{
    if (!between(grade, p.grade_band[0], p.grade_band[1])) return;
    (p.questions || []).forEach((q, idx)=>{
      const diff = qIndexToDiff(idx);
      englishPool[diff].push(makeEnglishQuestionEnvelope(p, q, diff));
    });
  });
  // Language questions serve as additional English items
  LANG_ITEMS.forEach(it=>{
    if (!between(grade, it.grade_min, it.grade_max)) return;
    englishPool[it.diff]?.push({
      id:`E-LANG-${it.id}`,
      domain:"LANG",
      diff:it.diff,
      stem:it.stem,
      choices:it.choices,
      answer:it.answer,
      context:null
    });
  });

  return { mathByDiff, englishPool };
}

/* ---------- Adaptive picker ---------- */
function takeFrom(poolMap, wantDiff, usedIds){
  // try want → adjacent → any
  const order = wantDiff===DIFF.CORE
    ? [DIFF.CORE, DIFF.ON, DIFF.STRETCH]
    : wantDiff===DIFF.ON
      ? [DIFF.ON, DIFF.CORE, DIFF.STRETCH]
      : [DIFF.STRETCH, DIFF.ON, DIFF.CORE];

  for (const d of order){
    const pool = poolMap[d].filter(x => !usedIds.has(x.id));
    if (pool.length) return { item: pickOne(pool), usedDiff: d };
  }

  // As a last resort, search *any* difficulty
  const any = Object.values(poolMap).flat().filter(x=>!usedIds.has(x.id));
  if (any.length) return { item: pickOne(any), usedDiff: DIFF.ON };
  return { item: null, usedDiff: wantDiff };
}

/* ---------- Runtime State ---------- */
let state = null;

function initState(grade){
  const pools = buildPools(grade);
  state = {
    grade,
    phase: "math",                  // "math" then "english"
    targetInPhase: TARGET.math,
    answeredInPhase: 0,
    totalTarget: TARGET.math + TARGET.english,

    // difficulty cursors
    mathDiff: DIFF.ON,
    engDiff: DIFF.ON,

    // scoring & exposure
    usedIds: new Set(),
    correct: 0,
    total: 0,
    strands: { NO:[0,0], FR:[0,0], ALG:[0,0], GEOM:[0,0], MD:[0,0], RL:[0,0], RI:[0,0], LANG:[0,0] },

    pools,
    current: null
  };
}

/* ---------- Rendering ---------- */
function el(tag, attrs={}, children=[]){
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([k,v])=>{
    if (k==="class") node.className = v;
    else if (k.startsWith("on") && typeof v==="function") node.addEventListener(k.substring(2), v);
    else node.setAttribute(k,v);
  });
  (Array.isArray(children)?children:[children]).forEach(c=> node.append(c instanceof Node ? c : document.createTextNode(String(c))));
  return node;
}

function setProgress(){
  const pf = document.getElementById("progFill");
  if (!pf || !state) return;
  const ratio = state.total / state.totalTarget;
  pf.style.width = `${Math.min(100, Math.round(ratio*100))}%`;
}

/* Draw current question */
function renderCurrent(container){
  container.innerHTML = "";

  if (!state) return;

  const domainLabel = state.phase === "math" ? "Math" : "English";
  container.append(el("div",{class:"label"}, `${domainLabel} Question ${state.answeredInPhase+1} of ${state.targetInPhase}`));

  // pick next item by adaptive diff
  let picked;
  if (state.phase==="math"){
    picked = takeFrom(state.pools.mathByDiff, state.mathDiff, state.usedIds);
  } else {
    picked = takeFrom(state.pools.englishPool, state.engDiff, state.usedIds);
  }
  const { item } = picked;

  if (!item){
    // If no item available (extreme edge), advance phase or finish
    advancePhaseOrFinish(container);
    return;
  }

  state.current = item;
  state.usedIds.add(item.id);

  // Context (for reading questions)
  if (item.context){
    container.append(el("div",{class:"passage"}, item.context));
  }

  // Stem + choices
  const li = el("div",{class:"item"});
  li.append(el("div",{class:"qtext"}, item.stem));

  const choiceWrap = el("div",{class:"choices"});
  item.choices.forEach(c=>{
    const btn = el("button",{class:"btn", onClick: ()=>answer(c)}, c);
    choiceWrap.append(btn);
  });
  li.append(choiceWrap);

  container.append(li);
}

/* ---------- Answer handler (adaptive) ---------- */
function answer(chosen){
  if (!state || !state.current) return;

  const item = state.current;
  const isCorrect = String(chosen) === String(item.answer);
  state.total++;
  if (isCorrect) state.correct++;

  // strand bookkeeping
  if (state.phase==="math"){
    const strand = item.strand || (MATH_ITEMS.find(x=>x.id===item.id)?.strand) || "NO";
    state.strands[strand][1]++;          // total
    if (isCorrect) state.strands[strand][0]++; // correct

    // adapt difficulty for next math question
    state.mathDiff = isCorrect
      ? (state.mathDiff===DIFF.CORE ? DIFF.ON : DIFF.STRETCH)
      : (state.mathDiff===DIFF.STRETCH ? DIFF.ON : DIFF.CORE);

    state.answeredInPhase++;
  } else {
    // English: domain is RL/RI/LANG already on the item
    const k = item.domain || "RL";
    state.strands[k][1]++;
    if (isCorrect) state.strands[k][0]++;

    // adapt difficulty for next english question
    state.engDiff = isCorrect
      ? (state.engDiff===DIFF.CORE ? DIFF.ON : DIFF.STRETCH)
      : (state.engDiff===DIFF.STRETCH ? DIFF.ON : DIFF.CORE);

    state.answeredInPhase++;
  }

  // progress UI
  setProgress();

  // advance or finish
  const container = document.getElementById("mount");
  if (state.answeredInPhase >= state.targetInPhase){
    advancePhaseOrFinish(container);
  } else {
    renderCurrent(container);
  }
}

function advancePhaseOrFinish(container){
  if (state.phase==="math"){
    state.phase = "english";
    state.targetInPhase = TARGET.english;
    state.answeredInPhase = 0;
    renderCurrent(container);
    return;
  }
  // finished both phases
  finishTest();
}

/* ---------- Report ---------- */
function levelForPct(p){
  if (p >= 85) return {level:4, label:"Exceeds Grade Level"};
  if (p >= 70) return {level:3, label:"On Grade Level"};
  if (p >= 50) return {level:2, label:"Approaching Grade Level"};
  return {level:1, label:"Below Grade Level"};
}

function buildActionPlan(strandScores){
  const keysMath = ["NO","FR","ALG","GEOM","MD"];
  const keysEng  = ["RL","RI","LANG"].filter(k=> (strandScores[k]?.[1]||0)>0);

  const rank = (keys)=> keys
    .map(k=>({k, p: pct(strandScores[k][0], strandScores[k][1])}))
    .sort((a,b)=> a.p - b.p)
    .slice(0,2);

  const suggestions = {
    NO: "Fluency with multi-digit addition/subtraction; daily 10-minute computation warm-up.",
    FR: "Fraction models & equivalence; use number lines/area models before algorithms.",
    ALG:"Translate words→expressions; 1–2 step equations using inverse operations.",
    GEOM:"Area/perimeter and triangle/angle relationships; sketch and label steps.",
    MD: "Graphs, units, & volume; read tables/plots then solve multi-step problems.",
    RL: "Theme & inference from character actions; cite two pieces of evidence.",
    RI: "Main idea, text structure, vocab-in-context; annotate headings & captions.",
    LANG:"Commas in a series/nonrestrictives; daily 3-minute edit drills."
  };

  const fmt = (x)=> `${x.k}: ${x.p}% — ${suggestions[x.k]}`;
  return {
    math: rank(keysMath).map(fmt),
    english: rank(keysEng).map(fmt)
  };
}

function finishTest(){
  // lock UI
  const mount = document.getElementById("mount");
  mount.innerHTML = "";
  const stopNote = el("p",{class:"examMuted"},"Test complete. See Instant Report below.");
  mount.append(stopNote);

  const pf = document.getElementById("progFill");
  if (pf) pf.style.width = "100%";

  // Compute domain totals from strand buckets
  const s = state.strands;
  const mathC = ["NO","FR","ALG","GEOM","MD"].reduce((sum,k)=>sum + (s[k]?.[0]||0), 0);
  const mathT = ["NO","FR","ALG","GEOM","MD"].reduce((sum,k)=>sum + (s[k]?.[1]||0), 0);
  const engC  = ["RL","RI","LANG"].reduce((sum,k)=>sum + (s[k]?.[0]||0), 0);
  const engT  = ["RL","RI","LANG"].reduce((sum,k)=>sum + (s[k]?.[1]||0), 0);

  const mathPct = pct(mathC, mathT);
  const engPct  = pct(engC, engT);
  const mathLevel = levelForPct(mathPct);
  const engLevel  = levelForPct(engPct);

  const action = buildActionPlan(s);

  const report = document.getElementById("report");
  report.innerHTML = `
    <div class="title">Instant Report</div>
    <div class="grid3" style="margin-top:10px">
      <div class="kpiBox"><div class="label">Math</div><div class="num">${mathPct}%</div><div class="examMuted">Level ${mathLevel.level} — ${mathLevel.label}</div></div>
      <div class="kpiBox"><div class="label">English</div><div class="num">${engPct}%</div><div class="examMuted">Level ${engLevel.level} — ${engLevel.label}</div></div>
      <div class="kpiBox"><div class="label">Overall</div><div class="num">${pct(mathC+engC, mathT+engT)}%</div><div class="examMuted">Adaptive 20-item path</div></div>
    </div>

    <div class="label" style="margin-top:14px">Exact Strand Breakdown</div>
    <ul style="margin:6px 0 0 20px">
      ${Object.entries(s).map(([k,[c,t]])=>`<li><b>${k}</b>: ${t?Math.round(100*c/t):0}% (${c}/${t})</li>`).join("")}
    </ul>

    <div class="label" style="margin-top:14px">Action Plan — Next 1–2 Weeks</div>
    <div class="examCard">
      <div class="title" style="margin:0 0 6px">Math Focus</div>
      <ol style="margin:0 0 10px 18px">${action.math.map(x=>`<li>${x}</li>`).join("")}</ol>
      <div class="title" style="margin:10px 0 6px">English Focus</div>
      <ol style="margin:0 0 10px 18px">${action.english.map(x=>`<li>${x}</li>`).join("")}</ol>
      <p class="examMuted">Structure: Mini-lesson (8–10m) → Guided (15m) → Independent (15m) → 2–3 Q exit ticket.</p>
    </div>
  `;
}

/* ---------- Public boot ---------- */
export function boot(){
  const gradeSel = document.getElementById("grade");
  const startBtn = document.getElementById("startBtn");
  const mount = document.getElementById("mount");
  const report = document.getElementById("report");

  startBtn?.addEventListener("click", ()=>{
    const grade = Number(gradeSel.value || 5);
    initState(grade);
    report.innerHTML = "";
    setProgress();
    renderCurrent(mount);
  });
}
