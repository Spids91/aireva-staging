// ─── SCENARIOS.JS (DATA) — OSCE Scenario Generator ───────────────────────────────
// Data for the OSCE scenario generator. Three parts:
//   1. SCEN_VITALS    — normal vital-sign ranges by age band (physiological baseline)
//   2. DEV_PCT_BANDS  — how much a "relative" vital shifts, as a % that scales with age
//   3. PRESENTATIONS  — authored clinical templates (the "fingerprint" of each condition)
//
// HOW GENERATION WORKS (engine in js/scenario.js):
//   • Pick a presentation, then a random patient (age/sex) within its constraints.
//   • RELATIVE vitals (HR, RR, BP): the presentation says e.g. "HR raised". The engine
//     takes the patient's normal ceiling and pushes it UP by a percentage. Crucially
//     the percentage SCALES WITH AGE — a neonate's HR barely moves (little headroom),
//     an adult's can ~double. The age→max-% mapping is DEV_PCT_BANDS below.
//   • ABSOLUTE vitals (SpO₂, Temp, BGL): age-independent. The presentation gives a
//     direct target range (e.g. SpO₂ 85–93%) used as-is at any age.
//   • Severity is randomised each run (engine picks a fraction of the max shift), so
//     scenarios range from moderate to severe and the numbers differ every time.
//
// ⚠️ CLINICAL REVIEW STATUS:
//   ★  = from the app's existing PHECC-verified PAED_VITALS (reference.js)
//   ⚠️ = PLACEHOLDER (general medical refs / first-draft), PENDING Keith's PHECC review.
//        ALL of: diastolic BP, the DEV_PCT_BANDS percentages, and every presentation's
//        deviation + reveal content are placeholders to be replaced with verified values.
//
// ── TODO (future enhancement) — ADD AVPU / GCS AS A CONSCIOUS-LEVEL VITAL ─────────
//   Conscious level is currently conveyed only in each variant's presentation TEXT
//   (e.g. "unresponsive to voice, cannot swallow"). For some presentations — most
//   importantly HYPOGLYCAEMIA — conscious level is the pivotal decision step (alert &
//   able to swallow → buccal glucose; unresponsive/can't swallow → IM glucagon), so it
//   deserves to be a proper structured vital (AVPU and/or GCS) shown in Vital Signs,
//   not just prose. This is a model change (new vital field + per-variant value +
//   card rendering), so it's deferred to avoid scope creep. When added: make AVPU/GCS
//   COHERE with the variant (an "unresponsive" variant must read P or U / low GCS).
//
//   ── BUILD TOGETHER WITH: PAEDIATRIC ASSESSMENT TRIANGLE (PAT) ──
//   PROBLEM this solves: the engine currently applies the same presentation text at
//   any age, so it can describe a 1-year-old as "alert, talking, following commands" —
//   clinically nonsense (pre-verbal child can't). Real paeds assessment uses the PAT
//   (Appearance / Work of Breathing / Circulation to skin) precisely BECAUSE you can't
//   take a verbal history from a small child.
//   KEITH'S DESIGN DECISIONS (agreed):
//     • Age boundary: UNDER 5 = pre-verbal-style — no "talking / following commands"
//       language; assess via PAT. Age 5–15 can show BOTH AVPU and PAT.
//     • PAT SUPPLEMENTS the existing framing (doesn't replace vitals/SAMPLE) — show a
//       PAT block for paediatric patients in addition to the normal card.
//     • Pre-verbal patients must never be described as giving a verbal history or
//       following commands; presentation language must be age-appropriate.
//   This is a model + engine + rendering change; deferred to a dedicated session
//   alongside AVPU/GCS so the whole "age-appropriate neuro / global status" model is
//   designed coherently in one go.

// ── NORMAL VITAL RANGES BY AGE BAND ──────────────────────────────────────────────
// age = upper bound (years) for the band; engine picks first band whose age >= patient age.
// Ranges are [low, high]. BP is now [sysLow, sysHigh, diaLow, diaHigh].
const SCEN_VITALS = [
  // label        age   hr(★)       rr(★)      spo2(⚠️)   bp sys+dia (⚠️)        temp(⚠️)          bgl(⚠️)
  { label:'Neonate',  age:0,   hr:[90,180], rr:[30,60], spo2:[94,99], bp:[60,85,30,55],    temp:[36.1,37.2], bgl:[4.0,7.0] },
  { label:'6 months', age:0.5, hr:[80,160], rr:[30,60], spo2:[94,99], bp:[72,104,37,56],   temp:[36.1,37.2], bgl:[4.0,7.0] },
  { label:'1 year',   age:1,   hr:[75,130], rr:[20,30], spo2:[94,99], bp:[72,104,37,56],   temp:[36.1,37.2], bgl:[4.0,7.0] },
  { label:'2 years',  age:2,   hr:[75,130], rr:[20,30], spo2:[94,99], bp:[86,106,42,63],   temp:[36.1,37.2], bgl:[4.0,7.0] },
  { label:'3 years',  age:3,   hr:[75,130], rr:[20,30], spo2:[94,99], bp:[89,112,46,72],   temp:[36.1,37.2], bgl:[4.0,7.0] },
  { label:'4 years',  age:4,   hr:[70,110], rr:[16,24], spo2:[94,99], bp:[89,112,46,72],   temp:[36.1,37.2], bgl:[4.0,7.0] },
  { label:'5 years',  age:5,   hr:[70,110], rr:[16,24], spo2:[94,99], bp:[89,112,46,72],   temp:[36.1,37.2], bgl:[4.0,7.0] },
  { label:'6 years',  age:6,   hr:[70,110], rr:[16,24], spo2:[94,99], bp:[97,115,57,76],   temp:[36.1,37.2], bgl:[4.0,7.0] },
  { label:'7 years',  age:7,   hr:[60,90],  rr:[14,20], spo2:[94,99], bp:[97,115,57,76],   temp:[36.1,37.2], bgl:[4.0,7.0] },
  { label:'8 years',  age:8,   hr:[60,90],  rr:[14,20], spo2:[94,99], bp:[97,115,57,76],   temp:[36.1,37.2], bgl:[4.0,7.0] },
  { label:'9 years',  age:9,   hr:[60,90],  rr:[14,20], spo2:[94,99], bp:[97,120,57,80],   temp:[36.1,37.2], bgl:[4.0,7.0] },
  { label:'10 years', age:10,  hr:[60,90],  rr:[14,20], spo2:[94,99], bp:[102,120,61,80],  temp:[36.1,37.2], bgl:[4.0,7.0] },
  { label:'11 years', age:11,  hr:[60,90],  rr:[14,20], spo2:[94,99], bp:[102,120,61,80],  temp:[36.1,37.2], bgl:[4.0,7.0] },
  { label:'12 years', age:12,  hr:[60,90],  rr:[14,20], spo2:[94,99], bp:[110,131,64,83],  temp:[36.1,37.2], bgl:[4.0,7.0] },
  { label:'13 years', age:13,  hr:[60,90],  rr:[14,20], spo2:[94,99], bp:[110,131,64,83],  temp:[36.1,37.2], bgl:[4.0,7.0] },
  { label:'14 years', age:14,  hr:[60,90],  rr:[14,20], spo2:[94,99], bp:[110,131,64,83],  temp:[36.1,37.2], bgl:[4.0,7.0] },
  { label:'15 years', age:15,  hr:[60,90],  rr:[14,20], spo2:[94,99], bp:[110,131,64,83],  temp:[36.1,37.2], bgl:[4.0,7.0] },
  { label:'Adult',    age:120, hr:[60,100], rr:[12,20], spo2:[94,99], bp:[100,130,60,85],  temp:[36.1,37.2], bgl:[4.0,7.0] },
];

// ── AGE-SCALED DEVIATION PERCENTAGES ─────────────────────────────────────────────
// The MAXIMUM % a relative vital (HR/RR/BP) can shift, scaled by age. A presentation
// asks for a direction + intensity; the engine multiplies the age-appropriate max %
// here by a random severity fraction. Younger = smaller % (less physiological reserve),
// rising to 100% for adults. age = upper bound of the band.
// ⚠️ PLACEHOLDER ramp — Keith to tune every value.
const DEV_PCT_BANDS = [
  { age:0,   maxPct:10 },   // neonate
  { age:0.5, maxPct:13 },
  { age:1,   maxPct:14 },
  { age:2,   maxPct:20 },
  { age:5,   maxPct:25 },
  { age:8,   maxPct:35 },
  { age:11,  maxPct:50 },
  { age:15,  maxPct:70 },
  { age:120, maxPct:100 }, // adult, can ~double
];

// ── SHARED LOCATION BANK ─────────────────────────────────────────────────────────
// Any presentation draws from this pool, so the setting never correlates with the
// diagnosis. Irish-flavoured, demographically NEUTRAL (no nursing homes / schools /
// playgrounds — a location implying an age would mislead the student's reasoning).
//
// `found` flag = can a patient plausibly be FOUND (come across) here?
//   true  → places you'd come across someone (home, street, public space).
//   false → places a patient actively TRAVELLED to and is already present at (GP
//           surgery, pharmacy, salon, café). You're never "found" in a GP office —
//           you made your way there. For these, an unconscious patient is described
//           as having COLLAPSED / become unresponsive there, never "found".
// (When unsure, set found:false — "collapsed there" reads correctly anywhere.)
const SCEN_LOCATIONS = [
  { name:'a private residence',               found:true , solo:true , setting:'domestic'        },
  { name:'a terraced house',                  found:true , solo:true , setting:'domestic'        },
  { name:'an apartment',                      found:true , solo:true , setting:'domestic'        },
  { name:'a rural farmhouse',                 found:true , solo:true , setting:'domestic'        },
  { name:'a shopping centre',                 found:true , solo:false, setting:'public-indoor'   },
  { name:'a supermarket',                     found:true , solo:false, setting:'public-indoor'   },
  { name:'a hotel lobby',                     found:false, solo:false, setting:'public-indoor'   },
  { name:'an office',                         found:false, solo:false, setting:'public-indoor'   },
  { name:'a hair salon',                      found:false, solo:false, setting:'public-indoor'   },
  { name:'a community hall',                  found:false, solo:false, setting:'public-indoor'   },
  { name:'a busy café',                       found:false, solo:false, setting:'public-indoor'   },
  { name:'a restaurant',                      found:false, solo:false, setting:'public-indoor'   },
  { name:'a pub',                             found:false, solo:false, setting:'public-indoor'   },
  { name:'a Spar',                            found:false, solo:false, setting:'public-indoor'   },
  { name:'a Dunnes Stores',                   found:false, solo:false, setting:'public-indoor'   },
  { name:'a Tesco',                           found:false, solo:false, setting:'public-indoor'   },
  { name:'a Lidl',                            found:false, solo:false, setting:'public-indoor'   },
  { name:'a creche',                          found:false, solo:false, setting:'public-indoor', ageSkew:'young' },
  { name:'a national school',                 found:false, solo:false, setting:'public-indoor', ageSkew:'young' },
  { name:'a church',                          found:false, solo:false, setting:'public-indoor', ageSkew:'old' },
  { name:'a chipper',                         found:false, solo:false, setting:'public-indoor'   },
  { name:'a bus stop',                        found:true , solo:true , setting:'transport'       },
  { name:'a Luas stop',                       found:true , solo:true , setting:'transport'       },
  { name:'a train station',                   found:true , solo:true , setting:'transport'       },
  { name:'a petrol station',                  found:true , solo:true , setting:'transport'       },
  { name:'a ferry terminal',                  found:false, solo:false, setting:'transport'       },
  { name:'a public park',                     found:true , solo:true , setting:'outdoor'         },
  { name:'a town square',                     found:true , solo:true , setting:'outdoor'         },
  { name:'a country road layby',              found:true , solo:true , setting:'outdoor'         },
  { name:'a beach car park',                  found:true , solo:true , setting:'outdoor'         },
  { name:'a turf bog',                        found:true , solo:true , setting:'outdoor'         },
  { name:'a building site',                   found:true , solo:false, setting:'workplace', ageSkew:'old' },
  { name:'a factory floor',                   found:true , solo:false, setting:'workplace', ageSkew:'old' },
  { name:'a livestock mart',                  found:true , solo:false, setting:'workplace', ageSkew:'old' },
  { name:'a county council depot',            found:true , solo:false, setting:'workplace', ageSkew:'old' },
  { name:'a gym',                             found:false, solo:false, setting:'leisure'         },
  { name:'a leisure centre',                  found:false, solo:false, setting:'leisure'         },
  { name:'a GAA clubhouse',                   found:false, solo:false, setting:'leisure'         },
  { name:'a sports ground',                   found:false, solo:true , setting:'leisure', ageSkew:'young' },
  { name:'a GAA match',                       found:false, solo:false, setting:'leisure', ageSkew:'young' },
  { name:'a GP surgery waiting room',         found:false, solo:false, setting:'clinical'        },
  { name:'a pharmacy',                        found:false, solo:false, setting:'clinical'        },
  { name:'a nursing home',                    found:false, solo:false, setting:'clinical', ageSkew:'old' },
  { name:'a Centra car park',                 found:true , solo:false, setting:'retail-carpark'  },
  { name:'an Aldi car park',                  found:true , solo:false, setting:'retail-carpark'  },
];

// ── PRESENTATION TEMPLATES ───────────────────────────────────────────────────────
// Each presentation is authored clinical content. The engine randomises patient +
// vital numbers; everything else here is fixed and authored.
//
// Fields:
//   id, name        — identity
//   demographics    — { minAge, maxAge (years), sex: 'any'|'male'|'female' }
//   variants[]      — narrative variants (the cause) so the STORY differs each run.
//                     { cause, dispatch, presentation, allergies, events }
//   deviations      — per-vital instruction:
//       RELATIVE vitals (hr/rr/bpSys/bpDia): { dir:'up'|'down', intensity:0–1 }
//         intensity scales the age-appropriate max %. dir=up raises above normal ceiling,
//         dir=down drops below normal floor.
//       ABSOLUTE vitals (spo2/temp/bgl): [low, high] target range used directly.
//   sample          — fixed SAMPLE parts { symptoms, medications, pmh, lastIntake }
//   opqrst          — OPQRST findings (optional; lighter for non-pain calls)
//   reveal          — AUTHORED debrief, Paramedic-scope-aware:
//       { diagnosis, pathway, interventions,
//         drugs: [ { name, paramedic:'IM dose...', ap:'IV dose...'(optional) } ] }
//     'paramedic' shows normally; 'ap' (if present) renders in an amber AP-scope bubble.
//
// PHECC CPG section taxonomy — the official guideline sections, used as the
// `category` for each presentation so a future picker can group/filter by them.
// Order matches the CPG. (Section 1 "Principles of General Care" and the final
// "Patient Disposition" section are intentionally omitted — they are not
// presentation categories.) Adding a new presentation = give it a `category`
// from this list (or extend the list if a needed section is missing).
const PHECC_SECTIONS = [
  'Airway and Breathing',
  'Cardiac',
  'Circulation',
  'Medical',
  'Neurological',
  'Behavioural / Mental Health Emergencies',
  'Trauma',
  'Environmental',
  'Toxicology',
  'Infectious',
  'Maternal',
  'Paediatric',
  'Resuscitation',
  'Palliative Care',
  'Operations',
];

// ⚠️ Anaphylaxis content below is FIRST-DRAFT PLACEHOLDER for engine demonstration.
const PRESENTATIONS = [
  {
    id: 'anaphylaxis',
    name: 'Anaphylaxis',
    category: 'Toxicology',
    demographics: { minAge: 16, maxAge: 90, sex: 'any' },
    variants: [
      { cause:'bee sting', conscious:true,
        dispatch:'You are called to {location} for a PATIENT with difficulty breathing.',
        presentation:'Visible facial and lip swelling, widespread urticarial (hive-like) rash, audible wheeze, looks anxious and flushed.',
        allergies:'Known allergy to bee/wasp stings.',
        sample:{ symptoms:'Facial and lip swelling, widespread hives, wheeze and throat tightness, rapid onset.', medications:'Nil regular.', pmh:'Known bee and wasp sting allergy; carries an adrenaline auto-injector.' },
        events:'Was stung by a bee roughly 10 minutes ago; symptoms came on rapidly afterwards.' },
      { cause:'peanuts', conscious:true,
        dispatch:'You are called to {location} for a PATIENT who has become acutely unwell.',
        presentation:'Swollen lips and tongue, blotchy raised rash on neck and chest, noisy breathing, clutching at throat.',
        allergies:'Known nut allergy.',
        sample:{ symptoms:'Swollen lips and tongue, blotchy rash on the neck and chest, noisy breathing.', medications:'Nil regular.', pmh:'Known nut allergy with a previous reaction; carries an adrenaline auto-injector.' },
        events:'Ate a dessert that unknowingly contained peanuts about 15 minutes ago.' },
      { cause:'shellfish', conscious:true,
        dispatch:'You are called to {location} for a PATIENT with sudden difficulty breathing.',
        presentation:'Facial swelling, urticaria over the arms and torso, wheeze, appears distressed and sweaty.',
        allergies:'Known shellfish allergy.',
        sample:{ symptoms:'Facial swelling and widespread urticaria, wheeze, distressed and sweaty.', medications:'Nil regular.', pmh:'Known shellfish allergy; previous milder reactions.' },
        events:'Had just eaten a seafood dish shortly before the symptoms started.' },
      { cause:'penicillin', conscious:true,
        dispatch:'You are called to {location} for a PATIENT who is acutely short of breath.',
        presentation:'Lip and periorbital swelling, spreading hives, wheeze, anxious and flushed.',
        allergies:'No previously documented drug allergy.',
        sample:{ symptoms:'Lip and periorbital swelling, spreading hives, wheeze, flushed and anxious.', medications:'A newly prescribed antibiotic, first dose today.', pmh:'No previously documented drug allergy; this is a first reaction.' },
        events:'Took a first dose of a newly prescribed antibiotic about 20 minutes ago.' },
      { cause:'wasp sting (outdoor)', conscious:true,
        dispatch:'You are called to {location} for a PATIENT struggling to breathe.',
        presentation:'Rapidly swelling face and lips, widespread blotchy hives, loud wheeze, gripping at the throat and visibly frightened.',
        allergies:'No previously documented sting allergy.',
        sample:{ symptoms:'Rapidly swelling face and lips, widespread hives, loud wheeze, gripping the throat.', medications:'Nil regular.', pmh:'No previously documented sting allergy; first time this has happened.' },
        events:'Stung on the arm while outdoors about 10 minutes ago; first time this has ever happened.' },
      { cause:'latex / clinical exposure', conscious:true,
        dispatch:'You are called to {location} for a PATIENT who has become acutely unwell.',
        presentation:'Flushed and swollen around the eyes and lips, raised itchy rash spreading across the chest, wheeze, anxious and clammy.',
        allergies:'Known latex sensitivity.',
        sample:{ symptoms:'Flushing and swelling around the eyes and lips, spreading itchy rash, wheeze.', medications:'Nil regular.', pmh:'Known latex sensitivity.' },
        events:'Symptoms began within minutes of contact with latex gloves during a routine procedure.' },
    ],
    painBased: false,   // anaphylaxis is not a pain complaint → OPQRST shows honest negatives
    // ⚠️ PLACEHOLDER deviations — Keith to verify direction + intensity.
    deviations: {
      hr:    { dir:'up',   intensity:0.7 },   // tachycardia
      rr:    { dir:'up',   intensity:2.1, cap:[ {age:1, val:80}, {age:5, val:50}, {age:11, val:44}, {age:15, val:56}, {age:120, val:62} ] },   // severe tachypnoea, age-scaled ceiling
      bpSys: { dir:'down', intensity:0.5 },   // hypotension
      bpDia: { dir:'down', intensity:0.5 },
      spo2:  [85, 93],                        // absolute hypoxia target
      // temp + bgl omitted → stay normal
    },
    sample: {
      symptoms:'Acute allergic reaction; specific features depend on the patient.',
      medications:'Nil regular.',
      pmh:'Variable; may or may not have a known allergy.',
      lastIntake:'As per the triggering event.',
    },
    // Non-pain presentation: OPQRST still asked, but answered honestly/negative.
    opqrst: {
      onset:'Sudden, over a few minutes.',
      provocation:'No.',
      quality:'No pain, throat and chest tightness.',
      radiates:'No.',
      severity:'0',
      time:'Began roughly 10–20 minutes ago.',
    },
    reveal: {
      diagnosis:'Anaphylaxis (severe systemic allergic reaction): moderate allergic symptoms plus airway, breathing and/or circulatory compromise after exposure to a trigger. Severity grades: Mild = urticaria. Moderate = mild symptoms plus angio-oedema or simple bronchospasm. Severe / anaphylaxis = moderate symptoms plus haemodynamic and/or respiratory compromise.',
      pathway:'Grade the reaction and treat accordingly. Mild: monitor, and consider Chlorphenamine PO. Moderate: oxygen therapy, Chlorphenamine (PO, or IM \u2014 IV is AP), and if bronchospasm consider Salbutamol NEB; reassess, and request ALS if it deteriorates. Severe / anaphylaxis: oxygen therapy, then unless adrenaline was given pre-arrival within 5 minutes and was effective, give Adrenaline IM without delay (repeat at 5-minute intervals PRN). Request ALS. NaCl 0.9% IV/IO (AP) and Chlorphenamine (IM, or IV which is AP). If it recurs, deteriorates or improves poorly: monitor ECG and SpO\u2082, repeat Adrenaline IM, check for bradycardia (Bradycardia CPG if present), give Salbutamol NEB if bronchospasm, and for severe or recurrent reactions and/or bronchospasm give Hydrocortisone (IM, or IV which is AP).',
      interventions:'Recognise anaphylaxis early, remove the trigger if possible, high-flow oxygen and position appropriately. Adrenaline IM is the first-line, time-critical drug and must not be delayed. Salbutamol NEB for bronchospasm, Chlorphenamine and Hydrocortisone as adjuncts, and IV fluids for circulatory compromise. Reassess frequently, repeat Adrenaline at 5-minute intervals as needed, and transport urgently. Note: autoinjectors should not be used by healthcare professionals unless they are the only source available.',
      diagnosisBlocks: [
        { type:'lead', body:'Anaphylaxis, a severe systemic allergic reaction: moderate allergic symptoms plus airway, breathing and/or circulatory compromise after exposure to a trigger.' },
        { type:'grade', label:'Mild', sev:'mild', body:'Urticaria.' },
        { type:'grade', label:'Moderate', sev:'mod', body:'Mild symptoms plus angio-oedema or simple bronchospasm.' },
        { type:'grade', label:'Severe / anaphylaxis', sev:'sev', body:'Moderate symptoms plus haemodynamic and/or respiratory compromise.' },
      ],
      pathwayBlocks: [
        { type:'lead', body:'Grade the reaction and treat accordingly.' },
        { type:'grade', label:'Mild', sev:'mild', body:'Monitor. Consider Chlorphenamine PO.' },
        { type:'grade', label:'Moderate', sev:'mod', body:'Oxygen therapy. Chlorphenamine PO or IM (IV is AP only). If bronchospasm, consider Salbutamol NEB. Reassess; request ALS if it deteriorates.' },
        { type:'grade', label:'Severe / anaphylaxis', sev:'sev', body:'Oxygen therapy. Unless adrenaline was given pre-arrival within 5 minutes and was effective, give Adrenaline IM without delay (repeat at 5-minute intervals PRN). Request ALS. NaCl 0.9% IV/IO (AP only) and Chlorphenamine IM (IV is AP only).' },
        { type:'note', label:'If it recurs, deteriorates or improves poorly', body:'Monitor ECG and SpO₂. Repeat Adrenaline IM. Check for bradycardia (Bradycardia CPG if present). Salbutamol NEB if bronchospasm. For severe or recurrent reactions and/or bronchospasm, give Hydrocortisone IM (IV is AP only).' },
      ],
      interventionsBlocks: [
        { type:'step', body:'Recognise anaphylaxis early; remove the trigger if possible.' },
        { type:'step', body:'High-flow oxygen and position appropriately.' },
        { type:'step', body:'Adrenaline IM, first-line, time-critical, must not be delayed.' },
        { type:'step', body:'Adjuncts: Salbutamol NEB for bronchospasm; Chlorphenamine and Hydrocortisone; IV fluids for circulatory compromise.' },
        { type:'step', body:'Reassess frequently, repeat Adrenaline at 5-minute intervals as needed, transport urgently.' },
        { type:'note', body:'Autoinjectors should not be used by healthcare professionals unless they are the only source available.' },
      ],
      drugs: [
        { name:'Adrenaline (1:1000) IM',
          adult:{ paramedic:'500mcg IM, repeat at 5-minute intervals PRN. First-line, give without delay.' },
          paed:{ paramedic:'<6 months 10mcg/kg; 6 months\u2013<6 yrs 150mcg; 6\u2013<12 yrs 300mcg; \u226512 yrs 500mcg. IM, repeat at 5-minute intervals PRN. First-line, give without delay.' } },
        { name:'Salbutamol NEB (if bronchospasm)',
          adult:{ paramedic:'5mg NEB.' },
          paed:{ paramedic:'<5 yrs 2.5mg NEB; \u22655 yrs 5mg NEB.' } },
        { name:'Chlorphenamine',
          adult:{ paramedic:'4mg PO, or 10mg IM (IM is Paramedic scope).', ap:'10mg IV.' },
          paed:{ paramedic:'PO: 6\u201311 yrs 2mg; \u226512 yrs 4mg. IM: 1\u20136 months 0.25mg/kg; >6 months\u2013<6 yrs 2.5mg; 6\u2013<12 yrs 5mg; \u226512 yrs 10mg.', ap:'IV: same doses as IM, by the IV route.' } },
        { name:'Hydrocortisone',
          adult:{ paramedic:'200mg IM.', ap:'200mg IV (in 100mL NaCl).' },
          paed:{ paramedic:'IM: <6 months 25mg; \u22656 months\u2013<6 yrs 50mg; \u22656\u2013<12 yrs 100mg; \u226512 yrs 200mg.', ap:'IV (infusion in 100mL NaCl): same doses as IM, by the IV route.' } },
        { name:'NaCl 0.9% IV/IO',
          adult:{ paramedic:'Not in Paramedic scope.', ap:'1L IV/IO infusion, repeat PRN.' },
          paed:{ paramedic:'Not in Paramedic scope.', ap:'20mL/kg IV/IO bolus, repeat PRN.' } },
      ],
    },
  },

  {
    id: 'poisons',
    name: 'Poisoning / Overdose',
    category: 'Toxicology',
    demographics: { minAge: 16, maxAge: 90, sex: 'any' },
    variants: [
      // ── OPIATE (×3) ──────────────────────────────────────────────────────────
      // V1: classic opioid toxidrome with INADEQUATE ventilation → naloxone pathway.
      { cause:'opioid toxidrome, respiratory depression', conscious:false,
        dispatch:'You are called to {location} for a PATIENT who is drowsy and barely responsive.',
        presentation:'Markedly reduced level of consciousness, slow shallow breathing, pinpoint pupils, dusky lips, responds only to a painful stimulus.',
        allergies:'Unknown.',
        sample:{ symptoms:'Markedly reduced consciousness, slow shallow breathing, pinpoint pupils, cyanosed lips, responds only to pain.', medications:'Unknown.', pmh:'Unknown.', lastIntake:'Unknown.' },
        events:'Found drowsy and difficult to rouse; a friend present mentions recreational drug use earlier but is vague on detail.',
        vitalsOverride:{ rr:[6,10], spo2:[80,90], hr:{ dir:'down', intensity:0.2 } } },
      // V2: opioid toxidrome BUT ADEQUATE ventilation → monitor, don't rush naloxone.
      { cause:'opioid toxidrome, ventilating adequately', conscious:true,
        dispatch:'You are called to {location} for a PATIENT who is very drowsy.',
        presentation:'Drowsy and slow to rouse, pinpoint pupils, but breathing adequately on their own and maintaining their own airway.',
        allergies:'No known drug allergies.',
        sample:{ symptoms:'Drowsy and slow to rouse, pinpoint pupils, but breathing adequately and maintaining the airway.', medications:'Methadone (on a maintenance programme).', pmh:'Opioid dependence, on a maintenance programme.', lastIntake:'Took their usual methadone earlier and admits a little extra on top; ate a normal meal earlier today.' },
        opqrst:{ onset:'Came on gradually as the drowsiness built up.', provocation:'Nothing makes it better or worse.', quality:'No pain. Just feels heavy and very sleepy.', radiates:'No.', severity:'0', time:'Over the last while.' },
        events:'Became progressively drowsy at home; took their usual medication and reportedly a little extra.',
        vitalsOverride:{ rr:[10,12], spo2:[92,96] } },
      // V3: found unresponsive, severe → the found-down, limited-history case.
      { cause:'opioid toxidrome, found unresponsive', conscious:false, witness:'unwitnessed',
        dispatch:'You are called to {location} for a PATIENT found unresponsive.',
        presentation:'Unresponsive, very slow breathing, pinpoint pupils, pale and cyanosed.',
        allergies:'Unknown.',
        sample:{ symptoms:'Unresponsive, very slow breathing, pinpoint pupils, pale and cyanosed.', medications:'Unknown.', pmh:'Unknown.', lastIntake:'Unknown.' },
        events:'Found unresponsive a short time ago; no reliable history available at the scene.',
        vitalsOverride:{ rr:[4,8], spo2:[78,88], hr:{ dir:'down', intensity:0.25 } } },
      // ── ALCOHOL (×1) ─────────────────────────────────────────────────────────
      // V4: the CHECK-THE-BGL branch (hypoglycaemia mimics/coexists with intoxication).
      { cause:'acute alcohol intoxication', conscious:true,
        dispatch:'You are called to {location} for a PATIENT who is intoxicated and unwell.',
        presentation:'Smell of alcohol, slurred speech and ataxic, drowsy but rousable, has vomited, unsteady on their feet.',
        allergies:'No known drug allergies.',
        sample:{ symptoms:'Smell of alcohol, slurred and ataxic, drowsy but rousable, vomiting, unsteady.', medications:'Nil regular.', pmh:'Nil of note.', lastIntake:'Has been drinking steadily through the evening with very little food; last proper meal was hours ago.' },
        opqrst:{ onset:'Came on over the course of the evening.', provocation:'Nothing in particular makes it better or worse.', quality:'No pain. Feels sick, unsteady and muddled.', radiates:'No.', severity:'0', time:'Over the evening.' },
        events:'Has been drinking heavily over the evening; found unsteady and confused by friends.',
        vitalsOverride:{ hr:{ dir:'up', intensity:0.25 } } },
      // ── OTHER (×2) ───────────────────────────────────────────────────────────
      // V5: general ingestion, looks well early → supportive care branch.
      { cause:'ingestion, no specific toxidrome', conscious:true,
        dispatch:'You are called to {location} for a PATIENT who has taken an overdose.',
        presentation:'Alert but distressed and tearful, nauseated, reluctant to say much, no specific toxidrome on examination.',
        allergies:'No known drug allergies.',
        sample:{ symptoms:'Alert but distressed, nauseated, no specific toxidrome on examination.', medications:'Nil regular.', pmh:'Low mood recently (per the patient).', lastIntake:'Took a quantity of tablets a short time ago; has not eaten since.' },
        opqrst:{ onset:'A short time ago.', provocation:'Nothing makes it better or worse.', quality:'No pain. Distressed and nauseated.', radiates:'No.', severity:'0', time:'A short time ago.' },
        events:'Reports having taken an overdose of tablets a short time ago; declines to give the amount.',
        vitalsOverride:{ hr:{ dir:'up', intensity:0.2 } } },
      // V6: corrosive ingestion → the early-branch teaching (sips water/milk, no emesis, no charcoal).
      { cause:'corrosive ingestion', conscious:true,
        dispatch:'You are called to {location} for a PATIENT with mouth and throat pain after swallowing something.',
        presentation:'Distressed, drooling, pain in the mouth and throat, reluctant to swallow, voice sounds altered.',
        allergies:'No known drug allergies.',
        sample:{ symptoms:'Distressed, drooling, mouth and throat pain, reluctant to swallow, altered voice.', medications:'Nil regular.', pmh:'Nil of note.', lastIntake:'Swallowed the substance a short time ago; nothing to eat or drink since, and swallowing is now painful.' },
        opqrst:{ onset:'Came on immediately on swallowing.', provocation:'Swallowing makes it much worse; reluctant to swallow at all.', quality:'Burning pain in the mouth and throat.', radiates:'Felt in the mouth and throat.', severity:'High; visibly distressed by it.', time:'Since swallowing it, a short time ago, and ongoing.' },
        events:'Swallowed a household cleaning product a short time ago; immediate mouth and throat pain.',
        vitalsOverride:{ hr:{ dir:'up', intensity:0.3 } } },
    ],
    painBased: false,   // toxicology: presentation is the toxidrome, not a pain complaint
    // ⚠️ Vitals: defining picture varies by toxidrome. Opioid variants carry their own
    // vitalsOverride (low RR/SpO2). The presentation default below is mild/non-specific so
    // alcohol/other variants stay largely normal early (many overdoses look well at first).
    deviations: {
      hr: { dir:'up', intensity:0.2 },   // mild non-specific; opioid variants override downward
    },
    sample: {
      symptoms:'Presentation depends on the substance and the toxidrome; identify what you observe.',
      medications:'Varies; see patient history.',
      pmh:'Varies; see patient history.',
      lastIntake:'May be relevant; establish what was taken and when from the history.',
    },
    opqrst: {
      onset:'Relating to when the substance was taken.',
      provocation:'Not a pain complaint in most poisonings (corrosive ingestion is an exception).',
      quality:'Depends on the toxidrome.',
      radiates:'No.',
      severity:'0',
      time:'Establish the time the substance was taken from the history.',
    },
    reveal: {
      diagnosis:'Poisoning / overdose. Identify the toxidrome and the poison type (opiate, alcohol, corrosive, or other), this drives management. The opioid toxidrome is reduced consciousness, respiratory depression and pinpoint pupils.',
      pathway:'Caution with oral intake throughout. If a corrosive was ingested: sips of water or milk, do not induce vomiting. If activated charcoal is indicated and a solid substance was ingested with GCS 15: consider activated charcoal 50g PO (the adsorbed-substance list is in the PHECC Field Guide; charcoal is not for corrosives). Consider ALS. Then identify the poison type. Opiate: if ventilations are inadequate, give naloxone, then go to the Abnormal Work of Breathing CPG; if ventilations are adequate, support with oxygen and monitoring. Alcohol: check blood glucose, and if BGL is less than 4 or greater than 20 mmol/L go to the Glycaemic Emergency CPG. Other: supportive care. Consider oxygen therapy, ECG and SpO2 monitoring, and transport.',
      interventions:'Recognise the toxidrome and identify the poison type. Naloxone is given for inadequate ventilation in opioid toxidrome: an EMT gives 800mcg IN (repeat PRN); a Paramedic may give 800mcg IN or 400mcg IM/SC (repeat PRN). Activated charcoal 50g PO if indicated with GCS 15 (not for corrosives). Corrosive: sips of water or milk, no induced vomiting, airway vigilance. Consider oxygen therapy (all scopes), ECG and SpO2 monitoring, supportive care and transport. Consider ALS.',
      diagnosisBlocks: [
        { type:'lead', body:'Poisoning / overdose. Identify the toxidrome and the poison type, this drives management.' },
        { type:'note', label:'Opioid toxidrome', body:'Reduced consciousness, respiratory depression and pinpoint pupils.' },
        { type:'note', body:'Many overdoses look well early. Establish what was taken and when from the history.' },
      ],
      pathwayBlocks: [
        { type:'note', body:'Caution with oral intake throughout.' },
        { type:'branch', label:'Ingested corrosive', body:'Sips of water or milk. Do not induce vomiting. Activated charcoal is not used for corrosives. Airway vigilance.' },
        { type:'branch', label:'Activated charcoal (solid substance, GCS 15)', body:'If indicated, consider activated charcoal 50g PO. The adsorbed-substance list is in the PHECC Field Guide.' },
        { type:'step', body:'Consider ALS. Identify the poison type.' },
        { type:'branch', label:'Opiate', body:'Inadequate ventilations: give naloxone, then go to the Abnormal Work of Breathing CPG. Adequate ventilations: oxygen and monitoring.' },
        { type:'branch', label:'Alcohol', body:'Check blood glucose. If BGL is less than 4 or greater than 20 mmol/L, go to the Glycaemic Emergency CPG.' },
        { type:'branch', label:'Other', body:'Supportive care.' },
        { type:'step', body:'Consider oxygen therapy. ECG and SpO2 monitoring. Transport.' },
      ],
      interventionsBlocks: [
        { type:'step', body:'Recognise the toxidrome and identify the poison type.' },
        { type:'branch', label:'Opioid, inadequate ventilation', body:'Naloxone: EMT 800mcg IN (repeat PRN); Paramedic 800mcg IN or 400mcg IM/SC (repeat PRN). Then the Abnormal Work of Breathing CPG.' },
        { type:'branch', label:'Solid substance, GCS 15', body:'Consider activated charcoal 50g PO if indicated. Not for corrosives.' },
        { type:'branch', label:'Corrosive', body:'Sips of water or milk. No induced vomiting. Airway vigilance.' },
        { type:'note', body:'Consider oxygen therapy (all scopes), ECG and SpO2 monitoring, supportive care, transport. Consider ALS.' },
      ],
      drugs: [
        { name:'Naloxone (opioid toxidrome, inadequate ventilation)',
          adult:{ paramedic:'EMT scope: 800mcg IN, repeat PRN. Paramedic scope adds: 800mcg IN or 400mcg IM/SC, repeat PRN.' } },
        { name:'Activated Charcoal (Consider)',
          adult:{ paramedic:'50g PO, if indicated and a solid substance was ingested with GCS 15. Not for corrosives. Adsorbed-substance list in the PHECC Field Guide.' } },
        { name:'Oxygen Therapy (Consider)',
          adult:{ paramedic:'Consider, all scopes. Note: in paraquat poisoning do not administer oxygen unless SpO2 is below 92%.' } },
      ],
    },
  },


  {
    id: 'hypoglycaemia',
    name: 'Hypoglycaemia',
    category: 'Medical',
    demographics: { minAge: 16, maxAge: 90, sex: 'any' },
    variants: [
      // Conscious level is the key decision fork here (gel vs glucagon). The engine
      // adds "found unresponsive" vs "collapsed there" framing based on the location.
      // CONSCIOUS / able to swallow → leads toward buccal glucose.
      { cause:'missed meal, conscious', conscious:true,
        dispatch:'You are called to {location} for a PATIENT who is confused and not themselves.',
        presentation:'Alert but confused and sweaty, pale and clammy, slurred speech, but able to talk, follow simple instructions and hold a cup. Airway is their own and they can swallow.',
        presentationU3:'Drowsy and floppy, pale and clammy with profuse sweating, whimpering and not interacting as the parents say they normally would, but rousable, moving all limbs, and still able to swallow. Airway is their own.',
        allergies:'No known drug allergies.',
        sample:{ symptoms:'Confused and sweaty, pale and clammy, slurred speech, but able to talk and hold a cup, airway own and can swallow.', medications:'Lantus and NovoRapid.', pmh:'Type 1 diabetes.' },
        events:'Took their usual insulin this morning but skipped breakfast; became increasingly confused over the last half hour.' },
      { cause:'odd behaviour, conscious', conscious:true, minAge:30,
        dispatch:'You are called to {location} for a PATIENT who is behaving strangely.',
        presentation:'Confused and agitated but awake and responsive, sweating heavily, unsteady, almost intoxicated in manner though no alcohol involved. Able to protect their own airway and swallow.',
        allergies:'No known drug allergies.',
        sample:{ symptoms:'Confused and agitated, awake and responsive, sweating heavily, unsteady, appears almost intoxicated though no alcohol. Protects own airway, can swallow.', medications:'Diamicron.', pmh:'Type 2 diabetes.' },
        events:'Has been increasingly muddled and clumsy over the past 20 minutes; this reportedly happens if they go too long without eating.' },
      { cause:'exercise-related, conscious', conscious:true,
        dispatch:'You are called to {location} for a PATIENT who has gone pale and shaky.',
        presentation:'Sweaty, trembling and pale, anxious and a little muddled but fully awake, answering questions slowly. Airway is their own and they can swallow.',
        presentationU3:'Sweaty, pale and trembling, clingy and unsettled and not their usual self according to the parents, but fully awake, rousable and able to swallow. Airway is their own.',
        allergies:'No known drug allergies.',
        sample:{ symptoms:'Sweaty, trembling and pale, anxious and a little muddled but fully awake, answering slowly. Airway own, can swallow.', medications:'Levemir and NovoRapid.', pmh:'Type 1 diabetes, well controlled.' },
        events:'Known diabetic on insulin; took the usual dose then did far more physical activity than normal without eating extra, and started feeling shaky and confused over the last 20 minutes.' },
      // UNCONSCIOUS / unable to swallow → leads toward IM glucagon.
      { cause:'collapse, unresponsive', conscious:false, witness:'unwitnessed',
        dispatch:'You are called to {location} for a PATIENT who has collapsed.',
        presentation:'Slumped and unresponsive to voice, only groaning to a painful stimulus, profuse sweating, cool clammy skin. NOT able to swallow or protect their own airway.',
        allergies:'No known drug allergies.',
        sample:{ symptoms:'Slumped, unresponsive to voice, groans to pain, profuse sweating, cool clammy skin. Not protecting airway, cannot swallow.', medications:'Unknown.', pmh:'Unknown.', lastIntake:'Unknown.' },
        events:'Witnessed by passers-by to be well earlier, then became vacant and slumped over a short time ago. No medical history available.' },
      { cause:'unresponsive', conscious:false, witness:'unwitnessed',
        dispatch:'You are called to {location} for a PATIENT who is unconscious.',
        presentation:'Unrousable to voice, withdraws to pain only, sweaty and pale, breathing on their own. Cannot swallow safely, no gag/airway protection.',
        allergies:'No known drug allergies.',
        sample:{ symptoms:'Unrousable to voice, withdraws to pain, sweaty and pale, breathing spontaneously. No airway protection, cannot swallow safely.', medications:'Diabetic, on injections (family unsure of the names).', pmh:'Diabetes (per family).', lastIntake:'Unknown.' },
        events:'Known diabetic; became unresponsive a short time ago, family present and able to give a brief history.' },
      { cause:'found drowsy at home, unresponsive', conscious:false, witness:'witnessed', onsetWhen:'earlier this evening',
        dispatch:'You are called to {location} for a PATIENT who cannot be roused.',
        presentation:'Deeply drowsy, responds only to a painful stimulus with a groan, profusely sweaty with cold clammy skin, breathing on their own. NOT able to swallow or protect their own airway.',
        allergies:'No known drug allergies.',
        sample:{ symptoms:'Deeply drowsy, responds to pain with a groan, profusely sweaty, cold clammy skin, breathing spontaneously. Not protecting airway, cannot swallow.', medications:'Diabetic, on injections (family unsure of the names).', pmh:'Diabetes (per family).', lastIntake:'Family think they ate little today.' },
        events:'Family noticed they had become harder and harder to wake over the last hour; family present at home and able to give a brief history.' },
    ],
    painBased: false,   // hypoglycaemia is not a pain complaint → OPQRST shows honest negatives
    // ⚠️ PLACEHOLDER deviations — Keith to verify.
    // The DEFINING abnormal vital is BGL (driven LOW, absolute range). HR mildly
    // raised (adrenergic response); other vitals largely normal — the teaching
    // point is that hypoglycaemia mimics many things until you CHECK THE BGL.
    deviations: {
      hr:  { dir:'up', intensity:0.4 },   // mild adrenergic tachycardia
      bgl: [1.5, 3.2],                    // absolute hypoglycaemia (mmol/L)
      // rr / bp / spo2 / temp omitted → stay normal
    },
    sample: {
      symptoms:'Altered mental state with sweating and pallor; presentation varies with conscious level.',
      medications:'Varies; see patient history.',
      pmh:'Varies; see patient history.',
      lastIntake:'Missed or inadequate food intake relative to insulin/medication.',
    },
    opqrst: {
      onset:'Came on gradually over the last while.',
      provocation:'No.',
      quality:'No pain, confused and weak.',
      radiates:'No.',
      severity:'0',
      time:'Over roughly the last 20–30 minutes.',
    },
    reveal: {
      diagnosis:'Hypoglycaemia (BGL < 4 mmol/L), most commonly in insulin-treated diabetes. Note: in a non-diabetic hypoglycaemic patient, glucagon is unlikely to be effective.',
      pathway:'Confirm with a BGL reading. The decision fork is conscious level / ability to swallow. Conscious and able to swallow: glucose gel buccal (plus a sweetened drink), allow 5 minutes and reassess; once recovered, advise a carbohydrate meal (a sandwich); if still low or impaired, repeat and consider ALS. Not conscious or unable to swallow: glucagon IM (Paramedic) and/or glucose 10% IV/IO (AP), allow 5 minutes and reassess; if still unable to swallow, consider ALS.',
      interventions:'Check BGL, position safely, manage airway. If able to swallow: glucose gel buccal plus a sweetened drink, reassess at 5 minutes, carbohydrate meal on recovery. If unable to swallow / unresponsive: glucagon IM, reassess, and arrange transport if not fully recovered or recurrent. Glucose 10% IV/IO and NaCl 0.9% IV/IO are Advanced Paramedic scope.',
      diagnosisBlocks: [
        { type:'lead', body:'Hypoglycaemia, BGL < 4 mmol/L, most commonly in insulin-treated diabetes.' },
        { type:'note', body:'In a non-diabetic hypoglycaemic patient, glucagon is unlikely to be effective.' },
      ],
      pathwayBlocks: [
        { type:'lead', body:'Confirm with a BGL reading. The decision fork is conscious level / ability to swallow.' },
        { type:'branch', label:'Conscious and able to swallow', body:'Glucose gel buccal (plus a sweetened drink). Allow 5 minutes and reassess. Once recovered, advise a carbohydrate meal (a sandwich). If still low or impaired, repeat and consider ALS.' },
        { type:'branch', label:'Not conscious or unable to swallow', body:'Glucagon IM (Paramedic) and/or glucose 10% IV/IO (AP only). Allow 5 minutes and reassess. If still unable to swallow, consider ALS.' },
      ],
      interventionsBlocks: [
        { type:'step', body:'Check BGL, position safely, manage airway.' },
        { type:'branch', label:'If able to swallow', body:'Glucose gel buccal plus a sweetened drink. Reassess at 5 minutes. Carbohydrate meal on recovery.' },
        { type:'branch', label:'If unable to swallow / unresponsive', body:'Glucagon IM. Reassess. Arrange transport if not fully recovered or recurrent.' },
        { type:'note', body:'Glucose 10% IV/IO and NaCl 0.9% IV/IO are Advanced Paramedic scope.' },
      ],
      drugs: [
        { name:'Glucose Gel (Consider)',
          adult:{ paramedic:'10\u201320g buccal, plus a sweetened drink. For the conscious, swallowing patient.' },
          paed:{ paramedic:'\u22648 yrs 5\u201310g buccal; >8 yrs 10\u201320g buccal, plus a sweetened drink. For the conscious, swallowing patient.' } },
        { name:'Glucagon',
          adult:{ paramedic:'1mg IM. For the patient who cannot swallow / is unresponsive.' },
          paed:{ paramedic:'\u22651 month\u2013<6 yrs 500mcg IM; \u22656 yrs 1mg IM. For the patient who cannot swallow / is unresponsive.' } },
        { name:'Glucose 10% IV/IO',
          adult:{ paramedic:'Not in Paramedic scope.', ap:'250mL IV/IO infusion.' },
          paed:{ paramedic:'Not in Paramedic scope.', ap:'5mL/kg IV/IO bolus, repeat \u00d71 PRN.' } },
        { name:'NaCl 0.9% IV/IO',
          adult:{ paramedic:'Not in Paramedic scope.', ap:'For the hyperglycaemic (>20 mmol/L) pathway with dehydration. 1L IV/IO infusion.' },
          paed:{ paramedic:'Not in Paramedic scope.', ap:'For the hyperglycaemic (>20 mmol/L) pathway with dehydration. 10mL/kg IV/IO bolus.' } },
      ],
    },
  },

  {
    id: 'acs',
    name: 'Acute Coronary Syndrome',
    category: 'Cardiac',
    demographics: { minAge: 35, maxAge: 90, sex: 'any' },
    // ECG rhythm field (first presentation to use it). Descriptive labels — a real
    // 12-lead would be handed to candidates in the room; here the student reads the
    // rhythm and interprets. Picked at random per scenario.
    ecg: [
      'Sinus rhythm.',
      'Sinus tachycardia.',
      'Sinus rhythm with ST elevation in the inferior leads (II, III, aVF).',
      'Sinus rhythm with ST elevation in the anterior leads (V2–V4).',
      'Sinus rhythm with ST depression and T-wave inversion.',
      'Sinus rhythm with hyperacute (peaked) T-waves.',
      'Atrial fibrillation with a controlled ventricular rate.',
    ],
    variants: [
      { cause:'exertional onset', conscious:true,
        dispatch:'You are called to {location} for a PATIENT complaining of chest pain.',
        presentation:'Clutching their chest, pale and sweaty (diaphoretic), looks anxious and uncomfortable, mild shortness of breath.',
        allergies:'No known drug allergies.',
        sample:{ symptoms:'Central chest tightness with sweating and mild breathlessness, came on climbing stairs.', medications:'Aspirin, Lipitor, and Cardicor.', pmh:'Angina and high blood pressure; ex-smoker.' },
        opqrst:{ onset:'Came on with exertion, climbing stairs, about 40 minutes ago.', provocation:'Brought on by exertion, no change with breathing or movement.', quality:'Heavy, tight, like a band across the chest.', radiates:'Some ache into the left arm.', severity:'6', time:'Ongoing about 40 minutes, not settling with rest.' },
        events:'Pain started about 40 minutes ago while climbing stairs and has not settled.' },
      { cause:'at rest onset', conscious:true,
        dispatch:'You are called to {location} for a PATIENT with central chest pain.',
        presentation:'Grey and clammy, holding the centre of their chest, nauseated, breathing a little fast.',
        allergies:'No known drug allergies.',
        sample:{ symptoms:'Central crushing chest pain with nausea and clamminess, came on at rest.', medications:'Aspirin and Coversyl.', pmh:'High blood pressure; high cholesterol.' },
        opqrst:{ onset:'Came on suddenly at rest, watching television, about half an hour ago.', provocation:'Came on at rest, not related to exertion or breathing.', quality:'Crushing, heavy, central.', radiates:'Up into the jaw.', severity:'8', time:'Constant for about half an hour.' },
        events:'Was sitting watching television when the pain came on suddenly about half an hour ago.' },
      { cause:'building pressure', conscious:true,
        dispatch:'You are called to {location} for a PATIENT who feels unwell with chest discomfort.',
        presentation:'Sitting forward, sweaty and pale, one hand on the chest, looks frightened, mild breathlessness.',
        allergies:'No known drug allergies.',
        sample:{ symptoms:'Gradually building central chest pressure with sweating and unease.', medications:'The occasional GTN spray, can\'t remember the rest.', pmh:'Known angina.' },
        opqrst:{ onset:'Built up gradually over 20 to 30 minutes.', provocation:'Came on at rest and has not eased.', quality:'Heavy pressure, like a weight on the chest.', radiates:'Stays central, no clear radiation.', severity:'6', time:'Building over 20 to 30 minutes, still present.' },
        events:'Felt heavy chest pressure that built up over the last 20–30 minutes and is ongoing.' },
      { cause:'atypical presentation', conscious:true,
        dispatch:'You are called to {location} for a PATIENT who feels generally unwell and short of breath.',
        presentation:'Pale and sweaty, vague discomfort across the chest and into the jaw, a little breathless, uneasy.',
        allergies:'No known drug allergies.',
        sample:{ symptoms:'Vague chest and jaw discomfort with clamminess and breathlessness, hard to localise.', medications:'Metformin, Istin, and Lipitor.', pmh:'Type 2 diabetes and high blood pressure.' },
        opqrst:{ onset:'Came on vaguely over the last hour, hard to pinpoint.', provocation:'No clear trigger; not affected by breathing or movement.', quality:'Vague discomfort, not a classic crushing pain.', radiates:'A vague ache into the jaw, no clear arm pain.', severity:'4', time:'Grumbling for about an hour.' },
        events:'Has felt off and clammy for about an hour with discomfort that is hard to pin down.' },
      { cause:'radiating to arm', conscious:true,
        dispatch:'You are called to {location} for a PATIENT with chest pain spreading down the arm.',
        presentation:'Pale and sweaty, one hand on the chest and rubbing the left arm, looks uneasy and short of breath, mildly nauseated.',
        allergies:'No known drug allergies.',
        sample:{ symptoms:'Tight central chest pain radiating down the left arm, with sweating and breathlessness.', medications:'None that they take regularly.', pmh:'No known cardiac history; smoker.' },
        opqrst:{ onset:'Came on about 45 minutes ago.', provocation:'Came on at rest, not eased by anything.', quality:'Tight, heavy, gripping.', radiates:'Clearly down the left arm.', severity:'7', time:'Constant for about 45 minutes.' },
        events:'A tight, heavy chest pain came on about 45 minutes ago and spread down the left arm; it has not eased with rest.' },
      { cause:'post-meal, mistaken for indigestion', conscious:true,
        dispatch:'You are called to {location} for a PATIENT with chest discomfort and sweating.',
        presentation:'Grey and clammy, sitting still and reluctant to move, burping and rubbing the upper abdomen and lower chest, breathing a little fast, looks worried.',
        allergies:'No known drug allergies.',
        sample:{ symptoms:'Upper abdominal and lower chest discomfort with sweating and breathlessness, initially thought to be indigestion.', medications:'Aspirin and Lipitor.', pmh:'High blood pressure; high cholesterol.' },
        opqrst:{ onset:'Came on after a large meal about an hour ago.', provocation:'Not relieved by antacids; not related to breathing or movement.', quality:'Heavy discomfort, felt like indigestion at first.', radiates:'Up into the chest from the upper abdomen.', severity:'5', time:'Worsening over the last hour.' },
        events:'Put the discomfort down to indigestion after a large meal an hour ago, but it has steadily worsened, with sweating and breathlessness, hasn\'t responded to antacids.' },
    ],
    painBased: true,    // ACS is a pain complaint → full meaningful OPQRST
    // ⚠️ PLACEHOLDER deviations — Keith to verify.
    // ACS has NO single rigid vital fingerprint — the history + ECG carry the diagnosis,
    // not dramatically abnormal vitals. So shifts here are deliberately MILD: a student
    // who waits for crashing vitals in ACS has missed it. That is the teaching point.
    deviations: {
      hr:    { dir:'up', intensity:0.3 },   // mild, pain/anxiety; often near-normal
      bpSys: { dir:'up', intensity:0.25 },  // mild catecholamine rise; can also be normal
      // rr / spo2 / bgl / temp omitted → largely normal (SpO₂ may sit at lower-normal)
    },
    sample: {
      symptoms:'Chest pain or discomfort; specific character depends on the presentation.',
      medications:'May be on antihypertensives, statins, or none.',
      pmh:'Possible hypertension, high cholesterol, smoking, diabetes, or previous cardiac history.',
      lastIntake:'A normal meal earlier in the day.',
    },
    // Pain-based: full OPQRST with the classic cardiac descriptors (heavy/crushing/tight,
    // radiating to arm/jaw). Quality deliberately uses cardiac language, NOT sharp/stabbing
    // (which clinically argues AGAINST ACS).
    opqrst: {
      onset:'Came on over a few minutes.',
      provocation:'Worse on exertion; not affected by breathing or movement.',
      quality:'Heavy, tight, pressure-like, "a weight on the chest".',
      radiates:'Into the left arm and up to the jaw.',
      severity:'7',
      time:'Ongoing for the last 20–40 minutes.',
    },
    reveal: {
      diagnosis:'Acute Coronary Syndrome (suspected). Classify on the 12-lead ECG. STEMI: ST elevation \u22652mm in V2/V3 or \u22651mm in two or more other contiguous leads, or new / presumably new LBBB with symptoms of acute MI. Otherwise treat as non-STEMI / unstable angina.',
      pathway:'Apply a 3-lead ECG and SpO\u2082 monitor, and consider oxygen (titrate SpO\u2082 94\u201398%, lower range if COPD). Give Aspirin 300mg PO, then acquire and interpret a 12-lead ECG. If there is chest pain, give GTN 400mcg SL and repeat PRN to a max of 1.2mg; if pain is not relieved, move to the Pain Management CPG. If STEMI is identified, assess time to a PPCI centre within 90 minutes of STEMI identification. If yes: discuss with the PPCI physician, give Ticagrelor 180mg PO, and transport to the Primary PCI facility. If no: give Clopidogrel 300mg PO (75mg PO if \u226575 years) and commence time-critical transport to the nearest appropriate hospital. If not a STEMI, commence time-critical transport to the nearest appropriate hospital.',
      interventions:'3-lead then early 12-lead ECG, SpO\u2082 monitoring, position of comfort, oxygen titrated only if needed, Aspirin PO, GTN SL for ongoing chest pain (with adequate blood pressure), the appropriate oral antiplatelet per the STEMI / PPCI pathway, continuous monitoring, pre-alert and rapid transport to the appropriate facility. Everything on this pathway is within Paramedic scope up to the PCI handover.',
      diagnosisBlocks: [
        { type:'lead', body:'Acute Coronary Syndrome (suspected). Classify on the 12-lead ECG.' },
        { type:'grade', label:'STEMI', sev:'sev', body:'ST elevation ≥2mm in V2/V3, or ≥1mm in two or more other contiguous leads, or new / presumably new LBBB with symptoms of acute MI.' },
        { type:'grade', label:'Non-STEMI / unstable angina', sev:'mod', body:'Otherwise, treat as non-STEMI / unstable angina.' },
      ],
      pathwayBlocks: [
        { type:'step', body:'Apply a 3-lead ECG and SpO₂ monitor. Consider oxygen (titrate SpO₂ 94–98%, lower range if COPD).' },
        { type:'step', body:'Give Aspirin 300mg PO, then acquire and interpret a 12-lead ECG.' },
        { type:'step', body:'If chest pain, give GTN 400mcg SL and repeat PRN to a max of 1.2mg. If pain not relieved, move to the Pain Management CPG.' },
        { type:'step', body:'If STEMI identified, assess time to a PPCI centre within 90 minutes of STEMI identification.' },
        { type:'branch', label:'PPCI reachable within 90 min', body:'Discuss with the PPCI physician, give Ticagrelor 180mg PO, transport to the Primary PCI facility.' },
        { type:'branch', label:'PPCI not reachable within 90 min', body:'Give Clopidogrel 300mg PO (75mg PO if ≥75 years), commence time-critical transport to the nearest appropriate hospital.' },
        { type:'note', body:'If not a STEMI, commence time-critical transport to the nearest appropriate hospital.' },
      ],
      interventionsBlocks: [
        { type:'step', body:'3-lead then early 12-lead ECG; SpO₂ monitoring.' },
        { type:'step', body:'Position of comfort; oxygen titrated only if needed.' },
        { type:'step', body:'Aspirin PO; GTN SL for ongoing chest pain (with adequate blood pressure).' },
        { type:'step', body:'Appropriate oral antiplatelet per the STEMI / PPCI pathway.' },
        { type:'step', body:'Continuous monitoring, pre-alert, and rapid transport to the appropriate facility.' },
        { type:'note', body:'Everything on this pathway is within Paramedic scope up to the PCI handover.' },
      ],
      drugs: [
        { name:'Aspirin',  paramedic:'300mg PO (chewed).' },
        { name:'GTN (Glyceryl Trinitrate)', paramedic:'400mcg SL, repeat PRN to a max of 1.2mg. For ongoing chest pain with adequate blood pressure.' },
        { name:'Oxygen (Consider)', paramedic:'Titrate to SpO\u2082 94\u201398% (lower range if COPD).' },
        { name:'Clopidogrel', paramedic:'300mg PO (75mg PO if \u226575 years). For the STEMI pathway when not going direct to primary PCI.' },
        { name:'Ticagrelor', paramedic:'180mg PO. For the STEMI pathway going to primary PCI, after discussion with the PPCI physician.' },
      ],
    },
  },

  {
    id: 'fbao',
    name: 'Foreign Body Airway Obstruction',
    category: 'Airway and Breathing',
    demographics: { minAge: 16, maxAge: 90, sex: 'any' },
    variants: [
      // All conscious. FBAO-specific teaching is the conscious pathway (encourage
      // cough / back blows / abdominal thrusts). Unconscious cases were removed
      // deliberately: they hand off to BLS/CPR, a different CPG not tested here.
      // Dispatches are mostly scene-based (not "choking") so the student does the
      // recognising rather than being handed the diagnosis.
      { cause:'severe obstruction, conscious (food bolus)', conscious:true,
        dispatch:'You are called to {location} for a PATIENT having difficulty breathing during a meal.',
        presentation:'Clutching at their throat, distressed and unable to speak, coughing weakly and ineffectively, lips dusky, eyes wide and frightened. Still conscious and trying to cough.',
        allergies:'No known drug allergies.',
        sample:{ symptoms:'Clutching the throat, unable to speak, coughing weakly with little air movement, lips dusky.', medications:'Nil of note.', pmh:'Nil of note.' },
        events:'Choked suddenly partway through a meal; bystanders saw them grab their throat and struggle to breathe.' },
      { cause:'severe obstruction, near-silent', conscious:true,
        dispatch:'You are called to {location} for a PATIENT in sudden respiratory distress, unable to talk.',
        presentation:'Silent, cannot cough or speak, gripping the throat, pale and panicked, making minimal air movement. Conscious but visibly tiring.',
        allergies:'No known drug allergies.',
        sample:{ symptoms:'Silent, unable to cough or speak, minimal air movement, pale and tiring, gripping the throat.', medications:'Nil of note.', pmh:'Nil of note.' },
        events:'Was eating when they suddenly went quiet and could not breathe; a bystander recognised choking and called immediately.' },
      { cause:'mild obstruction, effective cough', conscious:true,
        dispatch:'You are called to {location} for a PATIENT who is choking but still able to cough.',
        presentation:'Coughing forcefully and effectively, able to speak in short sentences between coughs, anxious but moving good air, colour normal. Airway partially obstructed but cough is effective.',
        allergies:'No known drug allergies.',
        sample:{ symptoms:'Coughing forcefully, able to speak in short sentences between coughs, good air movement, normal colour.', medications:'Nil of note.', pmh:'Nil of note.' },
        events:'Choked on food a few minutes ago and has been coughing hard since; able to tell you what happened.' },
      { cause:'severe obstruction, conscious (restaurant)', conscious:true,
        dispatch:'You are called to {location} for a PATIENT who suddenly cannot speak while eating out.',
        presentation:'Grasping at the throat, red-faced and panicking, unable to speak or cough effectively, but still conscious and upright. Severe obstruction, no effective air movement.',
        allergies:'No known drug allergies.',
        sample:{ symptoms:'Unable to speak or cough effectively, red-faced and grasping the throat, no effective air movement, still upright.', medications:'Nil of note.', pmh:'Nil of note.' },
        events:'Choking began suddenly on a large mouthful of food while eating out; bystanders recognised it immediately.' },
      { cause:'mild obstruction, forceful cough', conscious:true,
        dispatch:'You are called to {location} for a PATIENT coughing forcefully after eating.',
        presentation:'Coughing hard and able to speak between coughs, distressed but moving good air, colour normal. Effective cough, mild obstruction.',
        allergies:'No known drug allergies.',
        sample:{ symptoms:'Coughing hard, able to speak between coughs, moving good air, colour normal.', medications:'Nil of note.', pmh:'Nil of note.' },
        events:'Choked on a piece of food a few minutes ago and has been coughing strongly since, able to describe what happened.' },
      { cause:'severe obstruction, partially relieved', conscious:true,
        dispatch:'You are called to {location} for a choking PATIENT, bystanders are helping.',
        presentation:'Still distressed with an ineffective cough, some air movement after bystander back blows but the obstruction is not cleared, conscious and frightened. Severe and ongoing.',
        allergies:'No known drug allergies.',
        sample:{ symptoms:'Still distressed with a weak, ineffective cough, some air movement but obstruction not cleared.', medications:'Nil of note.', pmh:'Nil of note.' },
        events:'Choked on food; a bystander has been delivering back blows with partial effect, but the obstruction persists.' },
    ],
    painBased: false,   // FBAO is not a pain complaint → OPQRST shows honest negatives
    // ⚠️ PLACEHOLDER deviations — Keith approved direction; ranges paint a hypoxic
    // respiratory-distress picture. SpO₂ driven LOW (defining); HR/RR raised.
    deviations: {
      spo2: [84, 92],                    // hypoxia (absolute range)
      hr:  { dir:'up', intensity:0.5 },  // hypoxic/adrenergic tachycardia
      rr:  { dir:'up', intensity:0.5 },  // respiratory distress
      // bp / bgl / temp omitted → stay normal
    },
    sample: {
      symptoms:'Airway obstruction; effectiveness of the cough and air movement depend on severity.',
      medications:'None relevant / unknown.',
      pmh:'Nil of note.',
      lastIntake:'Was eating immediately before onset.',
    },
    opqrst: {
      onset:'Sudden, while eating.',
      provocation:'No pain, the problem is being unable to breathe.',
      quality:'No pain; a sense of choking / suffocation.',
      radiates:'No.',
      severity:'0',
      time:'Came on suddenly minutes ago.',
    },
    reveal: {
      diagnosis:'Foreign Body Airway Obstruction (FBAO). Grade by severity of obstruction, this drives everything. Mild (effective cough): can cough, speak or breathe, do not interfere, encourage coughing. Severe (ineffective cough): cannot cough effectively, speak or breathe, needs active intervention.',
      pathway:'Assess severity: ask "are you choking?" and judge the effectiveness of the cough. Mild, effective cough: encourage coughing, monitor for adequate ventilation and deterioration, consider oxygen therapy, transport. Severe, conscious: give 1–5 back blows, then 1–5 abdominal thrusts as indicated, reassessing after each; continue alternating while the patient remains conscious and the obstruction is unresolved. Severe, unconscious: request ALS, begin one cycle of CPR, and after each cycle open the mouth and look for the object (if visible, make one attempt to remove it); reassess effectiveness, and if still ineffective after CPR cycles go to the BLS Adult CPG. If ventilations are not adequate, deliver positive pressure ventilations at a maximum of 10 per minute, with oxygen therapy throughout.',
      interventions:'Recognise FBAO and assess severity (effective vs ineffective cough). Mild: encourage coughing, do not interfere, monitor. Severe / conscious: 1–5 back blows then 1–5 abdominal thrusts, alternating, reassessing after each. Severe / unconscious: request ALS, commence CPR, check the mouth after each cycle and remove a visible object with one attempt. Support ventilation with PPV (max 10/min) if inadequate; oxygen therapy throughout; transport. Laryngoscopy, Magill forceps, intubation and needle cricothyrotomy are Advanced Paramedic interventions and outside this pathway.',
      diagnosisBlocks: [
        { type:'lead', body:'Foreign Body Airway Obstruction (FBAO). Grade by severity of obstruction, this drives everything.' },
        { type:'grade', label:'Mild (effective cough)', sev:'mild', body:'Can cough, speak or breathe. Do NOT interfere, encourage coughing.' },
        { type:'grade', label:'Severe (ineffective cough)', sev:'sev', body:'Cannot cough effectively, speak or breathe; silent or weak cough, cyanosis, distress. Needs active intervention.' },
      ],
      pathwayBlocks: [
        { type:'lead', body:'Assess severity: ask "are you choking?" and judge the effectiveness of the cough.' },
        { type:'branch', label:'Mild, effective cough', body:'Encourage coughing. Monitor for adequate ventilation and deterioration. Consider oxygen therapy. Transport.' },
        { type:'branch', label:'Severe, conscious', body:'Give 1–5 back blows, then 1–5 abdominal thrusts as indicated. Reassess after each. Continue alternating while the patient remains conscious and the obstruction is unresolved.' },
        { type:'branch', label:'Severe, unconscious', body:'Request ALS. Begin one cycle of CPR. After each cycle, open the mouth and look for the object, if visible, make one attempt to remove it. Reassess effectiveness; if still ineffective after CPR cycles, go to the BLS Adult CPG.' },
        { type:'note', label:'Ventilation', body:'If ventilations are not adequate, deliver positive pressure ventilations at a maximum of 10 per minute. Provide oxygen therapy throughout.' },
        { type:'note', label:'After each cycle of CPR', body:'Open the mouth and look for the object; if visible, make one attempt to remove it.' },
      ],
      interventionsBlocks: [
        { type:'step', body:'Recognise FBAO and assess severity (effective vs ineffective cough).' },
        { type:'step', body:'Mild / effective cough, encourage coughing, do not interfere, monitor.' },
        { type:'step', body:'Severe / conscious, 1–5 back blows then 1–5 abdominal thrusts, alternating, reassessing after each.' },
        { type:'step', body:'Severe / unconscious, request ALS, commence CPR, check the mouth after each cycle and remove a visible object with one attempt.' },
        { type:'step', body:'Support ventilation with PPV (max 10/min) if inadequate; oxygen therapy throughout; transport.' },
        { type:'note', body:'Laryngoscopy, Magill forceps, intubation and needle cricothyrotomy are Advanced Paramedic interventions and are outside this (EMT/P) pathway.' },
      ],
      drugs: [
        { name:'Oxygen therapy', adult:{ paramedic:'High-flow oxygen as required to maintain adequate saturations; consider throughout.' } },
      ],
    },
  },

  {
    id: 'copd',
    name: 'Exacerbation of COPD',
    category: 'Airway and Breathing',
    demographics: { minAge: 45, maxAge: 90, sex: 'any' },
    variants: [
      // severity 0-1 drives SpO2 within spo2Severe[78,88]: higher = sicker = lower SpO2.
      { cause:'infective exacerbation, known COPD', conscious:true, severity:0.3,
        dispatch:'You are called to {location} for a PATIENT who is short of breath.',
        presentation:'Sitting upright, working hard to breathe with pursed lips, audible wheeze, productive cough with discoloured sputum, able to speak only in short phrases. Alert and oriented.',
        allergies:'No known drug allergies.',
        sample:{ symptoms:'Increased breathlessness and wheeze with a productive cough of green sputum over several days.', medications:'Spiriva, Symbicort, and Ventolin.', pmh:'COPD with frequent chest infections; ex-smoker.' },
        events:'Known COPD; a chest infection over the last few days has left them increasingly breathless, with more sputum than usual.' },
      { cause:'gradual worsening, home oxygen', conscious:true, severity:0.35,
        dispatch:'You are called to {location} for a PATIENT with worsening breathlessness.',
        presentation:'Breathless at rest, using accessory muscles, wheeze on auscultation, anxious but alert. Has a home oxygen concentrator and an oxygen alert card.',
        allergies:'No known drug allergies.',
        sample:{ symptoms:'Breathlessness at rest with wheeze, steadily worse over two days despite home oxygen.', medications:'Home oxygen, Spiriva, Seretide, and Ventolin.', pmh:'Severe COPD on long-term home oxygen; ex-smoker.' },
        events:'Long-standing COPD on home oxygen; breathing has deteriorated steadily over two days despite their usual inhalers.' },
      { cause:'cold-triggered exacerbation', conscious:true, severity:0.4,
        dispatch:'You are called to {location} for a PATIENT struggling to breathe.',
        presentation:'Visibly breathless, leaning forward on their knees (tripod position), prolonged expiratory wheeze, able to answer in short sentences. Alert, anxious, tiring.',
        allergies:'No known drug allergies.',
        sample:{ symptoms:'Acute wheeze and breathlessness with a prolonged expiratory phase.', medications:'Symbicort and Ventolin.', pmh:'COPD; current smoker.' },
        events:'Known COPD; went out in cold weather and became acutely wheezy and breathless, not relieved by their own inhaler.' },
      { cause:'severe, deteriorating despite nebulisers', conscious:true, severity:0.75,
        dispatch:'You are called to {location} for a PATIENT in severe respiratory distress.',
        presentation:'Severely breathless, exhausted, barely able to speak, silent chest in places, drowsy at the edges but still rousable and answering. Not improving with bronchodilators.',
        allergies:'No known drug allergies.',
        sample:{ symptoms:'Severe breathlessness, exhaustion, barely able to speak, with a silent chest in places.', medications:'Spiriva, Symbicort, Ventolin, and Uniphyllin.', pmh:'Severe COPD with previous ICU admission; ex-smoker.' },
        events:'Known severe COPD; this exacerbation is worse than usual and has not responded to repeated nebulisers, with the patient tiring.' },
      { cause:'hypoxic exacerbation, no alert card', conscious:true, severity:0.65,
        dispatch:'You are called to {location} for a breathless PATIENT.',
        presentation:'Breathless and cyanosed at the lips, wheezy, working hard, alert but clearly hypoxic. No oxygen alert card available.',
        allergies:'No known drug allergies.',
        sample:{ symptoms:'Breathless and cyanosed at the lips, wheezy and working hard, clearly hypoxic.', medications:'The brown and blue inhalers, not sure of the names, and a water tablet.', pmh:'COPD and heart failure; ex-smoker.' },
        events:'Known COPD, increasingly breathless today; does not carry an oxygen alert card.' },
      { cause:'profound exacerbation, peri-arrest', conscious:false, severity:1.0,
        dispatch:'You are called to {location} for an unresponsive PATIENT with breathing difficulty.',
        presentation:'Barely responsive, exhausted from the work of breathing, shallow ineffective respirations, deeply cyanosed. Profound refractory hypoxia.',
        allergies:'No known drug allergies.',
        events:'Known severe COPD; deteriorated rapidly to near-unresponsive despite treatment.' },
    ],
    painBased: false,   // breathlessness, not pain → OPQRST shows honest negatives
    deviations: {
      spo2Severe: [78, 88],               // SpO2 band; biased by variant.severity (sicker = lower)
      rr:  { dir:'up', intensity:0.55 },  // respiratory distress / accessory muscle use
      hr:  { dir:'up', intensity:0.45 },  // hypoxia, β-agonist, work of breathing
      // bp / bgl / temp omitted → stay normal
    },
    sample: {
      symptoms:'Worsening breathlessness; specific features depend on the exacerbation.',
      medications:'Inhalers (bronchodilators, steroids); some on home oxygen.',
      pmh:'Chronic Obstructive Pulmonary Disease, often with a smoking history.',
      lastIntake:'Not relevant to the complaint.',
    },
    opqrst: {
      onset:'Came on over hours to days, worsening.',
      provocation:'No pain, worse on exertion and lying flat; eased a little sitting up.',
      quality:'No pain; breathlessness and chest tightness.',
      radiates:'No.',
      severity:'0',
      time:'Building over the last day or two, worse today.',
    },
    reveal: {
      diagnosis:'Exacerbation of COPD: acute worsening of breathlessness in a patient with known COPD. Confirm the history of COPD, if absent, this is not the pathway (go to Abnormal Work of Breathing CPG). Oxygen target in COPD is SpO₂ 92%, over-oxygenation can be harmful. If an O₂ alert card is issued, follow its directions; if none, commence at 28%.',
      pathway:'Confirm a history of COPD. If no COPD history, go to the Abnormal Work of Breathing CPG. Oxygen therapy: if an O₂ alert card is issued, follow its directions; if no alert card, commence at 28%; titrate O₂ to SpO₂ 92%. ECG and SpO₂ monitoring. Salbutamol 5mg NEB, if no improvement, may repeat at 5-minute intervals. Add Ipratropium Bromide 500mcg NEB mixed with Salbutamol 5mg NEB. If the patient deteriorates or is unstable: request ALS and give Hydrocortisone 200mg IM (Paramedic), or 200mg IV in 100mL NaCl 0.9% or IM (AP). Consider CPAP for profound refractory hypoxia. If ventilation is not adequate, go to the Abnormal Work of Breathing CPG; if adequate, transport.',
      interventions:'Confirm COPD history; if absent, go to Abnormal Work of Breathing CPG. Oxygen titrated to SpO₂ 92% (alert-card directions, or 28% if none); ECG and SpO₂ monitoring. Salbutamol 5mg NEB, repeated at 5-minute intervals if no improvement. Add Ipratropium Bromide 500mcg NEB mixed with Salbutamol. If deteriorating/unstable, request ALS and give Hydrocortisone (IM Paramedic, IV AP). Consider CPAP for profound refractory hypoxia. Reassess ventilation; transport.',
      diagnosisBlocks: [
        { type:'lead', body:'Exacerbation of COPD: acute worsening of breathlessness in a patient with known COPD. Confirm the history of COPD, if absent, this is not the pathway (go to Abnormal Work of Breathing CPG).' },
        { type:'note', label:'Oxygen target', body:'Oxygen target in COPD is SpO₂ 92%, over-oxygenation can be harmful. If an O₂ alert card is issued, follow its directions; if none, commence at 28%.' },
      ],
      pathwayBlocks: [
        { type:'lead', body:'Confirm a history of COPD. If no COPD history, go to the Abnormal Work of Breathing CPG.' },
        { type:'step', body:'Oxygen therapy, if an O₂ alert card is issued, follow its directions; if no alert card, commence at 28%; titrate O₂ to SpO₂ 92%.' },
        { type:'step', body:'ECG and SpO₂ monitoring.' },
        { type:'step', body:'Salbutamol 5mg NEB. If no improvement, may repeat at 5-minute intervals.' },
        { type:'step', body:'Ipratropium Bromide 500mcg NEB mixed with Salbutamol 5mg NEB.' },
        { type:'branch', label:'Deteriorates / unstable', body:'Request ALS. Give Hydrocortisone 200mg IM (Paramedic), or 200mg IV in 100mL NaCl 0.9% or IM (AP only).' },
        { type:'note', label:'Consider CPAP', body:'Consider CPAP for profound refractory hypoxia (Paramedic).' },
        { type:'note', label:'Adequate ventilation?', body:'If not adequate, go to the Abnormal Work of Breathing CPG. If adequate, transport.' },
      ],
      interventionsBlocks: [
        { type:'step', body:'Confirm COPD history; if absent, go to the Abnormal Work of Breathing CPG.' },
        { type:'step', body:'Oxygen titrated to SpO₂ 92% (alert-card directions, or 28% if none); ECG and SpO₂ monitoring.' },
        { type:'step', body:'Salbutamol 5mg NEB, repeated at 5-minute intervals if no improvement.' },
        { type:'step', body:'Add Ipratropium Bromide 500mcg NEB mixed with Salbutamol.' },
        { type:'step', body:'If deteriorating / unstable, request ALS and give Hydrocortisone (IM Paramedic, IV AP only).' },
        { type:'note', body:'Consider CPAP for profound refractory hypoxia. Reassess ventilation; transport.' },
      ],
      drugs: [
        { name:'Oxygen therapy', adult:{ paramedic:'If O₂ alert card issued, follow its directions; if none, commence at 28%; titrate to SpO₂ 92%.' } },
        { name:'Salbutamol', adult:{ paramedic:'5mg NEB. Repeat at 5-minute intervals if no improvement.' } },
        { name:'Ipratropium Bromide', adult:{ paramedic:'500mcg NEB, mixed with Salbutamol 5mg NEB.' } },
        { name:'Hydrocortisone', adult:{ paramedic:'200mg IM. For the deteriorating/unstable patient.', ap:'200mg IV in 100mL NaCl 0.9%, or IM.' } },
      ],
    },
  },

  {
    id: 'nausea',
    name: 'Significant Nausea & Vomiting',
    category: 'Medical',
    demographics: { minAge: 16, maxAge: 90, sex: 'any' },
    variants: [
      // All conscious. Variants differ by underlying CAUSE, not severity — the
      // teaching point is "treat the cause", and the antiemetic choice is left
      // open for the student to justify in the debrief (reveal is cause-neutral).
      { cause:'gastroenteritis', conscious:true,
        dispatch:'You are called to {location} for a PATIENT with persistent vomiting.',
        presentation:'Pale and clammy, repeated vomiting, mild diffuse abdominal cramps, alert and able to give a history. Looks tired and a little dehydrated.',
        allergies:'No known drug allergies.',
        sample:{ symptoms:'Repeated vomiting with some diarrhoea, pale and clammy, mild diffuse abdominal cramps.', medications:'Nil regular.', pmh:'Usually fit and well.' },
        events:'Several hours of repeated vomiting and some diarrhoea; others at home have been unwell similarly.' },
      { cause:'migraine-associated', conscious:true,
        dispatch:'You are called to {location} for a PATIENT feeling very sick with a severe headache.',
        presentation:'Nauseated and vomiting, photophobic, holding their head, wants the lights off. Alert and oriented.',
        allergies:'No known drug allergies.',
        sample:{ symptoms:'Nausea and vomiting with photophobia, holding the head, wants the lights off.', medications:'Imigran for migraines.', pmh:'Recurrent migraines.' },
        events:'Severe one-sided headache came on over the morning with nausea and vomiting; has had migraines before.' },
      { cause:'medication-related', conscious:true,
        dispatch:'You are called to {location} for a PATIENT who is nauseated and vomiting.',
        presentation:'Nauseated, intermittently vomiting, otherwise settled and alert, no abdominal pain of note.',
        allergies:'No known drug allergies.',
        sample:{ symptoms:'Persistent nausea with intermittent vomiting, no abdominal pain, otherwise settled.', medications:'Oramorph, recently started for an injury.', pmh:'Recent injury.' },
        events:'Recently started strong painkillers for an injury and has felt progressively nauseous and been vomiting since.' },
      { cause:'vertigo-associated', conscious:true,
        dispatch:'You are called to {location} for a PATIENT who is dizzy and vomiting.',
        presentation:'Nauseated and vomiting, severe dizziness made worse by movement, prefers to lie still, alert. No focal weakness.',
        allergies:'No known drug allergies.',
        sample:{ symptoms:'Nausea and vomiting with severe dizziness worse on movement, prefers to lie still.', medications:'Stemetil, taken occasionally for dizziness.', pmh:'Previous episodes of vertigo.' },
        events:'Sudden severe spinning sensation with nausea and repeated vomiting; worse on moving the head.' },
      { cause:'post-procedure', conscious:true,
        dispatch:'You are called to {location} for a PATIENT vomiting after a recent procedure.',
        presentation:'Nauseated and vomiting, uncomfortable but alert, otherwise settled.',
        allergies:'No known drug allergies.',
        sample:{ symptoms:'Nausea and vomiting, uncomfortable, otherwise settled and alert.', medications:'Nil regular.', pmh:'Day procedure earlier today under sedation.' },
        events:'Had a minor procedure earlier today and has been persistently nauseated and vomiting since getting home.' },
      { cause:'pregnancy-associated', conscious:true,
        dispatch:'You are called to {location} for a PATIENT with severe vomiting.',
        presentation:'Persistently vomiting, unable to keep fluids down, tired and dehydrated, alert and oriented.',
        allergies:'No known drug allergies.',
        sample:{ symptoms:'Persistent vomiting, unable to keep fluids down, tired and dehydrated.', medications:'Clonfolic (folic acid).', pmh:'Early pregnancy.' },
        // BP held normal-to-low (dehydration from vomiting). Explicitly capped so an
        // early-pregnancy patient never reads with a raised BP, which could wrongly
        // suggest pre-eclampsia, a different pathway not being tested here.
        vitalsOverride:{ hr:{ dir:'up', intensity:0.35 }, bpSys:{ dir:'down', intensity:0.2 }, bpDia:{ dir:'down', intensity:0.2 } },
        events:'Several days of worsening nausea and vomiting in early pregnancy, now unable to keep anything down.' },
    ],
    painBased: false,   // nausea/vomiting, not a pain complaint → OPQRST honest negatives
    deviations: {
      hr: { dir:'up', intensity:0.3 },   // mild dehydration/distress tachycardia; everything else normal
      // rr / bp / spo2 / temp / bgl omitted → normal. BGL normal but "checked" per CPG.
    },
    sample: {
      symptoms:'Nausea and repeated vomiting; specific features depend on the cause.',
      medications:'Cause-dependent (e.g. recent opioids); otherwise nil of note.',
      pmh:'Cause-dependent; often nil of note.',
      lastIntake:'Often poor oral intake / unable to keep food or fluids down.',
    },
    opqrst: {
      onset:'Came on over the last while.',
      provocation:'Often worse with movement or smells; no pain as the main complaint.',
      quality:'Nausea and vomiting; not a pain complaint.',
      radiates:'No.',
      severity:'0',
      time:'Building or recurring over hours.',
    },
    reveal: {
      diagnosis:'Significant Nausea & Vomiting. This is a SYMPTOM, not a diagnosis, the priority is to investigate and treat the underlying cause, while managing the nausea and preventing complications such as dehydration and aspiration. Always check blood glucose and consider the range of causes (gastroenteritis, migraine, medication, vertigo, pregnancy, abdominal or cardiac pathology, raised intracranial pressure, and others).',
      pathway:'Manage symptomatically while investigating the cause. Consider oxygen therapy. Check blood glucose. Investigate and treat the underlying cause. Consider an antiemetic, Cyclizine 50mg slow IV or IM, OR Ondansetron 4mg IM (slow IV is AP). ECG and SpO₂ monitoring. Transport. The choice of antiemetic is a clinical decision based on the cause and patient factors, there is no single correct answer.',
      interventions:'Consider oxygen therapy and position the patient safely (aspiration risk if vomiting and drowsy). Check blood glucose. Investigate and treat the underlying cause, nausea and vomiting is a symptom, not a diagnosis. Consider an antiemetic (Cyclizine or Ondansetron) per scope and patient factors. ECG and SpO₂ monitoring; transport.',
      diagnosisBlocks: [
        { type:'lead', body:'Significant Nausea & Vomiting. This is a symptom, not a diagnosis, the priority is to investigate and treat the underlying cause, while managing the nausea and preventing complications (dehydration, aspiration).' },
        { type:'note', label:'Consider the cause', body:'Always check blood glucose and consider the range of causes: gastroenteritis, migraine, medication, vertigo, pregnancy, abdominal or cardiac pathology, raised intracranial pressure, and others.' },
      ],
      pathwayBlocks: [
        { type:'lead', body:'Manage symptomatically while investigating the cause.' },
        { type:'step', body:'Consider oxygen therapy.' },
        { type:'step', body:'Check blood glucose.' },
        { type:'step', body:'Investigate and treat the underlying cause.' },
        { type:'step', body:'Consider an antiemetic, Cyclizine 50mg slow IV or IM; or Ondansetron 4mg IM (slow IV is AP only).' },
        { type:'step', body:'ECG and SpO₂ monitoring. Transport.' },
        { type:'note', label:'Antiemetic choice is yours to justify', body:'There is no single correct antiemetic here. The choice depends on the underlying cause, patient factors and contraindications (for example pregnancy, or drug interactions). Be ready to justify your choice in the debrief.' },
      ],
      interventionsBlocks: [
        { type:'step', body:'Consider oxygen therapy; position the patient safely (aspiration risk if vomiting and drowsy).' },
        { type:'step', body:'Check blood glucose.' },
        { type:'step', body:'Investigate and treat the underlying cause, nausea and vomiting is a symptom, not a diagnosis.' },
        { type:'step', body:'Consider an antiemetic (Cyclizine or Ondansetron) per scope and patient factors.' },
        { type:'step', body:'ECG and SpO₂ monitoring; transport.' },
        { type:'note', body:'The antiemetic decision is a clinical judgement, not a fixed answer, justify it against the cause and patient factors in the debrief.' },
      ],
      drugs: [
        { name:'Oxygen therapy (consider)', adult:{ paramedic:'Consider; titrate to adequate saturations.' } },
        { name:'Cyclizine (option)', adult:{ paramedic:'50mg slow IV/IO, or 50mg IM.' } },
        { name:'Ondansetron (option)', adult:{ paramedic:'4mg IM.', ap:'4mg slow IV.' } },
      ],
    },
  },

  {
    id: 'burns',
    name: 'Burns',
    category: 'Trauma',
    locationBias: ['domestic', 'workplace'],
    demographics: { minAge: 16, maxAge: 90, sex: 'any' },
    variants: [
      { cause:'scald burn', conscious:true,
        dispatch:'You are called to {location} for a PATIENT who has been burned.',
        presentation:'Painful reddened and blistered burn to the forearm from hot liquid, alert and distressed, skin intact elsewhere. Limited area.',
        allergies:'No known drug allergies.',
        sample:{ symptoms:'Reddened, blistered, moist and very painful burn to the forearm, skin intact elsewhere.', medications:'Nil regular.', pmh:'Usually fit and well.' },
        events:'Spilled boiling water over the forearm a short time ago.' },
      { cause:'flame burn, larger area', conscious:true,
        dispatch:'You are called to {location} for a PATIENT with burns.',
        presentation:'Painful partial-thickness burns across an arm and the chest, sooty, alert, in significant pain. Larger surface area involved.',
        allergies:'No known drug allergies.',
        sample:{ symptoms:'Painful, blistered and reddened burns across an arm and the chest, sooty, with some paler, drier patches.', medications:'Nil regular.', pmh:'Usually fit and well.' },
        events:'Clothing caught fire; burns to arm and torso, brought out by bystanders.' },
      { cause:'burn with inhalation injury', conscious:true,
        dispatch:'You are called to {location} for a PATIENT having difficulty breathing after a fire.',
        presentation:'Facial burns, singed nasal hair, soot around the mouth, hoarse voice and coughing, alert but with audible airway noise. Hypoxic.',
        allergies:'No known drug allergies.',
        sample:{ symptoms:'Facial burns, singed nasal hair, soot around the mouth, hoarse voice and cough, audible airway noise.', medications:'Nil regular.', pmh:'Usually fit and well.' },
        events:'Trapped briefly in a smoke-filled room; facial burns and a hoarse cough.',
        // inhalation-only: hypoxic but not shocked. Override drops SpO2, mild HR/RR rise.
        vitalsOverride:{ spo2:[88,93], hr:{ dir:'up', intensity:0.4 }, rr:{ dir:'up', intensity:0.4 } } },
      { cause:'chemical burn', conscious:true,
        dispatch:'You are called to {location} for a PATIENT with a painful injury to the arm.',
        presentation:'Painful burn to the hand and forearm from a corrosive substance, alert, residual powder/liquid on the skin. Ongoing pain.',
        allergies:'No known drug allergies.',
        sample:{ symptoms:'Painful burn to the hand and forearm with residual powder on the skin, some areas pale and leathery.', medications:'Nil regular.', pmh:'Works with industrial chemicals.' },
        events:'Splashed an industrial chemical on the arm; some powder still present on the skin.' },
      { cause:'electrical burn', conscious:true,
        dispatch:'You are called to {location} for a PATIENT injured at work.',
        presentation:'Entry and exit burn wounds on the hand and foot, alert, in pain. Deceptively small skin marks.',
        allergies:'No known drug allergies.',
        sample:{ symptoms:'Small, dry, charred wounds on the hand and foot with surrounding numbness, deceptively minor-looking.', medications:'Nil regular.', pmh:'Works as an electrician.' },
        events:'Received an electric shock; small but deep burn marks where current entered and exited.' },
      { cause:'large burn with inhalation, severe', conscious:true,
        dispatch:'You are called to {location} for a critically injured PATIENT.',
        presentation:'Extensive burns over more than a quarter of the body with facial burns, soot and a singed airway, drowsy but rousable, breathing fast and poorly perfused. Hypotensive, tachycardic and hypoxic, airway needs close watching.',
        allergies:'No known drug allergies.',
        sample:{ symptoms:'Extensive burns over more than a quarter of the body with mixed blistered and dry, leathery areas, facial burns, soot and singed airway, drowsy and poorly perfused.', medications:'Nil regular.', pmh:'Usually fit and well.' },
        events:'Caught in a house fire with extensive flame burns and smoke inhalation; severely unwell.',
        // catastrophic: large burn + inhalation. Hypotensive, big HR/RR, low SpO2.
        // Kept conscious (drowsy but rousable) so the scenario stays on the burns
        // pathway rather than tipping toward the airway/AWB protocol.
        vitalsOverride:{
          spo2:[80,87],
          hr:  { dir:'up', intensity:0.7 },
          rr:  { dir:'up', intensity:0.7 },
          bpSys:{ dir:'down', intensity:0.45 },
          bpDia:{ dir:'down', intensity:0.45 },
        } },
    ],
    painBased: true,   // burns are painful → OPQRST carries real pain values
    deviations: {
      hr: { dir:'up', intensity:0.45 },   // pain-driven tachycardia (baseline burns picture)
      rr: { dir:'up', intensity:0.3 },    // pain/distress
      // bp/spo2/temp/bgl normal by default; sick variants override above
    },
    sample: {
      symptoms:'Painful burn; features depend on the burn and its depth.',
      medications:'Cause-dependent; often nil of note.',
      pmh:'Cause-dependent; often nil.',
      lastIntake:'Not relevant to the complaint.',
    },
    opqrst: {
      onset:'Sudden, at the time of the burn.',
      provocation:'Worse with movement and exposure; some relief with cooling.',
      quality:'Burning pain at the injury site.',
      radiates:'Localised to the burn.',
      severity:'7',
      time:'Since the time of injury.',
    },
    reveal: {
      diagnosis:'Burn / scald injury. Priorities: stop the burning, protect the airway (especially with inhalation or facial injury), cool the burn, assess size and depth, manage pain, and prevent hypothermia. Significant areas (FHFFP): face, hands, feet, flexion points, perineum. Caution with the elderly, and with circumferential and electrical burns.',
      pathway:'Cease contact with the heat source. If inhalation and/or facial injury, manage the airway, and if respiratory distress go to the Abnormal Work of Breathing CPG; consider humidified oxygen therapy. Commence local cooling of the burn area; brush off powder and irrigate chemical burns (follow local expert direction). Remove burned clothing and jewellery unless stuck, and dress the burn area. If pain is greater than 2/10, go to the Pain Management CPG. Assess whether this is an isolated superficial injury (excluding FHFFP) or TBSA greater than 10%. If TBSA greater than 10%, request ALS and commence ECG and SpO₂ monitoring. Fluids (AP): consider NaCl 0.9% 500mL IV/IO; give 1000mL IV/IO if TBSA greater than 25% or time from injury to ED greater than 1 hour. Monitor body temperature, cooling further during packaging and transfer but with caution for hypothermia. Transport.',
      interventions:'Stop the burning process and ensure scene safety. Manage the airway first if there is inhalation or facial injury; humidified oxygen. Cool the burn; brush off and irrigate chemicals per local direction. Remove clothing and jewellery unless stuck, and dress the burn. Manage pain (Pain Management CPG if greater than 2/10). Assess TBSA; request ALS and consider IV fluids (AP) for large burns; monitor temperature; transport.',
      diagnosisBlocks: [
        { type:'lead', body:'Burn / scald injury. Priorities: stop the burning, protect the airway (especially with inhalation or facial injury), cool the burn, assess size and depth, manage pain, and prevent hypothermia.' },
        { type:'note', label:'Significant areas (FHFFP)', body:'Face, hands, feet, flexion points, perineum. Caution with the elderly, and with circumferential and electrical burns.' },
      ],
      pathwayBlocks: [
        { type:'lead', body:'Cease contact with the heat source.' },
        { type:'branch', label:'Inhalation and/or facial injury', body:'Manage the airway; if respiratory distress, go to the Abnormal Work of Breathing CPG. Consider humidified oxygen therapy.' },
        { type:'step', body:'Commence local cooling of the burn area. Brush off powder and irrigate chemical burns (follow local expert direction).' },
        { type:'step', body:'Remove burned clothing and jewellery unless stuck. Dress and cover the burn area.' },
        { type:'branch', label:'Pain > 2/10', body:'Go to the Pain Management CPG.' },
        { type:'step', body:'Assess: isolated superficial injury (excluding FHFFP) versus TBSA > 10%.' },
        { type:'branch', label:'TBSA > 10%', body:'Request ALS; commence ECG and SpO₂ monitoring.' },
        { type:'branch', label:'Fluids (AP only)', body:'Consider NaCl 0.9% 500mL IV/IO; give 1000mL IV/IO if TBSA > 25% or time from injury to ED > 1 hour.' },
        { type:'note', label:'Temperature', body:'Monitor body temperature. Cool further during packaging and transfer, but with caution for hypothermia. Transport.' },
      ],
      interventionsBlocks: [
        { type:'step', body:'Stop the burning process; ensure scene safety.' },
        { type:'step', body:'Manage the airway first if inhalation or facial injury; humidified oxygen.' },
        { type:'step', body:'Cool the burn; brush off and irrigate chemicals per local direction.' },
        { type:'step', body:'Remove clothing and jewellery (unless stuck); dress the burn.' },
        { type:'step', body:'Manage pain (Pain Management CPG if > 2/10).' },
        { type:'step', body:'Assess TBSA; request ALS and consider IV fluids (AP) for large burns; monitor temperature; transport.' },
      ],
      drugs: [
        { name:'Oxygen therapy (humidified)', adult:{ paramedic:'Consider, especially with inhalation or facial injury.' } },
        { name:'NaCl 0.9% (fluids)', adult:{ ap:'Consider 500mL IV/IO; 1000mL IV/IO if TBSA > 25% or > 1 hour from injury to ED.' } },
      ],
    },
  },

  {
    id: 'stroke',
    name: 'Stroke',
    category: 'Neurological',
    demographics: { minAge: 45, maxAge: 95, sex: 'any' },
    variants: [
      // All conscious. Variants differ by stroke presentation / FAST findings.
      // Dispatches are scene-based / caller's-words (no "weakness") so the student
      // performs FAST recognition rather than being handed the cardinal sign.
      { cause:'right-hemisphere stroke, left-sided weakness', conscious:true, witness:'witnessed', onsetWhen:'about 40 minutes ago',
        dispatch:'You are called to {location} for a PATIENT who has suddenly become unwell down one side.',
        presentation:'Sudden left-sided facial droop and left arm weakness, slurred speech, alert and frightened. Symptoms began clearly within the last hour.',
        allergies:'No known drug allergies.',
        sample:{ symptoms:'Left-sided facial droop, left arm weakness, and slurred speech.', medications:'Eliquis for atrial fibrillation, and Tritace for blood pressure.', pmh:'Atrial fibrillation and high blood pressure.' },
        events:'Was well, then suddenly developed a drooping face and a weak arm on the left side; onset time is known and recent.' },
      { cause:'left-hemisphere stroke, speech affected', conscious:true, witness:'witnessed', onsetWhen:'about half an hour ago',
        dispatch:'You are called to {location} for a PATIENT who cannot speak properly.',
        presentation:'Sudden difficulty speaking and understanding, right-sided facial droop, right arm drift, alert. Clear recent onset.',
        allergies:'Penicillin.',
        sample:{ symptoms:'Difficulty speaking and understanding, right-sided facial droop, and right arm drift.', medications:'Plavix, Lipitor, and Coversyl.', pmh:'A previous TIA two years ago, high cholesterol, and high blood pressure.' },
        events:'Suddenly unable to get words out and not following conversation; family noted the exact time it started a short while ago.' },
      { cause:'wake-up stroke, uncertain onset', conscious:true, witness:'witnessed', wakeUp:true,
        dispatch:'You are called to {location} for a PATIENT who woke up not right this morning.',
        presentation:'Facial droop and arm weakness noticed on waking, alert. Last known well was the night before, so the onset time is uncertain.',
        allergies:'No known drug allergies.',
        sample:{ symptoms:'Facial droop and one-sided arm weakness, noticed on waking.', medications:'A few tablets, a water tablet and something for diabetes, not sure of the names. The blister pack says Glucophage and Lasix.', pmh:'Type 2 diabetes and heart failure.' },
        events:'Went to bed well and woke with one-sided weakness; cannot say when within the night it started.' },
      { cause:'transient symptoms, resolving', conscious:true, witness:'witnessed', onsetWhen:'about half an hour ago', improving:true,
        dispatch:'You are called to {location} for a PATIENT whose family are worried after a sudden change.',
        presentation:'Had facial droop and arm weakness that is now largely resolved, alert and back to near-normal. FAST now only subtly positive.',
        allergies:'No known drug allergies.',
        sample:{ symptoms:'Facial droop and arm weakness that have now largely resolved; only subtle residual signs.', medications:'Xarelto and Istin.', pmh:'Atrial fibrillation and high blood pressure.' },
        events:'Sudden weakness and slurred speech that has been improving over the last half hour.' },
      { cause:'posterior circulation stroke', conscious:true, witness:'unwitnessed',
        dispatch:'You are called to {location} for a PATIENT who is dizzy and unsteady.',
        presentation:'Sudden severe dizziness, unsteadiness and visual disturbance, alert. FAST may be subtle, the deficit is balance and coordination.',
        allergies:'No known drug allergies.',
        sample:{ symptoms:'Severe dizziness, unsteadiness, and visual disturbance; limb strength relatively preserved.', medications:'Aspirin and Lipitor.', pmh:'High cholesterol; smoker.' },
        events:'Found alone, unable to walk straight with severe vertigo and double vision; no one witnessed exactly when it began.' },
      { cause:'large stroke, severe deficit', conscious:true, witness:'unwitnessed',
        dispatch:'You are called to {location} for a drowsy PATIENT whose face has dropped on one side.',
        presentation:'Drowsy but rousable, obvious facial asymmetry, dense one-sided weakness, slow to respond and airway needs watching. Severe deficit.',
        allergies:'No known drug allergies.',
        sample:{ symptoms:'Marked facial asymmetry, dense one-sided weakness, and reduced responsiveness.', medications:'Marevan, Cardicor, Lasix, and Lanoxin.', pmh:'Atrial fibrillation, heart failure, and a previous stroke.' },
        events:'Found alone with a dense one-sided weakness, a facial droop and increasing drowsiness; the time of onset is unwitnessed.' },
    ],
    painBased: false,   // stroke is not a pain complaint → OPQRST shows honest negatives
    deviations: {
      bpSys: { dir:'up', intensity:0.4 },   // hypertension common in acute stroke (and a risk-factor breadcrumb)
      bpDia: { dir:'up', intensity:0.4 },
      // hr/rr/spo2/temp/bgl normal; neuro deficit lives in the presentation text, not the vitals
    },
    sample: {
      symptoms:'Focal neurological deficit; specific findings depend on the area affected.',
      medications:'Often anticoagulants, antiplatelets, or antihypertensives.',
      pmh:'Hypertension, atrial fibrillation, prior stroke or TIA, diabetes.',
      lastIntake:'Note the last-known-well time, it is relevant to the treatment window.',
    },
    opqrst: {
      onset:'Sudden onset of neurological symptoms (note the time).',
      provocation:'No pain as the chief complaint; the deficits are constant.',
      quality:'Neurological deficit (weakness, speech, balance), not pain.',
      radiates:'No.',
      severity:'0',
      time:'Note the time of onset or last known well, this drives the pathway.',
    },
    reveal: {
      diagnosis:'Suspected stroke: an acute neurological deficit. Obtain GCS and perform a FAST assessment. Always check blood glucose, as hypoglycaemia is a stroke mimic. FAST: Face (droop), Arms (drift or weakness), Speech (slurred or difficulty), Time (of onset, the critical variable).',
      pathway:'Obtain GCS and perform a FAST assessment. If FAST positive, maintain the airway and give oxygen therapy. Check blood glucose; if less than 4 or greater than 20 mmol/L, go to the Glycaemic Emergency CPG. ECG and SpO₂ monitoring. If onset is within 4.5 hours, this is time-critical: assess for a specialised stroke unit and transport under local protocol. If onset is over 4.5 hours or uncertain, transport to an appropriate hospital per local protocol. Pre-alert the receiving unit and document the last-known-well time accurately.',
      interventions:'Obtain GCS; perform FAST; establish the time of onset or last known well. Maintain the airway; oxygen therapy if indicated. Check blood glucose to exclude hypoglycaemia as a mimic. ECG and SpO₂ monitoring. Time-critical transport to a specialised stroke unit per local protocol if within the window; pre-alert.',
      diagnosisBlocks: [
        { type:'lead', body:'Suspected stroke: an acute neurological deficit. Obtain GCS and perform a FAST assessment. Always check blood glucose, as hypoglycaemia is a stroke mimic.' },
        { type:'note', label:'FAST', body:'Face (droop), Arms (drift or weakness), Speech (slurred or difficulty), Time (of onset, the critical variable).' },
      ],
      pathwayBlocks: [
        { type:'lead', body:'Obtain GCS. Perform a FAST assessment.' },
        { type:'step', body:'If FAST positive, maintain the airway and give oxygen therapy.' },
        { type:'step', body:'Check blood glucose. If less than 4 or greater than 20 mmol/L, go to the Glycaemic Emergency CPG.' },
        { type:'step', body:'ECG and SpO₂ monitoring.' },
        { type:'branch', label:'Onset < 4.5 hours', body:'Time-critical. Assess for a specialised stroke unit and transport under local protocol.' },
        { type:'branch', label:'Onset > 4.5 hours or uncertain', body:'Transport to an appropriate hospital per local protocol.' },
        { type:'note', label:'Always', body:'Pre-alert the receiving unit; document the last-known-well time accurately.' },
      ],
      interventionsBlocks: [
        { type:'step', body:'Obtain GCS; perform FAST; establish the time of onset or last known well.' },
        { type:'step', body:'Maintain the airway; oxygen therapy if indicated.' },
        { type:'step', body:'Check blood glucose to exclude hypoglycaemia as a mimic.' },
        { type:'step', body:'ECG and SpO₂ monitoring.' },
        { type:'step', body:'Time-critical transport to a specialised stroke unit per local protocol if within the window; pre-alert.' },
      ],
      drugs: [
        { name:'Oxygen therapy', adult:{ paramedic:'Maintain the airway; oxygen as indicated.' } },
      ],
    },
  },
  {
    id: 'seizure',
    name: 'Seizure / Convulsion',
    category: 'Neurological',
    demographics: { minAge: 16, maxAge: 90, sex: 'any' },
    variants: [
      // ── POSTICTAL (conscious:true) ───────────────────────────────────────────
      // V1: known epilepsy, postictal. Brand-named anticonvulsant (MEDREF-resolving).
      { cause:'known epilepsy, postictal', conscious:true, witness:'witnessed', onsetWhen:'about 15 minutes ago',
        dispatch:'You are called to {location} for a PATIENT who has had a seizure.',
        presentation:'Drowsy and confused, gradually coming round, no longer convulsing. Has been incontinent and the tongue looks bitten. Rousable and slowly orienting.',
        allergies:'No known drug allergies.',
        sample:{ symptoms:'Postictal drowsiness and confusion, bitten tongue, was incontinent, now slowly orienting.', medications:'Keppra.', pmh:'Epilepsy.', lastIntake:'Not certain; family think they may have missed a dose of their tablets.' },
        opqrst:{ onset:'The seizure came on suddenly a short while ago.', provocation:'Nothing makes it better or worse.', quality:'No pain. Drowsy and muddled after the seizure.', radiates:'No.', severity:'0', time:'A few minutes ago; now settling.' },
        events:'Known epilepsy; had a witnessed generalised seizure that stopped on its own, now postictal.' },
      // V3: first-ever seizure, postictal. No history, the "is this their first?" teaching.
      { cause:'first-ever seizure, postictal', conscious:true, witness:'witnessed', onsetWhen:'about 20 minutes ago',
        dispatch:'You are called to {location} for a PATIENT who collapsed and shook.',
        presentation:'Postictal and confused, slowly coming round. Witnesses describe generalised shaking that has now stopped. Looks frightened and disorientated.',
        allergies:'No known drug allergies.',
        sample:{ symptoms:'Postictal confusion, slowly coming round, no recollection of the event.', medications:'Nil regular.', pmh:'Nil of note; no previous seizures.', lastIntake:'Had eaten normally earlier; nothing unusual.' },
        opqrst:{ onset:'Collapsed suddenly with no warning, per witnesses.', provocation:'Nothing makes it better or worse.', quality:'No pain. Confused and frightened.', radiates:'No.', severity:'0', time:'A few minutes ago.' },
        events:'No known epilepsy; collapsed and had a witnessed convulsion, the first time this has ever happened.' },
      // V4: alcohol-withdrawal seizure, postictal. Withdrawal context in history, not S/S.
      { cause:'alcohol-withdrawal seizure, postictal', conscious:true, witness:'unwitnessed',
        dispatch:'You are called to {location} for a PATIENT who had a fit.',
        presentation:'Postictal, tremulous and sweaty, confused but rousable. Visibly shaky and anxious.',
        allergies:'No known drug allergies.',
        sample:{ symptoms:'Postictal confusion, marked tremor, sweating, anxious and shaky.', medications:'Nil regular.', pmh:'Heavy alcohol use.', lastIntake:'Has not had a drink in a couple of days; eating poorly.' },
        opqrst:{ onset:'The seizure came on suddenly.', provocation:'Nothing makes it better or worse.', quality:'No pain. Shaky, sweaty and on edge.', radiates:'No.', severity:'0', time:'A few minutes ago.' },
        events:'Heavy regular drinker who stopped a couple of days ago; had a witnessed seizure.' },
      // V6: post-head-injury seizure, postictal. Visible injury is an OBSERVED sign (S/S ok);
      //     the mechanism (the fall/blow) is the cause, elicited via Events.
      { cause:'post-head-injury seizure, postictal', conscious:true, witness:'witnessed', onsetWhen:'about 15 minutes ago',
        dispatch:'You are called to {location} for a PATIENT who collapsed and convulsed.',
        presentation:'Postictal and confused, with a visible graze and swelling to the side of the head and a small scalp laceration. Slowly orienting.',
        allergies:'No known drug allergies.',
        sample:{ symptoms:'Postictal confusion, visible head graze and swelling, small scalp laceration, slowly orienting.', medications:'Nil regular.', pmh:'Nil of note.', lastIntake:'Had eaten earlier; nothing unusual.' },
        opqrst:{ onset:'Convulsed a short time after the knock to the head.', provocation:'Nothing makes it better or worse.', quality:'No pain reported, though confused; sore head on examination.', radiates:'No.', severity:'0', time:'A few minutes ago.' },
        events:'Had a fall with a knock to the head earlier, then a witnessed convulsion.' },
      // ── ACTIVELY SEIZING (conscious:false) ───────────────────────────────────
      // V2: prolonged active seizure. The benzodiazepine pathway case.
      { cause:'prolonged active seizure', conscious:false, witness:'witnessed',
        dispatch:'You are called to {location} for a PATIENT who is fitting.',
        presentation:'Actively convulsing, generalised tonic-clonic movements ongoing for several minutes, not responding, frothing at the mouth, cyanosed around the lips. Still seizing on your arrival.',
        allergies:'Unknown.',
        sample:{ symptoms:'Actively convulsing, generalised tonic-clonic, frothing, cyanosed lips, not responding.', medications:'Unknown.', pmh:'Unknown.', lastIntake:'Unknown.' },
        events:'Witnessed to start seizing several minutes ago and has not stopped, prompting the call.',
        vitalsOverride:{ hr:{ dir:'up', intensity:0.45 }, spo2:[88,94] } },
      // V5: recurrent seizures / status. Repeated seizures without recovery.
      { cause:'recurrent seizures without recovery', conscious:false, witness:'witnessed',
        dispatch:'You are called to {location} for a PATIENT having repeated fits.',
        presentation:'Has had repeated seizures without fully recovering in between, now convulsing again, not responsive between episodes. Airway noisy with secretions.',
        allergies:'Unknown.',
        sample:{ symptoms:'Repeated seizures without recovery, convulsing again, unresponsive between episodes, noisy airway.', medications:'Unknown.', pmh:'Unknown.', lastIntake:'Unknown.' },
        events:'Known epilepsy; multiple seizures in succession today without recovering consciousness between them.',
        vitalsOverride:{ hr:{ dir:'up', intensity:0.5 }, spo2:[86,93] } },
    ],
    painBased: false,
    // Default deviations for the postictal/general case: mild sympathetic surge, BGL checked
    // (the CPG's "check blood glucose" is the teaching point, value normal here).
    deviations: {
      hr: { dir:'up', intensity:0.4 },   // ictal/postictal sympathetic surge
      spo2: [92, 97],                     // may dip during/just after a seizure
    },
    sample: {
      symptoms:'Seizure activity and postictal state; features depend on the cause.',
      medications:'Varies; see patient history.',
      pmh:'Varies; see patient history.',
      lastIntake:'Often not relevant; establish from the history.',
    },
    opqrst: {
      onset:'Sudden seizure activity.',
      provocation:'Not a pain complaint.',
      quality:'Seizure and postictal state, not pain.',
      radiates:'No.',
      severity:'0',
      time:'Recent; establish timing from the history.',
    },
    reveal: {
      diagnosis:'Seizure / convulsion. First protect the patient from harm and manage the airway, then determine whether they are still seizing or postictal. Always check the blood glucose and consider other causes.',
      pathway:'Protect from harm and do not restrain. Give oxygen and manage the airway, recovery position when able. Determine seizure status. If actively seizing: request ALS and give a benzodiazepine (maximum 4 doses regardless of route, a benzodiazepine given before arrival counts as a dose). If postictal: consider ALS, supportive care, monitor and reassess. Check blood glucose, and if it is less than 4 or greater than 20 mmol/L go to the Glycaemic Emergency CPG. If the patient recommences seizing, regard it as a new event, give a further dose, and consider medical advice. Reassess and transport.',
      interventions:'Protect from harm (do not restrain), manage the airway and give oxygen, recovery position when able. If actively seizing, request ALS and give a benzodiazepine per scope and route. Check blood glucose and treat per the Glycaemic Emergency CPG if abnormal. Monitor, reassess and transport; consider medical advice for recurrent seizures.',
      diagnosisBlocks: [
        { type:'lead', body:'Seizure / convulsion. Protect from harm, manage the airway, and determine seizing versus postictal.' },
        { type:'note', body:'Always check the blood glucose. Consider other causes: head injury, hypoglycaemia, alcohol or drug withdrawal, poisons, infection.' },
      ],
      pathwayBlocks: [
        { type:'step', body:'Protect from harm. Do not restrain. Oxygen therapy and airway management; recovery position when able.' },
        { type:'branch', label:'Actively seizing', body:'Request ALS. Give a benzodiazepine. Maximum 4 doses regardless of route; a benzodiazepine given before arrival counts as a dose.' },
        { type:'branch', label:'Postictal', body:'Consider ALS. Supportive care, monitor and reassess.' },
        { type:'step', body:'Check blood glucose. If less than 4 or greater than 20 mmol/L, go to the Glycaemic Emergency CPG.' },
        { type:'note', body:'If the patient recommences seizing, regard it as a new event: give a further dose, consider medical advice, reassess and transport.' },
      ],
      interventionsBlocks: [
        { type:'step', body:'Protect from harm; do not restrain. Manage the airway, give oxygen, recovery position when able.' },
        { type:'branch', label:'Actively seizing', body:'Request ALS and give a benzodiazepine per scope and route.' },
        { type:'step', body:'Check blood glucose; treat per the Glycaemic Emergency CPG if abnormal.' },
        { type:'note', body:'Monitor, reassess and transport. Consider medical advice for recurrent seizures.' },
      ],
      drugs: [
        { name:'Midazolam (actively seizing)',
          adult:{ paramedic:'10mg buccal, 5mg IN, or 5mg IM.', ap:'2.5mg IV/IO.' } },
        { name:'Diazepam (actively seizing)',
          adult:{ paramedic:'Not in Paramedic scope.', ap:'10mg PR, or 5mg IV/IO.' } },
        { name:'Oxygen Therapy',
          adult:{ paramedic:'Consider; support the airway and oxygenation.' } },
      ],
    },
  },

  {
    id: 'haemorrhage',
    name: 'External Haemorrhage',
    category: 'Trauma',
    demographics: { minAge: 16, maxAge: 90, sex: 'any' },
    variants: [
      // V1: catastrophic limb bleed → tourniquet. Anticoagulant cue (Eliquis) = bleeds worse.
      { cause:'catastrophic limb haemorrhage', conscious:true,
        dispatch:'You are called to {location} for a PATIENT with severe bleeding from the leg after an accident.',
        presentation:'Catastrophic bright-red bleeding pumping from a deep wound to the thigh, blood pooling on the floor, pale and clammy, frightened.',
        allergies:'No known drug allergies.',
        sample:{ symptoms:'Catastrophic pulsating bleeding from a deep thigh wound, blood pooling, pale and clammy.', medications:'Eliquis.', pmh:'Atrial fibrillation.', lastIntake:'Not relevant; establish if able.' },
        opqrst:{ onset:'Started the moment of the injury.', provocation:'Pressure on the wound is the only thing that slows it.', quality:'Severe pain at the wound.', radiates:'Stays at the thigh.', severity:'8', time:'Since the accident, a few minutes ago.' },
        events:'Deep laceration to the thigh from machinery a few minutes ago, bleeding heavily ever since.',
        vitalsOverride:{ hr:{ dir:'up', intensity:0.6 }, bpSys:[72,95], bpDia:[45,62], spo2:[92,96] } },
      // V2: junctional bleed (groin) → tourniquet won't reach, pack it.
      { cause:'junctional haemorrhage', conscious:true,
        dispatch:'You are called to {location} for a PATIENT bleeding heavily from a wound at the top of the leg.',
        presentation:'Heavy bleeding from a deep wound in the groin crease, high in the limb, soaked clothing, pale and anxious.',
        allergies:'No known drug allergies.',
        sample:{ symptoms:'Heavy bleeding from a deep wound high in the groin crease, soaked clothing, pale and anxious.', medications:'Nil regular.', pmh:'Nil of note.', lastIntake:'Not relevant.' },
        opqrst:{ onset:'Started at the moment of injury.', provocation:'Hard direct pressure into the wound slows it.', quality:'Severe pain.', radiates:'At the groin.', severity:'8', time:'A few minutes ago.' },
        events:'Penetrating wound to the groin a few minutes ago, bleeding heavily since.',
        vitalsOverride:{ hr:{ dir:'up', intensity:0.55 }, bpSys:[78,98], bpDia:[48,64], spo2:[93,97] } },
      // V3: controlled with direct pressure → the restraint lesson (stable).
      { cause:'haemorrhage controlled with pressure', conscious:true,
        dispatch:'You are called to {location} for a PATIENT with a bleeding wound to the arm.',
        presentation:'Steady bleeding from a forearm laceration that settles with firm direct pressure, alert and talking, colour normal.',
        allergies:'No known drug allergies.',
        sample:{ symptoms:'Steady bleeding from a forearm laceration, controllable with firm direct pressure, alert, colour normal.', medications:'Nil regular.', pmh:'Nil of note.', lastIntake:'Ate normally earlier.' },
        opqrst:{ onset:'At the time of the injury.', provocation:'Direct pressure stops it; releasing pressure restarts it.', quality:'Sore at the wound, manageable.', radiates:'At the forearm.', severity:'4', time:'A short time ago.' },
        events:'Cut the forearm on glass a short time ago.',
        vitalsOverride:{ hr:{ dir:'up', intensity:0.2 } } },
      // V4: escalation ladder → pressure fails, becoming shocked. Warfant cue.
      { cause:'haemorrhage requiring escalation', conscious:true,
        dispatch:'You are called to {location} for a PATIENT with a wound that will not stop bleeding.',
        presentation:'Persistent bleeding from a lower-leg wound that keeps soaking through dressings despite firm pressure, becoming pale and clammy.',
        allergies:'No known drug allergies.',
        sample:{ symptoms:'Persistent bleeding soaking through dressings despite pressure, becoming pale and clammy.', medications:'Warfant.', pmh:'Mechanical heart valve.', lastIntake:'Not relevant.' },
        opqrst:{ onset:'At the time of injury.', provocation:'Pressure helps but it keeps bleeding through.', quality:'Throbbing pain at the wound.', radiates:'At the lower leg.', severity:'6', time:'A short while ago and ongoing.' },
        events:'Deep wound to the lower leg a short while ago that has not stopped bleeding.',
        vitalsOverride:{ hr:{ dir:'up', intensity:0.45 }, bpSys:[92,108], bpDia:[58,72], spo2:[93,97] } },
      // V5: traumatic amputation → catastrophic bleed, tourniquet. (No part-care: not in CPG.)
      { cause:'traumatic amputation', conscious:true,
        dispatch:'You are called to {location} for a PATIENT who has lost part of their hand in an accident.',
        presentation:'Traumatic partial amputation of the hand with heavy bleeding from the stump, pale and shocked, in obvious distress.',
        allergies:'No known drug allergies.',
        sample:{ symptoms:'Traumatic partial amputation of the hand, heavy bleeding from the stump, pale and shocked.', medications:'Nil regular.', pmh:'Nil of note.', lastIntake:'Not relevant.' },
        opqrst:{ onset:'At the moment of the accident.', provocation:'Pressure and elevation slow it.', quality:'Severe pain.', radiates:'At the hand and wrist.', severity:'9', time:'A few minutes ago.' },
        events:'Hand caught in machinery a few minutes ago with a partial amputation.',
        vitalsOverride:{ hr:{ dir:'up', intensity:0.6 }, bpSys:[72,96], bpDia:[46,63], spo2:[92,96] } },
      // V6: major bleed + significant blood loss → severe shock, unresponsive (Shock CPG).
      { cause:'major haemorrhage with significant blood loss', conscious:false,
        dispatch:'You are called to {location} for a PATIENT who has collapsed and is bleeding heavily.',
        presentation:'A large volume of blood loss from a major wound, now unresponsive, very pale, cool and mottled skin, barely perceptible pulse.',
        allergies:'Unknown.',
        sample:{ symptoms:'Large-volume blood loss from a major wound, unresponsive, very pale, cool and mottled, barely perceptible pulse.', medications:'Unknown.', pmh:'Unknown.', lastIntake:'Unknown.' },
        events:'Found collapsed in a large amount of blood from a major wound.',
        vitalsOverride:{ hr:{ dir:'up', intensity:0.7 }, bpSys:[55,85], bpDia:[30,55], spo2:[82,90] } },
    ],
    painBased: true,   // wounds are painful; conscious variants carry a real (plain) pain story
    deviations: {
      hr: { dir:'up', intensity:0.5 },
      bpSys: { dir:'down', intensity:0.4 },
      bpDia: { dir:'down', intensity:0.4 },
      spo2: [92, 97],
    },
    sample: {
      symptoms:'External bleeding; severity and site depend on the wound.',
      medications:'Varies; see patient history. Anticoagulants worsen bleeding.',
      pmh:'Varies; see patient history.',
      lastIntake:'Usually not relevant; establish if able.',
    },
    opqrst: {
      onset:'At the time of the injury.',
      provocation:'Direct pressure typically slows or controls it.',
      quality:'Pain at the wound.',
      radiates:'At the wound site.',
      severity:'6',
      time:'Relating to the time of injury.',
    },
    reveal: {
      diagnosis:'External haemorrhage. The priority is catastrophic bleeding control first (the C in C-ABC). Identify whether the bleeding is catastrophic, the site (a limb where a tourniquet works versus a junctional site where it does not), and whether there is significant blood loss with shock.',
      pathway:'For an open wound with active bleeding, determine whether it is catastrophic. Catastrophic haemorrhage: posture, elevation, examination and direct pressure; apply and mark a tourniquet if it is a limb injury; consider a dressing impregnated with a haemostatic agent; request ALS. Not catastrophic: posture, elevation, examination and direct pressure, then apply a sterile dressing. Consider oxygen therapy. If the haemorrhage is not controlled, escalate: apply additional dressings, then depress the proximal pressure point, then apply a tourniquet. If there is significant blood loss, go to the Shock CPG. Transport.',
      interventions:'Direct pressure, posture and elevation are first-line. For catastrophic limb bleeding apply and mark a tourniquet and consider a haemostatic dressing, and request ALS. Apply a sterile dressing and consider oxygen therapy. If bleeding continues, escalate through additional dressings, a proximal pressure point, then a tourniquet. Significant blood loss goes to the Shock CPG. Anticoagulants worsen bleeding and make control harder, look for them in the history.',
      diagnosisBlocks: [
        { type:'lead', body:'External haemorrhage. Catastrophic bleeding control comes first (the C in C-ABC).' },
        { type:'note', body:'Identify: catastrophic or not, limb (tourniquet works) or junctional (it does not), and whether there is significant blood loss with shock. Anticoagulants in the history worsen bleeding.' },
      ],
      pathwayBlocks: [
        { type:'branch', label:'Catastrophic haemorrhage', body:'Posture, elevation, examination, direct pressure. Apply and MARK a tourniquet if a limb injury. Consider a haemostatic dressing. Request ALS.' },
        { type:'branch', label:'Not catastrophic', body:'Posture, elevation, examination, direct pressure. Apply a sterile dressing. Consider oxygen therapy.' },
        { type:'step', body:'Haemorrhage not controlled? Escalate: additional dressings, then depress the proximal pressure point, then apply a tourniquet.' },
        { type:'note', body:'Significant blood loss: go to the Shock CPG. Transport.' },
      ],
      interventionsBlocks: [
        { type:'step', body:'Direct pressure, posture and elevation, first-line for all bleeding.' },
        { type:'branch', label:'Catastrophic / limb', body:'Apply and mark a tourniquet; consider a haemostatic dressing; request ALS.' },
        { type:'step', body:'Apply a sterile dressing; consider oxygen therapy.' },
        { type:'branch', label:'If not controlled', body:'Additional dressings, then proximal pressure point, then tourniquet.' },
        { type:'note', body:'Significant blood loss, go to the Shock CPG. Anticoagulants worsen bleeding, check the history.' },
      ],
      drugs: [
        { name:'Tourniquet (catastrophic limb / uncontrolled)',
          adult:{ paramedic:'Apply and mark the time. For catastrophic limb haemorrhage, or when escalation fails to control bleeding.' } },
        { name:'Haemostatic Dressing (Consider)',
          adult:{ paramedic:'Consider a dressing impregnated with a haemostatic agent for catastrophic haemorrhage.' } },
        { name:'Oxygen Therapy (Consider)',
          adult:{ paramedic:'Consider; support oxygenation.' } },
      ],
    },
  },

  {
    id: 'cardiacArrest',
    name: 'Cardiac Arrest',
    category: 'Resuscitation',
    demographics: { minAge: 16, maxAge: 90, sex: 'any' },
    variants: [
      // V1: Basic Life Support — rhythm not yet determined (pads going on). The BLS spine.
      { cause:'cardiac arrest, basic life support', conscious:false, witness:'witnessed', arrestRhythm:'Not yet determined (pads being attached)',
        dispatch:'You are called to {location} for a PATIENT who has collapsed and is not breathing.',
        presentation:'Unresponsive, not breathing normally, no pulse. Bystanders are present and CPR is being attempted.',
        allergies:'Unknown.',
        sample:{ symptoms:'Unresponsive, not breathing normally, no palpable pulse.', medications:'Unknown.', pmh:'Unknown.', lastIntake:'Unknown.' },
        events:'Witnessed to collapse suddenly a few minutes ago, with bystander CPR started straight away.' },
      // V2: VF / pulseless VT — shockable. The defibrillation pathway.
      { cause:'cardiac arrest, VF or pulseless VT', conscious:false, witness:'witnessed', arrestRhythm:'VF / pulseless VT (shockable)',
        dispatch:'You are called to {location} for a PATIENT in cardiac arrest with CPR in progress.',
        presentation:'Unresponsive, pulseless, not breathing. The monitor shows a shockable rhythm.',
        allergies:'Unknown.',
        sample:{ symptoms:'Unresponsive, pulseless, not breathing; monitor shows a shockable rhythm.', medications:'Unknown.', pmh:'Unknown.', lastIntake:'Unknown.' },
        events:'Clutched the chest and collapsed in front of bystanders, who began CPR immediately.' },
      // V3: PEA — non-shockable, reversible-cause thinking. Cue seeded ~half the time.
      { cause:'cardiac arrest, pulseless electrical activity', conscious:false, witness:'unwitnessed', arrestRhythm:'PEA (organised rhythm, no pulse)',
        dispatch:'You are called to {location} for a PATIENT who has collapsed and is unresponsive.',
        presentation:'Unresponsive, pulseless, not breathing. The monitor shows organised electrical activity but there is no pulse.',
        allergies:'Unknown.',
        sample:{ symptoms:'Unresponsive, pulseless, not breathing; organised rhythm on the monitor with no output.', medications:'Unknown.', pmh:'Unknown.', lastIntake:'Unknown.' },
        events:'Collapsed and became unresponsive; bystanders started CPR.',
        // Reversible-cause cues (4 Hs / 4 Ts) seeded into Events as a teaching nudge — the
        // engine picks one at random some of the time; the student should connect it to a cause.
        eventsCues:[
          'Collapsed at a dialysis unit having missed recent sessions; bystanders started CPR.',         // hyperkalaemia
          'Collapsed after heavy bleeding from a wound; bystanders started CPR.',                          // hypovolaemia
          'Pulled from cold water a short time before collapsing; bystanders started CPR.',                // hypothermia / hypoxia
          'Became severely breathless then collapsed; bystanders started CPR.',                            // hypoxia / PE
          'Collapsed and became unresponsive; bystanders started CPR.' ],                                  // generic (no cue)
      },
    ],
    painBased: false,
    // No normal deviations — arrest variants render the arrest state. BGL still generated
    // (a meaningful bedside check / reversible cause), defaults to a normal range.
    deviations: {},
    sample: {
      symptoms:'Unresponsive, pulseless, not breathing.',
      medications:'Unknown.',
      pmh:'Unknown.',
      lastIntake:'Unknown.',
    },
    opqrst: {
      onset:'Sudden collapse.',
      provocation:'Not applicable in arrest.',
      quality:'Not applicable in arrest.',
      radiates:'Not applicable.',
      severity:'Not applicable.',
      time:'At the time of collapse.',
    },
    reveal: {
      diagnosis:'Cardiac arrest: unresponsive, not breathing normally, no pulse. Confirm the arrest, request ALS, and start high-quality CPR. The rhythm on the monitor directs the pathway, shockable (VF / pulseless VT) versus non-shockable (asystole / PEA).',
      pathway:'Confirm the arrest and request ALS. Before commencing, confirm resuscitation is appropriate: it is inappropriate to start if there are definitive indicators of death (Recognition of Death CPG). Attach defibrillation pads and give continuous chest compressions while the defibrillator is prepared. Assess the rhythm. Shockable (VF / pulseless VT): give one shock, then immediately resume CPR for two minutes and reassess. Non-shockable (asystole / PEA): immediately resume CPR for two minutes and reassess, and seek and treat reversible causes. Maintain high-quality CPR throughout: rate 100 to 120 per minute, depth 5 to 6 cm, ventilations 500 to 600 mL, minimum interruptions, maximum hands-off time 10 seconds. Reassess every two minutes; on return of circulation, go to Post-Resuscitation Care.',
      interventions:'High-quality CPR is the priority (rate 100 to 120 per minute, depth 5 to 6 cm, ventilations 500 to 600 mL, maximum hands-off 10 seconds). Defibrillate shockable rhythms, one shock then straight back to compressions. Manage the airway and give oxygen. Recognise the rhythm and reassess every two minutes; a pulse check only after two minutes of CPR if a potentially perfusing rhythm. Request ALS early. If an implantable defibrillator is fitted it is safe to touch the patient, treat per the CPG. Consider transport to ED if no change after 20 minutes and no ALS is available. Advanced Paramedics administer the arrest drugs.',
      diagnosisBlocks: [
        { type:'lead', body:'Cardiac arrest. Confirm, request ALS, start high-quality CPR. The monitor rhythm directs the pathway.' },
        { type:'note', body:'Before commencing, confirm resuscitation is appropriate: it is inappropriate to start if there are definitive indicators of death (Recognition of Death CPG).' },
      ],
      pathwayBlocks: [
        { type:'step', body:'Confirm the arrest. Request ALS. Attach defibrillation pads; continuous compressions while the defibrillator is prepared.' },
        { type:'branch', label:'Shockable (VF / pulseless VT)', body:'Give one shock, then immediately resume CPR for two minutes and reassess.' },
        { type:'branch', label:'Non-shockable (asystole / PEA)', body:'Immediately resume CPR for two minutes and reassess. Seek and treat reversible causes (4 Hs and 4 Ts).' },
        { type:'step', body:'High-quality CPR throughout: 100 to 120 per minute, depth 5 to 6 cm, ventilations 500 to 600 mL, max hands-off 10 seconds.' },
        { type:'note', body:'Reassess every two minutes. Return of circulation, go to Post-Resuscitation Care. Advanced Paramedics give the arrest drugs.' },
      ],
      interventionsBlocks: [
        { type:'step', body:'High-quality CPR (100 to 120 per minute, 5 to 6 cm, ventilations 500 to 600 mL, max hands-off 10 seconds).' },
        { type:'branch', label:'Shockable', body:'Defibrillate, one shock, then straight back to compressions.' },
        { type:'step', body:'Airway management and oxygen. Reassess the rhythm every two minutes.' },
        { type:'note', body:'Request ALS early. ICD fitted: safe to touch, treat per CPG. Consider ED transport if no change after 20 minutes and no ALS. Advanced Paramedics administer adrenaline and amiodarone.' },
      ],
      drugs: [
        { name:'High-quality CPR & Defibrillation',
          adult:{ paramedic:'CPR 100 to 120 per minute, depth 5 to 6 cm; defibrillate shockable rhythms, one shock then resume compressions.' } },
        { name:'Oxygen / Airway',
          adult:{ paramedic:'Airway management and oxygen therapy throughout.' } },
        { name:'Arrest drugs',
          adult:{ ap:'Advanced Paramedics administer adrenaline and amiodarone (refractory shockable rhythms).' } },
      ],
    },
  },

  {
    id: 'environmental',
    name: 'Environmental Emergency',
    category: 'Environmental',
    locationBias: ['outdoor', 'domestic', 'transport', 'leisure'],
    demographics: { minAge: 16, maxAge: 90, sex: 'any' },
    variants: [
      // V1: Hypothermia — temp LOW the key finding. Generic exposure cause (no long-lie).
      { cause:'hypothermia', conscious:true,
        dispatch:'You are called to {location} for a PATIENT found cold and confused after being out in the cold.',
        presentation:'Cold to the touch, pale, drowsy and slow to respond, with slurred speech and sluggish movements.',
        allergies:'No known drug allergies.',
        sample:{ symptoms:'Cold to the touch, pale, drowsy, slurred speech, slow sluggish movements.', medications:'Nil regular.', pmh:'Nil of note.', lastIntake:'Not certain; establish if able.' },
        opqrst:{ onset:'Came on gradually with the cold.', provocation:'Nothing makes it better or worse.', quality:'No pain. Cold, drowsy and muddled.', radiates:'No.', severity:'0', time:'Over a period out in the cold.' },
        events:'Out in the cold for a prolonged period with inadequate protection from the weather.',
        vitalsOverride:{ hr:{ dir:'down', intensity:0.35 }, temp:[30.0, 34.0] } },
      // V2: Heat-related emergency — temp HIGH the key finding.
      { cause:'heat-related emergency', conscious:true,
        dispatch:'You are called to {location} for a PATIENT who has collapsed in the heat.',
        presentation:'Hot and flushed, unsteady and confused, sweating heavily (or hot and dry if very severe), looks unwell after collapsing.',
        allergies:'No known drug allergies.',
        sample:{ symptoms:'Hot and flushed, unsteady, confused, sweating heavily, collapsed.', medications:'Nil regular.', pmh:'Nil of note.', lastIntake:'Drinking little despite the heat.' },
        opqrst:{ onset:'Came on while out in the heat.', provocation:'Nothing makes it better or worse.', quality:'No pain. Hot, dizzy and weak.', radiates:'No.', severity:'0', time:'Over a period in the heat.' },
        events:'Exerting in hot conditions with inadequate fluids, then collapsed.',
        vitalsOverride:{ hr:{ dir:'up', intensity:0.4 }, temp:[39.0, 41.0] } },
      // V3: Drowning / submersion — conscious but unwell, respiratory distress + secondary-drowning teaching.
      { cause:'submersion / drowning', conscious:true,
        dispatch:'You are called to {location} for a PATIENT who has been pulled from the water.',
        presentation:'Coughing and breathless after being pulled from the water, crackles heard on auscultation, tired and frightened; may seem to improve at first.',
        allergies:'No known drug allergies.',
        sample:{ symptoms:'Coughing and breathless, crackles heard on auscultation, tired and frightened.', medications:'Nil regular.', pmh:'Nil of note.', lastIntake:'Not relevant.' },
        opqrst:{ onset:'Since being pulled from the water.', provocation:'Worse lying flat; coughing.', quality:'Breathless and tight, not painful.', radiates:'No.', severity:'0', time:'Since the immersion a short time ago.' },
        events:'Got into difficulty in the water and was pulled out by bystanders.',
        vitalsOverride:{ hr:{ dir:'up', intensity:0.35 }, rr:{ dir:'up', intensity:0.4 }, spo2:[88,94] } },
      // V4: Decompression illness (the bends) — recent SCUBA, joint/limb pain, conscious.
      { cause:'decompression illness', conscious:true, maxAge:65,
        dispatch:'You are called to a coastal dive site for a PATIENT who is unwell after a dive.',
        presentation:'Deep aching pain in the joints and limbs with a blotchy rash and tingling, having surfaced from a SCUBA dive a short time ago, breathless and uncomfortable.',
        allergies:'No known drug allergies.',
        sample:{ symptoms:'Deep aching joint and limb pain, blotchy rash, tingling, breathless, uncomfortable.', medications:'Nil regular.', pmh:'Nil of note.', lastIntake:'Before the dive.' },
        opqrst:{ onset:'Came on within hours of surfacing from a dive.', provocation:'Pain not eased by position.', quality:'Deep aching pain in the joints.', radiates:'Joints and limbs.', severity:'6', time:'Since surfacing from a SCUBA dive.' },
        events:'Was SCUBA diving within the last 48 hours and became unwell after surfacing.',
        vitalsOverride:{ hr:{ dir:'up', intensity:0.25 } } },
      // V5: Severe / neurological decompression illness — confused/weak, time-critical.
      { cause:'neurological decompression illness', conscious:true, maxAge:65,
        dispatch:'You are called to a coastal dive site for a PATIENT who is confused and weak after a dive.',
        presentation:'Confused and weak with unsteadiness and altered sensation down one side, having surfaced from a SCUBA dive, deteriorating and frightened.',
        allergies:'No known drug allergies.',
        sample:{ symptoms:'Confused, weak, unsteady, altered sensation down one side, deteriorating.', medications:'Nil regular.', pmh:'Nil of note.', lastIntake:'Before the dive.' },
        opqrst:{ onset:'Neurological symptoms within hours of surfacing.', provocation:'Unknown.', quality:'Weakness, confusion, altered sensation.', radiates:'Down one side.', severity:'Unknown, deteriorating.', time:'Since surfacing from a SCUBA dive.' },
        events:'Was SCUBA diving within the last 48 hours and developed neurological symptoms after surfacing.',
        vitalsOverride:{ hr:{ dir:'up', intensity:0.3 }, spo2:[90,95] } },
    ],
    painBased: false,
    deviations: {},
    sample: {
      symptoms:'Environmental exposure; findings depend on the cause.',
      medications:'Varies; see patient history.',
      pmh:'Varies; see patient history.',
      lastIntake:'Often not relevant; establish if able.',
    },
    opqrst: {
      onset:'Related to the environmental exposure.',
      provocation:'Not a pain complaint.',
      quality:'Depends on the cause.',
      radiates:'No.',
      severity:'0',
      time:'Over the period of exposure.',
    },
    reveal: {
      diagnosis:'Environmental emergency. Identify the cause: hypothermia (low core temperature), a heat-related emergency (high core temperature), a submersion / drowning incident, or decompression illness after recent SCUBA diving. Check and record the temperature and the blood glucose, and treat to the relevant pathway.',
      pathway:'Hypothermia: handle the patient gently and do not let them walk; if immersion, remove horizontally; protect from wind chill; primary survey and CPR if appropriate; remove wet clothing by cutting; insulate with dry blankets; ECG and SpO2; pulse check for 30 to 45 seconds; passive re-warming (hot sweet drinks if mild); transport head-down. Check core temperature for severity (Mild 34 to 35.9, Moderate 30 to 33.9, Severe below 30). Heat emergency: remove from the hot environment; if alert give cool fluids to drink, if not maintain the airway; check blood glucose; cool the patient but do not over-cool (remove clothing, fanning, tepid sponging, ice packs); SpO2 and ECG; consider ALS; elevate oedematous limbs. Drowning: remove from the liquid (consider C-spine injury); check responsiveness and breathing, five rescue breaths if needed; oxygen; auscultate for crepitations; manage respiratory distress; if hypothermic follow the hypothermia pathway; transport to ED for secondary drowning even if they appear well. Decompression illness: complete a primary survey (CPR if appropriate) and treat the patient SUPINE; give 100% oxygen regardless of SpO2; request ALS; if pain relief is needed, Entonox is ABSOLUTELY contraindicated because nitrous oxide expands the gas bubbles, use the Pain CPG instead; manage nausea via the N&V CPG; monitor ECG and SpO2; notify control of a query DCI and alert the ED; transport at an altitude below 1000 ft above the incident site (or in an aircraft pressurised to sea level), and bring the dive computer and equipment with the patient.',
      interventions:'Hypothermia: gentle handling, insulation, passive re-warming, ECG/SpO2, head-down transport; AP gives warmed fluids and an advanced airway. Heat: remove from heat, cool without over-cooling, cool fluids if alert, BGL; AP gives NaCl. Drowning: airway and oxygen, rescue breaths if needed, manage bronchospasm, monitor, and always transport to ED for possible secondary drowning. Decompression illness: 100% oxygen and supine positioning are the headline, with two hard rules, NO Entonox (it expands gas bubbles) and keep transport altitude below 1000 ft; NaCl 0.9% 500 mL IV/IO is Advanced Paramedic scope. Check blood glucose in all. Request or consider ALS as indicated.',
      diagnosisBlocks: [
        { type:'lead', body:'Environmental emergency. Establish hypothermia, heat-related emergency, or drowning, and check temperature and blood glucose.' },
        { type:'note', body:'Hypothermia severity by core temperature: Mild 34 to 35.9, Moderate 30 to 33.9, Severe below 30. Heat: heat stress, heat exhaustion, or heat stroke above 40.' },
        { type:'note', body:'Decompression illness: suspect in any diver with new joint or limb pain, neurological signs, a rash or breathlessness within 48 hours of a SCUBA dive. The dive buddy may also be affected, assess them too.' },
      ],
      pathwayBlocks: [
        { type:'branch', label:'Hypothermia', body:'Handle gently, do not let them walk. Remove wet clothing by cutting, insulate. Pulse check 30 to 45 seconds. Passive re-warming; hot sweet drinks if mild. Transport head-down.' },
        { type:'branch', label:'Heat emergency', body:'Remove from the heat. If alert, cool fluids to drink; if not, maintain the airway. Cool the patient but do not over-cool (clothing off, fanning, tepid sponging, ice packs).' },
        { type:'branch', label:'Drowning / submersion', body:'Remove from the liquid (C-spine caution). Rescue breaths if needed, oxygen, auscultate. Transport to ED for secondary drowning even if they look well.' },
        { type:'branch', label:'Decompression illness', body:'Treat SUPINE. 100% oxygen regardless of SpO2. Request ALS. Entonox is ABSOLUTELY contraindicated (it expands gas bubbles), use the Pain CPG. Alert ED, notify query DCI. Transport below 1000 ft above the incident site; bring the dive computer and equipment.' },
        { type:'step', body:'Check blood glucose in all. Consider or request ALS as indicated.' },
      ],
      interventionsBlocks: [
        { type:'step', body:'Hypothermia: gentle handling, insulation, passive re-warming, ECG/SpO2, head-down transport.' },
        { type:'step', body:'Heat: remove from heat, cool without over-cooling, cool fluids if alert.' },
        { type:'step', body:'Drowning: airway and oxygen, rescue breaths if needed, manage bronchospasm, always transport to ED for possible secondary drowning.' },
        { type:'note', body:'Decompression illness: 100% oxygen, supine, NO Entonox (expands gas bubbles), transport below 1000 ft. NaCl 0.9% 500 mL IV/IO is Advanced Paramedic scope.' },
        { type:'note', body:'Check blood glucose in all. AP adds warmed fluids / advanced airway (hypothermia), NaCl (heat), advanced airway (drowning).' },
      ],
      drugs: [
        { name:'Supportive care (all)',
          adult:{ paramedic:'Airway, oxygen, ECG/SpO2 monitoring, check blood glucose. Treat to the relevant pathway.' } },
        { name:'Salbutamol (drowning, if bronchospasm)',
          adult:{ paramedic:'5mg nebulised for bronchospasm.' } },
        { name:'Re-warming / cooling',
          adult:{ paramedic:'Hypothermia: passive re-warming, insulation, head-down. Heat: cool without over-cooling.' } },
        { name:'Fluids / advanced airway',
          adult:{ ap:'Advanced Paramedics: warmed NaCl and advanced airway in hypothermia; NaCl in heat; advanced airway in drowning.' } },
        { name:'Oxygen 100% (decompression illness)',
          adult:{ paramedic:'100% oxygen regardless of SpO2. Entonox is ABSOLUTELY contraindicated, it expands the gas bubbles.' } },
        { name:'Sodium Chloride 0.9% (decompression illness)',
          adult:{ ap:'500 mL IV/IO. Advanced Paramedic scope only (IV access required).' } },
      ],
    },
  },

  {
    id: 'sepsis',
    name: 'Sepsis',
    category: 'Infectious',
    demographics: { minAge: 16, maxAge: 90, sex: 'any' },
    variants: [
      // V1: chest / pneumonia source — auscultation findings observed.
      { cause:'sepsis, chest source', conscious:true,
        dispatch:'You are called to {location} for a PATIENT who is generally unwell with a suspected infection.',
        presentation:'Febrile and flushed, breathing fast, with a productive cough and crackles heard at one lung base, looks unwell and tired.',
        allergies:'No known drug allergies.',
        sample:{ symptoms:'Febrile, flushed, breathing fast, productive cough, crackles and bronchial breathing at one base.', medications:'Nil regular.', pmh:'Nil of note.', lastIntake:'Eating poorly while unwell.' },
        opqrst:{ onset:'Been getting worse over a few days.', provocation:'Coughing hurts; worse on deep breaths.', quality:'Tight and breathless, chesty.', radiates:'No.', severity:'4', time:'A few days of worsening chest symptoms.' },
        events:'Had a chest infection over the last few days with green sputum, now much worse.',
        vitalsOverride:{ hr:{ dir:'up', intensity:0.5 }, rr:{ dir:'up', intensity:0.5 }, spo2:[90,95], temp:[38.5,40.0] } },
      // V2: urinary / urosepsis — flank pain + dysuria, new confusion (esp older).
      { cause:'sepsis, urinary source', conscious:true,
        dispatch:'You are called to {location} for a PATIENT who has become generally unwell and confused.',
        presentation:'Febrile and flushed, newly confused and unsteady, with loin pain and discomfort passing urine, generally very unwell.',
        allergies:'No known drug allergies.',
        sample:{ symptoms:'Febrile, flushed, newly confused, loin pain, pain and stinging passing urine.', medications:'Nil regular.', pmh:'Recurrent urine infections.', lastIntake:'Drinking little, off food.' },
        opqrst:{ onset:'Came on over the last day or two.', provocation:'Loin sore to touch; stings to pass urine.', quality:'Aching in the back and side, burning when passing urine.', radiates:'Round to the loin.', severity:'5', time:'A day or two of worsening symptoms.' },
        events:'Urinary symptoms for a couple of days, now suddenly much worse and confused.',
        vitalsOverride:{ hr:{ dir:'up', intensity:0.5 }, rr:{ dir:'up', intensity:0.4 }, temp:[38.5,40.0] } },
      // V3: abdominal source.
      { cause:'sepsis, abdominal source', conscious:true,
        dispatch:'You are called to {location} for a PATIENT who is unwell with abdominal pain.',
        presentation:'Febrile and flushed, unwell with abdominal tenderness, off food and nauseated, looks drained.',
        allergies:'No known drug allergies.',
        sample:{ symptoms:'Febrile, flushed, abdominal tenderness, nauseated, off food, generally unwell.', medications:'Nil regular.', pmh:'Nil of note.', lastIntake:'Not eaten properly for a day.' },
        opqrst:{ onset:'Built up over the last day.', provocation:'Worse on movement and pressing the abdomen.', quality:'Deep, constant ache in the abdomen.', radiates:'Across the lower abdomen.', severity:'6', time:'About a day of worsening pain.' },
        events:'Abdominal pain and fever building over the last day.',
        vitalsOverride:{ hr:{ dir:'up', intensity:0.5 }, rr:{ dir:'up', intensity:0.4 }, temp:[38.5,40.0] } },
      // V4: cellulitis / skin source — visible skin infection is an observed sign.
      { cause:'sepsis, skin source', conscious:true,
        dispatch:'You are called to {location} for a PATIENT who is unwell with a red, swollen leg.',
        presentation:'Febrile and flushed, with a hot, red, swollen and tender area spreading up the lower leg, generally unwell.',
        allergies:'No known drug allergies.',
        sample:{ symptoms:'Febrile, flushed, hot red swollen tender spreading area on the lower leg, unwell.', medications:'Nil regular.', pmh:'Nil of note.', lastIntake:'Eating little.' },
        opqrst:{ onset:'The redness has spread over a couple of days.', provocation:'The area is sore to touch.', quality:'Hot, throbbing soreness in the leg.', radiates:'Spreading up the leg.', severity:'5', time:'A couple of days, spreading.' },
        events:'A small skin break on the leg that has become red, hot and spreading over a couple of days.',
        vitalsOverride:{ hr:{ dir:'up', intensity:0.5 }, rr:{ dir:'up', intensity:0.4 }, temp:[38.5,40.0] } },
      // V5: meningitis suspected — time-critical, triggers antibiotic/pre-alert pathway.
      { cause:'sepsis, meningitis suspected', conscious:true,
        dispatch:'You are called to {location} for a PATIENT with a severe headache who is very unwell.',
        presentation:'Febrile and very unwell, photophobic with a severe headache and neck stiffness; a non-blanching rash is developing.',
        allergies:'No known drug allergies.',
        sample:{ symptoms:'Febrile, severe headache, photophobia, neck stiffness, developing non-blanching rash, very unwell.', medications:'Nil regular.', pmh:'Nil of note.', lastIntake:'Unable to keep much down.' },
        opqrst:{ onset:'Came on quickly over a few hours.', provocation:'Light and movement make the headache worse.', quality:'Severe, pounding headache.', radiates:'Down the neck, which is stiff.', severity:'8', time:'A few hours, rapidly worsening.' },
        events:'Rapidly worsening headache and fever over a few hours with a rash appearing.',
        vitalsOverride:{ hr:{ dir:'up', intensity:0.55 }, rr:{ dir:'up', intensity:0.4 }, temp:[38.8,40.2] } },
      // V6: neutropenic / at-risk — THE TRAP: may be afebrile/low temp, immunosuppressant cue, subtly shocked.
      { cause:'sepsis, at-risk / immunosuppressed (may be afebrile)', conscious:true,
        dispatch:'You are called to {location} for a PATIENT who feels generally unwell and weak.',
        presentation:'Generally unwell, weak and clammy, looking worse than the basic obs first suggest; not obviously febrile.',
        allergies:'No known drug allergies.',
        sample:{ symptoms:'Generally unwell, weak, clammy, looks worse than the obs suggest, not obviously febrile.', medications:'Metoject.', pmh:'Rheumatoid arthritis; on immunosuppressant treatment.', lastIntake:'Off food, feels too unwell.' },
        opqrst:{ onset:'Been going downhill over a day or so.', provocation:'Nothing in particular.', quality:'Just profoundly unwell and weak.', radiates:'No.', severity:'3', time:'A day or so of feeling steadily worse.' },
        events:'On treatment that suppresses the immune system, feeling steadily and worryingly more unwell.',
        vitalsOverride:{ hr:{ dir:'up', intensity:0.5 }, rr:{ dir:'up', intensity:0.35 }, bpSys:[88,108], bpDia:[52,68], temp:[34.8,36.2] } },
    ],
    painBased: false,
    deviations: { hr:{ dir:'up', intensity:0.45 }, rr:{ dir:'up', intensity:0.4 }, temp:[38.5,40.0] },
    sample: {
      symptoms:'Generally unwell with a suspected infection; findings depend on the source.',
      medications:'Varies; see patient history. Immunosuppressants raise the risk.',
      pmh:'Varies; see patient history.',
      lastIntake:'Often eating and drinking poorly while unwell.',
    },
    opqrst: {
      onset:'Unwell over hours to days.',
      provocation:'Depends on the source.',
      quality:'Depends on the source.',
      radiates:'Depends on the source.',
      severity:'4',
      time:'Hours to days of worsening illness.',
    },
    reveal: {
      diagnosis:'Sepsis: a patient generally unwell with a suspected infection and a temperature below 36 or above 38.3 degrees. Recognise it using SIRS (two or more of: temperature below 36 or above 38.3, heart rate over 90, respiratory rate over 20, acutely confused, glucose over 7.7 if not diabetic) and the at-risk criteria. Identify the likely source and escalate early. Remember an at-risk or immunosuppressed patient may be septic WITHOUT a fever.',
      pathway:'Monitor HR, RR, ECG, SpO2 and BP, and check blood glucose. Recognise abnormal physiology and a likely source. The management is the "Give 3": oxygen titrated to above 94 per cent (88 to 92 per cent in chronic lung conditions such as COPD); IV fluids if there is hypotension (Advanced Paramedic); and IV antimicrobials (Advanced Paramedic). For the Paramedic, the only drug in scope is Paracetamol 1g orally if the temperature is above 38.3. Where there are signs of hypoperfusion, request ALS: the Advanced Paramedic gives NaCl 0.9% 500mL over 15 minutes (repeat up to twice, max 30mL/kg), an antibiotic (Ceftriaxone 2g) where indicated, and, in fluid-unresponsive septic shock, adrenaline. Pre-alert the ED for sepsis, septic shock, suspected meningitis or a patient at risk of neutropenia.',
      interventions:'Recognise sepsis early using SIRS and the at-risk criteria, and identify the source. Paramedic scope: oxygen titrated to target, full monitoring, blood glucose, and Paracetamol 1g orally if febrile, that is the only Paramedic drug here. Request ALS for signs of hypoperfusion. Pre-alert ED for sepsis, septic shock, suspected meningitis, or neutropenia risk; if SIRS plus infection, advise the triage nurse. Wear appropriate PPE for a high-consequence infectious disease. Everything else (IV fluids, antibiotics, adrenaline, IV paracetamol) is Advanced Paramedic.',
      diagnosisBlocks: [
        { type:'lead', body:'Sepsis: unwell with a suspected infection and temperature below 36 or above 38.3. Recognise with SIRS and at-risk criteria; find the source; escalate early.' },
        { type:'note', body:'SIRS (two or more): temp below 36 or above 38.3, HR over 90, RR over 20, acutely confused, glucose over 7.7 (not diabetic). At-risk patients (immunosuppressed, neutropenic) MAY HAVE NO FEVER, do not be reassured.' },
      ],
      pathwayBlocks: [
        { type:'step', body:'Monitor HR, RR, ECG, SpO2, BP. Check blood glucose. Recognise abnormal physiology and a likely source.' },
        { type:'step', body:'"Give 3": oxygen to above 94% (88 to 92% if COPD); IV fluids if hypotensive (AP); IV antimicrobials (AP).' },
        { type:'branch', label:'Signs of hypoperfusion / septic shock', body:'Request ALS. AP gives NaCl 500mL over 15 min (repeat x2, max 30mL/kg), Ceftriaxone where indicated, and adrenaline in fluid-unresponsive shock.' },
        { type:'note', body:'Pre-alert ED for sepsis, septic shock, suspected meningitis, or neutropenia risk. SIRS plus infection: advise the triage nurse. HCID: appropriate PPE.' },
      ],
      interventionsBlocks: [
        { type:'step', body:'Recognise early (SIRS + at-risk), identify the source. Oxygen to target, full monitoring, blood glucose.' },
        { type:'step', body:'Paramedic drug: Paracetamol 1g orally if febrile, the only Paramedic-scope drug in sepsis.' },
        { type:'branch', label:'Hypoperfusion', body:'Request ALS for IV fluids, antibiotic and adrenaline (all AP).' },
        { type:'note', body:'Pre-alert ED as indicated; advise triage nurse if SIRS plus infection; wear appropriate PPE.' },
      ],
      drugs: [
        { name:'Paracetamol (the only Paramedic-scope drug here)',
          adult:{ paramedic:'1g orally if temperature is above 38.3.', ap:'1g IV.' } },
        { name:'IV Fluids (NaCl 0.9%)',
          adult:{ ap:'500mL IV/IO over 15 minutes, repeat up to twice, maximum 30mL/kg, for hypotension.' } },
        { name:'Ceftriaxone (antibiotic)',
          adult:{ ap:'2g IV/IO/IM where indicated (septic shock, sepsis, suspected meningitis, neutropenia risk).' } },
        { name:'Adrenaline (fluid-unresponsive septic shock)',
          adult:{ ap:'10mcg IV/IO, repeat as needed.' } },
      ],
    },
  },

  {
    id: 'asthma',
    name: 'Asthma',
    category: 'Respiratory',
    demographics: { minAge: 16, maxAge: 75, sex: 'any' },
    variants: [
      // V1: Mild — speaking full sentences, settling. Near-normal vitals.
      { cause:'mild asthma', conscious:true,
        dispatch:'You are called to {location} for a PATIENT who is wheezy and short of breath.',
        presentation:'Mild wheeze, speaking in full sentences, mildly breathless but settling, not distressed.',
        allergies:'No known drug allergies.',
        sample:{ symptoms:'Mild wheeze, speaking in full sentences, mildly breathless but settling.', medications:'Ventolin.', pmh:'Asthma.', lastIntake:'Not relevant.' },
        opqrst:{ onset:'Came on a little while ago.', provocation:'Eases with the inhaler.', quality:'Mild tightness and wheeze, not distressing.', radiates:'No.', severity:'2', time:'A short while, settling.' },
        events:'Became wheezy and used their own inhaler with some effect before calling.',
        vitalsOverride:{ hr:{ dir:'up', intensity:0.2 }, rr:{ dir:'up', intensity:0.25 }, spo2:[94,98] } },
      // V2: Moderate — short phrases, accessory muscles. The ipratropium-mix point.
      { cause:'moderate asthma', conscious:true,
        dispatch:'You are called to {location} for a PATIENT struggling with their breathing.',
        presentation:'Audible wheeze, speaking in short phrases, increased work of breathing, using some accessory muscles.',
        allergies:'No known drug allergies.',
        sample:{ symptoms:'Audible wheeze, short phrases only, increased work of breathing, using accessory muscles.', medications:'Ventolin.', pmh:'Asthma.', lastIntake:'Not relevant.' },
        opqrst:{ onset:'Worsening over the last while.', provocation:'The inhaler is not helping much now.', quality:'Tight, wheezy, hard work to breathe.', radiates:'No.', severity:'5', time:'Worsening over a period.' },
        events:'Breathlessness worsening despite repeated use of their own inhaler.',
        vitalsOverride:{ hr:{ dir:'up', intensity:0.45 }, rr:{ dir:'up', intensity:0.5 }, spo2:[91,95] } },
      // V3: Severe — few words, working hard, tiring. AP drugs enter (hydrocortisone).
      { cause:'severe asthma', conscious:true,
        dispatch:'You are called to {location} for a PATIENT in severe respiratory distress.',
        presentation:'Marked wheeze, only able to speak a few words at a time, working hard to breathe, anxious and tiring, sitting forward.',
        allergies:'No known drug allergies.',
        sample:{ symptoms:'Marked wheeze, few words only, working hard to breathe, anxious and tiring, sitting forward.', medications:'Ventolin.', pmh:'Asthma, previous hospital admissions.', lastIntake:'Not relevant.' },
        opqrst:{ onset:'Worsening despite treatment.', provocation:'Nothing is easing it now.', quality:'Severe tightness, exhausting to breathe.', radiates:'No.', severity:'7', time:'Steadily worsening and not responding.' },
        events:'Breathing has deteriorated despite repeated inhaler use, now severely distressed.',
        vitalsOverride:{ hr:{ dir:'up', intensity:0.6 }, rr:{ dir:'up', intensity:0.6 }, spo2:[88,93] } },
      // V4: Life-threatening — exhausted, silent chest, cyanosed, drowsy. The recognition gold.
      { cause:'life-threatening asthma', conscious:true,
        dispatch:'You are called to {location} for a PATIENT who is barely breathing.',
        presentation:'Exhausted and barely able to speak, a silent chest on auscultation, cyanosed and drowsy, with poor respiratory effort.',
        allergies:'No known drug allergies.',
        sample:{ symptoms:'Exhausted, barely able to speak, silent chest on auscultation, cyanosed, drowsy, poor respiratory effort.', medications:'Ventolin.', pmh:'Asthma, previous ICU admission.', lastIntake:'Not relevant.' },
        opqrst:{ onset:'Has deteriorated badly.', provocation:'Nothing is helping.', quality:'Too breathless and exhausted to describe it.', radiates:'No.', severity:'9', time:'Rapidly worsening to exhaustion.' },
        events:'Severe attack that has progressed to exhaustion despite treatment.',
        vitalsOverride:{ hr:{ dir:'up', intensity:0.5 }, rr:{ dir:'up', intensity:0.3 }, spo2:[78,88] } },
    ],
    painBased: false,
    deviations: { hr:{ dir:'up', intensity:0.4 }, rr:{ dir:'up', intensity:0.45 }, spo2:[90,95] },
    sample: {
      symptoms:'Wheeze and breathlessness; severity varies.',
      medications:'Often a known asthmatic on a reliever inhaler.',
      pmh:'Asthma.',
      lastIntake:'Not relevant.',
    },
    opqrst: {
      onset:'Breathlessness over a period.',
      provocation:'Reliever inhaler helps to a varying degree.',
      quality:'Wheeze and chest tightness, not pain.',
      radiates:'No.',
      severity:'5',
      time:'Worsening over a period.',
    },
    reveal: {
      diagnosis:'Acute asthma / bronchospasm. Grade the severity, mild, moderate, severe, or life-threatening, and recognise the life-threatening features: a silent chest, exhaustion, cyanosis, altered consciousness, and inability to speak. Target SpO2 94 to 98 per cent (this is NOT the 88 to 92 per cent target used in COPD).',
      pathway:'Assess and maintain the airway and perform a respiratory assessment (consider PEFR before salbutamol). Mild: Salbutamol 5mg nebulised, or 100mcg by metered aerosol repeated as needed. If not improving: ECG and SpO2 monitoring, oxygen, request ALS, and give Salbutamol 5mg nebulised, or Ipratropium 500mcg with Salbutamol 5mg mixed and nebulised (Paramedic); consider CO2 monitoring (Paramedic). Severe: repeat salbutamol; the Advanced Paramedic gives Hydrocortisone 100mg slow IV, then salbutamol again. Life-threatening: the Advanced Paramedic considers Magnesium Sulphate 2g IV; give Salbutamol 5mg nebulised every 5 minutes as needed; time-critical transport.',
      interventions:'Airway and respiratory assessment. Salbutamol is the mainstay and is in Paramedic scope (5mg nebulised, or metered aerosol). For moderate and worse: oxygen titrated to 94 to 98 per cent, ECG/SpO2, request ALS, and add Ipratropium mixed with Salbutamol (Paramedic). Consider CO2 monitoring (Paramedic). Severe and life-threatening add Advanced Paramedic drugs (Hydrocortisone, then Magnesium Sulphate) with continuous salbutamol and time-critical transport. Recognise the life-threatening features early.',
      diagnosisBlocks: [
        { type:'lead', body:'Acute asthma. Grade severity and target SpO2 94 to 98 per cent (not the COPD 88 to 92 target).' },
        { type:'note', body:'Life-threatening features: silent chest, exhaustion, cyanosis, altered consciousness, unable to speak. Recognise these early, time-critical.' },
      ],
      pathwayBlocks: [
        { type:'step', body:'Assess and maintain airway; respiratory assessment; consider PEFR before salbutamol.' },
        { type:'branch', label:'Mild / Moderate', body:'Salbutamol 5mg nebulised. If not improving: oxygen, ECG/SpO2, request ALS, Ipratropium 500mcg + Salbutamol 5mg mixed nebulised (Paramedic). Consider CO2 monitoring.' },
        { type:'branch', label:'Severe', body:'Repeat salbutamol. AP gives Hydrocortisone 100mg slow IV, then salbutamol again.' },
        { type:'branch', label:'Life-threatening', body:'AP considers Magnesium Sulphate 2g IV. Salbutamol 5mg nebulised every 5 minutes prn. Time-critical transport.' },
      ],
      interventionsBlocks: [
        { type:'step', body:'Airway and respiratory assessment. Salbutamol 5mg nebulised, the Paramedic mainstay.' },
        { type:'step', body:'Moderate and worse: oxygen to 94 to 98%, ECG/SpO2, request ALS, add Ipratropium mixed with Salbutamol (Paramedic); consider CO2 monitoring.' },
        { type:'note', body:'Severe / life-threatening add AP drugs (Hydrocortisone, then Magnesium Sulphate) with continuous salbutamol and time-critical transport.' },
      ],
      drugs: [
        { name:'Salbutamol (mainstay, Paramedic scope)',
          adult:{ paramedic:'5mg nebulised, or 100mcg metered aerosol repeated as needed.' } },
        { name:'Ipratropium + Salbutamol (Paramedic)',
          adult:{ paramedic:'Ipratropium 500mcg with Salbutamol 5mg, mixed and nebulised, for moderate and worse.' } },
        { name:'Hydrocortisone (severe)',
          adult:{ ap:'100mg slow IV (infusion in 100mL NaCl 0.9%).' } },
        { name:'Magnesium Sulphate (life-threatening)',
          adult:{ ap:'2g IV (infusion in 100mL NaCl 0.9%).' } },
      ],
    },
  },

  {
    id: 'obstetric',
    name: 'Obstetric Emergency',
    category: 'Obstetric',
    locationBias: ['domestic', 'transport'],
    demographics: { minAge: 16, maxAge: 45, sex: 'female' },
    variants: [
      // V1: Imminent birth / emergency childbirth.
      { cause:'imminent birth', conscious:true,
        dispatch:'You are called to {location} for a PATIENT in labour who feels the baby is coming.',
        presentation:'In established labour with strong frequent contractions, feeling the urge to push, and the baby\u2019s head is visible at the vulva (crowning).',
        allergies:'No known drug allergies.',
        sample:{ symptoms:'Established labour, strong frequent contractions, urge to push, head crowning.', medications:'Nil regular.', pmh:'Full-term pregnancy.', lastIntake:'Not relevant.' },
        opqrst:{ onset:'Contractions started and have become strong and close together.', provocation:'Contractions come in waves.', quality:'Strong tightening pains with an urge to push.', radiates:'Across the abdomen and back.', severity:'8', time:'Labour progressing quickly.' },
        events:'In labour with contractions now strong, frequent and bearing down, birth feels imminent.',
        vitalsOverride:{ hr:{ dir:'up', intensity:0.3 } } },
      // V2: Eclampsia / pre-eclampsia — hypertensive, the Magnesium pathway (its proper home).
      { cause:'eclampsia / pre-eclampsia', conscious:true,
        dispatch:'You are called to {location} for a pregnant PATIENT with a severe headache and swelling.',
        presentation:'Late in pregnancy with a severe headache, visual disturbance and swollen hands and face; may have had a seizure.',
        allergies:'No known drug allergies.',
        sample:{ symptoms:'Late pregnancy, severe headache, visual disturbance, swollen hands and face.', medications:'Nil regular.', pmh:'Pregnancy beyond 20 weeks.', lastIntake:'Not relevant.' },
        opqrst:{ onset:'Headache has built up and is severe.', provocation:'Light makes it worse.', quality:'Severe, pounding headache with blurred vision.', radiates:'Across the head.', severity:'8', time:'Worsening over hours.' },
        events:'Pregnancy beyond 20 weeks with headache, visual disturbance and swelling, and a witnessed seizure.',
        vitalsOverride:{ hr:{ dir:'up', intensity:0.3 }, bpSys:[150,180], bpDia:[95,115] } },
      // V3: Post-partum haemorrhage — can be shocked.
      { cause:'post-partum haemorrhage', conscious:true,
        dispatch:'You are called to {location} for a PATIENT bleeding heavily after giving birth.',
        presentation:'Recently delivered, with heavy ongoing vaginal bleeding, becoming pale and clammy.',
        allergies:'No known drug allergies.',
        sample:{ symptoms:'Recently delivered, heavy ongoing vaginal bleeding, pale and clammy.', medications:'Nil regular.', pmh:'Just delivered; post-partum.', lastIntake:'Not relevant.' },
        opqrst:{ onset:'Bleeding started after the birth and has not settled.', provocation:'Nothing slows it.', quality:'Heavy, continuous bleeding.', radiates:'No.', severity:'7', time:'Since delivering a short time ago.' },
        events:'Delivered recently and is now bleeding heavily and continuously.',
        vitalsOverride:{ hr:{ dir:'up', intensity:0.55 }, bpSys:[80,100], bpDia:[48,64], spo2:[93,97] } },
      // V4: Shoulder dystocia — head out, shoulders stuck. P/AP.
      { cause:'shoulder dystocia', conscious:true,
        dispatch:'You are called to {location} for a PATIENT delivering whose baby\u2019s head is out but the shoulders are stuck.',
        presentation:'Mid-delivery: the baby\u2019s head has delivered but the shoulders are stuck and delivery has stalled.',
        allergies:'No known drug allergies.',
        sample:{ symptoms:'Head delivered, shoulders stuck, delivery stalled.', medications:'Nil regular.', pmh:'Full-term pregnancy, in labour.', lastIntake:'Not relevant.' },
        opqrst:{ onset:'The head delivered but the rest has not followed.', provocation:'Pushing is not advancing the birth.', quality:'Strong contractions, delivery obstructed.', radiates:'Abdomen and back.', severity:'8', time:'Delivery stalled now.' },
        events:'In labour, the baby\u2019s head delivered but the shoulders have become stuck.',
        vitalsOverride:{ hr:{ dir:'up', intensity:0.35 } } },
      // V5: Cord prolapse — time-critical.
      { cause:'cord prolapse', conscious:true,
        dispatch:'You are called to {location} for a PATIENT in labour with the cord visible.',
        presentation:'In labour with the umbilical cord prolapsed and visible at the vulva, before the baby has delivered.',
        allergies:'No known drug allergies.',
        sample:{ symptoms:'In labour, umbilical cord prolapsed and visible at the vulva before delivery.', medications:'Nil regular.', pmh:'Full-term pregnancy, in labour.', lastIntake:'Not relevant.' },
        opqrst:{ onset:'Noticed the cord come down during labour.', provocation:'Contractions ongoing.', quality:'Contraction pains, with the cord now visible.', radiates:'Abdomen and back.', severity:'7', time:'Just now during labour.' },
        events:'In labour when the umbilical cord prolapsed and became visible before the baby delivered.',
        vitalsOverride:{ hr:{ dir:'up', intensity:0.35 } } },
      // V6: Malpresentation / breech. P/AP.
      { cause:'breech / malpresentation', conscious:true,
        dispatch:'You are called to {location} for a PATIENT delivering whose baby is coming bottom-first.',
        presentation:'In labour with the baby presenting breech, bottom or feet first rather than head first.',
        allergies:'No known drug allergies.',
        sample:{ symptoms:'In labour, baby presenting breech (bottom or feet first).', medications:'Nil regular.', pmh:'Full-term pregnancy, in labour.', lastIntake:'Not relevant.' },
        opqrst:{ onset:'Labour progressing but the baby is coming the wrong way round.', provocation:'Contractions ongoing.', quality:'Contraction pains.', radiates:'Abdomen and back.', severity:'7', time:'Labour progressing now.' },
        events:'In labour with the baby presenting breech rather than head first.',
        vitalsOverride:{ hr:{ dir:'up', intensity:0.35 } } },
    ],
    painBased: false,
    deviations: { hr:{ dir:'up', intensity:0.3 } },
    sample: {
      symptoms:'Obstetric emergency; findings depend on the situation.',
      medications:'Usually nil regular; pregnancy-related where relevant.',
      pmh:'Pregnant or recently delivered.',
      lastIntake:'Not usually relevant.',
    },
    opqrst: {
      onset:'Related to labour or the pregnancy.',
      provocation:'Depends on the situation.',
      quality:'Depends on the situation.',
      radiates:'Abdomen and back where relevant.',
      severity:'7',
      time:'Acute, related to labour or the pregnancy.',
    },
    reveal: {
      diagnosis:'Obstetric emergency. Identify the situation: imminent birth, eclampsia or pre-eclampsia, post-partum haemorrhage, shoulder dystocia, cord prolapse, or breech / malpresentation. Most need early ALS and rapid pre-alerted transfer to an obstetric unit. Use a hands-off approach to the cord and avoid manipulation until the baby is fully delivered.',
      pathway:'Imminent birth: prepare, consider a second crew, mother in a position of comfort, support the baby throughout; warm, dry and stimulate; clamp and cut the cord; check for a second baby; Oxytocin 10 international units IM after delivery (Paramedic); skin-to-skin; bring the placenta to hospital. Eclampsia / pre-eclampsia (over 20 weeks with headache, visual disturbance, oedema or seizure, BP over 140/90): request ALS; the Advanced Paramedic gives Magnesium Sulphate 4g IV in 100mL NaCl over 30 minutes; pre-alert. Post-partum haemorrhage: request ALS; Oxytocin 10 units IM (Paramedic); uterine massage; the Advanced Paramedic gives NaCl to maintain a radial pulse and Tranexamic Acid 1g IV. Shoulder dystocia: request ALS; McRoberts position (legs and knees to chest), stop pushing, lateral suprapubic pressure, then the internal manoeuvres; consider all-fours; rapid transfer. Cord prolapse: request ALS; hands off the cord; head-down left lateral position with hips higher than the head; hold the presenting part off the cord; rapid transfer (emergency caesarean may be needed). Breech: request ALS; hands-off passive support as the baby emerges; rapid transfer.',
      interventions:'Across all: request ALS early, optimise the mother, and rapidly transfer with a pre-alert to the obstetric unit; hands off the cord and avoid manipulation until the baby is fully delivered. Paramedic drugs: Oxytocin 10 units IM (after delivery and in post-partum haemorrhage), and Nitrous Oxide with Oxygen for analgesia. Advanced Paramedic drugs (dimmed): Magnesium Sulphate (eclampsia), Tranexamic Acid and IV fluids (haemorrhage), and the indwelling-catheter manoeuvre in prolonged cord-prolapse transfers.',
      diagnosisBlocks: [
        { type:'lead', body:'Obstetric emergency. Identify the situation; most need early ALS and rapid pre-alerted transfer to an obstetric unit.' },
        { type:'note', body:'Hands-off approach to the cord; avoid manipulation, traction and stimulation until the baby is fully delivered. This app describes the steps but does not replace hands-on training.' },
      ],
      pathwayBlocks: [
        { type:'branch', label:'Imminent birth', body:'Prepare; second crew; support the baby; warm/dry/stimulate; clamp and cut cord; check for a second baby; Oxytocin 10 units IM (Paramedic); placenta to hospital.' },
        { type:'branch', label:'Eclampsia / pre-eclampsia', body:'BP over 140/90 with headache/visual disturbance/oedema/seizure: request ALS. AP gives Magnesium Sulphate 4g IV over 30 minutes. Pre-alert.' },
        { type:'branch', label:'Post-partum haemorrhage', body:'Request ALS; Oxytocin 10 units IM (Paramedic); uterine massage; AP gives NaCl to a radial pulse and Tranexamic Acid 1g IV.' },
        { type:'branch', label:'Shoulder dystocia', body:'Request ALS; McRoberts position, stop pushing, suprapubic pressure, internal manoeuvres; consider all-fours; rapid transfer.' },
        { type:'branch', label:'Cord prolapse', body:'Request ALS; hands off the cord; head-down left lateral, hips higher than head; hold the presenting part off the cord; rapid transfer.' },
        { type:'branch', label:'Breech / malpresentation', body:'Request ALS; hands-off passive support as the baby emerges; rapid transfer.' },
      ],
      interventionsBlocks: [
        { type:'step', body:'All: request ALS early, optimise the mother, rapid pre-alerted transfer to an obstetric unit. Hands off the cord until the baby is fully delivered.' },
        { type:'step', body:'Paramedic drugs: Oxytocin 10 units IM (after delivery / post-partum haemorrhage); Nitrous Oxide with Oxygen for analgesia.' },
        { type:'note', body:'AP drugs (dimmed): Magnesium Sulphate (eclampsia), Tranexamic Acid and IV fluids (haemorrhage), indwelling-catheter manoeuvre (prolonged cord-prolapse transfer).' },
      ],
      drugs: [
        { name:'Oxytocin (Paramedic)',
          adult:{ paramedic:'10 international units IM after delivery, and in post-partum haemorrhage (even if given before arrival).' } },
        { name:'Nitrous Oxide & Oxygen (analgesia)',
          adult:{ paramedic:'Consider for analgesia in labour.' } },
        { name:'Magnesium Sulphate (eclampsia)',
          adult:{ ap:'4g IV in 100mL NaCl 0.9% over 30 minutes.' } },
        { name:'Tranexamic Acid / IV fluids (haemorrhage)',
          adult:{ ap:'Tranexamic Acid 1g IV; NaCl 0.9% to maintain a radial pulse (systolic 90 to 100).' } },
      ],
    },
  },

  {
    id: 'headinjury',
    name: 'Head Injury',
    category: 'Trauma',
    demographics: { minAge: 16, maxAge: 85, sex: 'any' },
    variants: [
      // V1: Minor, GCS 15 — alert, orientated.
      { cause:'minor head injury', conscious:true,
        dispatch:'You are called to {location} for a PATIENT who has hit their head.',
        presentation:'Alert and orientated after a blow to the head, with a visible graze and bruise to the scalp, a mild headache and no focal weakness.',
        allergies:'No known drug allergies.',
        sample:{ symptoms:'Alert and orientated, scalp graze and bruise, mild headache, no weakness.', medications:'Nil regular.', pmh:'Nil of note.', lastIntake:'A few hours ago.' },
        opqrst:{ onset:'Right after the bang to the head.', provocation:'The headache is mild.', quality:'A dull ache where I hit it.', radiates:'No.', severity:'2', time:'Since it happened.' },
        events:'Knocked their head and has a sore graze, otherwise feels alright.',
        vitalsOverride:{ hr:{ dir:'up', intensity:0.1 } } },
      // V2: Concussion, GCS 13-14 — drowsy, confused, repetitive.
      { cause:'concussion', conscious:true,
        dispatch:'You are called to {location} for a PATIENT who is confused after a head injury.',
        presentation:'Drowsy and mildly confused following a head injury, asking the same questions repeatedly, with a scalp wound and no major weakness.',
        allergies:'No known drug allergies.',
        sample:{ symptoms:'Drowsy, mildly confused, repeating questions, scalp wound.', medications:'Nil regular.', pmh:'Nil of note.', lastIntake:'Earlier today.' },
        opqrst:{ onset:'Since the head injury.', provocation:'Feels muddled.', quality:'Headache and feeling foggy.', radiates:'No.', severity:'4', time:'Since the injury, not getting worse.' },
        events:'Hit their head and has been confused and repetitive since.',
        vitalsOverride:{ hr:{ dir:'up', intensity:0.2 } } },
      // V3: Moderate, GCS <=12 — eyes to voice, not orientated, vomited. ALS threshold.
      { cause:'moderate head injury', conscious:true,
        dispatch:'You are called to {location} for a PATIENT who is drowsy after a head injury.',
        presentation:'Confused and difficult to rouse after a head injury, opening the eyes only to voice, not fully orientated, and has vomited once.',
        allergies:'No known drug allergies.',
        sample:{ symptoms:'Confused, hard to rouse, eyes open to voice, not orientated, vomited once.', medications:'Nil regular.', pmh:'Nil of note.', lastIntake:'Earlier.' },
        opqrst:{ onset:'Since the head injury, getting more drowsy.', provocation:'Hard to keep awake.', quality:'Very groggy.', radiates:'No.', severity:'5', time:'Worsening since the injury.' },
        events:'Significant head injury, now drowsy and has vomited.',
        vitalsOverride:{ hr:{ dir:'up', intensity:0.25 }, bpSys:[100,118], bpDia:[64,80] } },
      // V4: Severe, GCS <=8 — responds to pain only, irregular breathing. Time-critical.
      { cause:'severe head injury', conscious:false, witness:'unwitnessed',
        dispatch:'You are called to {location} for a PATIENT who is unresponsive after a head injury.',
        presentation:'Unresponsive to voice after a significant head injury, responding only to pain, with irregular breathing and a boggy swelling to the scalp.',
        allergies:'Unknown.',
        sample:{ symptoms:'Unresponsive to voice, responds to pain only, irregular breathing, boggy scalp swelling.', medications:'Unknown.', pmh:'Unknown.', lastIntake:'Unknown.' },
        opqrst:{ onset:'Unknown, found after a head injury.', provocation:'Unknown.', quality:'Unknown.', radiates:'Unknown.', severity:'Unknown.', time:'Unknown.' },
        events:'Significant head injury, now responding only to pain with irregular breathing.',
        vitalsOverride:{ hr:{ dir:'up', intensity:0.2 }, bpSys:[110,128], bpDia:[70,86], spo2Severe:true } },
      // V5: Rising ICP / Cushing's — deteriorating, unequal pupils, bradycardic + hypertensive.
      { cause:'rising intracranial pressure', conscious:false, witness:'unwitnessed',
        dispatch:'You are called to {location} for a PATIENT deteriorating after a head injury.',
        presentation:'Deteriorating conscious level after a head injury, with one pupil larger than the other, vomiting, and becoming slow in pulse with a rising blood pressure.',
        allergies:'Unknown.',
        sample:{ symptoms:'Falling conscious level, unequal pupils, vomiting, slow pulse, rising blood pressure.', medications:'Unknown.', pmh:'Unknown.', lastIntake:'Unknown.' },
        opqrst:{ onset:'Deteriorating since the head injury.', provocation:'Unknown.', quality:'Unknown.', radiates:'Unknown.', severity:'Unknown.', time:'Worsening.' },
        events:'Head injury with a deteriorating conscious level and unequal pupils.',
        vitalsOverride:{ hr:{ dir:'down', intensity:0.4 }, bpSys:[160,195], bpDia:[95,115] } },
      // V6: Head injury with seizure — postictal, drowsy.
      { cause:'head injury with seizure', conscious:true, witness:'witnessed', onsetWhen:'about 15 minutes ago',
        dispatch:'You are called to {location} for a PATIENT who had a seizure after a head injury.',
        presentation:'Postictal and drowsy after a seizure that followed a head injury, with a scalp laceration and slow recovery of awareness.',
        allergies:'No known drug allergies.',
        sample:{ symptoms:'Postictal and drowsy after a seizure following a head injury, scalp laceration.', medications:'Nil regular.', pmh:'Nil of note.', lastIntake:'Earlier.' },
        opqrst:{ onset:'Seizure came on after the head injury.', provocation:'Unknown.', quality:'Drowsy and disorientated now.', radiates:'No.', severity:'Unknown.', time:'Postictal now.' },
        events:'Head injury followed by a seizure, now postictal.',
        vitalsOverride:{ hr:{ dir:'up', intensity:0.3 } } },
    ],
    painBased: false,
    deviations: { hr:{ dir:'up', intensity:0.2 } },
    sample: {
      symptoms:'Head injury; conscious level varies by severity.',
      medications:'Often nil of note.',
      pmh:'Often nil of note.',
      lastIntake:'Variable.',
    },
    opqrst: {
      onset:'After a head injury.',
      provocation:'Depends on severity.',
      quality:'Headache and varying conscious level.',
      radiates:'No.',
      severity:'Variable.',
      time:'Since the injury.',
    },
    reveal: {
      diagnosis:'Head injury. Grade by GCS and track it for deterioration. GCS 12 or less, request ALS. GCS 8 or less, minimise rises in intracranial pressure. Recognise deterioration early: a falling GCS, unequal pupils, or a Cushing response (a slowing pulse with rising blood pressure).',
      pathway:'Maintain the airway (consider an advanced airway) and give oxygen. Control external haemorrhage. Maintain in-line immobilisation and consider spinal injury. SpO2 and ECG monitoring. GCS 12 or less, request ALS. GCS 8 or less, minimise rises in intracranial pressure: pain management, control nausea and vomiting, a 10 degree upward head tilt, and check the collar is not too tight. Avoid hypotension, check blood glucose, watch for seizures, and consider a vacuum mattress.',
      interventions:'The headline is blood-pressure targeting to protect the injured brain. Maintain systolic BP at 120 mmHg if GCS is 8 or less, and at 90 to 100 mmHg if GCS is above 8. Avoid both hypotension and hypoxia, since each worsens secondary brain injury. Airway, oxygen, haemorrhage control and in-line immobilisation are the priorities, with ICP minimisation added once GCS falls to 8 or less.',
      diagnosisBlocks: [
        { type:'lead', body:'Head injury. Grade by GCS: 12 or less request ALS, 8 or less minimise intracranial pressure.' },
        { type:'note', body:'Recognise deterioration: falling GCS, unequal pupils, or a Cushing response (slowing pulse with rising BP). Time-critical.' },
      ],
      pathwayBlocks: [
        { type:'step', body:'Maintain airway (consider advanced airway), oxygen, control haemorrhage, in-line immobilisation, consider spinal injury, SpO2 and ECG.' },
        { type:'branch', label:'GCS 12 or less', body:'Request ALS.' },
        { type:'branch', label:'GCS 8 or less', body:'Minimise rises in intracranial pressure: pain management, control nausea and vomiting, 10 degree upward head tilt, check collar tension.' },
        { type:'step', body:'Avoid hypotension, check blood glucose, watch for seizures, consider a vacuum mattress.' },
      ],
      interventionsBlocks: [
        { type:'lead', body:'Blood-pressure targets protect the brain: systolic 120 mmHg if GCS 8 or less, 90 to 100 mmHg if GCS above 8.' },
        { type:'note', body:'Avoid hypotension and hypoxia, both worsen secondary brain injury.' },
        { type:'step', body:'Airway, oxygen, haemorrhage control and in-line immobilisation first; add ICP minimisation once GCS is 8 or less.' },
      ],
      drugs: [
        { name:'Oxygen', adult:{ paramedic:'Titrate to maintain oxygenation and avoid hypoxia.' } },
        { name:'Sodium Chloride 0.9% (fluids)', adult:{ paramedic:'IV/IO fluids to maintain the systolic BP target (120 if GCS 8 or less, 90 to 100 if GCS above 8).' } },
      ],
    },
  },

  {
    id: 'crushinjury',
    name: 'Crush Injury',
    category: 'Trauma',
    locationBias: ['workplace', 'outdoor'],
    demographics: { minAge: 16, maxAge: 80, sex: 'any' },
    variants: [
      // V1: Limb trapped, short duration, stable.
      { cause:'short-duration entrapment', conscious:true,
        dispatch:'You are called to {location} for a PATIENT trapped after a heavy load shifted.',
        presentation:'Trapped by a heavy load across one leg for a short time, alert and in pain, with stable observations and good colour.',
        allergies:'No known drug allergies.',
        sample:{ symptoms:'Trapped leg, alert, in pain, stable obs, good colour.', medications:'Nil regular.', pmh:'Nil of note.', lastIntake:'Earlier today.' },
        opqrst:{ onset:'When the load came down on the leg.', provocation:'Worse with any movement.', quality:'Crushing, heavy pain.', radiates:'Stays in the trapped leg.', severity:'6', time:'Since becoming trapped a short while ago.' },
        events:'Trapped a short time, currently stable while still pinned.',
        vitalsOverride:{ hr:{ dir:'up', intensity:0.3 } } },
      // V2: Prolonged entrapment, significant compression, still pinned.
      { cause:'prolonged entrapment', conscious:true,
        dispatch:'You are called to {location} for a PATIENT trapped under a heavy load for some time.',
        presentation:'Pinned under significant weight for a prolonged period, still trapped, alert but anxious, with a numb and cold lower limb beyond the compression.',
        allergies:'No known drug allergies.',
        sample:{ symptoms:'Pinned under significant weight a long time, numb cold limb beyond the compression, anxious.', medications:'Nil regular.', pmh:'Nil of note.', lastIntake:'Several hours ago.' },
        opqrst:{ onset:'Trapped for a prolonged period now.', provocation:'The limb feels numb and cold.', quality:'Heavy crushing pressure, then numbness.', radiates:'The whole trapped limb.', severity:'7', time:'Trapped for a long time.' },
        events:'Significant prolonged compression, still pinned, limb numb beyond the trap.',
        vitalsOverride:{ hr:{ dir:'up', intensity:0.4 } } },
      // V3: Crush with developing shock (still trapped, becoming hypotensive).
      { cause:'crush injury with developing shock', conscious:true,
        dispatch:'You are called to {location} for a PATIENT trapped and becoming unwell.',
        presentation:'Trapped under a heavy load and becoming pale, clammy and tachycardic, with a falling blood pressure while still pinned.',
        allergies:'No known drug allergies.',
        sample:{ symptoms:'Trapped, pale, clammy, fast pulse, falling blood pressure.', medications:'Nil regular.', pmh:'Nil of note.', lastIntake:'Earlier.' },
        opqrst:{ onset:'Trapped a while, now feeling faint.', provocation:'Feels worse the longer trapped.', quality:'Crushing pain and now lightheaded.', radiates:'Trapped area.', severity:'8', time:'Deteriorating while trapped.' },
        events:'Crush injury, now showing signs of shock while still trapped.',
        vitalsOverride:{ hr:{ dir:'up', intensity:0.6 }, bpSys:[82,98], bpDia:[50,66] } },
      // V4: Just released — reperfusion deterioration.
      { cause:'post-release deterioration', conscious:true,
        dispatch:'You are called to {location} for a PATIENT just freed from underneath a heavy load.',
        presentation:'Just released after being crushed for some time, now deteriorating with a fast irregular pulse, clammy skin and a swelling, mottled limb.',
        allergies:'No known drug allergies.',
        sample:{ symptoms:'Just freed after a crush, deteriorating, fast irregular pulse, clammy, swollen mottled limb.', medications:'Nil regular.', pmh:'Nil of note.', lastIntake:'Earlier.' },
        opqrst:{ onset:'Got worse right after being released.', provocation:'Deteriorated on release.', quality:'Crushing pain, now feels very unwell.', radiates:'The crushed limb.', severity:'8', time:'Worse since release.' },
        events:'Crushed for some time, deteriorated after being released.',
        vitalsOverride:{ hr:{ dir:'up', intensity:0.7 }, bpSys:[80,96], bpDia:[48,64] } },
    ],
    painBased: false,
    deviations: { hr:{ dir:'up', intensity:0.4 } },
    sample: {
      symptoms:'Crush injury / entrapment; severity varies.',
      medications:'Often nil of note.',
      pmh:'Often nil of note.',
      lastIntake:'Variable.',
    },
    opqrst: {
      onset:'When trapped/compressed.',
      provocation:'Worse with movement; limb may be numb beyond the compression.',
      quality:'Crushing, heavy pressure.',
      radiates:'The trapped/compressed area.',
      severity:'Variable, often severe.',
      time:'Since becoming trapped.',
    },
    reveal: {
      diagnosis:'Crush injury and entrapment. The major danger is crush and reperfusion syndrome on release: as compression comes off, accumulated potassium, acid and toxins wash into the circulation and can trigger collapse and cardiac arrhythmia. Anticipate and pre-empt it rather than react to it.',
      pathway:'Request ALS early. Maintain AcBC (airway with cervical-spine care, breathing, circulation) and give oxygen. Where possible, prepare to manage the patient BEFORE release. Co-ordinate the release timing carefully with the rescue crew. Apply standard trauma care during and after extrication, and be prepared to package and move immediately once freed. Pain management as needed (Pain CPG).',
      interventions:'The headline is pre-release resuscitation, but note the scope limit: gaining IV access (two wide-bore cannulae) and giving NaCl 0.9% 20 mL/kg IV/IO is Advanced Paramedic scope only, a Paramedic cannot cannulate and so cannot deliver IV fluids here. Where an AP is available, commencing fluids before release blunts the reperfusion insult. Otherwise the Paramedic priorities are AcBC, oxygen, analgesia, monitoring, careful release co-ordination and rapid packaging, with ALS requested early.',
      diagnosisBlocks: [
        { type:'lead', body:'Crush injury / entrapment. The danger is crush and reperfusion syndrome ON RELEASE.' },
        { type:'note', body:'As compression lifts, potassium/acid/toxins wash into the circulation: risk of collapse and arrhythmia. Pre-empt it.' },
      ],
      pathwayBlocks: [
        { type:'step', body:'Request ALS early. Maintain AcBC and give oxygen. Manage BEFORE release where possible.' },
        { type:'step', body:'Co-ordinate release timing with the rescue crew. Apply standard trauma care during and after extrication; be ready to package and move on release.' },
        { type:'branch', label:'Significant compression force maintained', body:'Consider requesting a mobile surgical team (for amputation) if the patient cannot otherwise be freed.' },
      ],
      interventionsBlocks: [
        { type:'lead', body:'Fluids before release blunt the reperfusion insult, but this is Advanced Paramedic scope.' },
        { type:'note', body:'IV access (two wide-bore) and NaCl 0.9% 20 mL/kg IV/IO are AP only. A Paramedic cannot cannulate and cannot give IV fluids here.' },
        { type:'step', body:'Paramedic priorities: AcBC, oxygen, analgesia, monitoring, careful release co-ordination, rapid packaging, ALS early.' },
      ],
      drugs: [
        { name:'Oxygen', adult:{ paramedic:'Apply oxygen therapy; maintain oxygenation.' } },
        { name:'Sodium Chloride 0.9% (fluids)', adult:{ ap:'20 mL/kg IV/IO via two wide-bore cannulae, ideally commenced BEFORE release. Advanced Paramedic scope only (IV access required).' } },
      ],
    },
  },

  {
    id: 'harnesssuspension',
    name: 'Harness Suspension Trauma',
    category: 'Trauma',
    demographics: { minAge: 16, maxAge: 70, sex: 'any' },
    variants: [
      // V1: Still suspended, conscious, legs dependent.
      { cause:'suspended in harness, conscious', conscious:true,
        dispatch:'You are called to a workplace at height for a PATIENT whose fall has been arrested by a harness.',
        presentation:'Hanging in a harness with the legs dependent after a fall was arrested, conscious and talking but anxious, with a feeling of light-headedness.',
        allergies:'No known drug allergies.',
        sample:{ symptoms:'Suspended in a harness, legs dependent, conscious, anxious, light-headed.', medications:'Nil regular.', pmh:'Nil of note.', lastIntake:'Earlier today.' },
        opqrst:{ onset:'Since the fall was arrested by the harness.', provocation:'Worse the longer suspended.', quality:'Light-headed, legs feel heavy.', radiates:'No.', severity:'Discomfort rather than pain.', time:'Suspended for a little while now.' },
        events:'Fall arrested by a harness, still suspended and light-headed.',
        vitalsOverride:{ hr:{ dir:'up', intensity:0.3 } } },
      // V2: Just rescued, at risk of reflow collapse.
      { cause:'just rescued from suspension', conscious:true,
        dispatch:'You are called to a workplace at height for a PATIENT just lowered after their fall was arrested by a harness.',
        presentation:'Just lowered to the ground after a period suspended in a harness, conscious but pale and clammy, feeling faint as they are repositioned.',
        allergies:'No known drug allergies.',
        sample:{ symptoms:'Just lowered after suspension, pale, clammy, feeling faint on repositioning.', medications:'Nil regular.', pmh:'Nil of note.', lastIntake:'Earlier.' },
        opqrst:{ onset:'Felt faint once lowered to the ground.', provocation:'Worse when moved upright.', quality:'Faint and washed-out.', radiates:'No.', severity:'Feels very unwell.', time:'Since being lowered.' },
        events:'Suspended for a time, now lowered and feeling faint.',
        vitalsOverride:{ hr:{ dir:'up', intensity:0.45 }, bpSys:[92,108], bpDia:[58,72] } },
      // V3: Prolonged suspension with shock.
      { cause:'prolonged suspension with shock', conscious:true,
        dispatch:'You are called to a workplace at height for a PATIENT suspended in a harness for a prolonged period.',
        presentation:'Suspended in a harness for a prolonged period, now drowsy, pale and clammy with a fast pulse and a low blood pressure.',
        allergies:'No known drug allergies.',
        sample:{ symptoms:'Prolonged suspension, drowsy, pale, clammy, fast pulse, low blood pressure.', medications:'Nil regular.', pmh:'Nil of note.', lastIntake:'Several hours ago.' },
        opqrst:{ onset:'Suspended a long time, getting worse.', provocation:'Worse the longer suspended.', quality:'Faint, drowsy, weak.', radiates:'No.', severity:'Very unwell.', time:'Deteriorating while suspended.' },
        events:'Prolonged harness suspension, now showing signs of shock.',
        vitalsOverride:{ hr:{ dir:'up', intensity:0.6 }, bpSys:[80,96], bpDia:[48,64] } },
    ],
    painBased: false,
    deviations: { hr:{ dir:'up', intensity:0.4 } },
    sample: {
      symptoms:'Harness suspension; severity varies with suspension time.',
      medications:'Often nil of note.',
      pmh:'Often nil of note.',
      lastIntake:'Variable.',
    },
    opqrst: {
      onset:'After a fall was arrested by a harness.',
      provocation:'Worse the longer suspended.',
      quality:'Light-headedness, faintness, heavy legs.',
      radiates:'No.',
      severity:'Discomfort to collapse depending on suspension time.',
      time:'Since suspension.',
    },
    reveal: {
      diagnosis:'Harness suspension trauma. Prolonged motionless suspension lets blood pool in the dependent legs, reducing venous return (suspension or orthostatic shock). A further danger is collapse shortly after rescue as pooled blood returns to the circulation (reflow). Horizontal positioning protects against both.',
      pathway:'Practitioner safety is paramount, this CPG does not authorise rescue by untrained personnel. While the patient is still suspended, advise them to move their legs to encourage venous return and elevate the lower limbs if possible during rescue. Request ALS. Once rescued, place the patient horizontal as soon as practically possible and keep them flat. If circulation is compromised, remove the harness once the patient is safely lowered. Monitor BP, SpO2 and ECG, and give oxygen to maintain SpO2 above 94%. Patients must be transported to ED following suspension trauma regardless of how well they appear.',
      interventions:'The two headlines are horizontal positioning and mandatory transport. Lay the patient flat as soon as practical and watch closely for deterioration after rescue. Every suspension-trauma patient goes to ED regardless of apparent injury, because deterioration can be delayed. Fluid support (NaCl 0.9% 2L IV, titrated to keep systolic BP above 90 mmHg) is Advanced Paramedic scope: a Paramedic cannot cannulate and so cannot give IV fluids here.',
      diagnosisBlocks: [
        { type:'lead', body:'Harness suspension trauma. Pooling in the dependent legs reduces venous return (suspension shock); collapse can also follow rescue (reflow).' },
        { type:'note', body:'Horizontal positioning protects against both. Keep the patient flat.' },
      ],
      pathwayBlocks: [
        { type:'note', body:'Practitioner safety is paramount. This CPG does not authorise rescue by untrained personnel.' },
        { type:'step', body:'While suspended: advise the patient to move their legs to encourage venous return; elevate the lower limbs if possible during rescue. Request ALS.' },
        { type:'step', body:'Once rescued: place horizontal as soon as practically possible and keep flat. If circulation is compromised, remove the harness once safely lowered.' },
        { type:'step', body:'Monitor BP, SpO2 and ECG. Oxygen to maintain SpO2 above 94%.' },
      ],
      interventionsBlocks: [
        { type:'lead', body:'Two headlines: lay the patient horizontal as soon as practical, and transport every suspension-trauma patient to ED regardless of apparent injury (deterioration can be delayed).' },
        { type:'note', body:'NaCl 0.9% 2L IV, titrated to keep systolic BP above 90 mmHg, is Advanced Paramedic scope. A Paramedic cannot cannulate and cannot give IV fluids here.' },
      ],
      drugs: [
        { name:'Oxygen', adult:{ paramedic:'Titrate to maintain SpO2 above 94%.' } },
        { name:'Sodium Chloride 0.9% (fluids)', adult:{ ap:'2L IV, titrated to maintain systolic BP above 90 mmHg. Advanced Paramedic scope only (IV access required).' } },
      ],
    },
  },

  {
    id: 'adrenalinsufficiency',
    name: 'Adrenal Insufficiency',
    category: 'Endocrine',
    demographics: { minAge: 16, maxAge: 80, sex: 'any' },
    variants: [
      // V1: Known Addison's, intercurrent illness, early (not yet in crisis).
      { cause:'known Addisons with intercurrent illness', conscious:true,
        dispatch:'You are called to {location} for a PATIENT who feels unwell with a recent illness.',
        presentation:'Feeling increasingly fatigued and washed out during a recent illness, with mild light-headedness on standing, in a patient who is known to have Addisons disease.',
        allergies:'No known drug allergies.',
        sample:{ symptoms:'Fatigued and washed out during a recent illness, mildly light-headed on standing.', medications:'Hydrocortisone tablets, Fludrocortisone tablets.', pmh:'Addisons disease.', lastIntake:'Took regular tablets this morning.' },
        opqrst:{ onset:'Building over the last day or two with the illness.', provocation:'Worse when standing.', quality:'Drained and weak.', radiates:'No.', severity:'4', time:'Gradually since the illness started.' },
        events:'Known Addisons, unwell with a recent illness, increasingly fatigued.',
        vitalsOverride:{ hr:{ dir:'up', intensity:0.2 }, bpSys:[100,116], bpDia:[64,78] } },
      // V2: Addisonian crisis, hypotensive, vomiting, dehydrated.
      { cause:'Addisonian crisis with hypotension', conscious:true,
        dispatch:'You are called to {location} for a PATIENT who is vomiting and very weak.',
        presentation:'Profoundly weak with vomiting and signs of dehydration, hypotensive even when lying down, in a patient known to have Addisons disease.',
        allergies:'No known drug allergies.',
        sample:{ symptoms:'Profound weakness, vomiting, dehydrated, hypotensive even lying down.', medications:'Hydrocortisone tablets, Fludrocortisone tablets.', pmh:'Addisons disease.', lastIntake:'Has been vomiting, not kept tablets down.' },
        opqrst:{ onset:'Worsening over today.', provocation:'Vomiting makes it worse, cannot keep fluids or tablets down.', quality:'Severe weakness and nausea.', radiates:'No.', severity:'7', time:'Deteriorating through the day.' },
        events:'Known Addisons, now vomiting, dehydrated and hypotensive.',
        vitalsOverride:{ hr:{ dir:'up', intensity:0.5 }, bpSys:[80,96], bpDia:[48,62] } },
      // V3: Addisonian crisis with hypoglycaemia, confused.
      { cause:'Addisonian crisis with hypoglycaemia', conscious:true,
        dispatch:'You are called to {location} for a PATIENT who is confused and unwell.',
        presentation:'Confused and clammy with slurred speech and a low blood glucose, weak and hypotensive, in a patient known to have Addisons disease.',
        allergies:'No known drug allergies.',
        sample:{ symptoms:'Confused, clammy, slurred speech, low blood glucose, weak, hypotensive.', medications:'Hydrocortisone tablets, Fludrocortisone tablets.', pmh:'Addisons disease.', lastIntake:'Has not eaten much, been unwell.' },
        opqrst:{ onset:'Became confused over the last while.', provocation:'Unknown.', quality:'Muddled and weak.', radiates:'No.', severity:'Unknown, hard to assess.', time:'Worsening.' },
        events:'Known Addisons, now confused with a low blood glucose.',
        vitalsOverride:{ hr:{ dir:'up', intensity:0.45 }, bpSys:[84,100], bpDia:[50,64] } },
      // V4: Addisonian crisis with collapse / convulsions, severe.
      { cause:'severe Addisonian crisis with collapse', conscious:false,
        dispatch:'You are called to {location} for a PATIENT who has collapsed.',
        presentation:'Collapsed and barely rousable after a period of severe vomiting and weakness, profoundly hypotensive, in a patient known to have Addisons disease.',
        allergies:'Unknown.',
        sample:{ symptoms:'Collapsed, barely rousable, profoundly hypotensive after severe vomiting and weakness.', medications:'Hydrocortisone and Fludrocortisone tablets (per family).', pmh:'Addisons disease (per family).', lastIntake:'Unwell and vomiting, unclear.' },
        opqrst:{ onset:'Collapsed after getting progressively worse.', provocation:'Unknown.', quality:'Unknown.', radiates:'Unknown.', severity:'Unknown.', time:'Sudden collapse after deterioration.' },
        events:'Known Addisons, severe deterioration then collapse.',
        vitalsOverride:{ hr:{ dir:'up', intensity:0.6 }, bpSys:[72,88], bpDia:[42,56] } },
    ],
    painBased: false,
    deviations: { hr:{ dir:'up', intensity:0.4 }, bpSys:[88,104] },
    sample: {
      symptoms:'Known adrenal insufficiency; unwell with features of crisis.',
      medications:'Hydrocortisone and Fludrocortisone tablets.',
      pmh:'Addisons disease / adrenal insufficiency.',
      lastIntake:'Variable; often poor intake or vomiting.',
    },
    opqrst: {
      onset:'Often during an intercurrent illness or stressor.',
      provocation:'Worse with vomiting and dehydration.',
      quality:'Weakness, fatigue, nausea.',
      radiates:'May have penetrating pain in legs, lower back or abdomen.',
      severity:'Mild fatigue to collapse.',
      time:'Building over hours to a day or two.',
    },
    reveal: {
      diagnosis:'Adrenal insufficiency, with the danger being an Addisonian crisis, in a patient who is already known to have Addisons disease or adrenal insufficiency. Recognise the crisis: hypotension even when lying down, severe vomiting and diarrhoea with dehydration, hypoglycaemia, confusion and slurred speech, fatigue, syncope, penetrating pain in the legs, lower back or abdomen, and in severe cases convulsions.',
      pathway:'In a known patient with a recent illness or injury, check the blood glucose. If this is an Addisonian crisis, request ALS and treat. If the patient is not in crisis, encourage them to take their own oral hydrocortisone. Do not miss hypoglycaemia, treat it on its own merits.',
      interventions:'Hydrocortisone is the definitive treatment and fluids correct the hypotension and dehydration. Note the scope split: Hydrocortisone 100 mg IM is within Paramedic scope, so a Paramedic can treat the crisis. Hydrocortisone 100 mg IV (in 100 mL NaCl 0.9%) and NaCl 0.9% 1L IV are Advanced Paramedic scope, since IV access is required. Hypotension that persists even when lying flat is a red-flag sign of a true crisis.',
      diagnosisBlocks: [
        { type:'lead', body:'Adrenal insufficiency in a known patient, watch for Addisonian crisis.' },
        { type:'note', body:'Crisis features: hypotension even when lying, vomiting/diarrhoea with dehydration, hypoglycaemia, confusion, fatigue, syncope, penetrating leg/back/abdominal pain, convulsions.' },
      ],
      pathwayBlocks: [
        { type:'step', body:'Known patient with recent illness or injury: check blood glucose.' },
        { type:'branch', label:'Addisonian crisis', body:'Request ALS and treat: hydrocortisone and fluids.' },
        { type:'branch', label:'Not in crisis', body:'Encourage the patient to take their own oral hydrocortisone.' },
        { type:'note', body:'Do not miss hypoglycaemia, treat it in its own right.' },
      ],
      interventionsBlocks: [
        { type:'lead', body:'Hydrocortisone is definitive; fluids correct hypotension and dehydration.' },
        { type:'note', body:'Scope split: Hydrocortisone 100 mg IM is Paramedic scope. Hydrocortisone 100 mg IV (in 100 mL NaCl) and NaCl 0.9% 1L IV are AP scope (IV access required).' },
        { type:'step', body:'Hypotension that persists even lying flat is a red flag for a true crisis.' },
      ],
      drugs: [
        { name:'Hydrocortisone', adult:{ paramedic:'100 mg IM. Within Paramedic scope, so the crisis can be treated without IV access.', ap:'100 mg IV in 100 mL NaCl 0.9%, infused over 20 to 30 minutes.' } },
        { name:'Sodium Chloride 0.9% (fluids)', adult:{ ap:'1L IV infusion for hypotension and dehydration. Advanced Paramedic scope only (IV access required).' } },
        { name:'Oxygen', adult:{ paramedic:'As required to maintain oxygenation.' } },
      ],
    },
  },

  {
    id: 'epistaxis',
    name: 'Epistaxis',
    category: 'ENT',
    demographics: { minAge: 16, maxAge: 85, sex: 'any' },
    variants: [
      // V1: Simple medical epistaxis, controllable.
      { cause:'simple medical epistaxis', conscious:true,
        dispatch:'You are called to {location} for a PATIENT with a nosebleed.',
        presentation:'A spontaneous nosebleed from one nostril, alert and otherwise well, with a modest amount of bleeding and no facial injury.',
        allergies:'No known drug allergies.',
        sample:{ symptoms:'Spontaneous nosebleed from one nostril, otherwise well, modest bleeding, no facial injury.', medications:'Nil regular.', pmh:'Nil of note.', lastIntake:'Earlier today.' },
        opqrst:{ onset:'Started on its own a short while ago.', provocation:'No clear trigger.', quality:'Steady trickle from one nostril.', radiates:'No.', severity:'Modest bleeding.', time:'A few minutes ago.' },
        events:'Nosebleed came on by itself, otherwise well.',
        vitalsOverride:{ hr:{ dir:'up', intensity:0.1 } } },
      // V2: Traumatic epistaxis after facial trauma.
      { cause:'traumatic epistaxis', conscious:true,
        dispatch:'You are called to {location} for a PATIENT with a nosebleed after a knock to the face.',
        presentation:'A nosebleed following a knock to the face, with swelling and tenderness over the nose and bleeding from both nostrils, alert and orientated.',
        allergies:'No known drug allergies.',
        sample:{ symptoms:'Nosebleed after a facial knock, swelling and tenderness over the nose, bleeding from both nostrils.', medications:'Nil regular.', pmh:'Nil of note.', lastIntake:'Earlier.' },
        opqrst:{ onset:'Right after the knock to the face.', provocation:'Tender over the nose.', quality:'Bleeding from both nostrils.', radiates:'No.', severity:'Moderate bleeding.', time:'Since the injury.' },
        events:'Took a knock to the face, now has a nosebleed and a tender swollen nose.',
        vitalsOverride:{ hr:{ dir:'up', intensity:0.2 } } },
      // V3: Persistent epistaxis, not controlled by pressure.
      { cause:'persistent uncontrolled epistaxis', conscious:true,
        dispatch:'You are called to {location} for a PATIENT with a nosebleed that will not stop.',
        presentation:'A heavy nosebleed that has continued despite prolonged pressure, alert but with ongoing brisk bleeding and blood-stained clothing.',
        allergies:'No known drug allergies.',
        sample:{ symptoms:'Heavy nosebleed continuing despite prolonged pressure, brisk ongoing bleeding, blood-stained clothing.', medications:'Nil regular.', pmh:'Nil of note.', lastIntake:'Earlier.' },
        opqrst:{ onset:'Started a while ago and has not settled.', provocation:'Keeps bleeding despite pressure.', quality:'Brisk steady bleeding.', radiates:'No.', severity:'Heavy, not controlling.', time:'Ongoing for a prolonged period.' },
        events:'Nosebleed that has not stopped despite prolonged pressure.',
        vitalsOverride:{ hr:{ dir:'up', intensity:0.35 } } },
      // V4: Epistaxis with hypovolaemia, anticoagulated patient.
      { cause:'epistaxis with hypovolaemia', conscious:true,
        dispatch:'You are called to {location} for a PATIENT with a heavy nosebleed who feels faint.',
        presentation:'A prolonged heavy nosebleed in a patient who is now pale, clammy and lightheaded with a fast pulse, having lost a significant amount of blood.',
        allergies:'No known drug allergies.',
        sample:{ symptoms:'Prolonged heavy nosebleed, now pale, clammy, lightheaded, fast pulse, significant blood loss.', medications:'Eliquis.', pmh:'Atrial fibrillation.', lastIntake:'Earlier.' },
        opqrst:{ onset:'Bleeding heavily for a prolonged time.', provocation:'Cannot get it to stop.', quality:'Heavy continuous bleeding.', radiates:'No.', severity:'Heavy, now feeling faint.', time:'Prolonged, with increasing blood loss.' },
        events:'Heavy prolonged nosebleed, now feeling faint with significant blood loss.',
        vitalsOverride:{ hr:{ dir:'up', intensity:0.55 }, bpSys:[84,100], bpDia:[52,66] } },
    ],
    painBased: false,
    deviations: { hr:{ dir:'up', intensity:0.2 } },
    sample: {
      symptoms:'Epistaxis (nosebleed); medical or traumatic, severity varies.',
      medications:'Often nil; anticoagulants raise bleeding risk.',
      pmh:'Often nil of note.',
      lastIntake:'Variable.',
    },
    opqrst: {
      onset:'Spontaneous or after facial trauma.',
      provocation:'May continue despite pressure.',
      quality:'Bleeding from one or both nostrils.',
      radiates:'No.',
      severity:'Modest to heavy.',
      time:'Recent onset.',
    },
    reveal: {
      diagnosis:'Epistaxis. Establish whether it is medical (spontaneous) or traumatic, since trauma may carry other facial injury. Most nosebleeds are controlled with simple measures; the priority is recognising the small number that are uncontrolled or causing hypovolaemia, particularly in patients on anticoagulants.',
      pathway:'For a medical nosebleed, advise the patient to sit forward. For both medical and traumatic: apply firm digital pressure to the soft part of the nose for 15 minutes, advise the patient to breathe through the mouth only, and not to blow the nose. If the haemorrhage is not controlled, consider ALS and consider insertion of a nasal pack (Paramedic scope). If the patient becomes hypovolaemic, request ALS and follow the Shock CPG.',
      interventions:'Correct simple first aid controls the large majority: sit forward, 15 minutes of continuous digital pressure to the soft part of the nose, mouth-breathing, and no nose-blowing. Escalation runs from a nasal pack (Paramedic) for uncontrolled bleeding through to the Shock pathway if the patient becomes hypovolaemic. There is no specific drug treatment; an anticoagulant history (for example Eliquis, Xarelto or Warfant) is the key risk factor for a significant bleed.',
      diagnosisBlocks: [
        { type:'lead', body:'Epistaxis. Branch medical (spontaneous) vs traumatic (may have other facial injury).' },
        { type:'note', body:'Most are controlled simply. Spot the uncontrolled or hypovolaemic patient, especially on anticoagulants.' },
      ],
      pathwayBlocks: [
        { type:'branch', label:'Medical', body:'Advise the patient to sit forward.' },
        { type:'step', body:'Both: firm digital pressure to the soft part of the nose for 15 minutes, breathe through the mouth only, do not blow the nose.' },
        { type:'branch', label:'Not controlled', body:'Consider ALS and consider insertion of a nasal pack (Paramedic scope).' },
        { type:'branch', label:'Hypovolaemic', body:'Request ALS and follow the Shock CPG.' },
      ],
      interventionsBlocks: [
        { type:'lead', body:'Simple first aid controls most: sit forward, 15 minutes continuous pressure to the soft part of the nose, mouth-breathing, no nose-blowing.' },
        { type:'step', body:'Escalate: nasal pack (Paramedic) for uncontrolled bleeding, then the Shock pathway if hypovolaemic.' },
        { type:'note', body:'No specific drug treatment. An anticoagulant history (Eliquis, Xarelto, Warfant) is the key risk factor.' },
      ],
      drugs: [
        { name:'Oxygen', adult:{ paramedic:'As required if hypovolaemic or hypoxic.' } },
      ],
    },
  },

  {
    id: 'sicklecell',
    name: 'Sickle Cell Crisis',
    category: 'Haematological',
    demographics: { minAge: 16, maxAge: 60, sex: 'any' },
    painBased: true,
    variants: [
      // V1: Vaso-occlusive pain crisis — the classic.
      { cause:'vaso-occlusive pain crisis', conscious:true,
        dispatch:'You are called to {location} for a PATIENT in severe pain.',
        presentation:'Severe deep pain in the limbs and lower back, distressed and restless, in a patient who is known to have sickle cell disease.',
        allergies:'No known drug allergies.',
        sample:{ symptoms:'Severe deep limb and lower back pain, distressed and restless.', medications:'My folic acid tablet, and pain relief at home.', pmh:'Sickle cell disease.', lastIntake:'Earlier today.' },
        opqrst:{ onset:'Came on over the last few hours.', provocation:'Nothing makes it ease.', quality:'Deep, gnawing, severe pain.', radiates:'Across the limbs and back.', severity:'9', time:'Building over hours, typical of my crises.' },
        events:'Known sickle cell, now in a severe pain crisis.',
        vitalsOverride:{ hr:{ dir:'up', intensity:0.5 } } },
      // V2: Sickle crisis with fever — sepsis risk (the trap).
      { cause:'sickle crisis with fever', conscious:true,
        dispatch:'You are called to {location} for a PATIENT in pain with a fever.',
        presentation:'In a painful crisis with a high temperature, hot and unwell, in a patient who is known to have sickle cell disease.',
        allergies:'No known drug allergies.',
        sample:{ symptoms:'Painful crisis with a high temperature, hot and unwell.', medications:'My folic acid tablet.', pmh:'Sickle cell disease.', lastIntake:'Not eating much, feeling unwell.' },
        opqrst:{ onset:'Pain and fever over the last day.', provocation:'Nothing eases it.', quality:'Deep crisis pain, feeling feverish.', radiates:'Limbs and back.', severity:'8', time:'Worsening with the fever.' },
        events:'Known sickle cell, painful crisis now with a fever.',
        vitalsOverride:{ hr:{ dir:'up', intensity:0.55 }, rr:{ dir:'up', intensity:0.3 }, temp:[38.5,40.0] } },
      // V3: Sickle crisis with dehydration, unable to take oral fluids.
      { cause:'sickle crisis with dehydration', conscious:true,
        dispatch:'You are called to {location} for a PATIENT in pain who cannot keep fluids down.',
        presentation:'In a painful crisis and visibly dehydrated, unable to keep oral fluids down, with dry lips and a fast pulse, in a patient known to have sickle cell disease.',
        allergies:'No known drug allergies.',
        sample:{ symptoms:'Painful crisis, dehydrated, unable to keep oral fluids down, dry lips, fast pulse.', medications:'My folic acid tablet.', pmh:'Sickle cell disease.', lastIntake:'Cannot keep fluids down.' },
        opqrst:{ onset:'Pain over the day, now very dry.', provocation:'Cannot drink, brings it back up.', quality:'Deep crisis pain.', radiates:'Limbs and back.', severity:'8', time:'Worsening with dehydration.' },
        events:'Known sickle cell, painful crisis with dehydration and unable to take oral fluids.',
        vitalsOverride:{ hr:{ dir:'up', intensity:0.6 }, bpSys:[96,112], bpDia:[58,72] } },
      // V4: Acute chest crisis — chest pain, respiratory distress, hypoxia. Most dangerous.
      { cause:'acute chest crisis', conscious:true,
        dispatch:'You are called to {location} for a PATIENT with chest pain and breathlessness.',
        presentation:'Chest pain with breathlessness and a low oxygen level, working hard to breathe and distressed, in a patient who is known to have sickle cell disease.',
        allergies:'No known drug allergies.',
        sample:{ symptoms:'Chest pain, breathlessness, low oxygen level, working hard to breathe, distressed.', medications:'My folic acid tablet.', pmh:'Sickle cell disease.', lastIntake:'Earlier.' },
        opqrst:{ onset:'Chest pain and breathlessness developing over hours.', provocation:'Worse on breathing in.', quality:'Tight chest, cannot catch my breath.', radiates:'Across the chest.', severity:'9', time:'Worsening, frightening.' },
        events:'Known sickle cell, now with chest pain, breathlessness and low oxygen.',
        vitalsOverride:{ hr:{ dir:'up', intensity:0.6 }, rr:{ dir:'up', intensity:0.5 }, spo2:[86,93] } },
    ],
    deviations: { hr:{ dir:'up', intensity:0.5 } },
    sample: {
      symptoms:'Known sickle cell disease in a painful crisis; severity and complications vary.',
      medications:'Often folic acid and home analgesia.',
      pmh:'Sickle cell disease.',
      lastIntake:'Variable.',
    },
    opqrst: {
      onset:'Crisis pain building over hours.',
      provocation:'Little eases it; dehydration, cold and infection can trigger crises.',
      quality:'Deep, severe pain.',
      radiates:'Limbs, back, chest or abdomen.',
      severity:'Often severe.',
      time:'Hours, familiar to the patient as a crisis.',
    },
    reveal: {
      diagnosis:'Sickle cell crisis in a patient already known to have sickle cell disease. The common picture is a vaso-occlusive pain crisis, but screen actively for two dangers: fever (sickle cell patients are functionally immunosuppressed and at high risk of serious infection) and the acute chest crisis (chest pain, breathlessness and hypoxia), which is the most dangerous presentation.',
      pathway:'Give high-flow oxygen, 15L via a non-rebreather mask. If pain management is required, follow the Pain CPG. If there is an elevated temperature, follow the Sepsis CPG, do not dismiss fever in a sickle cell patient. Warm the patient if they are cold. Encourage oral fluids. If they are dehydrated and unable to take oral fluids, request ALS for NaCl 0.9% 1L IV. Monitor SpO2 and ECG. Consider the patient\\u2019s own care plan, as many have individualised crisis plans.',
      interventions:'The core is high-flow oxygen, effective pain management and fluids. The headline safety teaching is the fever screen: because sickle cell patients are at high infection risk, an elevated temperature means treating along the Sepsis pathway rather than assuming it is just the crisis. IV fluids (NaCl 0.9% 1L) for the dehydrated patient who cannot drink are Advanced Paramedic scope, since IV access is required. Always consider the patient\\u2019s individualised care plan.',
      diagnosisBlocks: [
        { type:'lead', body:'Sickle cell crisis in a known patient. Usual picture: vaso-occlusive pain crisis.' },
        { type:'note', body:'Screen for two dangers: FEVER (high infection risk, functionally immunosuppressed) and ACUTE CHEST CRISIS (chest pain, breathlessness, hypoxia, the most dangerous).' },
      ],
      pathwayBlocks: [
        { type:'step', body:'High-flow oxygen: 15L via non-rebreather mask.' },
        { type:'branch', label:'Pain', body:'Follow the Pain CPG.' },
        { type:'branch', label:'Elevated temperature', body:'Follow the Sepsis CPG. Do not dismiss fever in a sickle cell patient.' },
        { type:'step', body:'Warm if cold. Encourage oral fluids. Monitor SpO2 and ECG. Consider the patient\\u2019s own care plan.' },
        { type:'branch', label:'Dehydrated, cannot take oral fluids', body:'Request ALS for NaCl 0.9% 1L IV.' },
      ],
      interventionsBlocks: [
        { type:'lead', body:'Core: high-flow oxygen, effective pain management, fluids.' },
        { type:'note', body:'Fever screen is the safety teaching: sickle cell patients are high infection risk, so treat fever along the Sepsis pathway.' },
        { type:'step', body:'NaCl 0.9% 1L IV for the dehydrated patient who cannot drink is Advanced Paramedic scope (IV access required). Consider the individualised care plan.' },
      ],
      drugs: [
        { name:'Oxygen', adult:{ paramedic:'15L via non-rebreather mask (high-flow).' } },
        { name:'Sodium Chloride 0.9% (fluids)', adult:{ ap:'1L IV infusion if dehydrated and unable to take oral fluids. Advanced Paramedic scope only (IV access required).' } },
      ],
    },
  },

  {
    id: 'pulmonaryoedema',
    name: 'Acute Pulmonary Oedema',
    category: 'Respiratory',
    demographics: { minAge: 45, maxAge: 90, sex: 'any' },
    variants: [
      // V1: Moderate APO — breathless, crepitations, SpO2 low-90s, sitting up.
      { cause:'moderate pulmonary oedema', conscious:true,
        dispatch:'You are called to {location} for a PATIENT who is breathless and cannot lie flat.',
        presentation:'Breathless and unable to lie flat, sitting bolt upright, with fine crackles heard at both lung bases and a low-90s oxygen level.',
        allergies:'No known drug allergies.',
        sample:{ symptoms:'Breathless, cannot lie flat, sitting upright, crackles at both bases, low-90s oxygen level.', medications:'Lasix, Eliquis.', pmh:'High blood pressure, atrial fibrillation.', lastIntake:'Earlier today.' },
        opqrst:{ onset:'Breathlessness built up over the evening.', provocation:'Worse lying flat, better sitting up.', quality:'Cannot get a full breath.', radiates:'No.', severity:'Distressing breathlessness.', time:'Worsening over a few hours.' },
        events:'Increasingly breathless tonight, has to sit up to breathe.',
        vitalsOverride:{ rr:{ dir:'up', intensity:0.4 }, spo2:[90,94], hr:{ dir:'up', intensity:0.3 }, bpSys:[150,180], bpDia:[88,104] } },
      // V2: Severe APO needing CPAP — marked distress, RR>25, SpO2<95, frothy sputum.
      { cause:'severe pulmonary oedema', conscious:true,
        dispatch:'You are called to {location} for a PATIENT in severe respiratory distress.',
        presentation:'In marked respiratory distress, gasping and unable to speak full sentences, with widespread crackles, frothy pink-tinged sputum and a low oxygen level.',
        allergies:'No known drug allergies.',
        sample:{ symptoms:'Marked distress, gasping, cannot speak full sentences, widespread crackles, frothy pink-tinged sputum, low oxygen.', medications:'Lasix, my water tablet.', pmh:'Heart failure, high blood pressure.', lastIntake:'Earlier.' },
        opqrst:{ onset:'Got severe over the last hour.', provocation:'Cannot lie down at all.', quality:'Drowning feeling, cannot catch breath.', radiates:'No.', severity:'Severe, frightening.', time:'Rapidly worsening.' },
        events:'Severe breathlessness with frothy sputum, distressed and gasping.',
        vitalsOverride:{ rr:{ dir:'up', intensity:0.6 }, spo2:[84,92], hr:{ dir:'up', intensity:0.4 }, bpSys:[155,190], bpDia:[92,110] } },
      // V3: APO with STEMI on ECG — divert to ACS.
      { cause:'pulmonary oedema with STEMI', conscious:true,
        dispatch:'You are called to {location} for a PATIENT who is breathless with chest discomfort.',
        presentation:'Breathless with crackles at the lung bases and chest discomfort, sweaty and unwell, with an ECG that shows ST elevation.',
        allergies:'No known drug allergies.',
        sample:{ symptoms:'Breathless, basal crackles, chest discomfort, sweaty, ECG shows ST elevation.', medications:'Lasix, a heart tablet.', pmh:'High blood pressure, previous heart trouble.', lastIntake:'Earlier.' },
        opqrst:{ onset:'Breathless and chest discomfort came together.', provocation:'Both worse on exertion.', quality:'Tight chest and breathless.', radiates:'Some discomfort into the arm.', severity:'Significant.', time:'Over the last hour or two.' },
        events:'Breathless with chest discomfort, looks unwell and sweaty.',
        vitalsOverride:{ rr:{ dir:'up', intensity:0.4 }, spo2:[88,94], hr:{ dir:'up', intensity:0.35 }, bpSys:[140,170], bpDia:[84,100] } },
      // V4: APO with low BP — CPAP excluded.
      { cause:'pulmonary oedema with hypotension', conscious:true,
        dispatch:'You are called to {location} for a PATIENT who is breathless and looks very unwell.',
        presentation:'Breathless with crackles throughout the chest but pale and clammy with a low blood pressure, unable to tolerate sitting fully upright.',
        allergies:'No known drug allergies.',
        sample:{ symptoms:'Breathless, widespread crackles, pale, clammy, low blood pressure, cannot sit fully upright.', medications:'Lasix, my water tablet.', pmh:'Heart failure.', lastIntake:'Earlier.' },
        opqrst:{ onset:'Breathless and faint over the last while.', provocation:'Worse on any exertion.', quality:'Breathless and washed-out.', radiates:'No.', severity:'Very unwell.', time:'Worsening.' },
        events:'Breathless with crackles but also pale, clammy and hypotensive.',
        vitalsOverride:{ rr:{ dir:'up', intensity:0.45 }, spo2:[86,93], hr:{ dir:'up', intensity:0.4 }, bpSys:[78,88], bpDia:[48,60] } },
    ],
    painBased: false,
    deviations: { rr:{ dir:'up', intensity:0.4 }, spo2:[88,94], bpSys:[150,180] },
    sample: {
      symptoms:'Respiratory distress with congestion and crepitations.',
      medications:'Often diuretics and cardiac medicines.',
      pmh:'Often heart failure, hypertension or atrial fibrillation.',
      lastIntake:'Variable.',
    },
    opqrst: {
      onset:'Breathlessness building over hours, worse lying flat.',
      provocation:'Worse lying flat, eased sitting up.',
      quality:'Cannot get a full breath; a drowning feeling when severe.',
      radiates:'No.',
      severity:'Distressing to severe.',
      time:'Hours.',
    },
    reveal: {
      diagnosis:'Acute pulmonary oedema. Recognise it from respiratory distress with congestion and crepitations, a patient who cannot lie flat and, when severe, frothy pink-tinged sputum. Always get a 12-lead ECG to exclude a STEMI, and assess against the CPAP criteria.',
      pathway:'Oxygen therapy with SpO2, ECG and BP monitoring. Get a 12-lead ECG: if there is a STEMI, follow the ACS CPG. If this is pulmonary oedema, give GTN 800 mcg SL and repeat once as needed (Paramedic), then reassess. Assess the CPAP criteria and, if met with no exclusions, apply CPAP (commence at 5 cmH2O, titrate up to 10 as tolerated, titrate oxygen to keep SpO2 above 95 per cent). If there is systemic fluid retention, the Advanced Paramedic may give Furosemide 40 mg IV.',
      interventions:'GTN and CPAP are the two headline interventions, and the OSCE test is knowing the CPAP criteria cold. INCLUSION: clinical signs of acute pulmonary oedema, respiratory rate above 25, and SpO2 below 95 per cent. EXCLUSION: systolic BP below 90, persistent nausea and vomiting, inability to sit up, pneumothorax, or a GI bleed or recent gastric surgery. CPAP is within Paramedic scope. GTN 800 mcg SL (repeat once) is Paramedic scope. Furosemide 40 mg IV is Advanced Paramedic scope, since IV access is required.',
      diagnosisBlocks: [
        { type:'lead', body:'Acute pulmonary oedema. Respiratory distress with congestion and crepitations; cannot lie flat; frothy pink sputum when severe.' },
        { type:'note', body:'Always 12-lead to exclude STEMI. Then assess the CPAP criteria.' },
      ],
      pathwayBlocks: [
        { type:'step', body:'Oxygen, SpO2, ECG and BP monitoring. 12-lead ECG.' },
        { type:'branch', label:'STEMI on ECG', body:'Follow the ACS CPG.' },
        { type:'step', body:'Pulmonary oedema: GTN 800 mcg SL, repeat once as needed (Paramedic). Reassess.' },
        { type:'branch', label:'Meets CPAP criteria, no exclusions', body:'Apply CPAP: 5 cmH2O, titrate up to 10 as tolerated, oxygen to keep SpO2 above 95 per cent (Paramedic scope).' },
        { type:'branch', label:'Systemic fluid retention', body:'Furosemide 40 mg IV (Advanced Paramedic).' },
      ],
      interventionsBlocks: [
        { type:'lead', body:'GTN and CPAP are the headline. Know the CPAP criteria cold, it is the OSCE test.' },
        { type:'note', body:'CPAP INCLUSION: APO signs, RR above 25, SpO2 below 95. EXCLUSION: systolic BP below 90, persistent nausea/vomiting, inability to sit up, pneumothorax, GI bleed or recent gastric surgery.' },
        { type:'step', body:'Scope: CPAP and GTN 800 mcg SL are Paramedic. Furosemide 40 mg IV is Advanced Paramedic (IV access required).' },
      ],
      drugs: [
        { name:'Oxygen', adult:{ paramedic:'Titrate to SpO2; adequate flow needed to drive CPAP.' } },
        { name:'Glyceryl Trinitrate (GTN)', adult:{ paramedic:'800 mcg SL, repeat once PRN. Reassess.' } },
        { name:'Furosemide', adult:{ ap:'40 mg IV where there is systemic fluid retention. Advanced Paramedic scope only (IV access required).' } },
      ],
    },
  },

  {
    id: 'behavioural',
    name: 'Behavioural / Mental Health Emergency',
    category: 'Behavioural',
    locationBias: ['domestic', 'public-indoor'],
    demographics: { minAge: 18, maxAge: 75, sex: 'any' },
    variants: [
      // V2: Agitated, risk to self, capacity question.
      { cause:'agitated with risk to self', conscious:true,
        dispatch:'You are called to {location} for a PATIENT who is distressed and may be a risk to themselves.',
        presentation:'Distressed and agitated, tearful and withdrawn at times, expressing that they do not want help, in a patient with a known history of mental illness.',
        allergies:'No known drug allergies.',
        sample:{ symptoms:'Distressed and agitated, tearful, withdrawn, saying they do not want help.', medications:'Takes regular mental health medication.', pmh:'Known mental illness.', lastIntake:'Earlier today.' },
        opqrst:{ onset:'Building over today.', provocation:'Unknown.', quality:'Very distressed and overwhelmed.', radiates:'No.', severity:'Distressed, ambivalent about care.', time:'Worse today.' },
        events:'Known mental illness, now distressed and possibly at risk to themselves.',
        vitalsOverride:{ hr:{ dir:'up', intensity:0.25 } } },
      // V3: Aggressive / violent behavioural emergency, risk to others.
      { cause:'aggressive behavioural emergency', conscious:true,
        dispatch:'You are called to {location} for a PATIENT who is agitated and aggressive.',
        presentation:'Agitated and aggressive, pacing and shouting, un-cooperative and intermittently threatening, with no obvious injury.',
        allergies:'Unknown.',
        sample:{ symptoms:'Agitated, aggressive, pacing, shouting, un-cooperative, intermittently threatening.', medications:'Unknown.', pmh:'Unknown.', lastIntake:'Unknown.' },
        opqrst:{ onset:'Escalating since crew arrival.', provocation:'Worse with confrontation.', quality:'Hostile and unpredictable.', radiates:'No.', severity:'High, risk to others.', time:'Escalating.' },
        events:'Aggressive and un-cooperative behaviour, a risk to those around them.',
        vitalsOverride:{ hr:{ dir:'up', intensity:0.4 } } },
      // V4: Behaviour with a MEDICAL/organic cause — the trap (here: hypoglycaemia).
      { cause:'abnormal behaviour from a medical cause', conscious:true,
        dispatch:'You are called to {location} for a PATIENT who is confused and behaving oddly.',
        presentation:'Confused, agitated and behaving out of character, sweaty and pale with a low blood glucose, which is driving the abnormal behaviour.',
        allergies:'No known drug allergies.',
        sample:{ symptoms:'Confused, agitated, out of character, sweaty, pale, low blood glucose.', medications:'A diabetes tablet, my insulin.', pmh:'Type 1 diabetes.', lastIntake:'Has not eaten much today.' },
        opqrst:{ onset:'Came on fairly quickly.', provocation:'Unknown.', quality:'Confused and agitated.', radiates:'No.', severity:'Marked confusion.', time:'Over the last hour.' },
        events:'Abnormal behaviour that is being driven by an underlying medical cause.',
        vitalsOverride:{ hr:{ dir:'up', intensity:0.35 }, bgl:[1.8,3.0] } },
    ],
    painBased: false,
    deviations: { hr:{ dir:'up', intensity:0.3 } },
    sample: {
      symptoms:'Abnormal or disturbed behaviour; agitation, distress or aggression.',
      medications:'Variable; may take regular mental health medication.',
      pmh:'May have a known mental illness, or an underlying medical cause.',
      lastIntake:'Variable.',
    },
    opqrst: {
      onset:'Variable.',
      provocation:'Often worse with confrontation.',
      quality:'Distress, agitation or aggression.',
      radiates:'No.',
      severity:'Variable.',
      time:'Variable.',
    },
    reveal: {
      diagnosis:'A behavioural or mental health emergency. The single most important step is to EXCLUDE A MEDICAL CAUSE FIRST: hypoglycaemia, hypoxia, head injury, intoxication or withdrawal, and acute psychostimulant toxicity can all present as abnormal behaviour and must not be missed. Once medical causes are addressed, assess the patient\\u2019s capacity and gauge the risk to themselves and to others.',
      pathway:'Obtain a history from the patient and bystanders. Reassure the patient, explain what is happening, and avoid confrontation. Attempt verbal de-escalation. Where a patient with a known mental illness already has a Medical Practitioner or Psychiatric Nurse in attendance or an arranged voluntary or assisted admission, co-operate with that team and transport to an Approved Centre. Where there is a risk of harm to self or others, request Garda assistance through control, keep practitioner safety paramount (await Gardai if there is any doubt), and ensure a minimum of two people accompany a patient who may harm themselves or others. A patient with capacity who declines care may be handed over to Garda care. Practitioners may not compel a patient.',
      interventions:'De-escalation and scene safety come first, and capacity assessment is the clinical and legal core of this presentation. A person lacks capacity if they are unable to do any one of four things: understand the relevant information, retain it long enough to make the decision, use or weigh it as part of deciding, or communicate the decision by any means. Sedation is a last resort, it is Advanced Paramedic scope only, and it must never be given without first seeking medical advice and documenting a shared decision (Lorazepam 2 mg PO, or Midazolam 5 mg IN/IM, with continuous monitoring of BP, SpO2, ECG and ETCO2). Acute psychostimulant toxicity (with features such as a temperature at or above 38 degrees, hypertension, agitation, chest pain or seizure) needs urgent transport and the Poisoning pathway.',
      diagnosisBlocks: [
        { type:'lead', body:'Behavioural / mental health emergency. EXCLUDE A MEDICAL CAUSE FIRST.' },
        { type:'note', body:'Hypoglycaemia, hypoxia, head injury, intoxication/withdrawal and psychostimulant toxicity can all mimic a psychiatric presentation. Then assess capacity and risk.' },
      ],
      pathwayBlocks: [
        { type:'step', body:'History from patient and bystanders. Reassure, explain, avoid confrontation, attempt verbal de-escalation.' },
        { type:'branch', label:'Known mental illness with MP/PN or arranged admission', body:'Co-operate with the team; transport to an Approved Centre.' },
        { type:'branch', label:'Risk to self or others', body:'Request Garda assistance via control; practitioner safety paramount (await Gardai if in doubt); minimum two people accompany the patient.' },
        { type:'branch', label:'Has capacity and declines care', body:'May be handed over to Garda care. Practitioners may not compel a patient.' },
      ],
      interventionsBlocks: [
        { type:'lead', body:'De-escalation and scene safety first. Capacity assessment is the clinical and legal core.' },
        { type:'note', body:'A person lacks capacity if unable to do ANY one of: understand the information, retain it, use or weigh it, or communicate the decision by any means.' },
        { type:'note', body:'Sedation is a LAST RESORT and Advanced Paramedic scope only: never without first seeking medical advice and documenting a shared decision (Lorazepam 2 mg PO or Midazolam 5 mg IN/IM, with BP/SpO2/ECG/ETCO2 monitoring).' },
        { type:'step', body:'Acute psychostimulant toxicity (temp 38+, hypertension, agitation, chest pain, seizure) needs urgent transport and the Poisoning pathway.' },
      ],
      drugs: [
        { name:'Oxygen', adult:{ paramedic:'As required if hypoxic or for an identified medical cause.' } },
        { name:'Sedation (Lorazepam / Midazolam)', adult:{ ap:'Lorazepam 2 mg PO, or Midazolam 5 mg IN/IM. Advanced Paramedic scope only, and only after seeking medical advice and documenting a shared decision. Continuous BP, SpO2, ECG and ETCO2 monitoring.' } },
      ],
    },
  },

  {
    id: 'limbinjury',
    name: 'Limb Injury',
    category: 'Trauma',
    demographics: { minAge: 16, maxAge: 90, sex: 'any' },
    painBased: true,
    variants: [
      // V1: Mid-shaft femur fracture — deformed thigh, shortened/rotated. Kept STABLE.
      { cause:'mid-shaft femur fracture', conscious:true,
        dispatch:'You are called to {location} for a PATIENT with a painful, deformed thigh after a fall.',
        presentation:'Severe thigh pain with an obviously deformed, shortened and rotated leg, unable to weight-bear, with good colour and pulses in the foot.',
        allergies:'No known drug allergies.',
        sample:{ symptoms:'Severe thigh pain, deformed shortened rotated leg, cannot weight-bear, good foot colour and pulses.', medications:'Nil regular.', pmh:'Nil of note.', lastIntake:'Earlier today.' },
        opqrst:{ onset:'At the moment of the fall.', provocation:'Any movement of the leg is agony.', quality:'Deep severe pain in the thigh.', radiates:'Stays in the thigh.', severity:'9', time:'Since the fall.' },
        events:'Fall with a painful, visibly deformed thigh.',
        vitalsOverride:{ hr:{ dir:'up', intensity:0.45 } } },
      // V2: Neck of femur — elderly fall, shortened/externally rotated, hip pain.
      { cause:'neck of femur fracture', conscious:true,
        dispatch:'You are called to {location} for an OLDER PATIENT who has fallen and cannot get up.',
        presentation:'Hip pain after a fall in an older patient, with the leg shortened and rotated outward, unable to weight-bear, good colour in the foot.',
        allergies:'No known drug allergies.',
        sample:{ symptoms:'Hip pain after a fall, leg shortened and externally rotated, cannot weight-bear, good foot colour.', medications:'A blood pressure tablet, my water tablet.', pmh:'High blood pressure, osteoporosis.', lastIntake:'Earlier.' },
        opqrst:{ onset:'When they fell.', provocation:'Worse trying to move the leg or hip.', quality:'Deep hip and groin pain.', radiates:'Into the groin.', severity:'7', time:'Since the fall.' },
        events:'Older patient fell, now with hip pain and a shortened rotated leg.',
        vitalsOverride:{ hr:{ dir:'up', intensity:0.3 } } },
      // V3: Open fracture — visible bone/wound.
      { cause:'open fracture', conscious:true,
        dispatch:'You are called to {location} for a PATIENT with a lower leg injury and a wound.',
        presentation:'A painful, deformed lower leg with an open wound and bone visible at the injury site, bleeding controlled, with sensation and movement preserved in the foot.',
        allergies:'No known drug allergies.',
        sample:{ symptoms:'Painful deformed lower leg, open wound with bone visible, bleeding controlled, foot sensation and movement preserved.', medications:'Nil regular.', pmh:'Nil of note.', lastIntake:'Earlier.' },
        opqrst:{ onset:'At the time of the injury.', provocation:'Worse with any movement.', quality:'Severe pain at the wound.', radiates:'Around the lower leg.', severity:'8', time:'Since the injury.' },
        events:'Injury leaving a deformed lower leg with an open wound and visible bone.',
        vitalsOverride:{ hr:{ dir:'up', intensity:0.4 } } },
      // V4: Dislocation — obvious dislocation, e.g. shoulder or patella.
      { cause:'joint dislocation', conscious:true,
        dispatch:'You are called to {location} for a PATIENT with an obviously deformed joint.',
        presentation:'An obviously deformed and very painful joint held in a fixed position, unable to move it, with intact colour, sensation and pulses beyond the injury.',
        allergies:'No known drug allergies.',
        sample:{ symptoms:'Obviously deformed painful joint held fixed, cannot move it, intact colour/sensation/pulses beyond.', medications:'Nil regular.', pmh:'Nil of note.', lastIntake:'Earlier.' },
        opqrst:{ onset:'At the moment of injury.', provocation:'Any attempt to move it is very painful.', quality:'Sharp, locked pain at the joint.', radiates:'Around the joint.', severity:'7', time:'Since the injury.' },
        events:'Injury leaving an obviously deformed, fixed and painful joint.',
        vitalsOverride:{ hr:{ dir:'up', intensity:0.35 } } },
      // V5: Soft tissue injury — sprain, swollen, no deformity.
      { cause:'soft tissue limb injury', conscious:true,
        dispatch:'You are called to {location} for a PATIENT who has hurt their ankle.',
        presentation:'A swollen, painful and bruised limb after a twisting injury, tender to touch but with no deformity, and able to partially weight-bear.',
        allergies:'No known drug allergies.',
        sample:{ symptoms:'Swollen painful bruised limb after a twist, tender, no deformity, can partially weight-bear.', medications:'Nil regular.', pmh:'Nil of note.', lastIntake:'Earlier.' },
        opqrst:{ onset:'When it twisted.', provocation:'Worse on weight-bearing.', quality:'Aching, throbbing pain.', radiates:'Around the joint.', severity:'4', time:'Since the injury.' },
        events:'Twisting injury leaving a swollen, painful limb with no deformity.',
        vitalsOverride:{ hr:{ dir:'up', intensity:0.2 } } },
    ],
    deviations: { hr:{ dir:'up', intensity:0.35 } },
    sample: {
      symptoms:'Limb injury; pattern varies (fracture, dislocation or soft tissue).',
      medications:'Often nil of note.',
      pmh:'Often nil of note.',
      lastIntake:'Variable.',
    },
    opqrst: {
      onset:'At the time of injury.',
      provocation:'Worse with movement or weight-bearing.',
      quality:'Pain at the injury site.',
      radiates:'Around the injured area.',
      severity:'Variable, often significant.',
      time:'Since the injury.',
    },
    reveal: {
      diagnosis:'Limb injury. Work out which of three patterns it is: a fracture, a dislocation, or a soft-tissue injury, since each is managed differently. The safety habit that runs through all of them is checking CSMs (circulation, sensation and movement) distal to the injury both before and after any intervention.',
      pathway:'Establish the need for pain relief (Pain CPG, request ALS if needed). Expose and examine the limb, dress open wounds, provide manual stabilisation, and check CSMs distal to the injury. Consider hypovolaemia and shock. For a fracture: a mid-shaft femur fracture gets a traction splint (and the Advanced Paramedic may give NaCl 0.9% 250 mL IV); a neck-of-femur or other fracture gets an appropriate splinting device; request ALS for femur fractures. For an open fracture, remove gross contamination and the Advanced Paramedic gives Ceftriaxone 2g. For a dislocation, splint or support in the position found (an isolated lateral patella dislocation may be reduced and splinted). For a soft-tissue injury, use rest, cooling, compression and elevation. Recheck CSMs.',
      interventions:'The headline safety teaching is CSMs before and after every intervention, neurovascular status can change with splinting. Splinting is matched to the injury: a traction splint for a mid-shaft femur, an appropriate splint for other fractures, and splinting in the position found for dislocations. Traction splinting and reducing an isolated lateral patella are Paramedic skills. NaCl 0.9% 250 mL (mid-shaft femur) and Ceftriaxone 2g (open fracture) are Advanced Paramedic, since IV access is required. Pain is managed via the Pain CPG.',
      diagnosisBlocks: [
        { type:'lead', body:'Limb injury. Branch by pattern: fracture, dislocation, or soft tissue.' },
        { type:'note', body:'Check CSMs (circulation, sensation, movement) distal to the injury BEFORE and AFTER any intervention.' },
      ],
      pathwayBlocks: [
        { type:'step', body:'Pain relief (Pain CPG). Expose and examine, dress open wounds, manual stabilisation, check CSMs. Consider hypovolaemia/shock.' },
        { type:'branch', label:'Fracture', body:'Mid-shaft femur: traction splint (AP may give NaCl 0.9% 250 mL IV). Neck of femur/other: appropriate splint. Request ALS for femur fractures.' },
        { type:'branch', label:'Open fracture', body:'Remove gross contamination; AP gives Ceftriaxone 2g.' },
        { type:'branch', label:'Dislocation', body:'Splint/support in position found (isolated lateral patella may be reduced and splinted).' },
        { type:'branch', label:'Soft tissue', body:'Rest, cooling, compression and elevation. Recheck CSMs.' },
      ],
      interventionsBlocks: [
        { type:'lead', body:'CSMs before and after every intervention, neurovascular status can change with splinting.' },
        { type:'step', body:'Splint to the injury: traction splint (mid-shaft femur), appropriate splint (other fractures), position-found (dislocations). Traction splinting and isolated-lateral-patella reduction are Paramedic skills.' },
        { type:'note', body:'NaCl 0.9% 250 mL (mid-shaft femur) and Ceftriaxone 2g (open fracture) are Advanced Paramedic scope (IV access required). Pain via the Pain CPG.' },
      ],
      drugs: [
        { name:'Sodium Chloride 0.9% (fluids)', adult:{ ap:'250 mL IV for a mid-shaft femur fracture. Advanced Paramedic scope only (IV access required).' } },
        { name:'Ceftriaxone', adult:{ ap:'2g IV/IO/IM for an open fracture (after removing gross contamination). Advanced Paramedic scope.' } },
      ],
    },
  },

];
