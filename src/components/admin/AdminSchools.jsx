import { useEffect, useState } from "react";
import { collection, addDoc, deleteDoc, doc, onSnapshot, orderBy, query, updateDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";

export default function AdminSchools() {
  const [schools,setSchools]=useState([]),[students,setStudents]=useState([]),[name,setName]=useState("");
  useEffect(()=>onSnapshot(query(collection(db,"schools"),orderBy("name","asc")),s=>setSchools(s.docs.map(d=>({id:d.id,...d.data()})))),[]);
  useEffect(()=>onSnapshot(query(collection(db,"students"),orderBy("name","asc")),s=>setStudents(s.docs.map(d=>({id:d.id,...d.data()})))),[]);
  const add=async e=>{e.preventDefault();if(!name.trim())return;await addDoc(collection(db,"schools"),{name:name.trim(),adminIds:[]});setName("");};
  const toggle=async(school,studentId)=>{
    const ids=new Set(school.adminIds||[]); ids.has(studentId)?ids.delete(studentId):ids.add(studentId);
    await updateDoc(doc(db,"schools",school.id),{adminIds:[...ids]});
    const s=students.find(x=>x.id===studentId);const old=new Set(s?.adminSchoolIds||[]);
    ids.has(studentId)?old.add(school.id):old.delete(school.id);
    await updateDoc(doc(db,"students",studentId),{adminSchoolIds:[...old]});
  };
  return <div className="grid md:grid-cols-2 gap-6">
    <form onSubmit={add} className="card p-5 space-y-3 h-fit"><h3 className="font-display font-bold text-teal-950">إضافة مدرسة</h3><input value={name} onChange={e=>setName(e.target.value)} placeholder="اسم المدرسة" className="field-input"/><button className="w-full bg-teal-900 text-sand-50 py-2.5 rounded-xl font-body font-semibold">إضافة المدرسة</button></form>
    <div className="card p-5"><h3 className="font-display font-bold text-teal-950 mb-3">المدارس والأدمنية</h3><div className="space-y-4">{schools.map(s=><div key={s.id} className="border-b pb-4"><div className="flex justify-between"><b className="font-body">{s.name}</b><button onClick={()=>deleteDoc(doc(db,"schools",s.id))} className="text-bad text-xs font-body">حذف</button></div><p className="text-xs text-ink/50 font-body mt-1">حدد أي عدد من الأدمنية:</p><div className="grid sm:grid-cols-2 gap-2 mt-2">{students.filter(x=>x.schoolId===s.id).map(st=><label key={st.id} className="flex items-center gap-2 border rounded-lg px-3 py-2 text-sm font-body"><input type="checkbox" checked={(s.adminIds||[]).includes(st.id)} onChange={()=>toggle(s,st.id)}/>{st.name}</label>)}</div></div>)}</div></div>
  </div>;
}
