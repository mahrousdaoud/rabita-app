import { useEffect, useState } from "react";
import { collection, doc, onSnapshot, orderBy, query, updateDoc, where } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";
const MONTH_NAMES=["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
const yearMonths=y=>Array.from({length:12},(_,i)=>`${y}-${String(i+1).padStart(2,"0")}`);
export default function AdminPayments(){
 const {isSuperAdmin,adminTeamIds,adminSchoolIds,paymentAdminTeamIds}=useAuth();
 const [students,setStudents]=useState([]),[selectedId,setSelectedId]=useState(""),[year,setYear]=useState(new Date().getFullYear()),[teamFilter,setTeamFilter]=useState("");
 useEffect(()=>{
   const unsubs=[],combined={}; const done=s=>{s.docs.forEach(d=>combined[d.id]={id:d.id,...d.data()});const x=Object.values(combined).sort((a,b)=>(a.name||"").localeCompare(b.name||"","ar"));setStudents(x);setSelectedId(p=>p||x[0]?.id||"");};
   const allowedTeams=Array.from(new Set([...adminTeamIds,...paymentAdminTeamIds]));
   if(isSuperAdmin) unsubs.push(onSnapshot(query(collection(db,"students"),orderBy("name","asc")),done));
   else {allowedTeams.forEach(id=>unsubs.push(onSnapshot(query(collection(db,"students"),where("teamId","==",id)),done)));adminSchoolIds.forEach(id=>unsubs.push(onSnapshot(query(collection(db,"students"),where("schoolId","==",id)),done)));}
   return()=>unsubs.forEach(u=>u());
 },[isSuperAdmin,adminTeamIds.join(","),paymentAdminTeamIds.join(","),adminSchoolIds.join(",")]);
 const visible=students.filter(s=>(!teamFilter||s.teamId===teamFilter)&&(isSuperAdmin||adminTeamIds.includes(s.teamId)||paymentAdminTeamIds.includes(s.teamId)||adminSchoolIds.includes(s.schoolId)));
 const teams=Array.from(new Map(visible.map(s=>[s.teamId,{id:s.teamId,name:s.teamName}])).values());
 const selected=visible.find(s=>s.id===selectedId),months=yearMonths(year),paid=new Set(selected?.paidMonths||[]);
 const toggle=async m=>{if(!selected)return;const x=new Set(selected.paidMonths||[]);x.has(m)?x.delete(m):x.add(m);await updateDoc(doc(db,"students",selected.id),{paidMonths:[...x]});};
 return <div className="grid md:grid-cols-3 gap-6">
   <div className="card p-4 h-fit"><div className="flex gap-2 mb-3">{teams.length>1&&<select value={teamFilter} onChange={e=>{setTeamFilter(e.target.value);setSelectedId("")}} className="field-input"><option value="">كل فرقي</option>{teams.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select>}</div><h3 className="font-display font-bold text-teal-950 mb-3">الأعضاء</h3><ul className="space-y-1 max-h-96 overflow-y-auto">{visible.map(s=><li key={s.id}><button onClick={()=>setSelectedId(s.id)} className={`w-full text-right px-3 py-2 rounded-lg text-sm font-body ${selectedId===s.id?"bg-teal-900 text-sand-50":"hover:bg-sand-100"}`}>{s.name}<span className="block text-[10px] opacity-60">{s.teamName}</span></button></li>)}</ul></div>
   <div className="md:col-span-2 card p-5">{selected?<><div className="flex justify-between items-center"><div><h3 className="font-display font-bold text-teal-950">{selected.name}</h3><p className="text-xs text-ink/50 font-body">{selected.teamName}</p></div><div className="flex gap-2 items-center"><button onClick={()=>setYear(y=>y-1)} className="px-2 py-1 border rounded">‹</button><span className="font-body text-sm">{year}</span><button onClick={()=>setYear(y=>y+1)} className="px-2 py-1 border rounded">›</button></div></div><p className="text-xs text-ink/50 font-body my-4">التعهد المدفوع: {months.filter(m=>paid.has(m)).length} من 12 شهر</p><div className="grid grid-cols-3 sm:grid-cols-4 gap-2">{months.map((m,i)=><button key={m} onClick={()=>toggle(m)} className={`px-2 py-2.5 rounded-lg text-xs font-body font-semibold border ${paid.has(m)?"bg-good/10 border-good text-good":"bg-bad/5 border-bad/30 text-bad"}`}>{MONTH_NAMES[i]}</button>)}</div></>:<p className="text-ink/40 font-body">اختر عضو</p>}</div>
 </div>;
}
