import { useEffect, useMemo, useState } from "react";
import { addDoc, collection, doc, onSnapshot, query, where, orderBy, setDoc, Timestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import TopBar from "../components/TopBar";

function monthsBetween(startDate, endDate) {
  if (!startDate) return 0;
  const s = startDate.toDate ? startDate.toDate() : new Date(startDate);
  return Math.max((endDate.getFullYear() - s.getFullYear()) * 12 + endDate.getMonth() - s.getMonth(), 0);
}

export default function StudentDashboard() {
  const { user, profile, teams } = useAuth();
  const [meetings, setMeetings] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [availability, setAvailability] = useState({});
  const [posts, setPosts] = useState([]);
  const [postText, setPostText] = useState("");
  const [postImage, setPostImage] = useState(null);
  const [posting, setPosting] = useState(false);
  const [excuseOpen, setExcuseOpen] = useState(null);
  const [excuseReason, setExcuseReason] = useState("");
  const [excuses, setExcuses] = useState([]);

  useEffect(() => {
    if (!profile?.teamId) return;
    const q = query(collection(db, "meetings"), where("date", ">=", new Date()), orderBy("date", "asc"));
    return onSnapshot(q, (snap) => setMeetings(snap.docs.map(d => ({id:d.id,...d.data()}))
      .filter(m => !m.teamId || m.teamId === profile.teamId)));
  }, [profile?.teamId]);

  useEffect(() => {
    if (!user) return;
    return onSnapshot(query(collection(db,"attendanceRecords"), where("studentId","==",user.uid)),
      snap => setAttendance(snap.docs.map(d=>d.data())));
  }, [user]);

  useEffect(() => {
    if (!user) return;
    return onSnapshot(query(collection(db,"availability"), where("studentId","==",user.uid)),
      snap => { const map={}; snap.docs.forEach(d=>map[d.data().eventId]=d.data().available); setAvailability(map); });
  }, [user]);

  useEffect(() => {
    if (!user) return;
    return onSnapshot(query(collection(db,"teamPosts")),
      snap => setPosts(snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(b.createdAt?.toMillis?.()||0)-(a.createdAt?.toMillis?.()||0))));
  }, [user]);

  useEffect(() => {
    if (!user) return;
    return onSnapshot(query(collection(db,"excuses"), where("studentId","==",user.uid)),
      snap => setExcuses(snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(b.createdAt?.toMillis?.()||0)-(a.createdAt?.toMillis?.()||0))));
  }, [user]);

  const toggleAvailability = async (meetingId) => {
    const current = !!availability[meetingId];
    await setDoc(doc(db,"availability",`${meetingId}_${user.uid}`), {
      eventId: meetingId, studentId: user.uid, teamId: profile.teamId, schoolId: profile.schoolId || null, available: !current, updatedAt: Timestamp.now()
    });
  };

  const publishPost = async (e) => {
    e.preventDefault();
    if (!postText.trim() && !postImage) return;
    setPosting(true);
    try {
      let imageUrl = "";
      if (postImage) {
        const safe = postImage.name.replace(/[^a-zA-Z0-9._-]/g,"_");
        const storageRef = ref(storage, `teamPosts/all/${user.uid}/${Date.now()}_${safe}`);
        await uploadBytes(storageRef, postImage);
        imageUrl = await getDownloadURL(storageRef);
      }
      await addDoc(collection(db,"teamPosts"), {
        teamId: profile.teamId || null, schoolId: profile.schoolId || null, teamName: profile.teamName || "", authorId: user.uid,
        authorName: profile.name, text: postText.trim(), imageUrl, createdAt: Timestamp.now()
      });
      setPostText(""); setPostImage(null);
      document.getElementById("post-image-input")?.value = "";
    } finally { setPosting(false); }
  };

  const sendExcuse = async () => {
    if (!excuseOpen || !excuseReason.trim()) return;
    await addDoc(collection(db,"excuses"), {
      meetingId: excuseOpen.id, meetingTitle: excuseOpen.title, meetingDate: excuseOpen.date,
      teamId: profile.teamId, schoolId: profile.schoolId || null, studentId: user.uid, studentName: profile.name,
      reason: excuseReason.trim(), status: "new", createdAt: Timestamp.now()
    });
    setExcuseOpen(null); setExcuseReason("");
  };

  const presentCount = attendance.filter(a=>a.present).length;
  const absentCount = attendance.filter(a=>a.present === false).length;
  const monthsSinceJoin = useMemo(()=>monthsBetween(profile?.createdAt,new Date()) || 1,[profile]);
  const paidCount = profile?.paidMonths?.length || 0;
  const remainingMonths = Math.max(monthsSinceJoin-paidCount,0);
  const teamData = teams.find(t=>t.id===profile?.teamId); const teamCash = teamData?.cashNumber || (profile?.teamName==="ديرمواس" ? "01282802083" : "");

  const meetingList = meetings.filter(m => m.type !== "event");
  const eventList = meetings.filter(m => m.type === "event");

  return (
    <div className="min-h-screen bg-sand-50">
      <TopBar />
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <div className="bg-teal-900 text-sand-50 rounded-xl2 p-5 flex items-center gap-4">
          {profile?.photoURL && <img src={profile.photoURL} className="w-14 h-14 rounded-full border-2 border-gold-500" alt="" />}
          <div>
            <p className="font-display font-bold text-lg">{profile?.name}</p>
            <p className="font-body text-teal-100/70 text-sm">فريق {profile?.teamName} · منطقة {profile?.region} · {profile?.age} سنة</p>
            <div className="flex flex-wrap gap-2 mt-1">
              <span className="text-xs font-body px-2 py-0.5 rounded-full bg-gold-500/20 text-gold-400">{profile?.memberType==="new"?"مدرسة جديدة":"مدرسة قديمة"}</span>
              {profile?.schoolName && <span className="text-xs font-body px-2 py-0.5 rounded-full bg-white/10">{profile.schoolName}</span>}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="الحضور" value={presentCount} tone="good" />
          <StatCard label="الغياب" value={absentCount} tone="bad" />
          <StatCard label="فريقي" value={profile?.teamName || "—"} tone="neutral" />
          <StatCard label="نوعي" value={profile?.gender==="male"?"ولد":"بنت"} tone="neutral" />
        </div>

        <section className="bg-white rounded-xl2 shadow-sm border border-teal-900/5 p-5">
          <h2 className="font-display font-bold text-teal-950 mb-3">التعهد</h2>
          <div className="flex justify-between text-sm font-body mb-2"><span className="text-ink/60">شهور تم دفعها</span><span className="font-bold text-good">{paidCount}</span></div>
          <div className="flex justify-between text-sm font-body"><span className="text-ink/60">باقي عليك</span><span className="font-bold text-bad">{remainingMonths} شهر</span></div>
          {teamCash && <p className="mt-4 text-sm font-body bg-gold-500/10 rounded-xl p-3">كاش فريق ديرمواس: <b dir="ltr">{teamCash}</b><br/><span className="text-ink/60">للدفع أو التواصل مع أدمن الفريق.</span></p>}
          <div className="w-full bg-sand-100 rounded-full h-2 mt-4 overflow-hidden"><div className="bg-gold-500 h-2 rounded-full" style={{width:`${Math.min(100,(paidCount/monthsSinceJoin)*100)}%`}}/></div>
        </section>

        <section className="bg-white rounded-xl2 shadow-sm border border-teal-900/5 p-5">
          <h2 className="font-display font-bold text-teal-950 mb-4">اللقاءات</h2>
          <MeetingList items={meetingList} availability={availability} onAvailability={toggleAvailability} onExcuse={setExcuseOpen} />
        </section>

        <section className="bg-white rounded-xl2 shadow-sm border border-teal-900/5 p-5">
          <h2 className="font-display font-bold text-teal-950 mb-4">الأحداث</h2>
          <MeetingList items={eventList} availability={availability} onAvailability={toggleAvailability} onExcuse={setExcuseOpen} event />
        </section>

        <section className="bg-white rounded-xl2 shadow-sm border border-teal-900/5 p-5">
          <div className="flex items-center justify-between mb-4">
            <div><h2 className="font-display font-bold text-teal-950">مجموعة خدمة الرياضة بمصر</h2><p className="text-xs font-body text-ink/50">اكتب تأمل أو شارك صورة — المنشورات هنا ظاهرة لكل فرق الخدمة.</p></div>
          </div>
          <form onSubmit={publishPost} className="space-y-2 mb-5">
            <textarea value={postText} onChange={e=>setPostText(e.target.value)} rows={3} placeholder="اكتب تأمل أو كلمة تشجيع..." className="field-input resize-none"/>
            <div className="flex gap-2 items-center">
              <input id="post-image-input" type="file" accept="image/*" onChange={e=>setPostImage(e.target.files?.[0]||null)} className="text-xs font-body flex-1"/>
              <button disabled={posting} className="bg-teal-900 text-sand-50 px-4 py-2 rounded-xl font-body font-semibold disabled:opacity-50">{posting?"جاري النشر...":"نشر"}</button>
            </div>
          </form>
          <div className="space-y-4">
            {posts.map(p=><article key={p.id} className="border-t border-ink/5 pt-4">
              <p className="font-body font-bold text-teal-900">{p.authorName}</p>
              {p.text && <p className="font-body text-ink/80 whitespace-pre-wrap mt-1 leading-7">{p.text}</p>}
              {p.imageUrl && <img src={p.imageUrl} alt="" className="mt-3 max-h-72 w-full object-contain rounded-xl bg-sand-50"/>}
              <p className="text-[11px] text-ink/40 font-body mt-2">{p.createdAt?.toDate?.().toLocaleString("ar-EG")}</p>
            </article>)}
            {!posts.length && <p className="text-sm font-body text-ink/40">لسه مفيش منشورات في مجموعة الخدمة.</p>}
          </div>
        </section>

        <section className="bg-white rounded-xl2 shadow-sm border border-teal-900/5 p-5">
          <h2 className="font-display font-bold text-teal-950 mb-2">اعتذاراتي</h2>
          <p className="text-xs font-body text-ink/50 mb-4">الاعتذار خاص بك وبقادة فريقك فقط.</p>
          <div className="space-y-2">{excuses.map(x=><div key={x.id} className="bg-sand-50 rounded-xl p-3 text-sm font-body"><b>{x.meetingTitle}</b> — {x.reason}<span className="block text-xs text-ink/40 mt-1">{x.status==="new"?"في انتظار رد القائد":"تم التعامل معه"}</span></div>)}</div>
        </section>
      </div>

      {excuseOpen && <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={()=>setExcuseOpen(null)}>
        <div className="bg-white rounded-xl2 p-6 max-w-md w-full" onClick={e=>e.stopPropagation()}>
          <h3 className="font-display font-bold text-teal-950">إرسال اعتذار خاص للقائد</h3>
          <p className="font-body text-sm text-ink/50 mt-1">{excuseOpen.title}</p>
          <textarea value={excuseReason} onChange={e=>setExcuseReason(e.target.value)} rows={4} className="field-input mt-4" placeholder="اكتب سبب الاعتذار..."/>
          <div className="flex gap-2 mt-4"><button onClick={sendExcuse} className="flex-1 bg-teal-900 text-sand-50 py-2.5 rounded-xl font-body font-semibold">إرسال</button><button onClick={()=>setExcuseOpen(null)} className="px-4 border rounded-xl font-body">إلغاء</button></div>
        </div>
      </div>}
    </div>
  );
}

function MeetingList({items,availability,onAvailability,onExcuse,event=false}) {
  if (!items.length) return <p className="text-sm font-body text-ink/40">مفيش {event?"أحداث":"لقاءات"} مجدولة دلوقتي</p>;
  return <ul className="space-y-3">{items.map(m=>{
    const available=!!availability[m.id];
    return <li key={m.id} className="border-b border-ink/5 pb-3 last:border-0">
      <div className="flex justify-between gap-3"><div><p className="font-body font-semibold">{m.title}</p><p className="text-xs text-ink/50 font-body">📍 {m.location||"المكان غير محدد"}</p>{m.notes&&<p className="text-xs text-ink/50 font-body">{m.notes}</p>}</div><span className="text-sm text-teal-800 font-body whitespace-nowrap">{m.date?.toDate?.().toLocaleString("ar-EG")}</span></div>
      <div className="grid grid-cols-2 gap-2 mt-2">
        <button onClick={()=>onAvailability(m.id)} className={`py-2 rounded-lg text-sm font-body font-semibold ${available?"bg-good/10 text-good border border-good":"bg-sand-50 text-ink/60 border border-ink/10"}`}>{available?"✓ فوت — متاح":"فوت — أكّد حضورك المتوقع"}</button>
        <button onClick={()=>onExcuse(m)} className="py-2 rounded-lg text-sm font-body font-semibold border border-bad/20 text-bad bg-bad/5">أعتذر</button>
      </div>
    </li>;
  })}</ul>;
}
function StatCard({label,value,tone="neutral"}) {
  const color=tone==="good"?"text-good":tone==="bad"?"text-bad":"text-teal-900";
  return <div className="bg-white rounded-xl2 shadow-sm border border-teal-900/5 p-4 text-center"><p className={`font-display font-extrabold text-2xl ${color}`}>{value}</p><p className="font-body text-ink/60 text-sm mt-1">{label}</p></div>;
}
