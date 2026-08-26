import { useEffect, useState } from "react";
import { collection, doc, onSnapshot, orderBy, query, updateDoc, where } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";

export default function AdminExcuses() {
  const {isSuperAdmin,adminTeamIds,adminSchoolIds}=useAuth();
  const [excuses,setExcuses]=useState([]);
  useEffect(()=>{
    if(isSuperAdmin) return onSnapshot(query(collection(db,"excuses"),orderBy("createdAt","desc")),s=>setExcuses(s.docs.map(d=>({id:d.id,...d.data()}))));
    if(adminTeamIds[0]) return onSnapshot(query(collection(db,"excuses"),where("teamId","==",adminTeamIds[0])),s=>setExcuses(s.docs.map(d=>({id:d.id,...d.data()}))));
    if(adminSchoolIds[0]) return onSnapshot(query(collection(db,"excuses"),where("schoolId","==",adminSchoolIds[0])),s=>setExcuses(s.docs.map(d=>({id:d.id,...d.data()}))));
  },[isSuperAdmin,adminTeamIds.join(","),adminSchoolIds.join(",")]);
  const visible=excuses.filter(x=>isSuperAdmin||adminTeamIds.includes(x.teamId)||adminSchoolIds.includes(x.schoolId));
  return <div className="space-y-3">{visible.map(x=><div key={x.id} className="card p-4">
    <div className="flex justify-between gap-3"><div><b className="font-body text-teal-900">{x.studentName}</b><p className="text-sm font-body mt-1">{x.meetingTitle}</p><p className="text-sm font-body text-ink/70 mt-2">سبب الاعتذار: {x.reason}</p></div><span className="text-xs font-body text-ink/40">{x.status==="new"?"جديد":"تم التعامل معه"}</span></div>
    {x.status==="new"&&<button onClick={()=>updateDoc(doc(db,"excuses",x.id),{status:"handled"})} className="mt-3 bg-teal-900 text-sand-50 px-4 py-2 rounded-lg text-xs font-body">تم التعامل مع الاعتذار</button>}
  </div>)}{!visible.length&&<p className="text-sm font-body text-ink/40">لا توجد اعتذارات ظاهرة لك.</p>}</div>;
}
