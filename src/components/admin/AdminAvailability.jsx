import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";

export default function AdminAvailability() {
  const { isSuperAdmin, adminTeamIds, adminSchoolIds } = useAuth();
  const [meetings, setMeetings] = useState([]);
  const [meetingId, setMeetingId] = useState("");
  const [students, setStudents] = useState([]);
  const [availList, setAvailList] = useState([]);

  useEffect(() => {
    return onSnapshot(query(collection(db, "meetings")), (snap) => {
      const list = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((m) => isSuperAdmin || !m.teamId || adminTeamIds.includes(m.teamId) || adminSchoolIds.includes(m.schoolId));
      list.sort((a, b) => (b.date?.toMillis?.() || 0) - (a.date?.toMillis?.() || 0));
      setMeetings(list);
      setMeetingId((prev) => prev || (list.length ? list[0].id : ""));
    });
  }, [isSuperAdmin, adminTeamIds.join(",")]);

  useEffect(() => {
    let q;
    if (isSuperAdmin) q = query(collection(db, "students"));
    else if (adminTeamIds[0]) q = query(collection(db, "students"), where("teamId", "==", adminTeamIds[0]));
    else if (adminSchoolIds[0]) q = query(collection(db, "students"), where("schoolId", "==", adminSchoolIds[0]));
    else return;
    return onSnapshot(q, (snap) => setStudents(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
  }, [isSuperAdmin, adminTeamIds.join(","), adminSchoolIds.join(",")]);

  useEffect(() => {
    if (!meetingId) return;
    const done = (snap) => setAvailList(snap.docs.map((d) => d.data()).filter((a) => a.eventId === meetingId && a.available));
    if (isSuperAdmin) return onSnapshot(collection(db, "availability"), done);
    if (adminTeamIds[0]) return onSnapshot(query(collection(db, "availability"), where("teamId", "==", adminTeamIds[0])), done);
    if (adminSchoolIds[0]) return onSnapshot(query(collection(db, "availability"), where("schoolId", "==", adminSchoolIds[0])), done);
  }, [meetingId, isSuperAdmin, adminTeamIds.join(","), adminSchoolIds.join(",")]);

  const availableStudents = students.filter((s) => availList.some((a) => a.studentId === s.id));
  const selectedMeeting = meetings.find((m) => m.id === meetingId);

  return (
    <div>
      <div className="mb-4">
        <label className="field-label">اختر اللقاء أو الحدث</label>
        <select value={meetingId} onChange={(e) => setMeetingId(e.target.value)} className="field-input max-w-xl">
          {meetings.map((m) => (
            <option key={m.id} value={m.id}>
              {m.title} — {m.date?.toDate?.().toLocaleDateString("ar-EG")}
            </option>
          ))}
        </select>
      </div>

      <div className="card">
        <h3 className="font-display font-bold text-teal-950 mb-1">
          مين أكد "فوت" لـ {selectedMeeting?.title || "..."}
        </h3>
        <p className="text-xs text-ink/50 font-body mb-3">{availableStudents.length} فرد أكدوا حضورهم المتوقع</p>
        <table className="w-full text-sm font-body">
          <thead className="bg-sand-100">
            <tr><th className="text-right p-2">الاسم</th><th className="text-right p-2">الفريق</th></tr>
          </thead>
          <tbody>
            {availableStudents.map((s) => (
              <tr key={s.id} className="border-t"><td className="p-2">{s.name}</td><td className="p-2">{s.teamName}</td></tr>
            ))}
          </tbody>
        </table>
        {availableStudents.length === 0 && (
          <p className="text-sm font-body text-ink/40 mt-3">لسه محدش أكد حضوره لهذا اللقاء/الحدث</p>
        )}
      </div>
    </div>
  );
}
