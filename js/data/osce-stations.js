// ─── OSCE STATIONS (data) ─────────────────────────────────────────────────────
// PHECC OSCE assessment-sheet content for the Stations reference library (Study tab).
// Transcribed verbatim from the published sheets and clinically signed off by Keith.
//
// Sources:
//   EMT  : EMT Examiner Assessment Sheets, Version 8 (April 2025), assessed vs 2021 CPGs.
//   Para : Paramedic Secondary Assessment Sheets, Version 4 (March 2017).
//
// To add a station: copy an existing entry and fill in the fields. Per-element flags
// (crit / verbalise / simulate / examiner) are all OPTIONAL — omit when not present on
// the sheet. ruleLine / cpgBasis are sheet-dependent and may be null.
//
// scope:    'EMT' | 'P'              (drives the scope pill; P = Paramedic)
// exam:     'primary' | 'secondary'  (exam-structure tag)
// caveat:   shown only on Paramedic stations (devolved-exam note)
//
// CATEGORY ORDER below controls the accordion order in the UI.

const OSCE_CATEGORIES = [
  { name: 'Medical Emergencies', icon: '🫀' },   // EMT V8
  { name: 'Medical',             icon: '🫀' },   // Paramedic 2017 (sheet label is "Medical")
];

const PARA_CAVEAT = 'Current public PHECC sheet (2017). Paramedic OSCEs are run by the training colleges, confirm format with your own college.';

const OSCE_STATIONS = [

  // ───────────────────────── EMT — Medical Emergencies ─────────────────────────

  {
    id: 'emt_blsa_p001',
    name: 'AED / Shockable',
    scope: 'EMT', exam: 'primary',
    category: 'Medical Emergencies',
    version: 'Version 7 (October 2021)',
    cpgBasis: '2021 CPGs',
    intro: 'The candidate is read a scenario relating to a cardiac arrest he/she has witnessed.',
    sections: [
      { title: null, elements: [
        { n: 1,  text: 'Assemble equipment (Connect O₂ and reservoir to BVM)' },
        { n: 2,  text: 'Check responsiveness' },
        { n: 3,  text: 'Turn on defibrillator (Early in sequence)' },
        { n: 4,  text: 'Open airway' },
        { n: 5,  text: 'Consider OPA' },
        { n: 6,  text: 'Assess breathing and pulse (5-10 seconds)', examiner: 'No breathing, no pulse' },
        { n: 7,  text: 'Request ALS and additional personnel' },
        { n: 8,  text: "Prepare patient's chest (Appropriate checks)" },
        { n: 9,  text: 'Place left defibrillation pad in correct location' },
        { n: 10, text: 'Place right defibrillation pad in correct location' },
        { n: 11, text: 'Press to analyse' },
      ]},
      { title: 'Shockable Rhythm', elements: [
        { n: 12, text: 'CPR while charging (Appropriate to AED)' },
        { n: 13, text: 'Defibrillate' },
        { n: 14, text: 'Commence CPR immediately' },
        { n: 15, text: '2 minutes of CPR' },
        { n: 16, text: 'Press to analyse: No shock advised' },
      ]},
      { title: 'Patient begins to cough and move', elements: [
        { n: 17, text: 'Assess pulse', examiner: 'Pulse Present' },
        { n: 18, text: 'Support ventilation while delivering 100% O₂', verbalise: true },
        { n: 19, text: 'Monitor ECG and SpO₂', verbalise: true },
        { n: 20, text: 'Check with control re: the availability of appropriate practitioner', verbalise: true },
      ]},
      { title: 'Practitioner available / not available', elements: [
        { n: 21, text: 'Candidate makes correct transport decision' },
        { n: 22, text: 'The candidate minimised "hands-off chest" time', crit: true },
        { n: 23, text: 'Candidate ensures AED safety of personnel and others', crit: true },
        { n: 24, text: 'The compression rate and depth was effective', crit: true },
        { n: 25, text: 'The ventilations make chest rise (1 second duration)' },
      ]},
    ],
    passRule: '80% of elements, and all critical (*) elements.',
    ruleLine: 'Sum line 22, 23 and 24 = 3',
    examinerNote: null,
  },

  {
    id: 'emt_blsa_p002',
    name: 'AED / Non-Shockable',
    scope: 'EMT', exam: 'primary',
    category: 'Medical Emergencies',
    version: 'Version 7 (October 2021)',
    cpgBasis: '2021 CPGs',
    intro: 'The candidate is read a scenario relating to a cardiac arrest he/she has witnessed.',
    sections: [
      { title: null, elements: [
        { n: 1,  text: 'Assemble equipment (Connect O₂ and reservoir to BVM)' },
        { n: 2,  text: 'Check responsiveness' },
        { n: 3,  text: 'Turn on defibrillator (Early in sequence)' },
        { n: 4,  text: 'Open airway' },
        { n: 5,  text: 'Consider OPA' },
        { n: 6,  text: 'Assess breathing and pulse (5-10 seconds)', examiner: 'No breathing, no pulse' },
        { n: 7,  text: 'Request ALS and additional personnel' },
        { n: 8,  text: "Prepare patient's chest (Appropriate checks)" },
        { n: 9,  text: 'Place left defibrillation pad in correct location' },
        { n: 10, text: 'Place right defibrillation pad in correct location' },
        { n: 11, text: 'Press to analyse' },
      ]},
      { title: 'No Shock Advised', elements: [
        { n: 12, text: 'Commence CPR immediately' },
        { n: 13, text: '2 minutes of CPR' },
        { n: 14, text: 'Press to analyse' },
      ]},
      { title: 'No Shock Advised', elements: [
        { n: 15, text: 'Commence CPR immediately' },
        { n: 16, text: '2 minutes of CPR' },
        { n: 17, text: 'Consider Advanced Airway' },
        { n: 18, text: 'Press to analyse: No shock advised' },
      ]},
      { title: 'Candidate is advised "that resuscitation is ongoing for 20 minutes"', elements: [
        { n: 19, text: 'Check with control re: the availability of appropriate practitioner', verbalise: true },
      ]},
      { title: 'Practitioner available / not available', elements: [
        { n: 20, text: 'Candidate makes correct transport decision' },
        { n: 21, text: 'The candidate minimised "hands-off chest" time', crit: true },
        { n: 22, text: 'Candidate ensures AED safety of personnel and others', crit: true },
        { n: 23, text: 'The compression rate and depth was effective', crit: true },
        { n: 24, text: 'The ventilations make chest rise (1 second duration)' },
      ]},
    ],
    passRule: '80% of elements, and all critical (*) elements.',
    ruleLine: 'Sum line 21, 22 and 23 = 3',
    examinerNote: null,
  },

  {
    id: 'emt_fbaoa_p001',
    name: 'Adult FBAO and Recovery Position',
    scope: 'EMT', exam: 'primary',
    category: 'Medical Emergencies',
    version: 'Version 7 (October 2021)',
    cpgBasis: '2021 CPGs',
    intro: null,
    sections: [
      { title: 'FBAO', elements: [
        { n: 1, text: 'Confirm airway obstruction', crit: true },
        { n: 2, text: 'Position and perform up to 5 back blows' },
        { n: 3, text: 'Correct hand position during back blows' },
        { n: 4, text: 'Perform up to 5 abdominal thrusts (or chest thrusts if obese/pregnant)' },
        { n: 5, text: 'Correct hand position during thrusts' },
        { n: 6, text: 'Continue until effective or patient collapse' },
      ]},
      { title: 'Candidate is advised: "Patient becomes unresponsive"', elements: [
        { n: 7,  text: 'Patient lowered safely to the ground' },
        { n: 8,  text: 'Request ALS' },
        { n: 9,  text: 'Commence CPR with compressions' },
        { n: 10, text: 'Inspect airway before each ventilation' },
      ]},
      { title: 'Candidate is advised: "The object has become visible" (after one cycle approx.)', elements: [
        { n: 11, text: 'Perform finger sweep' },
        { n: 12, text: 'Check breathing' },
      ]},
      { title: 'Candidate is advised: "Patient is breathing"', elements: [
        { n: 13, text: 'Ensure adequate ventilation and oxygenation' },
        { n: 14, text: 'Check circulation' },
      ]},
      { title: 'Candidate is advised: "Adequate pulse present"', elements: [
        { n: 15, text: 'CPR compressions were performed effectively' },
      ]},
      { title: 'Candidate is read an appropriate scenario. Recovery position', elements: [
        { n: 16, text: 'Check responsiveness' },
        { n: 17, text: 'Open airway', crit: true },
        { n: 18, text: 'Check breathing' },
      ]},
      { title: 'Candidate is advised: "Patient is breathing adequately"', elements: [
        { n: 19, text: 'Check pulse' },
      ]},
      { title: 'Candidate is advised: "Pulse present"', elements: [
        { n: 20, text: 'Inspect and prepare immediate area (safety)' },
        { n: 21, text: 'Physically assess patient for objects that may cause harm' },
        { n: 22, text: "Remove unsafe objects for patient's safety" },
        { n: 23, text: 'Roll patient laterally' },
        { n: 24, text: 'Support the head as patient is turned' },
        { n: 25, text: 'Ensure the uppermost arm supports the body' },
        { n: 26, text: 'Ensure the uppermost leg supports the body' },
        { n: 27, text: 'Maintain an open airway' },
        { n: 28, text: 'Check breathing' },
      ]},
      { title: 'Candidate is advised: "Patient is breathing adequately"', elements: [
        { n: 29, text: 'Check pulse' },
      ]},
      { title: 'Candidate is advised: "Pulse present"', elements: [] },
    ],
    passRule: '80% of elements, and all critical (*) elements.',
    ruleLine: 'Sum line 1 and 17 =',   // printed blank on the published sheet — shown verbatim
    examinerNote: null,
  },

  {
    id: 'emt_fbaop_p001',
    name: 'Paediatric FBAO and Adult Recovery Position',
    scope: 'EMT', exam: 'primary',
    category: 'Medical Emergencies',
    version: 'Version 7 (October 2021)',
    cpgBasis: '2021 CPGs',
    intro: 'Candidate is read an appropriate scenario and is advised of two separate skills.',
    sections: [
      { title: 'Paediatric FBAO', elements: [
        { n: 1, text: 'Confirm airway obstruction', crit: true },
        { n: 2, text: 'Position and perform up to 5 back blows' },
        { n: 3, text: 'Correct hand position during back blows' },
        { n: 4, text: 'Perform up to 5 abdominal thrusts (or chest thrusts on infant)' },
        { n: 5, text: 'Correct hand position during thrusts' },
        { n: 6, text: 'Continue until effective or patient collapse' },
      ]},
      { title: 'Candidate is advised: "Patient becomes unresponsive"', elements: [
        { n: 7,  text: 'Patient lowered safely to the ground' },
        { n: 8,  text: 'Request ALS' },
        { n: 9,  text: 'Inspect airway and remove object if visualised' },
        { n: 10, text: 'Attempt up to 5 rescue breaths' },
        { n: 11, text: 'Commence CPR with compressions' },
        { n: 12, text: 'Inspect airway before ventilations' },
      ]},
      { title: 'Candidate is advised: "The object has become visible" (after one cycle approx.)', elements: [
        { n: 13, text: 'Perform finger sweep' },
        { n: 14, text: 'Check breathing' },
      ]},
      { title: 'Candidate is advised: "Patient is breathing"', elements: [
        { n: 15, text: 'Ensure adequate ventilation and oxygenation' },
        { n: 16, text: 'Check circulation' },
      ]},
      { title: 'Candidate is advised: "Adequate pulse present"', elements: [
        { n: 17, text: 'CPR compressions were performed effectively' },
      ]},
      { title: 'Recovery position', elements: [
        { n: 18, text: 'Check responsiveness' },
        { n: 19, text: 'Open airway', crit: true },
        { n: 20, text: 'Check breathing' },
      ]},
      { title: 'Candidate is advised: "Patient is breathing adequately"', elements: [
        { n: 21, text: 'Check pulse' },
      ]},
      { title: 'Candidate is advised: "Pulse present"', elements: [
        { n: 22, text: 'Inspect and prepare immediate area (safety)' },
        { n: 23, text: 'Physically assess patient for objects that may cause harm' },
        { n: 24, text: "Remove unsafe objects for patient's safety" },
        { n: 25, text: 'Roll patient laterally' },
        { n: 26, text: 'Support the head as patient is turned' },
        { n: 27, text: 'Ensure the uppermost arm supports the body' },
        { n: 28, text: 'Ensure the uppermost leg supports the body' },
        { n: 29, text: 'Maintain an open airway' },
        { n: 30, text: 'Check breathing' },
      ]},
      { title: 'Candidate is advised: "Patient is breathing adequately"', elements: [
        { n: 31, text: 'Check pulse' },
      ]},
      { title: 'Candidate is advised: "Pulse present"', elements: [] },
    ],
    passRule: '80% of elements, and all critical (*) elements.',
    ruleLine: 'Sum line 1 and 19 = 2',
    examinerNote: null,
  },

  {
    id: 'emt_aloca_s001',
    name: 'Altered Level of Consciousness (ALOC)',
    scope: 'EMT', exam: 'secondary',
    category: 'Medical Emergencies',
    version: 'Version 8 (April 2025)',
    cpgBasis: '2021 CPGs',
    intro: 'Candidate is read a scenario which relates to a medical case. The primary survey has been completed. The patient has an altered level of consciousness and is V, P or U on the AVPU scale.',
    sections: [
      { title: 'Primary Survey completed - ABC intact', elements: [
        { n: 1, text: 'Maintain airway' },
        { n: 2, text: 'Assess for trauma' },
        { n: 3, text: 'Assess AVPU level' },
      ]},
      { title: 'P or U: request ALS, or V: consider Paramedic', elements: [
        { n: 4,  text: 'Correct AVPU assessment' },
        { n: 5,  text: 'Correct assistance request made' },
        { n: 6,  text: 'Obtain SAMPLE history from bystander', examiner: 'Examiner to provide' },
        { n: 7,  text: 'Apply ECG' },
        { n: 8,  text: 'Apply SpO₂' },
        { n: 9,  text: 'Assess temperature' },
        { n: 10, text: 'Assess pupils' },
        { n: 11, text: 'Assess for skin rash' },
        { n: 12, text: 'Assess for medication carried' },
        { n: 13, text: 'Assess for medical alert jewellery' },
        { n: 14, text: 'Place patient in recovery position (if appropriate)' },
      ]},
      { title: 'Blood Glucose', elements: [
        { n: 15, text: 'Prepare test site' },
        { n: 16, text: 'Confirm glucometer reading', examiner: 'supply reading' },
      ]},
      { title: 'Candidate identifies provisional working diagnosis', elements: [
        { n: 17, text: 'Correct working diagnosis identified' },
        { n: 18, text: 'Candidate demonstrated good communication with patient during assessment' },
      ]},
    ],
    passRule: '80% of elements. No critical elements on secondary sheets.',
    ruleLine: null,
    examinerNote: null,
  },

  {
    id: 'emt_ccpacs_s001',
    name: 'Cardiac Chest Pain / Pharmacology',
    scope: 'EMT', exam: 'secondary',
    category: 'Medical Emergencies',
    version: 'Version 8 (April 2025)',
    cpgBasis: '2021 CPGs',
    intro: 'The candidate is read a scenario regarding a patient whose chief complaint is chest pain.',
    sections: [
      { title: null, elements: [
        { n: 1, text: 'Assess airway' },
        { n: 2, text: 'Assess breathing' },
        { n: 3, text: 'Consider O₂ Administration' },
        { n: 4, text: 'Correct dose', verbalise: true },
        { n: 5, text: 'Assess circulation' },
        { n: 6, text: 'Initial clinical impression' },
        { n: 7, text: 'Request ALS attendance' },
      ]},
      { title: 'Focused History and Physical Examination', elements: [
        { n: 8,  text: 'Place patient in position of comfort' },
        { n: 9,  text: 'Provide reassurance' },
        { n: 10, text: 'Assess skin colour, temperature and condition' },
        { n: 11, text: 'Apply 3 lead ECG monitoring' },
        { n: 12, text: 'Print strip and assess rhythm' },
        { n: 13, text: 'Gather OPQRST information', examiner: 'Examiner supply information' },
        { n: 14, text: 'Gather SAMPLE history', examiner: 'Examiner supply information' },
        { n: 15, text: 'Consider Aspirin administration' },
        { n: 16, text: 'Rule out contraindications', examiner: 'Examiner supply information' },
        { n: 17, text: 'Correct dose', verbalise: true },
        { n: 18, text: 'Correct method of administration', verbalise: true },
        { n: 19, text: 'Assess vital signs', examiner: 'Examiner supply information' },
        { n: 20, text: 'Consider GTN administration' },
        { n: 21, text: 'Rule out contraindications with patient', examiner: 'Examiner supply information' },
        { n: 22, text: 'Correct dose', verbalise: true },
        { n: 23, text: 'Correct method of administration', verbalise: true },
        { n: 24, text: 'Consider side effects', verbalise: true },
        { n: 25, text: 'Repeat GTN dose indication', verbalise: true },
        { n: 26, text: 'Maximum dose', verbalise: true },
        { n: 27, text: 'Reference PHECC field guide when administering medications' },
        { n: 28, text: 'Contact ambulance control for direction', verbalise: true },
        { n: 29, text: 'Monitor vital signs', examiner: 'Examiner supply information' },
        { n: 30, text: 'Candidate demonstrated good communication with the patient during the assessment' },
      ]},
    ],
    passRule: '80% of elements. No critical elements on secondary sheets.',
    ruleLine: null,
    examinerNote: 'No actual medication to be administered to patient during assessment. If a contraindication precludes the administration of medication, the candidate will be awarded all points relevant to that medication.',
  },

  {
    id: 'emt_blsa_s001',
    name: 'Rhythm recognition',
    scope: 'EMT', exam: 'secondary',
    category: 'Medical Emergencies',
    version: 'Version 7 (October 2021)',
    cpgBasis: '2021 CPGs',
    intro: 'Candidate is expected to identify specific ECG rhythms. The candidate will identify each rhythm twice. The seven (7) rhythms assessed in this OSCE are: Normal Sinus Rhythm, Sinus Bradycardia, Sinus Tachycardia, Sinus Rhythm with Premature Ventricular Contractions, Ventricular Fibrillation, Ventricular Tachycardia, Asystole.',
    sections: [
      { title: null, elements: [
        { n: 1,  text: 'Rhythm 1 (print-out)' },
        { n: 2,  text: 'Rhythm 2 (print-out)' },
        { n: 3,  text: 'Rhythm 3 (print-out)' },
        { n: 4,  text: 'Rhythm 4 (print-out)' },
        { n: 5,  text: 'Rhythm 5 (print-out)' },
        { n: 6,  text: 'Rhythm 6 (print-out)' },
        { n: 7,  text: 'Rhythm 7 (print-out)' },
        { n: 8,  text: 'Rhythm 8 (dynamic)' },
        { n: 9,  text: 'Rhythm 9 (dynamic)' },
        { n: 10, text: 'Rhythm 10 (dynamic)' },
        { n: 11, text: 'Rhythm 11 (dynamic)' },
        { n: 12, text: 'Rhythm 12 (dynamic)' },
        { n: 13, text: 'Rhythm 13 (dynamic)' },
        { n: 14, text: 'Rhythm 14 (dynamic)' },
      ]},
    ],
    passRule: '80% of elements. No critical elements on secondary sheets.',
    ruleLine: null,
    examinerNote: null,
  },

  {
    id: 'emt_blsa_s002',
    name: 'ECG Monitoring and Recognition',
    scope: 'EMT', exam: 'secondary',
    category: 'Medical Emergencies',
    version: 'Version 7 (October 2021)',
    cpgBasis: '2021 CPGs',
    intro: 'The candidate is asked to obtain an ECG reading from a patient and asked to identify it correctly.',
    sections: [
      { title: null, elements: [
        { n: 1,  text: 'Explain procedure to patient' },
        { n: 2,  text: 'Turn on monitor' },
        { n: 3,  text: 'Ensure AED is set to monitoring function' },
        { n: 4,  text: 'Ensure monitoring cable connected to AED' },
        { n: 5,  text: 'Ensure AED is on lead II' },
        { n: 6,  text: 'Attach ECG electrodes to cables' },
        { n: 7,  text: 'Attach RA Cable' },
        { n: 8,  text: 'Attach LA Cable' },
        { n: 9,  text: 'Attach LL Cable' },
        { n: 10, text: 'Attach earth cable', examiner: 'Point awarded if no earth cable' },
        { n: 11, text: 'Skin preparation', verbalise: true },
        { n: 12, text: 'Electrodes connected in appropriate position' },
        { n: 13, text: 'Confirm screen display', verbalise: true },
      ]},
      { title: 'Examiner will show candidate rhythm to identify', elements: [
        { n: 14, text: 'Identify rhythm' },
        { n: 15, text: 'Confirm mechanical output matches on-screen rhythm' },
        { n: 16, text: 'Print 6 sec ECG rhythm strip' },
        { n: 17, text: 'Ensure patient identity is entered on ECG rhythm strip' },
        { n: 18, text: 'Enter rhythm details on PCR', verbalise: true },
        { n: 19, text: 'Maintains the modesty of the patient during process', verbalise: true },
      ]},
    ],
    passRule: '80% of elements. No critical elements on secondary sheets.',
    ruleLine: null,
    examinerNote: null,
  },

  // ───────────────────────── Paramedic — Medical ─────────────────────────

  {
    id: 'para_blsa_s001',
    name: 'Rhythm Identification',
    scope: 'P', exam: 'secondary',
    category: 'Medical',
    version: 'Version 4 (March 2017)',
    cpgBasis: null,
    caveat: PARA_CAVEAT,
    intro: 'The seven (7) rhythms randomly assessed in this OSCE are: Normal Sinus Rhythm, Sinus Bradycardia, Sinus Tachycardia, Sinus Rhythm with Premature Ventricular Contractions, Ventricular Fibrillation, Ventricular Tachycardia and Asystole.',
    sections: [
      { title: null, elements: [
        { n: 1,  text: 'Rhythm 1 (Dynamic)' },
        { n: 2,  text: 'Rhythm 2 (Dynamic)' },
        { n: 3,  text: 'Rhythm 3 (Dynamic)' },
        { n: 4,  text: 'Rhythm 4 (Dynamic)' },
        { n: 5,  text: 'Rhythm 5 (Dynamic)' },
        { n: 6,  text: 'Rhythm 6 (Dynamic)' },
        { n: 7,  text: 'Rhythm 7 (Dynamic)' },
        { n: 8,  text: 'Rhythm 8 (Static)' },
        { n: 9,  text: 'Rhythm 9 (Static)' },
        { n: 10, text: 'Rhythm 10 (Static)' },
        { n: 11, text: 'Rhythm 11 (Static)' },
        { n: 12, text: 'Rhythm 12 (Static)' },
        { n: 13, text: 'Rhythm 13 (Static)' },
        { n: 14, text: 'Rhythm 14 (Static)' },
      ]},
      { title: 'Interpretation of 12-lead ECG', elements: [
        { n: 15, text: 'Identify ECG rate' },
        { n: 16, text: 'Identify ECG rhythm' },
        { n: 17, text: 'Identify ST elevation (State lead involved)' },
        { n: 18, text: 'Identify ST elevation (State lead involved)' },
        { n: 19, text: 'Identify ST elevation (State lead involved)' },
        { n: 20, text: 'Identify ST elevation (State lead involved)' },
        { n: 21, text: 'Confirm/reject STEMI on ECG' },
        { n: 22, text: 'Report location of MI' },
      ]},
    ],
    passRule: '80% of elements. No critical elements on secondary sheets.',
    ruleLine: null,
    examinerNote: 'Each rhythm will be assessed three (3) times.',
  },

  {
    id: 'para_ccpacs_s001',
    name: 'Cardiac Chest Pain: Acute Coronary Syndrome',
    scope: 'P', exam: 'secondary',
    category: 'Medical',
    version: 'Version 4 (March 2017)',
    cpgBasis: null,
    caveat: PARA_CAVEAT,
    intro: 'Candidate is read appropriate scenario.',
    sections: [
      { title: 'ECG monitoring', elements: [
        { n: 1,  text: 'Turn on cardiac monitor' },
        { n: 2,  text: 'Explain procedure to patient' },
        { n: 3,  text: 'Attach SpO₂', examiner: 'Examiner to supply percentage' },
        { n: 4,  text: 'Oxygen therapy consideration' },
        { n: 5,  text: 'Activate ALS' },
        { n: 6,  text: 'Ensure defibrillator is activated to monitoring function' },
        { n: 7,  text: 'Apply monitoring electrode 1 appropriately' },
        { n: 8,  text: 'Apply monitoring electrode 2 appropriately' },
        { n: 9,  text: 'Apply monitoring electrode 3 appropriately' },
        { n: 10, text: 'Apply monitoring electrode 4 appropriately', examiner: 'available point awarded if only 3-lead system available' },
        { n: 11, text: 'Ensure ECG rhythm on screen (Lead II)' },
        { n: 12, text: 'Interpret ECG rhythm' },
      ]},
      { title: 'Treating an AMI: vital signs stable', elements: [
        { n: 13, text: 'Select appropriate medication (1)' },
        { n: 14, text: 'State 6 rights of medication administration as they apply to the case' },
        { n: 15, text: 'Rule out contraindications' },
        { n: 16, text: 'State dose' },
        { n: 17, text: 'Explain procedure to patient' },
        { n: 18, text: 'Prepare medication' },
        { n: 19, text: 'Administer medication 1', simulate: true },
      ]},
      { title: 'Examiner supplies more clinical information', elements: [
        { n: 20, text: 'Select appropriate medication (2)' },
        { n: 21, text: 'State 6 rights of medication administration as they apply to the case' },
        { n: 22, text: 'Rule out contraindications' },
        { n: 23, text: 'State dose' },
        { n: 24, text: 'Explain procedure to patient' },
        { n: 25, text: 'Administer medication 2', simulate: true },
        { n: 26, text: 'State further dosing regime for medication 2' },
        { n: 27, text: 'Acquire 12-lead ECG', verbalise: true },
        { n: 28, text: 'Document medication on PCR' },
      ]},
    ],
    passRule: '80% of elements. No critical elements on secondary sheets.',
    ruleLine: null,
    examinerNote: 'Ref: CPG 5/6.4.10 Acute Coronary Syndrome.',
  },

];
