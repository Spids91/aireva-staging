const C='aireva-20260625121626';
const BASE='.';
const ASSETS=[BASE+'/',BASE+'/index.html',BASE+'/manifest.json',BASE+'/css/style.css',
  BASE+'/js/data/medications.js',BASE+'/js/data/hospitals.js',BASE+'/js/data/terms.js',BASE+'/js/data/medref.js',BASE+'/js/data/scenarios.js',
  BASE+'/js/app.js',BASE+'/js/home.js',BASE+'/js/reference.js',BASE+'/js/medref.js',BASE+'/js/detail.js',
  BASE+'/js/quiz.js',BASE+'/js/scenario.js',BASE+'/js/study.js',BASE+'/js/settings.js'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(ASSETS)));self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener('fetch',e=>{e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(res=>{if(res&&res.status===200&&e.request.method==='GET'){const c=res.clone();caches.open(C).then(cache=>cache.put(e.request,c));}return res;})));});
