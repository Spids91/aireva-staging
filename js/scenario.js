// ─── SCENARIO.JS — OSCE Scenario Generator (engine + UI) ─────────────────────────
// Generates a physiologically-coherent OSCE station on demand. The app is the
// scenario AUTHOR, not an assessor: it hands a study group a fresh station to run,
// then a tap-to-reveal panel anchors their debrief. No marking, no branching.
// Data comes from js/data/scenarios.js (SCEN_VITALS + DEV_PCT_BANDS + PRESENTATIONS).

// ── HELPERS ──────────────────────────────────────────────────────────────────────
function _ri(lo, hi) { return Math.floor(Math.random() * (hi - lo + 1)) + lo; }       // int in [lo,hi]
function _rf(lo, hi) { return Math.round((Math.random() * (hi - lo) + lo) * 10) / 10; } // 1-dp float
function _pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// Remembers the last presentation shown so the random picker never serves the
// same presentation twice in a row. True random feels "broken" to users because
// it clumps (with 7 presentations, ~1 in 7 picks repeats the previous one); this
// guard removes that perceived repetition while keeping selection otherwise random.
// Only applies to random selection; an explicitly requested presId is unaffected.
let _lastPresId = null;
function _pickPresentation() {
  if (PRESENTATIONS.length <= 1) return PRESENTATIONS[0];   // can't avoid a repeat with one option
  let p;
  do { p = _pick(PRESENTATIONS); } while (p.id === _lastPresId);
  _lastPresId = p.id;
  return p;
}

// First vital age-band whose age >= patient age.
function scenVitalBand(age) {
  return SCEN_VITALS.find(b => age <= b.age) || SCEN_VITALS[SCEN_VITALS.length - 1];
}
// Age-appropriate MAX deviation percentage (the older the patient, the bigger the shift).
function scenMaxPct(age) {
  const b = DEV_PCT_BANDS.find(x => age <= x.age) || DEV_PCT_BANDS[DEV_PCT_BANDS.length - 1];
  return b.maxPct;
}

// Apply a RELATIVE deviation to a normal [lo,hi] range.
//   dir 'up'   → push above the ceiling by (maxPct% * intensity * random severity)
//   dir 'down' → drop below the floor by the same proportion
// Severity is randomised 0.5–1.0 of the requested intensity so scenarios vary
// moderate→severe and never repeat the same number.
// A deviation may carry an optional `cap` (for 'up') or `floor` (for 'down') to bound
// the result at a clinically plausible limit. Each may be:
//   • a NUMBER  → a flat ceiling/floor for all ages, or
//   • an ARRAY of {age, val} bands → an AGE-SCALED limit (e.g. a tachypnoeic infant
//     can breathe faster than an adult, so RR caps higher for the young). The band whose
//     `age` is the first >= the patient's age is used (same convention as DEV_PCT_BANDS).
// Resolves to a number via resolveLimit().
function resolveLimit(limit, age) {
  if (limit == null) return null;
  if (typeof limit === 'number') return limit;
  const b = limit.find(x => age <= x.age) || limit[limit.length - 1];
  return b ? b.val : null;
}
function applyRelative(range, dev, age) {
  const [lo, hi] = range;
  const maxPct = scenMaxPct(age) / 100;
  const severity = 0.5 + Math.random() * 0.5;        // 0.5–1.0
  const shiftFrac = maxPct * dev.intensity * severity;
  if (dev.dir === 'up') {
    const cap = resolveLimit(dev.cap, age);
    let target = Math.round(hi * (1 + shiftFrac));
    if (cap != null) target = Math.min(target, cap);            // clinical ceiling
    const top = Math.max(hi + 2, target);
    return _ri(hi + 1, cap != null ? Math.min(top, cap) : top);
  } else {
    const floor = resolveLimit(dev.floor, age);
    let target = Math.round(lo * (1 - shiftFrac));
    if (floor != null) target = Math.max(target, floor);        // clinical floor
    const bot = Math.min(lo - 2, target);
    return _ri(floor != null ? Math.max(bot, floor) : bot, lo - 1);
  }
}

// ── CORE GENERATOR ───────────────────────────────────────────────────────────────
function generateScenario(presId) {
  const pres = presId ? PRESENTATIONS.find(p => p.id === presId) : _pickPresentation();
  if (!pres) return null;

  // 1. Narrative variant (the cause/story). Picked first so it can constrain age.
  const variant = _pick(pres.variants);

  // 2. Patient within demographic constraints. A variant may raise the minimum age
  //    via `variant.minAge` (e.g. a Type 2 diabetic should not be a toddler); the
  //    presentation floor still applies as the baseline.
  const lo = Math.max(pres.demographics.minAge, variant.minAge || 0);
  const hi = Math.min(pres.demographics.maxAge, variant.maxAge || Infinity);
  let age;
  if (lo < 2 && Math.random() < 0.25) age = _pick([0, 0.5, 1]);     // occasional infant
  else age = _ri(Math.max(1, Math.ceil(lo)), Math.floor(hi));
  const sex = pres.demographics.sex === 'any' ? _pick(['male', 'female']) : pres.demographics.sex;

  // 3. Vitals. Relative vitals (hr/rr/bpSys/bpDia) use age-scaled % shifts; absolute
  //    vitals (spo2/temp/bgl) use direct target ranges; anything omitted stays normal.
  const band = scenVitalBand(age);
  // Deviations are normally presentation-level. A single variant can override them
  // with its own `vitalsOverride` object (same shape as deviations) so one outlier
  // variant can read distinctly sicker/healthier than its siblings (e.g. a
  // catastrophic large-burn-plus-inhalation case). Absent override = unchanged.
  const d = variant.vitalsOverride || pres.deviations || {};
  const hr  = d.hr  ? applyRelative(band.hr, d.hr, age) : _ri(band.hr[0], band.hr[1]);
  // RR: usually a relative deviation, but a variant may give an absolute [lo,hi] range
  // (like spo2/bgl) for precise control, e.g. opioid respiratory depression RR [6,10].
  const rr  = Array.isArray(d.rr) ? _ri(d.rr[0], d.rr[1])
            : d.rr ? applyRelative(band.rr, d.rr, age)
            : _ri(band.rr[0], band.rr[1]);
  // BP: usually a relative deviation, but a variant may give an absolute [lo,hi] range
  // (like rr/spo2) for precise control, e.g. a severe-shock systolic [60,85] that should
  // never read near-normal.
  const sys = Array.isArray(d.bpSys) ? _ri(d.bpSys[0], d.bpSys[1])
            : d.bpSys ? applyRelative([band.bp[0], band.bp[1]], d.bpSys, age)
            : _ri(band.bp[0], band.bp[1]);
  const dia = Array.isArray(d.bpDia) ? _ri(d.bpDia[0], d.bpDia[1])
            : d.bpDia ? applyRelative([band.bp[2], band.bp[3]], d.bpDia, age)
            : _ri(band.bp[2], band.bp[3]);
  // SpO2: most presentations use a flat absolute range [min,max]. A presentation
  // can instead provide `spo2Severe:[low,high]` and tag each variant with a
  // `severity` (0-1); then SpO2 is biased toward the LOW end for high-severity
  // variants (e.g. peri-arrest) and the HIGH end for milder ones, with a little
  // jitter so it varies run to run. Falls back to flat range / band otherwise.
  let spo2;
  if (Array.isArray(d.spo2Severe) && typeof variant.severity === 'number') {
    const [lo, hi] = d.spo2Severe;                 // lo = sickest, hi = mildest
    const sev = Math.max(0, Math.min(1, variant.severity));
    const target = hi - sev * (hi - lo);           // sev 1 -> lo, sev 0 -> hi
    const jittered = target + (Math.random() * 4 - 2); // +/- 2% jitter
    spo2 = Math.max(lo, Math.min(hi, Math.round(jittered)));
  } else {
    spo2 = Array.isArray(d.spo2) ? _ri(d.spo2[0], d.spo2[1]) : _ri(band.spo2[0], band.spo2[1]);
  }
  const temp = Array.isArray(d.temp) ? _rf(d.temp[0], d.temp[1]) : _rf(band.temp[0], band.temp[1]);
  const bgl  = Array.isArray(d.bgl)  ? _rf(d.bgl[0], d.bgl[1])   : _rf(band.bgl[0], band.bgl[1]);
  const ecg = pres.ecg ? _pick(pres.ecg) : null;

  // Cardiac arrest: a variant may declare `arrestRhythm` (e.g. 'VF / pulseless VT',
  // 'PEA', 'Not yet determined'). When present, this patient is in arrest — pulseless,
  // apnoeic/agonal, no meaningful BP/SpO2 — and the card shows the arrest STATE and the
  // monitor rhythm instead of normal vital numbers (which would be clinically absurd
  // for an arrest). Other presentations are unaffected (no arrestRhythm = normal vitals).
  const arrest = variant.arrestRhythm ? { rhythm: variant.arrestRhythm } : null;

  // 4. Readable patient descriptor + a random (diagnosis-neutral) location for dispatch.
  const ageLabel = age < 1
                 ? band.label.replace(/^(\d+)\s+months?$/i, '$1-month-old').toLowerCase()
                 : age <= 15 ? `${age}-year-old` : `${age}-year-old`;
  const personWord = age <= 15 ? (sex === 'male' ? 'boy' : 'girl')
                               : (sex === 'male' ? 'man' : 'woman');
  // Location pick. A variant can declare `witness:'witnessed'|'unwitnessed'` to keep
  // the scene and the history consistent (general capability, any presentation can use it):
  //   'unwitnessed' → patient is alone with no witness to onset, so pick a location where
  //                   that's plausible (solo:true), and last-known-well becomes "unknown".
  //   'witnessed'   → someone was present, so avoid solo-only spots; the variant supplies
  //                   a real last-known-well via its sample.lastIntake.
  // No witness field = original behaviour (pick from all locations).
  let locPool = SCEN_LOCATIONS;
  if (variant.witness === 'unwitnessed')      locPool = SCEN_LOCATIONS.filter(l => l.solo);
  else if (variant.witness === 'witnessed')   locPool = SCEN_LOCATIONS.filter(l => !l.solo || l.found);
  if (!locPool.length) locPool = SCEN_LOCATIONS;
  // Location selection. Two SOFT weightings compose here, both layered on top of the witness
  // filter (which already decided the eligible pool): (a) setting-bias, weighting locations
  // whose `setting` matches the presentation's `locationBias` toward ~80% of picks; (b) age-fit,
  // making age-inappropriate locations rare (a creche almost never holds an elderly patient).
  // Age was chosen FIRST (clinically); location bends to fit age, never the reverse — an
  // ill-fitting location is made unlikely, never impossible, and age is never altered to suit a scene.
  let location;
  {
    const bias = Array.isArray(pres.locationBias) && pres.locationBias.length ? pres.locationBias : null;
    // setting-bias weight: compute the per-fitting multiplier that targets ~80% fitting mass,
    // matching the previous behaviour, but expressed as a per-location factor so it can multiply
    // with the age factor below.
    let setW = 1;
    if (bias) {
      const fit = locPool.filter(l => bias.includes(l.setting)).length;
      const oth = locPool.length - fit;
      if (fit && oth) setW = Math.max(1, Math.round((0.8 * oth) / (0.2 * fit)));  // weight on fitting locs
    }
    // age-fit factor: near-hard. A location tagged for the wrong age band becomes very rare.
    // 'young' locations (creche/school) effectively never hold older patients; 'old' locations
    // (nursing home/mart) effectively never hold children. Untagged/'mixed' = all ages (factor 1).
    const ageFactor = (l) => {
      if (!l.ageSkew || l.ageSkew === 'mixed') return 1;
      if (l.ageSkew === 'young') return age <= 16 ? 1 : (age <= 30 ? 0.25 : 0.04);
      if (l.ageSkew === 'old')   return age >= 45 ? 1 : (age >= 25 ? 0.25 : 0.06);
      return 1;
    };
    const weighted = [];
    for (const l of locPool) {
      const sf = (bias && bias.includes(l.setting)) ? setW : 1;
      const w = Math.max(1, Math.round(sf * ageFactor(l) * 100));  // scale so fractional age-factors survive
      for (let k = 0; k < w; k++) weighted.push(l);
    }
    location = _pick(weighted.length ? weighted : locPool);
  }
  const dispatch = variant.dispatch
    .replace('{location}', location.name)
    .replace('a PATIENT', `a ${ageLabel} ${personWord}`)
    .replace('PATIENT', `${ageLabel} ${personWord}`);

  // Build a COHERENT events line. For an unconscious patient the history can't come
  // from the patient, so it's framed by how they came to attention — and that framing
  // must fit the location: you can be "found unresponsive" somewhere you'd be come
  // across (home, street), but somewhere you travelled to (GP surgery, café) you
  // "collapsed / became unresponsive there", never "found".
  const conscious = variant.conscious !== false;  // default conscious unless flagged false

  // Under-3 conscious patients are pre-verbal: if the variant carries an
  // age-appropriate presentationU3 string, use it instead of the verbal-assessment
  // wording (which describes "talking / following commands" — wrong for a toddler).
  // Falls back to the standard presentation when no U3 text exists or age >= 3.
  const presentationText = (conscious && age < 3 && variant.presentationU3)
    ? variant.presentationU3
    : variant.presentation;
  // A variant may carry `eventsCues`: an array of alternative Events lines, one picked at
  // random per run. Used to seed occasional teaching nudges (e.g. reversible-cause hints
  // for PEA) while keeping most runs generic. Each cue is a self-contained scene sentence,
  // so it is used as-is (no extra "found/collapsed" frame prepended).
  let events;
  if (Array.isArray(variant.eventsCues) && variant.eventsCues.length) {
    events = _pick(variant.eventsCues);
  } else {
    events = variant.events;
    if (!conscious) {
      const frame = location.found
        ? 'Found unresponsive by a bystander.'
        : `Collapsed and became unresponsive at ${location.name}.`;
      events = `${frame} ${variant.events}`;
    }
  }

  // Last oral intake: an unresponsive patient can't tell you — Unknown is the honest,
  // realistic value rather than fabricating a history.
  // A variant can supply its own `sample` object (patient-specific medications, PMH,
  // symptoms, lastIntake) which overrides the presentation default field-by-field;
  // anything the variant omits falls back to pres.sample. This lets each patient have
  // a realistic, individual history (e.g. a stroke patient on a named anticoagulant)
  // while presentations not yet migrated keep their shared default.
  const vs = variant.sample || {};
  const ps = pres.sample;
  // Last-known-well wording carries the witness/reliability angle (distinct from the
  // OPQRST clock). For a witnessed patient with an onsetWhen value, the clock time is
  // derived from that single source (onsetWhen) so it can't drift from OPQRST Time.
  // Unwitnessed → genuinely unknown (clinically important: often excludes the window).
  let lastIntake;
  if (!conscious) {
    lastIntake = 'Unknown, patient unresponsive, no reliable history.';
  } else if (variant.witness === 'unwitnessed') {
    lastIntake = 'Unknown, the patient was found alone and the time of onset is unwitnessed.';
  } else if (variant.witness === 'witnessed' && variant.onsetWhen) {
    lastIntake = `A witness was present and saw them well ${variant.onsetWhen}.`;
  } else if (variant.witness === 'witnessed' && variant.wakeUp) {
    lastIntake = 'Was seen well last night before bed; woke with the symptoms, so the exact onset overnight is unknown.';
  } else {
    lastIntake = vs.lastIntake || ps.lastIntake;
  }

  // For an UNCONSCIOUS patient, almost no reliable history is obtainable — the student's
  // learning is to assess (vitals/BGL), NOT to interrogate a bystander and hope they
  // mention "diabetic". So SAMPLE/OPQRST default to "Unknown" — EXCEPT Events Leading Up,
  // which can carry the witnessed-collapse framing (a bystander plausibly saw them go
  // down even if they know nothing else about them).
  //
  // EXCEPTION: a variant may explicitly supply `sample` fields for an unconscious patient
  // to model a family-present-at-home scenario, where a relative can give a brief (often
  // vague) history. Any field the variant provides is used; anything omitted stays Unknown.
  // This keeps the BGL-check teaching intact (history may be vague/absent) while allowing
  // realistic variation between "found alone, nothing known" and "family gave a history".
  const UNK = 'Unknown, no reliable history available.';
  const UNK_SHORT = 'Unknown';
  const sample = conscious ? {
    symptoms:    vs.symptoms    || ps.symptoms,
    allergies:   variant.allergies,
    medications: vs.medications || ps.medications,
    pmh:         vs.pmh         || ps.pmh,
    lastIntake:  lastIntake,
  } : {
    symptoms:    vs.symptoms    || UNK,
    allergies:   variant.allergies || UNK_SHORT,
    medications: vs.medications || UNK_SHORT,
    pmh:         vs.pmh         || UNK_SHORT,
    lastIntake:  vs.lastIntake || lastIntake,   // explicit > unresponsive default
  };
  // OPQRST: also Unknown for unconscious (can't self-report pain/onset/etc).
  // OPQRST. Non-timing fields (provocation/quality/radiates/severity) are shared from
  // the presentation. The two TIMING fields (onset, time) are DERIVED per-variant from
  // the witness type + an optional onsetWhen value, so they can never contradict the
  // SAMPLE last-known-well (one source of truth) and each says something distinct:
  //   onset = onset character (sudden + witnessed/not); time = WHEN it started (onset-
  //   anchored, not duration, because the stroke window is measured from time of onset).
  // onsetWhen lives on the variant and also feeds the witnessed lastIntake below.
  function deriveTiming(v, base) {
    if (!base) return base;
    const when = v.onsetWhen;                 // e.g. 'about 40 minutes ago' (witnessed only)
    let onset, time;
    if (v.witness === 'unwitnessed') {
      onset = 'Sudden onset, but not witnessed, the patient was found already affected.';
      time  = 'Time of onset unknown; the patient was found already symptomatic.';
    } else if (v.wakeUp) {                     // wake-up: witnessed-well last night, onset unobserved
      onset = 'Symptoms present on waking, so the onset was not observed.';
      time  = 'Last known well last night; the symptoms were already present on waking.';
    } else if (when) {                         // witnessed with a known clock time
      onset = 'Sudden onset, witnessed.';
        time  = v.improving
          ? `Symptoms started ${when} and have been improving since.`
          : `Symptoms started ${when} and are ongoing.`;
    } else {
      return base;                            // no timing metadata → use shared fields unchanged
    }
    return { ...base, onset, time };
  }
  // OPQRST base = presentation default, with any per-variant opqrst merged over it
  // field-by-field (lets painBased presentations like ACS give each variant its own
  // pain story). deriveTiming then applies on top for presentations that use the
  // witness/onsetWhen timing machinery (e.g. stroke); for others it's a no-op.
  const opqrstBase = pres.opqrst ? { ...pres.opqrst, ...(variant.opqrst || {}) } : null;
  const opqrst = !opqrstBase ? null : (conscious
    ? deriveTiming(variant, opqrstBase)
    : {
        onset: UNK_SHORT, provocation: UNK_SHORT, quality: UNK_SHORT,
        radiates: UNK_SHORT, severity: 'Unknown', time: UNK_SHORT,
      });

  return { pres, variant, age, sex, band, dispatch, ecg, conscious, location,
           events, lastIntake, sample, opqrst, presentationText, arrest,
           vitals: { hr, rr, spo2, sys, dia, temp, bgl } };
}

// Renders a reveal field. If the presentation provides a structured `blocks`
// array it draws labelled sub-bubbles (grade/branch/step/note/lead); otherwise
// it falls back to the plain prose string. The "AP only" phrase inside any body
// is turned into the same amber pill used in the drugs section.
function apPillify(text) {
  // Wrap a parenthetical "(AP only)" or bare "AP only" mention in the amber pill.
  return String(text)
    .replace(/\(AP only\)/g, '<span class="scen-ap-pill">AP only</span>')
    .replace(/\bIV is AP only\b/g, 'IV is <span class="scen-ap-pill">AP only</span>');
}
function renderRevealField(title, blocks, fallbackStr) {
  let inner;
  if (Array.isArray(blocks) && blocks.length) {
    let stepN = 0;
    inner = blocks.map(b => {
      const body = apPillify(b.body || '');
      if (b.type === 'lead') return `<div class="rv-lead">${body}</div>`;
      if (b.type === 'grade') return `<div class="rv-block rv-grade rv-sev-${b.sev || 'mod'}"><div class="rv-tag">${b.label}</div><div class="rv-body">${body}</div></div>`;
      if (b.type === 'branch') return `<div class="rv-block rv-branch"><div class="rv-tag">${b.label}</div><div class="rv-body">${body}</div></div>`;
      if (b.type === 'note') return `<div class="rv-block rv-note">${b.label ? `<div class="rv-tag">${b.label}</div>` : ''}<div class="rv-body">${body}</div></div>`;
      if (b.type === 'step') { stepN++; return `<div class="rv-block rv-step"><div class="rv-num">${stepN}</div><div class="rv-body">${body}</div></div>`; }
      return `<div class="rv-body">${body}</div>`;
    }).join('');
  } else {
    inner = `<div class="scen-dispatch">${fallbackStr || ''}</div>`;
  }
  return `<div class="scen-sec"><div class="scen-sec-title">${title}</div>${inner}</div>`;
}


// ── STATION CARD UI ──────────────────────────────────────────────────────────────
function renderScenarioCard(sc) {
  if (!sc) return;
  const v = sc.vitals, p = sc.pres, variant = sc.variant;

  // Cardiac arrest patients show the arrest STATE and monitor rhythm, not generated
  // HR/BP/SpO2 numbers (a patient in arrest has no pulse, no spontaneous breathing, no
  // meaningful SpO2 — showing normal-ish numbers would be clinically wrong).
  const vitalRows = sc.arrest ? [
    ['Pulse', 'Absent (pulseless)'],
    ['Breathing', 'Absent or agonal'],
    ['Monitor', sc.arrest.rhythm],
    ['BGL', `${v.bgl} mmol/L`],
  ] : [
    ['Heart Rate', `${v.hr} bpm`],
    ['Resp Rate', `${v.rr} /min`],
    ['SpO₂', `${v.spo2}%`],
    ['Blood Pressure', `${v.sys}/${v.dia} mmHg`],
    ['BGL', `${v.bgl} mmol/L`],
    ['Temperature', `${v.temp}°C`],
  ];
  if (sc.ecg && !sc.arrest) vitalRows.push(['ECG Rhythm', sc.ecg]);

  const sampleRows = [
    ['Signs/Symptoms', sc.sample.symptoms],
    ['Allergies', sc.sample.allergies],
    ['Medications', sc.sample.medications],
    ['Past Medical History', sc.sample.pmh],
    ['Last Oral Intake', sc.sample.lastIntake],
    ['Events Leading Up', sc.events],
  ];
  // OPQRST: severity is a 0–10 number for conscious pain cases; "Unknown" if unconscious.
  const opqrst = sc.opqrst ? [
    ['Onset', sc.opqrst.onset], ['Provocation', sc.opqrst.provocation],
    ['Quality', sc.opqrst.quality], ['Radiates', sc.opqrst.radiates],
    ['Severity', sc.conscious ? `${sc.opqrst.severity}/10` : sc.opqrst.severity], ['Time', sc.opqrst.time],
  ] : [];

  const sec = (title, rows) => `
    <div class="scen-sec">
      <div class="scen-sec-title">${title}</div>
      <div class="scen-rows">
        ${rows.map(([k, val]) => `<div class="scen-row"><span class="scen-k">${k}</span><span class="scen-v">${val}</span></div>`).join('')}
      </div>
    </div>`;

  // Authored reveal drugs: Paramedic dose normal, optional AP route in amber bubble.
  // Each drug carries age-specific dosing. Patients >15 get adult doses; <=15 get
  // paediatric doses, matching the split between the Adult and Paediatric CPGs.
  const isAdult = sc.age > 15;
  const drugLines = (p.reveal.drugs || []).map(dr => {
    const d = isAdult ? (dr.adult || dr) : (dr.paed || dr);
    // paramedic route shown as the main line; ap route (if any) as the amber pill.
    // Some drugs are AP-only (no paramedic route) — show just the name + AP pill,
    // never leak "undefined".
    const main = d.paramedic ? ` &mdash; ${d.paramedic}` : '';
    return `
    <li>
      <strong>${dr.name}</strong>${main}
      ${d.ap ? `<span class="scen-ap-pill">AP only: ${d.ap}</span>` : ''}
    </li>`;
  }).join('');

  const html = `
    <div class="scen-card">
      <div class="scen-head">
        <div class="scen-badge">OSCE Station</div>
        <div class="scen-title">Emergency Call</div>
      </div>
      <div class="scen-sec"><div class="scen-sec-title">Dispatch</div><div class="scen-dispatch">${sc.dispatch}</div></div>
      ${sec('Patient', [['Age', sc.age < 1 ? sc.band.label : `${sc.age} years`], ['Sex', sc.sex === 'male' ? 'Male' : 'Female']])}
      <div class="scen-sec"><div class="scen-sec-title">On Arrival</div><div class="scen-dispatch">${sc.presentationText}</div></div>
      ${sec('Vital Signs', vitalRows)}
      ${sec('SAMPLE History', sampleRows)}
      ${opqrst.length ? sec('OPQRST', opqrst) : ''}
      <button class="scen-reveal-btn" id="scenRevealBtn">Reveal Diagnosis &amp; Management</button>
      <div class="scen-reveal" id="scenReveal" style="display:none">
        ${renderRevealField('Diagnosis', p.reveal.diagnosisBlocks, p.reveal.diagnosis)}
        ${renderRevealField('Pathway', p.reveal.pathwayBlocks, p.reveal.pathway)}
        ${renderRevealField('Interventions', p.reveal.interventionsBlocks, p.reveal.interventions)}
        <div class="scen-sec"><div class="scen-sec-title">Drugs &amp; Doses (Paramedic scope)</div><ul class="scen-drugs">${drugLines}</ul></div>
        <div class="scen-disclaimer">For study practice only, not a clinical reference. Generated vital signs are for practice and may not be physiologically exact. Always follow current clinical practice guidelines.</div>
      </div>
      <button class="scen-new-btn" id="scenNewBtn">Generate New Scenario</button>
    </div>`;

  const wrap = document.getElementById('scenarioContent');
  if (wrap) {
    wrap.innerHTML = html;
    const rb = document.getElementById('scenRevealBtn'), rv = document.getElementById('scenReveal');
    if (rb && rv) rb.addEventListener('click', () => {
      const open = rv.style.display !== 'none';
      rv.style.display = open ? 'none' : 'block';
      rb.textContent = open ? 'Reveal Diagnosis & Management' : 'Hide Diagnosis & Management';
      // Land the Diagnosis bubble just below the sticky header. The header offset
      // lives in CSS as `.scen-reveal { scroll-margin-top: --sbh + --hdr-h + 12px }`,
      // which scrollIntoView respects natively (so it clears the status bar + header
      // bar on both web and the iOS wrapper, where --sbh is injected at runtime).
      if (!open) {
        requestAnimationFrame(() => rv.scrollIntoView({ behavior: 'smooth', block: 'start' }));
      }
      haptic();
    });
    document.getElementById('scenNewBtn')?.addEventListener('click', () => { startScenario(); haptic(); });
  }
}

// ── ENTRY POINTS ─────────────────────────────────────────────────────────────────
// Open the Scenario landing page inside the quiz tab: explains the feature and lets
// the user start. (Future: this is where a presentation/category picker will live.)
// The cohort choice buttons (Adult / Paeds / Mega OSCE). Shared by the intro screen and
// the skip path. Adult is the cobalt primary; Paeds (amber) and Mega OSCE (purple) are
// "coming soon" placeholders (greyed, disabled) until their content/engine exists,
// mirroring the old qmode-coming pattern. When paeds content lands, flip the Paeds button
// to call openScenarioRunner('paeds'); when the Mega OSCE engine lands, flip Mega likewise.
function scenarioChoiceHTML() {
  return `
    <div class="scen-choice">
      <button class="scen-cohort-btn scen-cohort-adult" id="scenAdultBtn">
        <span class="scen-cohort-ico">🧑</span>
        <span class="scen-cohort-txt"><span class="scen-cohort-name">Adult Scenario</span><span class="scen-cohort-sub">Generate an adult OSCE station</span></span>
      </button>
      <button class="scen-cohort-btn scen-cohort-paeds scen-cohort-soon" id="scenPaedsBtn" disabled>
        <span class="scen-cohort-ico">🧒</span>
        <span class="scen-cohort-txt"><span class="scen-cohort-name">Paediatric Scenario</span><span class="scen-cohort-sub">Generate a paediatric OSCE station</span></span>
        <span class="scen-cohort-soon-badge">Coming soon</span>
      </button>
      <button class="scen-cohort-btn scen-cohort-mega scen-cohort-soon" id="scenMegaBtn" disabled>
        <span class="scen-cohort-ico">🏔️</span>
        <span class="scen-cohort-txt"><span class="scen-cohort-name">Mega OSCE</span><span class="scen-cohort-sub">Two or more presentations combined into one station</span></span>
        <span class="scen-cohort-soon-badge">Coming soon</span>
      </button>
    </div>
    ${scenarioTimerHTML()}`;
}
// Optional countdown timer control (off by default). A toggle enables it; a slider sets
// the minutes (5 to 15, default 10). The slider only shows when the timer is on.
function scenarioTimerHTML() {
  const on = !!G.scenTimerOn;
  const mins = G.scenTimerMins || 10;
  return `
    <div class="scen-timer-ctrl">
      <label class="scen-timer-row">
        <span class="scen-timer-label">⏱ Timer</span>
        <span class="scen-timer-toggle ${on ? 'on' : ''}" id="scenTimerToggle"><span class="scen-timer-knob"></span></span>
      </label>
      <div class="scen-timer-slider-wrap" id="scenTimerSliderWrap" style="${on ? '' : 'display:none'}">
        <input type="range" min="5" max="15" step="1" value="${mins}" id="scenTimerSlider" class="scen-timer-slider">
        <span class="scen-timer-val" id="scenTimerVal">${mins} min</span>
      </div>
    </div>`;
}
// Wire the timer toggle + slider (call after the choice HTML is in the DOM).
function wireScenarioTimer() {
  const toggle = document.getElementById('scenTimerToggle');
  const sliderWrap = document.getElementById('scenTimerSliderWrap');
  const slider = document.getElementById('scenTimerSlider');
  const val = document.getElementById('scenTimerVal');
  if (toggle) toggle.addEventListener('click', () => {
    G.scenTimerOn = !G.scenTimerOn;
    saveG();
    toggle.classList.toggle('on', G.scenTimerOn);
    if (sliderWrap) sliderWrap.style.display = G.scenTimerOn ? '' : 'none';
    haptic();
  });
  if (slider) slider.addEventListener('input', () => {
    G.scenTimerMins = parseInt(slider.value, 10);
    if (val) val.textContent = G.scenTimerMins + ' min';
    saveG();
  });
}
// Wire the two cohort buttons after the HTML is in the DOM.
function wireScenarioChoice() {
  document.getElementById('scenAdultBtn')?.addEventListener('click', () => { openScenarioRunner('adult'); haptic(); });
  document.getElementById('scenPaedsBtn')?.addEventListener('click', () => { showToast('Paediatric scenarios, coming soon'); });
  document.getElementById('scenMegaBtn')?.addEventListener('click', () => { showToast('Mega OSCE, coming soon'); });
  wireScenarioTimer();
}

function goScenario() {
  window.scrollTo({ top: 0, behavior: 'instant' });
  const wrap = document.getElementById('quizTabContent');
  if (!wrap) return;
  // If the user previously ticked "don't show again", show JUST the cohort choice
  // (Adult / Paeds), not the explainer, and not an auto-generated scenario.
  if (G.scenIntroSeen) {
    wrap.innerHTML = `
      <div class="quiz-back-sticky" id="scenBack">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg> Back
      </div>
      <div class="pg-title">🏥 OSCE Scenario Generator</div>
      <div class="pg-sub">Choose a cohort to generate a station.</div>
      ${scenarioChoiceHTML()}
      <div class="scen-intro-note">Scenarios are study practice only. Always follow your current clinical practice guidelines.</div>`;
    document.getElementById('scenBack')?.addEventListener('click', renderQuizTab);
    wireScenarioChoice();
    return;
  }
  // First time (or not yet dismissed): explanation cards + don't-show-again + the choice.
  wrap.innerHTML = `
    <div class="quiz-back-sticky" id="scenBack">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg> Back
    </div>
    <div class="pg-title">🏥 OSCE Scenario Generator</div>
    <div class="pg-sub">Practice stations for OSCE prep, generated fresh every time.</div>

    <div class="scen-intro">
      <div class="scen-intro-card">
        <div class="scen-intro-icon">🎲</div>
        <div class="scen-intro-txt"><strong>A new station each time</strong><br>Random patient, plausible vitals, and a full clinical picture. The numbers change every run, so you reason it out rather than memorise.</div>
      </div>
      <div class="scen-intro-card">
        <div class="scen-intro-icon">👥</div>
        <div class="scen-intro-txt"><strong>Built for syndicate practice</strong><br>Two people step out, the group sets up the station, then run it like a real OSCE. Everyone but the candidates knows what it is.</div>
      </div>
      <div class="scen-intro-card">
        <div class="scen-intro-icon">📋</div>
        <div class="scen-intro-txt"><strong>Reveal for the debrief</strong><br>After the station, tap to reveal the diagnosis, pathway and Paramedic-scope management to anchor the discussion.</div>
      </div>
    </div>

    <label class="scen-intro-skip" id="scenSkipRow">
      <input type="checkbox" id="scenSkipChk"> Skip this intro next time
    </label>

    ${scenarioChoiceHTML()}
    <div class="scen-intro-note">Scenarios are study practice only. Always follow your current clinical practice guidelines.</div>`;
  document.getElementById('scenBack')?.addEventListener('click', renderQuizTab);
  // The skip checkbox is honoured when a cohort is chosen, so re-wire the cohort
  // buttons to persist the preference first, then proceed.
  document.getElementById('scenAdultBtn')?.addEventListener('click', () => {
    if (document.getElementById('scenSkipChk')?.checked) { G.scenIntroSeen = true; saveG(); }
    openScenarioRunner('adult'); haptic();
  });
  document.getElementById('scenPaedsBtn')?.addEventListener('click', () => {
    if (document.getElementById('scenSkipChk')?.checked) { G.scenIntroSeen = true; saveG(); }
    showToast('Paediatric scenarios, coming soon');
  });
  document.getElementById('scenMegaBtn')?.addEventListener('click', () => {
    if (document.getElementById('scenSkipChk')?.checked) { G.scenIntroSeen = true; saveG(); }
    showToast('Mega OSCE, coming soon');
  });
  wireScenarioTimer();
}

// The runner view: the back bar returns to the landing page, and a container the
// generated station card renders into.
function openScenarioRunner(cohort) {
  window.scrollTo({ top: 0, behavior: 'instant' });
  const wrap = document.getElementById('quizTabContent');
  if (!wrap) return;
  const timerBar = G.scenTimerOn
    ? `<div class="scen-timer-bar" id="scenTimerBar">
         <span class="scen-timer-clock" id="scenTimerClock">⏱ ${_fmtTime((G.scenTimerMins||10)*60)}</span>
         <div class="scen-timer-ctrls">
           <button class="scen-timer-btn start" id="scenTimerStart">Start</button>
           <button class="scen-timer-btn pause" id="scenTimerPause" style="display:none">Pause</button>
           <button class="scen-timer-btn reset" id="scenTimerReset" disabled>Reset</button>
         </div>
       </div>`
    : '';
  wrap.innerHTML = `
    <div class="quiz-back-sticky" id="scenRunnerBack">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg> Back
    </div>
    ${timerBar}
    <div id="scenarioContent"></div>`;
  // Back returns to the cohort choice screen (goScenario), so the user can switch
  // between Adult and Paeds without leaving the feature. Stop any running timer first.
  document.getElementById('scenRunnerBack')?.addEventListener('click', () => { stopScenTimer(); goScenario(); });
  startScenario(undefined, cohort);
}

// ── SCENARIO TIMER ──────────────────────────────────────────────────────────────
// Optional OSCE countdown. Off by default. Crucially it does NOT auto-start: in a real
// classroom OSCE the examiner generates the station, briefs the room and sets up the
// equipment BEFORE the candidates begin, so the clock must wait for a deliberate Start.
// Controls: Start, Pause/Resume, Reset. At zero it flags "time's up" with a soft haptic
// but does NOT lock anything (practice, not punishment). Amber in the final minute.
let _scenTimerId = null;       // interval handle while running
let _scenTimerRemaining = 0;   // seconds left (persists across pause)
let _scenTimerRunning = false; // true only while actively ticking
function _fmtTime(s) {
  const m = Math.floor(s / 60), sec = s % 60;
  return m + ':' + String(sec).padStart(2, '0');
}
// Put the timer into its READY state (full time, paused, Start enabled). Called whenever a
// scenario card renders. Does NOT begin the countdown.
function armScenTimer() {
  stopScenTimerTick();
  if (!G.scenTimerOn) return;
  _scenTimerRemaining = (G.scenTimerMins || 10) * 60;
  _scenTimerRunning = false;
  const clock = document.getElementById('scenTimerClock');
  const bar = document.getElementById('scenTimerBar');
  if (bar) bar.classList.remove('warn', 'done', 'running');
  if (clock) clock.textContent = '⏱ ' + _fmtTime(_scenTimerRemaining);
  _setTimerButtons('ready');
}
// Toggle the visible/enabled state of the three control buttons for a given mode.
function _setTimerButtons(mode) {
  const start = document.getElementById('scenTimerStart');
  const pause = document.getElementById('scenTimerPause');
  const reset = document.getElementById('scenTimerReset');
  if (!start || !pause || !reset) return;
  if (mode === 'ready') {            // full time, not started
    start.style.display = ''; start.textContent = 'Start'; start.disabled = false;
    pause.style.display = 'none';
    reset.disabled = true;
  } else if (mode === 'running') {   // ticking
    start.style.display = 'none';
    pause.style.display = ''; pause.textContent = 'Pause';
    reset.disabled = false;
  } else if (mode === 'paused') {    // frozen mid-count
    start.style.display = ''; start.textContent = 'Resume'; start.disabled = false;
    pause.style.display = 'none';
    reset.disabled = false;
  } else if (mode === 'done') {      // hit zero
    start.style.display = 'none';
    pause.style.display = 'none';
    reset.disabled = false;
  }
}
// Start (from ready) or resume (from paused). Begins ticking from whatever remains.
function startOrResumeScenTimer() {
  if (!G.scenTimerOn || _scenTimerRunning) return;
  if (_scenTimerRemaining <= 0) return;
  _scenTimerRunning = true;
  _setTimerButtons('running');
  const bar = document.getElementById('scenTimerBar');
  if (bar) bar.classList.add('running');
  _scenTimerId = setInterval(_scenTimerTick, 1000);
}
function _scenTimerTick() {
  const clock = document.getElementById('scenTimerClock');
  const bar = document.getElementById('scenTimerBar');
  if (!clock || !bar) { stopScenTimerTick(); return; }
  _scenTimerRemaining -= 1;
  if (_scenTimerRemaining <= 60 && _scenTimerRemaining > 0) bar.classList.add('warn');
  if (_scenTimerRemaining <= 0) {
    clock.textContent = "⏱ Time's up";
    bar.classList.remove('warn', 'running');
    bar.classList.add('done');
    haptic('error');               // noticeable (not punitive) buzz to flag time's up
    stopScenTimerTick();
    _setTimerButtons('done');
    return;
  }
  clock.textContent = '⏱ ' + _fmtTime(_scenTimerRemaining);
}
// Pause: freeze the count, keep the remaining time, offer Resume.
function pauseScenTimer() {
  if (!_scenTimerRunning) return;
  stopScenTimerTick();
  const bar = document.getElementById('scenTimerBar');
  if (bar) bar.classList.remove('running');
  _setTimerButtons('paused');
}
// Reset: back to full time, ready to run again (for the next group, no regenerate needed).
function resetScenTimer() {
  armScenTimer();
}
// Stop just the ticking interval (used by pause, done, and teardown). Leaves state intact.
function stopScenTimerTick() {
  if (_scenTimerId) { clearInterval(_scenTimerId); _scenTimerId = null; }
  _scenTimerRunning = false;
}
// Full stop used when leaving the scenario feature (Back, tab switch, new scenario).
function stopScenTimer() {
  stopScenTimerTick();
}
// Wire the three control buttons (called once the runner markup is in the DOM).
function wireScenTimerControls() {
  document.getElementById('scenTimerStart')?.addEventListener('click', () => { startOrResumeScenTimer(); haptic(); });
  document.getElementById('scenTimerPause')?.addEventListener('click', () => { pauseScenTimer(); haptic(); });
  document.getElementById('scenTimerReset')?.addEventListener('click', () => { resetScenTimer(); haptic(); });
}

// Current cohort for the scenario runner ('adult' | 'paeds'). Stored so "Generate New
// Scenario" stays in the same cohort. Until paediatric presentations exist, the cohort
// does not change generation (all presentations are adult); it is threaded now so paeds
// can filter here later (e.g. generateScenario with a cohort/age filter).
let _scenCohort = 'adult';
function startScenario(presId, cohort) {
  if (cohort) _scenCohort = cohort;
  const wrap = document.getElementById('scenarioContent');
  // Brief "generating" beat — hints that each station is freshly built, and stops
  // the card from just popping in. ~900ms, then render.
  if (wrap) {
    wrap.innerHTML = `
      <div class="scen-generating">
        <div class="scen-gen-pulse"><div></div><div></div><div></div></div>
        <div class="scen-gen-text" id="scenGenText">Building a fresh station…</div>
      </div>`;
    const msgs = ['Building a fresh station…', 'Setting the scene…', 'Generating vitals…', 'Taking the history…'];
    let mi = 0;
    const textEl = document.getElementById('scenGenText');
    const cyc = setInterval(() => { mi = (mi + 1) % msgs.length; if (textEl) textEl.textContent = msgs[mi]; }, 280);
    setTimeout(() => {
      clearInterval(cyc);
      const sc = generateScenario(presId);
      renderScenarioCard(sc);
      armScenTimer();            // ready/paused at full time, waits for examiner to tap Start
      wireScenTimerControls();
    }, 900);
  } else {
    const sc = generateScenario(presId);
    renderScenarioCard(sc);
    armScenTimer();
    wireScenTimerControls();
  }
}
