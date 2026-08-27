import { useEffect, useState } from "react";
import { collection, doc, onSnapshot, orderBy, query, updateDoc, where } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";
const MONTH_NAMES=["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
const yearMonths=y=>Array.from({length:12},(_,i)=>`${y}-${String(i+1).padStart(2,"0")}`);
export default function AdminPayments(){
 const {isSuperAdmin,adminTeamIds,adminSchoolIds}=useAuth();const[students,setStudents]=useState([]),[selectedId,setSelectedId]=useState(""),[year,setYear]=useState(new Date().getFullYear());
 useEffect(()=>{
   const done=s=>{const x=s.docs.map(d=>({id:d.id,...d.data()}));setStudents(x);setSelectedId(p=>p||x[0]?.id||"");};
   if(isSuperAdmin) return onSnapshot(query(collection(db,"students"),orderBy("name","asc")),done);
   if(adminTeamIds[0]) return onSnapshot(query(collection(db,"students"),where("teamId","==",adminTeamIds[0])),done);
   if(adminSchoolIds[0]) return onSnapshot(query(collection(db,"students"),where("schoolId","==",adminSchoolIds[0])),done);
 },[isSuperAdmin,adminTeamIds.join(","),adminSchoolIds.join(",")]);
 const selected=students.find(s=>s.id===selectedId),months=yearMonths(year),paid=new Set(selected?.paidMonths||[]);
 const toggle=async m=>{if(!selected)return;const x=new Set(selected.paidMonths||[]);x.has(m)?x.delete(m):x.add(m);await updateDoc(doc(db,"students",selected.id),{paidMonths:[...x]});};
 return <div className="grid md:grid-cols-3 gap-6"><div className="card p-4 h-fit"><h3 className="font-display font-bold text-teal-950 mb-3">الطلاب</h3><ul className="space-y-1 max-h-96 overflow-y-auto">{students.map(s=><li key={s.id}><button onClick={()=>setSelectedId(s.id)} className={`w-full text-right px-3 py-2 rounded-lg text-sm font-body ${selectedId===s.id?"bg-teal-900 text-sand-50":"hover:bg-sand-100"}`}>{s.name}</button></li>)}</ul></div><div className="md:col-span-2 card p-5">{selected?<><div className="flex justify-between items-center"><div><h3 className="font-display font-bold text-teal-950">{selected.name}</h3><p className="text-xs text-ink/50 font-body">{selected.teamName}</p></div><div className="flex gap-2 items-center"><button onClick={()=>setYear(y=>y-1)} className="px-2 py-1 border rounded">‹</button><span className="font-body text-sm">{year}</span><button onClick={()=>setYear(y=>y+1)} className="px-2 py-1 border rounded">›</button></div></div><p className="text-xs text-ink/50 font-body my-4">التعهد المدفوع: {months.filter(m=>paid.has(m)).length} من 12 شهر</p><div className="grid grid-cols-3 sm:grid-cols-4 gap-2">{months.map((m,i)=><button key={m} onClick={()=>toggle(m)} className={`px-2 py-2.5 rounded-lg text-xs font-body font-semibold border ${paid.has(m)?"bg-good/10 border-good text-good":"bg-bad/5 border-bad/30 text-bad"}`}>{MONTH_NAMES[i]}</button>)}</div></>:<p className="text-ink/40 font-body">اختر طالب</p>}</div></div>;
}
