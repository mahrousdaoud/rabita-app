import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { user, completeRegistration } = useAuth();
  const [saving, setSaving] = useState(false);
  const [teams, setTeams] = useState([]);
  const [schools, setSchools] = useState([]);
  const [form, setForm] = useState({
    name: user?.displayName || "", phone: "", region: "", teamId: "", schoolId: "",
    age: "", gender: "", contribution: "", memberType: "",
  });

  useEffect(() => {
    const unsubTeams = onSnapshot(query(collection(db, "teams"), orderBy("name", "asc")),
      (snap) => setTeams(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
    const unsubSchools = onSnapshot(query(collection(db, "schools"), orderBy("name", "asc")),
      (snap) => setSchools(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
    return () => { unsubTeams(); unsubSchools(); };
  }, []);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.memberType || !form.gender || !form.teamId) return;
    setSaving(true);
    try {
      const team = teams.find((t) => t.id === form.teamId);
      await completeRegistration({ ...form, teamName: team?.name || "" });
      localStorage.removeItem("rabita_intro_seen");
    } finally { setSaving(false); }
  };

  return (
    <div className="min-h-screen bg-sand-50 py-10 px-4">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="الشعار" className="w-20 h-20 mx-auto mb-3" />
          <h1 className="font-display font-bold text-xl text-teal-950">استمارة بيانات خدمة الرياضة بمصر</h1>
          <p className="font-body text-sm text-ink/60 mt-1">مرحبًا بيك {user?.displayName} — كمّل بياناتك عشان نضمك لفريقك</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-white rounded-xl2 shadow-sm border border-teal-900/5 p-6 space-y-5">
          <Choice label="إنت تبع المدرسة الجديدة ولا القديمة؟" value={form.memberType}
            options={[["new","مدرسة جديدة"],["old","مدرسة قديمة"]]} onChange={(v)=>setForm(f=>({...f,memberType:v}))} />
          <Choice label="النوع" value={form.gender}
            options={[["male","ولد"],["female","بنت"]]} onChange={(v)=>setForm(f=>({...f,gender:v}))} />
          <Field label="الاسم بالكامل" value={form.name} onChange={update("name")} required />
          <Field label="رقم الموبايل" value={form.phone} onChange={update("phone")} required type="tel" />
          <Field label="المنطقة" value={form.region} onChange={update("region")} required />
          <div>
            <label className="field-label">الفريق</label>
            <select value={form.teamId} onChange={update("teamId")} required className="field-input">
              <option value="">اختر الفريق...</option>
              {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className="field-label">المدرسة (اختياري)</label>
            <select value={form.schoolId} onChange={update("schoolId")} className="field-input">
              <option value="">مش محدد</option>
              {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <Field label="السن" value={form.age} onChange={update("age")} required type="number" min="4" max="99" />
          <div>
            <label className="field-label">إيه اللي هتقدمه للفريق؟</label>
            <textarea value={form.contribution} onChange={update("contribution")} rows={3}
              placeholder="مثال: تدريب كرة قدم، تنظيم، تصوير..."
              className="field-input resize-none" />
          </div>
          <button type="submit" disabled={saving || !form.memberType || !form.gender || !form.teamId}
            className="w-full bg-gold-500 hover:bg-gold-600 disabled:opacity-50 text-teal-950 font-body font-bold py-3.5 rounded-xl2">
            {saving ? "جاري الحفظ..." : "تسجيل واستكمال الدخول"}
          </button>
        </form>
      </div>
    </div>
  );
}
function Choice({ label, value, options, onChange }) {
  return <div><label className="field-label">{label}</label><div className="grid grid-cols-2 gap-3">
    {options.map(([v,l])=><button type="button" key={v} onClick={()=>onChange(v)}
      className={`py-3 rounded-xl font-body font-medium border ${value===v?"bg-teal-900 text-sand-50 border-teal-900":"bg-sand-50 text-ink border-ink/10"}`}>{l}</button>)}
  </div></div>;
}
function Field({ label, ...props }) { return <div><label className="field-label">{label}</label><input {...props} className="field-input" /></div>; }
