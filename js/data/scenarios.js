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
  { name:'a private residence',        found:true  },
  { name:'a terraced house',           found:true  },
  { name:'an apartment',               found:true  },
  { name:'a shopping centre',          found:true  },
  { name:'a Centra car park',          found:true  },
  { name:'a supermarket',              found:true  },
  { name:'a bus stop',                 found:true  },
  { name:'a Luas stop',                found:true  },
  { name:'a train station',            found:true  },
  { name:'a petrol station',           found:true  },
  { name:'a public park',              found:true  },
  { name:'a town square',              found:true  },
  { name:'a rural farmhouse',          found:true  },
  { name:'a country road layby',       found:true  },
  { name:'a beach car park',           found:true  },
  { name:'a building site',            found:true  },
  { name:'a factory floor',            found:true  },
  { name:'a busy café',                found:false },
  { name:'a restaurant',               found:false },
  { name:'a pub',                      found:false },
  { name:'a hotel lobby',              found:false },
  { name:'a GP surgery waiting room',  found:false },
  { name:'a pharmacy',                 found:false },
  { name:'an office',                  found:false },
  { name:'a hair salon',               found:false },
  { name:'a gym',                      found:false },
  { name:'a leisure centre',           found:false },
  { name:'a GAA clubhouse',            found:false },
  { name:'a sports ground',            found:false },
  { name:'a community hall',           found:false },
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
    demographics: { minAge: 1, maxAge: 90, sex: 'any' },
    variants: [
      { cause:'bee sting', conscious:true,
        dispatch:'You are called to {location} for a PATIENT with difficulty breathing.',
        presentation:'Visible facial and lip swelling, widespread urticarial (hive-like) rash, audible wheeze, looks anxious and flushed.',
        allergies:'Known allergy to bee/wasp stings.',
        events:'Was stung by a bee roughly 10 minutes ago; symptoms came on rapidly afterwards.' },
      { cause:'peanuts', conscious:true,
        dispatch:'You are called to {location} for a PATIENT who has become acutely unwell.',
        presentation:'Swollen lips and tongue, blotchy raised rash on neck and chest, noisy breathing, clutching at throat.',
        allergies:'Known nut allergy.',
        events:'Ate a dessert that unknowingly contained peanuts about 15 minutes ago.' },
      { cause:'shellfish', conscious:true,
        dispatch:'You are called to {location} for a PATIENT with sudden difficulty breathing.',
        presentation:'Facial swelling, urticaria over the arms and torso, wheeze, appears distressed and sweaty.',
        allergies:'Known shellfish allergy.',
        events:'Had just eaten a seafood dish shortly before the symptoms started.' },
      { cause:'penicillin', conscious:true,
        dispatch:'You are called to {location} for a PATIENT who is acutely short of breath.',
        presentation:'Lip and periorbital swelling, spreading hives, wheeze, anxious and flushed.',
        allergies:'No previously documented drug allergy.',
        events:'Took a first dose of a newly prescribed antibiotic about 20 minutes ago.' },
      { cause:'wasp sting (outdoor)', conscious:true,
        dispatch:'You are called to {location} for a PATIENT struggling to breathe.',
        presentation:'Rapidly swelling face and lips, widespread blotchy hives, loud wheeze, gripping at the throat and visibly frightened.',
        allergies:'No previously documented sting allergy.',
        events:'Stung on the arm while outdoors about 10 minutes ago; first time this has ever happened.' },
      { cause:'latex / clinical exposure', conscious:true,
        dispatch:'You are called to {location} for a PATIENT who has become acutely unwell.',
        presentation:'Flushed and swollen around the eyes and lips, raised itchy rash spreading across the chest, wheeze, anxious and clammy.',
        allergies:'Known latex sensitivity.',
        events:'Symptoms began within minutes of contact with latex gloves during a routine procedure.' },
    ],
    painBased: false,   // anaphylaxis is not a pain complaint → OPQRST shows honest negatives
    // ⚠️ PLACEHOLDER deviations — Keith to verify direction + intensity.
    deviations: {
      hr:    { dir:'up',   intensity:0.7 },   // tachycardia
      rr:    { dir:'up',   intensity:0.6 },   // tachypnoea
      bpSys: { dir:'down', intensity:0.5 },   // hypotension
      bpDia: { dir:'down', intensity:0.5 },
      spo2:  [85, 93],                        // absolute hypoxia target
      // temp + bgl omitted → stay normal
    },
    sample: {
      symptoms:'Difficulty breathing, throat tightness, itching, feeling of impending doom.',
      medications:'Nil regular.',
      pmh:'Previous milder allergic reactions.',
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
    id: 'hypoglycaemia',
    name: 'Hypoglycaemia',
    category: 'Medical',
    demographics: { minAge: 1, maxAge: 90, sex: 'any' },
    variants: [
      // Conscious level is the key decision fork here (gel vs glucagon). The engine
      // adds "found unresponsive" vs "collapsed there" framing based on the location.
      // CONSCIOUS / able to swallow → leads toward buccal glucose.
      { cause:'missed meal, conscious', conscious:true,
        dispatch:'You are called to {location} for a PATIENT who is confused and not themselves.',
        presentation:'Alert but confused and sweaty, pale and clammy, slurred speech, but able to talk, follow simple instructions and hold a cup. Airway is their own and they can swallow.',
        presentationU3:'Drowsy and floppy, pale and clammy with profuse sweating, whimpering and not interacting as the parents say they normally would, but rousable, moving all limbs, and still able to swallow. Airway is their own.',
        allergies:'No known drug allergies.',
        events:'Took their usual insulin this morning but skipped breakfast; became increasingly confused over the last half hour.' },
      { cause:'odd behaviour, conscious', conscious:true,
        dispatch:'You are called to {location} for a PATIENT who is behaving strangely.',
        presentation:'Confused and agitated but awake and responsive, sweating heavily, unsteady, almost intoxicated in manner though no alcohol involved. Able to protect their own airway and swallow.',
        presentationU3:'Awake but irritable and inconsolable, sweating heavily, jittery and unsteady, not behaving like their usual self according to the parents. Rousable and responsive, protecting their own airway and able to swallow.',
        allergies:'No known drug allergies.',
        events:'Has been increasingly muddled and clumsy over the past 20 minutes; this reportedly happens if they go too long without eating.' },
      { cause:'exercise-related, conscious', conscious:true,
        dispatch:'You are called to {location} for a PATIENT who has gone pale and shaky.',
        presentation:'Sweaty, trembling and pale, anxious and a little muddled but fully awake, answering questions slowly. Airway is their own and they can swallow.',
        presentationU3:'Sweaty, pale and trembling, clingy and unsettled and not their usual self according to the parents, but fully awake, rousable and able to swallow. Airway is their own.',
        allergies:'No known drug allergies.',
        events:'Known diabetic on insulin; took the usual dose then did far more physical activity than normal without eating extra, and started feeling shaky and confused over the last 20 minutes.' },
      // UNCONSCIOUS / unable to swallow → leads toward IM glucagon.
      { cause:'collapse, unresponsive', conscious:false,
        dispatch:'You are called to {location} for a PATIENT who has collapsed.',
        presentation:'Slumped and unresponsive to voice, only groaning to a painful stimulus, profuse sweating, cool clammy skin. NOT able to swallow or protect their own airway.',
        allergies:'No known drug allergies.',
        events:'Was reportedly well earlier, then became vacant and slumped over a short time ago.' },
      { cause:'unresponsive', conscious:false,
        dispatch:'You are called to {location} for a PATIENT who is unconscious.',
        presentation:'Unrousable to voice, withdraws to pain only, sweaty and pale, breathing on their own. Cannot swallow safely, no gag/airway protection.',
        allergies:'No known drug allergies.',
        events:'Known diabetic on insulin; became unresponsive a short time ago.' },
      { cause:'found drowsy at home, unresponsive', conscious:false,
        dispatch:'You are called to {location} for a PATIENT who cannot be roused.',
        presentation:'Deeply drowsy, responds only to a painful stimulus with a groan, profusely sweaty with cold clammy skin, breathing on their own. NOT able to swallow or protect their own airway.',
        allergies:'No known drug allergies.',
        events:'Known diabetic; family noticed they had become harder and harder to wake over the last hour.' },
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
      symptoms:'Confusion, sweating, tremor, hunger, slurred speech, altered behaviour.',
      medications:'Insulin (and/or oral hypoglycaemic agents).',
      pmh:'Type 1 (or insulin-treated) diabetes mellitus.',
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
        events:'Pain started about 40 minutes ago while climbing stairs and has not settled.' },
      { cause:'at rest onset', conscious:true,
        dispatch:'You are called to {location} for a PATIENT with central chest pain.',
        presentation:'Grey and clammy, holding the centre of their chest, nauseated, breathing a little fast.',
        allergies:'No known drug allergies.',
        events:'Was sitting watching television when the pain came on suddenly about half an hour ago.' },
      { cause:'building pressure', conscious:true,
        dispatch:'You are called to {location} for a PATIENT who feels unwell with chest discomfort.',
        presentation:'Sitting forward, sweaty and pale, one hand on the chest, looks frightened, mild breathlessness.',
        allergies:'No known drug allergies.',
        events:'Felt heavy chest pressure that built up over the last 20–30 minutes and is ongoing.' },
      { cause:'atypical presentation', conscious:true,
        dispatch:'You are called to {location} for a PATIENT who feels generally unwell and short of breath.',
        presentation:'Pale and sweaty, vague discomfort across the chest and into the jaw, a little breathless, uneasy.',
        allergies:'No known drug allergies.',
        events:'Has felt off and clammy for about an hour with discomfort that is hard to pin down.' },
      { cause:'radiating to arm', conscious:true,
        dispatch:'You are called to {location} for a PATIENT with chest pain spreading down the arm.',
        presentation:'Pale and sweaty, one hand on the chest and rubbing the left arm, looks uneasy and short of breath, mildly nauseated.',
        allergies:'No known drug allergies.',
        events:'A tight, heavy chest pain came on about 45 minutes ago and spread down the left arm; it has not eased with rest.' },
      { cause:'post-meal, mistaken for indigestion', conscious:true,
        dispatch:'You are called to {location} for a PATIENT with chest discomfort and sweating.',
        presentation:'Grey and clammy, sitting still and reluctant to move, burping and rubbing the upper abdomen and lower chest, breathing a little fast, looks worried.',
        allergies:'No known drug allergies.',
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
      symptoms:'Central chest pain/pressure, sweating, nausea, shortness of breath, anxiety.',
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
      // SEVERE + CONSCIOUS → back blows / abdominal thrusts.
      { cause:'choking on food, severe, conscious', conscious:true,
        dispatch:'You are called to {location} for a PATIENT who is choking.',
        presentation:'Clutching at their throat, distressed and unable to speak, coughing weakly and ineffectively, lips dusky, eyes wide and frightened. Still conscious and trying to cough.',
        allergies:'No known drug allergies.',
        events:'Choked suddenly partway through a meal; bystanders saw them grab their throat and struggle to breathe.' },
      { cause:'choking, severe, near-silent', conscious:true,
        dispatch:'You are called to {location} for a PATIENT in respiratory distress, unable to talk.',
        presentation:'Silent, cannot cough or speak, gripping the throat, pale and panicked, making minimal air movement. Conscious but visibly tiring.',
        allergies:'No known drug allergies.',
        events:'Was eating when they suddenly went quiet and could not breathe; a bystander recognised choking and called immediately.' },
      // MILD → encourage cough, monitor.
      { cause:'mild obstruction, effective cough', conscious:true,
        dispatch:'You are called to {location} for a PATIENT who choked but is still coughing.',
        presentation:'Coughing forcefully and effectively, able to speak in short sentences between coughs, anxious but moving good air, colour normal. Airway partially obstructed but cough is effective.',
        allergies:'No known drug allergies.',
        events:'Choked on food a few minutes ago and has been coughing hard since; able to tell you what happened.' },
      // SEVERE + UNCONSCIOUS → request ALS, CPR cycles, mouth check.
      { cause:'choking, now unconscious', conscious:false,
        dispatch:'You are called to {location} for a PATIENT who was choking and has collapsed.',
        presentation:'Unresponsive, not breathing effectively, cyanosed around the lips, no cough or gag. Airway obstructed; no air movement.',
        allergies:'No known drug allergies.',
        events:'Was choking on food and witnessed to slump unconscious moments before your arrival.' },
      { cause:'found collapsed, suspected FBAO', conscious:false,
        dispatch:'You are called to {location} for a PATIENT found unresponsive after a meal.',
        presentation:'Unresponsive, cyanosed, no effective breathing, food debris around the mouth. No cough or gag; airway appears obstructed.',
        allergies:'No known drug allergies.',
        events:'Found slumped at the table shortly after eating; suspected choking.' },
      { cause:'choking, peri-arrest', conscious:false,
        dispatch:'You are called to {location} for an unconscious PATIENT who was choking.',
        presentation:'Unresponsive and deeply cyanosed, no effective ventilation despite airway manoeuvres, agonal at best. Obstruction unresolved.',
        allergies:'No known drug allergies.',
        events:'Choked, then rapidly deteriorated to unconsciousness; bystander CPR was just starting as you arrived.' },
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
      symptoms:'Sudden onset choking, inability to speak or cough effectively, distress, cyanosis.',
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
        events:'Known COPD; a chest infection over the last few days has left them increasingly breathless, with more sputum than usual.' },
      { cause:'gradual worsening, home oxygen', conscious:true, severity:0.35,
        dispatch:'You are called to {location} for a PATIENT with worsening breathlessness.',
        presentation:'Breathless at rest, using accessory muscles, wheeze on auscultation, anxious but alert. Has a home oxygen concentrator and an oxygen alert card.',
        allergies:'No known drug allergies.',
        events:'Long-standing COPD on home oxygen; breathing has deteriorated steadily over two days despite their usual inhalers.' },
      { cause:'cold-triggered exacerbation', conscious:true, severity:0.4,
        dispatch:'You are called to {location} for a PATIENT struggling to breathe.',
        presentation:'Visibly breathless, leaning forward on their knees (tripod position), prolonged expiratory wheeze, able to answer in short sentences. Alert, anxious, tiring.',
        allergies:'No known drug allergies.',
        events:'Known COPD; went out in cold weather and became acutely wheezy and breathless, not relieved by their own inhaler.' },
      { cause:'severe, deteriorating despite nebulisers', conscious:true, severity:0.75,
        dispatch:'You are called to {location} for a PATIENT in severe respiratory distress.',
        presentation:'Severely breathless, exhausted, barely able to speak, silent chest in places, drowsy at the edges but still rousable and answering. Not improving with bronchodilators.',
        allergies:'No known drug allergies.',
        events:'Known severe COPD; this exacerbation is worse than usual and has not responded to repeated nebulisers, with the patient tiring.' },
      { cause:'hypoxic exacerbation, no alert card', conscious:true, severity:0.65,
        dispatch:'You are called to {location} for a breathless PATIENT.',
        presentation:'Breathless and cyanosed at the lips, wheezy, working hard, alert but clearly hypoxic. No oxygen alert card available.',
        allergies:'No known drug allergies.',
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
      symptoms:'Increasing breathlessness, wheeze, cough, sometimes increased/discoloured sputum.',
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
        events:'Several hours of repeated vomiting and some diarrhoea; others at home have been unwell similarly.' },
      { cause:'migraine-associated', conscious:true,
        dispatch:'You are called to {location} for a PATIENT feeling very sick with a severe headache.',
        presentation:'Nauseated and vomiting, photophobic, holding their head, wants the lights off. Alert and oriented.',
        allergies:'No known drug allergies.',
        events:'Severe one-sided headache came on over the morning with nausea and vomiting; has had migraines before.' },
      { cause:'medication-related', conscious:true,
        dispatch:'You are called to {location} for a PATIENT who is nauseated and vomiting.',
        presentation:'Nauseated, intermittently vomiting, otherwise settled and alert, no abdominal pain of note.',
        allergies:'No known drug allergies.',
        events:'Recently started strong painkillers for an injury and has felt progressively nauseous and been vomiting since.' },
      { cause:'vertigo-associated', conscious:true,
        dispatch:'You are called to {location} for a PATIENT who is dizzy and vomiting.',
        presentation:'Nauseated and vomiting, severe dizziness made worse by movement, prefers to lie still, alert. No focal weakness.',
        allergies:'No known drug allergies.',
        events:'Sudden severe spinning sensation with nausea and repeated vomiting; worse on moving the head.' },
      { cause:'post-procedure', conscious:true,
        dispatch:'You are called to {location} for a PATIENT vomiting after a recent procedure.',
        presentation:'Nauseated and vomiting, uncomfortable, alert, recovering from a recent day procedure.',
        allergies:'No known drug allergies.',
        events:'Had a minor procedure earlier today and has been persistently nauseated and vomiting since getting home.' },
      { cause:'pregnancy-associated', conscious:true,
        dispatch:'You are called to {location} for a PATIENT with severe vomiting.',
        presentation:'Persistently vomiting, unable to keep fluids down, tired and dehydrated, alert and oriented. Early pregnancy.',
        allergies:'No known drug allergies.',
        events:'Several days of worsening nausea and vomiting in early pregnancy, now unable to keep anything down.' },
    ],
    painBased: false,   // nausea/vomiting, not a pain complaint → OPQRST honest negatives
    deviations: {
      hr: { dir:'up', intensity:0.3 },   // mild dehydration/distress tachycardia; everything else normal
      // rr / bp / spo2 / temp / bgl omitted → normal. BGL normal but "checked" per CPG.
    },
    sample: {
      symptoms:'Nausea, repeated vomiting; cause-dependent associated features (headache, dizziness, diarrhoea, etc.).',
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
];
