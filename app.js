// app.js — single, consistent controller for diagnostic-test.html
import { MATH_ITEMS, LANG_ITEMS, PASSAGES } from './bank.js';

// ---------- utilities ----------
const $  = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));
const shuffle = (a) => { const c=[...a]; for(let i=c.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [c[i],c[j]]=[c[j],c[i]]; } return c; };
const sample  = (arr, n) => shuffle(arr).slice(0, n);

// ---------- DOM refs ----------
const startBtn   = $('#startBtn');
const gradeSel   = $('#grade');
const nameInput  = $('#studentName');
const mount      = $('#mount');
const reportEl   = $('#report');
const progFill   = $('#progFill');

// ---------- state ----------
let state = {
  grade: 7,
  idx: 0,
  questions: [],
  correct: 0,
  englishCorrect: 0,
  mathCorrect: 0,
  answered: [],
};

// expose for debugging/notify wrapper if ever needed
window.state = state;

// ---------- building questions ----------
function buildQuestions(grade) {
  // math pool for chosen grade
  const mathPool = MATH_ITEMS.filter(i => grade >= i.grade_min && grade <= i.grade_max);
  const mathQs   = sample(mathPool, 10).map(toQ);

  // english pool: mix language + reading
  const langPool = LANG_ITEMS.filter(i => grade >= i.grade_min && grade <= i.grade_max);
  const langQs   = sample(langPool, 7).map(toQ);

  const passPool = PASSAGES.filter(p => grade >= p.grade_band[0] && grade <= p.grade_band[1]);
  const passage  = passPool.length ? passPool[Math.floor(Math.random()*passPool.length)] : null;
  let readQs = [];
  if (passage) {
    // pick 3 questions from that passage
    const picks = sample(passage.questions, Math.min(3, passage.questions.length));
    readQs = picks.map(q => ({
      type: 'ENG',
      stem: q.stem,
      choices: q.choices,
      answer: q.answer,
      meta: { passageId: passage.id }
    }));
  }

  const engQsRaw = [...langQs, ...readQs].slice(0, 10);
  const taggedMath = mathQs.map(q => ({...q, type:'MATH'}));
  const taggedEng  = engQsRaw.map(q => ({...q, type:'ENG'}));

  return [...taggedMath, ...taggedEng];
}

function toQ(item) {
  // Normalize bank item → renderable question
  return {
    stem: item.stem,
    choices: item.choices,
    answer: item.answer
  };
}

// ---------- rendering ----------
function renderQuestion() {
  const q = state.questions[state.idx];

  const top = document.createElement('div');
  top.className = 'questionCard';

  const header = document.createElement('div');
  header.style.marginBottom = '8px';
  header.textContent = `Question ${state.idx + 1} of ${state.questions.length}`;

  const stem = document.createElement('div');
  stem.className = 'stem';
  stem.textContent = q.stem;

  const btnWrap = document.createElement('div');
  btnWrap.style.display = 'flex';
  btnWrap.style.flexWrap = 'wrap';
  btnWrap.style.gap = '8px';
  btnWrap.style.marginTop = '8px';

  q.choices.forEach(choice => {
    const btn = document.createElement('button');
    btn.className = 'btn';
    btn.textContent = choice;
    btn.addEventListener('click', () => handleAnswer(choice));
    btnWrap.appendChild(btn);
  });

  top.appendChild(header);
  top.appendChild(stem);
  top.appendChild(btnWrap);

  mount.innerHTML = '';
  mount.appendChild(top);

  // progress
  const pct = Math.round((state.idx / state.questions.length) * 100);
  progFill.style.width = `${pct}%`;
}

function handleAnswer(choice) {
  const q = state.questions[state.idx];
  const correct = choice === q.answer;
  state.answered.push({ idx: state.idx, stem: q.stem, selected: choice, correct: q.answer, isCorrect: correct });

  if (correct) {
    state.correct++;
    if (q.type === 'MATH') state.mathCorrect++;
    if (q.type === 'ENG')  state.englishCorrect++;
  }

  state.idx++;

  if (state.idx < state.questions.length) {
    renderQuestion();
  } else {
    finishTest();
  }
}

// ---------- results + notify ----------
function finishTest() {
  // final progress
  progFill.style.width = '100%';

  const total = state.questions.length;
  const mathPct = Math.round((state.mathCorrect / 10) * 100);
  const engPct  = Math.round((state.englishCorrect / 10) * 100);

  // simple “levels” (illustrative)
  const mathLevel = (state.grade - 0.2 + (mathPct - 50)/100).toFixed(1);
  const elaLevel  = (state.grade - 0.2 + (engPct  - 50)/100).toFixed(1);

  // confidence as % of correct
  const conf = Math.round((state.correct / total) * 100);

  const summary = `Diagnostic complete | Grade: ${state.grade} | Math: ${mathPct}% (level ${mathLevel}) | ELA: ${engPct}% (level ${elaLevel}) | Confidence: ${conf}%`;

  // render report
  reportEl.innerHTML = `
    <div class="reportCard">
      <h3>Report</h3>
      <p><strong>Student:</strong> ${nameInput.value || '(no name)'}</p>
      <p><strong>Math correct:</strong> ${state.mathCorrect}/10 &nbsp; (<em>Math level (current) ${mathLevel}</em>)</p>
      <p><strong>ELA correct:</strong> ${state.englishCorrect}/10 &nbsp; (<em>ELA level (current) ${elaLevel}</em>)</p>
      <p><strong>Overall confidence:</strong> ${conf}%</p>
      <pre style="white-space:pre-wrap;margin-top:10px">${state.answered.map((a,i)=>`Q${i+1}. ${a.stem}\n- Student: ${a.selected}\n- Correct: ${a.correct}\n- ${a.isCorrect?'✔️':'❌'}`).join('\n\n')}</pre>
    </div>
  `;

  // push to Formspree
  notifyViaFormspree({
    grade: state.grade,
    mathPct, engPct, conf,
    mathLevel: Number(mathLevel),
    elaLevel: Number(elaLevel),
    student: nameInput.value || '(no name)',
    summary
  });

  // scroll report into view
  reportEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function notifyViaFormspree({ grade, mathPct, engPct, conf, mathLevel, elaLevel, student, summary }) {
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = String(val); };
  set('notify-grade', grade);
  set('notify-mathPct', mathPct);
  set('notify-engPct', engPct);
  set('notify-confidence', conf);
  set('notify-mathLevel', mathLevel);
  set('notify-elaLevel', elaLevel);
  set('notify-summary', summary);
  set('notify-student', student);

  const form = document.getElementById('notifyForm');
  try { form.submit(); } catch (e) { console.warn('Formspree submit failed', e); }
}

// ---------- start ----------
function start() {
  const nm = nameInput.value.trim();
  if (!nm) {
    alert('Please enter the student name.');
    return;
  }
  state.grade = Number(gradeSel.value);
  state.idx = 0;
  state.correct = 0;
  state.mathCorrect = 0;
  state.englishCorrect = 0;
  state.answered = [];
  state.questions = buildQuestions(state.grade);

  reportEl.innerHTML = '';
  renderQuestion();

  startBtn.disabled = true;
  startBtn.textContent = 'Test Started…';
}

window.addEventListener('DOMContentLoaded', () => {
  startBtn?.addEventListener('click', start);
});


