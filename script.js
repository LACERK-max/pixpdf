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

const DAILY_LIMIT=4;
const USAGE_PREFIX="pixpdf_usage_";
const VIP_WHATSAPP_NUMBER="212669109665";

function isVip(){return currentRole==="admin"||currentVip===true}

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
return n;
}

function canUseConversion(){
if(isVip())return true;
return getDailyUsage()<DAILY_LIMIT;
}

function updateMenuVisibility(){
const convert=document.getElementById("groupConvert");
const pdf=document.getElementById("groupPdf");
const images=document.getElementById("groupImages");
const quick=document.getElementById("groupQuick");
const vipLink=document.getElementById("vipLink");

if(!convert)return;

if(isVip()){
convert.hidden=false;
pdf.hidden=false;
images.hidden=false;
quick.hidden=false;
if(vipLink)vipLink.hidden=false;
}else{
convert.hidden=false;
pdf.hidden=true;
images.hidden=true;
quick.hidden=true;
if(vipLink)vipLink.hidden=true;
}

updateMembershipAppearance();
}

function updateMembershipAppearance(){
const user=auth.currentUser;
const membership=!user?"guest":currentRole==="admin"?"admin":currentVip?"vip":"free";
document.body.dataset.membership=membership;
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

requestAnimationFrame(drawBackground);
}

drawBackground();

window.addEventListener("scroll",()=>{
const height=document.documentElement;
document.getElementById("scrollProgress").style.width=
(height.scrollTop/(height.scrollHeight-height.clientHeight)*100)+"%";
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

document.querySelectorAll(".page").forEach(item=>item.classList.remove("active"));

const target=document.getElementById("page-"+page)||document.getElementById("page-home");
target.classList.add("active");

document.querySelectorAll(".menu a").forEach(link=>{
link.classList.toggle("active",link.dataset.page===(document.getElementById("page-"+page)?page:"home"));
});

document.getElementById("sidebar").classList.remove("open");
window.scrollTo({top:0,behavior:"smooth"});

if(page==="admin")renderAdminPanel();
if(page==="account")renderAccount();
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
if(bytes<1024)return bytes+" B";
if(bytes<1048576)return (bytes/1024).toFixed(1)+" KB";
return (bytes/1048576).toFixed(2)+" MB";
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

auth.onAuthStateChanged(async user=>{
currentUser=user;
updateUserInterface(user);

if(user){
try{
const tokenResult=await user.getIdTokenResult(true);
const claims=tokenResult.claims||{};
const tokenRole=claims.role||null;

const document=await db.collection("users").doc(user.uid).get();

let firestoreRole="user";
let vip=false;

if(document.exists){
firestoreRole=document.data().role||"user";
vip=!!document.data().vipActive;
}else{
await db.collection("users").doc(user.uid).set({
email:user.email||"",
displayName:user.displayName||"",
role:"user",
vipActive:false,
createdAt:firebase.firestore.FieldValue.serverTimestamp()
});
}

currentRole=tokenRole==="admin"?"admin":firestoreRole==="admin"?"admin":"user";
currentVip=vip;

if(currentRole==="admin"&&firestoreRole!=="admin"){
await db.collection("users").doc(user.uid).update({role:"admin"});
}

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
chip.innerHTML=`<strong>${user.email||"مستخدم"}</strong><button onclick="doLogout()">خروج</button>`;
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
location.hash="#/account";
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
location.hash="#/account";
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
location.hash="#/account";
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

function resetPassword(){
const email=document.getElementById("loginEmail").value.trim();
const status=document.getElementById("loginStatus");

if(!email){
setStatus(status,"warning","أدخل بريدك أولًا.");
return;
}

setStatus(status,"loading","جارٍ إرسال رابط الاستعادة...");

auth.sendPasswordResetEmail(email)
.then(()=>setStatus(status,"success","تم إرسال رابط الاستعادة إلى بريدك."))
.catch(()=>setStatus(status,"error","تعذر إرسال البريد. تأكد من صحة البريد."));
}

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
<div class="account-row"><span>البريد</span><strong>${currentUser.email||"—"}</strong></div>
<div class="account-row"><span>الاسم</span><strong>${currentUser.displayName||"—"}</strong></div>
<div class="account-row"><span>النوع</span>${badge}</div>`;

logoutButton.hidden=false;
loginButton.hidden=true;
registerButton.hidden=true;
vipButton.hidden=isVip();
if(vipLink)vipLink.hidden=!isVip();
if(deleteArea)deleteArea.hidden=false;

const adminLink=document.getElementById("adminLink");
const adminLogout=document.getElementById("adminLogoutBtn");

adminLink.hidden=currentRole!=="admin";
adminLogout.hidden=currentRole!=="admin";
}

function upgradeVip(){
const user=auth.currentUser;

if(!user){
location.hash="#/login";
return;
}

const message=[
"مرحبًا، أريد تفعيل عضوية VIP في PixPDF.",
"",
`الاسم: ${user.displayName||"غير محدد"}`,
`البريد: ${user.email||"غير محدد"}`,
`معرّف الحساب: ${user.uid}`
].join("\\n");

const url=`https://wa.me/${VIP_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

window.open(url,"_blank","noopener,noreferrer");
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
<div class="row"><span>البريد</span><strong>${data.email||"غير متوفر"}</strong></div>
<div class="row"><span>الاسم</span><strong>${data.displayName||"غير متوفر"}</strong></div>
<div class="row"><span>UID</span><strong>${user.id}</strong></div>
<div class="row"><span>النوع</span>${badge}</div>
<div class="user-actions">
<button class="btn success" onclick="setVip(true,'${user.id}')">تفعيل VIP</button>
<button class="btn ghost" onclick="setVip(false,'${user.id}')">إلغاء VIP</button>
</div>`;

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
<div class="row"><span>البريد</span><strong>${data.email||"غير متوفر"}</strong></div>
<div class="row"><span>الاسم</span><strong>${data.displayName||"غير متوفر"}</strong></div>
<div class="row"><span>UID</span><strong>${document.id}</strong></div>
<div class="row"><span>النوع</span>${badge}</div>
<div class="user-actions">
<button class="btn success" onclick="setVip(true,'${document.id}')">تفعيل VIP</button>
<button class="btn ghost" onclick="setVip(false,'${document.id}')">إلغاء VIP</button>
</div>
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
role:active?"vip":"user"
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
<span class="ws-name">${item.file.name}</span>
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
workspaceProgressText.textContent=`جارٍ إضافة: ${item.file.name}`;

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
<span class="file-name">${file.name}</span>
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
<span class="file-name">${file.name}</span>
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
<span class="file-name">${file.name}</span>
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
setStatus(compressStatus,"loading",`جارٍ ضغط: ${file.name}`);

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