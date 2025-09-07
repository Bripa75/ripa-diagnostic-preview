// app.js
// Minimal student UI; private logging + Formspree alert for instructor.

import { questions } from './bank.js';

// ====== CONFIG: put your Formspree form id here (e.g., xabcd123) ======
const FORMSPREE_ID = 'YOUR_FORMSPREE_ID';
// =====================================================================

// Cache DOM refs up front once boot() runs
let nameInput, emailInput, startBtn, screenIntro, screenTest, questionEl, optionsEl, nextBtn, screenDone, doneMsg, reportEl, progFillEl;

// Quiz state
let currentQuestion = 0;
let score = 0;
let log = []; // { q, selected, correct, isCorrect }

// Optional: expose tiny bit of state for external observers
// (your diagnostic-test.html completion watcher can read this)
window.state = window.state || {};
window.state.confidence = 0; // if you compute one later, update here

function updateProgress() {
  if (!progFillEl) return;
  const pct = Math.round(((currentQuestion) / questions.length) * 100);
  progFillEl.style.width = `${Math.min(pct, 100)}%`;
}

function renderQuestion() {
  const q = questions[currentQuestion];
  questionEl.textContent = `Pregunta ${currentQuestion + 1} de ${questions.length}: ${q.question}`;
  optionsEl.innerHTML = '';

  q.options.forEach(opt => {
    const btn = document.createElement('button');
    btn.textContent = opt;
    btn.className = 'option-btn';
    btn.addEventListener('click', () => onSelect(opt, q.answer));
    optionsEl.appendChild(btn);
  });

  // Hide the Next button until an answer is chosen
  nextBtn.style.display = 'none';

  // Update progress bar for this question index
  updateProgress();
}

function onSelect(selected, correct) {
  const isCorrect = selected === correct;
  if (isCorrect) score++;

  log.push({
    q: questions[currentQuestion].question,
    selected,
    correct,
    isCorrect
  });

  // Lock choices
  optionsEl.querySelectorAll('.option-btn').forEach(b => (b.disabled = true));
  nextBtn.style.display = 'inline-block';
}

async function submitResultsToFormspree() {
  if (!FORMSPREE_ID || FORMSPREE_ID === 'YOUR_FORMSPREE_ID') return; // skip if not configured

  const lines = log.map((item, i) => {
    const status = item.isCorrect ? '✔️' : '❌';
    return `Q${i + 1}. ${item.q}
- Student: ${item.selected}
- Correct: ${item.correct}
- ${status}\n`;
  });

  const payload = {
    _subject: `Diagnostic submitted by ${nameInput.value}`,
    studentName: nameInput.value,
    studentEmail: emailInput.value || '(no email)',
    score: `${score} / ${questions.length}`,
    details: lines.join('\n')
  };

  const res = await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
    method: 'POST',
    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    throw new Error('Formspree error');
  }
}

function renderFinalReport() {
  // Write a human-friendly summary into #report so your completion watcher can detect it.
  // (No itemized right/wrong is shown to the student here.)
  if (!reportEl) return;
  const pct = Math.round((score / questions.length) * 100);
  const grade = document.getElementById('grade')?.value ?? '';
  // Keep this text verbose (40+ chars) so MutationObserver considers it "done".
  reportEl.innerHTML = `
    <div class="summary">
      <h3>Diagnostic Summary</h3>
      <p>Grade: <strong>${grade}</strong></p>
      <p>Overall score: <strong>${score}/${questions.length}</strong> (${pct}%).</p>
      <p>Thanks! Your responses have been recorded.</p>
    </div>
  `;

  // Fill progress to 100% for any observers that rely on the bar
  if (progFillEl) progFillEl.style.width = '100%';
}

function showDone(message) {
  screenTest.style.display = 'none';
  screenDone.style.display = 'block';
  doneMsg.textContent = message || '¡Gracias! Tu diagnóstico fue enviado.';
}

async function finish() {
  try {
    await submitResultsToFormspree();
    renderFinalReport();
    showDone();
  } catch (e) {
    console.warn('Submit failed:', e);
    renderFinalReport();
    showDone('Se envió el examen, pero hubo un problema al notificar. Avísale al profesor.');
  }
}

// Public boot (called by diagnostic-test.html)
export function boot() {
  // Wire refs
  nameInput   = document.getElementById('studentName');
  emailInput  = document.getElementById('studentEmail');
  startBtn    = document.getElementById('start');
  screenIntro = document.getElementById('screen-intro');

  screenTest  = document.getElementById('screen-test');
  questionEl  = document.getElementById('question');
  optionsEl   = document.getElementById('options');
  nextBtn     = document.getElementById('next');

  screenDone  = document.getElementById('screen-done');
  doneMsg     = document.getElementById('done-msg');
  reportEl    = document.getElementById('report');
  progFillEl  = document.getElementById('progFill');

  // Start
  startBtn?.addEventListener('click', () => {
    if (!nameInput.value.trim()) {
      alert('Por favor, escribe tu nombre.');
      return;
    }
    // Reset state in case someone restarts without reload
    currentQuestion = 0;
    score = 0;
    log = [];

    screenIntro.style.display = 'none';
    screenTest.style.display = 'block';
    renderQuestion();
  });

  // Next
  nextBtn?.addEventListener('click', () => {
    currentQuestion++;
    if (currentQuestion < questions.length) {
      renderQuestion();
    } else {
      finish();
    }
  });
}
