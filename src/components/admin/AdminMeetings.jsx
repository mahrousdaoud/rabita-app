import { useEffect, useState } from "react";
import { collection, addDoc, deleteDoc, doc, onSnapshot, orderBy, query, Timestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";

export default function AdminMeetings({ type = "meeting" }) {
  const { isSuperAdmin, adminTeamIds, adminSchoolIds } = useAuth();
  const [items, setItems] = useState([]);
  const [teams, setTeams] = useState([]);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [teamId, setTeamId] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const DEFAULT_EVENTS = ["مدرسة m power","مدرسة impact","مدرسة Scaleright","مدرسة الأعضاء الجدد","أولومبيات القادة","قعدة رجالة"];

  useEffect(() => onSnapshot(query(collection(db, "meetings"), orderBy("date", "desc")),
    (s) => setItems(s.docs.map((d) => ({ id: d.id, ...d.data() })))), []);
  useEffect(() => onSnapshot(query(collection(db, "teams"), orderBy("name", "asc")),
    (s) => setTeams(s.docs.map((d) => ({ id: d.id, ...d.data() })))), []);

  const visible = items.filter((m) =>
    m.type === (type === "event" ? "event" : "meeting") &&
    (isSuperAdmin || !m.teamId || adminTeamIds.includes(m.teamId) || adminSchoolIds.includes(m.schoolId))
  );

  const addDefaultEvents = async () => {
    if (type !== "event" || !isSuperAdmin) return;
    setUploading(true);
    try {
      const existing = new Set(items.filter(x=>x.type === "event").map(x=>x.title.trim().toLowerCase()));
      const batch = DEFAULT_EVENTS.filter(x=>!existing.has(x.toLowerCase()));
      for (const title of batch) await addDoc(collection(db,"meetings"), {title, notes:"حدث أساسي في منصة الرابطة — حدّد الموعد من لوحة الأدمن.", location:"", teamId:null, schoolId:null, teamName:"كل الفرق", type:"event", attachmentURL:"", attachmentName:"", date:Timestamp.fromDate(new Date(Date.now()+86400000))});
      alert(`تمت إضافة ${batch.length} أحداث أساسية`);
    } catch(err){ alert("حصل خطأ أثناء إضافة الأحداث: "+err.message); } finally { setUploading(false); }
  };

  const add = async (e) => {
    e.preventDefault();
    if (!title || !date) return;
    setUploading(true);
    try {
      const effectiveTeamId = isSuperAdmin ? (teamId || null) : (adminTeamIds[0] || null);
      const effectiveSchoolId = (!isSuperAdmin && !effectiveTeamId) ? (adminSchoolIds[0] || null) : null;
      const team = teams.find((t) => t.id === effectiveTeamId);

      let attachmentURL = "";
      let attachmentName = "";
      if (file) {
        const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const storageRef = ref(storage, `meetingAttachments/${Date.now()}_${safe}`);
        await uploadBytes(storageRef, file);
        attachmentURL = await getDownloadURL(storageRef);
        attachmentName = file.name;
      }

      await addDoc(collection(db, "meetings"), {
        title, notes, location,
        teamId: effectiveTeamId, schoolId: effectiveSchoolId,
        teamName: team?.name || "كل الفرق", type,
        attachmentURL, attachmentName,
        date: Timestamp.fromDate(new Date(date)),
      });
      setTitle(""); setDate(""); setLocation(""); setNotes(""); setFile(null);
      const fi = document.getElementById("meeting-file-input");
      if (fi) fi.value = "";
    } catch (err) {
      alert("حصل خطأ أثناء الإضافة: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <form onSubmit={add} className="card p-5 space-y-3 h-fit">
        <h3 className="font-display font-bold text-teal-950">إضافة {type === "event" ? "حدث" : "لقاء"} جديد</h3>
        <input placeholder={type === "event" ? "اسم الحدث" : "عنوان اللقاء"} value={title} onChange={(e) => setTitle(e.target.value)} className="field-input" />
        <input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} className="field-input" />
        <input placeholder="مكان اللقاء / الحدث" value={location} onChange={(e) => setLocation(e.target.value)} className="field-input" />
        {isSuperAdmin ? (
          <select value={teamId} onChange={(e) => setTeamId(e.target.value)} className="field-input">
            <option value="">كل الفرق</option>
            {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        ) : (
          <div className="bg-sand-50 rounded-xl p-3 text-sm font-body">سيتم ربطه بفريقك تلقائيًا.</div>
        )}
        <textarea placeholder="ملاحظات (اختياري)" value={notes} onChange={(e) => setNotes(e.target.value)} className="field-input resize-none" rows={3} />
        <div>
          <label className="field-label">ملف مرفق (PDF أو أي ملف يشرح اليوم — اختياري)</label>
          <input id="meeting-file-input" type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="text-sm font-body" />
        </div>
        <button disabled={uploading} className="w-full bg-teal-900 disabled:opacity-50 text-sand-50 font-body font-semibold py-2.5 rounded-xl">
          {uploading ? "جاري الإضافة..." : "إضافة"}
        </button>
      </form>
      {type === "event" && isSuperAdmin && <button type="button" onClick={addDefaultEvents} disabled={uploading} className="card p-4 text-right font-body font-semibold text-teal-900 hover:bg-sand-50">⚡ إضافة الأحداث الأساسية الستة تلقائيًا</button>}

      <div className="card p-5">
        <h3 className="font-display font-bold text-teal-950 mb-3">كل {type === "event" ? "الأحداث" : "اللقاءات"}</h3>
        <ul className="space-y-3 max-h-[30rem] overflow-y-auto">
          {visible.map((m) => (
            <li key={m.id} className="flex justify-between gap-3 border-b pb-3">
              <div>
                <p className="font-body font-semibold">{m.title}</p>
                <p className="text-xs text-ink/50 font-body">{m.date?.toDate?.().toLocaleString("ar-EG")} · {m.location || "المكان غير محدد"} · {m.teamName || "كل الفرق"}</p>
                {m.attachmentURL && (
                  <a href={m.attachmentURL} target="_blank" rel="noreferrer" className="text-xs text-teal-800 font-body underline">
                    📎 {m.attachmentName || "الملف المرفق"}
                  </a>
                )}
              </div>
              <button onClick={() => confirm("حذف؟") && deleteDoc(doc(db, "meetings", m.id))} className="text-bad text-xs font-body">حذف</button>
            </li>
          ))}
          {!visible.length && <p className="text-sm text-ink/40 font-body">لا يوجد {type === "event" ? "أحداث" : "لقاءات"}.</p>}
        </ul>
      </div>
    </div>
  );
}
