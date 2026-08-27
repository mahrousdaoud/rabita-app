import { useEffect, useState } from "react";
import { collection, doc, onSnapshot, orderBy, query, updateDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";

export default function StudentDetailModal({ student, onClose }) {
  const { isSuperAdmin } = useAuth();
  const [schools, setSchools] = useState([]);
  const [schoolId, setSchoolId] = useState(student?.schoolId || "");

  useEffect(() => {
    if (!isSuperAdmin) return;
    return onSnapshot(query(collection(db, "schools"), orderBy("name", "asc")),
      (s) => setSchools(s.docs.map((d) => ({ id: d.id, ...d.data() }))));
  }, [isSuperAdmin]);

  if (!student) return null;

  const rows = [
    ["الاسم", student.name], ["الإيميل", student.email], ["الموبايل", student.phone],
    ["المنطقة", student.region], ["الفريق", student.teamName], ["السن", student.age],
    ["النوع", student.gender === "male" ? "ولد" : "بنت"],
    ["نوع المدرسة", student.memberType === "new" ? "مدرسة جديدة" : "مدرسة قديمة"],
    ["هيقدم إيه للفريق", student.contribution || "—"],
    ["التعهد المدفوع", (student.paidMonths || []).length + " شهر"],
    ["أدمن فريق", (student.adminTeamIds || []).length ? "أيوه" : "لأ"],
    ["أدمن مدرسة", (student.adminSchoolIds || []).length ? "أيوه" : "لأ"],
  ];

  const assignSchool = async (e) => {
    const newSchoolId = e.target.value;
    setSchoolId(newSchoolId);
    const school = schools.find((s) => s.id === newSchoolId);
    await updateDoc(doc(db, "students", student.id), {
      schoolId: newSchoolId || null,
      schoolName: school?.name || "",
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl2 shadow-lg max-w-lg w-full p-6 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-4">
          {student.photoURL && <img src={student.photoURL} className="w-12 h-12 rounded-full border-2 border-gold-500" alt="" />}
          <h3 className="font-display font-bold text-lg text-teal-950">بيانات {student.name}</h3>
        </div>
        <div className="space-y-1">
          {rows.map(([l, v]) => (
            <div key={l} className="flex justify-between gap-4 text-sm font-body border-b py-2">
              <span className="text-ink/50">{l}</span>
              <span className="text-ink font-medium text-left">{v}</span>
            </div>
          ))}
          {isSuperAdmin && (
            <div className="flex justify-between items-center gap-4 text-sm font-body py-2">
              <span className="text-ink/50">المدرسة (إدارة)</span>
              <select value={schoolId} onChange={assignSchool} className="border border-ink/15 rounded-lg px-2 py-1 text-sm">
                <option value="">بدون</option>
                {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          )}
        </div>
        <button onClick={onClose} className="w-full mt-5 bg-teal-900 text-sand-50 font-body font-semibold py-2.5 rounded-xl">إغلاق</button>
      </div>
    </div>
  );
}
