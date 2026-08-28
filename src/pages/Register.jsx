import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { user, teams, completeRegistration } = useAuth();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: user?.displayName || "", phone: "", region: "", teamId: "", birthDate: "", gender: "", contribution: "", memberType: "" });
  const update = key => e => setForm(f => ({ ...f, [key]: e.target.value }));
  const submit = async e => {
    e.preventDefault();
    if (!form.memberType || !form.gender || !form.teamId || !form.birthDate) return;
    setSaving(true); try { await completeRegistration(form); localStorage.removeItem("rabita_intro_seen"); } catch (err) { alert("حصل خطأ أثناء التسجيل: " + err.message); } finally { setSaving(false); }
  };
  return <div className="min-h-screen bg-sand-50 py-10 px-4"><div className="max-w-lg mx-auto">
    <div className="text-center mb-8"><div className="bg-white rounded-2xl w-24 h-24 mx-auto mb-3 p-2 shadow-sm"><img src="/logo.png" className="w-full h-full object-contain" alt="الشعار"/></div><h1 className="font-display font-bold text-xl text-teal-950">استمارة بيانات خدمة الرياضة بمصر</h1><p className="font-body text-sm text-ink/60 mt-1">مرحبًا بيك {user?.displayName} — كمّل بياناتك</p></div>
    <form onSubmit={submit} className="card p-6 space-y-5">
      <Choice label="إنت تبع إيه؟" value={form.memberType} options={[["leader","قائد"],["batch1","مدرسة الدفعة الأولى"],["batch2","مدرسة الدفعة الثانية"],["batch3","مدرسة الدفعة الثالثة"]]} onChange={v=>setForm(f=>({...f,memberType:v}))}/>
      <Choice label="النوع" value={form.gender} options={[["male","ولد"],["female","بنت"]]} onChange={v=>setForm(f=>({...f,gender:v}))}/>
      <Field label="الاسم بالكامل" value={form.name} onChange={update("name")} required />
      <Field label="رقم الموبايل" value={form.phone} onChange={update("phone")} required type="tel" />
      <Field label="المنطقة" value={form.region} onChange={update("region")} required />
      <Field label="تاريخ الميلاد" value={form.birthDate} onChange={update("birthDate")} required type="date" />
      <div><label className="field-label">الفريق</label><select value={form.teamId} onChange={update("teamId")} required className="field-input"><option value="">اختر الفريق...</option>{teams.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select>{!teams.length&&<p className="text-xs text-bad mt-1">الأدمن محتاج يضيف فريق الأول.</p>}</div>
      <div><label className="field-label">إيه اللي هتقدمه للفريق؟</label><textarea value={form.contribution} onChange={update("contribution")} rows={3} placeholder="مثال: تدريب، تنظيم، تصوير..." className="field-input resize-none"/></div>
      <button type="submit" disabled={saving||!form.memberType||!form.gender||!form.teamId||!form.birthDate} className="w-full bg-gold-500 hover:bg-gold-600 disabled:opacity-50 text-teal-950 font-body font-bold py-3.5 rounded-xl2">{saving?"جاري الحفظ...":"تسجيل واستكمال الدخول"}</button>
    </form></div></div>;
}
function Choice({label,value,options,onChange}){return <div><label className="field-label">{label}</label><div className="grid grid-cols-2 gap-3">{options.map(([v,l])=><button type="button" key={v} onClick={()=>onChange(v)} className={`py-3 rounded-xl font-body font-medium border ${value===v?"bg-teal-900 text-sand-50 border-teal-900":"bg-sand-50 text-ink border-ink/10"}`}>{l}</button>)}</div></div>}
function Field({label,...props}){return <div><label className="field-label">{label}</label><input {...props} className="field-input"/></div>}
