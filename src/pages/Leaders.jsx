import { useEffect, useMemo, useState } from "react";
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, updateDoc, Timestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import TopBar from "../components/TopBar";

const empty={name:"",role:"",bio:"",birthDate:"",joinedAt:"",maritalStatus:"",region:"",phone:"",photoURL:""};
function ageFrom(date){if(!date)return "";const d=new Date(date),now=new Date();let a=now.getFullYear()-d.getFullYear();if(now.getMonth()<d.getMonth()||(now.getMonth()===d.getMonth()&&now.getDate()<d.getDate()))a--;return Math.max(a,0)}

export default function Leaders(){
 const {isSuperAdmin,teams}=useAuth(); const [leaders,setLeaders]=useState([]),[open,setOpen]=useState(false),[editing,setEditing]=useState(null),[teamId,setTeamId]=useState(""),[form,setForm]=useState(empty),[file,setFile]=useState(null),[saving,setSaving]=useState(false);
 useEffect(()=>onSnapshot(query(collection(db,"leaders"),orderBy("name","asc")),s=>setLeaders(s.docs.map(d=>({id:d.id,...d.data()})))),[]);
 const grouped=useMemo(()=>teams.map(t=>({team:t,leaders:leaders.filter(l=>l.teamId===t.id)})).filter(x=>x.leaders.length||isSuperAdmin),[teams,leaders,isSuperAdmin]);
 const start=(t,l=null)=>{setTeamId(t.id);setEditing(l);setForm(l?{...empty,...l}:{...empty});setFile(null);setOpen(true)};
 const save=async e=>{e.preventDefault();if(!form.name.trim()||!teamId)return;setSaving(true);try{
   let photoURL=form.photoURL||"";
   if(file){const safe=file.name.replace(/[^a-zA-Z0-9._-]/g,"_");const r=ref(storage,`leaders/${teamId}/${Date.now()}_${safe}`);await uploadBytes(r,file);photoURL=await getDownloadURL(r);}
   const team=teams.find(t=>t.id===teamId);const data={...form,name:form.name.trim(),teamId,teamName:team?.name||"",photoURL,age:ageFrom(form.birthDate),updatedAt:Timestamp.now()};
   if(editing) await updateDoc(doc(db,"leaders",editing.id),data); else await addDoc(collection(db,"leaders"),{...data,createdAt:Timestamp.now()});
   setOpen(false);
 }catch(err){alert(err.message)}finally{setSaving(false)}};
 const remove=async l=>{if(confirm(`حذف القائد ${l.name}؟`))await deleteDoc(doc(db,"leaders",l.id))};
 return <div className="min-h-screen bg-sand-50"><TopBar title="القادة — EGYPT SPORTS COALITION"/><main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
   <div className="flex items-center justify-between"><div><h1 className="font-display font-extrabold text-2xl text-teal-950">القادة</h1><p className="font-body text-sm text-ink/50">بيانات قادة كل فريق متاحة لكل أعضاء المنصة.</p></div>{isSuperAdmin&&<span className="text-xs font-body text-ink/50">أنت من يضيف ويعدل البيانات</span>}</div>
   {grouped.map(({team,leaders:ls})=><section key={team.id} className="card p-5"><div className="flex items-center justify-between mb-4"><h2 className="font-display font-bold text-xl text-teal-950">{team.name}</h2>{isSuperAdmin&&<button onClick={()=>start(team)} className="bg-teal-900 text-white px-4 py-2 rounded-xl font-body text-sm">+ إضافة قائد</button>}</div>
    {ls.length?<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">{ls.map(l=><article key={l.id} className="border rounded-xl2 p-4 bg-sand-50"><div className="flex gap-3">{l.photoURL?<img src={l.photoURL} className="w-20 h-20 rounded-2xl object-cover" alt=""/>:<div className="w-20 h-20 rounded-2xl bg-teal-900/10 flex items-center justify-center text-3xl">👤</div>}<div><h3 className="font-display font-bold text-teal-950">{l.name}</h3><p className="font-body text-sm text-teal-800">{l.role||"قائد بالفريق"}</p><p className="font-body text-xs text-ink/50 mt-1">{l.age?`${l.age} سنة`:""} {l.maritalStatus?` · ${l.maritalStatus}`:""}</p></div></div><div className="mt-3 space-y-1 text-sm font-body text-ink/75">{l.bio&&<p>{l.bio}</p>}{l.region&&<p>📍 {l.region}</p>}{l.joinedAt&&<p>📅 انضم للفريق: {l.joinedAt}</p>}{l.birthDate&&<p>🎂 تاريخ الميلاد: {l.birthDate}</p>}{l.phone&&<p>📞 {l.phone}</p>}</div>{isSuperAdmin&&<div className="flex gap-3 mt-4 text-xs font-body"><button onClick={()=>start(team,l)} className="text-teal-800">تعديل</button><button onClick={()=>remove(l)} className="text-bad">حذف</button></div>}</article>)}</div>:<p className="text-sm font-body text-ink/40">لم تتم إضافة قادة لهذا الفريق بعد.</p>}
   </section>)}
   {!grouped.length&&<div className="card p-8 text-center font-body text-ink/40">لا توجد فرق حاليًا.</div>}
 </main>
 {open&&<div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 overflow-y-auto"><form onSubmit={save} className="bg-white rounded-xl2 p-6 max-w-2xl w-full my-8 space-y-3"><div className="flex justify-between"><h2 className="font-display font-bold text-xl text-teal-950">{editing?"تعديل قائد":"إضافة قائد"}</h2><button type="button" onClick={()=>setOpen(false)}>✕</button></div><div className="grid md:grid-cols-2 gap-3">
 {["name","role","region","phone","birthDate","joinedAt","maritalStatus"].map(k=><div key={k}><label className="field-label">{({name:"الاسم",role:"دوره في الفريق",region:"المنطقة / المكان",phone:"رقم الهاتف",birthDate:"تاريخ الميلاد",joinedAt:"تاريخ الانضمام للفريق",maritalStatus:"الحالة الاجتماعية"}[k])}</label><input type={k==="birthDate"||k==="joinedAt"?"date":"text"} value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})} className="field-input"/></div>)}
 <div><label className="field-label">العمر</label><input value={ageFrom(form.birthDate)} readOnly className="field-input bg-sand-50"/></div><div><label className="field-label">صورة القائد</label><input type="file" accept="image/*" onChange={e=>setFile(e.target.files?.[0]||null)} className="field-input"/></div>
 </div><div><label className="field-label">نبذة عنه / بيعمل إيه للفريق</label><textarea value={form.bio} onChange={e=>setForm({...form,bio:e.target.value})} rows={4} className="field-input resize-none"/></div><button disabled={saving} className="w-full bg-teal-900 text-white py-3 rounded-xl font-body font-semibold">{saving?"جاري الحفظ...":"حفظ القائد"}</button></form></div>}
 </div>
}
