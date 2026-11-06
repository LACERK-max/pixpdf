pdfjsLib.GlobalWorkerOptions.workerSrc="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

/* ===== Firebase ===== */
const firebaseConfig={
apiKey:"AIzaSyDQUTYHiabZUHboFTsg9pI5nGj_aYo474E",
authDomain:"pixpdfwork.firebaseapp.com",
projectId:"pixpdfwork",
storageBucket:"pixpdfwork.firebasestorage.app",
messagingSenderId:"689402039231",
appId:"1:689402039231:web:798f8f9a09440b9468ef0a"
};
firebase.initializeApp(firebaseConfig);
const auth=firebase.auth();
const db=firebase.firestore();
let currentUser=null,currentRole="user",currentVip=false;

function applyTheme(t){document.documentElement.dataset.theme=t;const l=document.getElementById("themeLabel");if(l)l.textContent=t==="dark"?"الوضع الفاتح":"الوضع الداكن";localStorage.setItem("pixpdf-theme",t)}
function toggleTheme(){applyTheme(document.documentElement.dataset.theme==="dark"?"light":"dark")}
applyTheme(localStorage.getItem("pixpdf-theme")||"dark");

const canvas=document.getElementById("bgCanvas"),ctx=canvas.getContext("2d");
let particles=[];
function resizeCanvas(){canvas.width=innerWidth;canvas.height=innerHeight}
resizeCanvas();window.addEventListener("resize",resizeCanvas);
for(let i=0;i<60;i++)particles.push({x:Math.random()*innerWidth,y:Math.random()*innerHeight,vx:(Math.random()-.5)*.3,vy:(Math.random()-.5)*.3,r:Math.random()*2+1});
function drawBg(){
ctx.clearRect(0,0,canvas.width,canvas.height);
const dark=document.documentElement.dataset.theme==="dark";
const dotColor=dark?"rgba(129,140,248,.4)":"rgba(99,102,241,.25)";
const lineColor=dark?"rgba(34,211,238,.08)":"rgba(99,102,241,.06)";
particles.forEach(p=>{p.x+=p.vx;p.y+=p.vy;if(p.x<0||p.x>canvas.width)p.vx*=-1;if(p.y<0||p.y>canvas.height)p.vy*=-1;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fillStyle=dotColor;ctx.fill()});
for(let i=0;i<particles.length;i++)for(let j=i+1;j<particles.length;j++){const a=particles[i],b=particles[j];const d=Math.hypot(a.x-b.x,a.y-b.y);if(d<130){ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.strokeStyle=lineColor;ctx.lineWidth=1;ctx.stroke()}}
requestAnimationFrame(drawBg);
}
drawBg();

window.addEventListener("scroll",()=>{const h=document.documentElement;document.getElementById("scrollProgress").style.width=(h.scrollTop/(h.scrollHeight-h.clientHeight)*100)+"%"});

document.getElementById("toolSearch").addEventListener("input",e=>{
const q=e.target.value.trim().toLowerCase();
document.querySelectorAll("#menu .group-items a").forEach(a=>{const m=!q||a.textContent.toLowerCase().includes(q)||a.dataset.page.includes(q);a.classList.toggle("hidden",!m)});
document.querySelectorAll("#menu .menu-group").forEach(g=>{const any=[...g.querySelectorAll(".group-items a")].some(a=>!a.classList.contains("hidden"));g.classList.toggle("hidden",q&&!any);if(q&&any)g.open=true});
});

function showPage(){
const hash=location.hash.replace("#/","")||"home";
const page=hash==="home"?"home":hash;
document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));
const target=document.getElementById("page-"+page)||document.getElementById("page-home");
target.classList.add("active");
document.querySelectorAll(".menu a").forEach(a=>a.classList.toggle("active",a.dataset.page===(document.getElementById("page-"+page)?page:"home")));
document.getElementById("sidebar").classList.remove("open");
window.scrollTo({top:0,behavior:"smooth"});
if(page==="admin")renderAdminStats();
if(page==="account")renderAccount();
}
window.addEventListener("hashchange",showPage);showPage();

const icons={
image:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-4.35-4.35a1 1 0 0 0-1.42 0L5 21"/></svg>`,
pdf:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8"/><path d="M8 17h5"/></svg>`,
up:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>`,
down:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>`,
trash:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/></svg>`,
download:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></svg>`,
rename:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>`,
files:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>`,
size:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 3 15 9"/><path d="M15 3h6v6"/><path d="M3 21l9-9"/></svg>`,
pages:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8"/><path d="M8 10h8"/><path d="M8 14h5"/></svg>`
};
const statusIcons={
success:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`,
error:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6"/><path d="M9 9l6 6"/></svg>`,
warning:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>`,
loading:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.2-8.6"/></svg>`
};
function setStatus(el,type,text){el.innerHTML=`<span class="status-badge ${type}">${statusIcons[type]}<span>${text}</span></span>`}
function clearStatus(el){el.innerHTML=""}
function formatSize(b){if(b<1024)return b+" B";if(b<1048576)return (b/1024).toFixed(1)+" KB";return (b/1048576).toFixed(2)+" MB"}
function safeName(n,f){n=(n||"").trim().replace(/[\\/:*?"<>|]/g,"-");return n||f}
function downloadBlob(blob,name){const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;a.click()}
function setupZone(zoneId,inputId,handler){
const zone=document.getElementById(zoneId),input=document.getElementById(inputId);
zone.addEventListener("dragover",e=>{e.preventDefault();zone.classList.add("dragover")});
zone.addEventListener("dragleave",()=>zone.classList.remove("dragover"));
zone.addEventListener("drop",e=>{e.preventDefault();zone.classList.remove("dragover");handler(e.dataTransfer.files)});
input.addEventListener("change",()=>handler(input.files));
}
function makeDraggable(item,onReorder){
item.draggable=true;
item.addEventListener("dragstart",e=>{e.dataTransfer.effectAllowed="move";item.classList.add("dragging");window._dragEl=item});
item.addEventListener("dragend",()=>{item.classList.remove("dragging");window._dragEl=null});
item.addEventListener("dragover",e=>{e.preventDefault();if(window._dragEl&&window._dragEl!==item)item.classList.add("drag-over")});
item.addEventListener("dragleave",()=>item.classList.remove("drag-over"));
item.addEventListener("drop",e=>{e.preventDefault();item.classList.remove("drag-over");if(window._dragEl&&window._dragEl!==item){const from=[...item.parentNode.children].indexOf(window._dragEl);const to=[...item.parentNode.children].indexOf(item);onReorder(from,to)}});
}

/* ===== Auth ===== */
auth.onAuthStateChanged(async user=>{
currentUser=user;
updateUserUI(user);
if(user){
try{
const doc=await db.collection("users").doc(user.uid).get();
if(doc.exists){
currentRole=doc.data().role||"user";
currentVip=!!doc.data().vipActive;
}else{
await db.collection("users").doc(user.uid).set({
email:user.email||"",
displayName:user.displayName||"",
role:"user",
vipActive:false,
createdAt:firebase.firestore.FieldValue.serverTimestamp()
});
currentRole="user";currentVip=false;
}
}catch(e){currentRole="user";currentVip=false}
}else{currentRole="user";currentVip=false}
updateUserUI(user);
showPage();
});

function updateUserUI(user){
const chip=document.getElementById("userChip");
const accountLink=document.getElementById("accountLink");
const adminLink=document.getElementById("adminLink");
if(user){
chip.hidden=false;
chip.innerHTML=`<strong>${user.email||"مستخدم"}</strong><button onclick="doLogout()">خروج</button>`;
accountLink.hidden=false;
if(currentRole==="admin")adminLink.hidden=false;else adminLink.hidden=true;
}else{
chip.hidden=true;
accountLink.hidden=false;
adminLink.hidden=true;
}
}

function doLogin(){
const email=document.getElementById("loginEmail").value.trim();
const pass=document.getElementById("loginPassword").value;
const status=document.getElementById("loginStatus");
if(!email||!pass){setStatus(status,"warning","أدخل البريد وكلمة المرور.");return}
setStatus(status,"loading","جارٍ تسجيل الدخول...");
auth.signInWithEmailAndPassword(email,pass).then(()=>{
setStatus(status,"success","تم تسجيل الدخول بنجاح.");
location.hash="#/account";
}).catch(e=>{
let msg="تعذر تسجيل الدخول.";
if(e.code==="auth/user-not-found")msg="لا يوجد حساب بهذا البريد. أنشئ حسابًا جديدًا.";
else if(e.code==="auth/wrong-password")msg="كلمة المرور غير صحيحة. جرّب مرة أخرى أو استعد كلمة المرور.";
else if(e.code==="auth/invalid-email")msg="صيغة البريد غير صحيحة.";
setStatus(status,"error",msg);
});
}
function googleLogin(){
const status=document.getElementById("loginStatus");
setStatus(status,"loading","جارٍ الدخول بـ Google...");
const provider=new firebase.auth.GoogleAuthProvider();
auth.signInWithPopup(provider).then(()=>{
setStatus(status,"success","تم الدخول بـ Google بنجاح.");
location.hash="#/account";
}).catch(e=>setStatus(status,"error","تعذر الدخول بـ Google. تأكد من السماح بالنوافذ المنبثقة."));
}
function doRegister(){
const name=document.getElementById("regName").value.trim();
const email=document.getElementById("regEmail").value.trim();
const pass=document.getElementById("regPassword").value;
const confirm=document.getElementById("regConfirm").value;
const status=document.getElementById("registerStatus");
if(!name||!email||!pass){setStatus(status,"warning","أكمل جميع الحقول.");return}
if(pass!==confirm){setStatus(status,"warning","كلمتا المرور غير متطابقتين.");return}
if(pass.length<6){setStatus(status,"warning","كلمة المرور يجب أن تكون 6 أحرف على الأقل.");return}
setStatus(status,"loading","جارٍ إنشاء الحساب...");
auth.createUserWithEmailAndPassword(email,pass).then(cred=>{
return cred.user.updateProfile({displayName:name}).then(()=>{
return db.collection("users").doc(cred.user.uid).set({
email:email,displayName:name,role:"user",vipActive:false,
createdAt:firebase.firestore.FieldValue.serverTimestamp()
});
});
}).then(()=>{
setStatus(status,"success","تم إنشاء الحساب بنجاح.");
location.hash="#/account";
}).catch(e=>{
let msg="تعذر إنشاء الحساب.";
if(e.code==="auth/email-already-in-use")msg="البريد مستخدم بالفعل. جرّب تسجيل الدخول.";
else if(e.code==="auth/weak-password")msg="كلمة المرور ضعيفة. استخدم 6 أحرف على الأقل.";
setStatus(status,"error",msg);
});
}
function doLogout(){
auth.signOut().then(()=>{location.hash="#/";showPage()});
}
function resetPassword(){
const email=document.getElementById("loginEmail").value.trim();
const status=document.getElementById("loginStatus");
if(!email){setStatus(status,"warning","أدخل بريدك أولًا لاستعادة كلمة المرور.");return}
setStatus(status,"loading","جارٍ إرسال رابط الاستعادة...");
auth.sendPasswordResetEmail(email).then(()=>{
setStatus(status,"success","تم إرسال رابط استعادة كلمة المرور إلى بريدك.");
}).catch(e=>setStatus(status,"error","تعذر إرسال البريد. تأكد من صحة البريد."));
}
function renderAccount(){
const info=document.getElementById("accountInfo");
const status=document.getElementById("accountStatus");
if(!currentUser){
info.innerHTML=`<div class="account-row"><span>الحالة</span><strong>غير مسجل</strong></div><div class="account-row"><span>النوع</span><span class="badge-user">زائر</span></div>`;
document.getElementById("vipBtn").hidden=true;
return;
}
const roleBadge=currentRole==="admin"?`<span class="badge-admin">أدمن</span>`:currentVip?`<span class="badge-vip">VIP</span>`:`<span class="badge-user">مجاني</span>`;
info.innerHTML=`<div class="account-row"><span>البريد</span><strong>${currentUser.email||"—"}</strong></div><div class="account-row"><span>الاسم</span><strong>${currentUser.displayName||"—"}</strong></div><div class="account-row"><span>النوع</span>${roleBadge}</div>`;
document.getElementById("vipBtn").hidden=currentRole==="admin"||currentVip;
if(currentRole==="admin")document.getElementById("adminLink").hidden=false;
}
function upgradeVip(){
const email=currentUser?currentUser.email:"";
const text=encodeURIComponent(`مرحبًا، أريد ترقية حسابي إلى VIP في PixPDF.\nالبريد: ${email}`);
window.open(`https://wa.me/?text=${text}`,"_blank");
setStatus(document.getElementById("accountStatus"),"success","تم فتح واتساب لإرسال طلب الترقية.");
}

/* ===== Admin ===== */
let adminUser=null;
function renderAdminStats(){
const stats=document.getElementById("adminStats");
if(currentRole!=="admin"){stats.innerHTML="";return}
setStatus(document.getElementById("adminStatus"),"loading","جارٍ تحميل الإحصائيات...");
db.collection("users").get().then(snap=>{
const total=snap.size;
let vips=0,admins=0;
snap.forEach(d=>{const r=d.data().role;if(r==="vip"||d.data().vipActive)vips++;if(r==="admin")admins++});
stats.innerHTML=`<span class="stat-chip">${icons.files}<strong>${total}</strong> مستخدم</span><span class="stat-chip">${icons.pages}<strong>${vips}</strong> VIP</span><span class="stat-chip">${icons.pdf}<strong>${admins}</strong> أدمن</span>`;
clearStatus(document.getElementById("adminStatus"));
}).catch(e=>setStatus(document.getElementById("adminStatus"),"error","تعذر تحميل الإحصائيات. تأكد من قواعد الأمان."));
}
function adminSearchUser(){
const q=document.getElementById("adminSearch").value.trim();
const result=document.getElementById("adminResult");
const status=document.getElementById("adminStatus");
if(currentRole!=="admin"){setStatus(status,"error","هذه الصفحة للأدمن فقط. سجّل الدخول بحساب الأدمن.");return}
if(!q){setStatus(status,"warning","أدخل بريدًا أو UID للبحث.");return}
setStatus(status,"loading","جارٍ البحث...");
const isEmail=q.includes("@");
let query;
if(isEmail)query=db.collection("users").where("email","==",q);
else query=db.collection("users").where(firebase.firestore.FieldPath.documentId(),"==",q);
query.get().then(snap=>{
if(snap.empty){setStatus(status,"warning","لا يوجد مستخدم بهذا البريد أو UID.");result.innerHTML="";return}
const doc=snap.docs[0];adminUser=doc;
const d=doc.data();
const role=d.role||"user";
const badge=role==="admin"?`<span class="badge-admin">أدمن</span>`:(d.vipActive?`<span class="badge-vip">VIP</span>`:`<span class="badge-user">مجاني</span>`);
result.innerHTML=`<div class="user-card"><div class="row"><span>البريد</span><strong>${d.email||"—"}</strong></div><div class="row"><span>الاسم</span><strong>${d.displayName||"—"}</strong></div><div class="row"><span>UID</span><strong>${doc.id}</strong></div><div class="row"><span>النوع</span>${badge}</div><div class="user-actions"><button class="btn success" onclick="setVip(true)">تفعيل VIP</button><button class="btn ghost" onclick="setVip(false)">إلغاء VIP</button></div></div>`;
setStatus(status,"success","تم العثور على المستخدم.");
}).catch(e=>setStatus(status,"error","تعذر البحث. تأكد من قواعد الأمان وصلاحية الأدمن."));
}
function setVip(active){
const status=document.getElementById("adminStatus");
if(!adminUser){setStatus(status,"warning","ابحث عن مستخدم أولًا.");return}
if(currentRole!=="admin"){setStatus(status,"error","هذه العملية للأدمن فقط.");return}
setStatus(status,"loading","جارٍ التحديث...");
adminUser.ref.update({vipActive:active,role:active?"vip":"user"}).then(()=>{
setStatus(status,"success",active?"تم تفعيل VIP بنجاح.":"تم إلغاء VIP بنجاح.");
adminSearchUser();
}).catch(e=>setStatus(status,"error","تعذر التحديث. تأكد من قواعد الأمان وصلاحية الأدمن."));
}

/* ===== Workspace ===== */
let wsFiles=[];
const wsInput=document.getElementById("wsInput"),wsZone=document.getElementById("wsZone"),wsGrid=document.getElementById("wsGrid"),wsStats=document.getElementById("wsStats"),wsStatus=document.getElementById("wsStatus"),wsResult=document.getElementById("wsResult"),wsProgressWrap=document.getElementById("wsProgressWrap"),wsProgress=document.getElementById("wsProgress"),wsProgressText=document.getElementById("wsProgressText");
setupZone("wsZone","wsInput",async files=>{
const accepted=[...files].filter(f=>["image/png","image/jpeg","application/pdf"].includes(f.type));
if(!accepted.length){setStatus(wsStatus,"warning","الملفات غير مدعومة. أضف صور JPG/PNG أو ملفات PDF.");return}
for(const f of accepted){
const item={type:f.type==="application/pdf"?"pdf":"image",file:f,thumb:null,pages:1};
if(item.type==="pdf"){
try{const data=await f.arrayBuffer();const pdf=await pdfjsLib.getDocument({data}).promise;item.pages=pdf.numPages;
const page=await pdf.getPage(1);const vp=page.getViewport({scale:.4});
const c=document.createElement("canvas");c.width=vp.width;c.height=vp.height;
await page.render({canvasContext:c.getContext("2d"),viewport:vp}).promise;
item.thumb=c.toDataURL();
}catch(e){item.thumb=null}
}else{
item.thumb=await new Promise(r=>{const reader=new FileReader();reader.onload=()=>r(reader.result);reader.readAsDataURL(f)});
}
wsFiles.push(item);
}
renderWorkspace();clearStatus(wsStatus);
});
function renderWorkspace(){
wsGrid.innerHTML="";
wsFiles.forEach((it,i)=>{
const card=document.createElement("div");card.className="ws-card";
card.innerHTML=`${it.type==="pdf"?`<span class="ws-badge">PDF</span>`:`<span class="ws-badge" style="background:#10b981">صورة</span>`}<button class="ws-remove" onclick="removeWsFile(${i})"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>${it.thumb?`<img src="${it.thumb}">`:`<div style="height:120px;display:grid;place-items:center;color:var(--text-3)">${icons.pdf}</div>`}<span class="ws-name">${it.file.name}</span><span class="ws-size">${it.type==="pdf"?it.pages+" صفحة — ":""}${formatSize(it.file.size)}</span>`;
makeDraggable(card,(from,to)=>{const[m]=wsFiles.splice(from,1);wsFiles.splice(to,0,m);renderWorkspace()});
wsGrid.appendChild(card);
});
updateWsStats();
}
function updateWsStats(){
const bar=document.getElementById("wsStats");
if(!wsFiles.length){bar.hidden=true;return}
const total=wsFiles.reduce((s,f)=>s+f.file.size,0);
const pages=wsFiles.reduce((s,f)=>s+(f.type==="pdf"?f.pages:1),0);
const imgs=wsFiles.filter(f=>f.type==="image").length;
const pdfs=wsFiles.filter(f=>f.type==="pdf").length;
bar.hidden=false;
bar.innerHTML=`<span class="stat-chip">${icons.files}<strong>${wsFiles.length}</strong> عنصر</span><span class="stat-chip">${icons.image}<strong>${imgs}</strong> صورة</span><span class="stat-chip">${icons.pdf}<strong>${pdfs}</strong> ملف PDF</span><span class="stat-chip">${icons.pages}<strong>${pages}</strong> صفحة متوقعة</span><span class="stat-chip">${icons.size}<strong>${formatSize(total)}</strong> الحجم الكلي</span>`;
}
function removeWsFile(i){wsFiles.splice(i,1);renderWorkspace();if(!wsFiles.length)clearWorkspace()}
function clearWorkspace(){wsFiles=[];wsInput.value="";wsGrid.innerHTML="";wsStats.hidden=true;wsResult.innerHTML="";wsProgressWrap.hidden=true;clearStatus(wsStatus)}
async function exportWorkspace(){
if(!wsFiles.length){setStatus(wsStatus,"warning","أضف صورة أو ملف PDF واحد على الأقل قبل التصدير.");return}
setStatus(wsStatus,"loading","جارٍ تجهيز مساحة العمل...");
wsProgressWrap.hidden=false;wsProgress.style.width="0%";
try{
const {PDFDocument}=PDFLib;
const out=await PDFDocument.create();
let done=0;const total=wsFiles.length;
for(const item of wsFiles){
wsProgressText.textContent=`جارٍ إضافة: ${item.file.name}`;
if(item.type==="image"){
const bytes=await item.file.arrayBuffer();
const img=item.file.type==="image/png"?await out.embedPng(bytes):await out.embedJpg(bytes);
const page=out.addPage([img.width,img.height]);
page.drawImage(img,{x:0,y:0,width:img.width,height:img.height});
}else{
const bytes=await item.file.arrayBuffer();
const doc=await PDFDocument.load(bytes);
const pages=await out.copyPages(doc,doc.getPageIndices());
pages.forEach(p=>out.addPage(p));
}
done++;wsProgress.style.width=(done/total*100)+"%";
}
const bytes=await out.save();const blob=new Blob([bytes],{type:"application/pdf"});
window.wsBlob=blob;
wsProgress.style.width="100%";wsProgressText.textContent="اكتمل التصدير";
const pages=wsFiles.reduce((s,f)=>s+(f.type==="pdf"?f.pages:1),0);
wsResult.innerHTML=`<div class="pdf-ready"><div class="big">${icons.pdf}</div><strong>تم إنشاء PDF من مساحة العمل</strong><span>${wsFiles.length} عنصر — ${pages} صفحة — ${formatSize(blob.size)}</span><div class="rename-box"><label for="wsName">${icons.rename} اسم الملف</label><input type="text" id="wsName" value="workspace"></div><button class="btn success" onclick="downloadWorkspace()">${icons.download} تحميل PDF</button></div>`;
setStatus(wsStatus,"success","اكتب اسم الملف ثم اضغط تحميل.");
}catch(e){
setStatus(wsStatus,"error","تعذر التصدير. قد يكون أحد ملفات PDF محميًا أو تالفًا. جرّب استبعاد الملف المشكوك فيه وأعد المحاولة.");
}}
function downloadWorkspace(){if(!window.wsBlob)return;const name=safeName(document.getElementById("wsName")?.value,"workspace");downloadBlob(window.wsBlob,name+".pdf")}

/* Images to PDF */
let imageFiles=[],pdfBlobUrl="";
const imgStatus=document.getElementById("imgStatus");
setupZone("imgZone","imgInput",files=>{
const accepted=[...files].filter(f=>["image/png","image/jpeg"].includes(f.type));
if(!accepted.length){setStatus(imgStatus,"warning","الملفات المختارة ليست صور JPG أو PNG. أضف صورًا بهذه الصيغ ثم أعد المحاولة.");return}
imageFiles=[...imageFiles,...accepted];renderImages();clearStatus(imgStatus)});
function renderImages(){
const list=document.getElementById("imgList");list.innerHTML="";
imageFiles.forEach((f,i)=>{
const item=document.createElement("div");item.className="file-item";
item.innerHTML=`<div class="file-info">${icons.image}<span class="file-name">${f.name}</span><span class="file-size">${formatSize(f.size)}</span></div><div class="move-buttons"><button class="move-btn" onclick="moveImage(${i},-1)">${icons.up}</button><button class="move-btn" onclick="moveImage(${i},1)">${icons.down}</button><button class="remove-btn" onclick="removeImage(${i})">${icons.trash}</button></div>`;
makeDraggable(item,(from,to)=>{const[m]=imageFiles.splice(from,1);imageFiles.splice(to,0,m);renderImages()});
list.appendChild(item)});
updateImgStats();
}
function updateImgStats(){
const bar=document.getElementById("imgStats");
if(!imageFiles.length){bar.hidden=true;return}
const total=imageFiles.reduce((s,f)=>s+f.size,0);
bar.hidden=false;
bar.innerHTML=`<span class="stat-chip">${icons.files}<strong>${imageFiles.length}</strong> صورة</span><span class="stat-chip">${icons.size}<strong>${formatSize(total)}</strong> الحجم الكلي</span><span class="stat-chip">${icons.pages}<strong>${imageFiles.length}</strong> صفحة متوقعة في PDF</span>`;
}
function moveImage(i,d){const n=i+d;if(n<0||n>=imageFiles.length)return;[imageFiles[i],imageFiles[n]]=[imageFiles[n],imageFiles[i]];renderImages()}
function removeImage(i){imageFiles.splice(i,1);renderImages();if(!imageFiles.length)clearImages()}
function clearImages(){imageFiles=[];pdfBlobUrl="";document.getElementById("imgInput").value="";document.getElementById("imgList").innerHTML="";document.getElementById("imgResult").innerHTML="";document.getElementById("imgStats").hidden=true;clearStatus(imgStatus)}
async function imagesToPdf(){
if(!imageFiles.length){setStatus(imgStatus,"warning","أضف صورة واحدة على الأقل قبل إنشاء PDF.");return}
setStatus(imgStatus,"loading","جارٍ إنشاء ملف PDF...");
try{
const {PDFDocument}=PDFLib;const pdf=await PDFDocument.create();
for(const file of imageFiles){const bytes=await file.arrayBuffer();const img=file.type==="image/png"?await pdf.embedPng(bytes):await pdf.embedJpg(bytes);const page=pdf.addPage([img.width,img.height]);page.drawImage(img,{x:0,y:0,width:img.width,height:img.height})}
const bytes=await pdf.save();const blob=new Blob([bytes],{type:"application/pdf"});pdfBlobUrl=URL.createObjectURL(blob);
document.getElementById("imgResult").innerHTML=`<div class="pdf-ready"><div class="big">${icons.pdf}</div><strong>تم إنشاء ملف PDF بنجاح</strong><span>${imageFiles.length} صورة — ${formatSize(blob.size)}</span><div class="rename-box"><label for="pdfName">${icons.rename} اسم ملف PDF</label><input type="text" id="pdfName" value="images"></div><button class="btn success" onclick="downloadPdf()">${icons.download} تحميل ملف PDF</button></div>`;
setStatus(imgStatus,"success","اكتب اسم الملف ثم اضغط تحميل.");
}catch(e){setStatus(imgStatus,"error","تعذر إنشاء PDF. قد تكون إحدى الصور تالفة أو بامتداد غير مدعوم. جرّب إزالة الصور المشكوك فيها وأعد المحاولة.")}}
function downloadPdf(){if(!pdfBlobUrl)return;const name=safeName(document.getElementById("pdfName")?.value,"images");const a=document.createElement("a");a.href=pdfBlobUrl;a.download=name+".pdf";a.click()}

/* PDF to images */
let generatedImages=[];
const pdfInput=document.getElementById("pdfInput"),pdfZone=document.getElementById("pdfZone"),pdfStatus=document.getElementById("pdfStatus"),pdfResult=document.getElementById("pdfResult"),qualitySelect=document.getElementById("quality"),pdfSelected=document.getElementById("pdfSelected"),pdfFileName=document.getElementById("pdfFileName");
setupZone("pdfZone","pdfInput",files=>{
const file=files[0];if(!file)return;
if(file.type!=="application/pdf"){setStatus(pdfStatus,"warning","الملف المختار ليس PDF. اختر ملفًا بامتداد .pdf ثم أعد المحاولة.");return}
const dt=new DataTransfer();dt.items.add(file);pdfInput.files=dt.files;showSelectedPdf()});
pdfInput.addEventListener("change",showSelectedPdf);
function showSelectedPdf(){
const file=pdfInput.files[0];if(!file){clearPdf();return}
pdfFileName.textContent=file.name;pdfSelected.hidden=false;
setStatus(pdfStatus,"success","تم إضافة الملف: "+file.name+" ("+formatSize(file.size)+")");
pdfResult.innerHTML="";generatedImages=[]}
function clearPdf(){pdfInput.value="";generatedImages=[];clearStatus(pdfStatus);pdfResult.innerHTML="";pdfSelected.hidden=true;pdfFileName.textContent=""}
async function pdfToImages(){
const file=pdfInput.files[0];if(!file){setStatus(pdfStatus,"warning","اختر ملف PDF أولًا.");return}
setStatus(pdfStatus,"loading","جارٍ قراءة ملف PDF...");
try{
const scale=Number(qualitySelect.value);const data=await file.arrayBuffer();
const pdf=await pdfjsLib.getDocument({data}).promise;generatedImages=[];
const title=document.createElement("div");title.className="result-title";
title.innerHTML=`<strong>الصور الناتجة</strong><div class="rename-box"><label for="zipName">${icons.rename} اسم ملف ZIP</label><input type="text" id="zipName" value="pdf-images"></div><span>${pdf.numPages} صفحة — جودة ${scale}x</span>`;
pdfResult.appendChild(title);
const grid=document.createElement("div");grid.className="preview-grid";pdfResult.appendChild(grid);
for(let i=1;i<=pdf.numPages;i++){
setStatus(pdfStatus,"loading",`جارٍ تحويل الصفحة ${i} من ${pdf.numPages}...`);
const page=await pdf.getPage(i);const viewport=page.getViewport({scale});
const canvas=document.createElement("canvas");canvas.width=viewport.width;canvas.height=viewport.height;
await page.render({canvasContext:canvas.getContext("2d"),viewport}).promise;
const dataUrl=canvas.toDataURL("image/png");generatedImages.push({name:`page-${i}.png`,dataUrl});
const box=document.createElement("div");box.className="preview";
box.innerHTML=`<img src="${dataUrl}"><a href="${dataUrl}" download="page-${i}.png">${icons.download} صفحة ${i}</a>`;
grid.appendChild(box)}
const zipBtn=document.createElement("button");zipBtn.className="btn success";zipBtn.onclick=downloadImagesZip;
zipBtn.innerHTML=`${icons.download} تحميل ${pdf.numPages} صورة ZIP`;pdfResult.appendChild(zipBtn);
setStatus(pdfStatus,"success",`تم تحويل ${pdf.numPages} صفحة بنجاح.`);
}catch(e){setStatus(pdfStatus,"error","تعذر قراءة ملف PDF. قد يكون الملف محميًا بكلمة مرور أو تالفًا. جرّب ملف PDF آخر أو أزل الحماية أولًا.")}}
async function downloadImagesZip(){
if(!generatedImages.length)return;
setStatus(pdfStatus,"loading","جارٍ تحضير ملف ZIP...");
const name=safeName(document.getElementById("zipName")?.value,"pdf-images");
const zip=new JSZip();const folder=zip.folder(name);
for(const img of generatedImages)folder.file(img.name,img.dataUrl.split(",")[1],{base64:true});
const blob=await zip.generateAsync({type:"blob"});downloadBlob(blob,name+".zip");
setStatus(pdfStatus,"success","تم تحضير ملف ZIP بنجاح.")}

/* OCR */
let ocrFile=null,ocrText="";
const ocrInput=document.getElementById("ocrInput"),ocrZone=document.getElementById("ocrZone"),ocrStatus=document.getElementById("ocrStatus"),ocrOutput=document.getElementById("ocrOutput"),ocrOutputWrap=document.getElementById("ocrOutputWrap"),ocrSelected=document.getElementById("ocrSelected"),ocrFileName=document.getElementById("ocrFileName"),ocrLang=document.getElementById("ocrLang"),ocrProgressWrap=document.getElementById("ocrProgressWrap"),ocrProgress=document.getElementById("ocrProgress"),ocrProgressText=document.getElementById("ocrProgressText");
setupZone("ocrZone","ocrInput",files=>{
const file=files[0];if(!file)return;
if(!["image/png","image/jpeg","application/pdf"].includes(file.type)){setStatus(ocrStatus,"warning","الملف غير مدعوم. أضف صورة JPG/PNG أو ملف PDF.");return}
ocrFile=file;
document.getElementById("ocrFileName").textContent=file.name;
ocrSelected.hidden=false;
setStatus(ocrStatus,"success","تم إضافة: "+file.name);
ocrOutputWrap.hidden=true;ocrOutput.value="";ocrText="";
document.getElementById("copyOcr").hidden=true;document.getElementById("downloadOcr").hidden=true;
});
function clearOcr(){ocrFile=null;ocrText="";ocrInput.value="";ocrSelected.hidden=true;ocrFileName.textContent="";clearStatus(ocrStatus);ocrOutputWrap.hidden=true;ocrOutput.value="";document.getElementById("copyOcr").hidden=true;document.getElementById("downloadOcr").hidden=true;ocrProgressWrap.hidden=true}
function setOcrProgress(pct,text){ocrProgressWrap.hidden=false;ocrProgress.style.width=pct+"%";ocrProgressText.textContent=text}
async function extractText(){
if(!ocrFile){setStatus(ocrStatus,"warning","أضف صورة أو ملف PDF أولًا.");return}
if(typeof Tesseract==="undefined"){setStatus(ocrStatus,"error","تعذر تحميل مكتبة OCR. تأكد من اتصالك بالإنترنت ثم أعد تحميل الصفحة.");return}
const lang=ocrLang.value;
setStatus(ocrStatus,"loading","جارٍ تحضير محرك القراءة...");
ocrOutputWrap.hidden=true;ocrOutput.value="";ocrText="";
document.getElementById("copyOcr").hidden=true;document.getElementById("downloadOcr").hidden=true;
try{
let images=[];
if(ocrFile.type==="application/pdf"){
const data=await ocrFile.arrayBuffer();
const pdf=await pdfjsLib.getDocument({data}).promise;
for(let i=1;i<=pdf.numPages;i++){
setOcrProgress((i-1)/pdf.numPages*50,`تحويل الصفحة ${i} من ${pdf.numPages} إلى صورة...`);
const page=await pdf.getPage(i);
const viewport=page.getViewport({scale:2});
const canvas=document.createElement("canvas");canvas.width=viewport.width;canvas.height=viewport.height;
await page.render({canvasContext:canvas.getContext("2d"),viewport}).promise;
images.push(canvas.toDataURL("image/png"));
}
}else{
const dataUrl=await new Promise(r=>{const reader=new FileReader();reader.onload=()=>r(reader.result);reader.readAsDataURL(ocrFile)});
images=[dataUrl];
}
let all="";
for(let i=0;i<images.length;i++){
setOcrProgress(50+(i/images.length)*50,`جارٍ قراءة الصفحة ${i+1} من ${images.length}...`);
const result=await Tesseract.recognize(images[i],lang,{logger:m=>{
if(m.status==="recognizing text")setOcrProgress(50+(i+m.progress)/images.length*50,`قراءة الصفحة ${i+1}: ${Math.round(m.progress*100)}%`);
}});
all+=(all?"\n\n":"")+result.data.text.trim();
}
ocrText=all;
ocrOutput.value=all;
ocrOutputWrap.hidden=false;
document.getElementById("copyOcr").hidden=false;
document.getElementById("downloadOcr").hidden=false;
setOcrProgress(100,"اكتمل الاستخراج");
setStatus(ocrStatus,"success","تم استخراج النص بنجاح.");
}catch(e){
setStatus(ocrStatus,"error","تعذر استخراج النص. السبب المحتمل: جودة الصورة منخفضة أو النص غير واضح. جرّب صورة أوضح أو ملف PDF نصيًا.");
}}
function copyOcr(){navigator.clipboard.writeText(ocrText).then(()=>setStatus(ocrStatus,"success","تم نسخ النص."))}
function downloadOcr(){if(!ocrText)return;downloadBlob(new Blob([ocrText],{type:"text/plain;charset=utf-8"}),"extracted-text.txt")}

/* Text to PDF */
async function textToPdf(){
const text=document.getElementById("ttpText").value.trim();
const status=document.getElementById("ttpStatus");
if(!text){setStatus(status,"warning","اكتب نصًا أولًا قبل إنشاء PDF.");return}
setStatus(status,"loading","جارٍ إنشاء PDF...");
try{
const canvas=document.createElement("canvas");
const ctx=canvas.getContext("2d");
ctx.font="600 40px Cairo, sans-serif";
const lines=[];
text.split(/\n/).forEach(par=>{
const words=par.split(/\s+/);let line="";
words.forEach(w=>{
const test=line?line+" "+w:w;
if(ctx.measureText(test).width>1000){lines.push(line);line=w}else line=test;
});
lines.push(line);
});
const pageW=1240,pageH=1754;
const pages=[];
for(let i=0;i<lines.length;i+=38)pages.push(lines.slice(i,i+38));
const {PDFDocument}=PDFLib;
const pdf=await PDFDocument.create();
for(const part of pages){
const c=document.createElement("canvas");c.width=pageW;c.height=pageH;
const x=c.getContext("2d");
x.fillStyle="#ffffff";x.fillRect(0,0,pageW,pageH);
x.fillStyle="#111827";x.font="600 40px Cairo, sans-serif";x.textAlign="right";x.direction="rtl";
part.forEach((line,j)=>x.fillText(line,pageW-80,120+j*58));
const png=await pdf.embedPng(c.toDataURL("image/png"));
const page=pdf.addPage([595,842]);
page.drawImage(png,{x:0,y:0,width:595,height:842});
}
const bytes=await pdf.save();downloadBlob(new Blob([bytes],{type:"application/pdf"}),"text.pdf");
setStatus(status,"success","تم إنشاء ملف PDF وتحميله بنجاح.");
}catch(e){setStatus(status,"error","تعذر إنشاء PDF. جرّب تقليل طول النص أو أعد المحاولة.")}}

/* Merge PDF */
let mergeFiles=[];
const mergeStatus=document.getElementById("mergeStatus");
setupZone("mergeZone","mergeInput",files=>{
const accepted=[...files].filter(f=>f.type==="application/pdf");
if(!accepted.length){setStatus(mergeStatus,"warning","الملفات المختارة ليست PDF. أضف ملفات بامتداد .pdf ثم أعد المحاولة.");return}
mergeFiles=[...mergeFiles,...accepted];renderMerge();clearStatus(mergeStatus)});
function renderMerge(){
const list=document.getElementById("mergeList");list.innerHTML="";
mergeFiles.forEach((f,i)=>{
const item=document.createElement("div");item.className="file-item";
item.innerHTML=`<div class="file-info">${icons.pdf}<span class="file-name">${f.name}</span><span class="file-size">${formatSize(f.size)}</span></div><div class="move-buttons"><button class="move-btn" onclick="moveMerge(${i},-1)">${icons.up}</button><button class="move-btn" onclick="moveMerge(${i},1)">${icons.down}</button><button class="remove-btn" onclick="removeMerge(${i})">${icons.trash}</button></div>`;
makeDraggable(item,(from,to)=>{const[m]=mergeFiles.splice(from,1);mergeFiles.splice(to,0,m);renderMerge()});
list.appendChild(item)});
updateMergeStats();
}
function updateMergeStats(){
const bar=document.getElementById("mergeStats");
if(!mergeFiles.length){bar.hidden=true;return}
const total=mergeFiles.reduce((s,f)=>s+f.size,0);
bar.hidden=false;
bar.innerHTML=`<span class="stat-chip">${icons.files}<strong>${mergeFiles.length}</strong> ملف PDF</span><span class="stat-chip">${icons.size}<strong>${formatSize(total)}</strong> الحجم الكلي</span>`;
}
function moveMerge(i,d){const n=i+d;if(n<0||n>=mergeFiles.length)return;[mergeFiles[i],mergeFiles[n]]=[mergeFiles[n],mergeFiles[i]];renderMerge()}
function removeMerge(i){mergeFiles.splice(i,1);renderMerge();if(!mergeFiles.length)clearMerge()}
function clearMerge(){mergeFiles=[];document.getElementById("mergeInput").value="";document.getElementById("mergeList").innerHTML="";document.getElementById("mergeResult").innerHTML="";document.getElementById("mergeStats").hidden=true;clearStatus(mergeStatus)}
async function mergePdfs(){
if(mergeFiles.length<2){setStatus(mergeStatus,"warning","أضف ملفي PDF على الأقل لدمجهما.");return}
setStatus(mergeStatus,"loading","جارٍ دمج الملفات...");
try{
const {PDFDocument}=PDFLib;const out=await PDFDocument.create();
for(const file of mergeFiles){
const bytes=await file.arrayBuffer();
const doc=await PDFDocument.load(bytes);
const pages=await out.copyPages(doc,doc.getPageIndices());
pages.forEach(p=>out.addPage(p));
}
const bytes=await out.save();const blob=new Blob([bytes],{type:"application/pdf"});
window.mergedBlob=blob;
document.getElementById("mergeResult").innerHTML=`<div class="pdf-ready"><div class="big">${icons.pdf}</div><strong>تم دمج الملفات بنجاح</strong><span>${mergeFiles.length} ملفات — ${formatSize(blob.size)}</span><div class="rename-box"><label for="mergeName">${icons.rename} اسم الملف</label><input type="text" id="mergeName" value="merged"></div><button class="btn success" onclick="downloadMerged()">${icons.download} تحميل PDF</button></div>`;
setStatus(mergeStatus,"success","اكتب اسم الملف ثم حمّله.");
}catch(e){setStatus(mergeStatus,"error","تعذر دمج الملفات. قد يكون أحد الملفات محميًا أو تالفًا. جرّب استبعاد الملف المشكوك فيه وأعد المحاولة.")}}
function downloadMerged(){if(!window.mergedBlob)return;const name=safeName(document.getElementById("mergeName")?.value,"merged");downloadBlob(window.mergedBlob,name+".pdf")}

/* Split PDF */
let splitFile=null;
const splitStatus=document.getElementById("splitStatus");
setupZone("splitZone","splitInput",files=>{
const file=files[0];if(!file)return;
if(file.type!=="application/pdf"){setStatus(splitStatus,"warning","الملف المختار ليس PDF. اختر ملفًا بامتداد .pdf.");return}
splitFile=file;
document.getElementById("splitFileName").textContent=file.name;
document.getElementById("splitSelected").hidden=false;
setStatus(splitStatus,"success","تم إضافة: "+file.name);
document.getElementById("splitResult").innerHTML=""});
function clearSplit(){splitFile=null;document.getElementById("splitInput").value="";document.getElementById("splitSelected").hidden=true;document.getElementById("splitFileName").textContent="";clearStatus(splitStatus);document.getElementById("splitResult").innerHTML=""}
function parsePages(input,total){
const parts=input.split(",").map(x=>x.trim()).filter(Boolean);
const pages=new Set();
for(const part of parts){
if(part.includes("-")){
const [a,b]=part.split("-").map(Number);
if(!a||!b||a>b)continue;
for(let i=a;i<=Math.min(b,total);i++)pages.add(i-1);
}else{
const n=Number(part);
if(n>=1&&n<=total)pages.add(n-1);
}}
return [...pages].sort((a,b)=>a-b)}
async function splitPdf(){
if(!splitFile){setStatus(splitStatus,"warning","أضف ملف PDF أولًا.");return}
const input=document.getElementById("pagesInput").value.trim();
if(!input){setStatus(splitStatus,"warning","اكتب الصفحات المطلوبة، مثال: 1-3,5,8-10");return}
setStatus(splitStatus,"loading","جارٍ الاستخراج...");
try{
const {PDFDocument}=PDFLib;
const src=await PDFDocument.load(await splitFile.arrayBuffer());
const total=src.getPageCount();
const indices=parsePages(input,total);
if(!indices.length){setStatus(splitStatus,"warning","لا توجد صفحات صحيحة. تأكد أن الأرقام ضمن نطاق "+total+" صفحة.");return}
const out=await PDFDocument.create();
const pages=await out.copyPages(src,indices);
pages.forEach(p=>out.addPage(p));
const bytes=await out.save();const blob=new Blob([bytes],{type:"application/pdf"});
window.splitBlob=blob;
document.getElementById("splitResult").innerHTML=`<div class="pdf-ready"><div class="big">${icons.pdf}</div><strong>تم استخراج ${indices.length} صفحة</strong><span>الحجم: ${formatSize(blob.size)}</span><div class="rename-box"><label for="splitName">${icons.rename} اسم الملف</label><input type="text" id="splitName" value="extracted-pages"></div><button class="btn success" onclick="downloadSplit()">${icons.download} تحميل PDF</button></div>`;
setStatus(splitStatus,"success","اكتب اسم الملف ثم حمّله.");
}catch(e){setStatus(splitStatus,"error","تعذر قراءة ملف PDF. قد يكون محميًا أو تالفًا. جرّب ملفًا آخر.")}}
function downloadSplit(){if(!window.splitBlob)return;const name=safeName(document.getElementById("splitName")?.value,"extracted-pages");downloadBlob(window.splitBlob,name+".pdf")}

/* Edit PDF */
let editPdfBytes=null,editPagesState=[];
const editStatus=document.getElementById("editStatus");
setupZone("editZone","editInput",async files=>{
const file=files[0];if(!file)return;
if(file.type!=="application/pdf"){setStatus(editStatus,"warning","الملف المختار ليس PDF. اختر ملفًا بامتداد .pdf.");return}
document.getElementById("editFileName").textContent=file.name;
document.getElementById("editSelected").hidden=false;
setStatus(editStatus,"loading","جارٍ قراءة الصفحات...");
editPdfBytes=await file.arrayBuffer();
await renderEditPages();
});
async function renderEditPages(){
try{
const pdf=await pdfjsLib.getDocument({data:editPdfBytes.slice(0)}).promise;
editPagesState=Array.from({length:pdf.numPages},(_,i)=>({index:i,rotation:0,deleted:false,thumb:null}));
const grid=document.getElementById("editPages");grid.innerHTML="";
for(let i=0;i<pdf.numPages;i++){
const page=await pdf.getPage(i+1);
const viewport=page.getViewport({scale:.35});
const c=document.createElement("canvas");c.width=viewport.width;c.height=viewport.height;
await page.render({canvasContext:c.getContext("2d"),viewport}).promise;
editPagesState[i].thumb=c.toDataURL();
}
renderEditPagesKeep();
setStatus(editStatus,"success","اختر الصفحات ثم دوّرها أو احذفها. اسحب أي صفحة لإعادة ترتيبها.");
updateEditStats();
}catch(e){setStatus(editStatus,"error","تعذر قراءة ملف PDF. قد يكون محميًا أو تالفًا. جرّب ملفًا آخر.")}}
function renderEditPagesKeep(){
const grid=document.getElementById("editPages");grid.innerHTML="";
editPagesState.forEach((st,i)=>{
const card=document.createElement("div");card.className="page-card";card.dataset.index=i;
card.innerHTML=`<img src="${st.thumb}"><span class="num">صفحة ${i+1}</span>`;
if(st.rotation){const t=document.createElement("span");t.className="rot";t.textContent=st.rotation+"°";card.appendChild(t)}
if(st.deleted){card.style.opacity=".3";card.style.pointerEvents="none"}
card.onclick=()=>card.classList.toggle("selected");
makeDraggable(card,(from,to)=>{const[m]=editPagesState.splice(from,1);editPagesState.splice(to,0,m);renderEditPagesKeep()});
grid.appendChild(card);
});
updateEditStats();
}
function updateEditStats(){
const bar=document.getElementById("editStats");
if(!editPagesState.length){bar.hidden=true;return}
const kept=editPagesState.filter(p=>!p.deleted).length;
bar.hidden=false;
bar.innerHTML=`<span class="stat-chip">${icons.pages}<strong>${editPagesState.length}</strong> صفحة في الملف</span><span class="stat-chip">${icons.files}<strong>${kept}</strong> صفحة ستُصدّر</span>`;
}
function clearEdit(){editPdfBytes=null;editPagesState=[];document.getElementById("editInput").value="";document.getElementById("editSelected").hidden=true;document.getElementById("editFileName").textContent="";document.getElementById("editPages").innerHTML="";document.getElementById("editStats").hidden=true;clearStatus(editStatus);document.getElementById("editResult").innerHTML=""}
function getSelectedIndices(){return [...document.querySelectorAll(".page-card.selected")].map(c=>Number(c.dataset.index))}
function rotateSelected(deg){
const selected=getSelectedIndices();
if(!selected.length){setStatus(editStatus,"warning","اختر صفحة واحدة على الأقل قبل التدوير.");return}
selected.forEach(i=>editPagesState[i].rotation=(editPagesState[i].rotation+deg)%360);
renderEditPagesKeep();
setStatus(editStatus,"success","تم تدوير الصفحات المحددة.");
}
function deleteSelected(){
const selected=getSelectedIndices();
if(!selected.length){setStatus(editStatus,"warning","اختر صفحة واحدة على الأقل قبل الحذف.");return}
selected.forEach(i=>editPagesState[i].deleted=true);
renderEditPagesKeep();
setStatus(editStatus,"success","تم تحديد الصفحات المحذوفة. اضغط تصدير PDF جديد.");
}
async function exportEditedPdf(){
if(!editPdfBytes){setStatus(editStatus,"warning","أضف ملف PDF أولًا.");return}
setStatus(editStatus,"loading","جارٍ تصدير PDF...");
try{
const {PDFDocument,degrees}=PDFLib;
const src=await PDFDocument.load(editPdfBytes.slice(0));
const out=await PDFDocument.create();
const keep=editPagesState.filter(p=>!p.deleted);
if(!keep.length){setStatus(editStatus,"warning","جميع الصفحات محذوفة. أعد تفعيل صفحة واحدة على الأقل قبل التصدير.");return}
const pages=await out.copyPages(src,keep.map(p=>p.index));
pages.forEach((p,i)=>{const rot=keep[i].rotation;if(rot)p.setRotation(degrees(rot));out.addPage(p)});
const bytes=await out.save();downloadBlob(new Blob([bytes],{type:"application/pdf"}),"edited.pdf");
setStatus(editStatus,"success","تم تصدير PDF جديد بنجاح.");
}catch(e){setStatus(editStatus,"error","تعذر تصدير الملف. جرّب تقليل عدد الصفحات أو أعد إضافة الملف.")}}

/* Watermark */
let wmFile=null;
const wmStatus=document.getElementById("wmStatus");
setupZone("wmZone","wmInput",files=>{
const file=files[0];if(!file)return;
if(!["image/png","image/jpeg","application/pdf"].includes(file.type)){setStatus(wmStatus,"warning","الملف غير مدعوم. أضف صورة JPG/PNG أو ملف PDF.");return}
wmFile=file;
document.getElementById("wmFileName").textContent=file.name;
document.getElementById("wmSelected").hidden=false;
setStatus(wmStatus,"success","تم إضافة: "+file.name);
document.getElementById("wmResult").innerHTML=""});
function clearWatermark(){wmFile=null;document.getElementById("wmInput").value="";document.getElementById("wmSelected").hidden=true;document.getElementById("wmFileName").textContent="";clearStatus(wmStatus);document.getElementById("wmResult").innerHTML=""}
async function textToTransparentPng(text,opacity){
const canvas=document.createElement("canvas");
canvas.width=1200;canvas.height=400;
const ctx=canvas.getContext("2d");
ctx.clearRect(0,0,canvas.width,canvas.height);
ctx.globalAlpha=opacity;ctx.fillStyle="#ffffff";
ctx.font="bold 90px Cairo, sans-serif";ctx.textAlign="center";ctx.textBaseline="middle";
ctx.translate(canvas.width/2,canvas.height/2);ctx.rotate(-Math.PI/6);
ctx.fillText(text,0,0);
return canvas.toDataURL("image/png");
}
async function addWatermark(){
if(!wmFile){setStatus(wmStatus,"warning","أضف صورة أو ملف PDF أولًا.");return}
const text=document.getElementById("wmText").value.trim();
if(!text){setStatus(wmStatus,"warning","اكتب نص العلامة المائية.");return}
const opacity=Number(document.getElementById("wmOpacity").value);
setStatus(wmStatus,"loading","جارٍ إضافة العلامة المائية...");
try{
if(wmFile.type==="application/pdf"){
const {PDFDocument}=PDFLib;
const pngDataUrl=await textToTransparentPng(text,opacity);
const pngBytes=await (await fetch(pngDataUrl)).arrayBuffer();
const pdf=await PDFDocument.load(await wmFile.arrayBuffer());
const image=await pdf.embedPng(pngBytes);
pdf.getPages().forEach(page=>{
const {width,height}=page.getSize();
const w=width*.8;const h=w*(image.height/image.width);
page.drawImage(image,{x:(width-w)/2,y:(height-h)/2,width:w,height:h});
});
const bytes=await pdf.save();
downloadBlob(new Blob([bytes],{type:"application/pdf"}),"watermarked.pdf");
setStatus(wmStatus,"success","تم إضافة العلامة المائية وتحميل PDF.");
}else{
const dataUrl=await new Promise(r=>{const reader=new FileReader();reader.onload=()=>r(reader.result);reader.readAsDataURL(wmFile)});
const img=await new Promise(r=>{const image=new Image();image.onload=()=>r(image);image.src=dataUrl});
const canvas=document.createElement("canvas");canvas.width=img.width;canvas.height=img.height;
const ctx=canvas.getContext("2d");ctx.drawImage(img,0,0);
ctx.globalAlpha=opacity;ctx.fillStyle="#fff";
ctx.font="bold "+Math.round(img.width/16)+"px Cairo, sans-serif";
ctx.translate(canvas.width/2,canvas.height/2);ctx.rotate(-Math.PI/6);ctx.textAlign="center";ctx.textBaseline="middle";
ctx.fillText(text,0,0);
const out=canvas.toDataURL("image/png");
document.getElementById("wmResult").innerHTML=`<div class="preview-grid"><div class="preview"><img src="${out}"><a href="${out}" download="watermarked.png">${icons.download} تحميل الصورة</a></div></div>`;
setStatus(wmStatus,"success","تم إضافة العلامة المائية بنجاح.");
}
}catch(e){setStatus(wmStatus,"error","تعذر إضافة العلامة المائية. تأكد أن الملف غير محمي وأن الصيغة مدعومة.")}}

/* Compress images */
let compressFiles=[],compressedImages=[];
const compressStatus=document.getElementById("compressStatus");
setupZone("compressZone","compressInput",files=>{
const accepted=[...files].filter(f=>["image/png","image/jpeg"].includes(f.type));
if(!accepted.length){setStatus(compressStatus,"warning","الملفات المختارة ليست صور JPG أو PNG.");return}
compressFiles=[...compressFiles,...accepted];renderCompressFiles();clearStatus(compressStatus)});
function renderCompressFiles(){
const list=document.getElementById("compressList");list.innerHTML="";
compressFiles.forEach((f,i)=>{
const item=document.createElement("div");item.className="file-item";
item.innerHTML=`<div class="file-info">${icons.image}<span class="file-name">${f.name}</span><span class="file-size">${formatSize(f.size)}</span></div><button class="remove-btn" onclick="removeCompressFile(${i})">${icons.trash}</button>`;
list.appendChild(item)})}
function removeCompressFile(i){compressFiles.splice(i,1);renderCompressFiles();if(!compressFiles.length)clearCompress()}
function clearCompress(){compressFiles=[];compressedImages=[];document.getElementById("compressInput").value="";document.getElementById("compressList").innerHTML="";document.getElementById("compressResult").innerHTML="";clearStatus(compressStatus)}
async function compressImages(){
if(!compressFiles.length){setStatus(compressStatus,"warning","أضف صورة واحدة على الأقل.");return}
const quality=Number(document.getElementById("compressLevel").value);
setStatus(compressStatus,"loading","جارٍ ضغط الصور...");
document.getElementById("compressResult").innerHTML="";compressedImages=[];
const grid=document.createElement("div");grid.className="preview-grid";document.getElementById("compressResult").appendChild(grid);
for(const file of compressFiles){
setStatus(compressStatus,"loading",`جارٍ ضغط: ${file.name}`);
const dataUrl=await new Promise(r=>{const reader=new FileReader();reader.onload=()=>r(reader.result);reader.readAsDataURL(file)});
const img=await new Promise(r=>{const image=new Image();image.onload=()=>r(image);image.src=dataUrl});
const canvas=document.createElement("canvas");canvas.width=img.width;canvas.height=img.height;
canvas.getContext("2d").drawImage(img,0,0);
const out=canvas.toDataURL("image/jpeg",quality);
compressedImages.push({name:file.name.replace(/\.[^.]+$/,"")+"-compressed.jpg",dataUrl:out});
const blob=await (await fetch(out)).blob();
const box=document.createElement("div");box.className="preview";
box.innerHTML=`<img src="${out}"><div class="sizes">${formatSize(file.size)} ← ${formatSize(blob.size)}</div><button class="link" onclick="downloadCompressed(${compressedImages.length-1})">${icons.download} تحميل</button>`;
grid.appendChild(box);
}
const zipBtn=document.createElement("button");zipBtn.className="btn success";zipBtn.onclick=downloadCompressedZip;
zipBtn.innerHTML=`${icons.download} تحميل كل الصور ZIP`;
document.getElementById("compressResult").appendChild(zipBtn);
setStatus(compressStatus,"success",`تم ضغط ${compressFiles.length} صورة بنجاح.`)}
function downloadCompressed(i){const img=compressedImages[i];const a=document.createElement("a");a.href=img.dataUrl;a.download=img.name;a.click()}
async function downloadCompressedZip(){
if(!compressedImages.length)return;
setStatus(compressStatus,"loading","جارٍ تحضير ملف ZIP...");
const zip=new JSZip();const folder=zip.folder("compressed-images");
for(const img of compressedImages)folder.file(img.name,img.dataUrl.split(",")[1],{base64:true});
const blob=await zip.generateAsync({type:"blob"});downloadBlob(blob,"compressed-images.zip");
setStatus(compressStatus,"success","تم تحضير ملف ZIP بنجاح.")}

/* Password */
let currentPass="";
const passStatus=document.getElementById("passStatus");
function generatePassword(){
const len=Math.min(64,Math.max(6,Number(document.getElementById("passLength").value)||16));
let chars="abcdefghijklmnopqrstuvwxyz";
if(document.getElementById("passUpper").checked)chars+="ABCDEFGHIJKLMNOPQRSTUVWXYZ";
if(document.getElementById("passNumbers").checked)chars+="0123456789";
if(document.getElementById("passSymbols").checked)chars+="!@#$%^&*()-_=+[]{};:,.<>?";
if(!chars){setStatus(passStatus,"warning","اختر نوعًا واحدًا على الأقل من الأحرف أو الأرقام أو الرموز.");return}
const array=new Uint32Array(len);crypto.getRandomValues(array);
currentPass=[...array].map(n=>chars[n%chars.length]).join("");
const box=document.getElementById("passResult");
box.textContent=currentPass;box.hidden=false;
document.getElementById("copyPass").hidden=false;
setStatus(passStatus,"success","تم إنشاء كلمة مرور قوية.");
}
function copyPassword(){navigator.clipboard.writeText(currentPass).then(()=>setStatus(passStatus,"success","تم نسخ كلمة المرور."))}

/* Text counter */
document.getElementById("counterText").addEventListener("input",e=>{
const text=e.target.value;
const words=text.trim()?text.trim().split(/\s+/).length:0;
document.getElementById("wordsCount").textContent=words;
document.getElementById("charsCount").textContent=text.length;
document.getElementById("linesCount").textContent=text?text.split(/\n/).length:0;
document.getElementById("sentencesCount").textContent=text.trim()?(text.match(/[.!?؟]+/g)||[]).length:0;
});

/* QR */
let qrDataUrl="";
const qrStatus=document.getElementById("qrStatus");
function generateQR(){
const text=document.getElementById("qrText").value.trim();
const size=Number(document.getElementById("qrSize").value);
const color=document.getElementById("qrColor").value;
if(typeof QRCode==="undefined"){setStatus(qrStatus,"error","تعذر تحميل مكتبة QR. تحقق من الإنترنت وأعد تحميل الصفحة.");return}
if(!text){setStatus(qrStatus,"warning","اكتب رابطًا أو نصًا أولًا.");return}
setStatus(qrStatus,"loading","جارٍ إنشاء رمز QR...");
document.getElementById("qrResult").innerHTML="";document.getElementById("qrDownload").hidden=true;qrDataUrl="";
try{
const holder=document.createElement("div");holder.className="qr-box";document.getElementById("qrResult").appendChild(holder);
new QRCode(holder,{text,width:size,height:size,colorDark:color,colorLight:"#ffffff",correctLevel:QRCode.CorrectLevel.H});
setTimeout(()=>{
const canvas=holder.querySelector("canvas"),img=holder.querySelector("img");
qrDataUrl=canvas?canvas.toDataURL("image/png"):(img?.src||"");
if(qrDataUrl){document.getElementById("qrDownload").hidden=false;setStatus(qrStatus,"success","تم إنشاء رمز QR بنجاح.")}
else setStatus(qrStatus,"error","تعذر إنشاء رمز QR. جرّب نصًا أقصر أو أعد المحاولة.");
},80);
}catch(e){setStatus(qrStatus,"error","حدث خطأ أثناء إنشاء رمز QR. جرّب نصًا أقصر.")}}
function downloadQR(){if(!qrDataUrl)return;const a=document.createElement("a");a.href=qrDataUrl;a.download="qr-code.png";a.click()}

/* WiFi QR */
let wifiQrUrl="";
const wifiStatus=document.getElementById("wifiStatus");
function generateWifiQR(){
const ssid=document.getElementById("wifiSsid").value.trim();
const pass=document.getElementById("wifiPass").value;
const enc=document.getElementById("wifiEnc").value;
const result=document.getElementById("wifiResult");
const btn=document.getElementById("wifiDownload");
if(typeof QRCode==="undefined"){setStatus(wifiStatus,"error","تعذر تحميل مكتبة QR. تحقق من الإنترنت وأعد تحميل الصفحة.");return}
if(!ssid){setStatus(wifiStatus,"warning","اكتب اسم الشبكة (SSID).");return}
let text=`WIFI:T:WPA;S:${ssid};`;
if(enc!=="nopass"){if(!pass){setStatus(wifiStatus,"warning","اكتب كلمة مرور الشبكة أو اختر 'بدون كلمة مرور'.");return}text+=`P:${pass};`}
text+=`H:false;;`;
setStatus(wifiStatus,"loading","جارٍ إنشاء رمز QR...");
result.innerHTML="";btn.hidden=true;wifiQrUrl="";
try{
const holder=document.createElement("div");holder.className="qr-box";result.appendChild(holder);
new QRCode(holder,{text,width:400,height:400,colorDark:"#0b1020",colorLight:"#ffffff",correctLevel:QRCode.CorrectLevel.H});
setTimeout(()=>{
const canvas=holder.querySelector("canvas"),img=holder.querySelector("img");
wifiQrUrl=canvas?canvas.toDataURL("image/png"):(img?.src||"");
if(wifiQrUrl){btn.hidden=false;setStatus(wifiStatus,"success","تم إنشاء رمز QR بنجاح.")}
else setStatus(wifiStatus,"error","تعذر إنشاء رمز QR. جرّب اسم شبكة أو كلمة مرور أقصر.");
},80);
}catch(e){setStatus(wifiStatus,"error","حدث خطأ أثناء إنشاء رمز QR. جرّب اسم شبكة أو كلمة مرور أقصر.")}}
function downloadWifiQR(){if(!wifiQrUrl)return;const a=document.createElement("a");a.href=wifiQrUrl;a.download="wifi-qr.png";a.click()}
