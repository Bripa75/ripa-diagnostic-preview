// app.js
import { questions } from './bank.js';

// ====== CONFIG: put your Formspree form id here ======
const FORMSPREE_ID = 'YOUR_FORMSPREE_ID';
// =====================================================

// UI refs
const nameInput  = document.getElementById('studentName');
const emailInput = document.getElementById('studentEmail');
const startBtn   = document.getElementById('start');
const screenIntro = document.getElementById('screen-intro');

const screenTest  = document.getElementById('screen-test');
const questionEl  = document.getElementById('question');
const optionsEl   = document.getElementById('options');
const nextBtn     = document.getElementById('next');

const screenDone  = document.getElementById('screen-done');
const doneMsg     = document.getElementById('done-msg');

let currentQuestion = 0;
let score = 0;
let log = [];   // array of {q, selected, correct, isCorrect}

// -------------------- UI Flow --------------------
startBtn.addEventListener('click', () => {
  // (Optional) require name/email
  if (!nameInput.value.trim()) {
    alert('Por favor, escribe tu nombre.');
    return;
  }
  screenIntro.style.display = 'none';
  screenTest.style.display = 'block';
  loadQuestion();
});

nextBtn.addEventListener('click', () => {
  currentQuestion++;
  if (currentQuestion < questions.length) {
    loadQuestion();
    nextBtn.style.display = 'none';
  } else {
    // finish test: send to Formspree
    submitResults().then(() => {
      showDone();
    }).catch(() => {
      showDone('Se envió el examen, pero hubo un problema al notificar. Avísale al profesor.');
    });
  }
});

// -------------------- Test Logic --------------------
function loadQuestion() {
  const q = questions[currentQuestion];
  questionEl.textContent = `Pregunta ${currentQuestion + 1} de ${questions.length}: ${q.question}`;
  optionsEl.innerHTML = '';

  q.options.forEach(opt => {
    const btn = document.createElement('button');
    btn.textContent = opt;
    btn.className = 'option-btn';
    btn.addEventListener('click', () => selectAnswer(opt, q.answer));
    optionsEl.appendChild(btn);
  });
}

function selectAnswer(selected, correct) {
  const isCorrect = selected === correct;
  if (isCorrect) score++;

  log.push({
    q: questions[currentQuestion].question,
    selected,
    correct,
    isCorrect
  });

  // Lock this question
  document.querySelectorAll('.option-btn').forEach(b => b.disabled = true);
  nextBtn.style.display = 'inline-block';
}

// -------------------- Send to Formspree --------------------
async function submitResults() {
  // Compose a compact, human-friendly report for Formspree inbox
  const lines = log.map((item, i) => {
    const status = item.isCorrect ? '✔️' : '❌';
    return `Q${i + 1}. ${item.q}
- Student: ${item.selected}
- Correct: ${item.correct}
- ${status}\n`;
  });

  const body = {
    _subject: `Diagnostic submitted by ${nameInput.value}`,
    studentName: nameInput.value,
    studentEmail: emailInput.value || '(no email)',
    score: `${score} / ${questions.length}`,
    // If you want overall level/confidence, compute it here and include.
    details: lines.join('\n')
  };

  const res = await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
    method: 'POST',
    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    // Still show the done screen; instructor may check later
    throw new Error('Formspree error');
  }
}

// -------------------- Final Screen --------------------
function showDone(message) {
  screenTest.style.display = 'none';
  screenDone.style.display = 'block';
  doneMsg.textContent = message || '¡Gracias! Tu diagnóstico fue enviado.';
}

