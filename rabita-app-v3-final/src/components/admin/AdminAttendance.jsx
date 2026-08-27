import { useEffect, useState } from "react";
import { collection, doc, onSnapshot, orderBy, query, setDoc, where } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";

export default function AdminAttendance() {
  const {isSuperAdmin,adminTeamIds,adminSchoolIds}=useAuth(); const [meetings,setMeetings]=useState([]),[students,setStudents]=useState([]),[records,setRecords]=useState({}),[meetingId,setMeetingId]=useState("");
  useEffect(()=>onSnapshot(query(collection(db,"meetings"),orderBy("date","desc")),s=>{const x=s.docs.map(d=>({id:d.id,...d.data()})).filter(m=>m.type!=="event"&&(isSuperAdmin||!m.teamId||adminTeamIds.includes(m.teamId)||adminSchoolIds.includes(m.schoolId)));setMeetings(x);setMeetingId(p=>p||x[0]?.id||"");}),[isSuperAdmin,adminTeamIds.join(",")]);
  useEffect(()=>{
    if(isSuperAdmin) return onSnapshot(query(collection(db,"students"),orderBy("name","asc")),s=>setStudents(s.docs.map(d=>({id:d.id,...d.data()}))));
    if(adminTeamIds[0]) return onSnapshot(query(collection(db,"students"),where("teamId","==",adminTeamIds[0])),s=>setStudents(s.docs.map(d=>({id:d.id,...d.data()}))));
    if(adminSchoolIds[0]) return onSnapshot(query(collection(db,"students"),where("schoolId","==",adminSchoolIds[0])),s=>setStudents(s.docs.map(d=>({id:d.id,...d.data()}))));
  },[isSuperAdmin,adminTeamIds.join(","),adminSchoolIds.join(",")]);
  useEffect(()=>{
    if(!meetingId) return;
    const done=s=>{const map={};s.docs.forEach(d=>{const x=d.data();if(x.meetingId===meetingId)map[x.studentId]=x.present});setRecords(map);};
    if(isSuperAdmin) return onSnapshot(collection(db,"attendanceRecords"),done);
    if(adminTeamIds[0]) return onSnapshot(query(collection(db,"attendanceRecords"),where("teamId","==",adminTeamIds[0])),done);
    if(adminSchoolIds[0]) return onSnapshot(query(collection(db,"attendanceRecords"),where("schoolId","==",adminSchoolIds[0])),done);
  },[meetingId,isSuperAdmin,adminTeamIds.join(","),adminSchoolIds.join(",")]);
  const visible=students.filter(s=>isSuperAdmin||adminTeamIds.includes(s.teamId)||adminSchoolIds.includes(s.schoolId));
  const toggle=async(s,present)=>{const m=meetings.find(x=>x.id===meetingId);await setDoc(doc(db,"attendanceRecords",`${meetingId}_${s.id}`),{meetingId,studentId:s.id,teamId:s.teamId,schoolId:s.schoolId||null,meetingTeamId:m?.teamId||null,present});};
  return <div><select value={meetingId} onChange={e=>setMeetingId(e.target.value)} className="field-input max-w-xl mb-4">{meetings.map(m=><option key={m.id} value={m.id}>{m.title} — {m.date?.toDate?.().toLocaleDateString("ar-EG")}</option>)}</select><div className="card overflow-x-auto"><table className="w-full text-sm font-body"><thead className="bg-sand-100"><tr><th className="text-right p-3">الاسم</th><th className="text-right p-3">الفريق</th><th className="text-right p-3">الحالة</th></tr></thead><tbody>{visible.map(s=><tr key={s.id} className="border-t"><td className="p-3">{s.name}</td><td className="p-3">{s.teamName}</td><td className="p-3"><div className="inline-flex border rounded-lg overflow-hidden"><button onClick={()=>toggle(s,true)} className={`px-3 py-1.5 text-xs ${records[s.id]===true?"bg-good text-white":"bg-white"}`}>حاضر</button><button onClick={()=>toggle(s,false)} className={`px-3 py-1.5 text-xs ${records[s.id]===false?"bg-bad text-white":"bg-white"}`}>غايب</button></div></td></tr>)}</tbody></table></div></div>;
}
