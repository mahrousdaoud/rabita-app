import { useEffect, useState } from "react";
import { collection, addDoc, deleteDoc, doc, onSnapshot, orderBy, query, Timestamp } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";

export default function AdminMeetings({ type="meeting" }) {
  const {isSuperAdmin,adminTeamIds,adminSchoolIds}=useAuth();
  const [items,setItems]=useState([]),[teams,setTeams]=useState([]),[title,setTitle]=useState(""),[date,setDate]=useState(""),[location,setLocation]=useState(""),[notes,setNotes]=useState(""),[teamId,setTeamId]=useState("");
  useEffect(()=>onSnapshot(query(collection(db,"meetings"),orderBy("date","desc")),s=>setItems(s.docs.map(d=>({id:d.id,...d.data()})))),[]);
  useEffect(()=>onSnapshot(query(collection(db,"teams"),orderBy("name","asc")),s=>setTeams(s.docs.map(d=>({id:d.id,...d.data()})))),[]);
  const visible=items.filter(m=>m.type===(type==="event"?"event":"meeting")&&(isSuperAdmin||!m.teamId||adminTeamIds.includes(m.teamId)));
  const add=async e=>{e.preventDefault();if(!title||!date)return;const effectiveTeamId=isSuperAdmin?(teamId||null):(adminTeamIds[0]||null);
    const effectiveSchoolId=(!isSuperAdmin && !effectiveTeamId)?(adminSchoolIds[0]||null):null;
    const team=teams.find(t=>t.id===effectiveTeamId);await addDoc(collection(db,"meetings"),{title,notes,location,teamId:effectiveTeamId,schoolId:effectiveSchoolId,teamName:team?.name||"كل الفرق",type,date:Timestamp.fromDate(new Date(date))});setTitle("");setDate("");setLocation("");setNotes("");};
  return <div className="grid md:grid-cols-2 gap-6">
    <form onSubmit={add} className="card p-5 space-y-3 h-fit">
      <h3 className="font-display font-bold text-teal-950">إضافة {type==="event"?"حدث":"لقاء"} جديد</h3>
      <input placeholder={type==="event"?"اسم الحدث":"عنوان اللقاء"} value={title} onChange={e=>setTitle(e.target.value)} className="field-input"/>
      <input type="datetime-local" value={date} onChange={e=>setDate(e.target.value)} className="field-input"/>
      <input placeholder="مكان اللقاء / الحدث" value={location} onChange={e=>setLocation(e.target.value)} className="field-input"/>
      {isSuperAdmin?<select value={teamId} onChange={e=>setTeamId(e.target.value)} className="field-input"><option value="">كل الفرق</option>{teams.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select>:<div className="bg-sand-50 rounded-xl p-3 text-sm font-body">سيتم ربطه بفريقك تلقائيًا.</div>}
      <textarea placeholder="ملاحظات (اختياري)" value={notes} onChange={e=>setNotes(e.target.value)} className="field-input resize-none" rows={3}/>
      <button className="w-full bg-teal-900 text-sand-50 font-body font-semibold py-2.5 rounded-xl">إضافة</button>
    </form>
    <div className="card p-5"><h3 className="font-display font-bold text-teal-950 mb-3">كل {type==="event"?"الأحداث":"اللقاءات"}</h3><ul className="space-y-3 max-h-[30rem] overflow-y-auto">{visible.map(m=><li key={m.id} className="flex justify-between gap-3 border-b pb-3"><div><p className="font-body font-semibold">{m.title}</p><p className="text-xs text-ink/50 font-body">{m.date?.toDate?.().toLocaleString("ar-EG")} · {m.location||"المكان غير محدد"} · {m.teamName||"كل الفرق"}</p></div><button onClick={()=>confirm("حذف؟")&&deleteDoc(doc(db,"meetings",m.id))} className="text-bad text-xs font-body">حذف</button></li>)}{!visible.length&&<p className="text-sm text-ink/40 font-body">لا يوجد {type==="event"?"أحداث":"لقاءات"}.</p>}</ul></div>
  </div>;
}
