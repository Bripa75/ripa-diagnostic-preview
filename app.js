/* app.js — adaptive runtime with Formspree email — v1.1 */

/* ===== Background particles & small UI polish ===== */
(() => {
  const c = document.getElementById('fx'); if (!c) return;
  const ctx = c.getContext('2d'); let w,h,parts=[];
  function resize(){
    w=c.width=innerWidth; h=c.height=innerHeight;
    parts = Array.from({length:80},()=>({
      x:Math.random()*w,y:Math.random()*h,r:Math.random()*1.8+0.6,
      vx:(Math.random()-.5)*0.25, vy:(Math.random()-.5)*0.25
    }));
  }
  function step(){
    ctx.clearRect(0,0,w,h); ctx.fillStyle='rgba(255,255,255,.7)';
    for(const p of parts){ p.x+=p.vx; p.y+=p.vy; if(p.x<0||p.x>w) p.vx*=-1; if(p.y<0||p.y>h) p.vy*=-1; ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill(); }
    requestAnimationFrame(step);
  }
  addEventListener('resize', resize); resize(); step();
  const yearEl = document.getElementById('year'); if(yearEl) yearEl.textContent=new Date().getFullYear();
})();

/* ===== Diagnostic runtime ===== */
(() => {
  const { MATH_GENS, ELA_GENS, TAG_TO_STD, utils } = window.BANK;

  /* --- CONFIG --- */
  const ADMIN_LENGTH = 20;      // QUESTIONS SHOWN (change if you want)
  const MAX_GRADE = 8, MIN_GRADE = 2;

  /* --- Elements --- */
  const beginBtn = document.getElementById('beginBtn');
  const gradeSel  = document.getElementById('gradeSel');
  const nameInp   = document.getElementById('studentName');
  const emailInp  = document.getElementById('parentEmail');

  const prestart  = document.getElementById('prestart');
  const app       = document.getElementById('app');
  const report    = document.getElementById('report');

  const sectionTitle = document.getElementById('sectionTitle');
  const sectionHint  = document.getElementById('sectionHint');
  const qtext        = document.getElementById('qtext');
  const choicesEl    = document.getElementById('choices');
  const progressText = document.getElementById('progressText');
  const progressFill = document.getElementById('progressFill');

  const domainNow   = document.getElementById('domainNow');
  const estLevel    = document.getElementById('estLevel');
  const confidence  = document.getElementById('confidence');
  const strengthsEl = document.getElementById('strengths');
  const needsEl     = document.getElementById('needs');

  const mathLevelEl = document.getElementById('mathLevel');
  const elaLevelEl  = document.getElementById('elaLevel');
  const confOutEl   = document.getElementById('confOut');
  const mathExpEl   = document.getElementById('mathExpected');
  const elaExpEl    = document.getElementById('elaExpected');
  const mathGapEl   = document.getElementById('mathGap');
  const elaGapEl    = document.getElementById('elaGap');
  const gradeRefEl  = document.getElementById('gradeRef');
  const strengthList = document.getElementById('strengthList');
  const needList     = document.getElementById('needList');
  const stdToggle    = document.getElementById('stdToggle');
  const stdDetails   = document.getElementById('stdDetails');

  const finishBtn    = document.getElementById('finishBtn');
  const sendBtn      = document.getElementById('sendToTutorBtn');

  // Formspree hidden form
  const fsForm   = document.getElementById('resultsForm');

  /* --- State --- */
  let chosenGrade = null; // number or null for Auto
  let runSeq = [];        // ordered array of questions we will ask (length ADMIN_LENGTH)
  let step = 0;           // current step index
  let domain = 'Math';
  let est = 4.0, conf = 0.5;
  let correctM = 0, correctE = 0;
  const strengths = new Map(), needs = new Map();

  // Track answers for email
  const answers = []; // each: {n, domain, question, choices, correct, picked, isCorrect, lvl, tag, std}

  /* --- Utilities --- */
  function expectedForGrade(g){
    if(!g) return null;
    const gg = Math.max(MIN_GRADE, Math.min(MAX_GRADE, Number(g)));
    return { math: gg*1.0, ela: gg*1.0 };
  }
  const topTags = (map, n=4) => Array.from(map.entries()).sort((a,b)=>b[1]-a[1]).slice(0,n).map(x=>x[0]);

  /* --- Build an exam of exactly ADMIN_LENGTH with grade caps --- */
  function makeCappedPool(gens, capGrade){
    // generate a lot, then filter by lvl cap
    const raw = []; while (raw.length < ADMIN_LENGTH*4) raw.push(utils.pick(gens)());
    const filtered = raw.filter(q => {
      // no cap in Auto mode
      if (!capGrade) return true;
      const maxLvl = Number(capGrade) + 2; // <= two grades above
      return q.lvl <= maxLvl + 0.01;       // small epsilon
    });
    // ensure we still have enough; if not, fall back to raw
    return (filtered.length >= Math.ceil(ADMIN_LENGTH/2)) ? filtered : raw;
  }

  function buildExam(){
    const mPool = makeCappedPool(MATH_GENS, chosenGrade);
    const ePool = makeCappedPool(ELA_GENS, chosenGrade);

    const mNeed = Math.ceil(ADMIN_LENGTH/2);
    const eNeed = ADMIN_LENGTH - mNeed;

    const mSel = utils.shuffle(mPool).slice(0, mNeed);
    const eSel = utils.shuffle(ePool).slice(0, eNeed);

    // simple 1st half Math then ELA (keeps UI section counts clean)
    runSeq = mSel.concat(eSel);

    // hard assert to avoid “12 questions” issues
    if (runSeq.length !== ADMIN_LENGTH) {
      // pad from available pools to hit the length exactly
      const all = utils.shuffle(mPool.concat(ePool));
      while (runSeq.length < ADMIN_LENGTH) runSeq.push(all[runSeq.length % all.length]);
      runSeq = runSeq.slice(0, ADMIN_LENGTH);
    }
  }

  /* --- Render HUD & question --- */
  function renderHUD(){
    domainNow.textContent = domain;
    estLevel.textContent  = est.toFixed(1);
    confidence.textContent= Math.round(conf*100) + '%';
    strengthsEl.innerHTML = topTags(strengths,4).map(t=>`<span class="pill">${t}</span>`).join('') || '<span class="muted">—</span>';
    needsEl.innerHTML     = topTags(needs,4).map(t=>`<span class="pill">${t}</span>`).join('') || '<span class="muted">—</span>';
  }

  function renderQ(){
    progressText.textContent = `${step+1} / ${ADMIN_LENGTH}`;
    progressFill.style.width = (step/ADMIN_LENGTH*100)+'%';

    const mSplit = Math.ceil(ADMIN_LENGTH/2);
    domain = step < mSplit ? 'Math' : 'ELA';

    const nWithinDomain = domain==='Math' ? (step+1) : (step - mSplit + 1);
    sectionTitle.textContent = `${domain} — Question ${nWithinDomain}`;
    sectionHint.textContent  = domain==='Math' ? 'Grade-aligned skills. Try your best!' : 'Reading, language, and writing skills.';

    const q = runSeq[step];
    qtext.textContent = q.t;
    choicesEl.innerHTML = '';
    utils.shuffle(q.a.slice()).forEach(opt=>{
      const b = document.createElement('button');
      b.textContent = opt;
      b.onclick = ()=>submitAnswer(q, opt);
      choicesEl.appendChild(b);
    });

    renderHUD();
  }

  function submitAnswer(q, picked){
    const isCorrect = (picked === q.c);

    // record answer for email
    answers.push({
      n: step+1,
      domain,
      question: q.t,
      choices: q.a,
      correct: q.c,
      picked,
      isCorrect,
      lvl: q.lvl,
      tag: q.tag,
      std: q.std || (TAG_TO_STD[q.tag] || '')
    });

    if (isCorrect) {
      if (domain==='Math') correctM++; else correctE++;
      est  = Math.min(MAX_GRADE, est + (q.lvl >= est ? 0.20 : 0.10));
      conf = Math.min(1, conf + 0.03);
      strengths.set(q.tag, (strengths.get(q.tag)||0) + 1);
    } else {
      est  = Math.max(MIN_GRADE, est - 0.08);
      conf = Math.max(0.2, conf - 0.02);
      needs.set(q.tag, (needs.get(q.tag)||0) + 1);
    }

    step++;
    if (step >= ADMIN_LENGTH) finish();
    else renderQ();
  }

  function gapText(cur, exp){
    if (exp === null) return 'Set a grade to see target';
    const diff = +(cur - exp).toFixed(1);
    if (diff >= 0.3) return `Ahead (+${diff})`;
    if (diff <= -0.3) return `Below (${diff})`;
    return 'On track (±0.2)';
  }

  function chipsFromMap(map){
    const arr = Array.from(map.entries()).sort((a,b)=>b[1]-a[1]).slice(0,8);
    if (!arr.length) return '—';
    return arr.map(([tag])=>{
      const std = TAG_TO_STD[tag] || '—';
      return `<div class="pill">${tag}</div><div class="muted" style="margin:2px 0 8px">${std}</div>`;
    }).join('');
  }

  function finish(){
    progressFill.style.width = '100%';

    // quick level estimate (demo)
    const half = Math.ceil(ADMIN_LENGTH/2);
    const mathLevel = Math.min(MAX_GRADE, Math.max(MIN_GRADE, (chosenGrade || 5) + (correctM - half/2) * 0.2));
    const elaLevel  = Math.min(MAX_GRADE, Math.max(MIN_GRADE, (chosenGrade || 5) + (correctE - (ADMIN_LENGTH-half)/2) * 0.2));

    mathLevelEl.textContent = mathLevel.toFixed(1);
    elaLevelEl.textContent  = elaLevel.toFixed(1);
    confOutEl.textContent   = Math.round(conf*100)+'%';

    const exp = expectedForGrade(chosenGrade);
    const mExp = exp ? exp.math : null;
    const eExp = exp ? exp.ela  : null;

    mathExpEl.textContent = mExp!==null ? mExp.toFixed(1) : '—';
    elaExpEl.textContent  = eExp!==null ? eExp.toFixed(1) : '—';
    mathGapEl.textContent = gapText(parseFloat(mathLevelEl.textContent), mExp);
    elaGapEl.textContent  = gapText(parseFloat(elaLevelEl.textContent),  eExp);
    gradeRefEl.textContent = chosenGrade ? `Grade ${chosenGrade}` : 'Auto';

    strengthList.innerHTML = topTags(strengths,6).map(t=>`<span class="pill">${t}</span>`).join('') || '—';
    needList.innerHTML      = topTags(needs,6).map(t=>`<span class="pill">${t}</span>`).join('') || '—';

    stdDetails.innerHTML = `<div><strong>Skill → Standards family</strong></div>${chipsFromMap(new Map([...strengths, ...needs]))}`;
    if (stdToggle) { stdToggle.checked=false; stdToggle.onchange=()=>{ stdDetails.style.display = stdToggle.checked ? 'block' : 'none'; }; }

    prestart.style.display = 'none';
    app.style.display      = 'none';
    report.style.display   = 'block';
    report.scrollIntoView({behavior:'smooth'});

    // auto-send results if parent email was supplied
    if (emailInp && emailInp.value.trim()) {
      sendResultsToTutor(true);
    }
  }

  /* --- Formspree sender --- */
  function sendResultsToTutor(auto=false){
    if (!fsForm) { alert('Results form missing.'); return; }

    const studentName = (nameInp?.value || 'Student').trim();
    const parentEmail = (emailInp?.value || '').trim();

    // summary line for the email subject/body in Formspree dashboard
    const summary = `${studentName} — Grade: ${chosenGrade ?? 'Auto'} | Math ${mathLevelEl.textContent} | ELA ${elaLevelEl.textContent} | Conf ${confOutEl.textContent}`;

    // populate hidden fields
    document.getElementById('fs_student_name').value = studentName;
    document.getElementById('fs_parent_email').value = parentEmail;
    document.getElementById('fs_grade').value        = chosenGrade ?? 'Auto';
    document.getElementById('fs_math').value         = mathLevelEl.textContent;
    document.getElementById('fs_ela').value          = elaLevelEl.textContent;
    document.getElementById('fs_conf').value         = confOutEl.textContent;
    document.getElementById('fs_strengths').value    = strengthList.innerText;
    document.getElementById('fs_needs').value        = needList.innerText;
    document.getElementById('fs_summary').value      = summary;
    document.getElementById('fs_answers').value      = JSON.stringify(answers, null, 2);

    fsForm.submit();
    if (!auto) alert('Results sent! Check your Formspree inbox/email.');
  }

  /* --- Handlers --- */
  beginBtn.onclick = () => {
    chosenGrade = gradeSel.value ? Number(gradeSel.value) : null;
    // reset state for a fresh run
    runSeq.length = 0; answers.length = 0;
    step=0; est = chosenGrade ? chosenGrade : 4.0; conf=0.5; domain='Math';
    correctM=0; correctE=0; strengths.clear(); needs.clear();

    buildExam();            // <-- ensures EXACTLY ADMIN_LENGTH
    prestart.style.display='none';
    app.style.display='grid';
    report.style.display='none';
    renderQ();
    document.getElementById('exam').scrollIntoView({behavior:'smooth'});
  };

  finishBtn.onclick = finish;
  if (sendBtn) sendBtn.onclick = () => sendResultsToTutor(false);
})();

