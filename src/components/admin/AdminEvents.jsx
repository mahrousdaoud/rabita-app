import { useEffect, useState } from "react";
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, Timestamp } from "firebase/firestore";
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

export default function AdminEvents() {
  const { isSuperAdmin } = useAuth();
  const [items, setItems] = useState([]);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => onSnapshot(query(collection(db, "customEvents"), orderBy("date", "asc")), snap => {
    setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  }), []);

  const add = async e => {
    e.preventDefault();
    if (!isSuperAdmin || !title.trim() || !date) return;
    setUploading(true); setProgress(0);
    try {
      let attachmentURL = "";
      let attachmentName = "";
      let attachmentPath = "";
      if (file) {
        const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        attachmentPath = `customEvents/${Date.now()}_${safe}`;
        attachmentURL = await uploadFile(file, attachmentPath, setProgress);
        attachmentName = file.name;
      }
      await addDoc(collection(db, "customEvents"), {
        title: title.trim(), location: location.trim(), notes: notes.trim(),
        date: Timestamp.fromDate(new Date(date)), attachmentURL, attachmentName,
        attachmentPath, createdAt: Timestamp.now(), createdBy: "admin"
      });
      setTitle(""); setDate(""); setLocation(""); setNotes(""); setFile(null); setProgress(100);
      const input = document.getElementById("custom-event-file-input"); if (input) input.value = "";
    } catch (err) {
      console.error(err);
      alert("حصل خطأ أثناء إضافة الحدث أو رفع الملف: " + err.message);
    } finally {
      setUploading(false); setTimeout(() => setProgress(0), 700);
    }
  };

  const remove = async item => {
    if (!confirm(`حذف الحدث «${item.title}»؟`)) return;
    try { await deleteDoc(doc(db, "customEvents", item.id)); }
    catch (err) { alert("حصل خطأ أثناء الحذف: " + err.message); }
  };

  return <div className="grid md:grid-cols-2 gap-6">
    <form onSubmit={add} className="card p-5 space-y-3 h-fit">
      <h3 className="font-display font-bold text-teal-950">إضافة حدث إلى «أحداثنا»</h3>
      <p className="text-xs font-body text-ink/50">أحداثنا مستقلة عن بند «الأحداث»، وأنت تتحكم في الاسم والتاريخ والملف بالكامل.</p>
      <input placeholder="اسم الحدث (مثال: مدرسة M Power)" value={title} onChange={e => setTitle(e.target.value)} className="field-input" required />
      <input type="datetime-local" value={date} onChange={e => setDate(e.target.value)} className="field-input" required />
      <input placeholder="المكان (اختياري)" value={location} onChange={e => setLocation(e.target.value)} className="field-input" />
      <textarea placeholder="ملاحظات (اختياري)" value={notes} onChange={e => setNotes(e.target.value)} className="field-input resize-none" rows={3} />
      <div>
        <label className="field-label">ملف مرفق — أي امتداد</label>
        <input id="custom-event-file-input" type="file" onChange={e => setFile(e.target.files?.[0] || null)} className="text-sm font-body" />
        {file && <p className="text-xs mt-1 text-ink/50">{file.name} — {(file.size / 1024 / 1024).toFixed(2)} MB</p>}
        {uploading && <div className="mt-2"><div className="h-2 bg-sand-100 rounded-full overflow-hidden"><div className="h-full bg-teal-900" style={{ width: `${progress}%` }} /></div><p className="text-xs mt-1 text-ink/50">جاري الرفع... {progress}%</p></div>}
      </div>
      <button disabled={uploading} className="w-full bg-teal-900 disabled:opacity-50 text-sand-50 font-body font-semibold py-2.5 rounded-xl">{uploading ? `جاري الرفع... ${progress}%` : "إضافة الحدث"}</button>
    </form>

    <div className="card p-5">
      <h3 className="font-display font-bold text-teal-950 mb-3">أحداثنا</h3>
      <ul className="space-y-3 max-h-[34rem] overflow-y-auto">
        {items.map(item => <li key={item.id} className="border-b pb-3">
          <div className="flex justify-between gap-3"><div>
            <p className="font-body font-semibold">{item.title}</p>
            <p className="text-xs text-ink/50 font-body">{item.date?.toDate?.().toLocaleString("ar-EG")} · {item.location || "المكان غير محدد"}</p>
            {item.notes && <p className="text-xs text-ink/50 font-body mt-1">{item.notes}</p>}
            {item.attachmentURL && <a href={item.attachmentURL} target="_blank" rel="noreferrer" className="text-xs text-teal-800 font-body underline block mt-1">📎 {item.attachmentName || "الملف المرفق"} — فتح / تحميل</a>}
          </div><button type="button" onClick={() => remove(item)} className="text-bad text-xs font-body">حذف</button></div>
        </li>)}
        {!items.length && <p className="text-sm text-ink/40 font-body">لم تتم إضافة أحداثنا بعد.</p>}
      </ul>
    </div>
  </div>;
}
