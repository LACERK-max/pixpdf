/* PixPDF — Service Worker
   غيّر رقم VERSION عند كل نشر جديد ليصل التحديث للمستخدمين. */
const VERSION="pixpdf-v1";
const SHELL=["index.html","style.css","script.js","i18n-en.js","manifest.webmanifest","icons/icon-192.png","icons/icon-512.png"];
/* مكتبات خارجية تُخزَّن لتعمل الأدوات بلا إنترنت (CORS مفعّل عليها فلا تُحسب كملفات معتمة) */
const CDN=[
 "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js",
 "https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js",
 "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js",
 "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js",
 "https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js",
 "https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js",
 "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js",
 "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js",
 "https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js",
 "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js",
 "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js",
 "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=Reem+Kufi:wght@500;600;700&display=swap"
];
const CDN_HOSTS=["cdnjs.cloudflare.com","cdn.jsdelivr.net","www.gstatic.com","fonts.googleapis.com","fonts.gstatic.com"];

self.addEventListener("install",event=>{
event.waitUntil((async()=>{
const cache=await caches.open(VERSION);
await Promise.allSettled(SHELL.map(u=>cache.add(new Request(u,{cache:"reload"}))));
await Promise.allSettled(CDN.map(u=>cache.add(new Request(u,{mode:"cors",credentials:"omit"}))));
await self.skipWaiting()})())});

self.addEventListener("activate",event=>{
event.waitUntil((async()=>{
for(const k of await caches.keys())if(k!==VERSION)await caches.delete(k);
await self.clients.claim()})())});

async function revalidate(cache,key,request){
try{const res=await fetch(request);if(res&&res.ok)await cache.put(key,res.clone());return res}catch(e){return null}}

self.addEventListener("fetch",event=>{
const r=event.request;
if(r.method!=="GET")return;
const u=new URL(r.url);
if(u.protocol!=="http:"&&u.protocol!=="https:")return;
/* الصفحة نفسها: الشبكة أولًا ثم النسخة المخزّنة عند انقطاع الاتصال */
if(u.origin===location.origin&&r.mode==="navigate"){
event.respondWith((async()=>{
try{const res=await fetch(r);if(res&&res.ok){const c=await caches.open(VERSION);c.put("index.html",res.clone())}return res}
catch(e){return (await caches.match("index.html"))||new Response("أنت غير متصل بالإنترنت.",{status:503,headers:{"Content-Type":"text/plain; charset=utf-8"}})}})());
return}
let request=r;
if(u.origin===location.origin)request=new Request(r,{cache:"no-cache"});
else if(CDN_HOSTS.includes(u.hostname))request=new Request(r.url,{mode:"cors",credentials:"omit"});
else return; /* Firebase وواجهات Google وواتساب وغيرها: دائمًا من الشبكة ولا تُخزَّن */
event.respondWith((async()=>{
const cache=await caches.open(VERSION),hit=await cache.match(r.url),net=revalidate(cache,r.url,request);
if(hit){event.waitUntil(net);return hit}
return (await net)||new Response("غير متصل",{status:504})})())});
