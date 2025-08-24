// app.js — Adaptive 20-question path (10 Math → 10 English) for grades 2–8.
// Uses the 200-question bank in bank.js. Difficulty moves up on correct / down on incorrect.
// Rotates unseen items per grade across attempts (localStorage).
// Ends automatically and shows a leveled Instant Report + Action Plan.

import { DIFF, MATH_ITEMS, PASSAGES, LANG_ITEMS } from './bank.js';

/* ---------- Config ---------- */
const TARGET = { math: 10, english: 10 }; // total 20 per student

/* ---------- Seen-rotation (per grade & phase) ---------- */
const SEEN_PREFIX = "ripa_seen_v1";
function loadSeen(grade, phase){
  try { return new Set(JSON.parse(localStorage.getItem(`${SEEN_PREFIX}_${grade}_${phase}`))||[]); }
  catch { return new Set(); }
}
function addSeen(grade, phase, id){
  const key = `${SEEN_PREFIX}_${grade}_${phase}`;
  const cur = loadSeen(grade, phase);
  cur.add(id);
  localStorage.setItem(key, JSON.stringify([...cur]));
}

/* ---------- Helpers ---------- */
const between = (n,a,b)=> n>=a && n<=b;
const pickOne = (arr)=> arr[Math.floor(Math.random()*arr.length)];
const pct = (c,t)=> t ? Math.round(100*c/t) : 0;

function flattenPassageQuestion(p, q, diffTag){
  return {
    id: `E-${p.id}-${q.id}`,
    domain: p.type,     // RL or RI
    diff: diffTag,
    stem: q.stem,
    choices: q.choices,
    answer: q.answer,
    context: p.text
  };
}
// Map question index to difficulty band
function qIndexToDiff(i){ return i<=1 ? DIFF.CORE : i<=3 ? DIFF.ON : DIFF.STRETCH; }

// Build grade-scoped pools
function buildPools(grade){
  // Math by difficulty
  const mathByDiff = {
    [DIFF.CORE]:    MATH_ITEMS.filter(it => it.diff===DIFF.CORE    && between(grade, it.grade_min, it.grade_max)),
    [DIFF.ON]:      MATH_ITEMS.filter(it => it.diff===DIFF.ON      && between(grade, it.grade_min, it.grade_max)),
    [DIFF.STRETCH]: MATH_ITEMS.filter(it => it.diff===DIFF.STRETCH && between(grade, it.grade_min, it.grade_max)),
  };

  // English pool: RL/RI flattened + Language
  const englishPool = { [DIFF.CORE]:[], [DIFF.ON]:[], [DIFF.STRETCH]:[] };

  PASSAGES.forEach(p=>{
    if (!between(grade, p.grade_band[0], p.grade_band[1])) return;
    (p.questions||[]).forEach((q, idx)=>{
      const diff = qIndexToDiff(idx);
      englishPool[diff].push(flattenPassageQuestion(p, q, diff));
    });
  });

  LANG_ITEMS.forEach(it=>{
    if (!between(grade, it.grade_min, it.grade_max)) return;
    englishPool[it.diff].push({
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

/* Difficulty-aware, rotation-aware picker */
function takeFrom(poolMap, wantDiff, usedIds, seenSet){
  const order = wantDiff===DIFF.CORE
    ? [DIFF.CORE, DIFF.ON, DIFF.STRETCH]
    : wantDiff===DIFF.ON
      ? [DIFF.ON, DIFF.CORE, DIFF.STRETCH]
      : [DIFF.STRETCH, DIFF.ON, DIFF.CORE];

  // Try avoiding both in-test and seen items first
  for (const d of order){
    const pool = poolMap[d].filter(x => !usedIds.has(x.id) && !seenSet.has(x.id));
    if (pool.length) return { item: pickOne(pool), usedDiff: d, avoidedSeen: true };
  }
  // Then allow seen items if we must
  for (const d of order){
    const pool = poolMap[d].filter(x => !usedIds.has(x.id));
    if (pool.length) return { item: pickOne(pool), usedDiff: d, avoidedSeen: false };
  }
  // Finally, any remaining
  const any = Object.values(poolMap).flat().filter(x=>!usedIds.has(x.id));
  if (any.length) return { item: pickOne(any), usedDiff: DIFF.ON, avoidedSeen: false };
  return { item: null, usedDiff: wantDiff, avoidedSeen: false };
}

/* ---------- Runtime State ---------- */
let state = null;

function initState(grade){
  const pools = buildPools(grade);
  state = {
    grade,
    phase: "math",                       // then "english"
    targetInPhase: TARGET.math,
    answeredInPhase: 0,
    totalTarget: TARGET.math + TARGET.english,

    mathDiff: DIFF.ON,
    engDiff: DIFF.ON,

    usedIds: new Set(),
    correct: 0,
    total: 0,
    strands: { NO:[0,0], FR:[0,0], ALG:[0,0], GEOM:[0,0], MD:[0,0], RL:[0,0], RI:[0,0], LANG:[0,0] },

    pools,
    current: null
  };
}

/* ---------- DOM helpers ---------- */
function el(tag, attrs={}, children=[]){
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([k,v])=>{
    if (k==="class") node.className = v;
    else if (k.startsWith("on") && typeof v==="function") {
      // FIX: normalize event to lowercase so onClick / onCLICK work
      const evt = k.substring(2).toLowerCase();
      node.addEventListener(evt, v);
    } else {
      node.setAttribute(k,v);
    }
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

/* ---------- Render next ---------- */
function renderCurrent(container){
  container.innerHTML = "";

  if (!state) return;
  const domainLabel = state.phase === "math" ? "Math" : "English";
  container.append(el("div",{class:"label"}, `${domainLabel} Question ${state.answeredInPhase+1} of ${state.targetInPhase}`));

  const seen = loadSeen(state.grade, state.phase);
  const picked = state.phase==="math"
    ? takeFrom(state.pools.mathByDiff, state.mathDiff, state.usedIds, seen)
    : takeFrom(state.pools.englishPool, state.engDiff, state.usedIds, seen);

  const item = picked.item;
  if (!item){ advancePhaseOrFinish(container); return; }

  state.current = item;
  state.usedIds.add(item.id);
  addSeen(state.grade, state.phase, item.id); // persist rotation

  if (item.context){ container.append(el("div",{class:"passage"}, item.context)); }

  const li = el("div",{class:"item"});
  li.append(el("div",{class:"qtext"}, item.stem));

  const choiceWrap = el("div",{class:"choices"});
  (item.choices||[]).forEach(c=>{
    // NOTE: using onClick; binder lowercases to 'click'
    const btn = el("button",{class:"btn", onClick: ()=>answer(c)}, c);
    choiceWrap.append(btn);
  });
  li.append(choiceWrap);
  container.append(li);
}

/* ---------- Answer (adaptive) ---------- */
function answer(chosen){
  if (!state || !state.current) return;
  const item = state.current;
  const isCorrect = String(chosen) === String(item.answer);
  state.total++;
  if (isCorrect) state.correct++;

  if (state.phase==="math"){
    const strand = item.strand || "NO";
    state.strands[strand][1]++; if (isCorrect) state.strands[strand][0]++;
    // adapt next math difficulty
    state.mathDiff = isCorrect
      ? (state.mathDiff===DIFF.CORE ? DIFF.ON : DIFF.STRETCH)
      : (state.mathDiff===DIFF.STRETCH ? DIFF.ON : DIFF.CORE);
  } else {
    const k = item.domain || "RL";
    state.strands[k][1]++; if (isCorrect) state.strands[k][0]++;
    // adapt next english difficulty
    state.engDiff = isCorrect
      ? (state.engDiff===DIFF.CORE ? DIFF.ON : DIFF.STRETCH)
      : (state.engDiff===DIFF.STRETCH ? DIFF.ON : DIFF.CORE);
  }

  state.answeredInPhase++;
  setProgress();

  const container = document.getElementById("mount");
  if (state.answeredInPhase >= state.targetInPhase) advancePhaseOrFinish(container);
  else renderCurrent(container);
}

function advancePhaseOrFinish(container){
  if (state.phase==="math"){
    state.phase = "english";
    state.targetInPhase = TARGET.english;
    state.answeredInPhase = 0;
    renderCurrent(container);
  } else {
    finishTest();
  }
}

/* ---------- Reporting ---------- */
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

  const tips = {
    NO: "Fluency with multi-digit add/sub; 10-minute daily warm-ups.",
    FR: "Equivalence with models; number lines & area models, then procedures.",
    ALG:"Translate words→expressions; 1–2 step equations using inverse operations.",
    GEOM:"Area/perimeter & right-triangle relationships; sketch and label.",
    MD: "Graphs, units, & volume; read tables/plots then solve multi-step problems.",
    RL: "Theme & inference from character actions; cite two pieces of evidence.",
    RI: "Main idea, text structure, vocab-in-context; annotate headings/captions.",
    LANG:"Commas in a series/nonrestrictives; daily 3-minute edit drills."
  };

  const fmt = (x)=> `${x.k}: ${x.p}% — ${tips[x.k]}`;
  return { math: rank(keysMath).map(fmt), english: rank(keysEng).map(fmt) };
}

function finishTest(){
  const mount = document.getElementById("mount");
  mount.innerHTML = "";
  mount.append(el("p",{class:"examMuted"},"Test complete. See Instant Report below."));

  const pf = document.getElementById("progFill");
  if (pf) pf.style.width = "100%";

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
      <p class="examMuted">Structure: Mini-lesson (8–10m) → Guided (15m) → Independent (15m) → 2–3Q exit ticket.</p>
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

