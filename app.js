/* app.js — adaptive runtime with Formspree integration — v1.1 */

(() => {
  const { MATH_GENS, ELA_GENS, TAG_TO_STD, utils } = window.BANK;

  // Config
  const BANK_SIZE = 120;
  const ADMIN_LENGTH = 20;

  // Elements
  const beginBtn = document.getElementById('beginBtn');
  const gradeSel = document.getElementById('gradeSel');
  const app = document.getElementById('app');
  const prestart = document.getElementById('prestart');
  const report = document.getElementById('report');

  const sectionTitle = document.getElementById('sectionTitle');
  const sectionHint  = document.getElementById('sectionHint');
  const qtext = document.getElementById('qtext');
  const choicesEl = document.getElementById('choices');
  const progressText = document.getElementById('progressText');
  const progressFill = document.getElementById('progressFill');

  const domainNow = document.getElementById('domainNow');
  const estLevel  = document.getElementById('estLevel');
  const confidence = document.getElementById('confidence');
  const strengthsEl = document.getElementById('strengths');
  const needsEl = document.getElementById('needs');

  const mathLevelEl = document.getElementById('mathLevel');
  const elaLevelEl  = document.getElementById('elaLevel');
  const confOutEl   = document.getElementById('confOut');
  const mathExpEl   = document.getElementById('mathExpected');
  const elaExpEl    = document.getElementById('elaExpected');
  const mathGapEl   = document.getElementById('mathGap');
  const elaGapEl    = document.getElementById('elaGap');
  const gradeRefEl  = document.getElementById('gradeRef');
  const strengthList = document.getElementById('strengthList');
  const needList = document.getElementById('needList');
  const stdToggle = document.getElementById('stdToggle');
  const stdDetails = document.getElementById('stdDetails');
  const finishBtn = document.getElementById('finishBtn');
  const sendBtn = document.getElementById('sendToTutorBtn');

  // State
  let chosenGrade = null;
  let runSeq = [], step = 0;
  let est = 4.0, conf = 0.5, domain = 'Math';
  let correctM = 0, correctE = 0;
  const strengths = new Map(), needs = new Map();
  const answersLog = []; // <--- NEW: log of each Q, student answer, correct/wrong

  // Build a synthetic bank
  function buildBank(){
    const needM = Math.ceil(BANK_SIZE/2), needE = BANK_SIZE - needM;
    const bankM = []; while(bankM.length<needM) bankM.push(utils.pick(MATH_GENS)());
    const bankE = []; while(bankE.length<needE) bankE.push(utils.pick(ELA_GENS)());

    const mAdmin = Math.ceil(ADMIN_LENGTH/2), eAdmin = ADMIN_LENGTH - mAdmin;
    runSeq = utils.shuffle(bankM).slice(0,mAdmin).concat(utils.shuffle(bankE).slice(0,eAdmin));
  }

  function expectedForGrade(g){
    if(!g) return null;
    const gg = Math.max(2, Math.min(8, Number(g)));
    return {math: gg*1.0, ela: gg*1.0};
  }

  function tagTop(map, n){ return Array.from(map.entries()).sort((a,b)=>b[1]-a[1]).slice(0,n).map(x=>x[0]); }

  function renderHUD(){
    domainNow.textContent = domain;
    estLevel.textContent = est.toFixed(1);
    confidence.textContent = Math.round(conf*100)+'%';
    strengthsEl.innerHTML = tagTop(strengths,4).map(t=>`<span class="pill">${t}</span>`).join('') || '<span class="examMuted">—</span>';
    needsEl.innerHTML = tagTop(needs,4).map(t=>`<span class="pill">${t}</span>`).join('') || '<span class="examMuted">—</span>';
  }

  function renderQ(){
    const total = runSeq.length;
    progressText.textContent = `${step+1} / ${total}`;
    progressFill.style.width = (step/total*100)+'%';

    const q = runSeq[step];
    domain = (step < Math.ceil(ADMIN_LENGTH/2)) ? 'Math' : 'ELA';
    sectionTitle.textContent = `${domain} — Question ${domain==='Math' ? (step+1) : (step - Math.ceil(ADMIN_LENGTH/2) + 1)}`;
    sectionHint.textContent  = domain==='Math' ? 'Grade-aligned skills. Try your best!' : 'Reading, language, and writing skills.';

    qtext.textContent = q.t;
    choicesEl.innerHTML = '';
    utils.shuffle(q.a.slice()).forEach(opt=>{
      const b=document.createElement('button'); b.textContent=opt;
      b.onclick=()=>submitAnswer(q,opt);
      choicesEl.appendChild(b);
    });

    renderHUD();
  }

  function submitAnswer(q, opt){
    const isCorrect = (opt===q.c);

    // Log each answer
    answersLog.push({
      question: q.t,
      chosen: opt,
      correct: q.c,
      wasCorrect: isCorrect,
      domain: domain,
      level: q.lvl
    });

    if(isCorrect){
      domain==='Math' ? correctM++ : correctE++;
      est = Math.min(8, est + (q.lvl>=est ? 0.20 : 0.10));
      conf = Math.min(1, conf + 0.03);
      strengths.set(q.tag, (strengths.get(q.tag)||0) + 1);
    } else {
      est = Math.max(2, est - 0.08);
      conf = Math.max(0.2, conf - 0.02);
      needs.set(q.tag, (needs.get(q.tag)||0) + 1);
    }

    step++;
    if(step>=runSeq.length){ finish(); } else { renderQ(); }
  }

  function gapText(cur, exp){
    if(exp===null) return 'Set a grade to see target';
    const diff = +(cur - exp).toFixed(1);
    if(diff >= 0.3) return `Ahead (+${diff})`;
    if(diff <= -0.3) return `Below (${diff})`;
    return 'On track (±0.2)';
  }

  function finish(){
    progressFill.style.width = '100%';

    const mathLevel = Math.min(8, Math.max(2, (chosenGrade||5) + (correctM - (ADMIN_LENGTH/2)/2)*0.2));
    const elaLevel  = Math.min(8, Math.max(2, (chosenGrade||5) + (correctE - (ADMIN_LENGTH/2)/2)*0.2));

    mathLevelEl.textContent = mathLevel.toFixed(1);
    elaLevelEl.textContent  = elaLevel.toFixed(1);
    confOutEl.textContent   = Math.round(conf*100)+'%';

    const exp = expectedForGrade(chosenGrade);
    const mExp = exp ? exp.math : null;
    const eExp = exp ? exp.ela  : null;
    mathExpEl.textContent = mExp!==null ? mExp.toFixed(1) : '—';
    elaExpEl.textContent  = eExp!==null  ? eExp.toFixed(1)  : '—';
    mathGapEl.textContent = gapText(parseFloat(mathLevelEl.textContent), mExp);
    elaGapEl.textContent  = gapText(parseFloat(elaLevelEl.textContent),  eExp);
    gradeRefEl.textContent = chosenGrade ? `Grade ${chosenGrade}` : 'Auto';

    strengthList.innerHTML = tagTop(strengths,6).map(t=>`<span class="pill">${t}</span>`).join('') || '—';
    needList.innerHTML      = tagTop(needs,6).map(t=>`<span class="pill">${t}</span>`).join('') || '—';

    stdDetails.innerHTML = `<div><strong>Skill → Standards family</strong></div>` + 
      Array.from(new Map([...strengths, ...needs])).map(([tag])=>{
        const std = TAG_TO_STD[tag] || '—';
        return `<div class="pill">${tag}</div><div class="examMuted">${std}</div>`;
      }).join('');
    stdToggle.checked = false;
    stdToggle.onchange = ()=>{ stdDetails.style.display = stdToggle.checked ? 'block' : 'none'; };

    app.style.display = 'none';
    report.style.display = 'block';
    report.scrollIntoView({behavior:'smooth'});

    // Auto-send results at finish
    sendToFormspree(mathLevel, elaLevel);
  }

  // === Send results to Formspree ===
  function sendToFormspree(mathLevel, elaLevel){
    const payload = {
      student_name: "Student",
      grade_selected: chosenGrade ?? 'Auto',
      timestamp: new Date().toISOString(),
      math_level: mathLevel,
      ela_level: elaLevel,
      confidence: Math.round(conf*100) + '%',
      strengths: Array.from(strengths.keys()).join(', '),
      needs: Array.from(needs.keys()).join(', '),
      answers: answersLog.map((a,i)=> 
        `Q${i+1} (${a.domain}, lvl ${a.level}): "${a.question}" → chosen: ${a.chosen}, correct: ${a.correct}, result: ${a.wasCorrect ? '✔' : '✘'}`
      ).join('\n')
    };

    fetch("https://formspree.io/f/mzzvlgge", {
      method: "POST",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(res=>{
      if(res.ok) alert("Results sent to tutor!");
      else alert("Could not send results.");
    })
    .catch(()=> alert("Error sending results."));
  }

  // Begin
  beginBtn.onclick = ()=>{
    chosenGrade = gradeSel.value ? Number(gradeSel.value) : null;
    buildBank();
    step=0; est = chosenGrade ? chosenGrade : 4.0; conf=0.5; correctM=0; correctE=0;
    strengths.clear(); needs.clear(); answersLog.length = 0;
    prestart.style.display='none';
    app.style.display='grid';
    renderQ();
    document.getElementById('exam').scrollIntoView({behavior:'smooth'});
  };

  finishBtn.onclick = finish;
  if(sendBtn) sendBtn.onclick = finish;
})();


