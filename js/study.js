// ─── STUDY.JS ─────────────────────────────────────────────────────────────────
// Study tab: Medical Terms (categorised accordion + search) and Question Bank.

let studySec='drugs', studyQ='';

function selStudy(sec,el){
  document.querySelectorAll('.section-chips [data-ssec]').forEach(c=>c.classList.remove('on'));
  el.classList.add('on');
  studySec=sec;
  // Reset search when switching sections
  studyQ='';
  const inp=document.getElementById('learnSearch');
  if(inp)inp.value='';
  document.getElementById('learnClear').style.display='none';
  // Search bar only applies to terms
  document.getElementById('studySearchWrap').style.display=sec==='terms'?'flex':'none';
  haptic();
  renderStudy();
}

function renderStudy(){
  const c=document.getElementById('learnContent');
  const drugsEl=document.getElementById('studyDrugs');
  const sw=document.getElementById('studySearchWrap');
  if(studySec==='drugs'||!studySec){
    if(drugsEl)drugsEl.style.display='block';
    if(sw)sw.style.display='none';
    if(c)c.style.display='none';
    renderDrugList();
  }else if(studySec==='terms'){
    if(drugsEl)drugsEl.style.display='none';
    if(sw)sw.style.display='flex';
    if(c){c.style.display='block';
      if(studyQ)c.innerHTML=renderTermsSearch(studyQ);
      else c.innerHTML=renderTerms();
      attachTermHandlers(c);
    }
  }else if(studySec==='questions'){
    if(drugsEl)drugsEl.style.display='none';
    if(sw)sw.style.display='none';
    if(c)c.style.display='block';
    renderQuestionBank('');
  }else if(studySec==='stations'){
    if(drugsEl)drugsEl.style.display='none';
    if(sw)sw.style.display='none';
    if(c){c.style.display='block';c.innerHTML=renderStations();}
  }
}

// ── SEARCH (terms only) ───────────────────────────────────────────────────────
function handleStudySearch(q){
  studyQ=q.toLowerCase();
  document.getElementById('learnClear').style.display=q?'flex':'none';
  renderStudy();
}

function clearStudySearch(){
  studyQ='';
  document.getElementById('learnSearch').value='';
  document.getElementById('learnClear').style.display='none';
  renderStudy();
}

// ── MEDICAL TERMS ─────────────────────────────────────────────────────────────
const TERM_CATEGORIES=[
  {name:'Cardiovascular',icon:'❤️',terms:['Angina','Arrhythmia','Asystole','Bradycardia','Cardiac Tamponade','Cardiogenic Shock','Defibrillation','Diastole','Fibrillation','Hypertension','Hypertensive Crisis','Hypotension','Myocardial Infarction (MI)','Palpitation','Pericarditis','Sinus Rhythm','Systole','Tachycardia','Thrombosis','Torsades de Pointes','Ventricular Fibrillation (VF)','Ventricular Tachycardia (VT)','Dysrhythmia']},
  {name:'Respiratory',icon:'🫁',terms:['Apnoea','Asphyxia','Bronchospasm','Croup','Dyspnoea','Hyperventilation','Pneumothorax','Pulmonary Embolism (PE)','Pulmonary Oedema','Stridor','Tachypnoea','Tension Pneumothorax','Wheeze','Anoxia','Cyanosis','Laryngospasm']},
  {name:'Neurology',icon:'🧠',terms:['Ataxia','Cerebrovascular Accident (CVA)','Coma','Convulsion','Dissociation','Dystonia','Lethargy','Meningism','Meningitis','Paraesthesia','Seizure','Syncope','Transient Ischaemic Attack (TIA)','Vertigo']},
  {name:'Metabolic & Endocrine',icon:'⚗️',terms:['Acidosis','Alkalosis','Dehydration','Hyperglycaemia','Hyperkalaemia','Hyperthermia','Hypoglycaemia','Hypokalaemia','Hypothermia','Pyrexia']},
  {name:'Haematology & Bleeding',icon:'🩸',terms:['Anaemia','Haematemesis','Haematoma','Haematuria','Haemolysis','Haemoptysis','Haemorrhage','Haemostasis']},
  {name:'Renal & Fluid',icon:'💧',terms:['Diuresis','Hypovolaemia','Oedema','Oliguria','Orthostatic Hypotension','Polydipsia','Polyuria']},
  {name:'Gastrointestinal',icon:'🫃',terms:['Nausea','Dysphagia','Jaundice']},
  {name:'Musculoskeletal & Trauma',icon:'🦴',terms:['Crepitus','Rhabdomyolysis','Trauma']},
  {name:'Obstetric',icon:'🤱',terms:['Eclampsia','Pre-eclampsia']},
  {name:'Pharmacology & Drug Terms',icon:'💊',terms:['Analgesia','Antipyretic','Contraindication','Dysuria','Extravasation','Pruritus']},
  {name:'General Clinical',icon:'🏥',terms:['Acute','Aetiology','Auscultation','Capillary Refill Time (CRT)','Cellulitis','Chronic','Constriction','Decompensation','Diaphoresis','Dilatation','Embolism','Epistaxis','Exacerbation','Hypoxia','Idiopathic','Infarction','Ischaemia','Malaise','Necrosis','Neurogenic Shock','Orthopnoea','Pallor','Perfusion','Periorbital','Shock','Subcutaneous','Tinnitus','Triage','Urticaria','Vasoconstriction','Vasodilation','Anaphylaxis','Sepsis']}
];

function termCardHtml(t){
  const safeId='term-'+t.term.replace(/\s+/g,'_').replace(/[()]/g,'');
  return '<div class="term-card" id="'+safeId+'">'
    +'<div class="term-card-header"><div class="term-word">'+t.term+'</div><div class="term-chevron">›</div></div>'
    +'<div class="term-def">'+t.def+'</div>'
    +'</div>';
}

function renderTerms(){
  const getTerm=name=>TERMS.find(t=>t.term===name);
  return TERM_CATEGORIES.map((cat,i)=>{
    const catTerms=cat.terms.map(getTerm).filter(Boolean);
    if(!catTerms.length)return'';
    const catId='cat-'+i;
    return '<div class="term-cat-wrap" id="'+catId+'">'
      +'<div class="term-cat-header term-cat-toggle" onclick="toggleCategory(\''+catId+'\')">'
      +'<div class="term-cat-left"><span class="term-cat-icon">'+cat.icon+'</span>'+cat.name+'</div>'
      +'<div class="term-cat-meta"><span class="term-cat-count">'+catTerms.length+'</span><span class="term-cat-chevron">›</span></div>'
      +'</div>'
      +'<div class="term-cat-body">'
      +catTerms.map(termCardHtml).join('')
      +'</div>'
      +'</div>';
  }).join('');
}

function toggleCategory(id){
  const wrap=document.getElementById(id);
  if(!wrap)return;
  const wasOpen=wrap.classList.contains('open');
  // Close all categories
  document.querySelectorAll('.term-cat-wrap.open').forEach(w=>w.classList.remove('open'));
  if(!wasOpen){
    wrap.classList.add('open');
    // Scroll category header into view
    setTimeout(()=>{
      const top=wrap.getBoundingClientRect().top+window.scrollY;
      const hdrH=document.querySelector('.hdr')?.offsetHeight||56;
      window.scrollTo({top:top-hdrH-8,behavior:'smooth'});
    },50);
  }
  haptic();
}

function renderTermsSearch(q){
  // Relevance scored: exact > starts-with > contains > definition
  const results=TERMS.map(t=>{
    const term=t.term.toLowerCase();
    let score=0;
    if(term===q)score=100;
    else if(term.startsWith(q))score=80;
    else if(term.includes(q))score=60;
    else if(t.def.toLowerCase().includes(q))score=20;
    return{t,score};
  }).filter(x=>x.score>0)
    .sort((a,b)=>b.score-a.score||a.t.term.localeCompare(b.t.term))
    .map(x=>x.t);
  if(!results.length)return'<div class="empty"><div class="empty-ico">🔍</div><p>No terms match your search</p></div>';
  return '<div class="term-cat-header term-search-header"><span class="term-cat-icon">📖</span>Search Results</div>'
    +results.map(termCardHtml).join('');
}

function attachTermHandlers(container){
  container.querySelectorAll('.term-card').forEach(card=>{
    card.addEventListener('click',function(){ toggleTerm(this); });
  });
}

function toggleTerm(el){
  const wasOpen=el.classList.contains('open');
  document.querySelectorAll('.term-card.open').forEach(c=>c.classList.remove('open'));
  if(!wasOpen){
    el.classList.add('open');
    // Scroll the card header to just below the page header — same pattern as question bank
    setTimeout(()=>{
      const top=el.getBoundingClientRect().top+window.scrollY;
      const hdrH=document.querySelector('.hdr')?.offsetHeight||56;
      window.scrollTo({top:top-hdrH-8,behavior:'smooth'});
    },50);
  }
  haptic();
}

// Scroll to a specific term (used by home global search)
function scrollToStudyTerm(termName){
  setTimeout(()=>{
    const cards=document.querySelectorAll('.term-card');
    for(const card of cards){
      const word=card.querySelector('.term-word');
      if(word&&word.textContent===termName){
        card.scrollIntoView({behavior:'smooth',block:'center'});
        card.classList.add('open');
        break;
      }
    }
  },150);
}

// ── QUESTION BANK ─────────────────────────────────────────────────────────────
function toggleRevealAll(btn){
  const card=btn.closest('.ql-card');
  const reveals=card.querySelectorAll('.ql-reveal');
  const anyHidden=[...reveals].some(r=>!r.classList.contains('open'));
  reveals.forEach(r=>r.classList.toggle('open',anyHidden));
  btn.textContent=anyHidden?'Hide all answers':'Reveal all answers';
  haptic();
}

function renderQuestionBank(query){
  const c=document.getElementById('learnContent');
  let html='';
  html+='<div class="gsearch-wrap"><svg class="si" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>'
    +'<input type="search" id="qbankSearch" placeholder="Search drugs…" autocomplete="off" spellcheck="false"/></div>';
  html+='<div id="qbankAccordion"></div>';
  c.innerHTML=html;
  document.getElementById('qbankSearch').addEventListener('input',function(){
    renderQuestionAccordion(this.value.trim().toLowerCase());
  });
  renderQuestionAccordion(query||'');
}

function renderQuestionAccordion(query){
  const sorted=[...MEDS].sort((a,b)=>a.name.localeCompare(b.name));
  const filtered=query?sorted.filter(d=>d.name.toLowerCase().includes(query)||d.classification.toLowerCase().includes(query)):sorted;
  const el=document.getElementById('qbankAccordion');
  if(!el)return;
  if(!filtered.length){
    el.innerHTML='<div class="empty"><div class="empty-ico">🔍</div><p>No drugs match your search</p></div>';
    return;
  }
  let html='';
  filtered.forEach(d=>{
    html+='<div class="ql-card" data-drug="'+d.id+'">';
    html+='<div class="ql-header"><div class="ql-name">'+d.name+'</div><div class="ql-header-right"><button class="ql-reveal-all" onclick="event.stopPropagation();toggleRevealAll(this)">Reveal all answers</button><div class="ql-chevron">›</div></div></div>';
    html+='<div class="ql-body">';
    [...EASY_Q,...HARD_Q].forEach(qt=>{
      const answer=qt.a(d);
      html+='<div class="ql-q">';
      html+='<div class="ql-q-type">'+qt.prompt+'</div>';
      html+='<div class="ql-q-text">'+qt.q(d)+'</div>';
      html+='<div class="ql-reveal" onclick="this.classList.toggle(\'open\')">';
      html+='<div class="ql-reveal-btn">Tap to reveal answer</div>';
      html+='<div class="ql-answer">'+answer+'</div>';
      html+='</div>';
      html+='</div>';
    });
    html+='</div></div>';
  });
  el.innerHTML=html;
  document.querySelectorAll('.ql-card').forEach(card=>{
    card.querySelector('.ql-header').addEventListener('click',function(){
      const wasOpen=card.classList.contains('open');
      document.querySelectorAll('.ql-card.open').forEach(c=>c.classList.remove('open'));
      if(!wasOpen){
        card.classList.add('open');
        // Scroll the card header to the top of the viewport so the user
        // sees the drug name and questions from the top, not the middle
        setTimeout(()=>{
          const top=card.getBoundingClientRect().top+window.scrollY;
          const hdrH=document.querySelector('.hdr')?.offsetHeight||56;
          window.scrollTo({top:top-hdrH-8,behavior:'smooth'});
        },50);
      }
      haptic();
    });
  });
}

// ── OSCE STATIONS ─────────────────────────────────────────────────────────────
// Browsable PHECC OSCE assessment sheets. Reuses the term-cat-wrap accordion for
// categories; each station expands IN PLACE into a checklist. Tick state is
// scratch-only (session memory in _osceTicks), cleared on collapse / reset, never
// persisted — by design.

// Per-station scratch tick state: { stationId: Set<elementNumber> }. Lives only
// for the page session; wiped whenever the station is collapsed or reset.
const _osceTicks = {};

function osceEsc(s){
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// Count total elements across a station's sections (some sections are advisory
// banners with zero elements).
function osceTotal(stn){
  return stn.sections.reduce((sum,sec)=>sum+sec.elements.length,0);
}

// Build one element row with its tappable checkbox.
function osceElHtml(stnId, el){
  const tags=[];
  if(el.crit)     tags.push('<span class="osce-tag osce-tag-crit">Critical *</span>');
  if(el.verbalise)tags.push('<span class="osce-tag osce-tag-verb">Verbalise</span>');
  if(el.simulate) tags.push('<span class="osce-tag osce-tag-sim">Simulate</span>');
  const tagsHtml = tags.length ? '<div class="osce-el-tags">'+tags.join('')+'</div>' : '';
  const exHtml   = el.examiner ? '<div class="osce-el-ex">'+osceEsc(el.examiner)+'</div>' : '';
  const critCls  = el.crit ? ' crit' : '';
  return '<div class="osce-el'+critCls+'" onclick="osceTick(\''+stnId+'\','+el.n+',this)">'
    + '<div class="osce-box"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></div>'
    + '<div class="osce-el-n">'+el.n+'</div>'
    + '<div class="osce-el-main"><div class="osce-el-text">'+osceEsc(el.text)+'</div>'+tagsHtml+exHtml+'</div>'
    + '</div>';
}

// Build the expanded body of a station (intro, progress/reset bar, legend,
// grouped sections, footer).
function osceBodyHtml(stn){
  const total=osceTotal(stn);
  const hasCrit=stn.sections.some(s=>s.elements.some(e=>e.crit));

  let intro='';
  if(stn.intro) intro+='<div class="osce-hero-intro">'+osceEsc(stn.intro)+'</div>';
  if(stn.caveat)intro+='<div class="osce-caveat">'+osceEsc(stn.caveat)+'</div>';
  const hero = intro ? '<div class="osce-hero">'+intro+'</div>' : '';

  const bar = '<div class="osce-bar">'
    + '<div class="osce-prog"><b id="osce-count-'+stn.id+'">0</b> / '+total+' steps ticked</div>'
    + '<button class="osce-reset" onclick="osceReset(\''+stn.id+'\')">Reset</button>'
    + '</div>';

  const legend = '<div class="osce-legend">'
    + (hasCrit
        ? '<b>*</b> = critical element (must be achieved to pass). Pass = 80% of all elements <i>and</i> all critical elements.'
        : 'No critical elements on secondary sheets. Pass = 80% of all elements.')
    + '</div>';

  const sections = '<div class="osce-sections">' + stn.sections.map(sec=>{
    const title = sec.title ? '<div class="osce-sec-title">'+osceEsc(sec.title)+'</div>' : '';
    const els   = sec.elements.map(e=>osceElHtml(stn.id,e)).join('');
    return '<div class="osce-sec">'+title+els+'</div>';
  }).join('') + '</div>';

  let foot='<div class="osce-foot">';
  foot+='<div class="osce-foot-rule"><span class="osce-ico">✓</span><span>Pass: '+osceEsc(stn.passRule)+'</span></div>';
  if(stn.ruleLine) foot+='<div class="osce-foot-line">Rule: '+osceEsc(stn.ruleLine)+'</div>';
  if(stn.examinerNote) foot+='<div class="osce-foot-note">'+osceEsc(stn.examinerNote)+'</div>';
  foot+='</div>';

  return '<div class="osce-body">'+hero+bar+legend+sections+foot+'</div>';
}

// Build one station bubble (collapsed head + hidden body).
function osceStationHtml(stn){
  const total=osceTotal(stn);
  const critN=stn.sections.reduce((c,s)=>c+s.elements.filter(e=>e.crit).length,0);
  const scopeCls = stn.scope==='EMT' ? 'osce-pill-emt' : 'osce-pill-p';
  const scopeLbl = stn.scope==='EMT' ? 'EMT' : 'Paramedic';
  const examLbl  = stn.exam ? (stn.exam.charAt(0).toUpperCase()+stn.exam.slice(1)) : '';
  const examPill = examLbl ? '<span class="osce-pill osce-pill-exam">'+examLbl+'</span>' : '';
  const sub = stn.version + ' · ' + total + ' elements' + (critN ? ' · '+critN+' critical' : '');

  return '<div class="osce-stn" id="osce-stn-'+stn.id+'">'
    + '<div class="osce-head" onclick="osceToggle(\''+stn.id+'\')">'
    +   '<div class="osce-head-top">'
    +     '<span class="osce-name">'+osceEsc(stn.name)+'</span>'
    +     '<span class="osce-pill '+scopeCls+'">'+scopeLbl+'</span>'
    +     examPill
    +     '<span class="osce-chev">›</span>'
    +   '</div>'
    +   '<div class="osce-sub">'+osceEsc(sub)+'</div>'
    + '</div>'
    + osceBodyHtml(stn)
    + '</div>';
}

// Top-level: category accordion (reuses term-cat-wrap), stations within.
function renderStations(){
  return OSCE_CATEGORIES.map((cat,i)=>{
    const stns = OSCE_STATIONS.filter(s=>s.category===cat.name);
    if(!stns.length) return '';
    const catId='osce-cat-'+i;
    return '<div class="term-cat-wrap" id="'+catId+'">'
      + '<div class="term-cat-header term-cat-toggle" onclick="toggleOsceCategory(\''+catId+'\')">'
      +   '<div class="term-cat-left"><span class="term-cat-icon">'+cat.icon+'</span>'+osceEsc(cat.name)+'</div>'
      +   '<div class="term-cat-meta"><span class="term-cat-count">'+stns.length+'</span><span class="term-cat-chevron">›</span></div>'
      + '</div>'
      + '<div class="term-cat-body">'
      +   stns.map(osceStationHtml).join('')
      + '</div>'
      + '</div>';
  }).join('');
}

// One category open at a time (mirrors Medical Terms / Medref behaviour).
function toggleOsceCategory(id){
  const wrap=document.getElementById(id);
  if(!wrap)return;
  const wasOpen=wrap.classList.contains('open');
  document.querySelectorAll('.term-cat-wrap.open').forEach(w=>w.classList.remove('open'));
  if(!wasOpen){
    wrap.classList.add('open');
    setTimeout(()=>{
      const top=wrap.getBoundingClientRect().top+window.scrollY;
      const hdrH=document.querySelector('.hdr')?.offsetHeight||56;
      window.scrollTo({top:top-hdrH-8,behavior:'smooth'});
    },50);
  }
  haptic();
}

// Expand/collapse a station in place. Collapsing clears its scratch ticks.
function osceToggle(stnId){
  const stn=document.getElementById('osce-stn-'+stnId);
  if(!stn)return;
  const opening=!stn.classList.contains('open');
  stn.classList.toggle('open');
  if(!opening) osceClear(stnId);   // scratch state: wipe on collapse
  haptic();
}

// Toggle a single element's tick.
function osceTick(stnId, n, el){
  if(!_osceTicks[stnId]) _osceTicks[stnId]=new Set();
  const set=_osceTicks[stnId];
  if(set.has(n)){ set.delete(n); el.classList.remove('done'); }
  else          { set.add(n);    el.classList.add('done'); }
  osceUpdateCount(stnId);
  haptic();
}

// Reset button: clear all ticks for a station.
function osceReset(stnId){
  osceClear(stnId);
  haptic();
}

// Clear scratch ticks for a station and reflect it in the DOM.
function osceClear(stnId){
  if(_osceTicks[stnId]) _osceTicks[stnId].clear();
  const stn=document.getElementById('osce-stn-'+stnId);
  if(stn) stn.querySelectorAll('.osce-el.done').forEach(e=>e.classList.remove('done'));
  osceUpdateCount(stnId);
}

function osceUpdateCount(stnId){
  const c=document.getElementById('osce-count-'+stnId);
  if(c) c.textContent = _osceTicks[stnId] ? _osceTicks[stnId].size : 0;
}
