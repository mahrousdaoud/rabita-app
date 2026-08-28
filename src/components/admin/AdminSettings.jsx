import { useEffect, useState } from "react";
import { collection, doc, onSnapshot, setDoc, updateDoc, orderBy, query } from "firebase/firestore";
import { db } from "../../lib/firebase";

export default function AdminSettings(){
 const [students,setStudents]=useState([]),[settings,setSettings]=useState({excuseAdminIds:[]});
 useEffect(()=>onSnapshot(query(collection(db,"students"),orderBy("name","asc")),s=>setStudents(s.docs.map(d=>({id:d.id,...d.data()})))),[]);
 useEffect(()=>onSnapshot(doc(db,"settings","global"),s=>s.exists()&&setSettings(s.data())),[]);
 const toggleExcuseAdmin=async id=>{const ids=new Set(settings.excuseAdminIds||[]);ids.has(id)?ids.delete(id):ids.add(id);await setDoc(doc(db,"settings","global"),{excuseAdminIds:[...ids]},{merge:true});};
 const toggleBlacklist=async s=>{await updateDoc(doc(db,"students",s.id),{isBlacklisted:!s.isBlacklisted});};
 const syncBirthdays=async()=>{await Promise.all(students.map(s=>setDoc(doc(db,"publicMembers",s.id),{name:s.name,birthDate:s.birthDate||"",birthMonth:Number(s.birthMonth||s.birthDate?.split("-")[1]||0),birthDay:Number(s.birthDay||s.birthDate?.split("-")[2]||0),photoURL:s.photoURL||"",updatedAt:new Date()},{merge:true})));alert("تمت مزامنة أعياد الميلاد للأعضاء الحاليين.");};
 return <div className="space-y-6">
   <div className="card p-5"><div className="flex items-center justify-between gap-3 flex-wrap"><div><h3 className="font-display font-bold text-teal-950">إدارة أدمن الاعتذارات</h3><p className="text-xs text-ink/50 font-body mt-1">أي شخص تختاره هنا ستصله اعتذارات الأعضاء ويمكنه قبولها أو رفضها.</p></div></div><div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-4">{students.map(s=><label key={s.id} className="flex items-center gap-2 border rounded-lg px-3 py-2 text-sm font-body"><input type="checkbox" checked={(settings.excuseAdminIds||[]).includes(s.id)} onChange={()=>toggleExcuseAdmin(s.id)}/><span>{s.name}</span></label>)}</div></div>
   <div className="card p-5"><div className="flex items-center justify-between gap-3 flex-wrap"><div><h3 className="font-display font-bold text-teal-950">البلاك ليست</h3><p className="text-xs text-ink/50 font-body mt-1">الموجود في البلاك ليست لن يستطيع فتح أو قراءة محتوى المنصة.</p></div><button onClick={syncBirthdays} className="bg-gold-500 text-teal-950 px-4 py-2 rounded-xl font-body font-semibold text-sm">مزامنة أعياد الميلاد</button></div><div className="mt-4 space-y-2">{students.map(s=><div key={s.id} className="flex items-center justify-between gap-3 border rounded-xl p-3"><div><p className="font-body font-semibold">{s.name}</p><p className="text-xs text-ink/50">{s.email||""}</p></div><button onClick={()=>toggleBlacklist(s)} className={`px-3 py-1.5 rounded-lg text-xs font-body font-semibold ${s.isBlacklisted?"bg-good/10 text-good":"bg-bad/10 text-bad"}`}>{s.isBlacklisted?"إزالة من البلاك ليست":"حجب"}</button></div>)}</div></div>
 </div>;
}
