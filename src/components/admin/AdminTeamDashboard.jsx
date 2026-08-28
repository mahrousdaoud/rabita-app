import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";

export default function AdminTeamDashboard(){
 const {isSuperAdmin,adminTeamIds,adminSchoolIds}=useAuth();const[teams,setTeams]=useState([]),[students,setStudents]=useState([]),[meetings,setMeetings]=useState([]),[availability,setAvailability]=useState([]);
 useEffect(()=>onSnapshot(query(collection(db,"teams"),orderBy("name","asc")),s=>setTeams(s.docs.map(d=>({id:d.id,...d.data()})))),[]);
 useEffect(()=>{
  const done=s=>setStudents(s.docs.map(d=>({id:d.id,...d.data()})));
  if(isSuperAdmin) return onSnapshot(query(collection(db,"students"),orderBy("name","asc")),done);
  if(adminTeamIds[0]) return onSnapshot(query(collection(db,"students"),where("teamId","==",adminTeamIds[0])),done);
  if(adminSchoolIds[0]) return onSnapshot(query(collection(db,"students"),where("schoolId","==",adminSchoolIds[0])),done);
 },[isSuperAdmin,adminTeamIds.join(","),adminSchoolIds.join(",")]);
 useEffect(()=>onSnapshot(query(collection(db,"meetings"),orderBy("date","asc")),s=>setMeetings(s.docs.map(d=>({id:d.id,...d.data()})).filter(m=>new Date(m.date?.toDate?.()||m.date)>=new Date()&&(isSuperAdmin||!m.teamId||adminTeamIds.includes(m.teamId)||adminSchoolIds.includes(m.schoolId))))),[isSuperAdmin,adminTeamIds.join(","),adminSchoolIds.join(",")]);
 useEffect(()=>{
  const done=s=>setAvailability(s.docs.map(d=>d.data()));
  if(isSuperAdmin) return onSnapshot(collection(db,"availability"),done);
  if(adminTeamIds[0]) return onSnapshot(query(collection(db,"availability"),where("teamId","==",adminTeamIds[0])),done);
  if(adminSchoolIds[0]) return onSnapshot(query(collection(db,"availability"),where("schoolId","==",adminSchoolIds[0])),done);
 },[isSuperAdmin,adminTeamIds.join(","),adminSchoolIds.join(",")]);
 const visible=students.filter(s=>isSuperAdmin||adminTeamIds.includes(s.teamId)||adminSchoolIds.includes(s.schoolId)); const boys=visible.filter(s=>s.gender==="male"),girls=visible.filter(s=>s.gender==="female"),old=visible.filter(s=>s.memberType==="old"),nw=visible.filter(s=>s.memberType==="new"); const next=meetings[0]; const av=next?availability.filter(a=>a.eventId===next.id&&a.available&&visible.some(s=>s.id===a.studentId)): [];
 return <div className="space-y-6">{isSuperAdmin&&<select className="field-input max-w-sm"><option>كل الفرق</option>{teams.map(t=><option key={t.id}>{t.name}</option>)}</select>}<div className="grid grid-cols-2 md:grid-cols-4 gap-4"><Box l="إجمالي الأعضاء" v={visible.length}/><Box l="ولاد" v={boys.length}/><Box l="بنات" v={girls.length}/><Box l="فرق" v={isSuperAdmin?teams.length:new Set(visible.map(s=>s.teamId)).size}/></div><div className="grid md:grid-cols-2 gap-6"><div className="card p-5"><h3 className="font-display font-bold text-teal-950 mb-4">قديم / جديد</h3><p className="font-body text-sm">مدرسة قديمة: <b>{old.length}</b></p><p className="font-body text-sm mt-2">مدرسة جديدة: <b>{nw.length}</b></p></div><div className="card p-5"><h3 className="font-display font-bold text-teal-950 mb-3">مين متاح للحدث/اللقاء الجاي؟</h3>{next?<><p className="font-body text-sm text-ink/60 mb-3">{next.title}</p><div className="flex flex-wrap gap-2">{av.map(a=><span key={a.studentId} className="bg-good/10 text-good px-3 py-1.5 rounded-full text-xs font-body font-semibold">{visible.find(s=>s.id===a.studentId)?.name}</span>)}</div>{!av.length&&<p className="text-sm text-ink/40 font-body">لسه محدش أكد حضوره</p>}</>:<p className="text-sm text-ink/40 font-body">مفيش مواعيد قادمة</p>}</div></div></div>;
}
function Box({l,v}){return <div className="card p-5 text-center"><p className="font-display font-extrabold text-3xl text-teal-900">{v}</p><p className="font-body text-ink/60 text-sm mt-1">{l}</p></div>}
