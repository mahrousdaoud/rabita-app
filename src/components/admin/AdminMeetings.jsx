import { useEffect, useState } from "react";
import { collection, addDoc, deleteDoc, doc, onSnapshot, orderBy, query, Timestamp } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { db, storage } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";

function uploadFile(file, path, onProgress) {
  return new Promise((resolve, reject) => {
    const task = uploadBytesResumable(ref(storage, path), file, { contentType: file.type || "application/octet-stream" });
    task.on("state_changed", snap => onProgress?.(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)), reject, async () => {
      try { resolve(await getDownloadURL(task.snapshot.ref)); } catch (e) { reject(e); }
    });
  });
}

export default function AdminMeetings({ type = "meeting" }) {
  const { isSuperAdmin, adminTeamIds, adminSchoolIds } = useAuth();
  const [items, setItems] = useState([]), [teams, setTeams] = useState([]), [itemsLoaded, setItemsLoaded] = useState(false);
  const [title, setTitle] = useState(""), [date, setDate] = useState(""), [location, setLocation] = useState(""), [notes, setNotes] = useState(""), [teamId, setTeamId] = useState(""), [file, setFile] = useState(null), [uploading, setUploading] = useState(false), [progress, setProgress] = useState(0);

  useEffect(() => onSnapshot(query(collection(db, "meetings"), orderBy("date", "desc")), s => { setItems(s.docs.map(d => ({ id: d.id, ...d.data() }))); setItemsLoaded(true); }), []);
  useEffect(() => onSnapshot(query(collection(db, "teams"), orderBy("name", "asc")), s => setTeams(s.docs.map(d => ({ id: d.id, ...d.data() })))), []);

  const visible = items.filter(m => m.type === (type === "event" ? "event" : "meeting") && (isSuperAdmin || !m.teamId || adminTeamIds.includes(m.teamId) || adminSchoolIds.includes(m.schoolId)));

  const add = async e => {
    e.preventDefault(); if (!title || !date) return;
    setUploading(true); setProgress(0);
    try {
      const effectiveTeamId = isSuperAdmin ? (teamId || null) : (adminTeamIds[0] || null);
      const effectiveSchoolId = (!isSuperAdmin && !effectiveTeamId) ? (adminSchoolIds[0] || null) : null;
      const team = teams.find(t => t.id === effectiveTeamId);
      let attachmentURL = "", attachmentName = "";
      if (file) {
        const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        attachmentURL = await uploadFile(file, `meetingAttachments/${type}/${Date.now()}_${safe}`, setProgress);
        attachmentName = file.name;
      }
      await addDoc(collection(db, "meetings"), { title, notes, location, teamId: effectiveTeamId, schoolId: effectiveSchoolId, teamName: team?.name || "كل الفرق", type, attachmentURL, attachmentName, date: Timestamp.fromDate(new Date(date)) });
      setTitle(""); setDate(""); setLocation(""); setNotes(""); setFile(null); setProgress(100);
      const fi = document.getElementById(`${type}-file-input`); if (fi) fi.value = "";
    } catch (err) { console.error(err); alert("حصل خطأ أثناء رفع/إضافة الملف: " + err.message); }
    finally { setUploading(false); setTimeout(() => setProgress(0), 700); }
  };

  return <div className="grid md:grid-cols-2 gap-6">
    <form onSubmit={add} className="card p-5 space-y-3 h-fit">
      <h3 className="font-display font-bold text-teal-950">إضافة {type === "event" ? "حدث" : "لقاء"} جديد</h3>
      <input placeholder={type === "event" ? "اسم الحدث" : "عنوان اللقاء"} value={title} onChange={e => setTitle(e.target.value)} className="field-input" />
      <input type="datetime-local" value={date} onChange={e => setDate(e.target.value)} className="field-input" />
      <input placeholder="مكان اللقاء / الحدث" value={location} onChange={e => setLocation(e.target.value)} className="field-input" />
      {isSuperAdmin ? <select value={teamId} onChange={e => setTeamId(e.target.value)} className="field-input"><option value="">كل الفرق</option>{teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select> : <div className="bg-sand-50 rounded-xl p-3 text-sm font-body">سيتم ربطه بفريقك تلقائيًا.</div>}
      <textarea placeholder="ملاحظات (اختياري)" value={notes} onChange={e => setNotes(e.target.value)} className="field-input resize-none" rows={3} />
      <div><label className="field-label">ملف مرفق — PDF أو Word أو Excel أو PowerPoint أو صورة أو ZIP أو أي امتداد آخر</label><input id={`${type}-file-input`} type="file" onChange={e => setFile(e.target.files?.[0] || null)} className="text-sm font-body" />{file && <p className="text-xs mt-1 text-ink/50">{file.name} — {(file.size / 1024 / 1024).toFixed(2)} MB</p>}{uploading && file && <div className="mt-2"><div className="h-2 bg-sand-100 rounded-full overflow-hidden"><div className="h-full bg-teal-900" style={{width:`${progress}%`}} /></div><p className="text-xs mt-1 text-ink/50">جاري الرفع... {progress}%</p></div>}</div>
      <button disabled={uploading} className="w-full bg-teal-900 disabled:opacity-50 text-sand-50 font-body font-semibold py-2.5 rounded-xl">{uploading ? `جاري الرفع... ${progress}%` : "إضافة"}</button>
    </form>

    <div className="card p-5"><h3 className="font-display font-bold text-teal-950 mb-3">{type === "event" ? "كل الأحداث" : "كل اللقاءات"}</h3><ul className="space-y-3 max-h-[34rem] overflow-y-auto">{visible.map(m => <li key={m.id} className="border-b pb-3"><div className="flex justify-between gap-3"><div><p className="font-body font-semibold">{m.title}</p><p className="text-xs text-ink/50 font-body">{m.date?.toDate?.().toLocaleString("ar-EG")} · {m.location || "المكان غير محدد"} · {m.teamName || "كل الفرق"}</p>{m.attachmentURL && <a href={m.attachmentURL} target="_blank" rel="noreferrer" download={m.attachmentName || true} className="text-xs text-teal-800 font-body underline">📎 {m.attachmentName || "الملف المرفق"} — تحميل</a>}</div><button onClick={() => confirm("حذف؟") && deleteDoc(doc(db, "meetings", m.id))} className="text-bad text-xs font-body">حذف</button></div></li>)}{!visible.length && <p className="text-sm text-ink/40 font-body">لا يوجد {type === "event" ? "أحداث" : "لقاءات"}.</p>}</ul></div>
  </div>;
}
