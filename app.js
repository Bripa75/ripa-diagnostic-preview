// app.js — Adaptive 20-item path (10 Math → 10 English). Grades 2–8.

import { DIFF, MATH_ITEMS, PASSAGES, LANG_ITEMS } from './bank.js';

/* ---------------- Config ---------------- */
const TARGET = { math: 10, english: 10 }; // per student

const NOTIFY_THROTTLE_MS = 2 * 60 * 1000; // 2 minutes
const NOTIFY_TS_KEY = "ripa_notify_last_ts_v1";

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

/* ---------------- Difficulty buffer: 3-in-a-row to move ---------------- */
function adjustDiff3(curDiff, buf, isCorrect){
  const nextBuf = isCorrect ? Math.min(3, buf + 1) : Math.max(-3, buf - 1);
  if (nextBuf >= 3)  return { diff: (curDiff===DIFF.CORE ? DIFF.ON : DIFF.STRETCH), buf: 0 };
  if (nextBuf <= -3) return { diff: (curDiff===DIFF.STRETCH ? DIFF.ON : DIFF.CORE), buf: 0 };
  return { diff: curDiff, buf: nextBuf };
}

/* ---------------- Coverage plans ---------------- */
function buildMathPlan(){
  // Two of each strand → 10 slots
  const strands = ["NO","FR","ALG","GEOM","MD"];
  const plan = [...strands, ...strands];
  for (let i = plan.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [plan[i], plan[j]] = [plan[j], plan[i]];
  }
  // avoid adjacents
  for (let i=1; i<plan.length; i++){
    if (plan[i] === plan[i-1]){
      const swapWith = (i+1 < plan.length) ? i+1 : i-2;
      if (swapWith >=0 && swapWith < plan.length){
        [plan[i], plan[swapWith]] = [plan[swapWith], plan[i]];
      }
    }
  }
  return plan;
}

function buildEnglishPlan(){
  // 4 RL + 4 RI + 2 LANG → 10 slots
  const plan = ["RL","RL","RL","RL","RI","RI","RI","RI","LANG","LANG"];
  for (let i = plan.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [plan[i], plan[j]] = [plan[j], plan[i]];
  }
  for (let i=1; i<plan.length; i++){
    if (plan[i] === plan[i-1]){
      const swapWith = (i+1 < plan.length) ? i+1 : i-2;
      if (swapWith >=0 && swapWith < plan.length){
        [plan[i], plan[swapWith]] = [plan[swapWith], plan[i]];
      }
    }
  }
  return plan;
}

/* ---------------- Strand/domain-aware picker with fallback ---------------- */
function takeFromWithKey(poolMap, wantDiff, usedIds, seenSet, keyField, keyValue){
  const order = wantDiff===DIFF.CORE ? [DIFF.CORE, DIFF.ON]
              : wantDiff===DIFF.ON   ? [DIFF.ON, DIFF.CORE, DIFF.STRETCH]
              :                        [DIFF.STRETCH, DIFF.ON];

  // Pass 1: unseen + unused
  for (const d of order){
    const pool = poolMap[d].filter(x =>
      !usedIds.has(x.id) && !seenSet.has(x.id) && (keyValue ? x[keyField]===keyValue : true)
    );
    if (pool.length) return { item: pickOne(pool), usedDiff: d };
  }
  // Pass 2: allow seen, still avoid used
  for (const d of order){
    const pool = poolMap[d].filter(x =>
      !usedIds.has(x.id) && (keyValue ? x[keyField]===keyValue : true)
    );
    if (pool.length) return { item: pickOne(pool), usedDiff: d };
  }
  return { item: null, usedDiff: wantDiff };
}

/* ---------------- Dev safety: validate item integrity ---------------- */
function validateItem(item){
  if (!item) return true;
  const choices = item.choices || [];
  if (choices.length !== 4) return false;
  const set = new Set(choices.map(c=>String(c)));
  if (set.size !== 4) return false;
  const correct = String(item.answer);
  const correctCount = choices.filter(c=>String(c)===correct).length;
  return correctCount === 1;
}

/* ---------------- Runtime State ---------------- */
let state = null;

/* ---------------- Email notify helper (Formspree hidden form) ---------------- */
function notifyViaFormspree({ grade, mathPct, engPct, conf, mathLevel, elaLevel, summary }) {
  const form = document.getElementById('notifyForm');
  if (!form) return; // no-op if the form isn't on the page

  // basic client-side throttling (prevents spam / double-submits)
  try {
    const last = Number(localStorage.getItem(NOTIFY_TS_KEY) || 0);
    const now = Date.now();
    if (now - last < NOTIFY_THROTTLE_MS) {
      console.info("Too soon to notify again; skipping Formspree submit.");
      return;
    }
    localStorage.setItem(NOTIFY_TS_KEY, String(now));
  } catch {}

  const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = String(val); };
  set('notify-grade', grade);
  set('notify-mathPct', mathPct);
  set('notify-engPct', engPct);
  set('notify-confidence', conf);
  set('notify-mathLevel', (mathLevel?.toFixed ? mathLevel.toFixed(1) : mathLevel));
  set('notify-elaLevel', (elaLevel?.toFixed ? elaLevel.toFixed(1) : elaLevel));
  set('notify-summary', summary);
  set('notify-student', studentName || '');
  set('notify-parentEmail', parentEmail || '');
  try { form.submit(); } catch (e) { console.warn('Formspree submit failed', e); }
}

/* ---------------- Init ---------------- */
function initState(grade, studentName, parentEmail){
  const pools = buildPools(grade);
  state = {
    grade,
    studentName: studentName || "",
    parentEmail: parentEmail || "",
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
    lastDiffs: [],

    mathBuf: 0,
    engBuf: 0,
    mathPlan: buildMathPlan(),
    mathPlanIdx: 0,
    engPlan: buildEnglishPlan(),
    engPlanIdx: 0
  };
}

/* ---------------- DOM helpers ---------------- */
function el(tag, attrs={}, children=[]){
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([k,v])=>{
    if (k==="class") node.className = v;
    else if (k.startsWith("on") && typeof v==="function") {
      node.addEventListener(k.substring(2).toLowerCase(), v);
    } else node.setAttribute(k,v);
  });
  (Array.isArray(children)?children:[children]).forEach(c=> node.append(c instanceof Node ? c : document.createTextNode(String(c))));
  return node;
}

// ✅ keep only THIS progress function (remove duplicates)
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

  const isMath = state.phase === "math";
  const domainLabel = isMath ? "Math" : "English";

  container.append(
    el("div",{class:"label"}, `${domainLabel} Question ${state.answeredInPhase+1} of ${state.targetInPhase}`)
  );

  const seen = loadSeen(state.grade, state.phase);

  let picked;
  if (isMath){
    const wantStrand = state.mathPlan[state.mathPlanIdx] || "NO";
    picked = takeFromWithKey(state.pools.mathByDiff, state.mathDiff, state.usedIds, seen, "strand", wantStrand);
  } else {
    const wantDomain = state.engPlan[state.engPlanIdx] || "RL";
    picked = takeFromWithKey(state.pools.englishPool, state.engDiff, state.usedIds, seen, "domain", wantDomain);
  }

  const item = picked.item;
  if (!item){ advancePhaseOrFinish(container); return; }

  if (!validateItem(item)){
    const retry = isMath
      ? takeFromWithKey(state.pools.mathByDiff, state.mathDiff, state.usedIds, new Set(), "strand", state.mathPlan[state.mathPlanIdx])
      : takeFromWithKey(state.pools.englishPool, state.engDiff, state.usedIds, new Set(), "domain", state.engPlan[state.engPlanIdx]);
    if (!retry.item){ advancePhaseOrFinish(container); return; }
    state.current = retry.item;
  } else {
    state.current = item;
  }

  if (isMath && !["NO","FR","ALG","GEOM","MD"].includes(state.current.strand)){
    advancePhaseOrFinish(container); return;
  }
  if (!isMath && !["RL","RI","LANG"].includes(state.current.domain)){
    advancePhaseOrFinish(container); return;
  }

  state.usedIds.add(state.current.id);
  addSeen(state.grade, state.phase, state.current.id);

  if (!isMath && state.current.context){
    container.append(el("div",{class:"passage"}, state.current.context));
  }

  const li = el("div",{class:"item"});
  li.append(el("div",{class:"qtext"}, state.current.stem));

  const wrap = el("div",{class:"choices"});
  (state.current.choices||[]).forEach(c=>{
    wrap.append(el("button",{class:"btn", onClick: ()=>answer(c)}, c));
  });
  li.append(wrap);
  container.append(li);

  if (isMath){
    state.mathPlanIdx = Math.min(state.mathPlanIdx + 1, state.targetInPhase - 1);
  } else {
    state.engPlanIdx = Math.min(state.engPlanIdx + 1, state.targetInPhase - 1);
  }
}

/* ---------------- Answer (adaptive with hysteresis) ---------------- */
function diffToScore(d){ return d===DIFF.CORE?1:d===DIFF.ON?2:3; }

function answer(chosen){
  if (!state || !state.current) return;
  const item = state.current;
  const isCorrect = String(chosen) === String(item.answer);
  state.total++; if (isCorrect) state.correct++;

  if (state.phase==="math"){
    const strand = item.strand || "NO";
    state.strands[strand][1]++; if (isCorrect) state.strands[strand][0]++;
    const upd = adjustDiff3(state.mathDiff, state.mathBuf, isCorrect);
    state.mathDiff = upd.diff; state.mathBuf = upd.buf;
    state.lastDiffs.push(diffToScore(state.mathDiff));
  } else {
    const dom = item.domain || "RL";
    state.strands[dom][1]++; if (isCorrect) state.strands[dom][0]++;
    const upd = adjustDiff3(state.engDiff, state.engBuf, isCorrect);
    state.engDiff = upd.diff; state.engBuf = upd.buf;
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
  const gl = gradeRef - 0.5 + (pctScore/100);
  return Math.round(gl*10)/10;
}
function confidencePct(mathPct, engPct){
  const completeness = state.total / state.totalTarget;
  const trend = clamp((state.lastDiffs.slice(-6).reduce((a,b)=>a+b,0)/ (6*3)) || 0, 0, 1);
  const separation = (Math.abs(mathPct-50) + Math.abs(engPct-50)) / 100;
  const raw = 0.35*completeness + 0.35*trend + 0.30*separation;
  return Math.round(clamp(40 + raw*60, 40, 95));
}
const TAGS = {
  NO:["place-value","integers"],
  FR:["fractions","percent"],
  ALG:["equations","functions"],
  GEOM:["geometry","area"],
  MD: ["data","measurement"],
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

    <div class="statCard" style="margin-top:12px">
      <div class="label">Next step (optional)</div>
      <div class="mini">Want a quick walkthrough of these results and a personalized plan?</div>
      <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">
        <a class="btn primary" href="mailto:ripaelevateacademy@gmail.com?subject=Diagnostic%20Review%20Call&body=Hi%20Brian%2C%20I%20just%20finished%20the%20diagnostic%20and%20would%20like%20a%20quick%20review%20call." style="text-decoration:none">Book a 15‑min review</a>
        <span class="btnGhost" style="pointer-events:none">Detailed report (coming soon)</span>
      </div>
    </div>

    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px">
      <button class="btnGhost" id="dlBtn">Download PDF</button>
      <button class="btnGhost" id="sendBtn">Send to Tutor</button>
    </div>

    <div class="examMuted" style="margin-top:12px">Mini-FAQ: Grades 2–8 • Length: 20 adaptive questions • Private: runs in the browser; only results you submit are saved.</div>
  `;

  const cb = document.getElementById("showStd");
  const box = document.getElementById("stdBox");
  cb?.addEventListener("change", ()=> box.style.display = cb.checked ? "block" : "none");

  const summary = `Diagnostic complete | Grade: ${state.grade} | Math: ${mathPct}% (level ${curMathGL.toFixed(1)}) | ELA: ${engPct}% (level ${curEngGL.toFixed(1)}) | Confidence: ${conf}%`;
  notifyViaFormspree({
    grade: state.grade,
    mathPct,
    engPct,
    conf,
    mathLevel: curMathGL,
    elaLevel: curEngGL,
    summary
  });
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

/* ---------------- Report actions (PDF + email) ---------------- */
function buildEmailBody({ studentName, grade, mathPct, engPct, conf, curMathGL, curEngGL, strengths, priorities, actionPlanText }) {
  const nameLine = studentName ? `Student: ${studentName}` : "Student: (not provided)";
  return [
    "Ripa Diagnostic — Instant Report",
    nameLine,
    `Grade reference: ${grade}`,
    "",
    `Math: ${mathPct}% (est. level ${curMathGL.toFixed(1)})`,
    `ELA:  ${engPct}% (est. level ${curEngGL.toFixed(1)})`,
    `Overall confidence: ${conf}%`,
    "",
    `Strengths: ${strengths.join(", ") || "—"}`,
    `Priorities: ${priorities.join(", ") || "—"}`,
    "",
    "Quick action plan (next 1–2 weeks):",
    actionPlanText,
    "",
    "Tip: If you’d like, reply with any questions or schedule a quick review call.",
  ].join("\n");
}

function getActionPlanText(strandScores){
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

  const lines = [];
  const m = rank(keysMath);
  if (m.length) {
    lines.push("Math focus:");
    m.forEach(x=> lines.push(`- ${x.k} (${x.p}%): ${tips[x.k]}`));
  }
  const e = rank(keysEng);
  if (e.length) {
    lines.push("English focus:");
    e.forEach(x=> lines.push(`- ${x.k} (${x.p}%): ${tips[x.k]}`));
  }
  return lines.join("\n");
}

function openPrintWindow(html){
  const w = window.open("", "_blank", "noopener,noreferrer,width=900,height=700");
  if (!w) return false;
  w.document.open();
  w.document.write(html);
  w.document.close();
  w.focus();
  // Give the browser a tick to render before printing
  setTimeout(()=>{ try { w.print(); } catch {} }, 200);
  return true;
}

function attachReportActions({ reportHtml, emailPayload }) {
  const dl = document.getElementById("dlBtn");
  const send = document.getElementById("sendBtn");

  dl?.addEventListener("click", ()=>{
    const printable = `
      <!doctype html>
      <html><head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <title>Ripa Diagnostic Report</title>
        <style>
          body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;margin:24px;color:#111}
          .muted{color:#555;font-size:12px}
          .box{border:1px solid #ddd;border-radius:10px;padding:14px;margin:10px 0}
          .title{font-size:22px;font-weight:800;margin:0 0 6px}
          .chip{display:inline-block;padding:4px 10px;border:1px solid #ddd;border-radius:999px;margin:4px 6px 0 0;font-size:12px}
          @media print { button{display:none} }
        </style>
      </head>
      <body>
        <div class="title">Ripa Diagnostic — Report</div>
        <div class="muted">Note: This is an estimate based on a short diagnostic (20 questions). Use it as a guide, not a formal evaluation.</div>
        <div class="box">${reportHtml}</div>
        <div class="muted">Generated: ${new Date().toLocaleString()}</div>
      </body></html>
    `;
    const ok = openPrintWindow(printable);
    if (!ok) alert("Pop-up blocked. Please allow pop-ups to download/print the report.");
  });

  send?.addEventListener("click", ()=>{
    const to = (emailPayload.parentEmail || "").trim();
    if (!to) {
      alert("No parent email was provided at the start. Enter an email above and re-run the test (or just download the PDF).");
      return;
    }
    const subject = encodeURIComponent("Ripa Diagnostic — Instant Report");
    const body = encodeURIComponent(buildEmailBody(emailPayload));
    // Opens the user's default mail client (works on static hosting)
    window.location.href = `mailto:${encodeURIComponent(to)}?subject=${subject}&body=${body}`;
  });
}

/* ---------------- Boot ---------------- */
export function boot(){
  const gradeSel = document.getElementById("grade");
  const studentNameEl = document.getElementById("studentName");
  const parentEmailEl = document.getElementById("parentEmail");
  const consentEl = document.getElementById("consent");
  const startBtn = document.getElementById("startBtn");
  const mount = document.getElementById("mount");
  const report = document.getElementById("report");

  startBtn?.addEventListener("click", ()=>{
    const grade = Number(gradeSel.value || 5);
    const studentName = (studentNameEl?.value || "").trim();
    const parentEmail = (parentEmailEl?.value || "").trim();
    const consentOk = !!consentEl?.checked || !parentEmail; // if no email, skip consent requirement
    if (parentEmail && !consentOk) {
      alert("Please confirm you have permission to email this report to a parent/guardian.");
      return;
    }
    initState(grade, studentName, parentEmail);
    report.innerHTML = "";
    setProgress();
    renderCurrent(mount);
  });
}

// ✅ self-boot so the Start handler is always attached
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
}

