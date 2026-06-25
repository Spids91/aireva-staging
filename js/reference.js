// ─── REFERENCE.JS ─────────────────────────────────────────────────────────────
// Reference tab: Drugs (list + scope filter + search), Paed Calculator, PCR Codes, PCI Line.

let refScope='all', refQ='', refSec='paed', paedScope='EMT';

// ── SECTION SWITCHING ─────────────────────────────────────────────────────────
function selRefSection(sec,el){
  document.querySelectorAll('.section-chips [data-refsec]').forEach(c=>c.classList.remove('on'));
  el.classList.add('on');
  refSec=sec;
  haptic();
  // Medications search bar only shows in meds section; reset its state on every switch
  const medSearch=document.getElementById('medrefSearchWrap');
  if(medSearch)medSearch.style.display=sec==='meds'?'block':'none';
  if(typeof clearMedrefSearch==='function'&&sec!=='meds')clearMedrefSearch();
  const contentEl=document.getElementById('refContent');
  if(sec==='paed')contentEl.innerHTML=renderPaed();
  else if(sec==='meds')renderMedrefSection();
  else if(sec==='pcr')contentEl.innerHTML=renderPCR();
  else if(sec==='pci')contentEl.innerHTML=renderPCI();
}

// ── DRUGS ─────────────────────────────────────────────────────────────────────
function getFiltered(){
  return MEDS.filter(m=>{
    const scopeOk=refScope==='all'||m.scope.includes(refScope);
    const qOk=!refQ||m.name.toLowerCase().includes(refQ)||m.classification.toLowerCase().includes(refQ)||m.indications.some(i=>i.toLowerCase().includes(refQ));
    return scopeOk&&qOk;
  });
}

function renderDrugList(){
  const drugs=getFiltered();
  const names={all:'All',EMT:'EMT',P:'Paramedic',AP:'Adv. Paramedic'};
  document.getElementById('listLabel').textContent=refQ?`Results for "${refQ}"`:`${names[refScope]||'All'} Medications (${drugs.length})`;
  const list=document.getElementById('drugList');
  if(!drugs.length){list.innerHTML='<div class="empty"><div class="empty-ico">🔍</div><p>No drugs match your search</p></div>';return;}
  list.innerHTML=drugs.map(d=>{
    const dots=d.scope.map(s=>`<div class="sdot sdot-${s}"></div>`).join('');
    return `<div class="drug-card" onclick="openDet(${d.id})">
      <div class="drug-info"><div class="drug-name">${d.name}</div><div class="drug-class">${d.classification}</div></div>
      <div class="drug-right"><div class="scope-dots">${dots}</div>${masteryTag(d.id)}</div>
      <svg class="chev" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
    </div>`;
  }).join('');
}

// Drug-only search on the Reference tab
function handleRefSearch(q){
  refQ=q.toLowerCase();
  document.getElementById('searchClear').style.display=q?'flex':'none';
  renderDrugList();
}

function clearSearch(){
  refQ='';
  document.getElementById('searchInput').value='';
  document.getElementById('searchClear').style.display='none';
  renderDrugList();
}

document.querySelectorAll('.chip').forEach(c=>{
  c.addEventListener('click',()=>{
    document.querySelectorAll('.chip').forEach(x=>x.classList.remove('on'));
    c.classList.add('on');refScope=c.dataset.scope;haptic();renderDrugList();
  });
});

// ── PAEDIATRIC CALCULATOR ─────────────────────────────────────────────────────
// Vitals + airway reference (PHECC 2026). Keyed by age in years. 0 = neonate, 0.5 = six months.
const PAED_VITALS=[
  {age:0,    label:'Neonate', hr:'90–180', rr:'30–60', defib:'14 J',  ett:'N/A',           lma:'N/A', igel:'N/A', lti:'N/A'},
  {age:0.5,  label:'6 months',hr:'80–160', rr:'30–60', defib:'24 J',  ett:'N/A',           lma:'N/A', igel:'N/A', lti:'N/A'},
  {age:1,    label:'1 year',  hr:'75–130', rr:'20–30', defib:'40 J',  ett:'N/A',           lma:'N/A', igel:'N/A', lti:'N/A'},
  {age:2,    label:'2 years', hr:'75–130', rr:'20–30', defib:'48 J',  ett:'4.0mm (13cm)',  lma:'2',   igel:'1.5', lti:'2'},
  {age:3,    label:'3 years', hr:'75–130', rr:'20–30', defib:'56 J',  ett:'4.0mm (13.5cm)',lma:'2',   igel:'2',   lti:'2'},
  {age:4,    label:'4 years', hr:'70–110', rr:'16–24', defib:'64 J',  ett:'4.5mm (14cm)',  lma:'2',   igel:'2',   lti:'2'},
  {age:5,    label:'5 years', hr:'70–110', rr:'16–24', defib:'72 J',  ett:'4.5mm (14.5cm)',lma:'2',   igel:'2',   lti:'2'},
  {age:6,    label:'6 years', hr:'70–110', rr:'16–24', defib:'100 J', ett:'5.0mm (15cm)',  lma:'2.5', igel:'2',   lti:'2'},
  {age:7,    label:'7 years', hr:'60–90',  rr:'14–20', defib:'112 J', ett:'5.0mm (15.5cm)',lma:'2.5', igel:'2',   lti:'2.5'},
  {age:8,    label:'8 years', hr:'60–90',  rr:'14–20', defib:'124 J', ett:'5.5mm (16cm)',  lma:'2.5', igel:'2',   lti:'2.5'},
  {age:9,    label:'9 years', hr:'60–90',  rr:'14–20', defib:'136 J', ett:'5.5mm (16.5cm)',lma:'2.5', igel:'2.5', lti:'2.5'},
  {age:10,   label:'10 years',hr:'60–90',  rr:'14–20', defib:'148 J', ett:'6.0mm (17cm)',  lma:'2.5', igel:'2.5', lti:'3'},
  {age:11,   label:'11 years',hr:'60–90',  rr:'14–20', defib:'150 J', ett:'6.0mm (17.5cm)',lma:'3',   igel:'3',   lti:'3'},
  {age:12,   label:'12 years',hr:'60–90',  rr:'14–20', defib:'150 J', ett:'6.5mm (18cm)',  lma:'3',   igel:'3',   lti:'3'},
  {age:13,   label:'13 years',hr:'60–90',  rr:'14–20', defib:'150 J', ett:'6.5mm (18.5cm)',lma:'3',   igel:'3',   lti:'3'},
  {age:14,   label:'14 years',hr:'60–90',  rr:'14–20', defib:'150 J', ett:'7.0mm (19cm)',  lma:'3',   igel:'3',   lti:'4'},
  {age:15,   label:'15 years',hr:'60–90',  rr:'14–20', defib:'150 J', ett:'7.0mm (19.5cm)',lma:'3',   igel:'3',   lti:'4'},
];

function getPaedVitals(age){
  if(age<=0)return PAED_VITALS[0];
  if(age<=0.5)return PAED_VITALS[1];
  const yr=Math.min(Math.round(age),15);
  return PAED_VITALS.find(v=>v.age===yr)||PAED_VITALS[PAED_VITALS.length-1];
}

const PAED_DRUGS={
  EMT:[
    {lbl:'Adrenaline 1:1,000 (anaphylaxis IM)',drugName:'Adrenaline 1:1,000',fn:(wt,age)=>{if(age<0.5)return`${(wt*0.01).toFixed(2)} mL IM`;if(age<6)return'0.15 mL IM (150mcg)';if(age<12)return'0.3 mL IM (300mcg)';return'0.5 mL IM (500mcg)';}},
    {lbl:'Glucose Gel (buccal)',drugName:'Glucose Gel',fn:(wt,age)=>age<=8?'5–10g buccal':'10–20g buccal'},
    {lbl:'Glucagon IM',drugName:'Glucagon',fn:(wt)=>wt<25?'500mcg IM':'1mg IM'},
    {lbl:'Ibuprofen PO (10mg/kg)',drugName:'Ibuprofen',fn:(wt)=>`${Math.min(wt*10,400).toFixed(0)} mg PO`},
    {lbl:'Methoxyflurane INH',drugName:'Methoxyflurane',fn:()=>'3mL INH (≥5yr only)'},
    {lbl:'Naloxone IN (20mcg/kg)',drugName:'Naloxone',fn:(wt)=>`${Math.min(wt*0.02*1000,800).toFixed(0)} mcg IN`},
    {lbl:'Oxygen',drugName:'Oxygen',fn:()=>'100% until SpO₂ reliable, then 96–98%'},
    {lbl:'Paracetamol PO (15mg/kg)',drugName:'Paracetamol',fn:(wt)=>`${(wt*15).toFixed(0)} mg PO`},
    {lbl:'Salbutamol NEB',drugName:'Salbutamol',fn:(wt,age)=>age<5?'2.5mg NEB':'5mg NEB'},
  ],
  P:[
    {lbl:'Adrenaline 1:1,000 (anaphylaxis IM)',drugName:'Adrenaline 1:1,000',fn:(wt,age)=>{if(age<0.5)return`${(wt*0.01).toFixed(2)} mL IM`;if(age<6)return'0.15 mL IM (150mcg)';if(age<12)return'0.3 mL IM (300mcg)';return'0.5 mL IM (500mcg)';}},
    {lbl:'Chlorphenamine IM',drugName:'Chlorphenamine',fn:(wt,age)=>{if(age<0.5)return`${(wt*0.25).toFixed(2)} mg IM`;if(age<6)return'2.5mg IM';if(age<12)return'5mg IM';return'10mg IM';}},
    {lbl:'Dexamethasone PO (croup)',drugName:'Dexamethasone',fn:(wt)=>`${Math.min(wt*0.3,12).toFixed(1)} mg PO`},
    {lbl:'Glucose 10% IV (5mL/kg)',drugName:'Glucose 10% Solution',fn:(wt)=>`${(wt*5).toFixed(0)} mL IV`},
    {lbl:'Hydrocortisone IM (anaphylaxis)',drugName:'Hydrocortisone',fn:(wt,age)=>{if(age<0.5)return'25mg IM';if(age<6)return'50mg IM';if(age<12)return'100mg IM';return'200mg IM';}},
    {lbl:'Midazolam buccal (seizure)',drugName:'Midazolam',fn:(wt,age)=>{if(age<0.25)return`${(wt*0.3).toFixed(2)}mg`;if(age<1)return'2.5mg buccal';if(age<5)return'5mg buccal';if(age<10)return'7.5mg buccal';return'10mg buccal';}},
    {lbl:'Naloxone IN (20mcg/kg)',drugName:'Naloxone',fn:(wt)=>`${Math.min(wt*0.02*1000,800).toFixed(0)} mcg IN`},
    {lbl:'NaCl 0.9% (anaphylaxis 20mL/kg)',drugName:'Sodium Chloride 0.9%',fn:(wt)=>`${(wt*20).toFixed(0)} mL IV`},
    {lbl:'Ondansetron IM (100mcg/kg)',drugName:'Ondansetron',fn:(wt)=>`${Math.min(wt*0.1,4).toFixed(2)} mg IM`},
    {lbl:'Salbutamol NEB',drugName:'Salbutamol',fn:(wt,age)=>age<5?'2.5mg NEB':'5mg NEB'},
  ],
  AP:[
    {lbl:'Adrenaline 1:10,000 (cardiac arrest)',drugName:'Adrenaline 1:10,000',fn:(wt)=>`${(wt*0.1).toFixed(1)} mL IV/IO (10mcg/kg)`},
    {lbl:'Adrenaline IV/IO (sepsis 0.1mcg/kg)',drugName:'Adrenaline 1:1,000',fn:(wt)=>`${(wt*0.1).toFixed(1)} mcg IV/IO`},
    {lbl:'Adrenaline 1:1,000 (anaphylaxis IM)',drugName:'Adrenaline 1:1,000',fn:(wt,age)=>{if(age<0.5)return`${(wt*0.01).toFixed(2)} mL IM`;if(age<6)return'0.15 mL IM (150mcg)';if(age<12)return'0.3 mL IM (300mcg)';return'0.5 mL IM (500mcg)';}},
    {lbl:'Amiodarone VF/pVT (5mg/kg)',drugName:'Amiodarone',fn:(wt)=>`${(wt*5).toFixed(0)} mg IV/IO`},
    {lbl:'Ceftriaxone IV (50mg/kg)',drugName:'Ceftriaxone',fn:(wt)=>`${Math.min(wt*50,2000).toFixed(0)} mg IV`},
    {lbl:'Fentanyl IN (1.5mcg/kg)',drugName:'Fentanyl',fn:(wt)=>`${Math.min(wt*1.5,100).toFixed(0)} mcg IN`},
    {lbl:'Glucose 10% IV (5mL/kg)',drugName:'Glucose 10% Solution',fn:(wt)=>`${(wt*5).toFixed(0)} mL IV`},
    {lbl:'Ketamine IV pain (0.1–0.3mg/kg)',drugName:'Ketamine',fn:(wt)=>`${(wt*0.1).toFixed(1)}–${(wt*0.3).toFixed(1)} mg IV`},
    {lbl:'Lidocaine IO pain (500mcg/kg)',drugName:'Lidocaine',fn:(wt)=>`${Math.min(wt*0.5,40).toFixed(1)} mg IO`},
    {lbl:'Midazolam buccal (seizure)',drugName:'Midazolam',fn:(wt,age)=>{if(age<0.25)return`${(wt*0.3).toFixed(2)}mg`;if(age<1)return'2.5mg buccal';if(age<5)return'5mg buccal';if(age<10)return'7.5mg buccal';return'10mg buccal';}},
    {lbl:'Morphine IV (50mcg/kg, max 2mg)',drugName:'Morphine Sulphate',fn:(wt)=>`${Math.min(wt*0.05,2).toFixed(2)} mg IV`},
    {lbl:'Naloxone IN (20mcg/kg)',drugName:'Naloxone',fn:(wt)=>`${Math.min(wt*0.02*1000,800).toFixed(0)} mcg IN`},
    {lbl:'Diazepam PR (seizure)',drugName:'Diazepam Rectal',fn:(wt,age)=>{if(age<0.5)return'Contraindicated';if(age<2)return'5mg PR';if(age<12)return'5–10mg PR';return'10mg PR';}},
    {lbl:'Diazepam IV/IO (seizure 0.1mg/kg)',drugName:'Diazepam Injection',fn:(wt)=>`${Math.min(wt*0.1,5).toFixed(2)} mg IV/IO`},
    {lbl:'NaCl 0.9% (anaphylaxis 20mL/kg)',drugName:'Sodium Chloride 0.9%',fn:(wt)=>`${(wt*20).toFixed(0)} mL IV`},
  ]
};

function openPaedDrugByName(name){
  if(!name)return;
  const drug=MEDS.find(m=>m.name===name);
  if(drug){openDet(drug.id);haptic();}
}

function renderPaed(){
  return`<div class="paed-card">
    <div class="paed-title">PHECC Paediatric Weight Estimation</div>
    <div class="paed-scope-btns">
      <button class="paed-scope-btn on-emt" onclick="setPaedScope('EMT',this)">EMT</button>
      <button class="paed-scope-btn" onclick="setPaedScope('P',this)">Paramedic</button>
      <button class="paed-scope-btn" onclick="setPaedScope('AP',this)">Adv. Paramedic</button>
    </div>
    <div class="paed-input-row">
      <input type="number" class="paed-input" id="paedAge" placeholder="0" min="0" max="15" oninput="calcPaed(this.value)"/>
      <span class="paed-unit">years old</span>
    </div>
    <div id="paedResult" style="display:none" class="paed-result">
      <div class="paed-result-lbl">Estimated Weight</div>
      <div class="paed-weight" id="paedWeight">— kg</div>
      <div id="paedVitals"></div>
      <div class="paed-drugs-lbl">Common Drug Doses</div>
      <div class="paed-formula-grid" id="paedDrugs"></div>
    </div>
  </div>
  <div class="paed-card" style="margin-top:0">
    <div class="paed-title">PHECC Weight Formula Reference</div>
    <table class="paed-table">
      <tr><th>Age Group</th><th>Formula</th></tr>
      <tr><td>Neonate</td><td>3.5 kg</td></tr>
      <tr><td>Six months</td><td>6 kg</td></tr>
      <tr><td>1–5 years</td><td>(age × 2) + 8 kg</td></tr>
      <tr><td>&gt;5 years</td><td>(age × 3) + 7 kg</td></tr>
    </table>
  </div>`;
}

function setPaedScope(scope,el){
  paedScope=scope;
  document.querySelectorAll('.paed-scope-btn').forEach(b=>{b.className='paed-scope-btn';});
  el.classList.add(`on-${scope.toLowerCase()}`);
  haptic();
  const age=parseFloat(document.getElementById('paedAge')?.value);
  if(!isNaN(age))calcPaed(age);
}

function calcPaed(age){
  age=parseFloat(age);
  if(isNaN(age)||age<0){document.getElementById('paedResult').style.display='none';return;}
  if(age>15){age=15;const inp=document.getElementById('paedAge');if(inp)inp.value=15;}
  let wt;
  if(age===0)wt=3.5;
  else if(age<=0.5)wt=6;
  else if(age<=5)wt=Math.round((age*2+8)*10)/10;
  else wt=Math.round((age*3+7)*10)/10;
  document.getElementById('paedResult').style.display='block';
  document.getElementById('paedWeight').textContent=wt+' kg';

  // Apply scope colour to the result panel
  const panel=document.getElementById('paedResult');
  panel.className='paed-result paed-result-'+paedScope.toLowerCase();

  // Vitals + airway reference for this age
  const v=getPaedVitals(age);
  const vitalsEl=document.getElementById('paedVitals');
  if(vitalsEl){
    vitalsEl.innerHTML=
      '<div class="paed-vital-row">'
        +'<div class="paed-vital"><span class="paed-vital-lbl">HR</span><span class="paed-vital-val">'+v.hr+'</span></div>'
        +'<div class="paed-vital"><span class="paed-vital-lbl">RR</span><span class="paed-vital-val">'+v.rr+'</span></div>'
        +'<div class="paed-vital"><span class="paed-vital-lbl">Defib</span><span class="paed-vital-val">'+v.defib+'</span></div>'
      +'</div>'
      +'<div class="paed-airway-row">'
        +'<div class="paed-airway"><span class="paed-airway-lbl">ETT</span><span class="paed-airway-val">'+v.ett+'</span></div>'
        +'<div class="paed-airway"><span class="paed-airway-lbl">LMA</span><span class="paed-airway-val">'+v.lma+'</span></div>'
        +'<div class="paed-airway"><span class="paed-airway-lbl">i-gel</span><span class="paed-airway-val">'+v.igel+'</span></div>'
        +'<div class="paed-airway"><span class="paed-airway-lbl">LTI</span><span class="paed-airway-val">'+v.lti+'</span></div>'
      +'</div>';
  }

  const drugs=PAED_DRUGS[paedScope]||PAED_DRUGS.EMT;
  document.getElementById('paedDrugs').innerHTML=drugs.map(d=>`
    <div class="paed-f-item" onclick="openPaedDrugByName('${d.drugName||''}')">
      <div class="paed-f-lbl">${d.lbl}</div>
      <div class="paed-f-val">${d.fn(wt,age)}</div>
      <div class="paed-f-tap">Tap to open →</div>
    </div>`).join('');
}

// ── PCR CODES ─────────────────────────────────────────────────────────────────
function renderPCR(){
  const grouped={};
  HOSPITALS.forEach(h=>{if(!grouped[h.county])grouped[h.county]=[];grouped[h.county].push(h);});
  return Object.entries(grouped).map(([county,hosps])=>`
    <div class="hosp-county-header">${county}</div>
    ${hosps.map(h=>{
      const mainDial=h.main.split('/')[0].replace(/[^0-9]/g,'');
      const edDial=h.ed!=='n/a'?h.ed.split('/')[0].replace(/[^0-9]/g,''):'';
      return`<div class="hosp-card" id="hosp-${h.pcr}">
        <div class="hosp-name">${h.name}</div>
        <div><span class="hosp-code">${h.pcr}</span></div>
        <div class="hosp-nums">
          <div class="hosp-num"><div class="hosp-num-lbl">Main Line</div><div class="hosp-num-val" onclick="callNumber('${mainDial}')">${h.main}</div></div>
          <div class="hosp-num"><div class="hosp-num-lbl">ED / Direct</div><div class="hosp-num-val ${h.ed==='n/a'?'na':''}" ${h.ed!=='n/a'?`onclick="callNumber('${edDial}')"`:''}>${h.ed}</div></div>
        </div>
      </div>`;
    }).join('')}`).join('');
}

// ── PCI LINE ──────────────────────────────────────────────────────────────────
function renderPCI(){
  return`<div class="pci-card">
    <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#93C5FD">Primary PCI Line</div>
    <div class="pci-number" onclick="callNumber('${PCI_NUMBER.replace(/\s/g,'')}')">${PCI_NUMBER}</div>
    <div style="font-size:11px;color:rgba(255,255,255,.5);margin-bottom:10px">Tap number to dial, then select:</div>
    ${PCI_LABS.map(l=>`<div class="pci-row"><div class="pci-num">${l.n}</div><div class="pci-hospital">${l.hospital}</div></div>`).join('')}
  </div>`;
}

function callNumber(num){
  const clean=num.replace(/[^0-9+]/g,'');
  window.location.href=`tel:${clean}`;
  haptic();
}

renderDrugList();
