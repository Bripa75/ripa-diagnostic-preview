/* app.js — adaptive runtime — v1.0 */

/* ===== background particles + small UI polish ===== */
(() => {
  const c = document.getElementById('fx'); if(!c) return;
  const ctx = c.getContext('2d'); let w,h, parts;
  function resize(){ w=c.width=innerWidth; h=c.height=innerHeight; parts = Array.from({length:80},()=>({
    x:Math.random()*w, y:Math.random()*h, r:Math.random()*1.8+0.6, vx:(Math.random()-.5)*0.25, vy:(Math.random()-.5)*0.25
  })); }
  function step(){ ctx.clearRect(0,0,w,h); ctx.fillStyle='rgba(255,255,255,.7)';
    for(const p of parts){ p.x+=p.vx; p.y+=p.vy; if(p.x<0||p.x>w) p.vx*=-1; if(p.y<0||p.y>h) p.vy*=-1; ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill(); }
    requestAnimationFrame(step);
  }
  addEventListener('resize', resize); resize(); step();
  document.getElementById('year').textContent = new Date().getFullYear();
  document.querySelectorAll('.tilt').forEach(el=>{
    el.addEventListener('mousemove',e=>{const r=el.getBoundingClientRect();const x=(e.clientX-r.left)/r.width-.5;const y=(e.clientY-r.top)/r.height-.5;el.style.transform=`rotateX(${(-y*6).toFixed(2)}deg) rotateY(${(x*6).toFixed(2)}deg)`;});
    el.addEventListener('mouseleave',()=>el.style.transform='');
  });
})();

/* ===== Diagnostic runtime ===== */
(() => {
  const { MATH_GENS, ELA_GENS, TAG_TO_STD, utils } = window.BANK;

  // Configuration
  const BANK_SIZE = 120;     // total items available (we synthesize by sampling gens)
  const ADMIN_LENGTH = 20;   // questions actually administered

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
  let bankM = [], bankE = [], runSeq = [], step = 0;
  let est = 4.0, conf = 0.5, domain = 'Math';
  let correctM = 0, correctE = 0;
  const strengths = new Map(), needs = new Map();

  // Build a synthetic bank of BANK_SIZE items (half math, half ELA)
  function buildBank(){
    const needM = Math.ceil(BANK_SIZE/2), needE = BANK_SIZE - needM;
    bankM = []; while(bankM.length<needM) bankM.push(utils.pick(MATH_GENS)());
    bankE = []; while(bankE.length<needE) bankE.push(utils.pick(ELA_GENS)());
    // interleave for runtime selection: first half math, second half ELA
    const mAdmin = Math.ceil(ADMIN_LENGTH/2), eAdmin = ADMIN_LENGTH - mAdmin;
    const selM = utils.shuffle(bankM).slice(0, mAdmin);
    const selE = utils.shuffle(bankE).slice(0, eAdmin);
    runSeq = selM.concat(selE); // simple 1-block math then ELA
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
    // dynamic level/conf
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

  function chipsFromMap(map){
    const arr = Array.from(map.entries()).sort((a,b)=>b[1]-a[1]).slice(0,8);
    if(!arr.length) return '—';
    return arr.map(([tag])=>{
      const std = TAG_TO_STD[tag] || '—';
      return `<div class="pill">${tag}</div><div class="examMuted" style="margin:2px 0 8px">${std}</div>`;
    }).join('');
  }

  function finish(){
    progressFill.style.width = '100%';

    // crude level estimates from correct counts (tuned for demo)
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

    stdDetails.innerHTML = `<div><strong>Skill → Standards family</strong></div>${chipsFromMap(new Map([...strengths, ...needs]))}`;
    stdToggle.checked = false;
    stdToggle.onchange = ()=>{ stdDetails.style.display = stdToggle.checked ? 'block' : 'none'; };

    app.style.display = 'none';
    report.style.display = 'block';
    report.scrollIntoView({behavior:'smooth'});
  }

  // Optional: Netlify Forms “Send results to tutor”
  function submitToNetlify(){
    const form = document.forms['diagnostic-results'];
    if(!form){ alert('Results form not found.'); return; }
    const payload = {
      student_name: 'Student',
      grade_selected: chosenGrade ?? 'Auto',
      timestamp: new Date().toISOString(),
      math_level: document.getElementById('mathLevel').textContent,
      ela_level:  document.getElementById('elaLevel').textContent,
      confidence: document.getElementById('confOut').textContent,
      strengths: strengthList.innerText,
      needs: needList.innerText
    };
    // populate hidden fields
    form.querySelector('#nf_student_name').value = payload.student_name;
    form.querySelector('#nf_grade').value = payload.grade_selected;
    form.querySelector('#nf_ts').value = payload.timestamp;
    form.querySelector('#nf_math').value = payload.math_level;
    form.querySelector('#nf_ela').value = payload.ela_level;
    form.querySelector('#nf_conf').value = payload.confidence;
    form.querySelector('#nf_strengths').value = payload.strengths;
    form.querySelector('#nf_needs').value = payload.needs;
    form.querySelector('#nf_json').value = JSON.stringify(payload, null, 2);

    // classic Netlify form POST
    const data = new FormData(form);
    fetch('/', { method:'POST', body:data })
      .then(()=> alert('Results sent. You’ll receive a Netlify notification email.'))
      .catch(()=> alert('Could not send results (Netlify Forms must be enabled on the deploy).'));
  }

  // Begin / Finish handlers
  beginBtn.onclick = ()=>{
    chosenGrade = gradeSel.value ? Number(gradeSel.value) : null;
    buildBank();
    step=0; est = chosenGrade ? chosenGrade : 4.0; conf=0.5; correctM=0; correctE=0;
    strengths.clear(); needs.clear();
    prestart.style.display='none';
    app.style.display='grid';
    renderQ();
    document.getElementById('exam').scrollIntoView({behavior:'smooth'});
  };
  finishBtn.onclick = finish;
  if(sendBtn) sendBtn.onclick = submitToNetlify;
})();
