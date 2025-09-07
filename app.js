// app.js
// Works with diagnostic-test.html (Start button id=startBtn, mount id=mount, progFill id=progFill)
// and with the large bank.js you pasted (exports MATH_ITEMS, PASSAGES, LANG_ITEMS).

import { MATH_ITEMS, PASSAGES, LANG_ITEMS } from './bank.js';

function el(q, root = document) { return root.querySelector(q); }
function els(q, root = document) { return [...root.querySelectorAll(q)]; }
function shuffle(a){ const c=[...a]; for(let i=c.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [c[i],c[j]]=[c[j],c[i]]; } return c; }

// Build a fixed set: 10 Math, 5 Reading (from passages), 5 Language — all filtered by grade
function buildQuestions(grade){
  const inGrade = (min,max)=> (g)=> grade >= (min ?? g.grade_min ?? 2) && grade <= (max ?? g.grade_max ?? 8);

  // --- Math: prefer exact-grade items, fall back to closest
  const mathPool = MATH_ITEMS.filter(q => grade >= (q.grade_min??2) && grade <= (q.grade_max??8));
  const math = shuffle(mathPool).slice(0, 10).map(q => ({
    question: q.stem,
    choices: q.choices,
    answer: q.answer,
    cat: q.strand || 'MATH'
  }));

  // --- Reading: pick 1–2 passages that include the grade, take 5 total Qs
  const passPool = PASSAGES.filter(p => {
    const [lo,hi] = p.grade_band || [2,8];
    return grade >= lo && grade <= hi;
  });
  const pickedPassages = shuffle(passPool).slice(0, Math.min(2, passPool.length));
  const reading = [];
  for (const p of pickedPassages){
    // take up to 5 from first, then fill remainder from next
    const need = 5 - reading.length;
    const take = Math.min(need, p.questions.length);
    const qs = shuffle(p.questions).slice(0, take).map(q => ({
      question: q.stem,
      choices: q.choices,
      answer: q.answer,
      cat: p.type || 'RL'    // RL or RI
    }));
    reading.push(...qs);
    if (reading.length >= 5) break;
  }
  // If not enough (shouldn’t happen), pad from any passage
  if (reading.length < 5){
    const any = shuffle(PASSAGES.flatMap(p => p.questions.map(q => ({
      question: q.stem, choices: q.choices, answer: q.answer, cat: p.type || 'RL'
    })))).slice(0, 5 - reading.length);
    reading.push(...any);
  }

  // --- Language: exact grade where possible
  const langPool = LANG_ITEMS.filter(q => grade >= (q.grade_min??2) && grade <= (q.grade_max??8));
  const language = shuffle(langPool).slice(0, 5).map(q => ({
    question: q.stem,
    choices: q.choices,
    answer: q.answer,
    cat: 'LANG'
  }));

  return [...math, ...reading, ...language];
}

// Small summary helpers for Formspree wrapper
function summarizeStrands(log){
  // strands we care about for math vs english buckets
  const mathCats = new Set(['NO','FR','ALG','GEOM','MD','MATH']);
  const engCats  = new Set(['RL','RI','LANG']);

  const strands = {};
  for (const row of log){
    const k = row.cat;
    if (!strands[k]) strands[k] = [0,0]; // [correct, total]
    strands[k][1] += 1;
    if (row.isCorrect) strands[k][0] += 1;
  }
  const addSet = (setName, cats) => {
    let c = 0, t = 0;
    for (const [k,[ck,tk]] of Object.entries(strands)){
      if (cats.has(k)) { c += ck; t += tk; }
    }
    return [c,t];
  };
  strands.MATH_TOTAL = addSet('math', mathCats);
  strands.ENG_TOTAL  = addSet('eng', engCats);
  return strands;
}

export function boot(){
  const startBtn = el('#startBtn');
  const mount    = el('#mount');
  const progFill = el('#progFill');
  const gradeSel = el('#grade');

  const state = {
    grade: Number(gradeSel?.value || 5),
    idx: 0,
    items: [],
    log: [],           // { q, selected, correct, isCorrect, cat }
    strands: {}        // filled at the end for the notifier
  };
  window.state = state; // expose to the notifier

  function setProg(){
    const pct = Math.round((state.idx / state.items.length) * 100);
    if (progFill) progFill.style.width = `${pct}%`;
  }

  function renderQ(){
    const q = state.items[state.idx];
    if (!q){ return finish(); }
    setProg();

    mount.innerHTML = `
      <div class="qcard">
        <div class="qnum">Question ${state.idx + 1} of ${state.items.length}</div>
        <div class="qstem">${q.question}</div>
        <div class="qopts"></div>
      </div>
    `;
    const optsBox = el('.qopts', mount);
    q.choices.forEach(choice => {
      const b = document.createElement('button');
      b.className = 'option-btn';
      b.textContent = choice;
      b.addEventListener('click', () => choose(choice));
      optsBox.appendChild(b);
    });
  }

  function choose(choice){
    const q = state.items[state.idx];
    const correct = q.answer;
    const isCorrect = String(choice) === String(correct);

    state.log.push({
      q: q.question, selected: choice, correct, isCorrect, cat: q.cat
    });

    // lock
    els('.option-btn', mount).forEach(b=>{
      b.disabled = true;
      if (b.textContent === String(correct)) b.classList.add('correct');
      if (b.textContent === String(choice) && !isCorrect) b.classList.add('incorrect');
    });

    // short pause then next
    setTimeout(() => {
      state.idx++;
      if (state.idx < state.items.length) {
        renderQ();
      } else {
        finish();
      }
    }, 500);
  }

  function start(){
    state.grade = Number(gradeSel?.value || 5);
    state.items = buildQuestions(state.grade);
    state.idx = 0;
    state.log = [];
    setProg();
    renderQ();
  }

  function finish(){
    setProg();
    // compute strand buckets for notifier
    state.strands = summarizeStrands(state.log);

    // simple thank-you view
    const correct = state.log.filter(r=>r.isCorrect).length;
    mount.innerHTML = `
      <div class="summary">
        <h3>All done!</h3>
        <p>You answered <strong>${correct}</strong> of <strong>${state.items.length}</strong> correctly.</p>
        <p>Your teacher will receive a detailed report.</p>
      </div>
    `;

    // call the wrapper in diagnostic-test.html
    if (typeof window.finishTest === 'function') {
      window.finishTest();
    }
  }

  // Wire Start button (keep your visual change)
  startBtn?.addEventListener('click', () => {
    startBtn.setAttribute('disabled','true');
    startBtn.textContent = 'Test Started…';
    start();
  });

  // if someone changes the grade before starting, reflect it in state
  gradeSel?.addEventListener('change', e => {
    state.grade = Number(e.target.value || 5);
  });
}

