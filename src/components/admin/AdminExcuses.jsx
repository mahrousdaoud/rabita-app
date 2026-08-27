import { useEffect, useState } from "react";
import { collection, doc, onSnapshot, query, updateDoc, where } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";

// الاعتذارات خاصة بقواد الفريق/المدرسة بس، السوبر أدمن العام مش بيشوفها إلا لو هو نفسه قائد فريق
export default function AdminExcuses() {
  const { adminTeamIds, adminSchoolIds } = useAuth();
  const [excuses, setExcuses] = useState([]);

  useEffect(() => {
    const unsubs = [];
    let combined = {};

    const flush = () => {
      const list = Object.values(combined);
      list.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      setExcuses(list);
    };

    adminTeamIds.forEach((teamId) => {
      const q = query(collection(db, "excuses"), where("teamId", "==", teamId));
      unsubs.push(onSnapshot(q, (snap) => {
        snap.docs.forEach((d) => { combined[d.id] = { id: d.id, ...d.data() }; });
        flush();
      }));
    });

    adminSchoolIds.forEach((schoolId) => {
      const q = query(collection(db, "excuses"), where("schoolId", "==", schoolId));
      unsubs.push(onSnapshot(q, (snap) => {
        snap.docs.forEach((d) => { combined[d.id] = { id: d.id, ...d.data() }; });
        flush();
      }));
    });

    return () => unsubs.forEach((u) => u());
  }, [adminTeamIds.join(","), adminSchoolIds.join(",")]);

  if (adminTeamIds.length === 0 && adminSchoolIds.length === 0) {
    return <p className="text-sm font-body text-ink/40">الاعتذارات خاصة بقواد الفرق/المدارس بس. إنت مش قائد فريق أو مدرسة حاليًا.</p>;
  }

  return (
    <div className="space-y-3">
      {excuses.map((x) => (
        <div key={x.id} className="bg-white rounded-xl2 shadow-sm border border-teal-900/5 p-4">
          <div className="flex justify-between gap-3">
            <div>
              <b className="font-body text-teal-900">{x.studentName}</b>
              <p className="text-sm font-body mt-1">{x.meetingTitle}</p>
              <p className="text-sm font-body text-ink/70 mt-2">سبب الاعتذار: {x.reason}</p>
            </div>
            <span className="text-xs font-body text-ink/40 whitespace-nowrap">
              {x.status === "new" ? "جديد" : "تم التعامل معه"}
            </span>
          </div>
          {x.status === "new" && (
            <button
              onClick={() => updateDoc(doc(db, "excuses", x.id), { status: "handled" })}
              className="mt-3 bg-teal-900 text-sand-50 px-4 py-2 rounded-lg text-xs font-body"
            >
              تم التعامل مع الاعتذار
            </button>
          )}
        </div>
      ))}
      {excuses.length === 0 && <p className="text-sm font-body text-ink/40">لا توجد اعتذارات دلوقتي.</p>}
    </div>
  );
}
