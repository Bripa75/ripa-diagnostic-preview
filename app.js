// app.js — Adaptive 20-item path (10 Math → 10 English). Grades 2–8.
// Difficulty goes up on correct, down on incorrect. Rotation avoids repeats per grade.
// Report now shows: current levels (decimals), expected vs grade, confidence %, strengths/priorities chips, standards toggle.

import { DIFF, MATH_ITEMS, PASSAGES, LANG_ITEMS } from './bank.js';

/* ---------------- Config ---------------- */
const TARGET = { math: 10, english: 10 }; // per student

/* ---------------- Rotation (per grade/phase) ---------------- */
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

/* ---------------- Helpers ---------------- */
const between = (n,a,b)=> n>=a && n<=b;
const pickOne = (arr)=> arr[Math.floor(Math.random()*arr.length)];
const clamp = (v,a,b)=> Math.max(a, Math.min(b,v));
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
function qIndexToDiff(i){ return i<=1 ? DIFF.CORE : i<=3 ? DIFF.ON : DIFF.STRETCH; }

/* Build grade-scoped pools */
function buildPools(grade){
  const mathByDiff = {
    [DIFF.CORE]:    MATH_ITEMS.filter(it => it.diff===DIFF.CORE    && between(grade, it.grade_min, it.grade_max)),
    [DIFF.ON]:      MATH_ITEMS.filter(it => it.diff===DIFF.ON      && between(grade, it.grade_min, it.grade_max)),
    [DIFF.STRETCH]: MATH_ITEMS.filter(it => it.diff===DIFF.STRETCH && between(grade, it.grade_min, it.grade_max)),
  };

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

  for (const d of order){
    const pool = poolMap[d].filter(x => !usedIds.has(x.id) && !seenSet.has(x.id));
    if (pool.length) return { item: pickOne(pool), usedDiff: d };
  }
  for (const d of order){
    const pool = poolMap[d].filter(x => !usedIds.has(x.id));
    if (pool.length) return { item: pickOne(pool), usedDiff: d };
  }
  const any = Object.values(poolMap).flat().filter(x=>!usedIds.has(x.id));
  if (any.length) return { item: pickOne(any), usedDiff: DIFF.ON };
  return { item: null, usedDiff: wantDiff };
}

/* ---------------- Runtime State ---------------- */
let state = null;

function initState(grade){
  const pools = buildPools(grade);
  state = {
    grade,
    phase: "math",
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
    current: null,
    lastDiffs: [] // for confidence/flavor
  };
}

/* ---------------- DOM helpers ---------------- */
function el(tag, attrs={}, children=[]){
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([k,v])=>{
    if (k==="class") node.className = v;
    else if (k.startsWith("on") && typeof v==="function") {
      node.addEventListener(k.substring(2).toLowerCase(), v); // normalize event names
    } else node.setAttribute(k,v);
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

/* ---------------- Render current ---------------- */
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
  addSeen(state.grade, state.phase, item.id);

  if (item.context){ container.append(el("div",{class:"passage"}, item.context)); }

  const li = el("div",{class:"item"});
  li.append(el("div",{class:"qtext"}, item.stem));

  const wrap = el("div",{class:"choices"});
  (item.choices||[]).forEach(c=>{
    wrap.append(el("button",{class:"btn", onClick: ()=>answer(c)}, c));
  });
  li.append(wrap);
  container.append(li);
}

/* ---------------- Answer (adaptive) ---------------- */
function diffToScore(d){ return d===DIFF.CORE?1:d===DIFF.ON?2:3; }

function answer(chosen){
  if (!state || !state.current) return;
  const item = state.current;
  const isCorrect = String(chosen) === String(item.answer);
  state.total++; if (isCorrect) state.correct++;

  if (state.phase==="math"){
    const strand = item.strand || "NO";
    state.strands[strand][1]++; if (isCorrect) state.strands[strand][0]++;
    state.mathDiff = isCorrect
      ? (state.mathDiff===DIFF.CORE ? DIFF.ON : DIFF.STRETCH)
      : (state.mathDiff===DIFF.STRETCH ? DIFF.ON : DIFF.CORE);
    state.lastDiffs.push(diffToScore(state.mathDiff));
  } else {
    const k = item.domain || "RL";
    state.strands[k][1]++; if (isCorrect) state.strands[k][0]++;
    state.engDiff = isCorrect
      ? (state.engDiff===DIFF.CORE ? DIFF.ON : DIFF.STRETCH)
      : (state.engDiff===DIFF.STRETCH ? DIFF.ON : DIFF.CORE);
    state.lastDiffs.push(diffToScore(state.engDiff));
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

/* ---------------- Report helpers ---------------- */
function levelForPct(p){
  if (p >= 85) return {level:4, label:"Exceeds Grade Level"};
  if (p >= 70) return {level:3, label:"On Grade Level"};
  if (p >= 50) return {level:2, label:"Approaching Grade Level"};
  return {level:1, label:"Below Grade Level"};
}
function estimateGradeLevel(pctScore, gradeRef){
  // Smooth decimal level like 2.2, 5.7 etc; 50% ≈ gradeRef, ±0.5 spread
  const gl = gradeRef - 0.5 + (pctScore/100);
  return Math.round(gl*10)/10;
}
function confidencePct(mathPct, engPct){
  // Based on completeness, difficulty trend, and separation from guess band
  const completeness = state.total / state.totalTarget;         // 0..1
  const trend = clamp((state.lastDiffs.slice(-6).reduce((a,b)=>a+b,0)/ (6*3)) || 0, 0, 1); // last 6 diffs avg / 3
  const separation = (Math.abs(mathPct-50) + Math.abs(engPct-50)) / 100; // 0..1
  const raw = 0.35*completeness + 0.35*trend + 0.30*separation;
  return Math.round(clamp(40 + raw*60, 40, 95)); // 40–95%
}
const TAGS = {
  NO:["place-value","integers"],
  FR:["fractions","percent"],
  ALG:["equations","functions"],
  GEOM:["geometry","area"],
  MD:["data","measurement"],
  RL:["reading","theme"],
  RI:["reading","main-idea"],
  LANG:["vocab","conventions"]
};

function strengthsAndPriorities(s){
  const all = Object.entries(s).map(([k,[c,t]])=>({k, p: pct(c,t), t}));
  const strengths = all.filter(x=>x.t>0).sort((a,b)=> b.p-a.p).slice(0,5);
  const priorities = all.filter(x=>x.t>0).sort((a,b)=> a.p-b.p).slice(0,4);
  const chip = (arr)=> [...new Set(arr.flatMap(x=>TAGS[x.k]||[x.k]))].slice(0,8);
  return { strengths: chip(strengths), priorities: chip(priorities) };
}

function ensureReportStyles(){
  if (document.getElementById("reportStyles")) return;
  const css = `
  .report-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
  @media (max-width: 900px){.report-grid{grid-template-columns:1fr}}
  .statCard{background:var(--glass);border:1px solid var(--stroke);border-radius:14px;padding:14px}
  .statCard .big{font-size:28px;font-weight:800}
  .chipRow{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}
  .chip{padding:6px 10px;border-radius:999px;border:1px solid var(--stroke);background:rgba(255,255,255,.05);font-weight:600}
  .btnGhost{padding:10px 12px;border-radius:12px;border:1px solid var(--stroke);background:rgba(255,255,255,.04);cursor:pointer}
  .mini{font-size:12px;color:var(--muted)}
  `;
  const tag = document.createElement("style");
  tag.id = "reportStyles"; tag.innerText = css;
  document.head.appendChild(tag);
}

/* ---------------- Finish & render report ---------------- */
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
  const curMathGL = estimateGradeLevel(mathPct, state.grade);
  const curEngGL  = estimateGradeLevel(engPct,  state.grade);
  const conf = confidencePct(mathPct, engPct);
  const { strengths, priorities } = strengthsAndPriorities(s);

  ensureReportStyles();

  const report = document.getElementById("report");
  report.innerHTML = `
    <div class="title">Instant Report</div>
    <p class="examMuted">Estimates by domain, confidence, targets vs grade, strengths & priorities, plus a quick action plan.</p>

    <div class="report-grid" style="margin-top:8px">
      <div class="statCard">
        <div class="label">Math level (current)</div>
        <div class="big">${curMathGL.toFixed(1)}</div>
        <div class="mini">Level ${mathLevel.level} — ${mathLevel.label}</div>
      </div>
      <div class="statCard">
        <div class="label">ELA level (current)</div>
        <div class="big">${curEngGL.toFixed(1)}</div>
        <div class="mini">Level ${engLevel.level} — ${engLevel.label}</div>
      </div>
      <div class="statCard">
        <div class="label">Overall confidence</div>
        <div class="big">${conf}%</div>
      </div>

      <div class="statCard">
        <div class="label">Math expected</div>
        <div class="big">${state.grade.toFixed(1)}</div>
        <div class="mini">${Math.abs(curMathGL - state.grade) <= 0.2 ? "On track (±0.2)" : (curMathGL > state.grade ? "Above" : "Below")}</div>
      </div>
      <div class="statCard">
        <div class="label">ELA expected</div>
        <div class="big">${state.grade.toFixed(1)}</div>
        <div class="mini">${Math.abs(curEngGL - state.grade) <= 0.2 ? "On track (±0.2)" : (curEngGL > state.grade ? "Above" : "Below")}</div>
      </div>
      <div class="statCard">
        <div class="label">Grade reference</div>
        <div class="big">Grade ${state.grade}</div>
      </div>
    </div>

    <div class="statCard" style="margin-top:12px">
      <div class="label">Strengths</div>
      <div class="chipRow">${strengths.map(t=>`<span class="chip">${t}</span>`).join("")}</div>
      <div class="label" style="margin-top:10px">Priorities</div>
      <div class="chipRow">${priorities.map(t=>`<span class="chip">${t}</span>`).join("")}</div>
    </div>

    <div class="statCard" style="margin-top:12px">
      <label class="label" style="display:flex;align-items:center;gap:8px">
        <input type="checkbox" id="showStd"> Show standards details
      </label>
      <div id="stdBox" style="display:none;margin-top:8px">
        <ul style="margin:6px 0 0 18px">
          ${Object.entries(s).map(([k,[c,t]])=>`<li><b>${k}</b>: ${t?Math.round(100*c/t):0}% (${c}/${t})</li>`).join("")}
        </ul>
      </div>
    </div>

    <div class="statCard" style="margin-top:12px">
      <div class="title" style="margin:0 0 6px">Action Plan — Next 1–2 Weeks</div>
      ${renderActionPlan(s)}
      <p class="examMuted" style="margin-top:8px">Structure: Mini-lesson (8–10m) → Guided (15m) → Independent (15m) → 2–3Q exit ticket.</p>
    </div>

    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px">
      <button class="btnGhost" id="dlBtn">Download PDF</button>
      <button class="btnGhost" id="sendBtn">Send to Tutor</button>
    </div>

    <div class="examMuted" style="margin-top:12px">Mini-FAQ: Grades 2–8 • Length: 20 adaptive questions • Private: runs in the browser; only results you submit are saved.</div>
  `;

  // toggle standards details
  const cb = document.getElementById("showStd");
  const box = document.getElementById("stdBox");
  cb?.addEventListener("change", ()=> box.style.display = cb.checked ? "block" : "none");
}

function renderActionPlan(strandScores){
  const keysMath = ["NO","FR","ALG","GEOM","MD"];
  const keysEng  = ["RL","RI","LANG"].filter(k=> (strandScores[k]?.[1]||0)>0);

  const rank = (keys)=> keys
    .map(k=>({k, p: pct(strandScores[k][0], strandScores[k][1])}))
    .sort((a,b)=> a.p - b.p)
    .slice(0,2);

  const tips = {
    NO: "Fluency with multi-digit add/sub; 10-minute daily warm-ups (mixed operations).",
    FR: "Equivalence with models; number lines → area models → procedures.",
    ALG:"Translate words→expressions; 1–2 step equations using inverse operations.",
    GEOM:"Area/perimeter & right-triangle relationships; sketch and label steps.",
    MD: "Graphs, units, & volume; read tables/plots then solve multi-step problems.",
    RL: "Theme & inference from character actions; cite two pieces of evidence.",
    RI: "Main idea, text structure, vocab-in-context; annotate headings/captions.",
    LANG:"Commas in a series/nonrestrictives; daily 3-minute edit drills."
  };

  const m = rank(keysMath).map(x=>`<li><b>${x.k}</b> — ${x.p}%: ${tips[x.k]}</li>`).join("");
  const e = rank(keysEng).map(x=>`<li><b>${x.k}</b> — ${x.p}%: ${tips[x.k]}</li>`).join("");

  return `
    <div class="label">Math Focus</div>
    <ol style="margin:4px 0 10px 18px">${m}</ol>
    <div class="label">English Focus</div>
    <ol style="margin:4px 0 0 18px">${e || "<li>Collect more English items to refine focus.</li>"}</ol>
  `;
}

/* ---------------- Boot ---------------- */
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

