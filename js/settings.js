// ─── SETTINGS.JS v0.9.13 ───────────────────────────────────────────────────────

function openSettings() {
  document.getElementById('settingsPanel').classList.add('open');
  // Always open scrolled to the top, not wherever it was last left.
  const sheet = document.querySelector('#settingsPanel .settings-sheet');
  if (sheet) sheet.scrollTop = 0;
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const toggle = document.getElementById('darkToggle');
  if (toggle) toggle.classList.toggle('on', isDark);
  syncAccessibilityControls();
  haptic();
}

// Reflect the current accessibility prefs in the settings UI (toggle + segmented control).
function syncAccessibilityControls() {
  const rm = document.getElementById('reduceMotionToggle');
  if (rm) rm.classList.toggle('on', reduceMotionOn());
  const seg = document.getElementById('textSizeSeg');
  if (seg) {
    const cur = (typeof G !== 'undefined' && G.textSize) ? G.textSize : 'normal';
    seg.querySelectorAll('.settings-seg-btn').forEach(b =>
      b.classList.toggle('on', b.getAttribute('data-size') === cur));
  }
}

function settingsToggleReduceMotion() {
  setReduceMotion(!reduceMotionOn());
  syncAccessibilityControls();
}

function settingsSetTextSize(size) {
  setTextSize(size);
  syncAccessibilityControls();
}

function closeSettings() {
  document.getElementById('settingsPanel').classList.remove('open');
  haptic();
}

// Dark mode toggle from settings - no override needed, just call directly
function settingsToggleDark() {
  toggleDark();
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const toggle = document.getElementById('darkToggle');
  if (toggle) toggle.classList.toggle('on', isDark);
}

// Close when tapping backdrop
document.getElementById('settingsPanel').addEventListener('click', function(e) {
  if (e.target === this) closeSettings();
});

// ── LEGAL DOCUMENTS ───────────────────────────────────────────────────────────
const LEGAL = {
  terms: {
    title: 'Terms of Service',
    body: `
      <h2>1. Acceptance of Terms</h2>
      <p>By accessing or using Aireva Medic ("the app"), you agree to be bound by these Terms of Service. If you do not agree, please do not use the app. Your continued use of the app constitutes acceptance of these terms.</p>
      <h2>2. Description of Service</h2>
      <p>Aireva Medic is a free educational application designed to support the study and revision of prehospital pharmacology for PHECC-registered practitioners and students. The app provides drug reference information, quiz modes, medical terminology, hospital contact details and a paediatric drug calculator.</p>
      <h2>3. Medical Disclaimer</h2>
      <p>Aireva Medic is a <strong>learning tool only</strong>. It is not a clinical decision support tool and must not be used to guide patient care decisions.</p>
      <p>Drug information contained in this app is based on the PHECC 2026 Clinical Practice Guidelines and has not been independently verified by PHECC or any regulatory body. Always refer to current official PHECC guidelines and your service's approved formulary when treating patients.</p>
      <p>The developer accepts no responsibility for any clinical decisions made on the basis of information contained in this app.</p>
      <h2>4. Limitation of Liability</h2>
      <p>The app is provided "as is" without warranty of any kind, express or implied. The developer does not warrant that the information contained in the app is accurate, complete or current. To the maximum extent permitted by law, the developer shall not be liable for any direct, indirect, incidental or consequential damages arising from your use of or reliance on the app.</p>
      <h2>5. Third Party Content and Source Acknowledgement</h2>
      <p>The clinical and pharmacology content in this app is derived from the PHECC (Pre-Hospital Emergency Care Council) Clinical Practice Guidelines, which are the copyright of PHECC. This material is reproduced for educational purposes only, with acknowledgement of PHECC as the source, in accordance with PHECC's reproduction terms. Aireva Medic is provided free of charge and is not used for commercial purposes.</p>
      <p>Aireva Medic is an independent educational tool and is not affiliated with, endorsed by, or approved by PHECC or any other regulatory body. PHECC is acknowledged as the source of the underlying clinical guideline material; it is not the publisher of this app and bears no responsibility for it.</p>
      <h2>6. Age Requirement</h2>
      <p>This app is intended for users aged 16 and over. By using the app you confirm that you meet this age requirement.</p>
      <h2>7. Intellectual Property</h2>
      <p>The app design, code, user interface, quiz engine, gamification system, and other original works created by the developer are the intellectual property of the developer and are protected by copyright under Irish law and the Berne Convention. © Keith O'Reilly 2026.</p>
      <p>This ownership does not extend to the underlying clinical guideline content, which is the copyright of PHECC and is used under their educational, non-commercial reproduction terms (see Section 5). The developer claims no ownership over PHECC's guideline material.</p>
      <p>You may not reproduce, distribute or create derivative works from the app's original (non-PHECC) content without explicit written permission from the developer.</p>
      <h2>8. Modifications</h2>
      <p>The developer reserves the right to modify, suspend or discontinue the app or these terms at any time without notice. Continued use of the app following any changes constitutes acceptance of the updated terms.</p>
      <h2>9. Always Free</h2>
      <p>Aireva Medic is and will always be provided free of charge. Users will never be charged to access the app or its content.</p>
      <h2>10. Governing Law</h2>
      <p>These terms are governed by the laws of Ireland. Any disputes arising from your use of the app shall be subject to the exclusive jurisdiction of the Irish courts.</p>
      <p class="legal-meta">Last updated: June 2026 · © Keith O'Reilly 2026</p>`
  },
  privacy: {
    title: 'Privacy Policy',
    body: `
      <h2>Overview</h2>
      <p>Aireva Medic is committed to protecting your privacy. This policy explains what data is stored, how it is stored, and your rights regarding that data.</p>
      <h2>Data Storage</h2>
      <p>All app data is stored <strong>locally on your device</strong>. Your study progress and personal notes are never transmitted to any server, third party, or external service.</p>
      <h2>What is Stored</h2>
      <p>The following data is stored locally on your device only:</p>
      <p>• Quiz progress, XP and streak counts<br>• Drug mastery levels and question history<br>• Personal notes added to drug pages<br>• App preferences (dark mode, etc.)<br>• Daily activity log for the progress chart</p>
      <h2>Cookies and Tracking</h2>
      <p>This app does not use cookies, analytics, tracking pixels, or any technology that monitors your behaviour or transmits data externally.</p>
      <h2>Third Party Services</h2>
      <p>The app loads the Inter font from Google Fonts. This is the only external resource loaded and is subject to Google's privacy policy. No personal data is shared with Google as part of this request.</p>
      <h2>Deleting Your Data</h2>
      <p>You can delete all locally stored data at any time by tapping <strong>Delete All Progress</strong> in Settings.</p>
      <h2>Contact and Email</h2>
      <p>If you contact the developer at support@airevalearning.com, any personal information you provide (such as your name and email address) will be used solely to respond to your query. This information is processed lawfully under the General Data Protection Regulation (GDPR) on the basis of legitimate interest, is never shared with third parties, and is retained only as long as needed to address your enquiry. You have the right to request access to, correction of, or deletion of any personal data you have sent. To make such a request, contact support@airevalearning.com.</p>
      <p class="legal-meta">Last updated: June 2026 · © Keith O'Reilly 2026</p>`
  },
  disclaimer: {
    title: 'Medical Disclaimer',
    body: `
      <h2>Important Notice</h2>
      <p><strong>Aireva Medic is a learning tool only.</strong></p>
      <p>This app is designed to support study and revision of prehospital pharmacology for PHECC-registered practitioners and students. It is not a clinical reference tool and must not be used to guide patient care decisions.</p>
      <p>Drug information presented here is based on the PHECC 2026 Clinical Practice Guidelines and has not been independently verified by PHECC or any regulatory body.</p>
      <p><strong>Always refer to current official PHECC guidelines and your service's approved formulary when treating patients.</strong></p>
      <p>The developer accepts no responsibility for clinical decisions made on the basis of information contained in this app.</p>
      <p>Aireva Medic is an independent educational tool and is not affiliated with, endorsed by, or approved by PHECC.</p>
      <p class="legal-meta">© Keith O'Reilly 2026</p>`
  },
  patches: {
    title: 'Patch Notes',
    body: `
      <h2>v0.9.12</h2>
      <p>Small fixes to the paediatric Symptomatic Bradycardia scenario: the pathway now includes applying ECG and SpO2 monitoring, and the wording around chest compressions has been clarified.</p>
      <h2>v0.9.11</h2>
      <p>New Accessibility settings. A Reduce Motion option calms the app for anyone who prefers less movement: it switches off the confetti, the floating snowflake, the badge pop-ups and the other animations, and it follows your device setting automatically the first time. A Text Size option lets you choose Normal, Large or Extra Large, scaling the whole app up for easier reading. Both live in a new Accessibility section in Settings and are remembered between sessions. Scenario pathways are also clearer: Advanced Paramedic steps now carry the same amber AP marker in the step-by-step pathway as they do in the drug list, so it is obvious at a glance which actions sit above Paramedic scope.</p>
      <h2>v0.9.10</h2>
      <p>Scenario doses are easier to read. Where a drug has different doses by age, each age band now sits in its own bubble inside the Drugs and Doses panel, so you can find the right band at a glance instead of reading through a run-on line. A paediatric paracetamol dosing display has been corrected, and a round of dose wording was tidied so age ranges render cleanly throughout. Dark mode is easier on the eyes too: the cobalt and green used for small text and numbers have been lightened in dark mode so they meet accessibility contrast standards, while buttons and badges keep their full colour. Light mode is unchanged.</p>
      <h2>v0.9.9</h2>
      <p>Paediatrics are here. The Paediatric Scenario button is now live, and choosing it generates stations for children from birth to fifteen, with the patient, history and vitals all scaled to age. Sixteen paediatric presentations are covered: Asthma, Stridor and Croup, Anaphylaxis, Burns, External Haemorrhage, Limb Injury, Shock from Blood Loss, Cardiac Arrest, Symptomatic Bradycardia, Seizure and Convulsion, Sickle Cell Crisis, Hypoglycaemia, Adrenal Insufficiency, Pyrexia, Sepsis, and an Abnormal Work of Breathing triage station that teaches the assessment and the branch decision. Dosing is shown in the proper paediatric weight-based and age-banded form throughout, with Advanced Paramedic steps dimmed as in the adult stations. The youngest patients are handled with care: under-threes are described the way you would actually assess a pre-verbal child, and a parent or guardian is almost always on scene to give the history, just as in real life. The croup station carries the epiglottitis warning, and the cardiac arrest station folds in post-resuscitation care. Adult and paediatric now sit cleanly side by side, with adults from sixteen up, so every age is covered with nothing falling between the two. Seed codes work in paediatric scenarios too, so you can share the exact same station with a classmate. As always, every clinical value has been checked against PHECC.</p>
      <h2>v0.9.8</h2>
      <p>Nine new adult presentations, taking the scenario library to twenty-five. New trauma stations: Head Injury (graded by conscious level, with the blood-pressure targets that protect the injured brain), Crush Injury (with the pre-release fluid teaching), Harness Suspension Trauma, and Limb Injury (fractures, dislocations and soft-tissue injuries, with a focus on checking circulation, sensation and movement before and after splinting). New medical stations: Acute Pulmonary Oedema (with the full CPAP criteria you need to know), Adrenal Insufficiency, Sickle Cell Crisis, Epistaxis, and a combined Behavioural and Mental Health Emergency covering capacity, de-escalation and scene safety. Decompression Illness has been added to the Environmental scenarios for divers. Two brand-new categories, Haematological and Behavioural, now feature in the library. More scenarios now model whether the emergency was witnessed or not, which changes the history you can gather and where you are likely to find the patient, so seizures, cardiac arrests and several others feel more true to life. Plus a round of realism fixes to scene descriptions and patient ages.</p>
      <h2>v0.9.7</h2>
      <p>New optional scenario timer: switch it on from the scenario screen and set anything from 5 to 15 minutes to practise under exam-style pressure. It counts down at the top of the station, turns amber in the final minute as a gentle nudge, and flags time is up without cutting you off, so you can still finish at your own pace. The scenario intro screen has been tidied up, with a clearer "skip this intro next time" option. Readability improvements: the Advanced Paramedic amber and a few other accent colours have been deepened so text is easier to read, especially in bright light. Under the hood, the app now carries its own fonts so it looks right with no connection at all, and a round of security hardening was added. Smaller polish throughout.</p>
      <h2>v0.9.6</h2>
      <p>Six new presentations: Cardiac Arrest (Basic Life Support, VF/pVT and PEA, with a true arrest picture on the monitor rather than ordinary vitals), External Haemorrhage, Sepsis, Asthma, Environmental Emergencies (hypothermia, heat illness and drowning, where the patient's temperature now tells the story), and Obstetric Emergencies (imminent birth, eclampsia, post-partum haemorrhage, shoulder dystocia, cord prolapse and breech). New Prestige system: once you reach Master Clinician you can prestige to climb again and earn a permanent star, with new achievements to chase, and your mastery, badges and streak all stay exactly as they are. The scenario generator now opens with a clear choice of Adult, Paediatric or Mega OSCE, with paediatric and combined scenarios coming soon. Advanced Paramedic steps in scenarios are now shown but clearly dimmed, so it is obvious what sits above Paramedic scope. The whole scenario library is now adult-focused, with paediatrics being built separately. Many realism, scope and wording fixes throughout.</p>
      <h2>v0.9.5</h2>
      <p>New presentation: Poisoning and Overdose, covering opioid, alcohol and other ingestions with the full PHECC management pathway. Poisoning patients now have realistic, case-specific histories: what they took, when, and their last food and drink, with the assessment questions answered the way a real patient would answer them. Respiratory rates in serious scenarios are now more clinically realistic, scaling correctly with the patient's age so a distressed infant and a distressed adult read differently. The diagnosis reveal now scrolls to sit neatly below the header instead of tucking underneath it. Plus smaller realism and polish fixes throughout.</p>
      <h2>v0.9.4</h2>
      <p>Scenarios are now patient-specific: each patient has their own medications, past history and symptoms rather than a generic summary. Medications use real brand names to encourage looking them up in Common Medications. New presentations: Burns and Stroke. Foreign Body Airway Obstruction is now conscious-only, keeping practice on the choking pathway. Scenarios no longer repeat the same presentation twice in a row. Stroke now models witnessed versus unwitnessed onset and last-known-well time. Chest pain, breathing and stroke scenarios reworded so the findings no longer give away the diagnosis. Many wording and realism fixes throughout.</p>
      <h2>v0.9.3</h2>
      <p>New floating nav bar with amber Practice target. OSCE reveal redesigned into colour-coded grade, branch and step blocks. New scenario: Foreign Body Airway Obstruction. Scenario variants doubled (6 each) with age-appropriate wording for young children. Onboarding reordered. Scenarios grouped by PHECC section. Wording and clarity fixes throughout.</p>
      <h2>v0.9.2</h2>
      <p>Settings panel with dark mode, legal documents and version info. Complete quiz engine rewrite. Terms of Service and Privacy Policy. Streak XP multiplier. Hospital search scrolls to result. Drug of the Day full shuffle. Theme audit: all token references corrected.</p>
      <h2>v0.9.1</h2>
      <p>Floating pill tab bar. Chart y-axis. Standard and Adaptive as separate quiz modes. Real date on daily challenge. Rookie level card fixed. Privacy policy added.</p>
      <h2>v0.9.0</h2>
      <p>Universal design system: Inter font, cobalt blue primary, deep green success, spacing tokens, type scale.</p>
      <h2>v0.8.0</h2>
      <p>Complete quiz overhaul: daily challenge, 6 quiz modes, spaced repetition, timed mode, category quiz, streak burst, wrong answer breakdown.</p>
      <h2>v0.7.0</h2>
      <p>Swipe to close drug detail. Accordion fix. Card colours. Navy progress bar. XP rebalanced. © Keith O'Reilly 2026 added.</p>
      <h2>v0.6.0</h2>
      <p>Badges, streak freeze tokens, activity bar chart, study time, warmer light mode.</p>
      <h2>v0.5.0</h2>
      <p>Home dashboard, disclaimer modal, adaptive quiz, medical terms categories, Aireva Medic rebrand.</p>
      <h2>v0.4.0</h2>
      <p>Codebase refactor into separate files.</p>
      <h2>v0.3.0</h2>
      <p>Learn tab, PCR codes, PCI line, medical terms, paed calculator, global search.</p>
      <h2>v0.2.0</h2>
      <p>Dark mode, mastery system, notes, haptic feedback, XP levels.</p>
      <h2>v0.1.0</h2>
      <p>Initial release: 46 PHECC 2026 drugs, reference, quiz, GitHub Pages.</p>
      <p class="legal-meta">© Keith O'Reilly 2026</p>`
  }
};

// Turn the flat <h2>version</h2><p>notes</p> patch list into an accordion:
// each version becomes a tappable header with its notes collapsed beneath it.
// The first (latest) version is expanded by default. Source HTML stays simple
// (just add an <h2>/<p> pair for a new release); the accordion is applied here.
function buildPatchAccordion(html) {
  // split into [version, notes] pairs by the <h2> markers
  const parts = html.split(/<h2>/).map(s => s.trim()).filter(Boolean);
  return parts.map((part, i) => {
    const m = part.match(/^(.*?)<\/h2>\s*([\s\S]*)$/);
    if (!m) return '';
    const ver = m[1].trim();
    const notes = m[2].trim();
    const open = i === 0 ? ' open' : '';
    return `<div class="patch-item${open}">
      <button class="patch-head" onclick="togglePatch(this)" aria-expanded="${i === 0}">
        <span class="patch-ver">${ver}</span>
        <span class="patch-chevron">⌄</span>
      </button>
      <div class="patch-notes">${notes}</div>
    </div>`;
  }).join('');
}

function togglePatch(btn) {
  const item = btn.closest('.patch-item');
  const wasOpen = item.classList.contains('open');
  // True accordion: close every item first, then open the tapped one (if it
  // wasn't already open). Tapping an open item just closes it.
  document.querySelectorAll('.patch-item.open').forEach(el => {
    el.classList.remove('open');
    const h = el.querySelector('.patch-head');
    if (h) h.setAttribute('aria-expanded', 'false');
  });
  if (!wasOpen) {
    item.classList.add('open');
    btn.setAttribute('aria-expanded', 'true');
    // Smooth-scroll the opened item to the top of the scroll area, matching the
    // scenario reveal behaviour. Scroll the modal body, not the whole window.
    // Use rect-difference (robust to the container's padding / offset parent).
    requestAnimationFrame(() => {
      const scroller = item.closest('#legalBody');
      if (scroller) {
        const delta = item.getBoundingClientRect().top - scroller.getBoundingClientRect().top;
        scroller.scrollTo({ top: scroller.scrollTop + delta, behavior: 'smooth' });
      } else {
        item.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }
  haptic();
}

function openLegal(key) {
  const doc = LEGAL[key];
  if (!doc) return;
  document.getElementById('legalTitle').textContent = doc.title;
  const body = document.getElementById('legalBody');
  // Patch notes render as an accordion; all other docs render as-is.
  body.innerHTML = key === 'patches' ? buildPatchAccordion(doc.body) : doc.body;
  body.scrollTop = 0;  // always start at top
  const modal = document.getElementById('legalModal');
  modal.classList.add('open');
  notifyModalState(true);
  haptic();
}

function closeLegal() {
  const modal = document.getElementById('legalModal');
  modal.classList.remove('open');
  notifyModalState(false);
  // Brief pointer-events pause prevents ghost taps on close
  modal.style.pointerEvents = 'none';
  setTimeout(() => { modal.style.pointerEvents = ''; }, 300);
  haptic();
}
