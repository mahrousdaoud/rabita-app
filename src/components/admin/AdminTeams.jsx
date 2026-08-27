import { useEffect, useState } from "react";
import { collection, addDoc, deleteDoc, doc, onSnapshot, orderBy, query, updateDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";

const DAIRMWAS_CASH = "01282802083";

export default function AdminTeams() {
  const [teams,setTeams]=useState([]), [students,setStudents]=useState([]), [name,setName]=useState("");
  useEffect(()=>onSnapshot(query(collection(db,"teams"),orderBy("name","asc")),s=>setTeams(s.docs.map(d=>({id:d.id,...d.data()})))),[]);
  useEffect(()=>onSnapshot(query(collection(db,"students"),orderBy("name","asc")),s=>setStudents(s.docs.map(d=>({id:d.id,...d.data()})))),[]);

  const addTeam=async e=>{e.preventDefault(); if(!name.trim())return; await addDoc(collection(db,"teams"),{name:name.trim(),adminIds:[],cashNumber:name.trim()==="ديرمواس"?DAIRMWAS_CASH:""});setName("");};
  const removeTeam=async id=>{if(confirm("متأكد إنك عايز تمسح الفريق ده؟"))await deleteDoc(doc(db,"teams",id));};
  const toggleAdmin=async(t,studentId)=>{
    const ids=new Set(t.adminIds||[]);
    ids.has(studentId)?ids.delete(studentId):ids.add(studentId);
    const next=[...ids];
    await updateDoc(doc(db,"teams",t.id),{adminIds:next});
    const s=students.find(x=>x.id===studentId); const old=new Set([...(s?.adminTeamIds||[]),...(s?.adminTeamId?[s.adminTeamId]:[])]);
    next.includes(studentId)?old.add(t.id):old.delete(t.id);
    await updateDoc(doc(db,"students",studentId),{adminTeamIds:[...old],adminTeamId:[...old][0]||null});
  };
  const saveCash=async(t,value)=>updateDoc(doc(db,"teams",t.id),{cashNumber:value.trim()});
  return <div className="grid md:grid-cols-2 gap-6">
    <form onSubmit={addTeam} className="card p-5 space-y-3 h-fit">
      <h3 className="font-display font-bold text-teal-950">إضافة فريق جديد</h3>
      <input placeholder="اسم الفريق (مثال: ديرمواس)" value={name} onChange={e=>setName(e.target.value)} className="field-input"/>
      <button className="w-full bg-teal-900 text-sand-50 font-body font-semibold py-2.5 rounded-xl">إضافة الفريق</button>
    </form>
    <div className="card p-5">
      <h3 className="font-display font-bold text-teal-950 mb-3">الفرق والأدمنية</h3>
      <ul className="space-y-4 max-h-[42rem] overflow-y-auto">{teams.map(t=>{
        const members=students.filter(s=>s.teamId===t.id);
        const admins=t.adminIds||[];
        return <li key={t.id} className="border-b border-ink/5 pb-4">
          <div className="flex justify-between"><div><p className="font-body font-semibold">{t.name}</p><p className="text-xs text-ink/50">{members.length} عضو · {admins.length} أدمن</p></div><button onClick={()=>removeTeam(t.id)} className="text-bad text-xs font-body">حذف</button></div>
          <label className="field-label mt-3">رقم كاش الفريق (اختياري)</label>
          <input defaultValue={t.cashNumber||""} onBlur={e=>saveCash(t,e.target.value)} placeholder={t.name==="ديرمواس"?DAIRMWAS_CASH:"رقم الكاش"} className="field-input mb-3"/>
          <p className="text-xs font-body text-ink/50 mb-2">اختار أي عدد من قادة الفريق:</p>
          <div className="grid sm:grid-cols-2 gap-2">{members.map(s=><label key={s.id} className="flex items-center gap-2 border rounded-lg px-3 py-2 font-body text-sm">
            <input type="checkbox" checked={admins.includes(s.id)} onChange={()=>toggleAdmin(t,s.id)}/><span>{s.name}</span>
          </label>)}</div>
          {!members.length&&<p className="text-xs text-ink/40">لا يوجد أعضاء في الفريق بعد.</p>}
        </li>;
      })}</ul>
    </div>
  </div>;
}
