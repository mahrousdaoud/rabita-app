import { useEffect,useState } from "react";
import { collection,doc,onSnapshot,setDoc,deleteDoc,query,orderBy,updateDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";

export default function AdminSettings(){
 const {isSuperAdmin}=useAuth(); const {t}=useLanguage();
 const [students,setStudents]=useState([]),[teams,setTeams]=useState([]),[blocked,setBlocked]=useState([]),[excuseAdmins,setExcuseAdmins]=useState([]);
 useEffect(()=>onSnapshot(query(collection(db,"students"),orderBy("name","asc")),s=>setStudents(s.docs.map(d=>({id:d.id,...d.data()})))),[]);
 useEffect(()=>onSnapshot(query(collection(db,"teams"),orderBy("name","asc")),s=>setTeams(s.docs.map(d=>({id:d.id,...d.data()})))),[]);
 useEffect(()=>onSnapshot(collection(db,"blacklist"),s=>setBlocked(s.docs.map(d=>({id:d.id,...d.data()})))),[]);
 useEffect(()=>onSnapshot(doc(db,"appSettings","general"),s=>setExcuseAdmins(s.exists()?s.data().excuseAdminIds||[]:[])),[]);
 if(!isSuperAdmin)return <p className="font-body text-ink/50">Admin only.</p>;
 const toggleGlobal=async id=>{const next=excuseAdmins.includes(id)?excuseAdmins.filter(x=>x!==id):[...excuseAdmins,id];setExcuseAdmins(next);await setDoc(doc(db,"appSettings","general"),{excuseAdminIds:next},{merge:true})};
 const toggleTeam=async(t,id)=>{const old=t.excuseAdminIds||[],next=old.includes(id)?old.filter(x=>x!==id):[...old,id];await updateDoc(doc(db,"teams",t.id),{excuseAdminIds:next})};
 const toggleBlock=async s=>{if(blocked.some(x=>x.id===s.id))await deleteDoc(doc(db,"blacklist",s.id));else await setDoc(doc(db,"blacklist",s.id),{active:true,studentId:s.id,name:s.name,email:s.email,reason:"حجب بواسطة الإدارة",createdAt:new Date()})};
 const syncBirthdays=async()=>{const list=students.filter(s=>s.birthDate);await Promise.all(list.map(s=>setDoc(doc(db,"publicBirthdays",s.id),{name:s.name,birthDate:s.birthDate,month:Number(s.birthDate.slice(5,7)),day:Number(s.birthDate.slice(8,10)),active:true,updatedAt:new Date()},{merge:true})));alert(`تمت مزامنة ${list.length} عيد ميلاد`)};
 return <div className="grid lg:grid-cols-2 gap-6">
  <section className="card p-5"><h3 className="font-display font-bold text-teal-950 mb-2">أدمن اعتذارات عام</h3><p className="text-xs font-body text-ink/50 mb-4">الأدمن هنا يستقبل اعتذارات كل الفرق. ولو عايز كل فريق لوحده استخدم القسم التالي.</p><div className="grid sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto">{students.map(s=><label key={s.id} className="flex items-center gap-2 border rounded-lg px-3 py-2 text-sm font-body"><input type="checkbox" checked={excuseAdmins.includes(s.id)} onChange={()=>toggleGlobal(s.id)}/><span>{s.name}</span></label>)}</div></section>
  <section className="card p-5"><h3 className="font-display font-bold text-teal-950 mb-2">أدمن الاعتذارات لكل فريق</h3><p className="text-xs font-body text-ink/50 mb-4">اختار واحدًا أو أكثر لكل فريق. الأدمن يرى اعتذارات فريقه فقط.</p><div className="space-y-4 max-h-[32rem] overflow-y-auto">{teams.map(t=><div key={t.id} className="border rounded-xl p-3"><div className="flex justify-between mb-2"><b className="font-body">{t.name}</b><span className="text-[11px] text-ink/40">اختار أي عدد</span></div><div className="grid sm:grid-cols-2 gap-2">{students.filter(s=>s.teamId===t.id).map(s=><label key={s.id} className="flex items-center gap-2 text-sm font-body"><input type="checkbox" checked={(t.excuseAdminIds||[]).includes(s.id)} onChange={()=>toggleTeam(t,s.id)}/>{s.name}</label>)}</div>{!students.some(s=>s.teamId===t.id)&&<p className="text-xs text-ink/40">لا يوجد أعضاء في الفريق بعد.</p>}</div>)}</div></section>
  <section className="card p-5"><h3 className="font-display font-bold text-teal-950 mb-2">{t("blacklist")}</h3><p className="text-xs font-body text-ink/50 mb-4">العضو الموجود هنا يتم حجبه عن المنصة.</p><div className="space-y-2 max-h-96 overflow-y-auto">{students.map(s=>{const b=blocked.some(x=>x.id===s.id);return <div key={s.id} className="flex items-center justify-between border rounded-lg px-3 py-2"><div><b className="font-body text-sm">{s.name}</b><p className="text-[11px] text-ink/40">{s.email}</p></div><button onClick={()=>toggleBlock(s)} className={`px-3 py-1.5 rounded-lg text-xs font-body font-semibold ${b?"bg-bad text-white":"bg-sand-100 text-ink/70"}`}>{b?"إزالة من البلاك ليست":"حجب"}</button></div>})}</div></section>
  <section className="card p-5"><h3 className="font-display font-bold text-teal-950 mb-2">{t("birthdays")}</h3><p className="text-sm font-body text-ink/60 mb-3">أعياد الميلاد تتزامن تلقائيًا عند التسجيل، ويمكنك إعادة المزامنة هنا للأعضاء القدامى.</p><button onClick={syncBirthdays} className="bg-teal-900 text-white px-5 py-2.5 rounded-xl font-body font-semibold">مزامنة أعياد الميلاد</button></section>
 </div>
}
