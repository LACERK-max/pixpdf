pdfjsLib.GlobalWorkerOptions.workerSrc="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

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
var currentVipUntil=0;
var reportsData=[],adminFeedsOn=false,adminFeedsError=false,tkFilter="active";
var REPORT_REASONS=["إساءة أو ألفاظ نابية","محتوى مزعج أو إعلاني","معلومات مضللة","أخرى"];
var supTickets=[],supOpenId=null,supFilter="all",supUnsub=null,supMsgUnsub=null,supSig="",supMsgs=[],supBuilt="";
var SUP_CAT={tech:"مشكلة تقنية",vip:"VIP والاشتراك",idea:"اقتراح",other:"أخرى"};
var SUP_ST={open:"مفتوحة",answered:"تم الرد",closed:"مغلقة"};

const DAILY_LIMIT=4;
const USAGE_PREFIX="pixpdf_usage_";
const VIP_WHATSAPP_NUMBER="212669109665";

const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function isVip(){return currentRole==="admin"||(currentVip===true&&(!currentVipUntil||currentVipUntil>Date.now()))}

function todayKey(){
const d=new Date();
return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function getDailyUsage(){
const key=USAGE_PREFIX+todayKey();
const raw=localStorage.getItem(key);
return raw?Number(raw):0;
}

function incrementDailyUsage(){
const key=USAGE_PREFIX+todayKey();
const n=getDailyUsage()+1;
localStorage.setItem(key,String(n));
renderQuota();
return n;
}

function canUseConversion(){
if(isVip())return true;
const ok=getDailyUsage()<DAILY_LIMIT;
if(!ok)quotaShake();
return ok;
}

function updateMenuVisibility(){
const convert=document.getElementById("groupConvert");
const pdf=document.getElementById("groupPdf");
const images=document.getElementById("groupImages");
const quick=document.getElementById("groupQuick");
const vipLink=document.getElementById("vipLink");
const formatConverterLink=document.getElementById("formatConverterLink");

if(!convert)return;

if(isVip()){
convert.hidden=false;
pdf.hidden=false;
images.hidden=false;
quick.hidden=false;
if(vipLink)vipLink.hidden=false;
if(formatConverterLink)formatConverterLink.hidden=false;
}else{
convert.hidden=false;
pdf.hidden=true;
images.hidden=true;
quick.hidden=true;
if(vipLink)vipLink.hidden=true;
if(formatConverterLink)formatConverterLink.hidden=true;
}

updateMembershipAppearance();
}

function updateMembershipAppearance(){
const user=auth.currentUser;
const membership=!user?"guest":currentRole==="admin"?"admin":currentVip?"vip":"free";
document.body.dataset.membership=membership;

renderHomeExtras();
renderQuota();

updateDeleteAccountVisibility();
}

function applyTheme(t){
document.documentElement.dataset.theme=t;
const label=document.getElementById("themeLabel");
if(label)label.textContent=t==="dark"?"الوضع الفاتح":"الوضع الداكن";
localStorage.setItem("pixpdf-theme",t);
}

function toggleTheme(){
applyTheme(document.documentElement.dataset.theme==="dark"?"light":"dark");
}

applyTheme(localStorage.getItem("pixpdf-theme")||"dark");

const canvas=document.getElementById("bgCanvas");
const ctx=canvas.getContext("2d");
let particles=[];

function resizeCanvas(){
canvas.width=innerWidth;
canvas.height=innerHeight;
}

resizeCanvas();
window.addEventListener("resize",resizeCanvas);

for(let i=0;i<60;i++){
particles.push({
x:Math.random()*innerWidth,
y:Math.random()*innerHeight,
vx:(Math.random()-.5)*.3,
vy:(Math.random()-.5)*.3,
r:Math.random()*2+1
});
}

function drawBackground(){
ctx.clearRect(0,0,canvas.width,canvas.height);
const dark=document.documentElement.dataset.theme==="dark";
const dotColor=dark?"rgba(129,140,248,.4)":"rgba(99,102,241,.25)";
const lineColor=dark?"rgba(34,211,238,.08)":"rgba(99,102,241,.06)";

particles.forEach(p=>{
p.x+=p.vx;
p.y+=p.vy;

if(p.x<0||p.x>canvas.width)p.vx*=-1;
if(p.y<0||p.y>canvas.height)p.vy*=-1;

ctx.beginPath();
ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
ctx.fillStyle=dotColor;
ctx.fill();
});

for(let i=0;i<particles.length;i++){
for(let j=i+1;j<particles.length;j++){
const a=particles[i];
const b=particles[j];
const distance=Math.hypot(a.x-b.x,a.y-b.y);

if(distance<130){
ctx.beginPath();
ctx.moveTo(a.x,a.y);
ctx.lineTo(b.x,b.y);
ctx.strokeStyle=lineColor;
ctx.lineWidth=1;
ctx.stroke();
}
}
}

if(!matchMedia("(prefers-reduced-motion: reduce)").matches)requestAnimationFrame(drawBackground);
}

drawBackground();

window.addEventListener("scroll",()=>{
const height=document.documentElement;
document.getElementById("scrollProgress").style.width=
(height.scrollTop/(Math.max(1,height.scrollHeight-height.clientHeight))*100)+"%";
});

document.getElementById("toolSearch").addEventListener("input",event=>{
const query=event.target.value.trim().toLowerCase();

document.querySelectorAll("#menu .group-items a").forEach(link=>{
const visible=!query||link.textContent.toLowerCase().includes(query)||link.dataset.page.includes(query);
link.classList.toggle("hidden",!visible);
});

document.querySelectorAll("#menu .menu-group").forEach(group=>{
const hasVisible=[...group.querySelectorAll(".group-items a")].some(link=>!link.classList.contains("hidden"));
group.classList.toggle("hidden",query&&!hasVisible);

if(query&&hasVisible)group.open=true;
});
});

function showPage(){
updateMenuVisibility();

const hash=location.hash.replace("#/","")||"home";
const page=hash==="home"?"home":hash;
const FREE_PAGES=["home","images-to-pdf","pdf-to-images","login","register","account","vip","reviews","support"];
let view=document.getElementById("page-"+page)?page:"home";
if(view==="admin"){if(currentRole!=="admin")view="home"}
else if(!isVip()&&!FREE_PAGES.includes(view))view="vip";

document.querySelectorAll(".page").forEach(item=>item.classList.remove("active"));

const target=document.getElementById("page-"+view);
target.classList.add("active");

document.querySelectorAll(".menu a").forEach(link=>{
link.classList.toggle("active",link.dataset.page===view);
});

document.getElementById("sidebar").classList.remove("open");
window.scrollTo({top:0,behavior:"smooth"});

if(view==="admin")renderAdminPanel();
if(view==="account")renderAccount();
if(view==="vip")renderVipPage();
if(view==="history")renderHistory();
if(view==="reviews")renderReviews();
supportSync();
if(view==="support")renderSupport();
if(window.TOOL_HOOKS&&TOOL_HOOKS[view])TOOL_HOOKS[view]();
if(window.renderFavorites)renderFavorites();
try{if(typeof ensureFeeds==="function")ensureFeeds()}catch(error){console.error("feeds",error)}
}

window.addEventListener("hashchange",showPage);
showPage();

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

function setStatus(element,type,text){
element.innerHTML=`<span class="status-badge ${type}">${statusIcons[type]}<span>${text}</span></span>`;
}

function clearStatus(element){
element.innerHTML="";
}

function formatSize(bytes){
/* LRI/PDI تعزل الرقم والوحدة لتظهر "18.4 KB" لا "KB 18.4" داخل النص العربي */
const t=bytes<1024?bytes+" B":bytes<1048576?(bytes/1024).toFixed(1)+" KB":(bytes/1048576).toFixed(2)+" MB";
return "\u2066"+t+"\u2069";
}

function safeName(name,fallback){
name=(name||"").trim().replace(/[\\/:*?"<>|]/g,"-");
return name||fallback;
}

function downloadBlob(blob,name){
const link=document.createElement("a");
link.href=URL.createObjectURL(blob);
link.download=name;
link.click();
}

function setupZone(zoneId,inputId,handler){
const zone=document.getElementById(zoneId);
const input=document.getElementById(inputId);

zone.tabIndex=0;
zone.setAttribute("role","button");
zone.addEventListener("click",event=>{if(event.target!==input)input.click()});
zone.addEventListener("keydown",event=>{
if((event.key==="Enter"||event.key===" ")&&event.target===zone){event.preventDefault();input.click()}
});

zone.addEventListener("dragover",event=>{
event.preventDefault();
zone.classList.add("dragover");
});

zone.addEventListener("dragleave",()=>zone.classList.remove("dragover"));

zone.addEventListener("drop",event=>{
event.preventDefault();
zone.classList.remove("dragover");
handler(event.dataTransfer.files);
});

input.addEventListener("change",()=>handler(input.files));
}

function makeDraggable(item,onReorder){
item.draggable=true;

item.addEventListener("dragstart",event=>{
event.dataTransfer.effectAllowed="move";
item.classList.add("dragging");
window.dragElement=item;
});

item.addEventListener("dragend",()=>{
item.classList.remove("dragging");
window.dragElement=null;
});

item.addEventListener("dragover",event=>{
event.preventDefault();
if(window.dragElement&&window.dragElement!==item)item.classList.add("drag-over");
});

item.addEventListener("dragleave",()=>item.classList.remove("drag-over"));

item.addEventListener("drop",event=>{
event.preventDefault();
item.classList.remove("drag-over");

if(window.dragElement&&window.dragElement!==item){
const from=[...item.parentNode.children].indexOf(window.dragElement);
const to=[...item.parentNode.children].indexOf(item);
onReorder(from,to);
}
});
}

/* ===== Auth: يقرأ الدور من Firestore (يُدار من Firebase Console) ===== */
auth.onAuthStateChanged(async user=>{
currentUser=user;
updateUserInterface(user);

if(user){
try{
const document=await db.collection("users").doc(user.uid).get();

let firestoreRole="user";
let vip=false;
let vipUntil=0;

if(document.exists){
firestoreRole=document.data().role||"user";
vip=!!document.data().vipActive;
vipUntil=document.data().vipUntil&&document.data().vipUntil.toMillis?document.data().vipUntil.toMillis():0;
}else{
await db.collection("users").doc(user.uid).set({
email:user.email||"",
displayName:user.displayName||"",
role:"user",
vipActive:false,
createdAt:firebase.firestore.FieldValue.serverTimestamp()
});
}

currentRole=firestoreRole==="admin"?"admin":"user";
currentVip=vip;
currentVipUntil=vipUntil;

}catch(error){
currentRole="user";
currentVip=false;
}
}else{
currentRole="user";
currentVip=false;
}

updateUserInterface(user);
renderAccount();
updateMenuVisibility();
showPage();
});

function updateUserInterface(user){
const chip=document.getElementById("userChip");
const accountLink=document.getElementById("accountLink");
const adminLink=document.getElementById("adminLink");

if(user){
chip.hidden=false;
chip.innerHTML=`<strong>${esc(user.email||"مستخدم")}</strong><button onclick="doLogout()">خروج</button>`;
accountLink.hidden=false;
adminLink.hidden=currentRole!=="admin";
}else{
chip.hidden=true;
accountLink.hidden=false;
adminLink.hidden=true;
}
}

function doLogin(){
const email=document.getElementById("loginEmail").value.trim();
const password=document.getElementById("loginPassword").value;
const status=document.getElementById("loginStatus");

if(!email||!password){
setStatus(status,"warning","أدخل البريد وكلمة المرور.");
return;
}

setStatus(status,"loading","جارٍ تسجيل الدخول...");

auth.signInWithEmailAndPassword(email,password)
.then(()=>{
setStatus(status,"success","تم تسجيل الدخول بنجاح.");
afterAuthRedirect();
})
.catch(error=>{
let message="تعذر تسجيل الدخول.";

if(error.code==="auth/user-not-found")message="لا يوجد حساب بهذا البريد.";
if(error.code==="auth/wrong-password")message="كلمة المرور غير صحيحة.";
if(error.code==="auth/invalid-email")message="صيغة البريد غير صحيحة.";

setStatus(status,"error",message);
});
}

function googleLogin(){
const status=document.getElementById("loginStatus");

setStatus(status,"loading","جارٍ الدخول بـ Google...");

const provider=new firebase.auth.GoogleAuthProvider();

auth.signInWithPopup(provider)
.then(()=>{
setStatus(status,"success","تم الدخول بـ Google بنجاح.");
afterAuthRedirect();
})
.catch(error=>{
setStatus(status,"error","تعذر الدخول بـ Google. تأكد من السماح بالنوافذ المنبثقة.");
});
}

function doRegister(){
const name=document.getElementById("regName").value.trim();
const email=document.getElementById("regEmail").value.trim();
const password=document.getElementById("regPassword").value;
const confirmation=document.getElementById("regConfirm").value;
const status=document.getElementById("registerStatus");

if(!name||!email||!password){
setStatus(status,"warning","أكمل جميع الحقول.");
return;
}

if(password!==confirmation){
setStatus(status,"warning","كلمتا المرور غير متطابقتين.");
return;
}

if(password.length<6){
setStatus(status,"warning","كلمة المرور يجب أن تكون 6 أحرف على الأقل.");
return;
}

setStatus(status,"loading","جارٍ إنشاء الحساب...");

auth.createUserWithEmailAndPassword(email,password)
.then(credential=>{
return credential.user.updateProfile({displayName:name}).then(()=>{
return db.collection("users").doc(credential.user.uid).set({
email,
displayName:name,
role:"user",
vipActive:false,
createdAt:firebase.firestore.FieldValue.serverTimestamp()
});
});
})
.then(()=>{
setStatus(status,"success","تم إنشاء الحساب بنجاح.");
afterAuthRedirect();
})
.catch(error=>{
let message="تعذر إنشاء الحساب.";

if(error.code==="auth/email-already-in-use")message="البريد مستخدم بالفعل.";
if(error.code==="auth/weak-password")message="كلمة المرور ضعيفة.";

setStatus(status,"error",message);
});
}

function doLogout(){
auth.signOut().then(()=>{
location.hash="#/";
showPage();
});
}

var resetCooldownUntil=0;
function resetPassword(event){
if(event&&event.preventDefault)event.preventDefault();
const input=document.getElementById("loginEmail"),status=document.getElementById("loginStatus");
const email=input.value.trim();
if(!email){
setStatus(status,"warning","اكتب بريدك الإلكتروني في الحقل أعلاه أولًا، ثم اضغط «نسيت كلمة المرور؟».");
input.focus();return false}
if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){
setStatus(status,"error","صيغة البريد غير صحيحة. تأكد منها وأعد المحاولة.");
input.focus();return false}
const wait=Math.ceil((resetCooldownUntil-Date.now())/1000);
if(wait>0){
setStatus(status,"warning","أُرسل الرابط قبل قليل. يمكنك طلب رابط جديد بعد "+wait+" ثانية.");
return false}
setStatus(status,"loading","جارٍ إرسال رابط إعادة التعيين...");
auth.languageCode="ar";
auth.sendPasswordResetEmail(email).then(()=>{
resetCooldownUntil=Date.now()+60000;
setStatus(status,"success","تم إرسال رابط إعادة تعيين كلمة المرور إلى <bdi dir=\"ltr\">"+esc(email)+"</bdi>. افتح بريدك واتبع الرابط، وتحقق من مجلد الرسائل غير المرغوبة إن لم يصلك.")
}).catch(error=>{
let message="تعذر إرسال البريد. حاول مرة أخرى بعد قليل.";
if(error&&error.code==="auth/user-not-found")message="لا يوجد حساب بهذا البريد. تأكد منه أو أنشئ حسابًا جديدًا.";
if(error&&error.code==="auth/invalid-email")message="صيغة البريد غير صحيحة.";
if(error&&error.code==="auth/too-many-requests")message="محاولات كثيرة. انتظر قليلًا ثم أعد المحاولة.";
if(error&&error.code==="auth/network-request-failed")message="تعذر الاتصال بالإنترنت. تحقق من اتصالك.";
setStatus(status,"error",message)});
return false}

function renderAccount(){
const info=document.getElementById("accountInfo");
const status=document.getElementById("accountStatus");
const logoutButton=document.getElementById("logoutBtn");
const loginButton=document.getElementById("loginBtn");
const registerButton=document.getElementById("registerBtn");
const vipButton=document.getElementById("vipBtn");
const vipLink=document.getElementById("vipLink");
const deleteArea=document.getElementById("deleteAccountArea");

if(!currentUser){
info.innerHTML=`
<div class="account-row"><span>الحالة</span><strong>غير مسجل</strong></div>
<div class="account-row"><span>النوع</span><span class="badge-user">زائر</span></div>`;

logoutButton.hidden=true;
loginButton.hidden=false;
registerButton.hidden=false;
vipButton.hidden=true;
if(vipLink)vipLink.hidden=true;
if(deleteArea)deleteArea.hidden=true;

return;
}

const badge=currentRole==="admin"
?`<span class="badge-admin">أدمن</span>`
:currentVip
?`<span class="badge-vip">VIP</span>`
:`<span class="badge-user">مجاني</span>`;

info.innerHTML=`
<div class="account-row"><span>البريد</span><strong>${esc(currentUser.email||"—")}</strong></div>
<div class="account-row"><span>الاسم</span><strong>${esc(currentUser.displayName||"—")}</strong></div>
<div class="account-row"><span>النوع</span>${badge}</div>${vipDaysRow()}`;

logoutButton.hidden=false;
loginButton.hidden=true;
registerButton.hidden=true;
vipButton.hidden=isVip()&&!(vipDaysLeft()!==null&&vipDaysLeft()<=7);
vipButton.textContent=isVip()?"تجديد VIP":"ترقية VIP";
if(vipLink)vipLink.hidden=!isVip();
if(deleteArea)deleteArea.hidden=false;

const adminLink=document.getElementById("adminLink");
const adminLogout=document.getElementById("adminLogoutBtn");

adminLink.hidden=currentRole!=="admin";
adminLogout.hidden=currentRole!=="admin";
}

let deletingAccount=false;

function updateDeleteAccountVisibility(){
const area=document.getElementById("deleteAccountArea");
if(area)area.hidden=!auth.currentUser;
}

function openDeleteAccountDialog(){
const user=auth.currentUser;

if(!user){
location.hash="#/login";
return;
}

const providers=user.providerData.map(provider=>provider.providerId);
const usesPassword=providers.includes("password");
const usesGoogle=!usesPassword&&providers.includes("google.com");

document.getElementById("deleteConfirmation").value="";
document.getElementById("deletePassword").value="";
document.getElementById("deleteAccountStatus").textContent="";

document.getElementById("deletePasswordField").hidden=!usesPassword;
document.getElementById("deleteGoogleHint").hidden=!usesGoogle;

document.getElementById("deleteAccountDialog").showModal();
}

function closeDeleteAccountDialog(){
if(deletingAccount)return;

document.getElementById("deletePassword").value="";
document.getElementById("deleteAccountDialog").close();
}

document.getElementById("deleteAccountDialog").addEventListener("cancel",event=>{
if(deletingAccount)event.preventDefault();
});

document.getElementById("deleteAccountForm").addEventListener("submit",async event=>{
event.preventDefault();

if(deletingAccount)return;

const user=auth.currentUser;
const status=document.getElementById("deleteAccountStatus");

if(!user){
closeDeleteAccountDialog();
return;
}

if(document.getElementById("deleteConfirmation").value.trim()!=="حذف"){
status.textContent='اكتب كلمة "حذف" لتأكيد العملية.';
return;
}

deletingAccount=true;

document.getElementById("confirmDeleteBtn").disabled=true;
document.getElementById("cancelDeleteBtn").disabled=true;

try{
const providers=user.providerData.map(provider=>provider.providerId);

status.textContent="جارٍ التحقق من هويتك...";

if(providers.includes("password")){
const password=document.getElementById("deletePassword").value;

if(!password)throw new Error("أدخل كلمة مرور الحساب.");

const credential=firebase.auth.EmailAuthProvider.credential(user.email,password);
await user.reauthenticateWithCredential(credential);

}else if(providers.includes("google.com")){
await user.reauthenticateWithPopup(new firebase.auth.GoogleAuthProvider());

}else{
throw new Error("طريقة تسجيل الدخول هذه تحتاج مسار تحقق خاصًا.");
}

status.textContent="جارٍ حذف بيانات الحساب...";

await db.collection("users").doc(user.uid).delete();

status.textContent="جارٍ حذف حساب تسجيل الدخول...";

await user.delete();

document.getElementById("deletePassword").value="";
document.getElementById("deleteAccountDialog").close();

currentUser=null;
currentRole="user";
currentVip=false;

updateUserInterface(null);
renderAccount();
updateMenuVisibility();
updateDeleteAccountVisibility();

location.hash="#/login";

alert("تم حذف الحساب والبيانات الخاصة بك بنجاح.");

}catch(error){
const messages={
"auth/wrong-password":"كلمة المرور غير صحيحة.",
"auth/invalid-credential":"بيانات التحقق غير صحيحة.",
"auth/popup-closed-by-user":"أُغلقت نافذة التحقق؛ لم يُحذف الحساب.",
"auth/popup-blocked":"اسمح بالنوافذ المنبثقة ثم حاول مجددًا.",
"auth/requires-recent-login":"أعد تسجيل الدخول ثم حاول الحذف.",
"auth/network-request-failed":"تعذر الاتصال؛ تحقق من الإنترنت.",
"permission-denied":"لا تملك صلاحية حذف بيانات الحساب. راجع قواعد Firestore."
};

status.textContent=messages[error.code]||(error.code?"تعذر حذف الحساب. حاول مجددًا.":error.message);

}finally{
deletingAccount=false;

document.getElementById("confirmDeleteBtn").disabled=false;
document.getElementById("cancelDeleteBtn").disabled=false;
}
});

auth.onAuthStateChanged(()=>{
updateDeleteAccountVisibility();
});

let adminUser=null;

function renderAdminPanel(){
const status=document.getElementById("adminStatus");

if(currentRole!=="admin"){
document.getElementById("adminStats").innerHTML="";
document.getElementById("adminUsersList").innerHTML="";
return;
}

renderAdminStats();
loadAdminUsers();
}

function renderAdminStats(){
const stats=document.getElementById("adminStats");
const status=document.getElementById("adminStatus");

if(currentRole!=="admin"){
stats.innerHTML="";
return;
}

setStatus(status,"loading","جارٍ تحميل الإحصائيات...");

db.collection("users").limit(200).get()
.then(snapshot=>{
const total=snapshot.size;
let vipCount=0;
let adminCount=0;

snapshot.forEach(document=>{
const data=document.data();

if(data.role==="vip"||data.vipActive)vipCount++;
if(data.role==="admin")adminCount++;
});

stats.innerHTML=`
<span class="stat-chip">${icons.files}<strong>${total}</strong> مستخدم</span>
<span class="stat-chip">${icons.pages}<strong>${vipCount}</strong> VIP</span>
<span class="stat-chip">${icons.pdf}<strong>${adminCount}</strong> أدمن</span>`;

clearStatus(status);
})
.catch(error=>{
console.error("Firestore stats failed:", error);

setStatus(
status,
"error",
"تعذر تحميل الإحصائيات. تأكد من قواعد الأمان ومن أن حسابك أدمن."
);
});
}

function loadAdminUsers(){
const list=document.getElementById("adminUsersList");
const status=document.getElementById("adminStatus");

if(currentRole!=="admin"){
list.innerHTML="";
return;
}

setStatus(status,"loading","جارٍ تحميل المستخدمين...");

db.collection("users").limit(200).get()
.then(snapshot=>{
if(snapshot.empty){
list.innerHTML=`<p class="admin-empty">لا يوجد مستخدمون بعد.</p>`;
clearStatus(status);
return;
}

const users=[];

snapshot.forEach(document=>{
users.push({
id:document.id,
data:document.data()
});
});

users.sort((a,b)=>{
const dateA=a.data.createdAt?a.data.createdAt.toDate():new Date(0);
const dateB=b.data.createdAt?b.data.createdAt.toDate():new Date(0);
return dateB-dateA;
});

list.innerHTML="";

users.forEach(user=>{
const data=user.data;
const role=data.role||"user";

const badge=role==="admin"
?`<span class="badge-admin">أدمن</span>`
:data.vipActive
?`<span class="badge-vip">VIP</span>`
:`<span class="badge-user">مجاني</span>`;

const card=document.createElement("div");
card.className="user-card";

card.innerHTML=`
<div class="row"><span>البريد</span><strong>${esc(data.email||"غير متوفر")}</strong></div>
<div class="row"><span>الاسم</span><strong>${esc(data.displayName||"غير متوفر")}</strong></div>
<div class="row"><span>UID</span><strong>${esc(user.id)}</strong></div>
<div class="row"><span>النوع</span>${badge}</div>
<div class="row"><span>المدة</span><strong>${vipInfo(data)}</strong></div>
${vipActions(user.id)}`;

list.appendChild(card);
});

clearStatus(status);
})
.catch(error=>{
console.error("Firestore users load failed:", error);

setStatus(
status,
"error",
"تعذر تحميل المستخدمين. تأكد من قواعد الأمان ومن أن حسابك أدمن."
);
});
}

function adminSearchUser(){
const query=document.getElementById("adminSearch").value.trim();
const result=document.getElementById("adminResult");
const status=document.getElementById("adminStatus");

if(currentRole!=="admin"){
setStatus(status,"error","هذه الصفحة للأدمن فقط.");
return;
}

if(!query){
setStatus(status,"warning","أدخل بريدًا أو UID للبحث.");
return;
}

setStatus(status,"loading","جارٍ البحث...");

const isEmail=query.includes("@");
const collection=db.collection("users");

const promise=isEmail
?collection.where("email","==",query).get()
:collection.doc(query).get();

promise
.then(response=>{
const documents=isEmail?response.docs:[response];

if(!documents.length||!documents[0].exists){
setStatus(status,"warning","لا يوجد مستخدم بهذا البريد أو UID.");
result.innerHTML="";
return;
}

const document=documents[0];
const data=document.data();

adminUser=document;

const role=data.role||"user";
const badge=role==="admin"
?`<span class="badge-admin">أدمن</span>`
:data.vipActive
?`<span class="badge-vip">VIP</span>`
:`<span class="badge-user">مجاني</span>`;

result.innerHTML=`
<div class="user-card">
<div class="row"><span>البريد</span><strong>${esc(data.email||"غير متوفر")}</strong></div>
<div class="row"><span>الاسم</span><strong>${esc(data.displayName||"غير متوفر")}</strong></div>
<div class="row"><span>UID</span><strong>${esc(document.id)}</strong></div>
<div class="row"><span>النوع</span>${badge}</div>
<div class="row"><span>المدة</span><strong>${vipInfo(data)}</strong></div>
${vipActions(document.id)}
</div>`;

setStatus(status,"success","تم العثور على المستخدم.");
})
.catch(error=>{
console.error("Firestore search failed:", error);

setStatus(
status,
"error",
"تعذر البحث. تأكد من قواعد الأمان ومن أن حسابك أدمن."
);
});
}

function setVip(active,userId){
const status=document.getElementById("adminStatus");
const targetId=userId||(adminUser?adminUser.id:null);

if(currentRole!=="admin"){
setStatus(status,"error","هذه العملية للأدمن فقط.");
return;
}

if(!targetId){
setStatus(status,"warning","ابحث عن مستخدم أولًا.");
return;
}

setStatus(status,"loading","جارٍ التحديث...");

db.collection("users").doc(targetId).update({
vipActive:active,
role:active?"vip":"user",
vipUntil:null
})
.then(()=>{
setStatus(status,"success",active?"تم تفعيل VIP بنجاح.":"تم إلغاء VIP بنجاح.");
renderAdminPanel();
adminSearchUser();
})
.catch(error=>{
console.error("Firestore VIP update failed:", error);

setStatus(
status,
"error",
"تعذر التحديث. تأكد من قواعد الأمان ومن أن حسابك أدمن."
);
});
}

let workspaceFiles=[];

const workspaceInput=document.getElementById("wsInput");
const workspaceZone=document.getElementById("wsZone");
const workspaceGrid=document.getElementById("wsGrid");
const workspaceStats=document.getElementById("wsStats");
const workspaceStatus=document.getElementById("wsStatus");
const workspaceResult=document.getElementById("wsResult");
const workspaceProgressWrap=document.getElementById("wsProgressWrap");
const workspaceProgress=document.getElementById("wsProgress");
const workspaceProgressText=document.getElementById("wsProgressText");

setupZone("wsZone","wsInput",async files=>{
const accepted=[...files].filter(file=>["image/png","image/jpeg","application/pdf"].includes(file.type));

if(!accepted.length){
setStatus(workspaceStatus,"warning","أضف صور JPG/PNG أو ملفات PDF.");
return;
}

for(const file of accepted){
const item={
type:file.type==="application/pdf"?"pdf":"image",
file,
thumb:null,
pages:1
};

if(item.type==="pdf"){
try{
const data=await file.arrayBuffer();
const pdf=await pdfjsLib.getDocument({data}).promise;
item.pages=pdf.numPages;

const page=await pdf.getPage(1);
const viewport=page.getViewport({scale:.4});
const canvas=document.createElement("canvas");
canvas.width=viewport.width;
canvas.height=viewport.height;

await page.render({
canvasContext:canvas.getContext("2d"),
viewport
}).promise;

item.thumb=canvas.toDataURL();

}catch(error){
item.thumb=null;
}
}else{
item.thumb=await new Promise(resolve=>{
const reader=new FileReader();
reader.onload=()=>resolve(reader.result);
reader.readAsDataURL(file);
});
}

workspaceFiles.push(item);
}

renderWorkspace();
clearStatus(workspaceStatus);
});

function renderWorkspace(){
workspaceGrid.innerHTML="";

workspaceFiles.forEach((item,index)=>{
const card=document.createElement("div");
card.className="ws-card";

card.innerHTML=`
${item.type==="pdf"
?`<span class="ws-badge">PDF</span>`
:`<span class="ws-badge" style="background:#10b981">صورة</span>`}
<button class="ws-remove" onclick="removeWorkspaceFile(${index})">
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
</button>
${item.thumb
?`<img src="${item.thumb}">`
:`<div style="height:120px;display:grid;place-items:center;color:var(--text-3)">${icons.pdf}</div>`}
<span class="ws-name">${esc(item.file.name)}</span>
<span class="ws-size">${item.type==="pdf"?item.pages+" صفحة — ":""}${formatSize(item.file.size)}</span>`;

makeDraggable(card,(from,to)=>{
const moved=workspaceFiles.splice(from,1)[0];
workspaceFiles.splice(to,0,moved);
renderWorkspace();
});

workspaceGrid.appendChild(card);
});

updateWorkspaceStats();
}

function updateWorkspaceStats(){
const bar=document.getElementById("wsStats");

if(!workspaceFiles.length){
bar.hidden=true;
return;
}

const totalSize=workspaceFiles.reduce((total,item)=>total+item.file.size,0);
const totalPages=workspaceFiles.reduce((total,item)=>total+(item.type==="pdf"?item.pages:1),0);
const imageCount=workspaceFiles.filter(item=>item.type==="image").length;
const pdfCount=workspaceFiles.filter(item=>item.type==="pdf").length;

bar.hidden=false;

bar.innerHTML=`
<span class="stat-chip">${icons.files}<strong>${workspaceFiles.length}</strong> عنصر</span>
<span class="stat-chip">${icons.image}<strong>${imageCount}</strong> صورة</span>
<span class="stat-chip">${icons.pdf}<strong>${pdfCount}</strong> ملف PDF</span>
<span class="stat-chip">${icons.pages}<strong>${totalPages}</strong> صفحة متوقعة</span>
<span class="stat-chip">${icons.size}<strong>${formatSize(totalSize)}</strong> الحجم الكلي</span>`;
}

function removeWorkspaceFile(index){
workspaceFiles.splice(index,1);
renderWorkspace();

if(!workspaceFiles.length)clearWorkspace();
}

function clearWorkspace(){
workspaceFiles=[];
workspaceInput.value="";
workspaceGrid.innerHTML="";
workspaceStats.hidden=true;
workspaceResult.innerHTML="";
workspaceProgressWrap.hidden=true;
clearStatus(workspaceStatus);
}

async function exportWorkspace(){
if(!workspaceFiles.length){
setStatus(workspaceStatus,"warning","أضف صورة أو ملف PDF واحد على الأقل.");
return;
}

if(!canUseConversion()){
setStatus(workspaceStatus,"warning","وصلت إلى الحد اليومي (4 مرات). رقِّ حسابك إلى VIP للمزيد.");
return;
}

incrementDailyUsage();

setStatus(workspaceStatus,"loading","جارٍ تجهيز مساحة العمل...");
workspaceProgressWrap.hidden=false;
workspaceProgress.style.width="0%";

try{
const {PDFDocument}=PDFLib;
const output=await PDFDocument.create();
let completed=0;

for(const item of workspaceFiles){
workspaceProgressText.textContent=`جارٍ إضافة: ${esc(item.file.name)}`;

if(item.type==="image"){
const bytes=await item.file.arrayBuffer();
const image=item.file.type==="image/png"
?await output.embedPng(bytes)
:await output.embedJpg(bytes);

const page=output.addPage([image.width,image.height]);
page.drawImage(image,{x:0,y:0,width:image.width,height:image.height});

}else{
const bytes=await item.file.arrayBuffer();
const document=await PDFDocument.load(bytes);
const pages=await output.copyPages(document,document.getPageIndices());
pages.forEach(page=>output.addPage(page));
}

completed++;
workspaceProgress.style.width=(completed/workspaceFiles.length*100)+"%";
}

const bytes=await output.save();
const blob=new Blob([bytes],{type:"application/pdf"});

window.workspaceBlob=blob;

workspaceProgress.style.width="100%";
workspaceProgressText.textContent="اكتمل التصدير";

workspaceResult.innerHTML=`
<div class="pdf-ready">
<div class="big">${icons.pdf}</div>
<strong>تم إنشاء PDF من مساحة العمل</strong>
<span>${workspaceFiles.length} عنصر — ${formatSize(blob.size)}</span>
<div class="rename-box">
<label for="workspaceName">${icons.rename} اسم الملف</label>
<input type="text" id="workspaceName" value="workspace">
</div>
<button class="btn success" onclick="downloadWorkspace()">${icons.download} تحميل PDF</button>
</div>`;

setStatus(workspaceStatus,"success","اكتب اسم الملف ثم اضغط تحميل.");

}catch(error){
setStatus(workspaceStatus,"error","تعذر التصدير. قد يكون أحد ملفات PDF محميًا أو تالفًا.");
}
}

function downloadWorkspace(){
if(!window.workspaceBlob)return;

const name=safeName(document.getElementById("workspaceName")?.value,"workspace");
downloadBlob(window.workspaceBlob,name+".pdf");
}

let imageFiles=[];
let imagePdfUrl="";

const imageStatus=document.getElementById("imgStatus");

setupZone("imgZone","imgInput",files=>{
const accepted=[...files].filter(file=>["image/png","image/jpeg"].includes(file.type));

if(!accepted.length){
setStatus(imageStatus,"warning","أضف صور JPG أو PNG.");
return;
}

imageFiles=[...imageFiles,...accepted];
renderImageFiles();
clearStatus(imageStatus);
});

function renderImageFiles(){
const list=document.getElementById("imgList");
list.innerHTML="";

imageFiles.forEach((file,index)=>{
const item=document.createElement("div");
item.className="file-item";

item.innerHTML=`
<div class="file-info">
${icons.image}
<span class="file-name">${esc(file.name)}</span>
<span class="file-size">${formatSize(file.size)}</span>
</div>
<div class="move-buttons">
<button class="move-btn" onclick="moveImage(${index},-1)">${icons.up}</button>
<button class="move-btn" onclick="moveImage(${index},1)">${icons.down}</button>
<button class="remove-btn" onclick="removeImage(${index})">${icons.trash}</button>
</div>`;

makeDraggable(item,(from,to)=>{
const moved=imageFiles.splice(from,1)[0];
imageFiles.splice(to,0,moved);
renderImageFiles();
});

list.appendChild(item);
});

updateImageStats();
}

function updateImageStats(){
const bar=document.getElementById("imgStats");

if(!imageFiles.length){
bar.hidden=true;
return;
}

const totalSize=imageFiles.reduce((total,file)=>total+file.size,0);

bar.hidden=false;

bar.innerHTML=`
<span class="stat-chip">${icons.files}<strong>${imageFiles.length}</strong> صورة</span>
<span class="stat-chip">${icons.size}<strong>${formatSize(totalSize)}</strong> الحجم الكلي</span>`;
}

function moveImage(index,direction){
const next=index+direction;

if(next<0||next>=imageFiles.length)return;

[imageFiles[index],imageFiles[next]]=[imageFiles[next],imageFiles[index]];
renderImageFiles();
}

function removeImage(index){
imageFiles.splice(index,1);
renderImageFiles();

if(!imageFiles.length)clearImages();
}

function clearImages(){
imageFiles=[];
imagePdfUrl="";
document.getElementById("imgInput").value="";
document.getElementById("imgList").innerHTML="";
document.getElementById("imgResult").innerHTML="";
document.getElementById("imgStats").hidden=true;
clearStatus(imageStatus);
}

async function imagesToPdf(){
if(!canUseConversion()){
setStatus(imageStatus,"warning","وصلت إلى الحد اليومي (4 مرات). رقِّ حسابك إلى VIP للمزيد.");
return;
}

incrementDailyUsage();

if(!imageFiles.length){
setStatus(imageStatus,"warning","أضف صورة واحدة على الأقل.");
return;
}

setStatus(imageStatus,"loading","جارٍ إنشاء ملف PDF...");

try{
const {PDFDocument}=PDFLib;
const pdf=await PDFDocument.create();

for(const file of imageFiles){
const bytes=await file.arrayBuffer();
const image=file.type==="image/png"
?await pdf.embedPng(bytes)
:await pdf.embedJpg(bytes);

const page=pdf.addPage([image.width,image.height]);
page.drawImage(image,{x:0,y:0,width:image.width,height:image.height});
}

const bytes=await pdf.save();
const blob=new Blob([bytes],{type:"application/pdf"});

imagePdfUrl=URL.createObjectURL(blob);

document.getElementById("imgResult").innerHTML=`
<div class="pdf-ready">
<div class="big">${icons.pdf}</div>
<strong>تم إنشاء ملف PDF بنجاح</strong>
<span>${imageFiles.length} صورة — ${formatSize(blob.size)}</span>
<div class="rename-box">
<label for="imagePdfName">${icons.rename} اسم ملف PDF</label>
<input type="text" id="imagePdfName" value="images">
</div>
<button class="btn success" onclick="downloadImagePdf()">${icons.download} تحميل ملف PDF</button>
</div>`;

setStatus(imageStatus,"success","اكتب اسم الملف ثم اضغط تحميل.");

}catch(error){
setStatus(imageStatus,"error","تعذر إنشاء PDF. قد تكون إحدى الصور تالفة.");
}
}

function downloadImagePdf(){
if(!imagePdfUrl)return;

const name=safeName(document.getElementById("imagePdfName")?.value,"images");
const link=document.createElement("a");
link.href=imagePdfUrl;
link.download=name+".pdf";
link.click();
}

let generatedImages=[];

const pdfInput=document.getElementById("pdfInput");
const pdfStatus=document.getElementById("pdfStatus");
const pdfResult=document.getElementById("pdfResult");
const qualitySelect=document.getElementById("quality");

setupZone("pdfZone","pdfInput",files=>{
const file=files[0];

if(!file)return;

if(file.type!=="application/pdf"){
setStatus(pdfStatus,"warning","اختر ملف PDF.");
return;
}

const transfer=new DataTransfer();
transfer.items.add(file);
pdfInput.files=transfer.files;

showSelectedPdf();
});

pdfInput.addEventListener("change",showSelectedPdf);

function showSelectedPdf(){
const file=pdfInput.files[0];

if(!file){
clearPdf();
return;
}

document.getElementById("pdfFileName").textContent=file.name;
document.getElementById("pdfSelected").hidden=false;

setStatus(pdfStatus,"success","تم إضافة: "+file.name);
pdfResult.innerHTML="";
generatedImages=[];
}

function clearPdf(){
pdfInput.value="";
generatedImages=[];
clearStatus(pdfStatus);
pdfResult.innerHTML="";
document.getElementById("pdfSelected").hidden=true;
document.getElementById("pdfFileName").textContent="";
}

async function pdfToImages(){
if(!canUseConversion()){
setStatus(pdfStatus,"warning","وصلت إلى الحد اليومي (4 مرات). رقِّ حسابك إلى VIP للمزيد.");
return;
}

incrementDailyUsage();

const file=pdfInput.files[0];

if(!file){
setStatus(pdfStatus,"warning","اختر ملف PDF أولًا.");
return;
}

setStatus(pdfStatus,"loading","جارٍ قراءة ملف PDF...");

try{
const scale=Number(qualitySelect.value);
const data=await file.arrayBuffer();
const pdf=await pdfjsLib.getDocument({data}).promise;

generatedImages=[];

const title=document.createElement("div");
title.className="result-title";

title.innerHTML=`
<strong>الصور الناتجة</strong>
<div class="rename-box">
<label for="zipName">${icons.rename} اسم ملف ZIP</label>
<input type="text" id="zipName" value="pdf-images">
</div>
<span>${pdf.numPages} صفحة — جودة ${scale}x</span>`;

pdfResult.appendChild(title);

const grid=document.createElement("div");
grid.className="preview-grid";
pdfResult.appendChild(grid);

for(let index=1;index<=pdf.numPages;index++){
setStatus(pdfStatus,"loading",`جارٍ تحويل الصفحة ${index} من ${pdf.numPages}...`);

const page=await pdf.getPage(index);
const viewport=page.getViewport({scale});
const canvas=document.createElement("canvas");
canvas.width=viewport.width;
canvas.height=viewport.height;

await page.render({
canvasContext:canvas.getContext("2d"),
viewport
}).promise;

const dataUrl=canvas.toDataURL("image/png");

generatedImages.push({
name:`page-${index}.png`,
dataUrl
});

const box=document.createElement("div");
box.className="preview";

box.innerHTML=`
<img src="${dataUrl}">
<a href="${dataUrl}" download="page-${index}.png">${icons.download} صفحة ${index}</a>`;

grid.appendChild(box);
}

const zipButton=document.createElement("button");
zipButton.className="btn success";
zipButton.onclick=downloadImagesZip;
zipButton.innerHTML=`${icons.download} تحميل ${pdf.numPages} صورة ZIP`;

pdfResult.appendChild(zipButton);
setStatus(pdfStatus,"success",`تم تحويل ${pdf.numPages} صفحة بنجاح.`);

}catch(error){
setStatus(pdfStatus,"error","تعذر قراءة ملف PDF. قد يكون محميًا أو تالفًا.");
}
}

async function downloadImagesZip(){
if(!generatedImages.length)return;

setStatus(pdfStatus,"loading","جارٍ تحضير ملف ZIP...");

const name=safeName(document.getElementById("zipName")?.value,"pdf-images");
const zip=new JSZip();
const folder=zip.folder(name);

generatedImages.forEach(image=>{
folder.file(image.name,image.dataUrl.split(",")[1],{base64:true});
});

const blob=await zip.generateAsync({type:"blob"});
downloadBlob(blob,name+".zip");

setStatus(pdfStatus,"success","تم تحضير ملف ZIP بنجاح.");
}

let ocrFile=null;
let ocrText="";

const ocrStatus=document.getElementById("ocrStatus");
const ocrOutput=document.getElementById("ocrOutput");
const ocrOutputWrap=document.getElementById("ocrOutputWrap");
const ocrProgressWrap=document.getElementById("ocrProgressWrap");
const ocrProgress=document.getElementById("ocrProgress");
const ocrProgressText=document.getElementById("ocrProgressText");

setupZone("ocrZone","ocrInput",files=>{
const file=files[0];

if(!file)return;

if(!["image/png","image/jpeg","application/pdf"].includes(file.type)){
setStatus(ocrStatus,"warning","أضف صورة JPG/PNG أو ملف PDF.");
return;
}

ocrFile=file;
document.getElementById("ocrFileName").textContent=file.name;
document.getElementById("ocrSelected").hidden=false;

setStatus(ocrStatus,"success","تم إضافة: "+file.name);

ocrOutputWrap.hidden=true;
ocrOutput.value="";
ocrText="";

document.getElementById("copyOcr").hidden=true;
document.getElementById("downloadOcr").hidden=true;
});

function clearOcr(){
ocrFile=null;
ocrText="";
document.getElementById("ocrInput").value="";
document.getElementById("ocrSelected").hidden=true;
document.getElementById("ocrFileName").textContent="";
clearStatus(ocrStatus);
ocrOutputWrap.hidden=true;
ocrOutput.value="";
document.getElementById("copyOcr").hidden=true;
document.getElementById("downloadOcr").hidden=true;
ocrProgressWrap.hidden=true;
}

function setOcrProgress(percent,text){
ocrProgressWrap.hidden=false;
ocrProgress.style.width=percent+"%";
ocrProgressText.textContent=text;
}

async function extractText(){
if(!canUseConversion()){
setStatus(ocrStatus,"warning","وصلت إلى الحد اليومي (4 مرات). رقِّ حسابك إلى VIP للمزيد.");
return;
}

incrementDailyUsage();

if(!ocrFile){
setStatus(ocrStatus,"warning","أضف صورة أو ملف PDF أولًا.");
return;
}

if(typeof Tesseract==="undefined"){
setStatus(ocrStatus,"error","تعذر تحميل مكتبة OCR. تحقق من الإنترنت.");
return;
}

const language=document.getElementById("ocrLang").value;

setStatus(ocrStatus,"loading","جارٍ تحضير محرك القراءة...");

ocrOutputWrap.hidden=true;
ocrOutput.value="";
ocrText="";

document.getElementById("copyOcr").hidden=true;
document.getElementById("downloadOcr").hidden=true;

try{
let images=[];

if(ocrFile.type==="application/pdf"){
const data=await ocrFile.arrayBuffer();
const pdf=await pdfjsLib.getDocument({data}).promise;

for(let index=1;index<=pdf.numPages;index++){
setOcrProgress((index-1)/pdf.numPages*50,`تحويل الصفحة ${index} من ${pdf.numPages}...`);

const page=await pdf.getPage(index);
const viewport=page.getViewport({scale:2});
const canvas=document.createElement("canvas");
canvas.width=viewport.width;
canvas.height=viewport.height;

await page.render({
canvasContext:canvas.getContext("2d"),
viewport
}).promise;

images.push(canvas.toDataURL("image/png"));
}

}else{
const dataUrl=await new Promise(resolve=>{
const reader=new FileReader();
reader.onload=()=>resolve(reader.result);
reader.readAsDataURL(ocrFile);
});

images=[dataUrl];
}

let text="";

for(let index=0;index<images.length;index++){
setOcrProgress(50+(index/images.length)*50,`جارٍ قراءة الصفحة ${index+1} من ${images.length}...`);

const result=await Tesseract.recognize(images[index],language,{
logger:progress=>{
if(progress.status==="recognizing text"){
setOcrProgress(50+(index+progress.progress)/images.length*50,`قراءة الصفحة ${index+1}: ${Math.round(progress.progress*100)}%`);
}
}
});

text+=(text?"\\n\\n":"")+result.data.text.trim();
}

ocrText=text;
ocrOutput.value=text;
ocrOutputWrap.hidden=false;

document.getElementById("copyOcr").hidden=false;
document.getElementById("downloadOcr").hidden=false;

setOcrProgress(100,"اكتمل الاستخراج");
setStatus(ocrStatus,"success","تم استخراج النص بنجاح.");

}catch(error){
setStatus(ocrStatus,"error","تعذر استخراج النص. جرّب صورة أوضح أو ملف PDF نصيًا.");
}
}

function copyOcr(){
navigator.clipboard.writeText(ocrText)
.then(()=>setStatus(ocrStatus,"success","تم نسخ النص."));
}

function downloadOcr(){
if(!ocrText)return;

downloadBlob(new Blob([ocrText],{type:"text/plain;charset=utf-8"}),"extracted-text.txt");
}

async function textToPdf(){
if(!canUseConversion()){
setStatus(document.getElementById("ttpStatus"),"warning","وصلت إلى الحد اليومي (4 مرات). رقِّ حسابك إلى VIP للمزيد.");
return;
}

incrementDailyUsage();

const text=document.getElementById("ttpText").value.trim();
const status=document.getElementById("ttpStatus");

if(!text){
setStatus(status,"warning","اكتب نصًا أولًا.");
return;
}

setStatus(status,"loading","جارٍ إنشاء PDF...");

try{
const canvas=document.createElement("canvas");
const context=canvas.getContext("2d");
context.font="600 40px Cairo, sans-serif";

const lines=[];
text.split("\\n").forEach(paragraph=>{
const words=paragraph.split("\\s+");
let line="";

words.forEach(word=>{
const test=line?line+" "+word:word;

if(context.measureText(test).width>1000){
lines.push(line);
line=word;
}else{
line=test;
}
});

lines.push(line);
});

const pages=[];

for(let index=0;index<lines.length;index+=38){
pages.push(lines.slice(index,index+38));
}

const {PDFDocument}=PDFLib;
const pdf=await PDFDocument.create();

for(const part of pages){
const canvas=document.createElement("canvas");
canvas.width=1240;
canvas.height=1754;

const context=canvas.getContext("2d");
context.fillStyle="#ffffff";
context.fillRect(0,0,1240,1754);

context.fillStyle="#111827";
context.font="600 40px Cairo, sans-serif";
context.textAlign="right";
context.direction="rtl";

part.forEach((line,index)=>{
context.fillText(line,1160,120+index*58);
});

const png=await pdf.embedPng(canvas.toDataURL("image/png"));
const page=pdf.addPage([595,842]);
page.drawImage(png,{x:0,y:0,width:595,height:842});
}

const bytes=await pdf.save();
downloadBlob(new Blob([bytes],{type:"application/pdf"}),"text.pdf");

setStatus(status,"success","تم إنشاء ملف PDF وتحميله بنجاح.");

}catch(error){
setStatus(status,"error","تعذر إنشاء PDF. جرّب تقليل طول النص.");
}
}

let mergeFiles=[];

const mergeStatus=document.getElementById("mergeStatus");

setupZone("mergeZone","mergeInput",files=>{
const accepted=[...files].filter(file=>file.type==="application/pdf");

if(!accepted.length){
setStatus(mergeStatus,"warning","أضف ملفات PDF.");
return;
}

mergeFiles=[...mergeFiles,...accepted];
renderMergeFiles();
clearStatus(mergeStatus);
});

function renderMergeFiles(){
const list=document.getElementById("mergeList");
list.innerHTML="";

mergeFiles.forEach((file,index)=>{
const item=document.createElement("div");
item.className="file-item";

item.innerHTML=`
<div class="file-info">
${icons.pdf}
<span class="file-name">${esc(file.name)}</span>
<span class="file-size">${formatSize(file.size)}</span>
</div>
<div class="move-buttons">
<button class="move-btn" onclick="moveMergeFile(${index},-1)">${icons.up}</button>
<button class="move-btn" onclick="moveMergeFile(${index},1)">${icons.down}</button>
<button class="remove-btn" onclick="removeMergeFile(${index})">${icons.trash}</button>
</div>`;

makeDraggable(item,(from,to)=>{
const moved=mergeFiles.splice(from,1)[0];
mergeFiles.splice(to,0,moved);
renderMergeFiles();
});

list.appendChild(item);
});

updateMergeStats();
}

function updateMergeStats(){
const bar=document.getElementById("mergeStats");

if(!mergeFiles.length){
bar.hidden=true;
return;
}

const totalSize=mergeFiles.reduce((total,file)=>total+file.size,0);

bar.hidden=false;

bar.innerHTML=`
<span class="stat-chip">${icons.files}<strong>${mergeFiles.length}</strong> ملف PDF</span>
<span class="stat-chip">${icons.size}<strong>${formatSize(totalSize)}</strong> الحجم الكلي</span>`;
}

function moveMergeFile(index,direction){
const next=index+direction;

if(next<0||next>=mergeFiles.length)return;

[mergeFiles[index],mergeFiles[next]]=[mergeFiles[next],mergeFiles[index]];
renderMergeFiles();
}

function removeMergeFile(index){
mergeFiles.splice(index,1);
renderMergeFiles();

if(!mergeFiles.length)clearMerge();
}

function clearMerge(){
mergeFiles=[];
document.getElementById("mergeInput").value="";
document.getElementById("mergeList").innerHTML="";
document.getElementById("mergeResult").innerHTML="";
document.getElementById("mergeStats").hidden=true;
clearStatus(mergeStatus);
}

async function mergePdfs(){
if(mergeFiles.length<2){
setStatus(mergeStatus,"warning","أضف ملفي PDF على الأقل.");
return;
}

setStatus(mergeStatus,"loading","جارٍ دمج الملفات...");

try{
const {PDFDocument}=PDFLib;
const output=await PDFDocument.create();

for(const file of mergeFiles){
const bytes=await file.arrayBuffer();
const document=await PDFDocument.load(bytes);
const pages=await output.copyPages(document,document.getPageIndices());
pages.forEach(page=>output.addPage(page));
}

const bytes=await output.save();
const blob=new Blob([bytes],{type:"application/pdf"});

window.mergedBlob=blob;

document.getElementById("mergeResult").innerHTML=`
<div class="pdf-ready">
<div class="big">${icons.pdf}</div>
<strong>تم دمج الملفات بنجاح</strong>
<span>${mergeFiles.length} ملفات — ${formatSize(blob.size)}</span>
<div class="rename-box">
<label for="mergeName">${icons.rename} اسم الملف</label>
<input type="text" id="mergeName" value="merged">
</div>
<button class="btn success" onclick="downloadMergedPdf()">${icons.download} تحميل PDF</button>
</div>`;

setStatus(mergeStatus,"success","اكتب اسم الملف ثم حمّله.");

}catch(error){
setStatus(mergeStatus,"error","تعذر دمج الملفات. قد يكون أحد الملفات محميًا أو تالفًا.");
}
}

function downloadMergedPdf(){
if(!window.mergedBlob)return;

const name=safeName(document.getElementById("mergeName")?.value,"merged");
downloadBlob(window.mergedBlob,name+".pdf");
}

let splitFile=null;

const splitStatus=document.getElementById("splitStatus");

setupZone("splitZone","splitInput",files=>{
const file=files[0];

if(!file)return;

if(file.type!=="application/pdf"){
setStatus(splitStatus,"warning","اختر ملف PDF.");
return;
}

splitFile=file;

document.getElementById("splitFileName").textContent=file.name;
document.getElementById("splitSelected").hidden=false;

setStatus(splitStatus,"success","تم إضافة: "+file.name);
document.getElementById("splitResult").innerHTML="";
});

function clearSplit(){
splitFile=null;
document.getElementById("splitInput").value="";
document.getElementById("splitSelected").hidden=true;
document.getElementById("splitFileName").textContent="";
clearStatus(splitStatus);
document.getElementById("splitResult").innerHTML="";
}

function parsePages(input,total){
const parts=input.split(",").map(item=>item.trim()).filter(Boolean);
const pages=new Set();

parts.forEach(part=>{
if(part.includes("-")){
const [start,end]=part.split("-").map(Number);

if(!start||!end||start>end)return;

for(let index=start;index<=Math.min(end,total);index++){
pages.add(index-1);
}

}else{
const number=Number(part);

if(number>=1&&number<=total){
pages.add(number-1);
}
}
});

return [...pages].sort((a,b)=>a-b);
}

async function splitPdf(){
if(!splitFile){
setStatus(splitStatus,"warning","أضف ملف PDF أولًا.");
return;
}

const input=document.getElementById("pagesInput").value.trim();

if(!input){
setStatus(splitStatus,"warning","اكتب الصفحات المطلوبة.");
return;
}

setStatus(splitStatus,"loading","جارٍ الاستخراج...");

try{
const {PDFDocument}=PDFLib;
const source=await PDFDocument.load(await splitFile.arrayBuffer());
const total=source.getPageCount();
const indices=parsePages(input,total);

if(!indices.length){
setStatus(splitStatus,"warning","لا توجد صفحات صحيحة.");
return;
}

const output=await PDFDocument.create();
const pages=await output.copyPages(source,indices);
pages.forEach(page=>output.addPage(page));

const bytes=await output.save();
const blob=new Blob([bytes],{type:"application/pdf"});

window.splitBlob=blob;

document.getElementById("splitResult").innerHTML=`
<div class="pdf-ready">
<div class="big">${icons.pdf}</div>
<strong>تم استخراج ${indices.length} صفحة</strong>
<span>الحجم: ${formatSize(blob.size)}</span>
<div class="rename-box">
<label for="splitName">${icons.rename} اسم الملف</label>
<input type="text" id="splitName" value="extracted-pages">
</div>
<button class="btn success" onclick="downloadSplitPdf()">${icons.download} تحميل PDF</button>
</div>`;

setStatus(splitStatus,"success","اكتب اسم الملف ثم حمّله.");

}catch(error){
setStatus(splitStatus,"error","تعذر قراءة ملف PDF. قد يكون محميًا أو تالفًا.");
}
}

function downloadSplitPdf(){
if(!window.splitBlob)return;

const name=safeName(document.getElementById("splitName")?.value,"extracted-pages");
downloadBlob(window.splitBlob,name+".pdf");
}

let editPdfBytes=null;
let editPagesState=[];

const editStatus=document.getElementById("editStatus");

setupZone("editZone","editInput",async files=>{
const file=files[0];

if(!file)return;

if(file.type!=="application/pdf"){
setStatus(editStatus,"warning","اختر ملف PDF.");
return;
}

document.getElementById("editFileName").textContent=file.name;
document.getElementById("editSelected").hidden=false;

setStatus(editStatus,"loading","جارٍ قراءة الصفحات...");

editPdfBytes=await file.arrayBuffer();
await renderEditPages();
});

async function renderEditPages(){
try{
const pdf=await pdfjsLib.getDocument({data:editPdfBytes.slice(0)}).promise;

editPagesState=Array.from({length:pdf.numPages},(_,index)=>({
index,
rotation:0,
deleted:false,
thumb:null
}));

const grid=document.getElementById("editPages");
grid.innerHTML="";

for(let index=0;index<pdf.numPages;index++){
const page=await pdf.getPage(index+1);
const viewport=page.getViewport({scale:.35});
const canvas=document.createElement("canvas");
canvas.width=viewport.width;
canvas.height=viewport.height;

await page.render({
canvasContext:canvas.getContext("2d"),
viewport
}).promise;

editPagesState[index].thumb=canvas.toDataURL();
}

renderEditPagesKeep();
setStatus(editStatus,"success","اختر الصفحات ثم دوّرها أو احذفها.");
updateEditStats();

}catch(error){
setStatus(editStatus,"error","تعذر قراءة ملف PDF. قد يكون محميًا أو تالفًا.");
}
}

function renderEditPagesKeep(){
const grid=document.getElementById("editPages");
grid.innerHTML="";

editPagesState.forEach((state,index)=>{
const card=document.createElement("div");
card.className="page-card";
card.dataset.index=index;

card.innerHTML=`
<img src="${state.thumb}">
<span class="num">صفحة ${index+1}</span>`;

if(state.rotation){
const rotation=document.createElement("span");
rotation.className="rot";
rotation.textContent=state.rotation+"°";
card.appendChild(rotation);
}

if(state.deleted){
card.style.opacity=".3";
card.style.pointerEvents="none";
}

card.onclick=()=>card.classList.toggle("selected");

makeDraggable(card,(from,to)=>{
const moved=editPagesState.splice(from,1)[0];
editPagesState.splice(to,0,moved);
renderEditPagesKeep();
});

grid.appendChild(card);
});

updateEditStats();
}

function updateEditStats(){
const bar=document.getElementById("editStats");

if(!editPagesState.length){
bar.hidden=true;
return;
}

const kept=editPagesState.filter(state=>!state.deleted).length;

bar.hidden=false;

bar.innerHTML=`
<span class="stat-chip">${icons.pages}<strong>${editPagesState.length}</strong> صفحة في الملف</span>
<span class="stat-chip">${icons.files}<strong>${kept}</strong> صفحة ستُصدّر</span>`;
}

function clearEdit(){
editPdfBytes=null;
editPagesState=[];
document.getElementById("editInput").value="";
document.getElementById("editSelected").hidden=true;
document.getElementById("editFileName").textContent="";
document.getElementById("editPages").innerHTML="";
document.getElementById("editStats").hidden=true;
clearStatus(editStatus);
document.getElementById("editResult").innerHTML="";
}

function getSelectedPageIndices(){
return [...document.querySelectorAll(".page-card.selected")].map(card=>Number(card.dataset.index));
}

function rotateSelectedPages(degrees){
const selected=getSelectedPageIndices();

if(!selected.length){
setStatus(editStatus,"warning","اختر صفحة واحدة على الأقل.");
return;
}

selected.forEach(index=>{
editPagesState[index].rotation=(editPagesState[index].rotation+degrees)%360;
});

renderEditPagesKeep();
setStatus(editStatus,"success","تم تدوير الصفحات المحددة.");
}

function deleteSelectedPages(){
const selected=getSelectedPageIndices();

if(!selected.length){
setStatus(editStatus,"warning","اختر صفحة واحدة على الأقل.");
return;
}

selected.forEach(index=>{
editPagesState[index].deleted=true;
});

renderEditPagesKeep();
setStatus(editStatus,"success","تم تحديد الصفحات المحذوفة.");
}

async function exportEditedPdf(){
if(!editPdfBytes){
setStatus(editStatus,"warning","أضف ملف PDF أولًا.");
return;
}

setStatus(editStatus,"loading","جارٍ تصدير PDF...");

try{
const {PDFDocument,degrees}=PDFLib;
const source=await PDFDocument.load(editPdfBytes.slice(0));
const output=await PDFDocument.create();

const kept=editPagesState.filter(state=>!state.deleted);

if(!kept.length){
setStatus(editStatus,"warning","جميع الصفحات محذوفة.");
return;
}

const pages=await output.copyPages(source,kept.map(state=>state.index));

pages.forEach((page,index)=>{
const rotation=kept[index].rotation;

if(rotation)page.setRotation(degrees(rotation));
output.addPage(page);
});

const bytes=await output.save();
downloadBlob(new Blob([bytes],{type:"application/pdf"}),"edited.pdf");

setStatus(editStatus,"success","تم تصدير PDF جديد بنجاح.");

}catch(error){
setStatus(editStatus,"error","تعذر تصدير الملف. جرّب تقليل عدد الصفحات.");
}
}

let watermarkFile=null;

const watermarkStatus=document.getElementById("wmStatus");

setupZone("wmZone","wmInput",files=>{
const file=files[0];

if(!file)return;

if(!["image/png","image/jpeg","application/pdf"].includes(file.type)){
setStatus(watermarkStatus,"warning","أضف صورة أو ملف PDF.");
return;
}

watermarkFile=file;

document.getElementById("wmFileName").textContent=file.name;
document.getElementById("wmSelected").hidden=false;

setStatus(watermarkStatus,"success","تم إضافة: "+file.name);
document.getElementById("wmResult").innerHTML="";
});

function clearWatermark(){
watermarkFile=null;
document.getElementById("wmInput").value="";
document.getElementById("wmSelected").hidden=true;
document.getElementById("wmFileName").textContent="";
clearStatus(watermarkStatus);
document.getElementById("wmResult").innerHTML="";
}

async function createTransparentWatermark(text,opacity){
const canvas=document.createElement("canvas");
canvas.width=1200;
canvas.height=400;

const context=canvas.getContext("2d");
context.clearRect(0,0,canvas.width,canvas.height);

context.globalAlpha=opacity;
context.fillStyle="#ffffff";
context.font="bold 90px Cairo, sans-serif";
context.textAlign="center";
context.textBaseline="middle";

context.translate(canvas.width/2,canvas.height/2);
context.rotate(-Math.PI/6);
context.fillText(text,0,0);

return canvas.toDataURL("image/png");
}

async function addWatermark(){
if(!watermarkFile){
setStatus(watermarkStatus,"warning","أضف صورة أو ملف PDF أولًا.");
return;
}

const text=document.getElementById("wmText").value.trim();

if(!text){
setStatus(watermarkStatus,"warning","اكتب نص العلامة المائية.");
return;
}

const opacity=Number(document.getElementById("wmOpacity").value);

setStatus(watermarkStatus,"loading","جارٍ إضافة العلامة المائية...");

try{
if(watermarkFile.type==="application/pdf"){
const {PDFDocument}=PDFLib;
const pngDataUrl=await createTransparentWatermark(text,opacity);
const pngBytes=await (await fetch(pngDataUrl)).arrayBuffer();

const pdf=await PDFDocument.load(await watermarkFile.arrayBuffer());
const image=await pdf.embedPng(pngBytes);

pdf.getPages().forEach(page=>{
const width=page.getWidth();
const height=page.getHeight();
const imageWidth=width*.8;
const imageHeight=imageWidth*(image.height/image.width);

page.drawImage(image,{
x:(width-imageWidth)/2,
y:(height-imageHeight)/2,
width:imageWidth,
height:imageHeight
});
});

const bytes=await pdf.save();
downloadBlob(new Blob([bytes],{type:"application/pdf"}),"watermarked.pdf");

setStatus(watermarkStatus,"success","تم إضافة العلامة المائية وتحميل PDF.");

}else{
const dataUrl=await new Promise(resolve=>{
const reader=new FileReader();
reader.onload=()=>resolve(reader.result);
reader.readAsDataURL(watermarkFile);
});

const image=await new Promise(resolve=>{
const element=new Image();
element.onload=()=>resolve(element);
element.src=dataUrl;
});

const canvas=document.createElement("canvas");
canvas.width=image.width;
canvas.height=image.height;

const context=canvas.getContext("2d");
context.drawImage(image,0,0);

context.globalAlpha=opacity;
context.fillStyle="#fff";
context.font=`bold ${Math.round(image.width/16)}px Cairo, sans-serif`;

context.translate(canvas.width/2,canvas.height/2);
context.rotate(-Math.PI/6);
context.textAlign="center";
context.textBaseline="middle";
context.fillText(text,0,0);

const output=canvas.toDataURL("image/png");

document.getElementById("wmResult").innerHTML=`
<div class="preview-grid">
<div class="preview">
<img src="${output}">
<a href="${output}" download="watermarked.png">${icons.download} تحميل الصورة</a>
</div>
</div>`;

setStatus(watermarkStatus,"success","تم إضافة العلامة المائية بنجاح.");
}

}catch(error){
setStatus(watermarkStatus,"error","تعذر إضافة العلامة المائية.");
}
}

let compressFiles=[];
let compressedImages=[];

const compressStatus=document.getElementById("compressStatus");

setupZone("compressZone","compressInput",files=>{
const accepted=[...files].filter(file=>["image/png","image/jpeg"].includes(file.type));

if(!accepted.length){
setStatus(compressStatus,"warning","أضف صور JPG أو PNG.");
return;
}

compressFiles=[...compressFiles,...accepted];
renderCompressFiles();
clearStatus(compressStatus);
});

function renderCompressFiles(){
const list=document.getElementById("compressList");
list.innerHTML="";

compressFiles.forEach((file,index)=>{
const item=document.createElement("div");
item.className="file-item";

item.innerHTML=`
<div class="file-info">
${icons.image}
<span class="file-name">${esc(file.name)}</span>
<span class="file-size">${formatSize(file.size)}</span>
</div>
<button class="remove-btn" onclick="removeCompressFile(${index})">${icons.trash}</button>`;

list.appendChild(item);
});
}

function removeCompressFile(index){
compressFiles.splice(index,1);
renderCompressFiles();

if(!compressFiles.length)clearCompress();
}

function clearCompress(){
compressFiles=[];
compressedImages=[];
document.getElementById("compressInput").value="";
document.getElementById("compressList").innerHTML="";
document.getElementById("compressResult").innerHTML="";
clearStatus(compressStatus);
}

async function compressImages(){
if(!compressFiles.length){
setStatus(compressStatus,"warning","أضف صورة واحدة على الأقل.");
return;
}

const quality=Number(document.getElementById("compressLevel").value);

setStatus(compressStatus,"loading","جارٍ ضغط الصور...");

document.getElementById("compressResult").innerHTML="";
compressedImages=[];

const grid=document.createElement("div");
grid.className="preview-grid";
document.getElementById("compressResult").appendChild(grid);

for(const file of compressFiles){
setStatus(compressStatus,"loading",`جارٍ ضغط: ${esc(file.name)}`);

const dataUrl=await new Promise(resolve=>{
const reader=new FileReader();
reader.onload=()=>resolve(reader.result);
reader.readAsDataURL(file);
});

const image=await new Promise(resolve=>{
const element=new Image();
element.onload=()=>resolve(element);
element.src=dataUrl;
});

const canvas=document.createElement("canvas");
canvas.width=image.width;
canvas.height=image.height;

canvas.getContext("2d").drawImage(image,0,0);

const output=canvas.toDataURL("image/jpeg",quality);

compressedImages.push({
name:file.name.replace(/\\.[^.]+$/,"")+"-compressed.jpg",
dataUrl:output
});

const blob=await (await fetch(output)).blob();
const box=document.createElement("div");
box.className="preview";

box.innerHTML=`
<img src="${output}">
<div class="sizes">${formatSize(file.size)} ← ${formatSize(blob.size)}</div>
<button class="link" onclick="downloadCompressedImage(${compressedImages.length-1})">${icons.download} تحميل</button>`;

grid.appendChild(box);
}

const zipButton=document.createElement("button");
zipButton.className="btn success";
zipButton.onclick=downloadCompressedZip;
zipButton.innerHTML=`${icons.download} تحميل كل الصور ZIP`;

document.getElementById("compressResult").appendChild(zipButton);
setStatus(compressStatus,"success",`تم ضغط ${compressFiles.length} صورة بنجاح.`);
}

function downloadCompressedImage(index){
const image=compressedImages[index];
const link=document.createElement("a");
link.href=image.dataUrl;
link.download=image.name;
link.click();
}

async function downloadCompressedZip(){
if(!compressedImages.length)return;

setStatus(compressStatus,"loading","جارٍ تحضير ملف ZIP...");

const zip=new JSZip();
const folder=zip.folder("compressed-images");

compressedImages.forEach(image=>{
folder.file(image.name,image.dataUrl.split(",")[1],{base64:true});
});

const blob=await zip.generateAsync({type:"blob"});
downloadBlob(blob,"compressed-images.zip");

setStatus(compressStatus,"success","تم تحضير ملف ZIP بنجاح.");
}

let currentPassword="";

const passwordStatus=document.getElementById("passStatus");

function generatePassword(){
const length=Math.min(64,Math.max(6,Number(document.getElementById("passLength").value)||16));

let characters="abcdefghijklmnopqrstuvwxyz";

if(document.getElementById("passUpper").checked)characters+="ABCDEFGHIJKLMNOPQRSTUVWXYZ";
if(document.getElementById("passNumbers").checked)characters+="0123456789";
if(document.getElementById("passSymbols").checked)characters+="!@#$%^&*()-_=+[]{};:,.<>?";

if(!characters){
setStatus(passwordStatus,"warning","اختر نوعًا واحدًا على الأقل.");
return;
}

const random=new Uint32Array(length);
crypto.getRandomValues(random);

currentPassword=[...random].map(value=>characters[value%characters.length]).join("");

const result=document.getElementById("passResult");
result.textContent=currentPassword;
result.hidden=false;

document.getElementById("copyPass").hidden=false;
setStatus(passwordStatus,"success","تم إنشاء كلمة مرور قوية.");
}

function copyPassword(){
navigator.clipboard.writeText(currentPassword)
.then(()=>setStatus(passwordStatus,"success","تم نسخ كلمة المرور."));
}

document.getElementById("counterText").addEventListener("input",event=>{
const text=event.target.value;
const words=text.trim()?text.trim().split("\\s+").length:0;

document.getElementById("wordsCount").textContent=words;
document.getElementById("charsCount").textContent=text.length;
document.getElementById("linesCount").textContent=text?text.split("\\n").length:0;
document.getElementById("sentencesCount").textContent=text.trim()?(text.match(/[.!?؟]+/g)||[]).length:0;
});

let qrDataUrl="";

const qrStatus=document.getElementById("qrStatus");

function generateQr(){
const text=document.getElementById("qrText").value.trim();
const size=Number(document.getElementById("qrSize").value);
const color=document.getElementById("qrColor").value;

if(typeof QRCode==="undefined"){
setStatus(qrStatus,"error","تعذر تحميل مكتبة QR.");
return;
}

if(!text){
setStatus(qrStatus,"warning","اكتب رابطًا أو نصًا أولًا.");
return;
}

setStatus(qrStatus,"loading","جارٍ إنشاء رمز QR...");

document.getElementById("qrResult").innerHTML="";
document.getElementById("qrDownload").hidden=true;
qrDataUrl="";

try{
const holder=document.createElement("div");
holder.className="qr-box";
document.getElementById("qrResult").appendChild(holder);

new QRCode(holder,{
text,
width:size,
height:size,
colorDark:color,
colorLight:"#ffffff",
correctLevel:QRCode.CorrectLevel.H
});

setTimeout(()=>{
const canvas=holder.querySelector("canvas");
const image=holder.querySelector("img");

qrDataUrl=canvas?canvas.toDataURL("image/png"):(image?.src||"");

if(qrDataUrl){
document.getElementById("qrDownload").hidden=false;
setStatus(qrStatus,"success","تم إنشاء رمز QR بنجاح.");
}else{
setStatus(qrStatus,"error","تعذر إنشاء رمز QR.");
}
},80);

}catch(error){
setStatus(qrStatus,"error","حدث خطأ أثناء إنشاء رمز QR.");
}
}

function downloadQr(){
if(!qrDataUrl)return;

const link=document.createElement("a");
link.href=qrDataUrl;
link.download="qr-code.png";
link.click();
}

let wifiQrUrl="";

const wifiStatus=document.getElementById("wifiStatus");

function generateWifiQr(){
const ssid=document.getElementById("wifiSsid").value.trim();
const password=document.getElementById("wifiPass").value;
const encryption=document.getElementById("wifiEnc").value;
const result=document.getElementById("wifiResult");
const button=document.getElementById("wifiDownload");

if(typeof QRCode==="undefined"){
setStatus(wifiStatus,"error","تعذر تحميل مكتبة QR.");
return;
}

if(!ssid){
setStatus(wifiStatus,"warning","اكتب اسم الشبكة.");
return;
}

let text=`WIFI:T:WPA;S:${ssid};`;

if(encryption!=="nopass"){
if(!password){
setStatus(wifiStatus,"warning","اكتب كلمة مرور الشبكة.");
return;
}

text+=`P:${password};`;
}

text+="H:false;;";

setStatus(wifiStatus,"loading","جارٍ إنشاء رمز QR...");

result.innerHTML="";
button.hidden=true;
wifiQrUrl="";

try{
const holder=document.createElement("div");
holder.className="qr-box";
result.appendChild(holder);

new QRCode(holder,{
text,
width:400,
height:400,
colorDark:"#0b1020",
colorLight:"#ffffff",
correctLevel:QRCode.CorrectLevel.H
});

setTimeout(()=>{
const canvas=holder.querySelector("canvas");
const image=holder.querySelector("img");

wifiQrUrl=canvas?canvas.toDataURL("image/png"):(image?.src||"");

if(wifiQrUrl){
button.hidden=false;
setStatus(wifiStatus,"success","تم إنشاء رمز QR بنجاح.");
}else{
setStatus(wifiStatus,"error","تعذر إنشاء رمز QR.");
}
},80);

}catch(error){
setStatus(wifiStatus,"error","حدث خطأ أثناء إنشاء رمز QR.");
}
}

function downloadWifiQr(){
if(!wifiQrUrl)return;

const link=document.createElement("a");
link.href=wifiQrUrl;
link.download="wifi-qr.png";
link.click();
}

/* ===== تحويل الامتدادات (VIP فقط) ===== */

/* ===== محرك التحويل: يعمل كله داخل المتصفح بلا رفع للملفات ===== */
const IMGS=["jpg","png","webp","gif","bmp","svg"],SHEETS=["xlsx","xls","ods","csv"],AUDS=["mp3","ogg","m4a","flac"];
/* فقط الاتجاهات المنطقية التي تعمل محليًا داخل المتصفح */
const CONV_MAP={
jpg:["png","webp","pdf"],png:["jpg","webp","pdf"],webp:["jpg","png","pdf"],
gif:["png","jpg","webp","pdf"],bmp:["png","jpg","webp","pdf"],svg:["png","jpg","webp","pdf"],
pdf:["png","jpg","webp","txt"],
docx:["pdf","txt","html"],pptx:["pdf","txt"],
xlsx:["csv","ods","pdf"],xls:["xlsx","csv","pdf"],ods:["xlsx","csv","pdf"],csv:["xlsx","pdf"],
txt:["pdf","docx"],md:["html","pdf"],html:["pdf","txt"],
mp3:["wav"],ogg:["wav"],m4a:["wav"],flac:["wav"]
};
const EXT_ALIAS={jpeg:"jpg",htm:"html",markdown:"md"};
const MIME={jpg:"image/jpeg",png:"image/png",webp:"image/webp"};
const escH=s=>s.replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));
let converterFile=null;

function loadImg(file){return new Promise((ok,no)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=()=>no(new Error("تعذر قراءة الصورة."));i.src=URL.createObjectURL(file)})}
async function toCanvas(file,w,white){
const i=await loadImg(file),nw=i.naturalWidth||800,nh=i.naturalHeight||600,W=w||nw,H=Math.round(W*nh/nw);
const c=document.createElement("canvas");c.width=W;c.height=H;const x=c.getContext("2d");
if(white){x.fillStyle="#fff";x.fillRect(0,0,W,H)}
x.drawImage(i,0,0,W,H);return c}
const canvasBlob=(c,type,q)=>new Promise(r=>c.toBlob(r,type,q));
function saveBlob(blob,name){const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;a.click()}
function downloadConvertedFile(url,name){const a=document.createElement("a");a.href=url;a.download=name;a.click()}

function bmpBlob(c){
const w=c.width,h=c.height,d=c.getContext("2d").getImageData(0,0,w,h).data,sz=w*h*4,v=new DataView(new ArrayBuffer(54+sz));
v.setUint16(0,0x4d42);v.setUint32(2,54+sz,true);v.setUint32(10,54,true);v.setUint32(14,40,true);
v.setInt32(18,w,true);v.setInt32(22,-h,true);v.setUint16(26,1,true);v.setUint16(28,32,true);v.setUint32(34,sz,true);
for(let i=0,o=54;i<d.length;i+=4,o+=4){v.setUint8(o,d[i+2]);v.setUint8(o+1,d[i+1]);v.setUint8(o+2,d[i]);v.setUint8(o+3,d[i+3])}
return new Blob([v],{type:"image/bmp"})}

async function toWav(f){
const ac=new(window.AudioContext||window.webkitAudioContext)();
const b=await ac.decodeAudioData(await f.arrayBuffer());ac.close();
const ch=b.numberOfChannels,len=b.length*ch*2,v=new DataView(new ArrayBuffer(44+len));
const w=(o,s)=>[...s].forEach((c,i)=>v.setUint8(o+i,c.charCodeAt(0)));
w(0,"RIFF");v.setUint32(4,36+len,true);w(8,"WAVEfmt ");v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,ch,true);
v.setUint32(24,b.sampleRate,true);v.setUint32(28,b.sampleRate*ch*2,true);v.setUint16(32,ch*2,true);v.setUint16(34,16,true);w(36,"data");v.setUint32(40,len,true);
const d=[...Array(ch).keys()].map(i=>b.getChannelData(i));let o=44;
for(let i=0;i<b.length;i++)for(let c=0;c<ch;c++){const s=Math.max(-1,Math.min(1,d[c][i]));v.setInt16(o,s<0?s*32768:s*32767,true);o+=2}
return new Blob([v],{type:"audio/wav"})}

async function convTextToPdf(text){
await document.fonts.load("30px 'IBM Plex Sans Arabic'");
const W=1240,H=1754,M=110,LH=48,rtl=/[\u0600-\u06FF]/.test(text),font="30px 'IBM Plex Sans Arabic',sans-serif";
const doc=await PDFLib.PDFDocument.create(),cv=document.createElement("canvas");cv.width=W;cv.height=H;
const x=cv.getContext("2d");x.font=font;const lines=[];
text.split(/\r?\n/).forEach(p=>{if(!p.trim()){lines.push("");return}let cur="";
p.split(/\s+/).forEach(w=>{const t=cur?cur+" "+w:w;if(x.measureText(t).width>W-2*M&&cur){lines.push(cur);cur=w}else cur=t});lines.push(cur)});
const per=Math.floor((H-2*M)/LH);
for(let i=0;i<Math.max(1,lines.length);i+=per){
x.fillStyle="#fff";x.fillRect(0,0,W,H);x.fillStyle="#14151c";x.font=font;x.textBaseline="top";
x.direction=rtl?"rtl":"ltr";x.textAlign=rtl?"right":"left";
lines.slice(i,i+per).forEach((l,k)=>x.fillText(l,rtl?W-M:M,M+k*LH));
const im=await doc.embedJpg(cv.toDataURL("image/jpeg",.92));
doc.addPage([595,842]).drawImage(im,{x:0,y:0,width:595,height:842})}
return new Blob([await doc.save()],{type:"application/pdf"})}

async function makeDocx(text){
const rtl=/[\u0600-\u06FF]/.test(text),X=s=>escH(s);
const ps=text.split(/\r?\n/).map(l=>`<w:p>${rtl?"<w:pPr><w:bidi/></w:pPr>":""}<w:r>${rtl?"<w:rPr><w:rtl/></w:rPr>":""}<w:t xml:space="preserve">${X(l)}</w:t></w:r></w:p>`).join("");
const h='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',z=new JSZip();
z.file("[Content_Types].xml",h+'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
z.file("_rels/.rels",h+'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
z.file("word/document.xml",h+`<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${ps}</w:body></w:document>`);
return z.generateAsync({type:"blob",mimeType:"application/vnd.openxmlformats-officedocument.wordprocessingml.document"})}

const md2html=t=>{const f=s=>s.replace(/\*\*(.+?)\*\*/g,"<b>$1</b>").replace(/\*(.+?)\*/g,"<i>$1</i>").replace(/`(.+?)`/g,"<code>$1</code>").replace(/\[(.+?)\]\((.+?)\)/g,'<a href="$2">$1</a>');
return escH(t).split(/\n{2,}/).map(b=>{const m=b.match(/^(#{1,6})\s+([\s\S]*)$/);return m?`<h${m[1].length}>${f(m[2])}</h${m[1].length}>`:`<p>${f(b).replace(/\n/g,"<br>")}</p>`}).join("\n")};
const html2md=h=>h.replace(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi,(_,n,t)=>"#".repeat(n)+" "+t+"\n\n").replace(/<(strong|b)>([\s\S]*?)<\/\1>/gi,"**$2**").replace(/<(em|i)>([\s\S]*?)<\/\1>/gi,"*$2*").replace(/<a [^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi,"[$2]($1)").replace(/<li[^>]*>/gi,"- ").replace(/<\/(p|li|div)>|<br\s*\/?>/gi,"\n").replace(/<[^>]+>/g,"").replace(/&nbsp;/g," ").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&amp;/g,"&").replace(/\n{3,}/g,"\n\n").trim();

const readWb=async(f,from)=>from==="csv"?XLSX.read(await f.text(),{type:"string"}):XLSX.read(await f.arrayBuffer(),{type:"array"});
async function cvText(f,from){
if(from==="pdf"){
pdfjsLib.GlobalWorkerOptions.workerSrc=pdfjsLib.GlobalWorkerOptions.workerSrc||"https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
const pdf=await pdfjsLib.getDocument({data:await f.arrayBuffer()}).promise,out=[];
for(let i=1;i<=pdf.numPages;i++){const t=await(await pdf.getPage(i)).getTextContent();out.push(t.items.map(s=>s.str).join(" "))}
const all=out.join("\n\n").trim();
if(!all)throw new Error("لا يحتوي الملف على نص قابل للاستخراج (ربما هو ممسوح ضوئيًا). جرّب أداة OCR.");
return all}
if(from==="pptx")return (await pptxSlides(f)).map((s,i)=>`— ${i+1} —\n`+s.join("\n")).join("\n\n");
if(from==="docx")return (await mammoth.extractRawText({arrayBuffer:await f.arrayBuffer()})).value;
if(SHEETS.includes(from)){const wb=await readWb(f,from);return XLSX.utils.sheet_to_csv(wb.Sheets[wb.SheetNames[0]],{FS:" | "})}
const t=await f.text();
return from==="html"?new DOMParser().parseFromString(t,"text/html").body.textContent.trim():t}
async function cvHtml(f,from){
if(from==="docx")return (await mammoth.convertToHtml({arrayBuffer:await f.arrayBuffer()})).value;
if(SHEETS.includes(from)){const wb=await readWb(f,from);return XLSX.utils.sheet_to_html(wb.Sheets[wb.SheetNames[0]])}
if(from==="html")return f.text();
const t=await cvText(f,from);
return from==="md"?md2html(t):t.split(/\n{2,}/).map(p=>`<p>${escH(p).replace(/\n/g,"<br>")}</p>`).join("")}

async function pptxSlides(f){
const z=await JSZip.loadAsync(await f.arrayBuffer());
const names=Object.keys(z.files).filter(n=>/^ppt\/slides\/slide\d+\.xml$/.test(n)).sort((a,b)=>a.match(/\d+/)[0]-b.match(/\d+/)[0]);
if(!names.length)throw new Error("لم أجد شرائح داخل الملف. تأكد أنه بصيغة PPTX.");
const out=[];
for(const n of names){
const d=new DOMParser().parseFromString(await z.files[n].async("string"),"application/xml");
out.push([...d.getElementsByTagName("a:p")].map(p=>[...p.getElementsByTagName("a:t")].map(t=>t.textContent).join("")).filter(s=>s.trim()))}
return out}
async function slidesToPdf(slides){
await document.fonts.load("40px 'IBM Plex Sans Arabic'");
const W=1600,H=900,doc=await PDFLib.PDFDocument.create(),cv=document.createElement("canvas");cv.width=W;cv.height=H;const x=cv.getContext("2d");
for(let i=0;i<slides.length;i++){
const s=slides[i],rtl=/[\u0600-\u06FF]/.test(s.join(" "));
x.fillStyle="#fbfbfd";x.fillRect(0,0,W,H);
["#00aeef","#ec008c","#ffe14a","#14151c"].forEach((c,k)=>{x.fillStyle=c;x.fillRect(k*W/4,0,W/4,14)});
x.fillStyle="#14151c";x.textBaseline="top";x.direction=rtl?"rtl":"ltr";x.textAlign=rtl?"right":"left";
const X=rtl?W-110:110;let y=110;
s.forEach((p,k)=>{
const big=k===0&&s.length>1;x.font=`${big?"700 64px":"400 38px"} 'IBM Plex Sans Arabic',sans-serif`;x.fillStyle=big?"#d1006c":"#14151c";
const words=(big?p:"• "+p).split(/\s+/);let cur="";
const flush=()=>{if(y<H-120){x.fillText(cur,X,y);y+=big?86:56}};
words.forEach(w=>{const t=cur?cur+" "+w:w;if(x.measureText(t).width>W-220&&cur){flush();cur=w}else cur=t});
flush();y+=big?26:8});
x.font="26px 'IBM Plex Sans Arabic',sans-serif";x.fillStyle="#8e94a8";x.textAlign="left";x.direction="ltr";x.fillText(`${i+1} / ${slides.length}`,60,H-70);
const im=await doc.embedJpg(cv.toDataURL("image/jpeg",.92));
doc.addPage([960,540]).drawImage(im,{x:0,y:0,width:960,height:540})}
return new Blob([await doc.save()],{type:"application/pdf"})}

async function runConversion(f,from,to){
if(IMGS.includes(from)){
const c=await toCanvas(f,0,to==="jpg"||to==="pdf");
if(to==="bmp")return{blob:bmpBlob(c)};
if(to==="pdf"){const d=await PDFLib.PDFDocument.create(),im=await d.embedJpg(c.toDataURL("image/jpeg",.92)),w=c.width*.75,h=c.height*.75;
d.addPage([w,h]).drawImage(im,{x:0,y:0,width:w,height:h});return{blob:new Blob([await d.save()],{type:"application/pdf"})}}
return{blob:await canvasBlob(c,MIME[to],.92)}}
if(from==="pdf"&&MIME[to]){
pdfjsLib.GlobalWorkerOptions.workerSrc=pdfjsLib.GlobalWorkerOptions.workerSrc||"https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
const pdf=await pdfjsLib.getDocument({data:await f.arrayBuffer()}).promise,outs=[];
for(let i=1;i<=pdf.numPages;i++){const pg=await pdf.getPage(i),vp=pg.getViewport({scale:2}),c=document.createElement("canvas");
c.width=vp.width;c.height=vp.height;const cx=c.getContext("2d");cx.fillStyle="#fff";cx.fillRect(0,0,c.width,c.height);
await pg.render({canvasContext:cx,viewport:vp}).promise;outs.push(await canvasBlob(c,MIME[to],.92))}
if(outs.length===1)return{blob:outs[0]};
const z=new JSZip();outs.forEach((b,i)=>z.file(`page-${i+1}.${to}`,b));
return{blob:await z.generateAsync({type:"blob"}),ext:"zip",note:`تم تصدير ${outs.length} صفحة داخل ملف ZIP.`}}
if(AUDS.includes(from))return{blob:await toWav(f)};
if(SHEETS.includes(from)&&["csv","xlsx","ods"].includes(to)){
const wb=await readWb(f,from);
if(to==="csv")return{blob:new Blob(["\ufeff"+XLSX.utils.sheet_to_csv(wb.Sheets[wb.SheetNames[0]])],{type:"text/csv"})};
return{blob:new Blob([XLSX.write(wb,{bookType:to,type:"array"})])}}
if(from==="pptx"&&to==="pdf")return{blob:await slidesToPdf(await pptxSlides(f)),note:"يُصدَّر نص الشرائح فقط؛ الصور والتصميم لا تُنقل."};
if(to==="txt")return{blob:new Blob(["\ufeff"+await cvText(f,from)],{type:"text/plain"})};
if(to==="html"){const b=await cvHtml(f,from);return{blob:new Blob([/^\s*<(!doctype|html)/i.test(b)?b:`<!DOCTYPE html><html lang="ar" dir="auto"><head><meta charset="utf-8"><style>body{font-family:sans-serif;max-width:760px;margin:40px auto;line-height:1.8}table{border-collapse:collapse}td,th{border:1px solid #999;padding:4px 8px}</style></head><body>${b}</body></html>`],{type:"text/html"})}}
if(to==="md")return{blob:new Blob([from==="txt"?await f.text():html2md(await cvHtml(f,from))],{type:"text/markdown"})};
if(to==="docx")return{blob:await makeDocx(await cvText(f,from))};
if(to==="pdf")return{blob:await convTextToPdf(await cvText(f,from)),note:"التحويل إلى PDF يحافظ على النص دون التنسيق."};
throw new Error("هذا التحويل غير مدعوم.")}

function refreshConvTo(){
const from=document.getElementById("convFrom").value,to=document.getElementById("convTo");
to.innerHTML="";(CONV_MAP[from]||[]).forEach(t=>{const o=document.createElement("option");o.value=t;o.textContent=t.toUpperCase();to.appendChild(o)});updateConvPath()}
function updateConvPath(){const p=document.getElementById("convPath");if(p)p.innerHTML=`<b>.${document.getElementById("convFrom").value}</b><i>→</i><b>.${document.getElementById("convTo").value||"؟"}</b>`}
function initConverter(){
const from=document.getElementById("convFrom");if(!from)return;
from.innerHTML="";Object.keys(CONV_MAP).forEach(k=>{const o=document.createElement("option");o.value=k;o.textContent=k.toUpperCase();from.appendChild(o)});
from.value="pptx";from.onchange=refreshConvTo;document.getElementById("convTo").onchange=updateConvPath;refreshConvTo()}
function setupConverterZone(){
const zone=document.getElementById("convZone"),input=document.getElementById("convInput");if(!zone||!input)return;
zone.addEventListener("click",e=>{if(e.target!==input)input.click()});
zone.addEventListener("dragover",e=>{e.preventDefault();zone.classList.add("dragover")});
zone.addEventListener("dragleave",()=>zone.classList.remove("dragover"));
zone.addEventListener("drop",e=>{e.preventDefault();zone.classList.remove("dragover");handleConverterFile(e.dataTransfer.files)});
input.addEventListener("change",()=>handleConverterFile(input.files))}
function handleConverterFile(files){
const file=files[0],status=document.getElementById("convStatus");if(!file)return;
converterFile=file;
document.getElementById("convFileName").textContent=file.name;
document.getElementById("convFileSize").textContent=formatSize(file.size);
document.getElementById("convSelected").hidden=false;
let ext=(file.name.split(".").pop()||"").toLowerCase();ext=EXT_ALIAS[ext]||ext;
if(CONV_MAP[ext]){document.getElementById("convFrom").value=ext;refreshConvTo();setStatus(status,"success","تم التعرّف على الملف: "+ext.toUpperCase()+". اختر الصيغة المطلوبة.")}
else setStatus(status,"warning",["doc","ppt","xlsm"].includes(ext)?"الصيغة القديمة لا تُحوَّل محليًا. احفظ الملف بصيغة "+({doc:"DOCX",ppt:"PPTX",xlsm:"XLSX"})[ext]+" من البرنامج ثم أعد رفعه.":"الامتداد ."+esc(ext)+" غير مدعوم. المدعوم: "+Object.keys(CONV_MAP).join("، "))}
function clearConverter(){
converterFile=null;document.getElementById("convInput").value="";
document.getElementById("convSelected").hidden=true;
clearStatus(document.getElementById("convStatus"));document.getElementById("convResult").innerHTML=""}

async function startFormatConversion(){
const status=document.getElementById("convStatus"),result=document.getElementById("convResult");
if(!isVip()){
setStatus(status,"warning","هذه الميزة متاحة لأعضاء VIP فقط. أنشئ حسابًا ثم رقِّ عضويتك.");
result.innerHTML=`<div class="vip-gate"><strong>قفل VIP</strong><p>تحويل الامتدادات يحتاج عضوية VIP.</p><div class="actions"><a class="btn primary" href="#/login">تسجيل الدخول</a><a class="btn ghost" href="#/register">إنشاء حساب</a></div></div>`;return}
if(!converterFile){setStatus(status,"warning","أضف ملفًا أولًا.");return}
const from=document.getElementById("convFrom").value,to=document.getElementById("convTo").value;
if(!to||from===to){setStatus(status,"warning","اختر امتدادين مختلفين.");return}
setStatus(status,"loading","جارٍ التحويل داخل متصفحك...");result.innerHTML="";
try{
const out=await runConversion(converterFile,from,to),ext=out.ext||to;
const name=converterFile.name.replace(/\.[^.]+$/,"")+"."+ext;
result.innerHTML=`<div class="pdf-ready"><div class="big">${icons.pdf}</div><strong>تم التحويل بنجاح</strong><span class="sizes">${esc(converterFile.name)} (${formatSize(converterFile.size)}) ← ${esc(name)} (${formatSize(out.blob.size)})</span>${out.note?`<span class="sizes">${out.note}</span>`:""}<button class="btn success" id="convDl">${icons.download} تحميل الملف</button></div>`;
document.getElementById("convDl").onclick=()=>saveBlob(out.blob,name);
setStatus(status,"success","تم التحويل بنجاح.")
}catch(err){setStatus(status,"error",esc(err.message||"تعذر التحويل. تأكد أن الملف سليم."))}}

initConverter();
setupConverterZone();

/* ===== شريط مقارنة قبل/بعد ===== */
function compareHtml(before,after,nw,nh,afterDims){
return `<div class="cmp" style="--p:50%;aspect-ratio:${nw}/${nh};width:min(100%,${Math.round(380*nw/nh)}px)"><img class="b" src="${before}" alt=""><img class="a" src="${after}" alt=""><input type="range" min="0" max="100" value="50" aria-label="قارن قبل وبعد"><span class="tag t1">قبل \u2066${nw}×${nh}\u2069</span><span class="tag t2">بعد \u2066${afterDims}\u2069</span><i class="knob"></i></div>`}
document.addEventListener("input",e=>{if(e.target.matches&&e.target.matches(".cmp input"))e.target.parentNode.style.setProperty("--p",e.target.value+"%")});

/* ===== أداة تغيير مقاس الصور ===== */
(function(){
const $=id=>document.getElementById(id),z=$("rsZone"),inp=$("rsInput");if(!z)return;
let files=[];
function add(list){
files=[...list].filter(f=>f.type.startsWith("image/"));
const info=$("rsInfo");info.hidden=!files.length;
info.innerHTML=`<span class="stat-chip"><strong>${files.length}</strong> صورة</span><span class="stat-chip"><strong>${formatSize(files.reduce((a,f)=>a+f.size,0))}</strong> الحجم الكلي</span>`;
files.length?clearStatus($("rsStatus")):setStatus($("rsStatus"),"warning","اختر ملفات صور (JPG أو PNG أو WEBP...).")}
z.addEventListener("click",e=>{if(e.target!==inp)inp.click()});
z.addEventListener("dragover",e=>{e.preventDefault();z.classList.add("dragover")});
z.addEventListener("dragleave",()=>z.classList.remove("dragover"));
z.addEventListener("drop",e=>{e.preventDefault();z.classList.remove("dragover");add(e.dataTransfer.files)});
inp.addEventListener("change",()=>add(inp.files));
$("rsMode").onchange=()=>{const p=$("rsMode").value==="pct";$("rsLabel").textContent=p?"النسبة %":"العرض بالبكسل";$("rsValue").value=p?50:1280};
$("rsClear").onclick=()=>{files=[];inp.value="";$("rsInfo").hidden=true;clearStatus($("rsStatus"));$("rsResult").innerHTML=""};
$("rsGo").onclick=async()=>{
const st=$("rsStatus"),v=Number($("rsValue").value),fmt=$("rsFmt").value,pct=$("rsMode").value==="pct";
if(!files.length)return setStatus(st,"warning","أضف صورة واحدة على الأقل.");
if(!(v>0))return setStatus(st,"warning","أدخل قيمة صحيحة أكبر من صفر.");
setStatus(st,"loading","جارٍ تغيير المقاس...");
try{
let cmpInfo=null;const outs=[];
for(const f of files){
const img=await loadImg(f);if(!cmpInfo)cmpInfo={nw:img.naturalWidth||800,nh:img.naturalHeight||600,src:img.src};
const w=Math.max(1,Math.round(pct?(img.naturalWidth||800)*v/100:v));
const c=await toCanvas(f,w,fmt==="jpg"),blob=await canvasBlob(c,MIME[fmt],.92);
outs.push({blob,dims:c.width+"×"+c.height,name:`${f.name.replace(/\.[^.]+$/,"")}-${c.width}x${c.height}.${fmt}`})}
let blob=outs[0].blob,name=outs[0].name;
if(outs.length>1){const zip=new JSZip();outs.forEach(o=>zip.file(o.name,o.blob));blob=await zip.generateAsync({type:"blob"});name="resized-images.zip"}
$("rsResult").innerHTML=`<div class="pdf-ready"><div class="big">${icons.image}</div><strong>تم تغيير مقاس ${outs.length} صورة</strong>${compareHtml(cmpInfo.src,URL.createObjectURL(outs[0].blob),cmpInfo.nw,cmpInfo.nh,outs[0].dims)}<span class="sizes">${formatSize(files.reduce((a,f)=>a+f.size,0))} ← ${formatSize(blob.size)}</span><button class="btn success" id="rsDl">${icons.download} تحميل</button></div>`;
$("rsDl").onclick=()=>saveBlob(blob,name);
setStatus(st,"success","اكتمل تغيير المقاس.")
}catch(e){setStatus(st,"error","تعذر معالجة إحدى الصور.")}};
})();

/* ===== الخطة المجانية، الحد اليومي، وطلب VIP ===== */
function toolList(){return[["دمج PDF","merge-pdf"],["تقسيم PDF","split-pdf"],["تعديل PDF","edit-pdf"],["علامة مائية","watermark"],["ضغط الصور","compress-images"],["تغيير مقاس الصور","resize-images"],["استخراج النصوص OCR","ocr"],["نص إلى PDF","text-to-pdf"],["تحويل الامتدادات","format-converter"],["مولد كلمات المرور","password-generator"],["عدّاد النصوص","text-counter"],["QR عادي","qr-generator"],["QR لـ Wi-Fi","wifi-qr"],["ترتيب صفحات PDF","reorder-pdf"],["ترقيم وترويسة","page-numbers"],["ضغط PDF","compress-pdf"],["توقيع PDF","sign-pdf"],["ماسح المستندات","scanner"],["قص وتدوير الصور","image-edit"],["سجل عملياتي","history"]]}
function lockIcon(){return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>'}
function renderQuota(){
const el=document.getElementById("quotaCard");if(!el)return;
el.hidden=false;
if(isVip()){
const cur=localStorage.getItem("pixpdf_ink")||INKS[0][1],d=vipDaysLeft();
el.classList.add("vip");
el.innerHTML=`<div class="quota-top${d!==null&&d<=7?" warn":""}"><strong>${d===null?"∞":d}</strong><span>${d===null?"عضوية "+(currentRole==="admin"?"أدمن":"VIP")+": تحويلات بلا حد":(d<=7?"أيام متبقية. جدّد عضويتك قريبًا":"يومًا متبقيًا في عضوية VIP")}</span></div><div class="ink-picker">${INKS.map(([n,c])=>`<button class="ink${c===cur?" sel":""}" title="${n}" aria-label="${n}" style="--c:${c}" data-ink="${c}"></button>`).join("")}</div><small>اختر لون الحبر المفضل للواجهة.</small>${d!==null&&d<=7?'<button class="btn primary" onclick="upgradeVip()">جدّد عبر واتساب</button>':""}<a class="btn ghost" href="#/history">سجل عملياتي</a>`;
applyInk();return}
el.classList.remove("vip");applyInk();
const used=Math.min(getDailyUsage(),DAILY_LIMIT),left=DAILY_LIMIT-used;
el.innerHTML=`<div class="quota-top"><strong>${left}</strong><span>من ${DAILY_LIMIT} تحويلات متبقية اليوم</span></div><div class="quota-dots">${Array.from({length:DAILY_LIMIT},(_,i)=>`<i class="${i<used?"used":""}"></i>`).join("")}</div><small>تتجدد تلقائيًا كل يوم. المتاح مجانًا: صور إلى PDF وPDF إلى صور.</small><a class="btn primary" href="#/vip">افتح كل الأدوات بـ VIP</a>`}
function quotaShake(){const el=document.getElementById("quotaCard");if(!el)return;el.classList.remove("shake");void el.offsetWidth;el.classList.add("shake")}
function renderHomeExtras(){
renderHomeReviews();
const extras=document.getElementById("vipExtras");if(!extras)return;
const vip=isVip();
extras.innerHTML=vip
?`<div class="premium-banner"><span class="premium-label">عضوية VIP</span><h2>كل أدواتك مفتوحة</h2><p>معالجة غير محدودة وكل الأقسام متاحة لك.</p></div><div class="tool-chips">${toolList().map(([n,p])=>`<a class="tool-chip" href="#/${p}">${n}</a>`).join("")}</div>`
:`<div class="premium-banner"><span class="premium-label">VIP</span><h2>افتح كل الأدوات المتقدمة</h2><p>خطتك الحالية: ${DAILY_LIMIT} تحويلات يوميًا لتحويل الصور وPDF فقط. رقِّ حسابك لتفتح الأدوات التالية بلا حد.</p><div class="actions"><a class="btn primary" href="#/vip">ترقية إلى VIP</a></div></div><div class="tool-chips">${toolList().map(([n])=>`<a class="tool-chip locked" href="#/vip">${lockIcon()}${n}</a>`).join("")}</div>`}
function renderVipPage(){
const box=document.getElementById("vipPageCard");if(!box)return;
const u=auth.currentUser;
if(isVip()){box.innerHTML=`<span class="premium-label">VIP</span><h2>عضويتك VIP مفعّلة</h2><p>كل الأدوات مفتوحة بلا حدود يومية.</p><div class="actions"><a class="btn primary" href="#/">ابدأ العمل</a></div>`;return}
const perks=["كل أدوات PDF والصور بلا حد يومي","تحويل الامتدادات (PPTX وDOCX وExcel وغيرها)","دمج PDF وتقسيمه وتعديله والعلامة المائية","OCR وضغط الصور وتغيير مقاسها","مولد كلمات المرور وQR وأدوات سريعة","سجل عملياتي وألوان حبر مخصصة للواجهة","أولوية في الدعم"];
const step=(n,t,d,s)=>`<li class="step ${s}"><span class="n">${s==="done"?"✓":n}</span><div><strong>${t}</strong><small>${d}</small></div></li>`;
box.innerHTML=`<span class="premium-label">VIP</span><h2>افتح كل الأدوات</h2><ul class="perks">${perks.map(p=>`<li>${p}</li>`).join("")}</ul>
<ol class="steps">${step(1,"أنشئ حسابك",u?esc(u.email):"التسجيل مجاني ويستغرق دقيقة",u?"done":"now")}${step(2,"اطلب VIP عبر واتساب","تُرسل معلومات حسابك تلقائيًا داخل الرسالة",u?"now":"")}${step(3,"التفعيل","نفعّل حسابك فتظهر لك كل الأدوات فورًا","")}</ol>
<div class="actions">${u?`<button class="btn primary" onclick="upgradeVip()">اطلب VIP عبر واتساب</button>`:`<a class="btn primary" href="#/register">أنشئ حسابًا</a><a class="btn ghost" href="#/login">لدي حساب</a>`}</div>`}
function afterAuthRedirect(){
const want=sessionStorage.getItem("pixpdf_want_vip");
if(want)sessionStorage.removeItem("pixpdf_want_vip");
location.hash=want?"#/vip":"#/account"}
function upgradeVip(){
const user=auth.currentUser;
if(!user){
sessionStorage.setItem("pixpdf_want_vip","1");
location.hash="#/register";
setTimeout(()=>{const s=document.getElementById("registerStatus");if(s)setStatus(s,"warning","أنشئ حسابًا أولًا، ثم اضغط «اطلب VIP» ليأخذك إلى واتساب مع معلومات حسابك.")},50);
return}
const message=["مرحبًا، أريد تفعيل عضوية VIP في PixPDF.","",`الاسم: ${user.displayName||"غير محدد"}`,`البريد: ${user.email||"غير محدد"}`,`معرّف الحساب: ${user.uid}`,`الخطة الحالية: ${currentRole==="admin"?"أدمن":currentVip?"VIP":"مجانية"}`,`تاريخ الطلب: ${new Date().toLocaleDateString("ar-MA")}`].join("\n");
window.open(`https://wa.me/${VIP_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`,"_blank","noopener,noreferrer")}

/* ===== مزايا VIP: ألوان الحبر، سجل العمليات ===== */
const INKS=[["ماجنتا","#ff2e93"],["سماوي","#0aa5e0"],["أخضر","#17a673"],["برتقالي","#ff6a2b"],["بنفسجي","#8b5cf6"]];
function applyInk(){
const c=isVip()?localStorage.getItem("pixpdf_ink"):null;
if(c)document.documentElement.style.setProperty("--m",c);else document.documentElement.style.removeProperty("--m")}
document.addEventListener("click",e=>{
const b=e.target.closest&&e.target.closest(".ink");if(!b||!isVip())return;
localStorage.setItem("pixpdf_ink",b.dataset.ink);renderQuota()});
function histGet(){try{return JSON.parse(localStorage.getItem("pixpdf_history")||"[]")}catch(e){return[]}}
function clearHistory(){localStorage.removeItem("pixpdf_history");renderHistory()}
function renderHistory(){
const box=document.getElementById("histCard");if(!box)return;
const h=histGet(),today=new Date().toDateString(),n=h.filter(x=>new Date(x.t).toDateString()===today).length;
box.innerHTML=`<div class="counter-grid"><div class="counter-box"><strong>${h.length}</strong>عملية محفوظة</div><div class="counter-box"><strong>${n}</strong>عمليات اليوم</div></div>`+
(h.length?`<ul class="hist">${h.map(x=>`<li><span class="when">${new Date(x.t).toLocaleString("ar",{dateStyle:"medium",timeStyle:"short"})}</span><strong>${esc(x.tool)}</strong><small>${esc(x.info)}</small></li>`).join("")}</ul><div class="actions"><button class="btn danger" onclick="clearHistory()">مسح السجل</button></div>`
:`<div class="admin-empty">لا توجد عمليات بعد. حوّل ملفًا وسيظهر هنا تلقائيًا.</div>`)}
new MutationObserver(ms=>ms.forEach(m=>m.addedNodes.forEach(n=>{
if(n.nodeType!==1||!isVip())return;
const el=n.matches(".pdf-ready")?n:n.querySelector(".pdf-ready");if(!el)return;
const h=histGet();
h.unshift({t:Date.now(),tool:(document.querySelector(".page.active h1")||{}).textContent||"عملية",info:el.textContent.replace(/\s+/g," ").trim().slice(0,100)});
localStorage.setItem("pixpdf_history",JSON.stringify(h.slice(0,50)))}))).observe(document.body,{childList:true,subtree:true});

/* ===== التقييمات والتعليقات: القراءة للجميع، والكتابة للأعضاء، والرد والحذف للأدمن ===== */
var reviewsData,reviewsError,pickedStars=0;
function starsHtml(n){return "<b>"+"★".repeat(n)+"</b><u>"+"★".repeat(5-n)+"</u>"}
function reviewDate(r){const d=r.createdAt&&r.createdAt.toDate?r.createdAt.toDate():null;return d?d.toLocaleDateString("ar",{dateStyle:"medium"}):"الآن"}
function reviewStats(){const rs=reviewsData||[],n=rs.length;return{rs,n,avg:n?rs.reduce((a,r)=>a+(r.rating||0),0)/n:0}}
db.collection("reviews").orderBy("createdAt","desc").limit(100).onSnapshot(snap=>{
reviewsData=snap.docs.map(d=>Object.assign({id:d.id},d.data()));reviewsError=false;renderReviews();renderHomeReviews()},
()=>{reviewsError=true;renderReviews()});
function renderHomeReviews(){
const el=document.getElementById("homeReviews");if(!el)return;
const{n,avg}=reviewStats();
el.innerHTML=`<div class="rev-teaser"><div class="rev-teaser-info"><span class="stars">${starsHtml(Math.round(avg))}</span><strong>${n?avg.toFixed(1):"—"}</strong><small>${n} تقييم</small></div><a class="btn ghost" href="#/reviews">${n?"اقرأ الآراء وشاركنا رأيك":"كن أول من يقيّم"}</a></div>`}
function paintStars(){document.querySelectorAll(".star").forEach(b=>b.classList.toggle("on",Number(b.dataset.star)<=pickedStars))}
function renderReviews(){
const sum=document.getElementById("revSummary"),form=document.getElementById("revForm"),list=document.getElementById("revList");
if(!list)return;
if(reviewsError){list.innerHTML='<div class="admin-empty">تعذر تحميل التقييمات الآن. تأكد من الاتصال ومن قواعد Firestore.</div>';return}
const{rs,n,avg}=reviewStats(),u=auth.currentUser,admin=currentRole==="admin",mine=u&&rs.find(r=>r.id===u.uid);
sum.innerHTML=n?`<div class="rev-avg"><strong>${avg.toFixed(1)}</strong><span class="stars">${starsHtml(Math.round(avg))}</span><small>${n} تقييم</small></div><div class="rev-bars">${[5,4,3,2,1].map(s=>{const c=rs.filter(r=>r.rating===s).length;return`<div><span>${s}★</span><i><b style="width:${c/n*100}%"></b></i><em>${c}</em></div>`}).join("")}</div>`:'<div class="admin-empty">لا توجد تقييمات بعد. كن أول من يقيّم!</div>';
const sig=u?u.uid+":"+(mine?"edit":"new"):"guest";
if(form.dataset.sig!==sig){
form.dataset.sig=sig;
if(!u){form.innerHTML='<h3>شاركنا رأيك</h3><p>التقييم والتعليق متاحان للأعضاء فقط. أنشئ حسابًا مجانيًا لتكتب رأيك.</p><div class="actions"><a class="btn primary" href="#/register">أنشئ حسابًا</a><a class="btn ghost" href="#/login">تسجيل الدخول</a></div>'}
else{
pickedStars=mine?mine.rating:0;
form.innerHTML=`<h3>${mine?"تعديل تقييمك":"شاركنا رأيك"}</h3><div class="star-pick" role="group" aria-label="التقييم">${[1,2,3,4,5].map(i=>`<button type="button" class="star" data-star="${i}" aria-label="${i} من 5">★</button>`).join("")}</div><textarea id="revText" maxlength="500" placeholder="اكتب تعليقك (اختياري)...">${esc(mine?mine.text:"")}</textarea><small id="revCount">${mine?(mine.text||"").length:0}/500</small><div class="actions"><button class="btn primary" id="revSend">${mine?"تحديث تقييمي":"انشر تقييمي"}</button>${mine?'<button class="btn danger" id="revDel">حذف تقييمي</button>':""}</div><div class="status" id="revStatus"></div>`;
paintStars()}}
list.innerHTML=rs.map(r=>`<article class="rev"><header><strong>${esc(r.name||"عضو")}</strong><span class="stars">${starsHtml(r.rating||0)}</span><time>${reviewDate(r)}</time></header>${r.text?`<p>${esc(r.text)}</p>`:""}${r.reply?`<div class="rev-reply"><span class="badge-admin">رد الإدارة</span><p>${esc(r.reply.text)}</p></div>`:""}${admin?`<div class="rev-admin"><textarea data-reply-for="${esc(r.id)}" maxlength="500" placeholder="اكتب رد الإدارة...">${esc(r.reply?r.reply.text:"")}</textarea><div class="actions"><button class="btn primary" data-act="reply" data-id="${esc(r.id)}">${r.reply?"تعديل الرد":"رد"}</button>${r.reply?`<button class="btn ghost" data-act="unreply" data-id="${esc(r.id)}">حذف الرد</button>`:""}<button class="btn danger" data-act="del" data-id="${esc(r.id)}">حذف التعليق</button></div></div>`:""}${repHtml(r,u,admin)}</article>`).join("")}
async function submitReview(){
const u=auth.currentUser,st=document.getElementById("revStatus");if(!u)return;
if(!pickedStars)return setStatus(st,"warning","اختر عدد النجوم أولًا.");
const text=document.getElementById("revText").value.trim().slice(0,500),name=(u.displayName||"عضو").slice(0,40);
const mine=(reviewsData||[]).find(r=>r.id===u.uid),ref=db.collection("reviews").doc(u.uid),ts=firebase.firestore.FieldValue.serverTimestamp();
setStatus(st,"loading","جارٍ النشر...");
try{
if(mine)await ref.update({rating:pickedStars,text,name,updatedAt:ts});
else await ref.set({uid:u.uid,name,rating:pickedStars,text,createdAt:ts});
const s2=document.getElementById("revStatus");if(s2)setStatus(s2,"success","شكرًا لك! تم نشر رأيك.")
}catch(e){setStatus(document.getElementById("revStatus")||st,"error","تعذر النشر. تأكد من تسجيل الدخول ومن قواعد Firestore.")}}
async function adminReviewAction(act,id){
if(currentRole!=="admin")return;
const ref=db.collection("reviews").doc(id);
try{
if(act==="del"){if(confirm("حذف هذا التعليق نهائيًا؟"))await ref.delete()}
else if(act==="unreply")await ref.update({reply:firebase.firestore.FieldValue.delete()});
else if(act==="reply"){
const box=[...document.querySelectorAll("[data-reply-for]")].find(x=>x.dataset.replyFor===id),text=box?box.value.trim().slice(0,500):"";
if(!text)return;
await ref.update({reply:{text,at:firebase.firestore.FieldValue.serverTimestamp?firebase.firestore.FieldValue.serverTimestamp():null}})}
}catch(e){alert("تعذر تنفيذ العملية. تأكد من صلاحيات الأدمن في قواعد Firestore.")}}
document.addEventListener("click",e=>{
const t=e.target.closest&&e.target.closest("[data-star],#revSend,#revDel,[data-act]");if(!t)return;
if(t.dataset.star){pickedStars=Number(t.dataset.star);paintStars();return}
if(t.id==="revSend")return submitReview();
if(t.id==="revDel"){const u=auth.currentUser;if(u&&confirm("حذف تقييمك؟"))db.collection("reviews").doc(u.uid).delete();return}
if(t.dataset.act)adminReviewAction(t.dataset.act,t.dataset.id)});
document.addEventListener("input",e=>{if(e.target.id==="revText"){const c=document.getElementById("revCount");if(c)c.textContent=e.target.value.length+"/500"}});

/* ===== مدة VIP ===== */
function vipDaysLeft(){
if(currentRole==="admin"||!currentVip||!currentVipUntil)return null;
return Math.max(0,Math.ceil((currentVipUntil-Date.now())/864e5))}
function vipDaysRow(){
if(currentRole==="admin")return"";
const n=vipDaysLeft();
if(currentVip&&!isVip())return`<div class="account-row"><span>مدة VIP</span><strong class="warn">انتهت عضويتك</strong></div>`;
if(!isVip())return"";
if(n===null)return`<div class="account-row"><span>مدة VIP</span><strong>دائمة</strong></div>`;
return`<div class="account-row"><span>مدة VIP</span><strong class="${n<=7?"warn":""}">متبقٍ ${n} ${n===1?"يوم":"أيام"}</strong></div>`}
function vipInfo(d){
if(d.role==="admin")return"أدمن";
if(!d.vipActive)return"—";
const u=d.vipUntil&&d.vipUntil.toMillis?d.vipUntil.toMillis():0;
if(!u)return"دائم";
const n=Math.ceil((u-Date.now())/864e5);
return n>0?"ينتهي "+new Date(u).toLocaleDateString("ar")+" (متبقٍ "+n+" يومًا)":"منتهٍ"}
function vipActions(id){
const i=esc(id);
return`<div class="user-actions"><select id="dur-${i}" aria-label="مدة VIP"><option value="7">7 أيام</option><option value="30" selected>30 يومًا</option><option value="90">90 يومًا</option><option value="180">180 يومًا</option><option value="365">سنة</option><option value="0">دائم</option></select><button class="btn success" onclick="setVipDays('${i}')">تفعيل / تمديد VIP</button><button class="btn ghost" onclick="setVip(false,'${i}')">إلغاء VIP</button></div>`}
async function setVipDays(id){
const status=document.getElementById("adminStatus"),sel=document.getElementById("dur-"+id);
if(currentRole!=="admin"||!sel)return;
const days=Number(sel.value);
setStatus(status,"loading","جارٍ التحديث...");
try{
const snap=await db.collection("users").doc(id).get(),d=snap.data()||{};
let until=null;
if(days>0){
const cur=d.vipUntil&&d.vipUntil.toMillis?d.vipUntil.toMillis():0;
const base=d.vipActive&&cur>Date.now()?cur:Date.now();
until=firebase.firestore.Timestamp.fromMillis(base+days*864e5)}
await db.collection("users").doc(id).update({vipActive:true,role:"vip",vipUntil:until});
setStatus(status,"success",days?"تم تفعيل VIP لمدة "+days+" يومًا (يُضاف إلى المتبقي إن وُجد).":"تم تفعيل VIP دائمًا.");
renderAdminPanel();
if(typeof adminUser!=="undefined"&&adminUser&&adminUser.id===id)adminSearchUser()
}catch(e){setStatus(status,"error","تعذر التحديث. تأكد من قواعد الأمان ومن أن حسابك أدمن.")}}

/* ===== إطار الأدوات الجديدة ===== */
var handoff=null,lastPdf=null,TOOL_HOOKS={};
const PDF_CHAIN=[["compress-pdf","ضغط"],["page-numbers","ترقيم وترويسة"],["sign-pdf","توقيع"],["reorder-pdf","ترتيب"]];
function mkPage(id,title,desc,body){
const s=document.createElement("section");s.className="page";s.id="page-"+id;
s.innerHTML=`<div class="hero"><h1>${title}</h1><p>${desc}</p></div><div class="card">${body}</div>`;
document.querySelector(".content").appendChild(s);return s}
function zoneHtml(id,text,accept){
return`<div class="dropzone" id="${id}-zone"><div class="drop-icon">${icons.pdf}</div><strong>${text}</strong><span>أو اضغط للاختيار</span><input type="file" id="${id}-in" accept="${accept}" hidden></div>`}
function wireZone(id,onFiles){
const z=document.getElementById(id+"-zone"),inp=document.getElementById(id+"-in");
z.tabIndex=0;z.setAttribute("role","button");
z.addEventListener("click",e=>{if(e.target!==inp)inp.click()});
z.addEventListener("keydown",e=>{if((e.key==="Enter"||e.key===" ")&&e.target===z){e.preventDefault();inp.click()}});
z.addEventListener("dragover",e=>{e.preventDefault();z.classList.add("dragover")});
z.addEventListener("dragleave",()=>z.classList.remove("dragover"));
z.addEventListener("drop",e=>{e.preventDefault();z.classList.remove("dragover");onFiles([...e.dataTransfer.files])});
inp.addEventListener("change",()=>{const fs=[...inp.files];inp.value="";onFiles(fs)})}
function showPdfResult(box,blob,name,from,note){
lastPdf={blob,name};
const chain=PDF_CHAIN.filter(c=>c[0]!==from).map(c=>`<button class="btn ghost" data-chain="${c[0]}">${c[1]}</button>`).join("");
box.innerHTML=`<div class="pdf-ready"><div class="big">${icons.pdf}</div><strong>تم بنجاح</strong><span class="sizes">${formatSize(blob.size)}</span>${note?`<span class="sizes">${note}</span>`:""}<button class="btn success" data-dl>${icons.download} تحميل الملف</button><div class="chain"><small>تابع على الناتج مباشرة:</small>${chain}</div></div>`;
box.querySelector("[data-dl]").onclick=()=>saveBlob(blob,name)}
document.addEventListener("click",e=>{
const b=e.target.closest&&e.target.closest("[data-chain]");if(!b||!lastPdf)return;
handoff={page:b.dataset.chain,file:new File([lastPdf.blob],lastPdf.name,{type:"application/pdf"})};
location.hash="#/"+b.dataset.chain});
async function textPng(text,px,color){
try{await document.fonts.load(`${px}px 'IBM Plex Sans Arabic'`)}catch(e){}
const S=3,c=document.createElement("canvas"),x=c.getContext("2d"),font=`${px*S}px 'IBM Plex Sans Arabic',sans-serif`;
x.font=font;const w=Math.ceil(x.measureText(text).width)+8,h=Math.ceil(px*S*1.5);
c.width=w;c.height=h;x.font=font;x.fillStyle=color||"#14151c";x.textBaseline="middle";
const rtl=/[\u0600-\u06FF]/.test(text);x.direction=rtl?"rtl":"ltr";x.textAlign=rtl?"right":"left";
x.fillText(text,rtl?w-4:4,h/2);
return{url:c.toDataURL("image/png"),w:w/S,h:h/S}}
function enhanceCanvas(c,m){
if(m==="color")return;
const cw=c.width,ch=c.height,x=c.getContext("2d"),im=x.getImageData(0,0,cw,ch),d=im.data,g=new Uint8Array(cw*ch),hist=new Uint32Array(256);
for(let i=0,j=0;i<d.length;i+=4,j++){const v=Math.round(.299*d[i]+.587*d[i+1]+.114*d[i+2]);g[j]=v;hist[v]++}
let lo=0,hi=255;
if(m==="doc"||m==="bw"){
const tot=cw*ch;let a=0;
for(lo=0;lo<255&&a<tot*.02;lo++)a+=hist[lo];
a=0;for(hi=255;hi>0&&a<tot*.02;hi--)a+=hist[hi];
if(hi<=lo+1){lo=0;hi=255}}
for(let i=0,j=0;i<d.length;i+=4,j++){
let v=g[j];
if(m!=="gray"){v=Math.max(0,Math.min(255,(v-lo)*255/(hi-lo)));if(m==="bw")v=v>150?255:0}
d[i]=d[i+1]=d[i+2]=v}
x.putImageData(im,0,0)}
function pdfTool(c){
const id=c.id;
mkPage(id,c.title,c.desc,zoneHtml(id,"اسحب ملف PDF هنا","application/pdf")+`<div class="stats-bar" id="${id}-info" hidden></div><div id="${id}-prev"></div><div class="options" id="${id}-opts" hidden>${c.opts||""}</div><div class="actions"><button class="btn primary" id="${id}-go" disabled>${c.label}</button><button class="btn ghost" id="${id}-clear">تفريغ</button></div><div class="status" id="${id}-st"></div><div class="result-area" id="${id}-res"></div>`);
const $=s=>document.getElementById(id+"-"+s),ctx={};
async function load(file){
if(!file||(file.type!=="application/pdf"&&!/\.pdf$/i.test(file.name)))return setStatus($("st"),"warning","اختر ملف PDF.");
try{
setStatus($("st"),"loading","جارٍ قراءة الملف...");
pdfjsLib.GlobalWorkerOptions.workerSrc=pdfjsLib.GlobalWorkerOptions.workerSrc||"https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
ctx.file=file;ctx.bytes=await file.arrayBuffer();
ctx.pdf=await pdfjsLib.getDocument({data:new Uint8Array(ctx.bytes.slice(0))}).promise;
ctx.n=ctx.pdf.numPages;
$("info").hidden=false;
$("info").innerHTML=`<span class="stat-chip"><strong>${esc(file.name)}</strong></span><span class="stat-chip"><strong>${ctx.n}</strong> صفحة</span><span class="stat-chip">${formatSize(file.size)}</span>`;
$("opts").hidden=false;$("go").disabled=false;$("res").innerHTML="";
if(c.onLoad)await c.onLoad(ctx,$);
clearStatus($("st"))
}catch(e){setStatus($("st"),"error","تعذر قراءة الملف. قد يكون محميًا بكلمة سر أو تالفًا.")}}
wireZone(id,fs=>load(fs[0]));
$("clear").onclick=()=>{ctx.file=null;$("info").hidden=true;$("opts").hidden=true;$("prev").innerHTML="";$("go").disabled=true;$("res").innerHTML="";clearStatus($("st"))};
$("go").onclick=async()=>{
if(!ctx.file)return;
$("go").disabled=true;
try{
setStatus($("st"),"loading","جارٍ المعالجة...");
const out=await c.run(ctx,$,m=>setStatus($("st"),"loading",m));
showPdfResult($("res"),out.blob,ctx.file.name.replace(/\.pdf$/i,"")+"-"+id+".pdf",id,out.note);
setStatus($("st"),"success","اكتملت العملية.")
}catch(e){setStatus($("st"),"error",esc(e.message||"تعذر تنفيذ العملية."))}
$("go").disabled=false};
TOOL_HOOKS[id]=()=>{if(handoff&&handoff.page===id){const f=handoff.file;handoff=null;load(f)}};
if(c.init)c.init($,ctx)}
const pdfBlob=async d=>new Blob([await d.save()],{type:"application/pdf"});

/* 1) ترتيب الصفحات بالسحب مع معاينة مكدّسة */
pdfTool({id:"reorder-pdf",title:"ترتيب صفحات PDF",desc:"اسحب الصفحات لإعادة ترتيبها، أو استخدم الأسهم. أدر الصفحة أو احذفها قبل التصدير.",label:"تصدير الترتيب الجديد",
async onLoad(ctx,$){
const box=$("prev");box.innerHTML='<div class="thumbs" id="reorder-grid"></div>';
const g=box.firstChild,max=Math.min(ctx.n,150);
for(let i=1;i<=max;i++){
const pg=await ctx.pdf.getPage(i),vp=pg.getViewport({scale:.3}),cv=document.createElement("canvas");
cv.width=vp.width;cv.height=vp.height;
const x=cv.getContext("2d");x.fillStyle="#fff";x.fillRect(0,0,cv.width,cv.height);
await pg.render({canvasContext:x,viewport:vp}).promise;
const t=document.createElement("div");t.className="thumb";t.draggable=true;t.dataset.i=i-1;t.dataset.rot=0;
t.innerHTML='<div class="pv"></div><span class="num"></span><div class="tools"><button type="button" data-t="prev" title="تقديم">›</button><button type="button" data-t="next" title="تأخير">‹</button><button type="button" data-t="rot" title="تدوير">↻</button><button type="button" data-t="del" title="حذف">✕</button></div>';
t.querySelector(".pv").appendChild(cv);g.appendChild(t)}
const renum=()=>[...g.children].forEach((t,k)=>t.querySelector(".num").textContent=k+1);renum();
let drag=null;
g.addEventListener("dragstart",e=>{drag=e.target.closest(".thumb");if(drag){drag.classList.add("dragging");if(e.dataTransfer)e.dataTransfer.effectAllowed="move"}});
g.addEventListener("dragend",()=>{if(drag)drag.classList.remove("dragging");drag=null;renum()});
g.addEventListener("dragover",e=>{
e.preventDefault();const t=e.target.closest(".thumb");if(!drag||!t||t===drag)return;
const r=t.getBoundingClientRect();
g.insertBefore(drag,e.clientX>r.left+r.width/2?t:t.nextSibling)});
g.addEventListener("click",e=>{
const b=e.target.closest("[data-t]");if(!b)return;
const t=b.closest(".thumb"),k=b.dataset.t;
if(k==="del")t.remove();
else if(k==="prev"&&t.previousElementSibling)g.insertBefore(t,t.previousElementSibling);
else if(k==="next"&&t.nextElementSibling)g.insertBefore(t.nextElementSibling,t);
else if(k==="rot"){t.dataset.rot=(Number(t.dataset.rot)+90)%360;t.querySelector("canvas").style.transform=`rotate(${t.dataset.rot}deg)`}
renum()});
if(ctx.n>max)setStatus($("st"),"warning","تُعرض أول "+max+" صفحة للترتيب، وتُضاف الباقية كما هي في النهاية.")},
async run(ctx){
const src=await PDFLib.PDFDocument.load(ctx.bytes),out=await PDFLib.PDFDocument.create();
const ts=[...document.querySelectorAll("#reorder-grid .thumb")];
if(!ts.length)throw new Error("لا توجد صفحات للتصدير.");
for(const t of ts){
const[p]=await out.copyPages(src,[Number(t.dataset.i)]),r=Number(t.dataset.rot);
if(r)p.setRotation(PDFLib.degrees((p.getRotation().angle+r)%360));
out.addPage(p)}
for(let i=150;i<ctx.n;i++){const[p]=await out.copyPages(src,[i]);out.addPage(p)}
return{blob:await pdfBlob(out),note:ts.length+" صفحة بالترتيب الجديد"}}});

/* 2) ترقيم الصفحات + ترويسة وتذييل */
pdfTool({id:"page-numbers",title:"ترقيم وترويسة وتذييل",desc:"أضف أرقام الصفحات ونصًا في أعلى الصفحة وأسفلها (يدعم العربية).",label:"تطبيق وتصدير",
opts:`<div class="field"><label>موضع الرقم</label><select id="page-numbers-pos"><option value="bc">أسفل الوسط</option><option value="br">أسفل اليمين</option><option value="bl">أسفل اليسار</option><option value="tc">أعلى الوسط</option><option value="tr">أعلى اليمين</option><option value="tl">أعلى اليسار</option><option value="none">بدون ترقيم</option></select></div>
<div class="field"><label>الصيغة</label><select id="page-numbers-fmt"><option value="n">1</option><option value="p">صفحة 1</option><option value="of">1 / N</option></select></div>
<div class="field"><label>يبدأ من</label><input type="number" id="page-numbers-start" value="1" min="0"></div>
<div class="field"><label>حجم الخط</label><input type="number" id="page-numbers-size" value="12" min="8" max="40"></div>
<div class="field"><label>ترويسة (أعلى كل صفحة)</label><input type="text" id="page-numbers-head" placeholder="اختياري"></div>
<div class="field"><label>تذييل (أسفل كل صفحة)</label><input type="text" id="page-numbers-foot" placeholder="اختياري"></div>
<label class="option"><input type="checkbox" id="page-numbers-skip"> لا ترقّم الصفحة الأولى</label>`,
async run(ctx,$,say){
const g=k=>document.getElementById("page-numbers-"+k),doc=await PDFLib.PDFDocument.load(ctx.bytes),pages=doc.getPages();
const pos=g("pos").value,fmt=g("fmt").value,start=Number(g("start").value)||0,size=Number(g("size").value)||12,head=g("head").value.trim(),foot=g("foot").value.trim(),skip=g("skip").checked,M=28;
if(pos==="none"&&!head&&!foot)throw new Error("اختر موضعًا للرقم أو اكتب ترويسة أو تذييلًا.");
const hI=head?await textPng(head,size,"#444"):null,fI=foot?await textPng(foot,size,"#444"):null;
const hE=hI&&await doc.embedPng(hI.url),fE=fI&&await doc.embedPng(fI.url),total=start+pages.length-1;
for(let i=0;i<pages.length;i++){
if(i%10===0)say("معالجة الصفحة "+(i+1)+" من "+pages.length);
const pg=pages[i],{width:W,height:H}=pg.getSize(),num=pos!=="none"&&!(skip&&i===0);
if(hE)pg.drawImage(hE,{x:(W-hI.w)/2,y:H-M-hI.h-(num&&pos[0]==="t"?size*1.6:0),width:hI.w,height:hI.h});
if(fE)pg.drawImage(fE,{x:(W-fI.w)/2,y:M+(num&&pos[0]==="b"?size*1.6:0),width:fI.w,height:fI.h});
if(num){
const n=start+i,t=await textPng(fmt==="p"?"صفحة "+n:fmt==="of"?n+" / "+total:String(n),size),im=await doc.embedPng(t.url);
const x=pos[1]==="c"?(W-t.w)/2:pos[1]==="r"?W-M-t.w:M;
pg.drawImage(im,{x,y:pos[0]==="b"?M:H-M-t.h,width:t.w,height:t.h})}}
return{blob:await pdfBlob(doc),note:"تمت المعالجة لـ "+pages.length+" صفحة"}}});

/* 3) ضغط PDF */
pdfTool({id:"compress-pdf",title:"ضغط PDF",desc:"قلّل حجم الملف بإعادة رسم الصفحات كصور مضغوطة. النص يفقد قابلية التحديد.",label:"ضغط الملف",
opts:`<div class="field"><label>قوة الضغط</label><select id="compress-pdf-lvl"><option value="high">قوية (أصغر حجم)</option><option value="mid" selected>متوسطة</option><option value="low">خفيفة (أعلى جودة)</option></select></div>`,
async run(ctx,$,say){
const lv={high:[1.5,.5],mid:[2.1,.65],low:[2.7,.8]}[document.getElementById("compress-pdf-lvl").value],out=await PDFLib.PDFDocument.create();
for(let i=1;i<=ctx.n;i++){
say("ضغط الصفحة "+i+" من "+ctx.n);
const pg=await ctx.pdf.getPage(i),b=pg.getViewport({scale:1}),vp=pg.getViewport({scale:lv[0]}),cv=document.createElement("canvas");
cv.width=Math.ceil(vp.width);cv.height=Math.ceil(vp.height);
const x=cv.getContext("2d");x.fillStyle="#fff";x.fillRect(0,0,cv.width,cv.height);
await pg.render({canvasContext:x,viewport:vp}).promise;
const im=await out.embedJpg(cv.toDataURL("image/jpeg",lv[1]));
out.addPage([b.width,b.height]).drawImage(im,{x:0,y:0,width:b.width,height:b.height})}
const blob=await pdfBlob(out),pct=Math.round((1-blob.size/ctx.file.size)*100);
return{blob,note:pct>0?"وُفّر "+pct+"% (من "+formatSize(ctx.file.size)+" إلى "+formatSize(blob.size)+"). النص لم يعد قابلًا للتحديد.":"الناتج ("+formatSize(blob.size)+") ليس أصغر من الأصل ("+formatSize(ctx.file.size)+"). احتفظ بالأصل أو جرّب ضغطًا أقوى."}}});

/* 4) توقيع PDF */
pdfTool({id:"sign-pdf",title:"توقيع PDF",desc:"ارسم توقيعك بإصبعك أو بالماوس وضعه على الصفحة التي تريد. يمكنك حفظه لاستخدامه لاحقًا.",label:"توقيع وتصدير",
opts:`<div class="field full"><label>ارسم توقيعك داخل الإطار</label><canvas id="sign-pad" class="sigpad" width="640" height="220"></canvas><div class="actions"><button type="button" class="btn ghost" id="sign-clear">مسح</button><button type="button" class="btn ghost" id="sign-save">حفظ توقيعي</button><button type="button" class="btn ghost" id="sign-use">استخدام المحفوظ</button></div></div>
<div class="field"><label>رقم الصفحة</label><input type="number" id="sign-pdf-page" value="1" min="1"></div>
<label class="option"><input type="checkbox" id="sign-pdf-all"> كل الصفحات</label>
<div class="field"><label>الموضع</label><select id="sign-pdf-pos"><option value="br">أسفل اليمين</option><option value="bl">أسفل اليسار</option><option value="bc">أسفل الوسط</option><option value="mr">وسط الصفحة يمينًا</option><option value="tr">أعلى اليمين</option></select></div>
<div class="field"><label>الحجم</label><input type="range" id="sign-pdf-size" min="60" max="320" value="160"></div>`,
init($,ctx){
const cv=document.getElementById("sign-pad"),x=cv.getContext("2d");let down=false,signed=false;
x.lineWidth=3.2;x.lineCap="round";x.lineJoin="round";x.strokeStyle="#14151c";
const pt=e=>{const r=cv.getBoundingClientRect();return[(e.clientX-r.left)*cv.width/r.width,(e.clientY-r.top)*cv.height/r.height]};
cv.addEventListener("pointerdown",e=>{down=true;try{cv.setPointerCapture(e.pointerId)}catch(_){}const[a,b]=pt(e);x.beginPath();x.moveTo(a,b);x.lineTo(a+.1,b+.1);x.stroke();signed=true;e.preventDefault()});
cv.addEventListener("pointermove",e=>{if(!down)return;const[a,b]=pt(e);x.lineTo(a,b);x.stroke()});
["pointerup","pointercancel"].forEach(ev=>cv.addEventListener(ev,()=>{down=false}));
document.getElementById("sign-clear").onclick=()=>{x.clearRect(0,0,cv.width,cv.height);signed=false};
document.getElementById("sign-save").onclick=()=>{if(signed)localStorage.setItem("pixpdf_sig",cv.toDataURL("image/png"))};
document.getElementById("sign-use").onclick=()=>{
const s=localStorage.getItem("pixpdf_sig");if(!s){alert("لا يوجد توقيع محفوظ بعد.");return}
const im=new Image();im.onload=()=>{x.clearRect(0,0,cv.width,cv.height);x.drawImage(im,0,0);signed=true};im.src=s};
ctx.isSigned=()=>signed},
onLoad(ctx){const p=document.getElementById("sign-pdf-page");p.max=ctx.n;p.value=ctx.n},
async run(ctx){
if(!ctx.isSigned())throw new Error("ارسم توقيعك أولًا.");
const g=k=>document.getElementById("sign-pdf-"+k),cv=document.getElementById("sign-pad"),d=cv.getContext("2d").getImageData(0,0,cv.width,cv.height).data;
let x0=cv.width,y0=cv.height,x1=0,y1=0;
for(let y=0;y<cv.height;y++)for(let x=0;x<cv.width;x++)if(d[(y*cv.width+x)*4+3]>10){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y}
const pad=6,w=x1-x0+1+pad*2,h=y1-y0+1+pad*2,c2=document.createElement("canvas");
c2.width=w;c2.height=h;c2.getContext("2d").drawImage(cv,x0-pad,y0-pad,w,h,0,0,w,h);
const doc=await PDFLib.PDFDocument.load(ctx.bytes),img=await doc.embedPng(c2.toDataURL("image/png")),pages=doc.getPages();
const pn=Math.min(pages.length,Math.max(1,Number(g("page").value)||1)),pos=g("pos").value,sw=Number(g("size").value),sh=sw*h/w,M=36;
(g("all").checked?pages:[pages[pn-1]]).forEach(pg=>{
const{width:W,height:H}=pg.getSize();
pg.drawImage(img,{x:pos[1]==="r"?W-M-sw:pos[1]==="l"?M:(W-sw)/2,y:pos[0]==="b"?M:pos[0]==="m"?(H-sh)/2:H-M-sh,width:sw,height:sh})});
return{blob:await pdfBlob(doc),note:g("all").checked?"وُضع التوقيع على كل الصفحات":"وُضع التوقيع على الصفحة "+pn}}});

/* 5) قص وتدوير الصور وتحويلها لأبيض وأسود */
(function(){
mkPage("image-edit","قص وتدوير الصور","دوّر الصورة أو اقلبها أو قصّ أطرافها، وحوّلها إلى رمادي أو أبيض وأسود أو وضع المستند.",
zoneHtml("image-edit","اسحب صورة هنا","image/*")+`<div id="ie-wrap" hidden><canvas id="ie-cv" class="ie-cv"></canvas>
<div class="actions"><button class="btn ghost" data-ie="rl">↶ تدوير يسار</button><button class="btn ghost" data-ie="rr">↷ تدوير يمين</button><button class="btn ghost" data-ie="fh">⇆ قلب أفقي</button><button class="btn ghost" data-ie="fv">⇅ قلب رأسي</button></div>
<div class="options"><div class="field"><label>اللون</label><select id="ie-mode"><option value="color">ألوان</option><option value="gray">رمادي</option><option value="doc">وضع المستند</option><option value="bw">أبيض وأسود</option></select></div>
<div class="field"><label>قص من الأعلى %</label><input type="range" id="ie-top" min="0" max="45" value="0"></div>
<div class="field"><label>قص من الأسفل %</label><input type="range" id="ie-bottom" min="0" max="45" value="0"></div>
<div class="field"><label>قص من اليسار %</label><input type="range" id="ie-left" min="0" max="45" value="0"></div>
<div class="field"><label>قص من اليمين %</label><input type="range" id="ie-right" min="0" max="45" value="0"></div>
<div class="field"><label>الصيغة</label><select id="ie-fmt"><option value="png">PNG</option><option value="jpg">JPG</option></select></div></div>
<div class="actions"><button class="btn primary" id="ie-dl">تحميل الصورة</button><button class="btn ghost" id="ie-reset">إعادة ضبط</button></div></div><div class="status" id="ie-st"></div>`);
const $=s=>document.getElementById("ie-"+s);
let src=null,rot=0,fx=1,fy=1,base="image";
function render(){
if(!src)return;
const sw=src.naturalWidth,sh=src.naturalHeight,r=rot%360,side=r===90||r===270,W=side?sh:sw,H=side?sw:sh;
const t=document.createElement("canvas");t.width=W;t.height=H;const x=t.getContext("2d");
x.translate(W/2,H/2);x.rotate(r*Math.PI/180);x.scale(fx,fy);x.drawImage(src,-sw/2,-sh/2);
const p=k=>Number($(k).value)/100,l=Math.round(W*p("left")),tp=Math.round(H*p("top"));
const cw=Math.max(1,W-l-Math.round(W*p("right"))),ch=Math.max(1,H-tp-Math.round(H*p("bottom"))),cv=$("cv");
cv.width=cw;cv.height=ch;cv.getContext("2d").drawImage(t,l,tp,cw,ch,0,0,cw,ch);
enhanceCanvas(cv,$("mode").value)}
function reset(){rot=0;fx=fy=1;["top","bottom","left","right"].forEach(k=>$(k).value=0);$("mode").value="color";render()}
wireZone("image-edit",fs=>{
const f=fs[0];if(!f)return;
if(!f.type.startsWith("image/"))return setStatus($("st"),"warning","اختر ملف صورة.");
const im=new Image();
im.onload=()=>{src=im;base=f.name.replace(/\.[^.]+$/,"");$("wrap").hidden=false;clearStatus($("st"));reset()};
im.onerror=()=>setStatus($("st"),"error","تعذر قراءة الصورة.");
im.src=URL.createObjectURL(f)});
document.getElementById("page-image-edit").addEventListener("input",render);
document.getElementById("page-image-edit").addEventListener("click",e=>{
const b=e.target.closest("[data-ie]");if(!b)return;
const k=b.dataset.ie,side=rot%180!==0;
if(k==="rl")rot=(rot+270)%360;else if(k==="rr")rot=(rot+90)%360;
else if(k==="fh"){if(side)fy*=-1;else fx*=-1}else if(k==="fv"){if(side)fx*=-1;else fy*=-1}
render()});
$("reset").onclick=reset;
$("dl").onclick=()=>{const jpg=$("fmt").value==="jpg";$("cv").toBlob(b=>saveBlob(b,base+"-edited."+(jpg?"jpg":"png")),jpg?"image/jpeg":"image/png",.92)};
})();

/* 6) ماسح المستندات بالكاميرا */
(function(){
mkPage("scanner","ماسح المستندات","صوّر الورقة بكاميرا الجوال أو الحاسوب، حسّن وضوحها، وصدّرها كملف PDF.",
`<div class="scan-cam" id="sc-cam" hidden><video id="sc-video" autoplay playsinline muted></video></div>
<div class="actions"><button class="btn primary" id="sc-start">تشغيل الكاميرا</button><button class="btn success" id="sc-shot" hidden>التقاط الصفحة</button><button class="btn ghost" id="sc-stop" hidden>إيقاف الكاميرا</button><label class="btn ghost" for="sc-file">اختيار / تصوير من الجهاز</label><input type="file" id="sc-file" accept="image/*" capture="environment" multiple hidden></div>
<div class="options"><div class="field"><label>التحسين</label><select id="sc-filter"><option value="doc">وضع المستند</option><option value="gray">رمادي</option><option value="color">ألوان كما هي</option></select></div></div>
<div class="thumbs" id="sc-list"></div>
<div class="actions"><button class="btn primary" id="sc-pdf" disabled>تصدير PDF</button><button class="btn ghost" id="sc-clear">تفريغ</button></div>
<div class="status" id="sc-st"></div><div class="result-area" id="sc-res"></div>`);
const $=s=>document.getElementById("sc-"+s),pages=[];let stream=null;
function renderList(){
$("list").innerHTML=pages.map((u,i)=>`<div class="thumb"><div class="pv"><img src="${u}" alt=""></div><span class="num">${i+1}</span><div class="tools"><button type="button" data-sc="${i}" title="حذف">✕</button></div></div>`).join("");
$("pdf").disabled=!pages.length}
function addPage(src,w,h){
const s=Math.min(1,1800/Math.max(w,h)),cv=document.createElement("canvas");
cv.width=Math.round(w*s);cv.height=Math.round(h*s);
cv.getContext("2d").drawImage(src,0,0,cv.width,cv.height);
enhanceCanvas(cv,$("filter").value);
pages.push(cv.toDataURL("image/jpeg",.85));renderList()}
function stop(){if(stream){stream.getTracks().forEach(t=>t.stop());stream=null}$("cam").hidden=true;$("shot").hidden=true;$("stop").hidden=true;$("start").hidden=false}
$("start").onclick=async()=>{
try{
stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:"environment"},width:{ideal:1920}},audio:false});
$("video").srcObject=stream;$("cam").hidden=false;$("shot").hidden=false;$("stop").hidden=false;$("start").hidden=true;clearStatus($("st"))
}catch(e){setStatus($("st"),"warning","تعذر تشغيل الكاميرا. اسمح بالوصول إليها (تتطلب رابط HTTPS)، أو استخدم زر «اختيار / تصوير من الجهاز».")}};
$("stop").onclick=stop;
$("shot").onclick=()=>{const v=$("video");if(v.videoWidth)addPage(v,v.videoWidth,v.videoHeight)};
$("file").addEventListener("change",async()=>{
const fs=[...$("file").files];$("file").value="";
for(const f of fs){
if(!f.type.startsWith("image/"))continue;
await new Promise(ok=>{const im=new Image();im.onload=()=>{addPage(im,im.naturalWidth,im.naturalHeight);ok()};im.onerror=ok;im.src=URL.createObjectURL(f)})}});
$("list").addEventListener("click",e=>{const b=e.target.closest("[data-sc]");if(b){pages.splice(Number(b.dataset.sc),1);renderList()}});
$("clear").onclick=()=>{pages.length=0;renderList();$("res").innerHTML="";clearStatus($("st"))};
$("pdf").onclick=async()=>{
try{
setStatus($("st"),"loading","جارٍ إنشاء PDF...");
const doc=await PDFLib.PDFDocument.create();
for(const u of pages){const im=await doc.embedJpg(u),w=595,h=w*im.height/im.width;doc.addPage([w,h]).drawImage(im,{x:0,y:0,width:w,height:h})}
showPdfResult($("res"),await pdfBlob(doc),"scan-"+new Date().toISOString().slice(0,10)+".pdf","scanner",pages.length+" صفحة");
setStatus($("st"),"success","تم إنشاء الملف.")
}catch(e){setStatus($("st"),"error","تعذر إنشاء الملف.")}};
addEventListener("hashchange",()=>{if(!location.hash.includes("scanner"))stop()});
})();

/* القائمة الجانبية + المفضلة */
(function(){
const ico='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>';
const add=(grp,id,label)=>{const box=document.querySelector("#"+grp+" .group-items");if(!box)return;const a=document.createElement("a");a.href="#/"+id;a.dataset.page=id;a.innerHTML=ico+label;box.appendChild(a)};
add("groupPdf","reorder-pdf","ترتيب صفحات PDF");add("groupPdf","page-numbers","ترقيم وترويسة");add("groupPdf","compress-pdf","ضغط PDF");add("groupPdf","sign-pdf","توقيع PDF");add("groupPdf","scanner","ماسح المستندات");add("groupImages","image-edit","قص وتدوير الصور");
const favGet=()=>{try{return JSON.parse(localStorage.getItem("pixpdf_fav")||"[]")}catch(e){return[]}};
document.querySelectorAll(".group-items a[data-page]").forEach(a=>{
const b=document.createElement("button");b.type="button";b.className="fav-btn";b.dataset.fav=a.dataset.page;b.title="تثبيت في المفضلة";b.textContent="☆";a.appendChild(b)});
const grp=document.createElement("details");grp.className="menu-group";grp.id="groupFav";grp.open=true;grp.hidden=true;
grp.innerHTML='<summary><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/></svg>المفضلة</summary><div class="group-items" id="favItems"></div>';
const anchor=document.querySelector('.menu a[data-page="reviews"]');if(anchor)anchor.after(grp);
window.renderFavorites=function(){
const favs=favGet(),box=document.getElementById("favItems");if(!box)return;
box.innerHTML="";
favs.forEach(id=>{
const o=document.querySelector('.menu .group-items a[data-page="'+id+'"]:not(.fav-copy)');
if(!o||o.closest("[hidden]")||o.hidden)return;
const c=o.cloneNode(true);c.classList.add("fav-copy");c.querySelector(".fav-btn").textContent="★";box.appendChild(c)});
grp.hidden=!box.children.length;
document.querySelectorAll(".group-items a:not(.fav-copy) .fav-btn").forEach(b=>{b.textContent=favs.includes(b.dataset.fav)?"★":"☆";b.classList.toggle("on",favs.includes(b.dataset.fav))})};
document.addEventListener("click",e=>{
const b=e.target.closest&&e.target.closest(".fav-btn");if(!b)return;
e.preventDefault();e.stopPropagation();
const id=b.dataset.fav,f=favGet(),i=f.indexOf(id);
if(i>=0)f.splice(i,1);else f.push(id);
localStorage.setItem("pixpdf_fav",JSON.stringify(f));renderFavorites()},true);
renderFavorites();
})();
showPage();

/* ===== البلاغات والدعم الفني ===== */
function tkTime(ms){return ms?new Date(ms).toLocaleString("ar",{dateStyle:"medium",timeStyle:"short"}):""}
function fsData(s){return s.docs.map(d=>Object.assign({id:d.id},d.data()))}

/* --- إبلاغ عن تعليق --- */
function repHtml(r,u,admin){
if(admin){const n=(reportsData||[]).filter(x=>x.reviewId===r.id).length;return n?`<div class="rep-note"><span class="badge-admin">${n} بلاغ</span> على هذا التعليق. التفاصيل في لوحة الأدمن.</div>`:""}
if(!u||u.uid===r.id)return"";
const id=esc(r.id);
return`<div class="rep-row"><button class="btn ghost" data-rep-open="${id}">إبلاغ عن هذا التعليق</button></div><div class="rep-box" id="rep-${id}" hidden><select aria-label="سبب البلاغ">${REPORT_REASONS.map(x=>`<option>${x}</option>`).join("")}</select><input type="text" maxlength="120" placeholder="ملاحظة (اختياري)"><button class="btn danger" data-rep-send="${id}">إرسال البلاغ</button></div>`}
async function sendReport(id,box){
const u=auth.currentUser,r=(reviewsData||[]).find(x=>x.id===id);if(!u||!r)return;
const reason=box.querySelector("select").value,note=box.querySelector("input").value.trim().slice(0,120);
try{
await db.collection("reports").doc(id+"_"+u.uid).set({reviewId:id,reviewName:(r.name||"").slice(0,40),reviewText:(r.text||"").slice(0,200),reporterUid:u.uid,reason,note,createdAt:firebase.firestore.FieldValue.serverTimestamp()});
box.innerHTML='<small class="rep-ok">تم إرسال البلاغ. شكرًا لمساعدتك في إبقاء المجتمع نظيفًا.</small>'
}catch(e){box.querySelector("small")||box.insertAdjacentHTML("beforeend",'<small class="rep-bad">تعذر الإرسال، أو سبق أن أبلغت عن هذا التعليق.</small>')}}
async function adminDeleteReviewFor(id){
if(currentRole!=="admin"||!confirm("حذف هذا التعليق نهائيًا مع كل بلاغاته؟"))return;
try{
await db.collection("reviews").doc(id).delete();
for(const x of reportsData.filter(r=>r.reviewId===id))await db.collection("reports").doc(x.id).delete()
}catch(e){alert("تعذر الحذف. تأكد من صلاحيات الأدمن في قواعد Firestore.")}}
function renderAdminReports(){
const box=document.getElementById("adminReports");if(!box)return;
if(adminFeedsError){box.innerHTML='<div class="admin-empty">تعذر تحميل البلاغات. تأكد من نشر قواعد Firestore.</div>';return}
box.innerHTML=reportsData.length?reportsData.map(x=>`<div class="user-card"><div class="row"><span>التعليق</span><strong>${esc(x.reviewName||"عضو")}: ${esc(x.reviewText||"(بلا نص)")}</strong></div><div class="row"><span>السبب</span><strong>${esc(x.reason)}</strong></div>${x.note?`<div class="row"><span>ملاحظة</span><strong>${esc(x.note)}</strong></div>`:""}<div class="row"><span>المُبلِّغ</span><strong>${esc(String(x.reporterUid).slice(0,8))}…</strong></div><div class="user-actions"><button class="btn danger" data-rep-del-review="${esc(x.reviewId)}">حذف التعليق</button><button class="btn ghost" data-rep-dismiss="${esc(x.id)}">تجاهل البلاغ</button></div></div>`).join(""):'<div class="admin-empty">لا توجد بلاغات. 🎉</div>'}

/* --- مزامنة بلاغات الأدمن ومؤشراتها --- */
function updateBadges(){
const el=document.getElementById("adminLink");if(!el)return;
let b=el.querySelector(".nav-badge");
if(!b){b=document.createElement("span");b.className="nav-badge";el.appendChild(b)}
const n=(reportsData||[]).length+(supTickets||[]).filter(t=>t.status==="open").length;
b.textContent=n;b.hidden=!n}
function ensureFeeds(){
if(currentRole==="admin"&&!adminFeedsOn){
adminFeedsOn=true;
db.collection("reports").orderBy("createdAt","desc").limit(100).onSnapshot(s=>{reportsData=fsData(s);renderAdminReports();if(typeof renderReviews==="function")renderReviews();updateBadges()},()=>{adminFeedsError=true;renderAdminReports()})}}
(function(){
const pg=document.getElementById("page-admin");
if(pg){const c=document.createElement("div");c.className="card";c.innerHTML='<h3 class="admin-list-title">بلاغات التعليقات</h3><div id="adminReports"></div>';pg.appendChild(c)}
document.addEventListener("click",e=>{
const t=e.target.closest&&e.target.closest("[data-rep-open],[data-rep-send],[data-rep-del-review],[data-rep-dismiss]");if(!t)return;
if(t.dataset.repOpen!==undefined){const b=document.getElementById("rep-"+t.dataset.repOpen);if(b)b.hidden=!b.hidden}
else if(t.dataset.repSend!==undefined)sendReport(t.dataset.repSend,t.closest(".rep-box"));
else if(t.dataset.repDelReview!==undefined)adminDeleteReviewFor(t.dataset.repDelReview);
else if(t.dataset.repDismiss!==undefined){if(currentRole==="admin")db.collection("reports").doc(t.dataset.repDismiss).delete().catch(()=>alert("تعذر التجاهل."))}});
})();
showPage();

/* ===== الدعم الفني: تذاكر بين العضو والأدمن ===== */
function supMs(t){if(!t)return Date.now();if(t.toMillis)return t.toMillis();return Number(t)||Date.now()}
function supTime(t){return new Date(supMs(t)).toLocaleString("ar",{dateStyle:"medium",timeStyle:"short"})}
function supCloseMsgs(){if(supMsgUnsub){supMsgUnsub();supMsgUnsub=null}supMsgs=[]}
function supBadge(){
const el=document.getElementById("supBadge");if(!el)return;
const n=supTickets.filter(t=>t.status===(currentRole==="admin"?"open":"answered")).length;
el.textContent=n;el.hidden=!n;if(typeof updateBadges==="function")updateBadges()}
function supportSync(){
const u=auth.currentUser,admin=currentRole==="admin",sig=u?u.uid+":"+(admin?"a":"u"):"";
if(sig===supSig)return;
supSig=sig;
if(supUnsub){supUnsub();supUnsub=null}
supTickets=[];supOpenId=null;supCloseMsgs();supBuilt="";
if(u){
const q=admin?db.collection("tickets").orderBy("updatedAt","desc").limit(200):db.collection("tickets").where("uid","==",u.uid);
supUnsub=q.onSnapshot(snap=>{
supTickets=snap.docs.map(d=>Object.assign({id:d.id},d.data())).sort((a,b)=>supMs(b.updatedAt)-supMs(a.updatedAt));
supBadge();renderSupport()},()=>{supTickets=[];supBadge();renderSupport()})}
supBadge();renderSupport()}
function renderSupport(){
const root=document.getElementById("supportRoot");if(!root)return;
const u=auth.currentUser,admin=currentRole==="admin";
if(!u){
root.innerHTML='<div class="card auth-card"><h3>الدعم الفني للأعضاء</h3><p>أنشئ حسابًا أو سجّل الدخول لفتح تذكرة ومتابعة الرد عليها.</p><div class="actions"><a class="btn primary" href="#/register">أنشئ حسابًا</a><a class="btn ghost" href="#/login">تسجيل الدخول</a></div></div>';
supBuilt="";return}
const mode=supOpenId?"conv":"list",key=u.uid+mode;
if(supBuilt!==key){
supBuilt=key;
root.innerHTML=mode==="conv"?'<div id="supConv"></div>':(admin?"":`<div class="card" id="supNew"><h3>تذكرة جديدة</h3><div class="options"><div class="field"><label>الموضوع</label><input type="text" id="supSubject" maxlength="100" placeholder="ملخص قصير للمشكلة"></div><div class="field"><label>النوع</label><select id="supCat">${Object.keys(SUP_CAT).map(k=>`<option value="${k}">${SUP_CAT[k]}</option>`).join("")}</select></div></div><div class="field"><label>التفاصيل</label><textarea id="supMsg" maxlength="1000" placeholder="اشرح مشكلتك أو طلبك بالتفصيل"></textarea></div><div class="actions"><button class="btn primary" data-sup="create">إرسال التذكرة</button></div><div class="status" id="supSt"></div></div>`)+'<div class="tk-tabs" id="supTabs"></div><div class="tk-list" id="supList"></div>'}
if(mode==="conv")renderSupConv();else renderSupList()}
function renderSupList(){
const admin=currentRole==="admin",tabs=document.getElementById("supTabs"),list=document.getElementById("supList");if(!list)return;
const cnt=k=>k==="all"?supTickets.length:supTickets.filter(t=>t.status===k).length;
tabs.innerHTML=[["all","الكل"],["open","مفتوحة"],["answered","تم الرد"],["closed","مغلقة"]].map(([k,l])=>`<button class="tk-tab${supFilter===k?" on":""}" data-sup="filter" data-k="${k}">${l} <b>${cnt(k)}</b></button>`).join("");
const rows=supTickets.filter(t=>supFilter==="all"||t.status===supFilter);
list.innerHTML=rows.length?rows.map(t=>`<button class="tk" data-sup="open" data-id="${esc(t.id)}"><span class="tk-st ${esc(t.status)}">${esc(SUP_ST[t.status]||t.status)}</span><strong>${esc(t.subject)}</strong><small>${admin?esc(t.email||t.name||"")+" · ":""}${esc(SUP_CAT[t.category]||"")} · ${supTime(t.updatedAt)}</small></button>`).join(""):`<div class="admin-empty">${admin?"لا توجد تذاكر هنا.":"لا توجد تذاكر بعد. إن احتجت مساعدة فافتح تذكرة جديدة أعلاه."}</div>`}
function renderSupConv(){
const box=document.getElementById("supConv");if(!box)return;
const t=supTickets.find(x=>x.id===supOpenId);
if(!t){supOpenId=null;supCloseMsgs();supBuilt="";renderSupport();return}
const admin=currentRole==="admin",closed=t.status==="closed",prev=document.getElementById("supReply"),draft=prev?prev.value:"";
box.innerHTML=`<div class="card"><div class="tk-head"><button class="btn ghost" data-sup="back">‹ رجوع</button><span class="tk-st ${esc(t.status)}">${esc(SUP_ST[t.status]||t.status)}</span></div><h3>${esc(t.subject)}</h3><small class="tk-meta">${admin?esc(t.name||"")+" · "+esc(t.email||"")+" · ":""}${esc(SUP_CAT[t.category]||"")} · ${supTime(t.createdAt)}</small><div class="msgs">${supMsgs.map(m=>`<div class="msg ${m.by==="admin"?"admin":"user"}"><header><strong>${m.by==="admin"?"الدعم الفني":esc(m.name||"عضو")}</strong><time>${supTime(m.createdAt)}</time></header><p>${esc(m.text)}</p></div>`).join("")}</div>${closed?'<div class="admin-empty">هذه التذكرة مغلقة.</div>':'<div class="field"><label>ردّك</label><textarea id="supReply" maxlength="1000"></textarea></div><div class="actions"><button class="btn primary" data-sup="reply">إرسال الرد</button></div>'}<div class="status" id="supSt"></div><div class="actions">${closed?'<button class="btn ghost" data-sup="reopen">إعادة فتح التذكرة</button>':'<button class="btn ghost" data-sup="close">إغلاق التذكرة</button>'}${admin?'<button class="btn danger" data-sup="del">حذف التذكرة</button>':""}</div></div>`;
const r=document.getElementById("supReply");if(r)r.value=draft}
function supOpen(id){
supOpenId=id;supCloseMsgs();supBuilt="";
supMsgUnsub=db.collection("tickets").doc(id).collection("messages").orderBy("createdAt").onSnapshot(s=>{supMsgs=s.docs.map(d=>d.data());renderSupConv()},()=>{});
renderSupport()}
async function supCreate(){
const u=auth.currentUser,st=document.getElementById("supSt");if(!u)return;
const subject=document.getElementById("supSubject").value.trim(),text=document.getElementById("supMsg").value.trim(),category=document.getElementById("supCat").value;
if(subject.length<3)return setStatus(st,"warning","اكتب موضوعًا واضحًا (3 أحرف على الأقل).");
if(text.length<10)return setStatus(st,"warning","اشرح مشكلتك بتفصيل أكثر (10 أحرف على الأقل).");
if(supTickets.filter(t=>t.status!=="closed").length>=5)return setStatus(st,"warning","لديك 5 تذاكر غير مغلقة. أغلق بعضها قبل فتح تذكرة جديدة.");
setStatus(st,"loading","جارٍ الإرسال...");
try{
const ts=firebase.firestore.FieldValue.serverTimestamp(),ref=db.collection("tickets").doc(),name=(u.displayName||"عضو").slice(0,40),batch=db.batch();
batch.set(ref,{uid:u.uid,name,email:u.email||"",subject:subject.slice(0,100),category,status:"open",createdAt:ts,updatedAt:ts});
batch.set(ref.collection("messages").doc(),{by:"user",name,text:text.slice(0,1000),createdAt:ts});
await batch.commit();
document.getElementById("supSubject").value="";document.getElementById("supMsg").value="";
setStatus(st,"success","تم إرسال تذكرتك. سيصلك الرد هنا في هذه الصفحة.")
}catch(e){setStatus(st,"error","تعذر إرسال التذكرة. تأكد من الاتصال ومن قواعد Firestore.")}}
async function supReply(){
const u=auth.currentUser,admin=currentRole==="admin",t=supTickets.find(x=>x.id===supOpenId),box=document.getElementById("supReply"),st=document.getElementById("supSt");
if(!u||!t||!box)return;
const text=box.value.trim();if(!text)return setStatus(st,"warning","اكتب ردك أولًا.");
box.value="";
try{
const ts=firebase.firestore.FieldValue.serverTimestamp(),ref=db.collection("tickets").doc(t.id),batch=db.batch();
batch.set(ref.collection("messages").doc(),{by:admin?"admin":"user",name:admin?"الدعم الفني":(u.displayName||"عضو").slice(0,40),text:text.slice(0,1000),createdAt:ts});
batch.update(ref,{status:admin?"answered":"open",updatedAt:ts});
await batch.commit();clearStatus(st)
}catch(e){const b2=document.getElementById("supReply");if(b2)b2.value=text;setStatus(document.getElementById("supSt"),"error","تعذر إرسال الرد.")}}
async function supSetStatus(s){
const t=supTickets.find(x=>x.id===supOpenId),st=document.getElementById("supSt");if(!t)return;
try{await db.collection("tickets").doc(t.id).update({status:s,updatedAt:firebase.firestore.FieldValue.serverTimestamp()})}
catch(e){setStatus(st,"error","تعذر تغيير حالة التذكرة.")}}
async function supDelete(){
if(currentRole!=="admin"||!supOpenId||!confirm("حذف هذه التذكرة وكل رسائلها نهائيًا؟"))return;
const st=document.getElementById("supSt"),ref=db.collection("tickets").doc(supOpenId);
try{
const snap=await ref.collection("messages").get(),batch=db.batch();
snap.docs.forEach(d=>batch.delete(ref.collection("messages").doc(d.id)));
batch.delete(ref);await batch.commit();
supOpenId=null;supCloseMsgs();supBuilt="";renderSupport()
}catch(e){setStatus(st,"error","تعذر حذف التذكرة.")}}
document.addEventListener("click",e=>{
const b=e.target.closest&&e.target.closest("[data-sup]");if(!b)return;
const a=b.dataset.sup;
if(a==="filter"){supFilter=b.dataset.k;renderSupList()}
else if(a==="open")supOpen(b.dataset.id);
else if(a==="back"){supOpenId=null;supCloseMsgs();supBuilt="";renderSupport()}
else if(a==="create")supCreate();
else if(a==="reply")supReply();
else if(a==="close")supSetStatus("closed");
else if(a==="reopen")supSetStatus("open");
else if(a==="del")supDelete()});

/* ===== PWA: العامل الخدمي، زر التثبيت، وشريطا الاتصال والتحديث ===== */
(function(){
const secure=location.protocol==="https:"||location.hostname==="localhost"||location.hostname==="127.0.0.1";
function bar(cls,html){const d=document.createElement("div");d.className="net-bar "+cls;d.innerHTML=html;d.hidden=true;document.body.appendChild(d);return d}
const off=bar("off","أنت غير متصل بالإنترنت. أدوات الملفات تعمل، أما الحساب والتقييمات والدعم فتحتاج اتصالًا.");
off.hidden=navigator.onLine;
addEventListener("online",()=>{off.hidden=true});
addEventListener("offline",()=>{off.hidden=false});
const upd=bar("upd",'يتوفر تحديث جديد للتطبيق. <button type="button" class="btn primary" id="swReload">تحديث الآن</button>');
upd.querySelector("#swReload").onclick=()=>location.reload();
if("serviceWorker" in navigator&&secure){
let had=!!navigator.serviceWorker.controller;
navigator.serviceWorker.addEventListener("controllerchange",()=>{if(had)upd.hidden=false;had=true});
addEventListener("load",()=>{navigator.serviceWorker.register("sw.js").catch(()=>{})})}
const btn=document.getElementById("installBtn");
const standalone=matchMedia("(display-mode: standalone)").matches||navigator.standalone===true;
const ios=/iphone|ipad|ipod/i.test(navigator.userAgent)&&!window.MSStream;
let deferred=null;
if(btn&&!standalone){
addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferred=e;btn.hidden=false});
if(ios&&secure)btn.hidden=false;
btn.addEventListener("click",async()=>{
if(deferred){deferred.prompt();try{await deferred.userChoice}catch(_){}deferred=null;btn.hidden=true}
else alert("لتثبيت التطبيق على الآيفون: اضغط زر المشاركة في Safari ثم اختر «إضافة إلى الشاشة الرئيسية».")});
addEventListener("appinstalled",()=>{btn.hidden=true})}
})();

/* قائمة الجوال: فتح/إغلاق الشريط الجانبي */
(function(){
const btn=document.getElementById("menuToggle");
const side=document.getElementById("sidebar");
if(!btn||!side)return;
btn.setAttribute("aria-expanded","false");
btn.addEventListener("click",e=>{
e.stopPropagation();
const open=side.classList.toggle("open");
btn.setAttribute("aria-expanded",String(open));
});
document.addEventListener("click",e=>{
if(side.classList.contains("open")&&!side.contains(e.target)){
side.classList.remove("open");
btn.setAttribute("aria-expanded","false");
}
});
document.addEventListener("keydown",e=>{
if(e.key==="Escape")side.classList.remove("open");
});
})();

/* ثلاثي الأبعاد: رزمة الأوراق تتبع المؤشر، والبطاقات تميل عند التمرير */
(function(){
if(matchMedia("(prefers-reduced-motion: reduce)").matches||matchMedia("(hover: none)").matches)return;
const stack=document.querySelector(".paper-stack");
let tilted=null;
document.addEventListener("pointermove",e=>{
if(stack){
const x=e.clientX/innerWidth-.5,y=e.clientY/innerHeight-.5;
stack.style.setProperty("--ry",(-18+x*-26)+"deg");
stack.style.setProperty("--rx",(8+y*-22)+"deg");
}
const el=e.target.closest&&e.target.closest(".ws-card,.how-box");
if(tilted&&tilted!==el){tilted.style.transform="";tilted=null}
if(!el||el.classList.contains("dragging"))return;
tilted=el;
const r=el.getBoundingClientRect();
const px=(e.clientX-r.left)/r.width-.5,py=(e.clientY-r.top)/r.height-.5;
el.style.transform=`perspective(700px) rotateX(${(-py*12).toFixed(1)}deg) rotateY(${(px*12).toFixed(1)}deg) translateY(-4px)`;
});
document.addEventListener("pointerleave",()=>{if(tilted){tilted.style.transform="";tilted=null}});
})();

/* ===== لمسات إبداعية: مرور الألواح، انفجار CMYK عند النجاح، اختصار البحث ===== */
(function(){
const calm=matchMedia("(prefers-reduced-motion: reduce)").matches;
document.addEventListener("keydown",e=>{
const t=e.target.tagName;if(e.key==="/"&&!["INPUT","TEXTAREA","SELECT"].includes(t)){e.preventDefault();const s=document.getElementById("toolSearch");if(s){document.getElementById("sidebar").classList.add("open");s.focus()}}});
const ph=document.getElementById("toolSearch");if(ph)ph.placeholder="ابحث عن أداة... (اضغط /)";
if(calm)return;
const w=document.createElement("div");w.className="press-wipe";w.innerHTML="<i></i><i></i><i></i><i></i>";document.body.appendChild(w);
let flip=0,px=innerWidth/2,py=innerHeight/2;
addEventListener("pointerdown",e=>{px=e.clientX;py=e.clientY},true);
const iris=document.createElement("div");iris.className="iris";document.body.appendChild(iris);
iris.addEventListener("animationend",()=>iris.classList.remove("go"));
addEventListener("hashchange",()=>{
if(flip++%2){iris.style.setProperty("--x",px+"px");iris.style.setProperty("--y",py+"px");iris.classList.remove("go");void iris.offsetWidth;iris.classList.add("go")}
else{w.classList.remove("go");void w.offsetWidth;w.classList.add("go")}});
w.addEventListener("animationend",e=>{if(e.target===w.lastChild)w.classList.remove("go")});
const cv=document.createElement("canvas");cv.className="burst";document.body.appendChild(cv);
const x=cv.getContext("2d"),cols=["#00aeef","#ec008c","#ffe14a","#ffffff"];let ps=[],run=false;
const fit=()=>{cv.width=innerWidth;cv.height=innerHeight};fit();addEventListener("resize",fit);
function tick(){
x.clearRect(0,0,cv.width,cv.height);ps=ps.filter(p=>p.l>0);
ps.forEach(p=>{p.vy+=.35;p.x+=p.vx;p.y+=p.vy;p.a+=p.vr;p.l--;x.save();x.translate(p.x,p.y);x.rotate(p.a);x.globalAlpha=Math.min(1,p.l/20);x.fillStyle=p.c;x.fillRect(-p.s/2,-p.s/2,p.s,p.s);x.restore()});
if(ps.length)requestAnimationFrame(tick);else run=false}
function burst(el){
const r=el.getBoundingClientRect(),cx=r.left+r.width/2,cy=Math.max(80,Math.min(innerHeight-80,r.top+r.height/2));
for(let i=0;i<46;i++){const a=Math.random()*Math.PI*2,v=4+Math.random()*7;
ps.push({x:cx,y:cy,vx:Math.cos(a)*v,vy:Math.sin(a)*v-5,a:0,vr:(Math.random()-.5)*.4,s:6+Math.random()*7,c:cols[i%4],l:70+Math.random()*30})}
if(!run){run=true;tick()}}
new MutationObserver(ms=>ms.forEach(m=>m.addedNodes.forEach(n=>{
if(n.nodeType!==1)return;
const el=n.matches(".pdf-ready")?n:n.querySelector(".pdf-ready");if(el)burst(el)}))).observe(document.body,{childList:true,subtree:true});
})();
