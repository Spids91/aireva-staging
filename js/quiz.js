// ─── QUIZ.JS v1.0.0 ───────────────────────────────────────────────────────────
// The entire quiz engine. Modes: daily challenge, standard, adaptive, weak spots,
// timed, category, spaced repetition, plus the intro quiz. Two answer formats:
// multiple-choice (auto-marked) and flashcard (self-marked).
//
// How it fits together:
//   • QUESTION BANKS (EASY_Q/HARD_Q/TERM_Q) are templates: each has a q() that
//     builds the question text and an a() that derives the answer LIVE from the
//     drug/term data. Because answers are derived, editing a drug's data updates
//     its quiz answers automatically — there are no hard-coded answer strings.
//   • make*Qs() functions assemble a question list for a given mode.
//   • QZ (below) is the in-memory state for the quiz currently being taken.
//   • G (global, defined elsewhere) is the PERSISTENT save: xp, mastery counts,
//     streaks, spaced-repetition schedule, badge counters. saveG() persists it.
//
// Two things that are easy to get wrong and are guarded carefully below:
//   1. Flashcard XP is self-marked, so it's capped per day (FC_XP_CAP) to stop
//      users farming unlimited XP. MC XP is not capped.
//   2. XP earned in a session accumulates into QZ.xpThis and is committed to G.xp
//      ONCE at the results screen — never mid-quiz — to avoid double-counting.

// ── QUESTION BANKS ────────────────────────────────────────────────────────────
// Each template's a() reads live from the drug/term, so answers always reflect
// the current data. EASY = recall; HARD = deeper understanding.
const EASY_Q = [
  { id:'ind',   prompt:'Indications',      q: d => `What are the main indications for ${d.name}?`,           a: d => d.indications.slice(0,3).join('; ') },
  { id:'dose',  prompt:'Adult Dosage',     q: d => `What is the adult dose of ${d.name}?`,                   a: d => typeof d.dosages.adult === 'string' ? d.dosages.adult : Object.values(d.dosages.adult).join(' | ') },
  { id:'fact',  prompt:'Key Clinical Fact',q: d => `What is the key clinical fact for ${d.name}?`,           a: d => d.quizHints.keyFact },
  { id:'scope', prompt:'Scope',            q: d => `Which practitioners can administer ${d.name}?`,          a: d => d.scope.join(', ') },
];
const HARD_Q = [
  { id:'contra',prompt:'Contraindications',  q: d => `Name key contraindications for ${d.name}`,            a: d => d.contraindications.slice(0,3).join('; ') },
  { id:'mech',  prompt:'Mechanism of Action',q: d => `What is the mechanism of action of ${d.name}?`,       a: d => d.quizHints.mechanism },
  { id:'id',    prompt:'Identify the Drug',  q: d => `"${d.quizHints.keyFact.split('—')[0].trim()}", which drug?`, a: d => `${d.name} (${d.classification})` },
  { id:'class', prompt:'Classification',     q: d => `What class of drug is ${d.name}?`,                    a: d => d.classification },
  { id:'route', prompt:'Administration',     q: d => `What are the routes of administration for ${d.name}?`,a: d => Array.isArray(d.administration) ? d.administration.join(', ') : d.administration },
  { id:'side',  prompt:'Side Effects',       q: d => `Name the main side effects of ${d.name}`,             a: d => d.sideEffects.slice(0,3).join('; ') },
];
const TERM_Q = [
  { prompt:'Define the Term',   q: t => `What does "${t.term}" mean?`,         a: t => t.def },
  { prompt:'Identify the Term', q: t => `"${t.def.substring(0,80)}…", what term?`, a: t => t.term },
];

// ── CATEGORIES ────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { name:'Analgesics',            icon:'💊', fn: d => /analg|opioid|anaes|volatile/i.test(d.classification) },
  { name:'Cardiovascular',        icon:'❤️', fn: d => /cardio|antiarr|nitrate|antithromb|antiplatelet|vasocon|oxytoc/i.test(d.classification) },
  { name:'Respiratory',           icon:'🫁', fn: d => /bronch|beta-2|inhaled|antimuscarinic/i.test(d.classification) },
  { name:'Antiemetics',           icon:'🤢', fn: d => /antiemetic/i.test(d.classification) },
  { name:'Corticosteroids',       icon:'⚗️', fn: d => /corticoster/i.test(d.classification) },
  { name:'Benzodiazepines',       icon:'🧠', fn: d => /benzodiazepin/i.test(d.classification) },
  { name:'Fluids & Electrolytes', icon:'💧', fn: d => /fluid|electrolyte|crystalloid|glucose|dextrose/i.test(d.classification) },
  { name:'Antimicrobials',        icon:'🦠', fn: d => /antibact|cephalos/i.test(d.classification) },
  { name:'Antidotes',             icon:'🧪', fn: d => /antidote|opioid ant|adsorbent|chelat/i.test(d.classification) },
  { name:'Hormones & Oxytocics',  icon:'🤱', fn: d => /hormone|oxytoc|glycogen/i.test(d.classification) },
];

// ── SPACED REPETITION ─────────────────────────────────────────────────────────
// After each answer we schedule the drug's next review. A CORRECT answer pushes
// the next review further out the more mastered the drug is (longer gaps for
// well-known drugs); a WRONG answer brings it back tomorrow and adds the drug to
// the "recent wrong" list that powers Weak Spots. nextReview stores a YYYY-MM-DD
// date string per drug; isDue() compares it against today.
function srNextDate(drugId, correct) {
  if (!G.nextReview) G.nextReview = {};
  const d = new Date();
  // Interval in days, scaled by current mastery (only when answered correctly).
  // Wrong answers always come back in 1 day.
  const days = correct
    ? { unseen:2, novice:3, learning:5, proficient:8, mastered:14 }[getMastery(G.drugCorrect[drugId]||0)] || 3
    : 1;
  d.setDate(d.getDate() + days);
  G.nextReview[drugId] = d.toISOString().slice(0,10);
  if (!correct) {
    if (!G.recentWrong) G.recentWrong = [];
    // Most-recent-first, capped at 20 so Weak Spots stays a recent-mistakes list.
    if (!G.recentWrong.includes(drugId)) G.recentWrong.unshift(drugId);
    G.recentWrong = G.recentWrong.slice(0,20);
  }
}
function isDue(drugId) {
  if (!G.nextReview) return true;
  const due = G.nextReview[drugId];
  return !due || todayKey() >= due;
}

// ── DISTRACTORS ───────────────────────────────────────────────────────────────
function distractors(qt, drug, pool) {
  // Scope only has 3 possible values across 46 drugs — always use all three as options
  // so the correct answer is always among 3 genuinely distinct choices
  if (qt.id === 'scope') {
    const all = ['EMT, P, AP', 'P, AP', 'AP'];
    return all.filter(s => s !== drug.scope.join(', '));
  }

  // Get the answer value for a given drug under this question type
  function getAns(x) {
    if (qt.id === 'mech')   return x.quizHints.mechanism.substring(0,90);
    if (qt.id === 'contra') return x.contraindications.slice(0,2).join('; ').substring(0,90);
    return qt.a(x).split(';')[0].trim().substring(0,90);
  }
  const correctAns = getAns(drug);
  // Shuffle the pool (excluding the drug being tested) then pick until we have
  // 3 answers that are unique from each other and from the correct answer
  const shuffled = pool.filter(x => x.id !== drug.id).sort(() => Math.random() - .5);
  const seen = new Set([correctAns.toLowerCase()]);
  const result = [];
  for (const x of shuffled) {
    if (result.length === 3) break;
    const ans = getAns(x);
    const key = ans.toLowerCase();
    if (!seen.has(key)) { seen.add(key); result.push(ans); }
  }
  // Fallback: if pool too small to find 3 unique answers, pad with whatever remains
  if (result.length < 3) {
    for (const x of shuffled) {
      if (result.length === 3) break;
      const ans = getAns(x);
      if (!result.includes(ans)) result.push(ans);
    }
  }
  return result;
}

// ── QUESTION BUILDERS ─────────────────────────────────────────────────────────
function pickQT(drug, adaptive) {
  const m = getMastery(G.drugCorrect[drug.id]||0);
  if (!adaptive) {
    const all = [...EASY_Q, ...HARD_Q];
    return all[Math.floor(Math.random() * all.length)];
  }
  if (m === 'unseen' || m === 'novice')  return EASY_Q[Math.floor(Math.random()*EASY_Q.length)];
  if (m === 'learning') {
    const all = [...EASY_Q, ...HARD_Q];
    return all[Math.floor(Math.random()*all.length)];
  }
  return HARD_Q[Math.floor(Math.random()*HARD_Q.length)];
}

function makeDrugQs(drugs, n=10, adaptive=true) {
  const pool = [];
  drugs.forEach(d => {
    for (let i = 0; i < 3; i++) {
      const qt = pickQT(d, adaptive);
      const correct = qt.a(d);
      const wrong = distractors(qt, d, drugs);
      pool.push({ drug:d, qt, opts:[correct,...wrong].sort(()=>Math.random()-.5), isTerm:false });
    }
  });
  // Weighted shuffle: lower-mastery drugs get higher selection weight, but with
  // enough randomness that the same drugs don't appear in the same order every time.
  // Each item gets a random key scaled by a mastery-derived weight, then we sort by key.
  pool.forEach(item => {
    const mastery = G.drugCorrect[item.drug.id] || 0;
    // Weight: unseen/low mastery = high weight (up to 6), mastered = low weight (1)
    const weight = Math.max(1, 6 - Math.min(mastery, 5));
    // Random key in (0,1], divided by weight — lower keys sort first, higher weight = lower key
    item._key = Math.pow(Math.random(), 1 / weight);
  });
  pool.sort((a, b) => b._key - a._key);
  // De-duplicate so the same drug doesn't appear too many times in one quiz
  const selected = [];
  const drugCount = {};
  const maxPerDrug = drugs.length >= n ? 1 : Math.ceil(n / drugs.length);
  for (const item of pool) {
    if (selected.length >= n) break;
    const c = drugCount[item.drug.id] || 0;
    if (c < maxPerDrug) { selected.push(item); drugCount[item.drug.id] = c + 1; }
  }
  // If we couldn't fill n with the per-drug limit, top up from the rest
  if (selected.length < n) {
    for (const item of pool) {
      if (selected.length >= n) break;
      if (!selected.includes(item)) selected.push(item);
    }
  }
  return selected.slice(0, Math.min(n, selected.length));
}

function makeTermQs(n=10) {
  const pool = [];
  TERMS.forEach(t => TERM_Q.forEach(qt => {
    const correct = qt.a(t);
    const wrong = TERMS.filter(x=>x.term!==t.term).sort(()=>Math.random()-.5).slice(0,3).map(x=>qt.a(x).substring(0,90));
    pool.push({ term:t, qt, opts:[correct,...wrong].sort(()=>Math.random()-.5), isTerm:true });
  }));
  return pool.sort(()=>Math.random()-.5).slice(0, Math.min(n, pool.length));
}

// ── DAILY CHALLENGE ───────────────────────────────────────────────────────────
// The daily challenge must be the SAME 5 questions for everyone on a given day and
// stable if the page reloads — so it can't use Math.random(). Instead we derive a
// seed from the day number (days since epoch) and use a deterministic seeded RNG.
// Same seed → same questions all day; next day → new seed → new set.
function dailySeed() { return Math.floor(Date.now()/86400000); }
function seededRnd(seed,i) { const x=Math.sin(seed*9301+i*49297+233)*100000; return x-Math.floor(x); }

function makeDailyQs() {
  const seed = dailySeed();
  const qs = [];
  for (let i = 0; i < 5; i++) {
    const d = MEDS[Math.floor(seededRnd(seed,i)*MEDS.length)];
    const qt = EASY_Q[Math.floor(seededRnd(seed,i+100)*EASY_Q.length)];
    const correct = qt.a(d);
    const correctIdx = MEDS.indexOf(d);
    // Build a shuffled pool of wrong indices — no while loop, no infinite loop risk
    const pool = [];
    for (let j = 0; j < MEDS.length; j++) {
      if (j !== correctIdx) pool.push(j);
    }
    // Seeded shuffle of the pool
    for (let j = pool.length - 1; j > 0; j--) {
      const k = Math.floor(seededRnd(seed, i*500+j+300) * (j+1));
      [pool[j], pool[k]] = [pool[k], pool[j]];
    }
    const wrongIdx = pool.slice(0, 3);
    const wrong = wrongIdx.map(wi => qt.a(MEDS[wi]).split(';')[0].trim().substring(0,90));
    const opts = [correct, ...wrong];
    // Seeded shuffle of options
    for (let j = opts.length-1; j > 0; j--) {
      const k = Math.floor(seededRnd(seed, i*1000+j)*(j+1));
      [opts[j],opts[k]] = [opts[k],opts[j]];
    }
    qs.push({ drug:d, qt, opts, isTerm:false, isDaily:true });
  }
  return qs;
}

function isDailyDone() { return G.lastDailyDate === todayKey(); }

// ── QUIZ STATE ────────────────────────────────────────────────────────────────
let QZ = {
  mode: 'standard', scope: 'all', category: null, adaptive: false,
  fmt: 'mc',  // mc or fc
  qs: [], idx: 0, correct: 0, answered: false, flipped: false,
  xpThis: 0, isTerms: false, isDaily: false, isTimed: false, isIntro: false,
  streak: 0, wrongAnswers: [],
  timeLeft: 30, timerRef: null,
  lastMode: 'standard', lastScope: 'all', lastFmt: 'mc', lastAdaptive: false,
};
const FC_XP_CAP = 100;  // max flashcard XP earnable per day, shared across ALL flashcard sessions

function fcXpRemaining() {
  const today = todayKey();
  if (G.fcXpDate !== today) { G.fcXpDate = today; G.fcXpToday = 0; }
  return Math.max(0, FC_XP_CAP - (G.fcXpToday || 0));
}

// XP per correct answer — multiple choice earns full, flashcard earns less (harder to verify)
function xpPerQ(isFlashcard) {
  const lv = getLevel(G.xp);
  const idx = ['Rookie','Student','Responder','Clinician','Expert','Senior Clinician','Master Clinician'].indexOf(lv.name);
  // Base 2 XP for MC, +1 every three levels. Flashcards earn 1 XP flat (self-marked, easy to game)
  if (isFlashcard) return 1;
  return 2 + Math.floor(idx / 3);
}

function getQText(q)   { return q.isTerm ? q.qt.q(q.term) : q.qt.q(q.drug); }
function getQAns(q)    { return q.isTerm ? q.qt.a(q.term) : q.qt.a(q.drug); }
function getQPrompt(q) { return q.qt.prompt; }

// ── UI HELPERS ────────────────────────────────────────────────────────────────
function showQuizTab()   {
  document.getElementById('quizTabContent').style.display = 'block';
  document.getElementById('quizActiveWrap').style.display = 'none';
}
function showQuizActive() {
  document.getElementById('quizTabContent').style.display = 'none';
  document.getElementById('quizActiveWrap').style.display = 'block';
  document.getElementById('qResults').classList.remove('show');
  document.getElementById('fcMode').style.display = 'none';
  document.getElementById('mcMode').style.display  = 'none';
}

// ── QUIZ TAB RENDER ───────────────────────────────────────────────────────────
function renderQuizTab() {
  showQuizTab();
  const done = isDailyDone();
  const now  = new Date();
  const dateStr = now.toLocaleDateString('en-IE', { day:'numeric', month:'long' });
  const weakCount = (G.recentWrong||[]).length;
  const dueCount  = MEDS.filter(m => isDue(m.id) && (G.drugCorrect[m.id]||0) > 0).length;

  // Build HTML — NO nested quotes in onclick attributes
  // All click handlers added via addEventListener after innerHTML set
  let html = '';

  // ── OSCE SCENARIO HERO (top of tab — the flagship practice feature) ──
  html += '<div id="scenarioHero" class="scenario-hero">';
  html += '<div class="scenario-hero-glow"></div>';
  html += '<div class="scenario-hero-top"><span class="scenario-hero-badge">OSCE</span><span class="scenario-hero-kicker">Practice stations</span></div>';
  html += '<div class="scenario-hero-title">🏥 Scenario Generator</div>';
  html += '<div class="scenario-hero-sub">A fresh OSCE station every time: realistic patient, full clinical picture. Run it, then reveal for the debrief.</div>';
  html += '<div class="scenario-hero-btn">Generate a Scenario →</div>';
  html += '</div>';

  // Compact daily challenge link on quiz tab
  html += '<div id="dailyChallengeCard" class="daily-compact' + (done ? ' done' : '') + '">';
  html += '<div class="daily-compact-left"><div class="daily-compact-title">📅 Daily Challenge</div>';
  html += '<div class="daily-compact-sub">' + dateStr + ' · ' + (done ? 'Completed ✓' : '+15 XP bonus') + '</div></div>';
  html += '<div class="daily-compact-right">' + (done ? '<span class="daily-done-badge">✓</span>' : '<span class="daily-start-btn">Start →</span>') + '</div>';
  html += '</div>';

  // Mode grid
  html += '<div class="quiz-mode-section-label">Quiz Modes</div>';
  html += '<div class="quiz-mode-grid">';
  html += '<div class="qmode-card" data-action="standard"><div class="qmode-icon">📚</div><div class="qmode-name">Standard</div><div class="qmode-desc">Mixed difficulty questions</div></div>';
  html += '<div class="qmode-card" data-action="adaptive"><div class="qmode-icon">🧠</div><div class="qmode-name">Adaptive</div><div class="qmode-desc">Adjusts to your mastery level</div></div>';
  html += '<div class="qmode-card' + (weakCount === 0 ? ' qmode-dim' : '') + '" data-action="weakspots"><div class="qmode-icon">🎯</div><div class="qmode-name">Weak Spots</div><div class="qmode-desc">' + (weakCount > 0 ? weakCount + ' drug' + (weakCount > 1 ? 's' : '') + ' to review' : 'No weak spots yet') + '</div></div>';
  html += '<div class="qmode-card" data-action="timed"><div class="qmode-icon">⚡</div><div class="qmode-name">Timed</div><div class="qmode-desc">30 seconds per question</div></div>';
  html += '<div class="qmode-card" data-action="category"><div class="qmode-icon">🔬</div><div class="qmode-name">Category</div><div class="qmode-desc">Quiz a specific drug class</div></div>';
  html += '<div class="qmode-card" data-action="terms"><div class="qmode-icon">📖</div><div class="qmode-name">Medical Terms</div><div class="qmode-desc">' + TERMS.length + ' terms</div></div>';
  html += '<div class="qmode-card qmode-coming" data-action="comparison"><div class="qmode-icon">💊</div><div class="qmode-name">Comparison</div><div class="qmode-desc">Coming soon</div><div class="qmode-soon-badge">Soon</div></div>';
  html += '</div>';

  if (dueCount > 0) {
    html += '<div id="reviewBanner" class="review-banner"><div class="review-banner-icon">🔁</div><div class="review-banner-text"><strong>' + dueCount + ' drug' + (dueCount > 1 ? 's' : '') + ' due for review</strong><br>Based on your spaced repetition schedule</div><div class="review-banner-arrow">→</div></div>';
  }

  document.getElementById('quizTabContent').innerHTML = html;

  // Scenario hero — the flagship OSCE generator at the top of the tab
  const scenarioHero = document.getElementById('scenarioHero');
  if (scenarioHero) {
    scenarioHero.addEventListener('click', function() { goScenario(); });
  }

  // Attach event listeners cleanly — no inline onclick needed
  const dailyCard = document.getElementById('dailyChallengeCard');
  if (dailyCard) {
    dailyCard.addEventListener('click', function() {
      if (done) { showToast('Come back tomorrow for a new set!'); }
      else { startDaily(); }
    });
  }

  document.querySelectorAll('.qmode-card[data-action]').forEach(card => {
    card.addEventListener('click', function() {
      const action = this.dataset.action;
      switch(action) {
        case 'standard':  goSetup('standard', false); break;
        case 'adaptive':  goSetup('adaptive', true);  break;
        case 'weakspots': weakCount > 0 ? goSetup('weakspots', false) : showToast('No weak spots yet, keep quizzing!'); break;
        case 'timed':     goSetup('timed', false);    break;
        case 'category':  goCategoryPicker();         break;
        case 'terms':     goSetup('terms', false);    break;
        case 'comparison':showToast('Drug Comparison, coming soon'); break;
      }
    });
  });

  const reviewBanner = document.getElementById('reviewBanner');
  if (reviewBanner) {
    reviewBanner.addEventListener('click', function() { goSetup('review', false); });
  }

}

// ── SETUP SCREENS ─────────────────────────────────────────────────────────────
function goSetup(mode, adaptive) {
  window.scrollTo({top:0,behavior:'instant'});
  QZ.mode = mode;
  QZ.adaptive = adaptive;
  if (mode === 'weakspots') { launchWeakSpots(); return; }

  const titles = { standard:'📚 Standard Quiz', adaptive:'🧠 Adaptive Quiz', timed:'⚡ Timed Quiz', review:'🔁 Spaced Review', terms:'📖 Medical Terms Quiz' };
  const descs  = { standard:'Mixed difficulty: all question types', adaptive:'Harder questions on drugs you know well', timed:'30 seconds per question, think fast', review:'Drugs due based on your performance', terms:'Test your medical terminology' };
  const showScope = !['terms','review'].includes(mode);

  document.getElementById('quizTabContent').innerHTML = `
    <div class="quiz-back-sticky" onclick="renderQuizTab()">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg> Back
    </div>
    <div class="pg-title">${titles[mode]||'Quiz'}</div>
    <div class="pg-sub">${descs[mode]||''}</div>
    ${showScope ? `
    <div class="og">
      <span class="og-lbl">Scope</span>
      <div class="scope-opts">
        <div class="sopt on-all" onclick="selScope('all',this)"><div class="sdot-sm" style="background:var(--sl-500,#64748B)"></div><div class="sopt-txt"><div class="sopt-name">All Drugs</div><div class="sopt-cnt">${MEDS.length} drugs</div></div><div class="sopt-chk">✓</div></div>
        <div class="sopt" onclick="selScope('EMT',this)"><div class="sdot-sm" style="background:var(--emt)"></div><div class="sopt-txt"><div class="sopt-name">EMT</div><div class="sopt-cnt">${MEDS.filter(m=>m.scope.includes('EMT')).length} drugs</div></div><div class="sopt-chk">✓</div></div>
        <div class="sopt" onclick="selScope('P',this)"><div class="sdot-sm" style="background:var(--par)"></div><div class="sopt-txt"><div class="sopt-name">Paramedic</div><div class="sopt-cnt">${MEDS.filter(m=>m.scope.includes('P')).length} drugs</div></div><div class="sopt-chk">✓</div></div>
        <div class="sopt" onclick="selScope('AP',this)"><div class="sdot-sm" style="background:var(--ap)"></div><div class="sopt-txt"><div class="sopt-name">Advanced Paramedic</div><div class="sopt-cnt">${MEDS.filter(m=>m.scope.includes('AP')).length} drugs</div></div><div class="sopt-chk">✓</div></div>
      </div>
    </div>` : ''}
    <div class="og">
      <span class="og-lbl">Format</span>
      <div class="mode-grid">
        <div class="mode-card on" onclick="selFmt('mc',this)"><div class="mode-ico">🎯</div><div class="mode-name">Multiple Choice</div><div class="mode-desc">4 options, auto-marked</div></div>
        <div class="mode-card" onclick="selFmt('fc',this)"><div class="mode-ico">🃏</div><div class="mode-name">Flashcard</div><div class="mode-desc">Tap to flip, self-mark</div></div>
      </div>
    </div>
    <button class="btn-pri" onclick="launchFromSetup()">Start Quiz</button>`;
}

function goCategoryPicker() {
  window.scrollTo({top:0,behavior:'instant'});
  let html = '';
  html += '<div id="catPickerBack" class="quiz-back-sticky"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg> Back</div>';
  html += '<div class="pg-title">🔬 Category Quiz</div>';
  html += '<div class="pg-sub">Pick a drug class to focus on</div>';
  html += '<div style="display:flex;flex-direction:column;gap:8px">';
  CATEGORIES.forEach(cat => {
    const drugs = MEDS.filter(cat.fn);
    const empty = drugs.length === 0;
    html += '<div class="cat-card' + (empty ? ' cat-empty' : '') + '" data-cat="' + cat.name + '">';
    html += '<div class="cat-icon">' + cat.icon + '</div>';
    html += '<div class="cat-info"><div class="cat-name">' + cat.name + '</div><div class="cat-count">' + drugs.length + ' drug' + (drugs.length !== 1 ? 's' : '') + '</div></div>';
    html += '<div style="color:var(--text3)">→</div>';
    html += '</div>';
  });
  html += '</div>';
  document.getElementById('quizTabContent').innerHTML = html;

  document.getElementById('catPickerBack').addEventListener('click', renderQuizTab);
  document.querySelectorAll('.cat-card[data-cat]').forEach(card => {
    const catName = card.dataset.cat;
    const drugs = MEDS.filter(CATEGORIES.find(c => c.name === catName).fn);
    if (drugs.length > 0) {
      card.addEventListener('click', () => selectCat(catName));
    }
  });
}

function selectCat(name) {
  window.scrollTo({top:0,behavior:'instant'});
  QZ.mode = 'category';
  QZ.category = name;
  QZ.adaptive = false;
  document.getElementById('quizTabContent').innerHTML = `
    <div class="quiz-back-sticky" onclick="goCategoryPicker()">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg> Back
    </div>
    <div class="pg-title">🔬 ${name}</div>
    <div class="pg-sub">Quiz this drug category</div>
    <div class="og">
      <span class="og-lbl">Format</span>
      <div class="mode-grid">
        <div class="mode-card on" onclick="selFmt('mc',this)"><div class="mode-ico">🎯</div><div class="mode-name">Multiple Choice</div><div class="mode-desc">4 options, auto-marked</div></div>
        <div class="mode-card" onclick="selFmt('fc',this)"><div class="mode-ico">🃏</div><div class="mode-name">Flashcard</div><div class="mode-desc">Tap to flip, self-mark</div></div>
      </div>
    </div>
    <button class="btn-pri" onclick="launchFromSetup()">Start Quiz</button>`;
}

function selScope(s, el) {
  document.querySelectorAll('.sopt').forEach(o => o.className = 'sopt');
  const cls = { all:'on-all', EMT:'on-emt', P:'on-p', AP:'on-ap' };
  el.classList.add(cls[s]||'on-all');
  QZ.scope = s; haptic();
}
function selFmt(f, el) {
  document.querySelectorAll('.mode-card').forEach(o => o.classList.remove('on'));
  el.classList.add('on');
  QZ.fmt = f; haptic();
}

// ── LAUNCH ────────────────────────────────────────────────────────────────────
function launchFromSetup() {
  const { mode, scope, adaptive } = QZ;
  let qs;
  if (mode === 'terms') {
    qs = makeTermQs(10);
  } else if (mode === 'review') {
    const due = MEDS.filter(m => isDue(m.id) && (G.drugCorrect[m.id]||0) > 0);
    if (!due.length) { showToast('No drugs due for review'); return; }
    qs = makeDrugQs(due, 10, false);
  } else if (mode === 'category') {
    const cat = CATEGORIES.find(c => c.name === QZ.category);
    const drugs = cat ? MEDS.filter(cat.fn) : [];
    if (!drugs.length) { showToast('No drugs in this category'); return; }
    qs = makeDrugQs(drugs, 10, false);
  } else {
    const drugs = scope === 'all' ? MEDS : MEDS.filter(m => m.scope.includes(scope));
    if (!drugs.length) { showToast('No drugs for this filter'); return; }
    qs = makeDrugQs(drugs, 10, adaptive);
  }
  launch(qs, mode === 'timed', mode === 'terms', false);
}

function launchWeakSpots() {
  const drugs = (G.recentWrong||[]).map(id => MEDS.find(m => m.id === id)).filter(Boolean);
  if (!drugs.length) { showToast('No weak spots yet, keep quizzing!'); return; }
  QZ.fmt = 'mc';
  launch(makeDrugQs(drugs, 10, false), false, false, false);
}

function startDaily() {
  if (isDailyDone()) { showToast('Already done today, come back tomorrow!'); return; }
  QZ.fmt = 'mc';
  QZ.mode = 'daily';
  launch(makeDailyQs(), false, false, true);
}

function launch(qs, isTimed=false, isTerms=false, isDaily=false) {
  window.scrollTo({top:0,behavior:'instant'});
  // Save last settings for New Quiz
  QZ.lastMode = QZ.mode; QZ.lastScope = QZ.scope;
  QZ.lastFmt = QZ.fmt; QZ.lastAdaptive = QZ.adaptive;
  // Reset state
  Object.assign(QZ, { qs, idx:0, correct:0, answered:false, flipped:false,
    xpThis:0, isTerms, isDaily, isTimed, isIntro:false, streak:0, wrongAnswers:[],
    timeLeft:30, timerRef:null });
  showQuizActive();
  if (QZ.fmt === 'fc') {
    document.getElementById('fcMode').style.display = 'block';
    renderFC();
  } else {
    document.getElementById('mcMode').style.display = 'block';
    renderMC();
  }
}

// Intro quiz — 5 questions, MC, doesn't consume daily challenge, shows "Start Studying" at end
function launchIntroQuiz() {
  QZ.mode = 'standard'; QZ.scope = 'all'; QZ.fmt = 'mc'; QZ.adaptive = false;
  const qs = makeDrugQs(MEDS, 5, false);
  window.scrollTo({top:0,behavior:'instant'});
  QZ.lastMode = QZ.mode; QZ.lastScope = QZ.scope;
  QZ.lastFmt = QZ.fmt; QZ.lastAdaptive = QZ.adaptive;
  Object.assign(QZ, { qs, idx:0, correct:0, answered:false, flipped:false,
    xpThis:0, isTerms:false, isDaily:false, isTimed:false, isIntro:true,
    streak:0, wrongAnswers:[], timeLeft:30, timerRef:null });
  showQuizActive();
  document.getElementById('mcMode').style.display = 'block';
  renderMC();
}

function exitToTab() {
  clearTimer();
  showQuizTab();
  renderQuizTab();
}
function newQuiz() {
  // Relaunch with same settings
  QZ.mode = QZ.lastMode; QZ.scope = QZ.lastScope;
  QZ.fmt = QZ.lastFmt; QZ.adaptive = QZ.lastAdaptive;
  launchFromSetup();
}
function resetQuiz() { exitToTab(); scrollTop(); window.scrollTo({top:0,behavior:'instant'}); }
function confirmResetQuiz() {
  showConfirm(
    'End Quiz?',
    'Your progress on this quiz will be lost.',
    ()=>exitToTab()
  );
}

// ── TIMER ─────────────────────────────────────────────────────────────────────
function startTimer() {
  clearTimer();
  QZ.timeLeft = 30;
  updateTimer();
  QZ.timerRef = setInterval(() => {
    QZ.timeLeft--;
    updateTimer();
    if (QZ.timeLeft <= 0) { clearTimer(); timeUp(); }
  }, 1000);
}
function clearTimer() {
  if (QZ.timerRef) { clearInterval(QZ.timerRef); QZ.timerRef = null; }
}
function updateTimer() {
  const el = document.getElementById('timerDisplay');
  const ring = document.getElementById('timerRing');
  if (el) { el.textContent = QZ.timeLeft; el.style.color = QZ.timeLeft <= 10 ? 'var(--error)' : 'var(--text)'; }
  if (ring) {
    const pct = QZ.timeLeft / 30;
    ring.style.strokeDashoffset = String(113 * (1 - pct));
    ring.style.stroke = QZ.timeLeft <= 10 ? 'var(--error)' : 'var(--primary)';
  }
}
function timeUp() {
  if (QZ.answered) return;
  QZ.answered = true;
  QZ.streak = 0;
  const q = QZ.qs[QZ.idx];
  QZ.wrongAnswers.push({ q, correctAns: getQAns(q) });
  if (!q.isTerm) srNextDate(q.drug.id, false);
  G.totalQ++;
  document.querySelectorAll('.mc-opt').forEach(o => {
    const ca = getQAns(q);
    if (o.textContent === ca || o.textContent === ca.substring(0,107)+'…') o.classList.add('correct');
    o.classList.add('revealed');
  });
  const next = document.getElementById('mcNext');
  if (next) next.classList.add('show');
  haptic('error'); saveG();
}

// ── STREAK BURST ──────────────────────────────────────────────────────────────
function checkBurst() {
  let bonus = 0;
  if (QZ.streak === 5)  bonus = 5;
  if (QZ.streak === 10) bonus = 10;
  // Every further 10 in a row also rewards +10
  if (QZ.streak > 10 && QZ.streak % 10 === 0) bonus = 10;
  if (bonus > 0) {
    // In flashcard mode, burst XP must respect the daily flashcard cap —
    // otherwise streaks let users earn unlimited self-marked XP past the cap.
    if (QZ.fmt === 'fc') {
      const remaining = fcXpRemaining();
      bonus = Math.min(bonus, remaining);
    }
    // The burst popup is an XP-reward celebration. If the cap has left no XP to
    // award (bonus === 0), don't show it — celebrating a reward that wasn't
    // actually given is misleading.
    if (bonus <= 0) return;
    const el = document.getElementById('streakBurst');
    if (el) { el.textContent = `🔥 ${QZ.streak} in a row! +${bonus} XP`; el.classList.add('show'); setTimeout(()=>el.classList.remove('show'),2000); }
    // Accumulate into xpThis only — G.xp is awarded once at the results screen.
    // (Previously this also added to G.xp directly, double-counting the bonus.)
    QZ.xpThis += bonus;
    if (QZ.fmt === 'fc') G.fcXpToday = (G.fcXpToday || 0) + bonus;
    // Live header preview: show running total without permanently committing it
    updateHdrPreview(G.xp + QZ.xpThis);
  }
}

// ── FLASHCARD ─────────────────────────────────────────────────────────────────
function renderFC() {
  const { qs, idx } = QZ;
  if (idx >= qs.length) { showResults(); return; }
  const q = qs[idx];
  const prog = document.getElementById('fcProg');
  const ctr  = document.getElementById('fcCtr');
  if (prog) prog.style.width = (idx/qs.length*100)+'%';
  if (ctr)  ctr.textContent = `${idx+1} / ${qs.length}`;
  document.getElementById('fcPrompt').textContent = getQPrompt(q);
  document.getElementById('fcQ').textContent      = getQText(q);
  document.getElementById('fcAnsLbl').textContent = getQPrompt(q);
  document.getElementById('fcAns').textContent    = getQAns(q);
  const fc = document.getElementById('fc');
  if (fc) fc.classList.remove('flipped');
  QZ.flipped = false;
  const acts = document.getElementById('fcActions');
  if (acts) acts.style.display = 'none';
}
function flipCard() {
  const fc = document.getElementById('fc');
  if (!fc) return;
  fc.classList.toggle('flipped');
  QZ.flipped = !QZ.flipped;
  const acts = document.getElementById('fcActions');
  if (acts) acts.style.display = QZ.flipped ? 'grid' : 'none';
  haptic();
}
function markCard(correct) {
  const q = QZ.qs[QZ.idx];
  if (correct) {
    QZ.correct++; G.totalCorrect++; QZ.streak++;
    // Flashcard XP is capped per day across all sessions — self-marked, easy to game
    const remaining = fcXpRemaining();
    if (remaining > 0) {
      const gain = Math.min(xpPerQ(true), remaining);
      QZ.xpThis += gain;
      G.fcXpToday = (G.fcXpToday || 0) + gain;
    }
    if (!q.isTerm) { G.drugCorrect[q.drug.id] = (G.drugCorrect[q.drug.id]||0)+1; srNextDate(q.drug.id, true); }
    checkBurst(); haptic('success');
  } else {
    QZ.streak = 0;
    QZ.wrongAnswers.push({ q, correctAns: getQAns(q) });
    if (!q.isTerm) srNextDate(q.drug.id, false);
    haptic('error');
  }
  G.totalQ++; QZ.idx++; saveG(); renderFC();
}
function skipCard() { QZ.idx++; QZ.streak = 0; renderFC(); haptic(); }

// ── MULTIPLE CHOICE ───────────────────────────────────────────────────────────
function renderMC() {
  const { qs, idx } = QZ;
  if (idx >= qs.length) { showResults(); return; }
  const q = qs[idx];
  const prog = document.getElementById('mcProg');
  const ctr  = document.getElementById('mcCtr');
  if (prog) prog.style.width = (idx/qs.length*100)+'%';
  if (ctr)  ctr.textContent = `${idx+1} / ${qs.length}`;
  document.getElementById('mcPrompt').textContent = getQPrompt(q);
  document.getElementById('mcQ').textContent      = getQText(q);
  const next = document.getElementById('mcNext');
  if (next) next.classList.remove('show');
  const tw = document.getElementById('timerWrap');
  if (tw) tw.style.display = QZ.isTimed ? 'flex' : 'none';
  if (QZ.isTimed) startTimer();
  QZ.answered = false;
  const correct = getQAns(q);
  const drugId  = q.isTerm ? null : q.drug.id;
  const opts = document.getElementById('mcOpts');
  if (opts) opts.innerHTML = q.opts.map(opt => {
    const short = opt.length > 110 ? opt.substring(0,107)+'…' : opt;
    return `<button class="mc-opt" onclick="answerMC(this,${opt===correct},${drugId})">${short}</button>`;
  }).join('');
}
function answerMC(btn, correct, drugId) {
  if (QZ.answered) return;
  QZ.answered = true;
  clearTimer();
  const q = QZ.qs[QZ.idx];
  if (correct) {
    btn.classList.add('correct');
    QZ.correct++; G.totalCorrect++; QZ.xpThis += xpPerQ(); QZ.streak++;
    if (drugId) { G.drugCorrect[drugId] = (G.drugCorrect[drugId]||0)+1; srNextDate(drugId, true); }
    checkBurst(); haptic('success');
  } else {
    btn.classList.add('wrong'); QZ.streak = 0;
    QZ.wrongAnswers.push({ q, correctAns: getQAns(q) });
    if (drugId) srNextDate(drugId, false);
    haptic('error');
    const ca = getQAns(q);
    document.querySelectorAll('.mc-opt').forEach(o => {
      if (o.textContent === ca || o.textContent === ca.substring(0,107)+'…') o.classList.add('correct');
    });
  }
  G.totalQ++;
  document.querySelectorAll('.mc-opt').forEach(o => o.classList.add('revealed'));
  const next = document.getElementById('mcNext');
  if (next) next.classList.add('show');
  saveG();
}
function nextMC() { QZ.idx++; renderMC(); haptic(); }

// ── RESULTS ───────────────────────────────────────────────────────────────────
function showResults() {
  clearTimer();
  const { correct, qs, xpThis, isDaily, wrongAnswers } = QZ;
  const total = qs.length;
  const pct   = Math.round(correct/total*100);
  G.quizzes++;
  // ── STREAK (calendar-day based, consistent todayKey format) ──
  // Intro quiz does not count toward streaks.
  if (!QZ.isIntro) {
    const today = todayKey();
    if (G.lastDate !== today) {
      // First completed quiz today — extend the streak.
      // (checkStreakOnLoad has already handled any missed-day resets/freezes,
      //  so if we're here the streak is current: either brand new, or lastDate
      //  was yesterday.)
      G.streak = (G.streak || 0) + 1;
      G.lastDate = today;
    }
  }
  let bonus = 0;
  if (isDaily && !isDailyDone()) {
    bonus = 15; G.lastDailyDate = todayKey();
    G.dailyDoneCount = (G.dailyDoneCount || 0) + 1;  // for Daily Devotee / Daily Legend badges
  }
  const totalXP = xpThis + bonus;
  // Capture level before and after awarding XP to detect a level-up
  const levelBefore = getLevel(G.xp).name;
  G.xp += totalXP;
  const levelAfter = getLevel(G.xp).name;
  logToday(total, correct, 1, totalXP);
  // ── Badge counters ──
  // Flawless: a 100% score on a full (non-intro) quiz. Guard total>0.
  if (!QZ.isIntro && total > 0 && correct === total) {
    G.perfectQuizzes = (G.perfectQuizzes || 0) + 1;
  }
  // Night Shift: any quiz completed between midnight and 06:00.
  const hr = new Date().getHours();
  if (hr >= 0 && hr < 6) {
    G.nightShiftDone = true;
  }
  checkBadges(); saveG(); updateHdr();
  // Trigger level-up celebration if the level changed
  if (levelBefore !== levelAfter) {
    setTimeout(() => showLevelUp(getLevel(G.xp)), 600);
  }
  document.getElementById('fcMode').style.display = 'none';
  document.getElementById('mcMode').style.display = 'none';
  const res = document.getElementById('qResults');
  res.classList.add('show');
  document.getElementById('resCorrect').textContent = correct;
  document.getElementById('resTotal').textContent   = total;
  document.getElementById('resPct').textContent     = pct+'%';
  const xpMsg = `⚡ +${totalXP} XP earned${bonus>0?' (incl. +'+bonus+' daily bonus!)':''}`;
  document.getElementById('xpEarnedBtn').textContent = xpMsg+', tap to see progress';
  // Flashcard daily cap notice — only on flashcard quizzes once the cap is hit
  const capMsg = document.getElementById('resCapMsg');
  if (capMsg) {
    const capReached = QZ.fmt === 'fc' && fcXpRemaining() === 0;
    capMsg.style.display = capReached ? 'block' : 'none';
  }
  const emoji = pct>=90?'🏆':pct>=70?'🎯':pct>=50?'📚':'💪';
  const title = pct>=90?'Outstanding!':pct>=70?'Great Work!':pct>=50?'Good Effort':'Keep Studying!';
  document.getElementById('resRing').textContent = emoji;
  document.getElementById('resTitle').textContent = title;
  document.getElementById('resSub').textContent   = pct>=90?'Excellent clinical knowledge.':pct>=70?'Solid performance.':pct>=50?'More revision will sharpen you.':'Review the formulary and try again.';
  const bd = document.getElementById('wrongBreakdown');
  if (bd) {
    if (wrongAnswers.length > 0) {
      bd.style.display = 'block';
      bd.innerHTML = '<div class="breakdown-title">Review your mistakes</div>' +
        wrongAnswers.map(({q,correctAns}) =>
          '<div class="breakdown-item">'
          +'<div class="breakdown-q">'+getQText(q)+'</div>'
          +'<div class="breakdown-a"><span class="breakdown-label">Correct: </span>'+correctAns.substring(0,120)+'</div>'
          +'</div>'
        ).join('');
    } else {
      bd.style.display = 'none';
    }
  }
  renderHome();
  // Show correct end-screen buttons
  const introBtn = document.getElementById('resIntroBtn');
  const normalBtns = document.getElementById('resNormalBtns');
  if (QZ.isIntro) {
    if (introBtn) introBtn.style.display = 'block';
    if (normalBtns) normalBtns.style.display = 'none';
  } else {
    if (introBtn) introBtn.style.display = 'none';
    if (normalBtns) normalBtns.style.display = 'block';
  }
}
