import { questions } from './bank.js';

const $ = (s) => document.querySelector(s);

const startBtn   = $('#startBtn');
const gradeSel   = $('#grade');
const nameInput  = $('#studentName');
const mount      = $('#mount');
const reportEl   = $('#report');
const progFill   = $('#progFill');
const errBanner  = $('#errBanner');

let state = {
  idx: 0,
  questions: [],
  correct: 0,
  mathCorrect: 0,
  engCorrect: 0,
  answered: [],
  grade: 7
};

// Render one question
function renderQuestion() {
  const q = state.questions[state.idx];
  if (!q) return;

  const card = document.createElement('div');
  card.className = 'questionCard';

  const hdr = document.createElement('div');
  hdr.style.marginBottom = '8px';
  hdr.textContent = `Question ${state.idx+1} of ${state.questions.length}`;

  const stem = document.createElement('div');
  stem.className = 'stem';
  stem.textContent = q.question;

  const wrap = document.createElement('div');
  wrap.className = 'choices';
  q.options.forEach(opt => {
    const b = document.createElement('button');
    b.textContent = opt;
    b.className = 'btn';
    b.addEventListener('click', () => handleAnswer(opt));
    wrap.appendChild(b);
  });

  card.appendChild(hdr);
  card.appendChild(stem);
  card.appendChild(wrap);

  mount.innerHTML = '';
  mount.appendChild(card);

  progFill.style.width = `${Math.round((state.idx/state.questions.length)*100)}%`;
}

function handleAnswer(choice) {
  const q = state.questions[state.idx];
  const ok = choice === q.answer;
  state.answered.push({stem:q.question, selected:choice, correct:q.answer, isCorrect:ok});
  if (ok) state.correct++;
  if (state.idx < state.questions.length-1) {
    state.idx++;
    renderQuestion();
  } else {
    finishTest();
  }
}

function finishTest() {
  progFill.style.width = '100%';
  const score = `${state.correct}/${state.questions.length}`;
  const conf = Math.round((state.correct/state.questions.length)*100);

  reportEl.innerHTML = `
    <div class="reportCard">
      <h3>Report</h3>
      <p><strong>Student:</strong> ${nameInput.value || '(no name)'}</p>
      <p><strong>Score:</strong> ${score} (${conf}%)</p>
      <pre style="white-space:pre-wrap;margin-top:10px">
${state.answered.map((a,i)=>`Q${i+1}. ${a.stem}\n- Student: ${a.selected}\n- Correct: ${a.correct}\n- ${a.isCorrect?'✔️':'❌'}`).join('\n\n')}
      </pre>
    </div>
  `;

  notifyFormspree(score, conf);
}

function notifyFormspree(score, conf) {
  const set=(id,val)=>{const el=document.getElementById(id); if(el) el.value=String(val);};
  set('notify-grade',state.grade);
  set('notify-summary',`Score: ${score} (${conf}%)`);
  set('notify-student',nameInput.value || '(no name)');

  try { document.getElementById('notifyForm').submit(); }
  catch(e){ console.warn('Formspree submit failed', e); }
}

function start() {
  try {
    errBanner.style.display = 'none';
    state.grade = Number(gradeSel.value) || 7;
    state.idx = 0;
    state.correct = 0;
    state.answered = [];
    state.questions = questions; // 20 from bank.js
    renderQuestion();
    startBtn.disabled = true;
    startBtn.textContent = 'Test Started…';
  } catch(e) {
    errBanner.style.display = 'block';
    errBanner.textContent = 'Error starting test: ' + e.message;
  }
}

window.addEventListener('DOMContentLoaded', () => {
  startBtn.addEventListener('click', start);
});



