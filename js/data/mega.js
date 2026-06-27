// ─── MEGA.JS (DATA) — Mega OSCE combined-presentation cases ──────────────────────
// A Mega OSCE case is ONE patient with TWO concurrent presentations. Unlike the normal
// generator (which builds a patient from a single presentation template), mega cases are
// CURATED: each is hand-authored and clinically reviewed, so two presentations never
// combine into a contradictory patient. Keith signed off all 12 on 2026-06-26.
//
// Each case carries:
//   id, title            — identifier + short label (e.g. "Sepsis + Asthma")
//   cohort               — 'adult' | 'paed' (which pool; age also gates this)
//   age:[min,max]        — one shared range valid for BOTH presentations
//   sex                  — 'any' | 'male' | 'female'
//   conscious            — true | false (one state both presentations agree on)
//   guardian             — true for paeds (a parent/guardian is present)
//   dispatch             — OPTIONAL authored dispatch (overrides the random one). {location}
//                          is substituted with the chosen location. Omit = normal random dispatch.
//   locationPool         — OPTIONAL array of scene types to pick from (overrides random pool),
//                          for scene-dependent cases (the crash, the exposure). Omit = random.
//   presentation         — the "On Arrival" merged observed picture (observed-only, no triggers)
//   presentationU3       — OPTIONAL pre-verbal wording used when age < 3 (paeds)
//   sample               — { symptoms, allergies, medications, pmh, lastMeal, events }
//   opqrst               — OPTIONAL { onset, provocation, quality, radiation, severity, time }
//                          (only for the pain-led / single-complaint cases; omit if not pain-led)
//   vitalsInitial        — absolute vital ranges (the APPROVED numbers, lightly jittered)
//   vitalsReassess       — the ~5-min-later set. EITHER a single object, OR { outcomes:[...] }
//                          when the case has more than one possible progression (M5), in which
//                          case the engine picks one per generation.
//   reassessNote         — one line shown with the reassess set summarising what changed
//   reveal               — { threads:[ {title, blocks:[...] }, ... ], teaching } — two threads,
//                          each a mini-reveal (diagnosis/pathway/interventions blocks reused).
//   drugs                — combined drug list for both problems (same shape as presentation drugs)
//
// Vital range shape: [lo,hi] absolute. The engine rolls within the range. Temp/BGL are floats.
// capRefill is a display string (e.g. "2-3 s"). spo2Note carries the COPD-target caveat etc.

const MEGA_CASES = [

  // ─────────────────────────── ADULT ───────────────────────────

  {
    id:'M1', title:'Sepsis + Asthma', cohort:'adult',
    threadSources: ['asthma','sepsis'],
    age:[16,75], sex:'any', conscious:true,
    dispatch:'You are called to {location} for a PATIENT who is feverish and struggling to breathe.',
    presentation:'Hot and flushed, breathing fast with an audible wheeze and increased work of breathing, looks unwell and tired, sweaty.',
    sample:{
      symptoms:'Feverish and increasingly breathless with a wheeze.',
      allergies:'No known drug allergies.',
      medications:'Ventolin, sometimes a brown preventer inhaler.',
      pmh:'Asthma.',
      lastMeal:'Eaten little today, feverish.',
      events:'Became feverish and progressively wheezy and breathless over the last day, not responding to the inhaler.',
    },
    opqrst:{ onset:'Over a day or two, worse today.', provocation:'Reliever inhaler giving little relief.', quality:'Wheeze and chest tightness.', radiation:'None.', severity:'6 out of 10 breathlessness.', time:'Worsening over the day.' },
    vitalsInitial:{ hr:[114,120], rr:[26,30], spo2:[91,93], sys:[104,112], dia:[60,68], temp:[38.7,39.1], bgl:[7.0,8.0] },
    vitalsReassess:{ hr:[122,130], rr:[30,34], spo2:[86,89], sys:[92,98], dia:[52,58], temp:[39.0,39.3], bgl:[7.3,8.1] },
    reassessNote:'SpO2 falling, RR climbing, BP sliding, now mottling: the slide toward septic shock.',
    reveal:{
      threads:[
        { title:'Asthma', blocks:[
          { type:'lead', body:'Grade the asthma severity and treat the bronchospasm.' },
          { type:'step', body:'High-flow oxygen, target SpO2 94 to 98%.' },
          { type:'step', body:'Salbutamol nebuliser, add ipratropium for moderate to severe.' },
          { type:'step', body:'Steroid (hydrocortisone IV (AP), or oral prednisolone).' },
        ]},
        { title:'Sepsis', blocks:[
          { type:'lead', body:'Recognise the septic source under the wheeze; this is not just an asthma attack.' },
          { type:'step', body:'Oxygen, full set of vitals, identify the source.' },
          { type:'branch', label:'Inadequate perfusion', body:'Fluids (AP). Antibiotic (AP).' },
          { type:'step', body:'Paracetamol if febrile. Pre-alert the receiving hospital.' },
        ]},
      ],
      teaching:'Recognise the sepsis underneath the wheeze, and reassess: this patient is sliding toward septic shock.',
    },
    drugs:[
      { name:'Salbutamol', paramedic:'5mg nebulised, repeat as needed.' },
      { name:'Ipratropium bromide', paramedic:'500mcg nebulised for moderate to severe.' },
      { name:'Hydrocortisone', ap:'100mg IV/IM. Advanced Paramedic scope.' },
      { name:'Sodium Chloride 0.9% IV/IO', ap:'250mL boluses titrated to perfusion. Advanced Paramedic scope.' },
      { name:'Paracetamol', paramedic:'1g IV/PO if febrile.' },
      { name:'Oxygen', paramedic:'High flow, titrate to SpO2 94 to 98%.' },
    ],
  },

  {
    id:'M3', title:'Stroke vs Hypoglycaemia', cohort:'adult',
    threadSources: [null,'hypoglycaemia'],
    age:[45,90], sex:'any', conscious:true,
    presentation:'Facial droop and one-sided weakness, slurred or confused speech, sweaty and drowsy, pale.',
    sample:{
      symptoms:'One-sided weakness and slurred speech, drowsy.',
      allergies:'No known drug allergies.',
      medications:'Insulin or gliclazide; often a blood-pressure tablet.',
      pmh:'Type 2 diabetes, hypertension.',
      lastMeal:'Missed a meal, poor intake.',
      events:'Found drowsy and one-sided, slurred, after a missed meal.',
    },
    vitalsInitial:{ hr:[90,100], rr:[16,20], spo2:[96,98], sys:[150,162], dia:[88,96], temp:[36.2,36.6], bgl:[2.2,2.6] },
    vitalsReassess:{ hr:[80,88], rr:[14,17], spo2:[97,99], sys:[136,148], dia:[82,90], temp:[36.3,36.7], bgl:[5.2,5.9] },
    reassessNote:'After glucose: the focal signs resolve and they are more alert. It was never a stroke. (Untreated: BGL falls further, more drowsy.)',
    reveal:{
      threads:[
        { title:'Check the glucose first', blocks:[
          { type:'lead', body:'Hypoglycaemia is the classic stroke mimic. Check a BGL in every suspected stroke before committing to the pathway.' },
        ]},
        { title:'Hypoglycaemia', blocks:[
          { type:'branch', label:'Able to swallow safely', body:'Oral glucose (gel or fast-acting carbohydrate), then a complex carbohydrate.' },
          { type:'branch', label:'Unsafe swallow / unresponsive', body:'Glucagon 1mg IM, or glucose 10% IV (AP).' },
          { type:'step', body:'Recheck the BGL and reassess the neurology after treating.' },
        ]},
      ],
      teaching:'Always check and treat the glucose before calling a stroke; reassessment after treating proves the mimic.',
    },
    drugs:[
      { name:'Glucose gel (oral)', paramedic:'15 to 20g if a safe swallow.' },
      { name:'Glucagon', paramedic:'1mg IM if no IV access or unsafe swallow.' },
      { name:'Glucose 10% IV', ap:'Titrated to response. Advanced Paramedic scope.' },
    ],
  },

  {
    id:'M4', title:'Anaphylaxis + Asthma', cohort:'adult',
    threadSources: ['anaphylaxis','asthma'],
    age:[16,75], sex:'any', conscious:true,
    presentation:'Widespread itchy rash with swelling of the lips and face, marked wheeze and work of breathing, anxious, flushed.',
    sample:{
      symptoms:'Itchy rash, facial swelling and a marked wheeze.',
      allergies:'A known allergy.',
      medications:'Ventolin; may carry an adrenaline auto-injector.',
      pmh:'Asthma, allergy.',
      lastMeal:'Ate out shortly before.',
      events:'Became swollen, itchy and wheezy within minutes of eating, worsening despite the inhaler.',
    },
    opqrst:{ onset:'Over minutes.', provocation:'Worse despite the reliever inhaler.', quality:'Wheeze and throat tightness.', radiation:'None.', severity:'7 out of 10 breathlessness.', time:'Rapidly worsening.' },
    vitalsInitial:{ hr:[108,116], rr:[24,28], spo2:[92,94], sys:[100,108], dia:[58,66], temp:[36.6,37.0], bgl:[5.6,6.4] },
    vitalsReassess:{ hr:[120,128], rr:[28,32], spo2:[86,89], sys:[88,96], dia:[50,58], temp:[36.6,37.0], bgl:[5.7,6.5] },
    reassessNote:'Swelling and wheeze worse, SpO2 down, BP falling, distressed: anaphylaxis is driving this.',
    reveal:{
      threads:[
        { title:'Anaphylaxis', blocks:[
          { type:'lead', body:'The allergic features make this anaphylaxis: adrenaline is the priority drug, not salbutamol.' },
          { type:'step', body:'Adrenaline (1:1,000) 500mcg IM, repeat after 5 minutes if no improvement.' },
          { type:'step', body:'High-flow oxygen. Lie flat with legs raised if hypotensive.' },
          { type:'step', body:'Chlorphenamine and hydrocortisone (AP). Fluids (AP) if hypotensive.' },
        ]},
        { title:'Bronchospasm', blocks:[
          { type:'step', body:'Salbutamol nebuliser for the wheeze, after adrenaline.' },
        ]},
      ],
      teaching:'Do not treat as pure asthma; the allergic features mean adrenaline IM comes first.',
    },
    drugs:[
      { name:'Adrenaline (1:1,000)', paramedic:'500mcg IM, repeat after 5 minutes if needed.' },
      { name:'Salbutamol', paramedic:'5mg nebulised for the bronchospasm.' },
      { name:'Chlorphenamine', ap:'10mg IV/IM. Advanced Paramedic scope.' },
      { name:'Hydrocortisone', ap:'100mg IV/IM. Advanced Paramedic scope.' },
      { name:'Sodium Chloride 0.9% IV/IO', ap:'500mL bolus if hypotensive. Advanced Paramedic scope.' },
    ],
  },

  {
    id:'M5', title:'Seizure + Head Injury', cohort:'adult',
    threadSources: ['seizure','headinjury'],
    age:[16,85], sex:'any', conscious:true,
    dispatch:'You are called to {location} for a PATIENT who had a seizure and struck their head.',
    presentation:'Drowsy and confused after the event, slow to orientate, with a visible scalp wound or bruising to the head, slurred and groggy.',
    sample:{
      symptoms:'Post-ictal and confused with a head injury.',
      allergies:'No known drug allergies.',
      medications:'An anti-epileptic if a known epileptic, or nil.',
      pmh:'Epilepsy, or a first event.',
      lastMeal:'Variable.',
      events:'Had a witnessed seizure and struck their head on the way down.',
    },
    vitalsInitial:{ hr:[88,96], rr:[14,18], spo2:[96,98], sys:[132,144], dia:[80,88], temp:[36.4,36.8], bgl:[5.2,5.8] },
    // Two possible progressions; the engine picks one per generation so the student cannot assume.
    vitalsReassess:{ outcomes:[
      { label:'settling',
        v:{ hr:[80,88], rr:[13,16], spo2:[97,99], sys:[126,134], dia:[78,84], temp:[36.4,36.8], bgl:[5.2,5.8] },
        note:'Settling: GCS improving, this was an ordinary post-ictal recovery.' },
      { label:'deteriorating',
        v:{ hr:[58,66], rr:[10,12], spo2:[95,97], sys:[162,176], dia:[92,100], temp:[36.4,36.8], bgl:[5.2,5.8] },
        note:'GCS dropping, BP up and HR down (Cushing\u2019s reflex): the bleed is declaring. Time-critical.' },
    ]},
    reveal:{
      threads:[
        { title:'Seizure care', blocks:[
          { type:'step', body:'Protect the airway, recovery position, oxygen.' },
          { type:'step', body:'Check the blood glucose. Treat a further seizure with a benzodiazepine.' },
        ]},
        { title:'Head injury', blocks:[
          { type:'lead', body:'A falling GCS after a seizure is not just post-ictal: reassess for an intracranial bleed.' },
          { type:'step', body:'Consider C-spine precautions for the mechanism.' },
          { type:'branch', label:'Rising BP with a falling HR and GCS (Cushing\u2019s reflex)', body:'Treat as a time-critical intracranial bleed: minimise scene time, pre-alert, transport to a neuro-capable centre.' },
        ]},
      ],
      teaching:'Distinguish ordinary post-ictal recovery from a deteriorating head injury; the reassessment is what catches the bleed.',
    },
    drugs:[
      { name:'Midazolam (if a further seizure)', paramedic:'10mg buccal, 5mg IN, or 5mg IM.', ap:'2.5mg IV/IO.' },
      { name:'Oxygen', paramedic:'High flow; support the airway.' },
    ],
  },

  {
    id:'M6', title:'Sepsis + Hypoglycaemia', cohort:'adult',
    threadSources: ['hypoglycaemia','sepsis'],
    age:[16,90], sex:'any', conscious:true,
    presentation:'Hot and flushed, sweaty and drowsy, looks unwell, poor recent intake, pale and clammy.',
    sample:{
      symptoms:'Feverish and increasingly drowsy.',
      allergies:'No known drug allergies.',
      medications:'Insulin or gliclazide; often other regular meds.',
      pmh:'Diabetes; a source of infection.',
      lastMeal:'Not eating or drinking well while unwell.',
      events:'Became feverish and increasingly drowsy over the day, eating little.',
    },
    vitalsInitial:{ hr:[112,120], rr:[22,26], spo2:[93,95], sys:[96,104], dia:[56,64], temp:[38.5,38.9], bgl:[2.8,3.2] },
    vitalsReassess:{ hr:[108,116], rr:[22,26], spo2:[93,95], sys:[94,100], dia:[54,60], temp:[38.6,39.0], bgl:[5.2,5.7] },
    reassessNote:'After glucose: more alert, but still febrile, tachycardic and hypotensive. The sepsis remains.',
    reveal:{
      threads:[
        { title:'Hypoglycaemia', blocks:[
          { type:'step', body:'Glucose (oral if a safe swallow) or glucagon 1mg IM; glucose 10% IV (AP) if needed.' },
          { type:'step', body:'Recheck the BGL.' },
        ]},
        { title:'Sepsis', blocks:[
          { type:'lead', body:'Fixing the glucose does not resolve the sepsis: there are two correctable problems.' },
          { type:'step', body:'Oxygen, identify the source.' },
          { type:'branch', label:'Inadequate perfusion', body:'Fluids (AP). Antibiotic (AP).' },
          { type:'step', body:'Paracetamol if febrile. Pre-alert.' },
        ]},
      ],
      teaching:'Treat the glucose AND recognise the sepsis; one does not explain away the other.',
    },
    drugs:[
      { name:'Glucose gel (oral)', paramedic:'15 to 20g if a safe swallow.' },
      { name:'Glucagon', paramedic:'1mg IM.' },
      { name:'Glucose 10% IV', ap:'Titrated to response. Advanced Paramedic scope.' },
      { name:'Sodium Chloride 0.9% IV/IO', ap:'250mL boluses titrated to perfusion. Advanced Paramedic scope.' },
      { name:'Paracetamol', paramedic:'1g IV/PO if febrile.' },
    ],
  },

  {
    id:'M7', title:'COPD + Acute Coronary Syndrome', cohort:'adult',
    threadSources: ['copd','acs'],
    age:[45,90], sex:'any', conscious:true,
    presentation:'Breathless with a wheezy, quiet chest, central chest tightness, sweaty and grey, distressed, pursed-lip breathing.',
    sample:{
      symptoms:'Breathless with central chest tightness.',
      allergies:'No known drug allergies.',
      medications:'COPD inhalers, often a GTN spray, cardiac meds.',
      pmh:'COPD, ischaemic heart disease.',
      lastMeal:'Variable.',
      events:'Became breathless and developed central chest tightness at rest.',
    },
    opqrst:{ onset:'At rest.', provocation:'Nothing relieves it.', quality:'Heavy, tight, central.', radiation:'To the arm and jaw.', severity:'7 out of 10.', time:'Constant.' },
    spo2Note:'COPD target 88 to 92%.',
    vitalsInitial:{ hr:[100,108], rr:[22,26], spo2:[88,90], sys:[144,152], dia:[84,92], temp:[36.5,36.9], bgl:[6.0,7.0] },
    vitalsReassess:{ hr:[106,114], rr:[24,28], spo2:[86,89], sys:[132,142], dia:[80,86], temp:[36.5,36.9], bgl:[6.0,7.0] },
    reassessNote:'Chest pain more prominent, ECG changes evolving: the cardiac thread is declaring.',
    reveal:{
      threads:[
        { title:'COPD', blocks:[
          { type:'step', body:'Salbutamol and ipratropium nebulisers.' },
          { type:'step', body:'Titrate oxygen to an SpO2 target of 88 to 92%.' },
        ]},
        { title:'Acute Coronary Syndrome', blocks:[
          { type:'lead', body:'The breathlessness has a cardiac component; do not treat as a pure COPD flare.' },
          { type:'step', body:'Aspirin 300mg chewed. GTN if not hypotensive.' },
          { type:'step', body:'12-lead ECG. Time-critical transfer to PPCI or ED, pre-alert.' },
        ]},
      ],
      teaching:'Breathless COPD that is also ACS: respect the SpO2 target and do not miss the cardiac thread.',
    },
    drugs:[
      { name:'Salbutamol', paramedic:'5mg nebulised.' },
      { name:'Ipratropium bromide', paramedic:'500mcg nebulised.' },
      { name:'Aspirin', paramedic:'300mg chewed.' },
      { name:'GTN', paramedic:'400mcg SL, repeat if not hypotensive.' },
      { name:'Oxygen', paramedic:'Titrate to SpO2 88 to 92%.' },
    ],
  },

  {
    id:'M9', title:'COPD + Sepsis', cohort:'adult',
    threadSources: ['copd','sepsis'],
    age:[45,90], sex:'any', conscious:true,
    dispatch:'You are called to {location} for a PATIENT with COPD who is feverish and more breathless than usual.',
    presentation:'Hot and flushed, breathless with a wheezy or crackly chest and increased work of breathing, productive cough, looks unwell and tired.',
    sample:{
      symptoms:'Feverish with a productive cough and worsening breathlessness.',
      allergies:'No known drug allergies.',
      medications:'COPD inhalers, sometimes home oxygen or steroids.',
      pmh:'COPD.',
      lastMeal:'Eaten little, feverish.',
      events:'Became feverish with a productive cough and worsening breathlessness over a day or two.',
    },
    opqrst:{ onset:'Over a day or two with fever.', provocation:'Reliever giving little relief.', quality:'Breathlessness and chest tightness.', radiation:'None.', severity:'6 out of 10 breathlessness.', time:'Worsening.' },
    spo2Note:'COPD target 88 to 92%.',
    vitalsInitial:{ hr:[108,116], rr:[24,28], spo2:[87,89], sys:[102,110], dia:[60,68], temp:[38.6,39.0], bgl:[6.5,7.5] },
    vitalsReassess:{ hr:[116,124], rr:[28,32], spo2:[83,86], sys:[92,98], dia:[52,58], temp:[38.8,39.2], bgl:[6.6,7.6] },
    reassessNote:'SpO2 below even the COPD target, RR up, BP sliding: the sepsis is declaring.',
    reveal:{
      threads:[
        { title:'COPD', blocks:[
          { type:'step', body:'Salbutamol and ipratropium nebulisers.' },
          { type:'step', body:'Titrate oxygen to 88 to 92%, but do not under-treat genuine hypoxia.' },
        ]},
        { title:'Sepsis', blocks:[
          { type:'lead', body:'The COPD flare is also sepsis: a chest infection driving the septic picture.' },
          { type:'branch', label:'Inadequate perfusion', body:'Fluids (AP). Antibiotic (AP).' },
          { type:'step', body:'Paracetamol if febrile. Pre-alert.' },
        ]},
      ],
      teaching:'Balance the COPD oxygen target against worsening hypoxia, and recognise the sepsis behind the flare.',
    },
    drugs:[
      { name:'Salbutamol', paramedic:'5mg nebulised.' },
      { name:'Ipratropium bromide', paramedic:'500mcg nebulised.' },
      { name:'Sodium Chloride 0.9% IV/IO', ap:'250mL boluses titrated to perfusion. Advanced Paramedic scope.' },
      { name:'Paracetamol', paramedic:'1g IV/PO if febrile.' },
      { name:'Oxygen', paramedic:'Titrate to SpO2 88 to 92%.' },
    ],
  },

  // ─────────────────────────── TRAUMA ───────────────────────────

  {
    id:'MT1', title:'External Haemorrhage + Hypothermia', cohort:'adult',
    threadSources: [null,null],
    age:[16,80], sex:'any', conscious:true,
    dispatch:'You are called to {location} for a PATIENT with serious bleeding after an injury outdoors.',
    locationPool:['a roadside','a building site','a remote rural track','a riverbank','a car park'],
    presentation:'Heavy bleeding from a wound, pale, cold and shut down at the peripheries, shivering then drowsy, prolonged capillary refill, a weak fast pulse.',
    sample:{
      symptoms:'Bleeding heavily from a wound, cold and pale.',
      allergies:'No known drug allergies.',
      medications:'Possibly an anticoagulant.',
      pmh:'Variable.',
      lastMeal:'Variable.',
      events:'Sustained a significant wound outdoors and has been exposed and bleeding for some time.',
    },
    opqrst:{ onset:'At the time of injury.', provocation:'Worse with movement.', quality:'Sharp wound pain.', radiation:'Localised to the wound.', severity:'High.', time:'Since the injury.' },
    capRefill:'prolonged',
    vitalsInitial:{ hr:[114,122], rr:[20,24], spo2:[94,96], sys:[94,102], dia:[54,62], temp:[34.8,35.2], bgl:[5.6,6.4] },
    vitalsReassess:{ hr:[124,132], rr:[22,26], spo2:[91,94], sys:[84,92], dia:[48,56], temp:[34.1,34.6], bgl:[5.6,6.4] },
    reassessNote:'Bleeding ongoing, perfusion worse, temperature falling further: the trauma triad tightening.',
    reveal:{
      threads:[
        { title:'Haemorrhage control', blocks:[
          { type:'lead', body:'Catastrophic haemorrhage first: work the control ladder.' },
          { type:'step', body:'Direct pressure, then a haemostatic dressing; tourniquet for catastrophic limb bleeding.' },
          { type:'branch', label:'Shock', body:'Tranexamic acid (AP). Fluids titrated to a central pulse (AP).' },
        ]},
        { title:'Hypothermia', blocks:[
          { type:'lead', body:'Cold worsens bleeding (the trauma triad). Warming is part of haemorrhage management, not an afterthought.' },
          { type:'step', body:'Remove from the exposure, insulate, actively warm, and handle the patient gently.' },
        ]},
      ],
      teaching:'Control the bleed AND warm the patient; the reassessment shows both perfusion and temperature sliding together.',
    },
    drugs:[
      { name:'Tranexamic acid', ap:'1g IV/IO. Advanced Paramedic scope.' },
      { name:'Sodium Chloride 0.9% IV/IO', ap:'Titrated to a central pulse. Advanced Paramedic scope.' },
      { name:'Oxygen', paramedic:'High flow.' },
    ],
  },

  {
    id:'MT3', title:'Limb Injury + Hypoglycaemia', cohort:'adult',
    threadSources: ['limbinjury','hypoglycaemia'],
    age:[16,80], sex:'any', conscious:true,
    dispatch:'You are called to {location} for a single-vehicle road traffic collision; the driver is still in the car.',
    locationPool:['a roadside','a rural road','a motorway hard shoulder','a junction'],
    presentation:'A painful, deformed or swollen limb after the collision, but also sweaty, drowsy and confused, pale and clammy, behaving oddly for the mechanism.',
    sample:{
      symptoms:'An injured limb, but also sweaty and confused.',
      allergies:'No known drug allergies.',
      medications:'Insulin or gliclazide.',
      pmh:'Diabetes.',
      lastMeal:'Missed a meal before driving.',
      events:'Was driving, crashed into a wall with no obvious cause, found sweaty, confused and injured.',
    },
    opqrst:{ onset:'At the collision.', provocation:'Worse with movement of the limb.', quality:'Sharp.', radiation:'Localised to the injured limb.', severity:'High.', time:'Since the collision.' },
    vitalsInitial:{ hr:[100,108], rr:[16,20], spo2:[96,98], sys:[128,136], dia:[78,84], temp:[36.2,36.6], bgl:[2.4,2.8] },
    vitalsReassess:{ hr:[88,96], rr:[14,17], spo2:[97,99], sys:[124,132], dia:[76,82], temp:[36.2,36.6], bgl:[5.2,5.8] },
    reassessNote:'After glucose: the confusion clears and they are more cooperative; the limb injury remains. (Untreated: more confused, harder to assess.)',
    reveal:{
      threads:[
        { title:'Limb injury', blocks:[
          { type:'step', body:'Check circulation, sensation and movement distal to the injury.' },
          { type:'step', body:'Splint and immobilise; analgesia.' },
        ]},
        { title:'Hypoglycaemia (the cause of the crash)', blocks:[
          { type:'lead', body:'Check the glucose in any RTC with no obvious cause: the hypo is why they crashed, and it will recur behind the wheel.' },
          { type:'step', body:'Glucose (oral if a safe swallow) or glucagon 1mg IM; glucose 10% IV (AP) if needed. Recheck.' },
        ]},
      ],
      teaching:'Always check the glucose in an unexplained RTC; the medical cause is the real story, not just the fracture.',
    },
    drugs:[
      { name:'Glucose gel (oral)', paramedic:'15 to 20g if a safe swallow.' },
      { name:'Glucagon', paramedic:'1mg IM.' },
      { name:'Glucose 10% IV', ap:'Titrated to response. Advanced Paramedic scope.' },
      { name:'Paracetamol', paramedic:'1g IV/PO for analgesia.' },
      { name:'Morphine', ap:'Titrated IV for significant pain. Advanced Paramedic scope.' },
    ],
  },

  // ─────────────────────────── PAEDIATRIC ───────────────────────────

  {
    id:'MP1', title:'Sepsis + Seizure', cohort:'paed',
    threadSources: ['seizure','sepsisPaed'],
    age:[1,12], sex:'any', conscious:true, guardian:true,
    dispatch:'You are called to {location} for a CHILD who had a seizure and is hot and unwell.',
    presentation:'Drowsy and floppy after the event, hot and flushed, looks unwell, with cool peripheries and a prolonged capillary refill.',
    presentationU3:'Drowsy and floppy after the event, hot and flushed, not interested in the parent, with cool peripheries and a prolonged capillary refill.',
    sample:{
      symptoms:'Post-ictal and febrile, looks unwell.',
      allergies:'No known drug allergies.',
      medications:'Nil regular (per parent).',
      pmh:'Otherwise well, or a recent illness (per parent).',
      lastMeal:'Off food, feverish.',
      events:'Had a brief generalised seizure during a fever; now post-ictal. Parent present.',
    },
    capRefill:'3-4 s',
    vitalsInitial:{ hr:[146,154], rr:[32,36], spo2:[94,96], sys:[90,100], dia:[50,60], temp:[39.0,39.4], bgl:[4.5,6.0] },
    vitalsReassess:{ hr:[154,162], rr:[34,38], spo2:[91,94], sys:[84,94], dia:[46,54], temp:[39.1,39.5], bgl:[4.5,6.0] },
    reassessNote:'Perfusion worsening (capillary refill out, mottling): the septic picture is declaring behind the convulsion.',
    reveal:{
      threads:[
        { title:'Seizure', blocks:[
          { type:'step', body:'Protect the child, recovery position, oxygen. Check the blood glucose.' },
          { type:'branch', label:'If the seizure recurs or is prolonged', body:'Benzodiazepine per the paediatric bands.' },
        ]},
        { title:'Sepsis', blocks:[
          { type:'lead', body:'Do not dismiss the fit as just febrile: the serious source underneath is the threat.' },
          { type:'step', body:'Oxygen, antipyretic, reassess perfusion.' },
          { type:'branch', label:'Inadequate perfusion', body:'Fluids (AP). Antibiotic (AP).' },
          { type:'step', body:'Pre-alert the receiving hospital.' },
        ]},
      ],
      teaching:'The febrile convulsion is the visible event; reassess the perfusion for the sepsis underneath.',
    },
    drugs:[
      { name:'Midazolam (if a further seizure)',
        paed:{ paramedic:{ groups:[ { route:'Buccal', bands:[['<3 mths','0.3mg/kg (max 2.5mg)'],['3 mths\u2013<1 yr','2.5mg'],['1\u2013<5 yrs','5mg'],['5\u2013<10 yrs','7.5mg'],['\u226510 yrs','10mg']] }, { route:'IN', bands:[['','200mcg/kg']] } ] }, ap:'IV/IO: 100mcg/kg.' } },
      { name:'Paracetamol',
        paed:{ paramedic:{ route:'PR/PO', bands:[['<3 mths','consult'],['3\u2013<12 mths','120mg'],['1\u2013<5 yrs','250mg'],['5\u2013<12 yrs','500mg']] } } },
      { name:'Sodium Chloride 0.9% IV/IO',
        paed:{ ap:'20mL/kg, reassess. Advanced Paramedic scope.' } },
      { name:'Oxygen', paed:{ paramedic:'High flow if hypoxic or poorly perfused.' } },
    ],
  },

  {
    id:'MP2', title:'Asthma + Anaphylaxis', cohort:'paed',
    threadSources: ['anaphylaxis','asthma'],
    age:[3,12], sex:'any', conscious:true, guardian:true,
    presentation:'Itchy rash with lip and face swelling, marked wheeze and work of breathing, anxious and distressed, flushed.',
    sample:{
      symptoms:'Rash, facial swelling and a marked wheeze.',
      allergies:'A known allergy (per parent).',
      medications:'A salbutamol inhaler.',
      pmh:'Asthma, allergy.',
      lastMeal:'Ate shortly before.',
      events:'Became swollen, itchy and wheezy within minutes of eating. Parent present.',
    },
    opqrst:{ onset:'Over minutes.', provocation:'Worse despite the inhaler.', quality:'Wheeze and throat tightness.', radiation:'None.', severity:'Marked.', time:'Rapidly worsening.' },
    vitalsInitial:{ hr:[136,144], rr:[28,32], spo2:[91,93], sys:[92,104], dia:[52,62], temp:[36.6,37.2], bgl:[4.8,6.2] },
    vitalsReassess:{ hr:[146,154], rr:[32,36], spo2:[85,88], sys:[86,96], dia:[48,56], temp:[36.6,37.2], bgl:[4.8,6.2] },
    reassessNote:'Swelling and wheeze worse, SpO2 down, tiring: anaphylaxis is driving this.',
    reveal:{
      threads:[
        { title:'Anaphylaxis', blocks:[
          { type:'lead', body:'The allergic features make this anaphylaxis: adrenaline IM is the priority drug.' },
          { type:'step', body:'Adrenaline IM per the paediatric bands, repeat after 5 minutes if needed.' },
          { type:'step', body:'High-flow oxygen. Chlorphenamine and hydrocortisone (AP). Fluids (AP) if hypotensive.' },
        ]},
        { title:'Bronchospasm', blocks:[
          { type:'step', body:'Salbutamol nebuliser per the paediatric bands, after adrenaline.' },
        ]},
      ],
      teaching:'Do not treat the child as pure asthma; the allergic features change the priority drug to adrenaline.',
    },
    drugs:[
      { name:'Adrenaline (1:1,000) IM',
        paed:{ paramedic:{ route:'IM', bands:[['<6 yrs','150mcg'],['6\u2013<12 yrs','300mcg'],['\u226512 yrs','500mcg']] } } },
      { name:'Salbutamol',
        paed:{ paramedic:{ route:'Nebulised', bands:[['<5 yrs','2.5mg'],['\u22655 yrs','5mg']] } } },
      { name:'Chlorphenamine', paed:{ ap:'Per paediatric bands. Advanced Paramedic scope.' } },
      { name:'Hydrocortisone', paed:{ ap:'Per paediatric bands. Advanced Paramedic scope.' } },
      { name:'Sodium Chloride 0.9% IV/IO', paed:{ ap:'20mL/kg if hypotensive. Advanced Paramedic scope.' } },
    ],
  },

  {
    id:'MP3', title:'Croup + Sepsis', cohort:'paed',
    threadSources: ['stridorPaed','sepsisPaed'],
    age:[1,6], sex:'any', conscious:true, guardian:true,
    dispatch:'You are called to {location} for a CHILD with noisy breathing who is hot and unwell.',
    presentation:'A barking cough and stridor, hot and flushed, looks toxic and more unwell than simple croup, increased work of breathing, with cool peripheries and a prolonged capillary refill.',
    presentationU3:'A barking cough and stridor, hot and flushed, looks toxic and more unwell than simple croup, increased work of breathing, not interested in the parent, with cool peripheries and a prolonged capillary refill.',
    sample:{
      symptoms:'Stridor and a barking cough with a high fever, toxic-looking.',
      allergies:'No known drug allergies.',
      medications:'Nil (per parent).',
      pmh:'A recent illness (per parent).',
      lastMeal:'Off food, feverish.',
      events:'Developed a barking cough and stridor with a high fever, more unwell than usual. Parent present.',
    },
    capRefill:'prolonged',
    vitalsInitial:{ hr:[146,154], rr:[32,36], spo2:[92,94], sys:[90,100], dia:[50,60], temp:[38.8,39.2], bgl:[4.5,6.0] },
    vitalsReassess:{ hr:[154,162], rr:[34,38], spo2:[88,91], sys:[84,94], dia:[46,54], temp:[39.0,39.4], bgl:[4.5,6.0] },
    reassessNote:'More toxic, perfusion declaring (capillary refill out, mottling): this is more than croup.',
    reveal:{
      threads:[
        { title:'Croup / stridor', blocks:[
          { type:'lead', body:'Do not distress the airway: keep the child calm and in a position of comfort.' },
          { type:'branch', label:'Severe stridor / increased work of breathing', body:'Nebulised adrenaline. Dexamethasone.' },
          { type:'note', body:'Caution: a toxic, drooling, very unwell child with stridor may be epiglottitis: do not examine the throat, keep them calm, expedite.' },
        ]},
        { title:'Sepsis', blocks:[
          { type:'lead', body:'The febrile, toxic child with stridor is not simple croup: recognise the sepsis.' },
          { type:'step', body:'Oxygen as tolerated, antipyretic, reassess perfusion.' },
          { type:'branch', label:'Inadequate perfusion', body:'Fluids (AP). Antibiotic (AP).' },
          { type:'step', body:'Pre-alert.' },
        ]},
      ],
      teaching:'The febrile toxic child with stridor is not simple croup; do not distress the airway and recognise the sepsis.',
    },
    drugs:[
      { name:'Adrenaline (1:1,000) nebulised',
        paed:{ paramedic:'5mg (5mL of 1:1,000) nebulised for severe stridor.' } },
      { name:'Dexamethasone',
        paed:{ paramedic:'150mcg/kg PO.' } },
      { name:'Paracetamol',
        paed:{ paramedic:{ route:'PR/PO', bands:[['1\u2013<5 yrs','250mg'],['5\u2013<12 yrs','500mg']] } } },
      { name:'Sodium Chloride 0.9% IV/IO',
        paed:{ ap:'20mL/kg if poorly perfused. Advanced Paramedic scope.' } },
      { name:'Oxygen', paed:{ paramedic:'As tolerated; do not distress the child.' } },
    ],
  },

];

if (typeof window !== 'undefined') window.MEGA_CASES = MEGA_CASES;
