// ─── APP.JS — Aireva Medic ───────────────────────────────────────────────────────
// Core app shell: progression model (levels, XP, mastery), badges, the persistent
// save object G, the streak/freeze system, navigation, onboarding, header/stats
// rendering, and global search. Other files lean on what's defined here:
//   • G            — the single persisted save object (localStorage key below).
//   • getLevel/getMastery/getDM — derive progression state from raw counts.
//   • saveG/loadG  — persist and restore G (loadG also migrates old saves).
//   • checkBadges  — re-evaluated after anything that could unlock a badge.
// Quiz logic lives in quiz.js; the drug-detail overlay in detail.js.

// Level thresholds. getLevel() walks DOWN from the top so the highest level whose
// xp floor is met wins. "next" is the XP needed to reach the following level
// (Infinity for the final level). gradient/color drive the header + level-up card.
const LEVELS=[
  {name:"Rookie",          xp:0,     next:250,      color:"#475569",gradient:"linear-gradient(135deg,#0F172A,#334155)"},
  {name:"Student",         xp:250,   next:750,      color:"#0891B2",gradient:"linear-gradient(135deg,#0C4A6E,#0891B2)"},
  {name:"Responder",       xp:750,   next:1750,     color:"#2563EB",gradient:"linear-gradient(135deg,#1E3A8A,#2563EB)"},
  {name:"Clinician",       xp:1750,  next:3500,     color:"#7C3AED",gradient:"linear-gradient(135deg,#4C1D95,#7C3AED)"},
  {name:"Expert",          xp:3500,  next:6000,     color:"#D97706",gradient:"linear-gradient(135deg,#78350F,#D97706)"},
  {name:"Senior Clinician",xp:6000,  next:9500,     color:"#EA580C",gradient:"linear-gradient(135deg,#7C2D12,#EA580C)"},
  {name:"Master Clinician",xp:9500,  next:Infinity, color:"#DC2626",gradient:"linear-gradient(135deg,#7F1D1D,#DC2626)"}
];
function getLevel(xp){for(let i=LEVELS.length-1;i>=0;i--)if(xp>=LEVELS[i].xp)return LEVELS[i];return LEVELS[0];}

// Mastery tier from a drug's cumulative correct-answer count. These thresholds
// also feed the spaced-repetition intervals in quiz.js, so changing them shifts
// both the badges/labels AND how often a drug resurfaces for review.
function getMastery(correct){
  if(correct>=10)return'mastered';
  if(correct>=6)return'proficient';
  if(correct>=3)return'learning';
  if(correct>=1)return'novice';
  return'unseen';
}
const MASTERY_LABELS={unseen:'· Unseen',novice:'◎ Novice',learning:'~ Learning',proficient:'✦ Proficient',mastered:'★ Mastered'};
// Mastery colours live in style.css as --mastery-* tokens and .mt-*/.det-mbadge-* classes

function masteryTag(id){
  const correct=G.drugCorrect[id]||0;
  const m=getMastery(correct);
  // Display caps at 10/10 — internal count still drives spaced repetition
  const label=m==='unseen'?`Questions (0/10)`:MASTERY_LABELS[m]+` (${Math.min(correct,10)}/10)`;
  return`<div class="mtag mt-${m}">${label}</div>`;
}

// BADGES
const BADGES=[
  {id:'first_quiz',     icon:'🎯', name:'First Steps',      desc:'Complete your first quiz',            check:g=>g.quizzes>=1},
  {id:'streak_7',       icon:'📅', name:'Consistent',       desc:'Reach a 7 day streak',                check:g=>g.streak>=7},
  {id:'streak_30',      icon:'🔥', name:'Unstoppable',      desc:'Reach a 30 day streak',               check:g=>g.streak>=30},
  {id:'mastered_10',    icon:'⭐', name:'Getting There',    desc:'Master 10 drugs',                     check:g=>Object.values(g.drugCorrect).filter(v=>v>=10).length>=10},
  {id:'mastered_25',    icon:'💜', name:'Well Versed',      desc:'Master 25 drugs',                     check:g=>Object.values(g.drugCorrect).filter(v=>v>=10).length>=25},
  {id:'mastered_all',   icon:'👑', name:'Formulary Master', desc:'Master all 46 drugs',                 check:g=>Object.values(g.drugCorrect).filter(v=>v>=10).length>=46},
  {id:'emt_mastered',   icon:'🏆', name:'EMT Complete',     desc:'Master all EMT drugs',                check:g=>MEDS.filter(m=>m.scope.includes('EMT')).every(m=>(g.drugCorrect[m.id]||0)>=10)},
  {id:'par_mastered',   icon:'🥈', name:'Paramedic Complete',desc:'Master all Paramedic drugs',         check:g=>MEDS.filter(m=>m.scope.includes('P')).every(m=>(g.drugCorrect[m.id]||0)>=10)},
  {id:'ap_mastered',    icon:'🥇', name:'AP Complete',      desc:'Master all AP drugs',                 check:g=>MEDS.filter(m=>m.scope.includes('AP')).every(m=>(g.drugCorrect[m.id]||0)>=10)},
  {id:'xp_500',         icon:'⚡', name:'Rising Star',      desc:'Earn 500 XP',                         check:g=>g.xp>=500},
  {id:'xp_1000',        icon:'🚀', name:'High Flyer',       desc:'Earn 1000 XP',                        check:g=>g.xp>=1000},
  {id:'questions_100',  icon:'🧠', name:'Quiz Brain',       desc:'Answer 100 questions',                check:g=>g.totalQ>=100},
  {id:'all_opened',     icon:'💊', name:'Curious',          desc:'Open every drug page',                check:g=>MEDS.every(m=>g.seenDrugs&&g.seenDrugs.includes(m.id))},
  {id:'freeze_used',    icon:'❄️', name:'Saved',            desc:'Use a streak freeze',                 check:g=>g.freezesUsed>=1},
  {id:'half_mastered',  icon:'🎖️', name:'Half Way',         desc:'Master 23 drugs',                     check:g=>Object.values(g.drugCorrect).filter(v=>v>=10).length>=23},
  {id:'flawless',       icon:'💯', name:'Flawless',         desc:'Score 100% on a quiz',                check:g=>(g.perfectQuizzes||0)>=1},
  {id:'daily_7',        icon:'📆', name:'Daily Devotee',    desc:'Complete 7 daily challenges',         check:g=>(g.dailyDoneCount||0)>=7},
  {id:'daily_30',       icon:'🗓️', name:'Daily Legend',     desc:'Complete 30 daily challenges',        check:g=>(g.dailyDoneCount||0)>=30},
  {id:'perfect_week',   icon:'🌟', name:'Perfect Week',     desc:'Reach a 7 day streak',                check:g=>g.streak>=7},
  {id:'note_taker',     icon:'📝', name:'Note Taker',       desc:'Add notes to 10 drugs',               check:g=>Object.values(g.notes||{}).filter(n=>n&&n.trim().length>0).length>=10},
  {id:'night_shift',    icon:'🌙', name:'Night Shift',      desc:'Do a quiz between midnight and 6am',  check:g=>g.nightShiftDone===true}
];

// STATE
let G={
  xp:0,streak:0,lastDate:null,quizzes:0,totalQ:0,totalCorrect:0,
  drugCorrect:{},notes:{},disclaimerDone:false,onboardingDone:false,
  seenDrugs:[],
  earnedBadges:[],
  freezeTokens:1,freezesUsed:0,
  dailyLog:{},
  trackingStart:null,
  nextReview:{},
  recentWrong:[],
  lastDailyDate:null,
  fcXpDate:null,fcXpToday:0,
  seenToday:{},
  dailyDoneCount:0,
  perfectQuizzes:0,
  nightShiftDone:false
};

// Load the saved game state, then BACKFILL any fields missing from older saves.
// This migration matters: a user who installed an earlier version has a G without
// newer keys (recentWrong, fcXpToday, nightShiftDone, etc). Spreading the saved
// JSON over the default G and then filling gaps means new features never crash on
// an old save. The localStorage key stays 'tusMedicG101' deliberately — renaming
// it would orphan every existing user's progress.
function loadG(){
  try{const s=localStorage.getItem('tusMedicG101');if(s)G={...G,...JSON.parse(s)};}catch(e){}
  MEDS.forEach(m=>{
    if(!G.drugCorrect[m.id])G.drugCorrect[m.id]=0;
    if(G.notes[m.id]===undefined)G.notes[m.id]='';
  });
  if(!G.seenDrugs)G.seenDrugs=[];
  if(!G.earnedBadges)G.earnedBadges=[];
  if(!G.dailyLog)G.dailyLog={};
  if(!G.trackingStart)G.trackingStart=todayKey();
  if(!G.nextReview)G.nextReview={};
  if(!G.recentWrong)G.recentWrong=[];
  if(G.lastDailyDate===undefined)G.lastDailyDate=null;
  if(G.fcXpDate===undefined)G.fcXpDate=null;
  if(G.fcXpToday===undefined)G.fcXpToday=0;
  if(!G.seenToday)G.seenToday={};
  if(G.dailyDoneCount===undefined)G.dailyDoneCount=0;
  if(G.perfectQuizzes===undefined)G.perfectQuizzes=0;
  if(G.nightShiftDone===undefined)G.nightShiftDone=false;
}
function saveG(){
  try{
    localStorage.setItem('tusMedicG101',JSON.stringify(G));
  }catch(e){
    // Storage full or unavailable — notify user once per session
    if(!saveG._warned){
      saveG._warned=true;
      showToast('⚠️ Could not save progress, storage may be full');
    }
  }
}
function getDM(id){return getMastery(G.drugCorrect[id]||0);}
function todayKey(){return new Date().toISOString().slice(0,10);}

// Daily log
function logToday(questions,correct,quizzes,xp){
  const k=todayKey();
  if(!G.dailyLog[k])G.dailyLog[k]={questions:0,correct:0,quizzes:0,xp:0};
  G.dailyLog[k].questions+=questions;
  G.dailyLog[k].correct+=correct;
  G.dailyLog[k].quizzes+=quizzes;
  G.dailyLog[k].xp+=xp;
}

// Level-up celebration
function showLevelUp(level){
  const overlay=document.getElementById('levelUpOverlay');
  if(!overlay)return;
  document.getElementById('luLevelName').textContent=level.name;
  const card=document.getElementById('luCard');
  if(card)card.style.background=level.gradient;
  // Build confetti
  const confettiWrap=document.getElementById('luConfetti');
  if(confettiWrap){
    const colors=['#FCD34D','#34D399','#60A5FA','#F87171','#C4B5FD','#FB923C'];
    let html='';
    for(let i=0;i<40;i++){
      const left=Math.random()*100;
      const delay=Math.random()*0.6;
      const dur=2+Math.random()*1.5;
      const col=colors[Math.floor(Math.random()*colors.length)];
      const size=6+Math.random()*6;
      const rot=Math.random()*360;
      html+=`<span class="lu-confetti-piece" style="left:${left}%;width:${size}px;height:${size}px;background:${col};animation-delay:${delay}s;animation-duration:${dur}s;transform:rotate(${rot}deg)"></span>`;
    }
    confettiWrap.innerHTML=html;
  }
  overlay.classList.add('show');
  haptic('success');
}
function closeLevelUp(){
  const overlay=document.getElementById('levelUpOverlay');
  if(overlay)overlay.classList.remove('show');
  notifyModalState(false);
}

// ── STREAK SYSTEM ──────────────────────────────────────────────────────────────
// Streaks count consecutive CALENDAR days with at least one completed quiz.
// All streak dates use todayKey() (ISO yyyy-mm-dd) for consistency.
//
// Model (Duolingo-style hybrid):
//  • Same day as last quiz       → no change
//  • Exactly 1 day gap           → streak continues (increments on next quiz)
//  • 2+ day gap (missed day(s))  → auto-consume freeze tokens, one per missed day.
//      - Enough tokens to cover  → streak survives, announce via modal
//      - Not enough tokens       → streak resets to 0
//
// Day difference between two ISO date strings.
function daysBetween(fromKey, toKey){
  const a=new Date(fromKey+'T00:00:00');
  const b=new Date(toKey+'T00:00:00');
  return Math.round((b-a)/86400000);
}

// Called once on app load. Detects missed days and applies freeze protection.
function checkStreakOnLoad(){
  if(!G.lastDate||G.streak<=0)return;       // no active streak to protect
  const today=todayKey();
  const gap=daysBetween(G.lastDate, today);
  if(gap<=1)return;                          // same day or yesterday, streak healthy
  // gap>=2 means at least one full calendar day was missed
  const missedDays=gap-1;
  const tokens=G.freezeTokens||0;
  if(tokens>=missedDays){
    // Cover every missed day with a freeze each
    G.freezeTokens-=missedDays;
    G.freezesUsed+=missedDays;
    // Advance lastDate to yesterday so the streak is "current" again and the
    // user can continue it by completing a quiz today.
    const y=new Date(today+'T00:00:00');y.setDate(y.getDate()-1);
    G.lastDate=y.toISOString().slice(0,10);
    saveG();
    // Announce protection (after first paint so the modal lands cleanly)
    setTimeout(()=>showFreezeModal(G.streak, missedDays, G.freezeTokens),400);
  }else{
    // Not enough tokens — streak is lost
    G.streak=0;
    G.lastDate=null;
    saveG();
  }
}

// Streak-freeze announcement modal (no confetti — calm announcement)
function showFreezeModal(streakVal, daysUsed, tokensLeft){
  const overlay=document.getElementById('freezeOverlay');
  if(!overlay)return;
  document.getElementById('fzStreak').textContent=streakVal;
  const sub=document.getElementById('fzSub');
  if(sub){
    const dayWord=daysUsed===1?'day':'days';
    const tokWord=tokensLeft===1?'token':'tokens';
    sub.textContent=`A streak freeze protected your ${streakVal}-day streak. You have ${tokensLeft} ${tokWord} left.`;
    // (daysUsed available if we later want to show multi-day detail)
  }
  overlay.classList.add('show');
  notifyModalState(true);
  haptic('success');
}
function closeFreezeModal(){
  const overlay=document.getElementById('freezeOverlay');
  if(overlay)overlay.classList.remove('show');
  notifyModalState(false);
}

// Manual freeze button (home screen) — now explains the freeze is automatic.
function useFreeze(){
  if(G.lastDate===todayKey()){
    showToast('Your streak is safe, you\u2019ve already studied today');
    return;
  }
  const tokens=G.freezeTokens||0;
  if(tokens<=0){
    showToast('No freeze tokens, master more drugs to earn them');
    return;
  }
  showConfirm(
    '\u2744\uFE0F Streak Freeze',
    'You have '+tokens+' freeze '+(tokens===1?'token':'tokens')+'. Freezes are used automatically to protect your streak if you miss a day, you don\u2019t need to do anything now.',
    ()=>{}
  );
}

// Badge checking
function checkBadges(){
  let newBadges=[];
  BADGES.forEach(b=>{
    if(!G.earnedBadges.includes(b.id)&&b.check(G)){
      G.earnedBadges.push(b.id);
      newBadges.push(b);
    }
  });
  // Earn freeze tokens at mastery milestones: 1 base + 1 per 10 drugs mastered,
  // capped at 5. We compare against (held + already-used) so a token is granted
  // once per milestone reached, not re-granted after one is spent.
  const masteredCount=Object.values(G.drugCorrect).filter(v=>v>=10).length;
  const expectedTokens=1+Math.floor(masteredCount/10);
  if(expectedTokens>G.freezeTokens+G.freezesUsed){
    G.freezeTokens=Math.min(G.freezeTokens+1,5);
    showToast('❄️ Streak freeze token earned!');
  }
  if(newBadges.length){
    queueAchievements(newBadges);
  }
}

// ── ACHIEVEMENT UNLOCK BANNER ──────────────────────────────────────────────────
// Drops down from the top. Queues multiple unlocks so each is shown in turn.
let _achQueue=[];
let _achShowing=false;
function queueAchievements(badges){
  _achQueue.push(...badges);
  if(!_achShowing)showNextAchievement();
}
function showNextAchievement(){
  if(!_achQueue.length){_achShowing=false;return;}
  _achShowing=true;
  const b=_achQueue.shift();
  const banner=document.getElementById('achBanner');
  if(!banner){_achShowing=false;return;}
  document.getElementById('achIcon').textContent=b.icon;
  document.getElementById('achName').textContent=b.name;
  const descEl=document.getElementById('achDesc');
  if(descEl)descEl.textContent=b.desc||'';
  banner.classList.add('show');
  haptic('success');
  // Visible long enough to notice, then slide away and show the next
  setTimeout(()=>{
    banner.classList.remove('show');
    // Wait for slide-out transition before showing the next one
    setTimeout(showNextAchievement,450);
  },2600);
}

// Custom confirm modal — replaces browser confirm() which is blocked in WKWebView
function showConfirm(title, msg, onOK, isDanger=false){
  const modal=document.getElementById('confirmModal');
  document.getElementById('confirmTitle').textContent=title;
  document.getElementById('confirmMsg').textContent=msg;
  const okBtn=document.getElementById('confirmOK');
  okBtn.className='confirm-ok'+(isDanger?' danger':'');
  modal.style.display='flex';
  notifyModalState(true);
  // Wire buttons — replace each time to avoid stacking listeners
  const cancelBtn=document.getElementById('confirmCancel');
  const close=()=>{ modal.style.display='none'; notifyModalState(false); };
  okBtn.onclick=()=>{ close(); onOK(); };
  cancelBtn.onclick=close;
  modal.onclick=(e)=>{ if(e.target===modal)close(); };
}

// Feedback / toasts
function showToast(msg){
  const t=document.getElementById('toast');
  t.textContent=msg;t.classList.add('show');
  clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('show'),2600);
}
function haptic(type='light'){
  if(!navigator.vibrate)return;
  if(type==='success')navigator.vibrate([10,20,10]);
  else if(type==='error')navigator.vibrate([30]);
  else navigator.vibrate([10]);
}

function updateHdr(){
  document.getElementById('xpVal').textContent=G.xp;
  document.getElementById('streakVal').textContent=G.streak;
  const lv=getLevel(G.xp);
  const ll=document.getElementById('levelLabel');
  ll.textContent=lv.name;
  // Always readable on dark header - use lighter tint of level colour
  // For dark colours like Rookie slate, use a fixed light colour instead
  const darkColours=['#475569','#334155'];
  ll.style.color=darkColours.includes(lv.color)?'rgba(255,255,255,.55)':lv.color;
}

// Live XP preview during a quiz — shows running total in the header without
// committing it to G.xp (which only happens once at the results screen).
function updateHdrPreview(previewXp){
  const el=document.getElementById('xpVal');
  if(el)el.textContent=previewXp;
  const lv=getLevel(previewXp);
  const ll=document.getElementById('levelLabel');
  if(ll){
    ll.textContent=lv.name;
    const darkColours=['#475569','#334155'];
    ll.style.color=darkColours.includes(lv.color)?'rgba(255,255,255,.55)':lv.color;
  }
}

function scrollTop(){window.scrollTo({top:0,behavior:'instant'});}

function toggleDark(){
  const h=document.documentElement,dark=h.getAttribute('data-theme')==='dark';
  h.setAttribute('data-theme',dark?'light':'dark');
  try{localStorage.setItem('tusMedicTheme',dark?'light':'dark');}catch(e){}
  haptic();
}
function loadTheme(){
  try{const t=localStorage.getItem('tusMedicTheme');if(t==='dark'){document.documentElement.setAttribute('data-theme','dark');}}catch(e){}
}

function checkOnline(){document.getElementById('offlineBar').classList.toggle('show',!navigator.onLine);}

// Modal state bridge — notifies the iOS native layer when a modal opens or closes.
// Swift uses this to disable WKWebView's scroll gesture recogniser while a modal is active,
// which prevents the scroll-then-tap freeze in WKWebView.
function notifyModalState(isOpen) {
  if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.modalState) {
    window.webkit.messageHandlers.modalState.postMessage({ open: isOpen });
  }
}

function dismissDisclaimer(){
  document.getElementById('disclaimerModal').style.display='none';
  notifyModalState(false);
  G.disclaimerDone=true;saveG();
  // Show onboarding next if not yet seen
  if(!G.onboardingDone)startOnboarding();
}

// ── ONBOARDING ────────────────────────────────────────────────────────────────
let onbStep=0;
const ONB_TOTAL=4;

function startOnboarding(){
  onbStep=0;
  updateOnboarding();
  document.getElementById('onbOverlay').classList.add('show');
  notifyModalState(true);
}

function updateOnboarding(){
  // Panels
  document.querySelectorAll('.onb-panel').forEach((p,i)=>{
    p.classList.toggle('active',i===onbStep);
  });
  // Dots
  document.querySelectorAll('.onb-dot').forEach((d,i)=>{
    d.classList.toggle('active',i===onbStep);
  });
  // Back button visibility
  document.getElementById('onbBack').style.visibility=onbStep===0?'hidden':'visible';
  // On final panel: show two-button choice, hide single Next button
  const isFinal = onbStep===ONB_TOTAL-1;
  document.getElementById('onbNext').style.display = isFinal ? 'none' : 'block';
  document.getElementById('onbFinalActions').style.display = isFinal ? 'block' : 'none';
  if(!isFinal) document.getElementById('onbNext').textContent='Next';
}

function onbNext(){
  haptic();
  if(onbStep<ONB_TOTAL-1){
    onbStep++;
    updateOnboarding();
  }else{
    finishOnboarding();
  }
}

function onbPrev(){
  haptic();
  if(onbStep>0){
    onbStep--;
    updateOnboarding();
  }
}

function finishOnboarding(){
  document.getElementById('onbOverlay').classList.remove('show');
  notifyModalState(false);
  G.onboardingDone=true;saveG();
  haptic();
  // Launch intro quiz
  showPage('quiz',document.getElementById('btn-quiz'));
  scrollTop();
  requestAnimationFrame(()=>requestAnimationFrame(()=>launchIntroQuiz()));
}

function skipToHome(){
  document.getElementById('onbOverlay').classList.remove('show');
  notifyModalState(false);
  G.onboardingDone=true;saveG();
  haptic();
  // Land on home page
  showPage('home',document.getElementById('btn-home'));
  scrollTop();
}

// Onboarding feature card tooltips
function showOnbTip(id){
  const tip=document.getElementById('tip-'+id);
  if(!tip)return;
  const isOpen=tip.classList.contains('show');
  // Close all tips first
  document.querySelectorAll('.onb-tip').forEach(t=>t.classList.remove('show'));
  // Toggle this one
  if(!isOpen)tip.classList.add('show');
  haptic();
}

// Allow re-viewing onboarding from settings
function replayOnboarding(){
  closeSettings();
  setTimeout(startOnboarding,250);
}
function checkDisclaimer(){
  if(!G.disclaimerDone){
    // New user: show disclaimer first; onboarding follows on dismiss
    document.getElementById('disclaimerModal').style.display='flex';
    notifyModalState(true);
  }else if(!G.onboardingDone){
    // Existing user who hasn't seen onboarding (e.g. after this update)
    startOnboarding();
  }
}

// NAV
// Clear every search field + results across all tabs — called on tab switch so
// no stale search text or results persist when navigating away.
function clearAllSearches(){
  // Home global search
  if(typeof clearHomeSearch==='function'){
    const hi=document.getElementById('homeSearchInput');
    if(hi&&hi.value)clearHomeSearch();
  }
  // Reference drug search
  if(typeof clearSearch==='function'){
    const si=document.getElementById('searchInput');
    if(si&&si.value)clearSearch();
  }
  // Study / medical terms search
  if(typeof clearStudySearch==='function'){
    const li=document.getElementById('learnSearch');
    if(li&&li.value)clearStudySearch();
  }
  // Medication reference search
  if(typeof clearMedrefSearch==='function'){
    const mi=document.getElementById('medrefSearch');
    if(mi&&mi.value)clearMedrefSearch();
  }
}

function showPage(id,btn){
  clearAllSearches();
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nb').forEach(b=>b.classList.remove('active'));
  document.getElementById('page-'+id).classList.add('active');
  btn.classList.add('active');
  haptic();
  if(id==='home')renderHome();
  if(id==='quiz')renderQuizTab();
  if(id==='stats'){updateStats();renderDonut();renderChart();}
  if(id==='learn')renderStudy();
  // Always reset scroll to top on any page switch
  window.scrollTo({top:0,behavior:'instant'});
}
function goHome(){showPage('home',document.getElementById('btn-home'));scrollTop();}
function goProgress(){showPage('stats',document.getElementById('btn-stats'));scrollTop();}

// STATS
function updateStats(){
  const counts={unseen:0,novice:0,learning:0,proficient:0,mastered:0};
  MEDS.forEach(m=>counts[getDM(m.id)]++);
  document.getElementById('stXP').textContent=G.xp;
  document.getElementById('stStreak').textContent=G.streak;
  document.getElementById('stQuestions').textContent=G.totalQ;
  document.getElementById('stQuizzes').textContent=G.quizzes;
  document.getElementById('stAccuracy').textContent=G.totalQ>0?Math.round(G.totalCorrect/G.totalQ*100)+'%':'—';
  document.getElementById('tCorrect').textContent=G.totalCorrect;
  document.getElementById('tWrong').textContent=G.totalQ-G.totalCorrect;
  Object.keys(counts).forEach(k=>{const el=document.getElementById('dl'+k.charAt(0).toUpperCase()+k.slice(1));if(el)el.textContent=counts[k];});
  const lv=getLevel(G.xp),nxt=LEVELS[LEVELS.indexOf(lv)+1];
  document.getElementById('lcName').textContent=lv.name;
  document.getElementById('levelCard').style.background=lv.gradient;
  if(nxt){
    document.getElementById('lcBar').style.width=((G.xp-lv.xp)/(lv.next-lv.xp)*100)+'%';
    document.getElementById('lcNext').textContent=`${lv.next-G.xp} XP to ${nxt.name}`;
  }else{
    document.getElementById('lcBar').style.width='100%';
    document.getElementById('lcNext').textContent='Maximum level reached! 🎉';
  }
  // Study time (approx 2 min per quiz)
  const mins=G.quizzes*2;
  const hrs=Math.floor(mins/60),rem=mins%60;
  document.getElementById('studyTime').textContent=hrs>0?`${hrs}h ${rem}m`:`${rem}m`;
  // Badges
  renderBadges();
}

function renderBadges(){
  const el=document.getElementById('badgesGrid');
  if(!el)return;
  el.innerHTML=BADGES.map((b,i)=>{
    const earned=G.earnedBadges.includes(b.id);
    return`<div class="badge-item ${earned?'earned':''}" onclick="showBadgeInfo(${i})">
      <div class="badge-icon ${earned?'earned':''}">${b.icon}</div>
      <div class="badge-name">${b.name}</div>
    </div>`;
  }).join('');
}

// Tap a badge to see its name + how to earn it (descriptions don't fit in the grid)
function showBadgeInfo(i){
  const b=BADGES[i];
  if(!b)return;
  const earned=G.earnedBadges.includes(b.id);
  showToast(`${b.icon} ${b.name}: ${b.desc}${earned?' ✓':''}`);
  haptic();
}

function renderDonut(){
  const counts={unseen:0,novice:0,learning:0,proficient:0,mastered:0};
  MEDS.forEach(m=>counts[getDM(m.id)]++);
  const total=MEDS.length,circ=2*Math.PI*35;
  const order=[{key:'mastered',id:'dMastered'},{key:'proficient',id:'dProficient'},{key:'learning',id:'dLearning'},{key:'novice',id:'dNovice'}];
  let offset=0;
  order.forEach(({key,id})=>{
    const dash=circ*(counts[key]/total);
    const el=document.getElementById(id);
    if(el){el.setAttribute('stroke-dasharray',`${dash} ${circ-dash}`);el.setAttribute('stroke-dashoffset',-(offset-circ/4));offset+=dash;}
  });
}

// CHART
let chartMetric='questions';
function setChartMetric(m,el){
  chartMetric=m;
  const classes={'questions':'on','accuracy':'on-accuracy','quizzes':'on-quizzes','xp':'on-xp'};
  document.querySelectorAll('.chart-tab').forEach(t=>{
    t.classList.remove('on','on-accuracy','on-quizzes','on-xp');
  });
  el.classList.add(classes[m]||'on');
  renderChart();haptic();
}

function renderChart(){
  const el=document.getElementById('chartArea');
  if(!el)return;
  const days=[];
  for(let i=6;i>=0;i--){
    const d=new Date();d.setDate(d.getDate()-i);
    days.push(d.toISOString().slice(0,10));
  }
  const vals=days.map(d=>{
    const log=G.dailyLog[d]||{questions:0,correct:0,quizzes:0,xp:0};
    if(chartMetric==='questions')return log.questions;
    if(chartMetric==='accuracy')return log.questions>0?Math.round(log.correct/log.questions*100):0;
    if(chartMetric==='quizzes')return log.quizzes;
    if(chartMetric==='xp')return log.xp;
    return 0;
  });
  const max=Math.max(...vals,1);
  // Round up to a clean number for y-axis
  const niceMax=max<=5?5:max<=10?10:max<=25?25:max<=50?50:max<=100?100:Math.ceil(max/50)*50;
  const hasData=vals.some(v=>v>0);
  const suffix=chartMetric==='accuracy'?'%':'';
  const labels=days.map(d=>{const dt=new Date(d+'T12:00:00');return dt.toLocaleDateString('en-IE',{weekday:'short'}).slice(0,2);});
  const colors={questions:['#0F172A','#1E293B'],accuracy:['#00875A','#006644'],quizzes:['#7C3AED','#4C1D95'],xp:['#D97706','#78350F']};
  const [c1,c2]=colors[chartMetric]||['#0F172A','#1E293B'];
  el.innerHTML=days.map((d,i)=>{
    const h=Math.round((vals[i]/niceMax)*120);
    return '<div class="chart-bar-wrap">'
      +'<div class="chart-bar" style="height:'+Math.max(h,0)+'px;background:linear-gradient(to top,'+c2+','+c1+')"></div>'
      +'<div class="chart-day">'+labels[i]+'</div>'
      +'</div>';
  }).join('');
  // Y-axis
  const yEl=document.getElementById('chartYAxis');
  if(yEl){
    yEl.innerHTML=
      '<div class="chart-ylabel">'+niceMax+suffix+'</div>'+
      '<div class="chart-ylabel">'+Math.round(niceMax/2)+suffix+'</div>'+
      '<div class="chart-ylabel">0</div>';
  }
  const noteEl=document.getElementById('chartNote');
  if(noteEl)noteEl.textContent=hasData?'Tracking from '+(G.trackingStart||todayKey()):'Data will appear here as you study';
}

function confirmReset(){
  showConfirm(
    'Reset All Progress',
    'This will erase all your XP, streaks and mastery. This cannot be undone.',
    ()=>{
      const ts=G.trackingStart||todayKey();
      G={
        xp:0,streak:0,lastDate:null,quizzes:0,totalQ:0,totalCorrect:0,
        drugCorrect:{},notes:{},
        disclaimerDone:G.disclaimerDone,onboardingDone:G.onboardingDone,
        seenDrugs:[],earnedBadges:[],
        freezeTokens:1,freezesUsed:0,
        dailyLog:{},trackingStart:ts,
        nextReview:{},recentWrong:[],
        lastDailyDate:null,
        fcXpDate:null,fcXpToday:0,
        seenToday:{},
        dailyDoneCount:0,
        perfectQuizzes:0,
        nightShiftDone:false
      };
      MEDS.forEach(m=>{G.drugCorrect[m.id]=0;G.notes[m.id]='';});
      saveG();updateHdr();updateStats();renderDonut();renderChart();renderDrugList();renderHome();
      showToast('Progress reset');
    },
    true  // danger style
  );
}

// GLOBAL SEARCH
let _gsTimer=null;
function handleGlobalSearch(q,clearId,resultsId){
  const clearBtn=document.getElementById(clearId||'homeSearchClear');
  if(clearBtn)clearBtn.style.display=q?'flex':'none';
  clearTimeout(_gsTimer);
  const el=document.getElementById(resultsId||'homeSearchResults');
  if(!q.trim()){
    el.classList.remove('show');el.innerHTML='';
    return;
  }
  _gsTimer=setTimeout(()=>{
    const ql=q.toLowerCase(),results=[];

    // Rank drug matches: name match first, then classification, then indications
    const drugMatches=MEDS.filter(m=>
      m.name.toLowerCase().includes(ql)||
      m.classification.toLowerCase().includes(ql)||
      m.indications.some(i=>i.toLowerCase().includes(ql))
    ).sort((a,b)=>{
      const aName=a.name.toLowerCase().includes(ql);
      const bName=b.name.toLowerCase().includes(ql);
      if(aName&&!bName)return -1;
      if(!aName&&bName)return 1;
      // Both match name — rank by how early the match appears
      const aIdx=a.name.toLowerCase().indexOf(ql);
      const bIdx=b.name.toLowerCase().indexOf(ql);
      return aIdx-bIdx;
    }).slice(0,5);
    drugMatches.forEach(m=>results.push({type:'drug',name:m.name,sub:m.classification,action:()=>openDet(m.id)}));

    // Score terms by relevance: exact name > name starts-with > name contains > definition contains
    TERMS.map(t=>{
      const term=t.term.toLowerCase();
      let score=0;
      if(term===ql)score=100;
      else if(term.startsWith(ql))score=80;
      else if(term.includes(ql))score=60;
      else if(t.def.toLowerCase().includes(ql))score=20;
      return{t,score};
    }).filter(x=>x.score>0)
      .sort((a,b)=>b.score-a.score||a.t.term.localeCompare(b.t.term))
      .slice(0,3)
      .forEach(({t})=>results.push({type:'term',name:t.term,sub:t.def.substring(0,60)+'…',action:()=>{
        showPage('learn',document.getElementById('btn-learn'));
        selStudy('terms',document.querySelector('[data-ssec="terms"]'));
        scrollToStudyTerm(t.term);
      }}));

    HOSPITALS.filter(h=>h.name.toLowerCase().includes(ql)||h.pcr.toLowerCase().includes(ql)||h.county.toLowerCase().includes(ql))
      .slice(0,3).forEach(h=>results.push({type:'hospital',name:h.name,sub:`${h.county}, PCR: ${h.pcr}`,action:()=>{
        showPage('ref',document.getElementById('btn-ref'));
        selRefSection('pcr',document.querySelector('[data-refsec="pcr"]'));
        // Wait for both showPage and section render to complete before scrolling
        setTimeout(()=>scrollToHospital(h.pcr),300);
      }}));

    // Medication reference — match generic or brand name
    if(typeof MEDREF!=='undefined'){
      MEDREF.map(d=>{
        const gen=d.generic.toLowerCase();
        const brands=d.brands.map(b=>b.toLowerCase());
        let score=0;
        if(gen===ql||brands.some(b=>b===ql))score=100;
        else if(gen.startsWith(ql)||brands.some(b=>b.startsWith(ql)))score=80;
        else if(gen.includes(ql)||brands.some(b=>b.includes(ql)))score=60;
        return{d,score};
      }).filter(x=>x.score>0)
        .sort((a,b)=>b.score-a.score||a.d.generic.localeCompare(b.d.generic))
        .slice(0,3)
        .forEach(({d})=>results.push({type:'med',name:d.generic,sub:d.brands.join(', '),action:()=>{
          showPage('ref',document.getElementById('btn-ref'));
          selRefSection('meds',document.querySelector('[data-refsec="meds"]'));
          const inp=document.getElementById('medrefSearch');
          if(inp){inp.value=d.generic;handleMedrefSearch(d.generic);}
        }}));
    }

    if(!results.length){
      el.innerHTML='<div class="gsr-item"><div style="color:var(--text3);font-size:13px">No results found</div></div>';
      el.classList.add('show');return;
    }
    el.innerHTML=results.map((r,i)=>`<div class="gsr-item" onclick="gsrClick(${i},'${resultsId||'gsearchResults'}')"><span class="gsr-type gsr-${r.type}">${r.type}</span><div><div class="gsr-name">${r.name}</div><div class="gsr-sub">${r.sub}</div></div></div>`).join('');
    el.classList.add('show');el._actions=results.map(r=>r.action);
  },200);
}

function gsrClick(i,resultsId){
  const el=document.getElementById(resultsId||'homeSearchResults');
  if(el._actions&&el._actions[i]){
    // Clear the home search bar before navigating
    document.getElementById('homeSearchInput').value='';
    document.getElementById('homeSearchClear').style.display='none';
    el.classList.remove('show');
    el.innerHTML='';
    el._actions[i]();
  }
}

function clearHomeSearch(){
  document.getElementById('homeSearchInput').value='';
  document.getElementById('homeSearchClear').style.display='none';
  document.getElementById('homeSearchResults').classList.remove('show');
  document.getElementById('homeSearchResults').innerHTML='';
}

function scrollToHospital(pcr){
  const el=document.getElementById('hosp-'+pcr);
  if(el){
    el.scrollIntoView({behavior:'smooth',block:'center'});
    el.style.transition='box-shadow 0.3s ease';
    el.style.boxShadow='0 0 0 2px var(--primary)';
    setTimeout(()=>{el.style.boxShadow='';},2000);
  }
}

// INIT
window.addEventListener('online',checkOnline);
window.addEventListener('offline',checkOnline);
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeDet();});
loadG();loadTheme();checkOnline();checkStreakOnLoad();checkDisclaimer();updateHdr();
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});

function updateDarkToggle(){
  const isDark=document.documentElement.getAttribute('data-theme')==='dark';
  const t=document.getElementById('darkToggle');
  if(t)t.classList.toggle('on',isDark);
}

// ── COPYRIGHT EASTER EGG ───────────────────────────────────────────────────────
// Tapping the copyright row fires two confetti cannons from the bottom corners,
// launching pieces inward + upward at ~45°, arcing back down under gravity.
let _eggCooldown=false;
function copyrightEasterEgg(){
  if(_eggCooldown)return;          // prevent spam / overlapping bursts
  _eggCooldown=true;
  setTimeout(()=>{_eggCooldown=false;},6000);
  const layer=document.getElementById('eggConfetti');
  if(!layer)return;
  const colors=['#FCD34D','#34D399','#60A5FA','#F87171','#C4B5FD','#FB923C','#2563EB','#D97706'];
  const perSide=22;
  let html='';
  for(let side=0;side<2;side++){
    const fromLeft = side===0;
    for(let i=0;i<perSide;i++){
      const col=colors[Math.floor(Math.random()*colors.length)];
      const size=6+Math.random()*6;
      // Launch distance and arc height — randomised for a natural spread
      const dx=(40+Math.random()*55)*(fromLeft?1:-1);   // horizontal travel (vw)
      const dy=-(45+Math.random()*40);                  // peak rise (vh, negative = up)
      const rot=Math.random()*720-360;
      // Launch-and-fizzle: shorter duration since pieces fade at the apex
      // rather than falling all the way down. Tight variance = coherent burst.
      const dur=1.6+Math.random()*0.5;
      const delay=Math.random()*0.15;
      const startEdge=fromLeft?'left:-10px;':'right:-10px;';
      html+=`<span class="egg-piece" style="`
        +`${startEdge}`
        +`width:${size}px;height:${size}px;background:${col};`
        +`--dx:${dx}vw;--dy:${dy}vh;--rot:${rot}deg;`
        +`animation-duration:${dur}s;animation-delay:${delay}s;`
        +`"></span>`;
    }
  }
  layer.innerHTML=html;
  haptic('success');
  // Clear after the longest possible animation completes (dur+delay max ≈ 3.6s)
  setTimeout(()=>{layer.innerHTML='';},4000);
}
