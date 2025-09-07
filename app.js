// app.js — adaptive 10 Math + 10 English using MATH_ITEMS/LANG_ITEMS/PASSAGES
import { MATH_ITEMS, LANG_ITEMS, PASSAGES } from './bank.js';

const $ = (s) => document.querySelector(s);
const shuffle = (a)=>{const c=[...a];for(let i=c.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[c[i],c[j]]=[c[j],c[i]];}return c;};
const sample  = (arr,n)=>shuffle(arr).slice(0,n);

// DOM
const startBtn   = $('#startBtn');
const gradeSel   = $('#grade');
const nameInput  = $('#studentName');
const mount      = $('#mount');
const reportEl   = $('#report');
const progFill   = $('#progFill');
const errBanner  = $('#errBanner'); // may be null

// State
const state = {
  grade: 7,
  idx: 0,
  questions: [],
  correct: 0,
  mathCorrect: 0,
  englishCorrect: 0,
  answered: []
};
window.state = state;

// ------------------ Build questions ------------------
function toQ(item){ return { stem:item.stem, choices:item.choices, answer:item.answer }; }

function buildQuestions(grade){
  // 10 Math
  const mathPool = MATH_ITEMS.filter(i => grade>=i.grade_min && grade<=i.grade_max);
  const mathQs = sample(mathPool, 10).map(toQ).map(q => ({...q, type:'MATH'}));

  // English = 10 → 7 Language + 3 Reading (from a passage in grade band)
  const langPool = LANG_ITEMS.filter(i => grade>=i.grade_min && grade<=i.grade_max);
  const langQs7  = sample(langPool, 7).map(toQ).map(q => ({...q, type:'ENG'}));

  const passPool = PASSAGES.filter(p => grade>=p.grade_band[0] && grade<=p.grade_band[1]);
  let readQs = [];
  if (passPool.length){
    const p = passPool[Math.floor(Math.random()*passPool.length)];
    readQs = sample(p.questions, Math.min(3, p.questions.length))
      .map(q => ({ stem:q.stem, choices:q.choices, answer:q.answer, type:'ENG'}));
  }

  // Guarantee exactly 10 English
  const engQs = [...langQs7, ...readQs].slice(0,10);
  return [...mathQs, ...engQs];
}

// ------------------ Render ------------------
function setProgress(){
  if (!progFill || !state.questions.length) return;
  const pct = Math.round((state.idx/state.questions.length)*100);
  progFill.style.width = `${pct}%`;
}

function renderQuestion(){
  const q = state.questions[state.idx];
  const card = document.createElement('div');
  card.className = 'questionCard';

  const hdr = document.createElement('div');
  hdr.style.marginBottom = '8px';
  hdr.textContent = `Question ${state.idx+1} of ${state.questions.length}`;

  const stem = document.createElement('div');
  stem.className = 'stem';
  stem.textContent = q.stem;

  const wrap = document.createElement('div');
  Object.assign(wrap.style, { display:'flex', flexWrap:'wrap', gap:'8px', marginTop:'8px' });

  q.choices.forEach(c=>{
    const b = document.createElement('button');
    b.className = 'btn';
    b.textContent = c;
    b.addEventListener('click', ()=>handleAnswer(c));
    wrap.appendChild(b);
  });

  card.appendChild(hdr);
  card.appendChild(stem);
  card.appendChild(wrap);

  mount.innerHTML = '';
  mount.appendChild(card);
  setProgress();
}

function handleAnswer(choice){
  const q  = state.questions[state.idx];
  const ok = choice === q.answer;

  state.answered.push({ idx:state.idx, stem:q.stem, selected:choice, correct:q.answer, isCorrect:ok });
  if (ok){
    state.correct++;
    if (q.type === 'MATH') state.mathCorrect++;
    else state.englishCorrect++;
  }

  state.idx++;
  if (state.idx < state.questions.length) renderQuestion();
  else finishTest();
}

// ------------------ Finish & Report ------------------
function finishTest(){
  if (progFill) progFill.style.width = '100%';

  const mathPct   = Math.round((state.mathCorrect/10)*100);
  const engPct    = Math.round((state.englishCorrect/10)*100);
  const mathLevel = (state.grade - 0.2 + (mathPct-50)/100).toFixed(1);
  const elaLevel  = (state.grade - 0.2 + (engPct -50)/100).toFixed(1);
  const conf      = Math.round((state.correct/state.questions.length)*100);

  const summary = `Diagnostic complete | Grade: ${state.grade} | Math: ${mathPct}% (level ${mathLevel}) | ELA: ${engPct}% (level ${elaLevel}) | Confidence: ${conf}%`;

  const detail = state.answered.map((a,i)=>(
    `Q${i+1}. ${a.stem}\n- Student: ${a.selected}\n- Correct: ${a.correct}\n- ${a.isCorrect?'✔️':'❌'}`
  )).join('\n\n');

  reportEl.innerHTML = `
    <div class="reportCard">
      <h3>Report</h3>
      <p><strong>Student:</strong> ${nameInput?.value || '(no name)'}</p>
      <p><strong>Math correct:</strong> ${state.mathCorrect}/10 &nbsp; (<em>Math level (current) ${mathLevel}</em>)</p>
      <p><strong>ELA correct:</strong> ${state.englishCorrect}/10 &nbsp; (<em>ELA level (current) ${elaLevel}</em>)</p>
      <p><strong>Overall confidence:</strong> ${conf}%</p>
      <pre style="white-space:pre-wrap;margin-top:10px">${detail}</pre>
    </div>
  `;

  notifyViaFormspree({
    grade: state.grade,
    mathPct, engPct, conf,
    mathLevel: Number(mathLevel),
    elaLevel: Number(elaLevel),
    student: nameInput?.value || '(no name)',
    summary
  });

  reportEl.scrollIntoView({ behavior:'smooth', block:'start' });
}

// ------------------ Formspree notify ------------------
function notifyViaFormspree({grade,mathPct,engPct,conf,mathLevel,elaLevel,student,summary}){
  const set=(id,val)=>{ const el=document.getElementById(id); if (el) el.value = String(val); };
  set('notify-grade',grade);
  set('notify-mathPct',mathPct);
  set('notify-engPct',engPct);
  set('notify-confidence',conf);
  set('notify-mathLevel',mathLevel);
  set('notify-elaLevel',elaLevel);
  set('notify-summary',summary);
  set('notify-student',student);

  const form = document.getElementById('notifyForm');
  if (form) { try { form.submit(); } catch(e) { console.warn('Formspree submit failed', e); } }
}

// ------------------ Start ------------------
function start(){
  try{
    if (errBanner) { errBanner.style.display='none'; }
    state.grade = Number(gradeSel?.value) || state.grade;
    state.idx = 0; state.correct = 0; state.mathCorrect = 0; state.englishCorrect = 0; state.answered = [];
    state.questions = buildQuestions(state.grade);
    reportEl.innerHTML = '';
    renderQuestion();
    if (startBtn) { startBtn.disabled = true; startBtn.textContent = 'Test Started…'; }
  }catch(e){
    console.error(e);
    if (errBanner){
      errBanner.style.display='block';
      errBanner.textContent='Error starting test. Open console for details.';
    } else {
      alert('Error starting test. Check console for details.');
    }
  }
}

window.addEventListener('DOMContentLoaded', ()=>{
  startBtn?.addEventListener('click', start);
});

// Surface runtime errors gracefully
window.addEventListener('error', (e)=>{
  if (errBanner){
    errBanner.style.display='block';
    errBanner.textContent = 'Runtime error: ' + (e?.message || 'Unknown error');
  } else {
    console.error('Runtime error:', e?.message || e);
  }
});

});


