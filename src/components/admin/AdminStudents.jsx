import { useEffect, useState } from "react";
import { collection, deleteDoc, doc, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";
import StudentDetailModal from "./StudentDetailModal";

export default function AdminStudents() {
  const {isSuperAdmin,adminTeamIds,adminSchoolIds}=useAuth();
  const [students,setStudents]=useState([]),[teams,setTeams]=useState([]),[schools,setSchools]=useState([]),[search,setSearch]=useState(""),[teamFilter,setTeamFilter]=useState(""),[schoolFilter,setSchoolFilter]=useState(""),[selected,setSelected]=useState(null);
  useEffect(()=>{
    if (isSuperAdmin) return onSnapshot(query(collection(db,"students"),orderBy("name","asc")),s=>setStudents(s.docs.map(d=>({id:d.id,...d.data()}))));
    if (adminTeamIds[0]) return onSnapshot(query(collection(db,"students"),where("teamId","==",adminTeamIds[0])),s=>setStudents(s.docs.map(d=>({id:d.id,...d.data()}))));
    if (adminSchoolIds[0]) return onSnapshot(query(collection(db,"students"),where("schoolId","==",adminSchoolIds[0])),s=>setStudents(s.docs.map(d=>({id:d.id,...d.data()}))));
  },[isSuperAdmin,adminTeamIds.join(","),adminSchoolIds.join(",")]);
  useEffect(()=>onSnapshot(query(collection(db,"teams"),orderBy("name","asc")),s=>setTeams(s.docs.map(d=>({id:d.id,...d.data()})))),[]);
  useEffect(()=>onSnapshot(query(collection(db,"schools"),orderBy("name","asc")),s=>setSchools(s.docs.map(d=>({id:d.id,...d.data()})))),[]);
  const remove=async(id,name)=>{if(confirm(`متأكد إنك عايز تمسح ${name}؟`))await deleteDoc(doc(db,"students",id));};
  const scoped=students.filter(s=>isSuperAdmin || adminTeamIds.includes(s.teamId) || (s.schoolId && adminSchoolIds.includes(s.schoolId)));
  const filtered=scoped.filter(s=>`${s.name} ${s.teamName} ${s.region}`.toLowerCase().includes(search.toLowerCase())&&(!teamFilter||s.teamId===teamFilter)&&(!schoolFilter||s.schoolId===schoolFilter));
  return <div>
    <div className="flex flex-wrap gap-3 mb-4">
      <input placeholder="دور بالاسم أو الفريق أو المنطقة..." value={search} onChange={e=>setSearch(e.target.value)} className="field-input flex-1 min-w-[220px]"/>
      {isSuperAdmin&&<><select value={teamFilter} onChange={e=>setTeamFilter(e.target.value)} className="field-input w-auto"><option value="">كل الفرق</option>{teams.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select><select value={schoolFilter} onChange={e=>setSchoolFilter(e.target.value)} className="field-input w-auto"><option value="">كل المدارس</option>{schools.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></>}
    </div>
    <div className="card overflow-hidden overflow-x-auto"><table className="w-full text-sm font-body"><thead className="bg-sand-100"><tr><th className="text-right px-4 py-2.5">الاسم</th><th className="text-right px-4 py-2.5">الفريق</th><th className="text-right px-4 py-2.5">المدرسة</th><th className="text-right px-4 py-2.5">النوع</th><th className="px-4 py-2.5"></th></tr></thead><tbody>{filtered.map(s=><tr key={s.id} onClick={()=>setSelected(s)} className="border-t hover:bg-sand-50 cursor-pointer"><td className="px-4 py-2.5 font-medium">{s.name}</td><td className="px-4 py-2.5">{s.teamName}</td><td className="px-4 py-2.5">{s.schoolName||"—"}</td><td className="px-4 py-2.5">{s.gender==="male"?"ولد":"بنت"}</td><td className="px-4 py-2.5 text-left"><button onClick={e=>{e.stopPropagation();remove(s.id,s.name)}} className="text-bad text-xs">حذف</button></td></tr>)}</tbody></table>{!filtered.length&&<p className="p-6 text-center text-ink/40 font-body">لا يوجد طلاب مطابقين</p>}</div>
    {selected&&<StudentDetailModal student={selected} onClose={()=>setSelected(null)}/>}
  </div>;
}
