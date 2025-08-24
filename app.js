import { STRANDS, FORMS, DIFF, MATH_ITEMS, PASSAGES, LANG_ITEMS, WRITING_PROMPTS, WRITING_RUBRIC } from './bank.js';

const BLUEPRINT = {
  math: { quota: { NO:4, FR:3, ALG:3, GEOM:3, MD:3 }, total:16 },
  readingA: { type: "any", questions: 6 },
  readingB: { type: "any", questions: 6 },
  language: { total: 5 },
  writing: { minutes: 10 }
};

const EXPOSURE_KEY = "ripa_exposure_v1";
function getExposure(){ try{ return JSON.parse(localStorage.getItem(EXPOSURE_KEY)) || { NO:0, FR:0, ALG:0, GEOM:0, MD:0, LANG:0, RL:0, RI:0, W:0 }; }catch{return { NO:0, FR:0, ALG:0, GEOM:0, MD:0, LANG:0, RL:0, RI:0, W:0 };}}
function bumpExposure(keys){ const e=getExposure(); keys.forEach(k=>e[k]=(e[k]||0)+1); localStorage.setItem(EXPOSURE_KEY, JSON.stringify(e)); }

function between(n,a,b){ return n>=a && n<=b; }
function sample(arr,n){ const c=[...arr], out=[]; while(c.length && out.length<n){ out.push(c.splice(Math.floor(Math.random()*c.length),1)[0]); } return out; }
function sortByExposureFirst(cands, key){ const exp=getExposure(); return [...cands].sort(()=> (exp[key]??0)-(exp[key]??0) || Math.random()-0.5); }

export function generateTest(grade){
  const mathPicked=[];
  for(const [strand,need] of Object.entries(BLUEPRINT.math.quota)){
    const pool=MATH_ITEMS.filter(it=>it.strand===strand && between(grade,it.grade_min,it.grade_max));
    if(!pool.length) continue;
    const ordered=sortByExposureFirst(pool,strand);
    mathPicked.push(...ordered.slice(0,need));
  }
  const exp=getExposure();
  const types=["RL","RI"].sort((a,b)=> (exp[a]??0)-(exp[b]??0));
  function pickPassage(type){
    const t= type==="any"? types[0]: type;
    const opts=PASSAGES.filter(p=>between(grade,p.grade_band[0],p.grade_band[1]) && p.type===t);
    if(opts.length) return sample(opts,1)[0];
    const any=PASSAGES.filter(p=>between(grade,p.grade_band[0],p.grade_band[1]));
    return sample(any,1)[0];
  }
  const passageA=pickPassage(BLUEPRINT.readingA.type); bumpExposure([passageA.type]);
  const passageB=pickPassage(BLUEPRINT.readingB.type); bumpExposure([passageB.type]);

  const langPool=LANG_ITEMS.filter(it=>between(grade,it.grade_min,it.grade_max));
  const languagePicked=sample(langPool, BLUEPRINT.language.total); bumpExposure(["LANG"]);

  const wChoices=WRITING_PROMPTS.filter(w=>between(grade,w.grade_band[0],w.grade_band[1]));
  const writing=sample(wChoices,1)[0]; bumpExposure(["W"]);

  bumpExposure(Object.keys(BLUEPRINT.math.quota));

  return {
    meta:{grade, createdAt:new Date().toISOString()},
    math: mathPicked,
    passages: [
      { role:"A", ...passageA, questions: sample(passageA.questions, BLUEPRINT.readingA.questions) },
      { role:"B", ...passageB, questions: sample(passageB.questions, BLUEPRINT.readingB.questions) }
    ],
    language: languagePicked,
    writing: { ...writing, minutes: BLUEPRINT.writing.minutes, rubric: WRITING_RUBRIC }
  };
}

function el(tag, attrs={}, children=[]){
  const node=document.createElement(tag);
  Object.entries(attrs).forEach(([k,v])=>{
    if(k==="class") node.className=v;
    else if(k.startsWith("on") && typeof v==="function") node.addEventListener(k.substring(2), v);
    else node.setAttribute(k,v);
  });
  (Array.isArray(children)?children:[children]).forEach(c=> node.append(c instanceof Node? c: document.createTextNode(String(c))));
  return node;
}

export function mountTest(container, test){
  container.innerHTML = "";

  container.append(el("h2",{class:"title"},`Baseline Diagnostic (Grade ${test.meta.grade})`));

  // Math
  container.append(el("h3",{class:"label"},"Math — 16 items"));
  const mList = el("ol",{class:"item-list"});
  test.math.forEach(it=>{
    const li=el("li",{class:"item"},[ el("div",{class:"qtext"},it.stem) ]);
    if(it.form==="single"){
      const group=`m_${it.id}`;
      it.choices.forEach(choice=>{
        li.append(el("label",{class:"choice"},[
          el("input",{type:"radio", name:group, value:choice}), " ", choice
        ]));
      });
    } else if(it.form==="numeric"){
      li.append(el("input",{type:"text", class:"numeric", "data-id":it.id, placeholder:"Enter number/fraction"}));
    } else {
      li.append(el("textarea",{rows:"2", placeholder:"Brief answer"}));
    }
    mList.append(li);
  });
  container.append(mList);

  // Reading
  test.passages.forEach(p=>{
    container.append(el("h3",{class:"label"},`Reading ${p.role} (${p.type}) — ${p.questions.length} questions`));
    container.append(el("div",{class:"passage"}, p.text));
    const qList=el("ol",{class:"item-list"});
    p.questions.forEach(q=>{
      const li=el("li",{class:"item"},[ el("div",{class:"qtext"}, q.stem) ]);
      const group=`p_${p.id}_${q.id}`;
      q.choices.forEach(c=>{
        li.append(el("label",{class:"choice"},[
          el("input",{type:"radio", name:group, value:c}), " ", c
        ]));
      });
      qList.append(li);
    });
    container.append(qList);
  });

  // Language
  container.append(el("h3",{class:"label"},"Language — 5 items"));
  const lList=el("ol",{class:"item-list"});
  test.language.forEach(it=>{
    const li=el("li",{class:"item"},[ el("div",{class:"qtext"}, it.stem) ]);
    const group=`l_${it.id}`;
    it.choices.forEach(c=>{
      li.append(el("label",{class:"choice"},[
        el("input",{type:"radio", name:group, value:c}), " ", c
      ]));
    });
    lList.append(li);
  });
  container.append(lList);

  // Writing
  container.append(el("h3",{class:"label"},"Writing — 10 minutes"));
  container.append(el("p",{class:"writing-prompt"}, test.writing.prompt));
  const timer=el("div",{id:"timer", class:"timer"},"10:00");
  const ta=el("textarea",{id:"writing", rows:"8", placeholder:"Write your response here. The timer will count down."});
  container.append(timer, ta);

  startTimer(10, timer);

  // Submit button
  container.append(el("div",{style:"margin-top:10px"}, el("button",{id:"submitBtn", class:"btn primary", onClick: ()=>submit(test)}, "Submit")));
}

function startTimer(minutes, display){
  let remaining=minutes*60;
  (function tick(){
    const m=String(Math.floor(remaining/60)).padStart(2,"0");
    const s=String(remaining%60).padStart(2,"0");
    display.textContent=`${m}:${s}`;
    remaining--;
    if(remaining>=0) setTimeout(tick,1000);
    else display.textContent="00:00";
  })();
}

function submit(test){
  let correct=0, total=0;
  const strandScores={ NO:[0,0], FR:[0,0], ALG:[0,0], GEOM:[0,0], MD:[0,0], RL:[0,0], RI:[0,0], LANG:[0,0] };

  // Math
  test.math.forEach(it=>{
    total++;
    let val=null;
    if(it.form==="single"){
      val=document.querySelector(`input[name="m_${it.id}"]:checked`)?.value||null;
    } else if(it.form==="numeric"){
      val=document.querySelector(`input[data-id="${it.id}"]`)?.value?.trim();
    } else {
      val=document.querySelector(`textarea`)?.value?.trim();
    }
    if(val && String(val)===String(it.answer)){ correct++; strandScores[it.strand][0]++; }
    strandScores[it.strand][1]++;
  });

  // Reading
  test.passages.forEach(p=>{
    p.questions.forEach(q=>{
      total++;
      const val=document.querySelector(`input[name="p_${p.id}_${q.id}"]:checked`)?.value||null;
      if(val && val===q.answer){ correct++; strandScores[p.type][0]++; }
      strandScores[p.type][1]++;
    });
  });

  // Language
  test.language.forEach(it=>{
    total++;
    const val=document.querySelector(`input[name="l_${it.id}"]:checked`)?.value||null;
    if(val && val===it.answer){ correct++; strandScores.LANG[0]++; }
    strandScores.LANG[1]++;
  });

  // Writing length hint
  const words=(document.getElementById("writing")?.value||"").split(/\s+/).filter(Boolean).length;
  const writingNote = words>=120 ? "Writing sample length is strong (≥120 words). Score via rubric."
                    : words>=60  ? "Adequate length (60–119 words). Score via rubric."
                                 : "Short (<60 words). Teach elaboration & evidence.";

  const pct=Math.round(100*correct/total);
  const report=document.getElementById("report");
  report.innerHTML = `
    <div class="title">Instant Report</div>
    <p><strong>Raw Score:</strong> ${correct}/${total} (${pct}%)</p>
    <div class="label" style="margin-top:8px">By Strand</div>
    <ul style="margin:6px 0 0 20px">
      ${Object.entries(strandScores).map(([k,[c,t]])=>`<li><b>${k}</b>: ${t?Math.round(100*c/t):0}% (${c}/${t})</li>`).join("")}
    </ul>
    <div class="label" style="margin-top:10px">Writing</div>
    <p>${writingNote}</p>
    <p style="color:var(--muted)"><em>Rubric traits:</em> ${test.writing.rubric.traits.join(", ")} (0–4 each).</p>
  `;

  // simple progress fill (after submit)
  const pf=document.getElementById("progFill"); if(pf){ pf.style.width="100%"; }
}

export function boot(){
  const gradeSelect=document.getElementById("grade");
  document.getElementById("startBtn")?.addEventListener("click", ()=>{
    const grade=Number(gradeSelect.value||5);
    const test=generateTest(grade);
    mountTest(document.getElementById("mount"), test);
    document.getElementById("report").innerHTML="";
    const pf=document.getElementById("progFill"); if(pf){ pf.style.width="25%"; }
  });
}




