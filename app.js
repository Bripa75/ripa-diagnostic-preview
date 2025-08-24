// app.js
// Generator + simple renderer for ripa-diagnostic-preview

import { STRANDS, FORMS, DIFF, MATH_ITEMS, PASSAGES, LANG_ITEMS, WRITING_PROMPTS, WRITING_RUBRIC } from './bank.js';

// -------- Blueprint (per attempt) -------------------------------------------
const BLUEPRINT = {
  math: { quota: { NO:4, FR:3, ALG:3, GEOM:3, MD:3 }, total:16 },
  readingA: { type: "any" /* RL or RI */, questions: 6 },
  readingB: { type: "any", questions: 6 },
  language: { total: 5 },
  writing: { minutes: 10 }
};

// -------- Exposure tracking (prevents strand hogging over time) -------------
const EXPOSURE_KEY = "ripa_exposure_v1";
function getExposure() {
  try { return JSON.parse(localStorage.getItem(EXPOSURE_KEY)) || { NO:0, FR:0, ALG:0, GEOM:0, MD:0, LANG:0, RL:0, RI:0, W:0 }; }
  catch { return { NO:0, FR:0, ALG:0, GEOM:0, MD:0, LANG:0, RL:0, RI:0, W:0 }; }
}
function bumpExposure(keys) {
  const exp = getExposure();
  keys.forEach(k => { exp[k] = (exp[k]||0)+1; });
  localStorage.setItem(EXPOSURE_KEY, JSON.stringify(exp));
}

// -------- Utilities ---------------------------------------------------------
function between(n, a, b){ return n>=a && n<=b; }
function sample(arr, n){
  const copy = [...arr];
  const out = [];
  while (copy.length && out.length < n) {
    const i = Math.floor(Math.random()*copy.length);
    out.push(copy.splice(i,1)[0]);
  }
  return out;
}
function sortByExposureFirst(candidates, strandKey){
  const exp = getExposure();
  return [...candidates].sort((a,b)=>{
    const ea = exp[strandKey] ?? 0, eb = exp[strandKey] ?? 0; // same exp tie-break random
    return (ea - eb) || (Math.random() - 0.5);
  });
}

// -------- Generator ---------------------------------------------------------
export function generateTest(grade){
  // 1) Math selection by quota with exposure-aware ordering
  const mathPicked = [];
  for (const [strand, need] of Object.entries(BLUEPRINT.math.quota)) {
    const pool = MATH_ITEMS.filter(it => it.strand===strand && between(grade, it.grade_min, it.grade_max));
    if (pool.length === 0) continue;
    const ordered = sortByExposureFirst(pool, strand);
    mathPicked.push(...ordered.slice(0, need));
  }

  // 2) Reading passages (A & B), prefer lowest-exposed type
  const exp = getExposure();
  const types = ["RL","RI"].sort((a,b)=> (exp[a]??0)-(exp[b]??0));
  function pickPassage(desiredType){
    const t = desiredType==="any" ? types[0] : desiredType;
    const opts = PASSAGES.filter(p => between(grade, p.grade_band[0], p.grade_band[1]) && p.type===t);
    if (opts.length) return sample(opts,1)[0];
    // fallback: any type in band
    const any = PASSAGES.filter(p => between(grade, p.grade_band[0], p.grade_band[1]));
    return sample(any,1)[0];
  }
  const passageA = pickPassage(BLUEPRINT.readingA.type);
  bumpExposure([passageA.type]);
  const passageB = pickPassage(BLUEPRINT.readingB.type);
  bumpExposure([passageB.type]);

  // 3) Language items
  const langPool = LANG_ITEMS.filter(it => between(grade, it.grade_min, it.grade_max));
  const languagePicked = sample(langPool, BLUEPRINT.language.total);
  bumpExposure(["LANG"]);

  // 4) Writing prompt by grade band, rotate by exposure "W"
  const wChoices = WRITING_PROMPTS.filter(w => between(grade, w.grade_band[0], w.grade_band[1]));
  const writing = sample(wChoices, 1)[0];

  // 5) Bump math strand exposure
  bumpExposure(Object.keys(BLUEPRINT.math.quota));
  bumpExposure(["W"]);

  return {
    meta: { grade, createdAt: new Date().toISOString() },
    math: mathPicked,
    passages: [
      { role:"A", ...passageA, questions: sample(passageA.questions, BLUEPRINT.readingA.questions) },
      { role:"B", ...passageB, questions: sample(passageB.questions, BLUEPRINT.readingB.questions) }
    ],
    language: languagePicked,
    writing: { ...writing, minutes: BLUEPRINT.writing.minutes, rubric: WRITING_RUBRIC }
  };
}

// -------- Rendering (very lightweight) --------------------------------------
function el(tag, attrs={}, children=[]){
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([k,v]) => {
    if (k==="class") node.className = v;
    else if (k.startsWith("on") && typeof v==="function") node.addEventListener(k.substring(2), v);
    else node.setAttribute(k,v);
  });
  (Array.isArray(children)?children:[children]).forEach(c => {
    node.append(c instanceof Node ? c : document.createTextNode(String(c)));
  });
  return node;
}

export function mountTest(container, test){
  container.innerHTML = "";

  // Header
  container.append(
    el("h2",{},`Baseline Diagnostic (Grade ${test.meta.grade})`)
  );

  // Math
  container.append(el("h3",{},"Math (16 items)"));
  const mList = el("ol",{class:"item-list"});
  test.math.forEach((it,idx)=>{
    const li = el("li",{class:"item"},[
      el("div",{class:"stem"},`${it.stem}`),
    ]);
    if (it.form === "single"){
      const group = `m_${it.id}`;
      it.choices.forEach(choice=>{
        li.append(el("label",{class:"choice"},[
          el("input",{type:"radio", name:group, value:choice}),
          " ", choice
        ]));
      });
    } else if (it.form === "numeric"){
      li.append(el("input",{type:"text", class:"numeric", "data-id":it.id, placeholder:"Enter number/fraction"}));
    } else {
      li.append(el("textarea",{rows:"2", placeholder:"Brief answer"}));
    }
    mList.append(li);
  });
  container.append(mList);

  // Reading A & B
  test.passages.forEach(p=>{
    container.append(el("h3",{},`Reading ${p.role} (${p.type}) – ${p.questions.length} questions`));
    container.append(el("div",{class:"passage"}, p.text));
    const qList = el("ol",{class:"item-list"});
    p.questions.forEach(q=>{
      const li = el("li",{class:"item"},[
        el("div",{class:"stem"},q.stem)
      ]);
      const group = `p_${p.id}_${q.id}`;
      q.choices.forEach(c=>{
        li.append(el("label",{class:"choice"},[
          el("input",{type:"radio", name:group, value:c}),
          " ", c
        ]));
      });
      qList.append(li);
    });
    container.append(qList);
  });

  // Language
  container.append(el("h3",{},"Language (5 items)"));
  const lList = el("ol",{class:"item-list"});
  test.language.forEach(it=>{
    const li = el("li",{class:"item"},[
      el("div",{class:"stem"},it.stem)
    ]);
    const group = `l_${it.id}`;
    it.choices.forEach(c=>{
      li.append(el("label",{class:"choice"},[
        el("input",{type:"radio", name:group, value:c}),
        " ", c
      ]));
    });
    lList.append(li);
  });
  container.append(lList);

  // Writing with timer
  container.append(el("h3",{},"Writing (10 minutes)"));
  container.append(el("p",{class:"writing-prompt"}, test.writing.prompt));
  const timer = el("div",{id:"timer", class:"timer"}, "10:00");
  const ta = el("textarea",{id:"writing", rows:"8", placeholder:"Write your response here. The timer will count down."});
  container.append(timer, ta);

  startTimer(10, timer);

  // Submit
  container.append(el("button",{id:"submitBtn", class:"primary", onClick: ()=>submit(test)}, "Submit"));
}

// simple mm:ss countdown
function startTimer(minutes, display){
  let remaining = minutes * 60;
  function tick(){
    const m = Math.floor(remaining/60).toString().padStart(2,"0");
    const s = (remaining%60).toString().padStart(2,"0");
    display.textContent = `${m}:${s}`;
    remaining--;
    if (remaining >= 0) setTimeout(tick, 1000);
    else display.textContent = "00:00";
  }
  tick();
}

// In this preview we compute a raw score & show strand breakdown.
function submit(test){
  // Basic scoring (choices/numeric exact match)
  const form = document;
  let correct = 0, total = 0;
  const strandScores = { NO:[0,0], FR:[0,0], ALG:[0,0], GEOM:[0,0], MD:[0,0], RL:[0,0], RI:[0,0], LANG:[0,0] };

  // Math
  test.math.forEach(it=>{
    total++;
    let val = null;
    if (it.form==="single"){
      const checked = form.querySelector(`input[name="m_${it.id}"]:checked`);
      val = checked?.value || null;
    } else if (it.form==="numeric"){
      val = form.querySelector(`input[data-id="${it.id}"]`)?.value?.trim();
    } else {
      val = form.querySelector(`textarea`)?.value?.trim();
    }
    if (val && String(val)===String(it.answer)) { correct++; strandScores[it.strand][0]++; }
    strandScores[it.strand][1]++;
  });

  // Reading
  test.passages.forEach(p=>{
    p.questions.forEach(q=>{
      total++;
      const checked = document.querySelector(`input[name="p_${p.id}_${q.id}"]:checked`);
      const val = checked?.value || null;
      const key = p.type; // RL or RI
      if (val && val===q.answer){ correct++; strandScores[key][0]++; }
      strandScores[key][1]++;
    });
  });

  // Language
  test.language.forEach(it=>{
    total++;
    const checked = document.querySelector(`input[name="l_${it.id}"]:checked`);
    const val = checked?.value || null;
    if (val && val===it.answer){ correct++; strandScores.LANG[0]++; }
    strandScores.LANG[1]++;
  });

  // Writing is rubric-based; here we just capture text length as proxy so preview gives a hint.
  const writing = document.getElementById("writing")?.value || "";
  const words = writing.split(/\s+/).filter(Boolean).length;
  const writingNote = words >= 120 ? "Writing sample length is strong (120+ words). Score via rubric." :
                      words >= 60  ? "Writing sample length is adequate (60–119 words). Score via rubric." :
                                     "Writing is short (<60 words). Recommend explicit instruction on elaboration.";

  // Show report
  const pct = Math.round(100*correct/total);
  const report = document.getElementById("report");
  report.innerHTML = `
    <h3>Instant Report</h3>
    <p><strong>Raw Score:</strong> ${correct}/${total} (${pct}%)</p>
    <h4>By Strand</h4>
    <ul>
      ${Object.entries(strandScores).map(([k,[c,t]])=>`<li><b>${k}</b>: ${t?Math.round(100*c/t):0}% (${c}/${t})</li>`).join("")}
    </ul>
    <h4>Writing</h4>
    <p>${writingNote}</p>
    <p><em>Use rubric traits:</em> ${WRITING_RUBRIC.traits.join(", ")} (0–4 each).</p>
  `;
  report.scrollIntoView({behavior:"smooth"});
}

// Wire up diagnostic-test.html
export function boot(){
  const gradeSelect = document.getElementById("grade");
  const startBtn = document.getElementById("startBtn");
  const mount = document.getElementById("mount");
  const report = document.getElementById("report");

  startBtn?.addEventListener("click", ()=>{
    const grade = Number(gradeSelect.value || 5);
    const test = generateTest(grade);
    mountTest(mount, test);
    report.innerHTML = "";
  });
}



