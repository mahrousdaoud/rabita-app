import { useEffect,useState } from "react";
import { collection,doc,onSnapshot,query,updateDoc,where,deleteDoc,Timestamp } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";

export default function AdminExcuses(){
  const {adminTeamIds,adminSchoolIds,excuseAdminTeamIds,isExcuseAdmin,isSuperAdmin,profile}=useAuth();
  const [excuses,setExcuses]=useState([]);
  const canAll=isSuperAdmin || (isExcuseAdmin && !excuseAdminTeamIds.length && !adminTeamIds.length && !adminSchoolIds.length);
  const teamScope=Array.from(new Set([...adminTeamIds,...excuseAdminTeamIds]));
  useEffect(()=>{
    const unsubs=[]; const combined={}; const flush=()=>setExcuses(Object.values(combined).sort((a,b)=>(b.createdAt?.toMillis?.()||0)-(a.createdAt?.toMillis?.()||0)));
    const add=s=>{s.docs.forEach(d=>combined[d.id]={id:d.id,...d.data()});flush()};
    if(canAll) unsubs.push(onSnapshot(collection(db,"excuses"),add));
    else {
      teamScope.forEach(id=>unsubs.push(onSnapshot(query(collection(db,"excuses"),where("teamId","==",id)),add)));
      adminSchoolIds.forEach(id=>unsubs.push(onSnapshot(query(collection(db,"excuses"),where("schoolId","==",id)),add)));
    }
    return()=>unsubs.forEach(u=>u());
  },[canAll,teamScope.join(","),adminSchoolIds.join(",")]);
  if(!isExcuseAdmin&&!teamScope.length&&!adminSchoolIds.length)return <p className="text-sm font-body text-ink/40">لا توجد صلاحية لعرض الاعتذارات.</p>;
  const respond=async(x,status)=>{
    const payload={status,updatedAt:Timestamp.now()};
    if(status==="rejected"){payload.rejectedByName=profile?.name||"القائد";payload.rejectedByPhone=profile?.phone||"";payload.adminReply="تم رفض الاعتذار، برجاء التواصل مع القائد هاتفيًا.";}
    await updateDoc(doc(db,"excuses",x.id),payload);
  };
  return <div className="space-y-3">{excuses.map(x=><div key={x.id} className="bg-white rounded-xl2 shadow-sm border border-teal-900/5 p-4">
    <div className="flex justify-between gap-3"><div><b className="font-body text-teal-900">{x.studentName}</b><p className="text-xs text-ink/50">{x.teamName||x.teamId||""}</p><p className="text-sm font-body mt-1">{x.meetingTitle}</p><p className="text-sm font-body text-ink/70 mt-2">سبب الاعتذار: {x.reason}</p></div><span className="text-xs font-body text-ink/40">{x.status==="new"?"جديد":x.status==="accepted"?"مقبول":"مرفوض"}</span></div>
    {x.status==="new"&&<div className="flex gap-2 mt-3"><button onClick={()=>respond(x,"accepted")} className="bg-good text-white px-4 py-2 rounded-lg text-xs font-body font-semibold">قبول الاعتذار</button><button onClick={()=>respond(x,"rejected")} className="bg-bad text-white px-4 py-2 rounded-lg text-xs font-body font-semibold">رفض الاعتذار</button></div>}
    {x.status==="rejected"&&<div className="mt-3 rounded-lg bg-bad/5 border border-bad/10 p-3 text-xs font-body">تم رفض الاعتذار. {x.rejectedByName||""}{x.rejectedByPhone?` — ${x.rejectedByPhone}`:""}</div>}
    <button onClick={async()=>{if(confirm("حذف الاعتذار؟"))await deleteDoc(doc(db,"excuses",x.id))}} className="mt-3 text-bad text-xs font-body">حذف الاعتذار</button>
  </div>)}{!excuses.length&&<p className="text-sm font-body text-ink/40">لا توجد اعتذارات دلوقتي.</p>}</div>
}
