// ─── MEDREF.JS (logic) ────────────────────────────────────────────────────────
// Medication Reference UI: search-first lookup of common medications by generic
// or brand name, with collapsible category browsing as a secondary mode.

let medrefQ = '';

// Escape user input before placing in HTML
function medrefEsc(s){
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// One medication card — generic name prominent, brands beneath, indication, category chip
function medrefCardHtml(d){
  const brands = d.brands.join(', ');
  return '<div class="medref-card">'
    + '<div class="medref-generic">' + medrefEsc(d.generic) + '</div>'
    + '<div class="medref-brands">' + medrefEsc(brands) + '</div>'
    + '<div class="medref-indication">' + medrefEsc(d.indication) + '</div>'
    + '<div class="medref-cat-chip">' + medrefEsc(d.category) + '</div>'
    + '</div>';
}

// Browse mode — collapsible categories, all collapsed by default
function renderMedref(){
  return MEDREF_CATEGORIES.map((cat,i)=>{
    const drugs = MEDREF.filter(d=>d.category===cat.name)
                        .sort((a,b)=>a.generic.localeCompare(b.generic));
    if(!drugs.length) return '';
    const catId = 'medcat-'+i;
    return '<div class="term-cat-wrap" id="'+catId+'">'
      + '<div class="term-cat-header term-cat-toggle" onclick="toggleMedrefCategory(\''+catId+'\')">'
      + '<div class="term-cat-left"><span class="term-cat-icon">'+cat.icon+'</span>'+cat.name+'</div>'
      + '<div class="term-cat-meta"><span class="term-cat-count">'+drugs.length+'</span><span class="term-cat-chevron">›</span></div>'
      + '</div>'
      + '<div class="term-cat-body">'
      + drugs.map(medrefCardHtml).join('')
      + '</div>'
      + '</div>';
  }).join('');
}

// One category open at a time (mirrors Medical Terms behaviour)
function toggleMedrefCategory(id){
  const wrap = document.getElementById(id);
  if(!wrap) return;
  const wasOpen = wrap.classList.contains('open');
  document.querySelectorAll('.term-cat-wrap.open').forEach(w=>w.classList.remove('open'));
  if(!wasOpen){
    wrap.classList.add('open');
    setTimeout(()=>{
      const top = wrap.getBoundingClientRect().top + window.scrollY;
      const hdrH = document.querySelector('.hdr')?.offsetHeight || 56;
      window.scrollTo({top: top-hdrH-8, behavior:'smooth'});
    },50);
  }
  haptic();
}

// Search mode — matches generic name AND every brand name. Relevance scored.
function renderMedrefSearch(q){
  const results = MEDREF.map(d=>{
    const gen = d.generic.toLowerCase();
    const brands = d.brands.map(b=>b.toLowerCase());
    let score = 0;
    if(gen===q) score = 100;
    else if(brands.some(b=>b===q)) score = 95;
    else if(gen.startsWith(q)) score = 80;
    else if(brands.some(b=>b.startsWith(q))) score = 75;
    else if(gen.includes(q)) score = 60;
    else if(brands.some(b=>b.includes(q))) score = 55;
    else if(d.indication.toLowerCase().includes(q)) score = 20;
    return {d, score};
  }).filter(x=>x.score>0)
    .sort((a,b)=>b.score-a.score || a.d.generic.localeCompare(b.d.generic))
    .map(x=>x.d);

  if(!results.length){
    return '<div class="empty"><div class="empty-ico">🔍</div><p>No medications match your search</p>'
      + '<p style="font-size:12px;margin-top:6px;color:var(--text3)">Try a generic name (e.g. apixaban) or brand (e.g. Eliquis)</p></div>';
  }
  return '<div class="medref-results-lbl">'+results.length+' result'+(results.length===1?'':'s')+'</div>'
    + results.map(medrefCardHtml).join('');
}

// Render the meds section based on current search state
function renderMedrefSection(){
  const c = document.getElementById('refContent');
  if(!c) return;
  if(medrefQ) c.innerHTML = renderMedrefSearch(medrefQ);
  else c.innerHTML = renderMedref();
}

function handleMedrefSearch(q){
  medrefQ = q.trim().toLowerCase();
  document.getElementById('medrefClear').style.display = q ? 'flex' : 'none';
  renderMedrefSection();
}

function clearMedrefSearch(){
  medrefQ = '';
  const inp = document.getElementById('medrefSearch');
  if(inp) inp.value = '';
  document.getElementById('medrefClear').style.display = 'none';
  renderMedrefSection();
}
