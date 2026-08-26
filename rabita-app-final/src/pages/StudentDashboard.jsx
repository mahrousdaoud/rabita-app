import { useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  query,
  where,
  orderBy,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

import { db, storage } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import TopBar from "../components/TopBar";

function monthsBetween(startDate, endDate) {
  if (!startDate) return 0;

  const s = startDate.toDate
    ? startDate.toDate()
    : new Date(startDate);

  return Math.max(
    (endDate.getFullYear() - s.getFullYear()) * 12 +
      endDate.getMonth() -
      s.getMonth(),
    0
  );
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

  /* =====================================================
     اللقاءات والأحداث
  ===================================================== */

  useEffect(() => {
    if (!profile?.teamId) return;

    const q = query(
      collection(db, "meetings"),
      where("date", ">=", new Date()),
      orderBy("date", "asc")
    );

    return onSnapshot(q, (snap) => {
      const data = snap.docs
        .map((d) => ({
          id: d.id,
          ...d.data(),
        }))
        .filter(
          (m) =>
            !m.teamId ||
            m.teamId === profile.teamId
        );

      setMeetings(data);
    });
  }, [profile?.teamId]);

  /* =====================================================
     الحضور
  ===================================================== */

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "attendanceRecords"),
      where("studentId", "==", user.uid)
    );

    return onSnapshot(q, (snap) => {
      setAttendance(
        snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }))
      );
    });
  }, [user]);

  /* =====================================================
     تأكيد الحضور المتوقع - فوت
  ===================================================== */

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "availability"),
      where("studentId", "==", user.uid)
    );

    return onSnapshot(q, (snap) => {
      const map = {};

      snap.docs.forEach((d) => {
        const data = d.data();

        if (data.eventId) {
          map[data.eventId] = data.available;
        }
      });

      setAvailability(map);
    });
  }, [user]);

  /* =====================================================
     جروب خدمة الرياضة بمصر
     كل الفرق مع بعض
  ===================================================== */

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "teamPosts")
    );

    return onSnapshot(q, (snap) => {
      const data = snap.docs
        .map((d) => ({
          id: d.id,
          ...d.data(),
        }))
        .sort(
          (a, b) =>
            (b.createdAt?.toMillis?.() || 0) -
            (a.createdAt?.toMillis?.() || 0)
        );

      setPosts(data);
    });
  }, [user]);

  /* =====================================================
     الاعتذارات
  ===================================================== */

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "excuses"),
      where("studentId", "==", user.uid)
    );

    return onSnapshot(q, (snap) => {
      const data = snap.docs
        .map((d) => ({
          id: d.id,
          ...d.data(),
        }))
        .sort(
          (a, b) =>
            (b.createdAt?.toMillis?.() || 0) -
            (a.createdAt?.toMillis?.() || 0)
        );

      setExcuses(data);
    });
  }, [user]);

  /* =====================================================
     تأكيد / إلغاء الحضور المتوقع
  ===================================================== */

  const toggleAvailability = async (meetingId) => {
    if (!user || !profile?.teamId) return;

    const current = !!availability[meetingId];

    await setDoc(
      doc(
        db,
        "availability",
        `${meetingId}_${user.uid}`
      ),
      {
        eventId: meetingId,
        studentId: user.uid,
        teamId: profile.teamId,
        schoolId: profile.schoolId || null,
        available: !current,
        updatedAt: Timestamp.now(),
      }
    );
  };

  /* =====================================================
     نشر منشور في جروب الخدمة
     نص أو صورة
  ===================================================== */

  const publishPost = async (e) => {
    e.preventDefault();

    if (!postText.trim() && !postImage) return;

    setPosting(true);

    try {
      let imageUrl = "";

      if (postImage) {
        const safeName = postImage.name.replace(
          /[^a-zA-Z0-9._-]/g,
          "_"
        );

        const storageRef = ref(
          storage,
          `teamPosts/all/${user.uid}/${Date.now()}_${safeName}`
        );

        await uploadBytes(
          storageRef,
          postImage
        );

        imageUrl = await getDownloadURL(
          storageRef
        );
      }

      await addDoc(
        collection(db, "teamPosts"),
        {
          teamId: profile?.teamId || null,
          schoolId: profile?.schoolId || null,
          teamName: profile?.teamName || "",
          authorId: user.uid,
          authorName: profile?.name || "",
          text: postText.trim(),
          imageUrl,
          createdAt: Timestamp.now(),
        }
      );

      setPostText("");
      setPostImage(null);

      const input =
        document.getElementById(
          "post-image-input"
        );

      if (input) {
        input.value = "";
      }
    } catch (error) {
      console.error(
        "Error publishing post:",
        error
      );

      alert(
        "حصل خطأ أثناء نشر المنشور."
      );
    } finally {
      setPosting(false);
    }
  };

  /* =====================================================
     إرسال اعتذار لقائد الفريق
  ===================================================== */

  const sendExcuse = async () => {
    if (
      !excuseOpen ||
      !excuseReason.trim() ||
      !user ||
      !profile?.teamId
    ) {
      return;
    }

    try {
      await addDoc(
        collection(db, "excuses"),
        {
          meetingId: excuseOpen.id,
          meetingTitle: excuseOpen.title || "",
          meetingDate: excuseOpen.date || null,

          teamId: profile.teamId,
          schoolId: profile.schoolId || null,

          studentId: user.uid,
          studentName: profile.name || "",

          reason: excuseReason.trim(),

          status: "new",

          createdAt: Timestamp.now(),
        }
      );

      setExcuseOpen(null);
      setExcuseReason("");
    } catch (error) {
      console.error(
        "Error sending excuse:",
        error
      );

      alert(
        "حصل خطأ أثناء إرسال الاعتذار."
      );
    }
  };

  /* =====================================================
     الإحصائيات
  ===================================================== */

  const presentCount = attendance.filter(
    (a) => a.present
  ).length;

  const absentCount = attendance.filter(
    (a) => a.present === false
  ).length;

  const monthsSinceJoin = useMemo(
    () =>
      monthsBetween(
        profile?.createdAt,
        new Date()
      ) || 1,
    [profile]
  );

  const paidCount =
    profile?.paidMonths?.length || 0;

  const remainingMonths = Math.max(
    monthsSinceJoin - paidCount,
    0
  );

  /* =====================================================
     بيانات الفريق الحالي
  ===================================================== */

  const teamData = teams?.find(
    (t) => t.id === profile?.teamId
  );

  const teamCash =
    teamData?.cashNumber ||
    (profile?.teamName === "ديرمواس"
      ? "01282802083"
      : "");

  /* =====================================================
     فصل اللقاءات عن الأحداث
  ===================================================== */

  const meetingList = meetings.filter(
    (m) => m.type !== "event"
  );

  const eventList = meetings.filter(
    (m) => m.type === "event"
  );

  return (
    <div className="min-h-screen bg-sand-50">

      <TopBar />

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">

        {/* =================================================
            بيانات الطالب
        ================================================= */}

        <div className="bg-teal-900 text-sand-50 rounded-xl2 p-5 flex items-center gap-4">

          {profile?.photoURL && (
            <img
              src={profile.photoURL}
              className="w-14 h-14 rounded-full border-2 border-gold-500 object-cover"
              alt=""
            />
          )}

          <div>
            <p className="font-display font-bold text-lg">
              {profile?.name}
            </p>

            <p className="font-body text-teal-100/70 text-sm">
              فريق {profile?.teamName || "—"}
              {" · "}
              منطقة {profile?.region || "—"}
              {" · "}
              {profile?.age || "—"} سنة
            </p>

            <div className="flex flex-wrap gap-2 mt-1">

              <span className="text-xs font-body px-2 py-0.5 rounded-full bg-gold-500/20 text-gold-400">
                {profile?.memberType === "new"
                  ? "مدرسة جديدة"
                  : "مدرسة قديمة"}
              </span>

              <span className="text-xs font-body px-2 py-0.5 rounded-full bg-white/10">
                {profile?.gender === "male"
                  ? "ولد"
                  : "بنت"}
              </span>

              {profile?.schoolName && (
                <span className="text-xs font-body px-2 py-0.5 rounded-full bg-white/10">
                  {profile.schoolName}
                </span>
              )}

            </div>
          </div>

        </div>

        {/* =================================================
            الإحصائيات
        ================================================= */}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

          <StatCard
            label="الحضور"
            value={presentCount}
            tone="good"
          />

          <StatCard
            label="الغياب"
            value={absentCount}
            tone="bad"
          />

          <StatCard
            label="فريقي"
            value={profile?.teamName || "—"}
            tone="neutral"
          />

          <StatCard
            label="النوع"
            value={
              profile?.gender === "male"
                ? "ولد"
                : "بنت"
            }
            tone="neutral"
          />

        </div>

        {/* =================================================
            التعهد
        ================================================= */}

        <section className="bg-white rounded-xl2 shadow-sm border border-teal-900/5 p-5">

          <h2 className="font-display font-bold text-teal-950 mb-3">
            التعهد
          </h2>

          <div className="flex justify-between text-sm font-body mb-2">
            <span className="text-ink/60">
              شهور تم دفعها
            </span>

            <span className="font-bold text-good">
              {paidCount}
            </span>
          </div>

          <div className="flex justify-between text-sm font-body">
            <span className="text-ink/60">
              باقي عليك
            </span>

            <span className="font-bold text-bad">
              {remainingMonths} شهر
            </span>
          </div>

          {teamCash && (
            <p className="mt-4 text-sm font-body bg-gold-500/10 rounded-xl p-3">

              كاش فريق {profile?.teamName || ""}
              :

              <b
                dir="ltr"
                className="mr-1"
              >
                {teamCash}
              </b>

              <br />

              <span className="text-ink/60">
                للدفع أو التواصل مع أدمن الفريق.
              </span>

            </p>
          )}

          <div className="w-full bg-sand-100 rounded-full h-2 mt-4 overflow-hidden">

            <div
              className="bg-gold-500 h-2 rounded-full"
              style={{
                width: `${Math.min(
                  100,
                  (paidCount /
                    monthsSinceJoin) *
                    100
                )}%`,
              }}
            />

          </div>

        </section>

        {/* =================================================
            اللقاءات
        ================================================= */}

        <section className="bg-white rounded-xl2 shadow-sm border border-teal-900/5 p-5">

          <h2 className="font-display font-bold text-teal-950 mb-4">
            اللقاءات
          </h2>

          <MeetingList
            items={meetingList}
            availability={availability}
            onAvailability={toggleAvailability}
            onExcuse={setExcuseOpen}
          />

        </section>

        {/* =================================================
            الأحداث
        ================================================= */}

        <section className="bg-white rounded-xl2 shadow-sm border border-teal-900/5 p-5">

          <h2 className="font-display font-bold text-teal-950 mb-4">
            الأحداث
          </h2>

          <MeetingList
            items={eventList}
            availability={availability}
            onAvailability={toggleAvailability}
            onExcuse={setExcuseOpen}
            event
          />

        </section>

        {/* =================================================
            جروب خدمة الرياضة بمصر
            كل الفرق مع بعض
        ================================================= */}

        <section className="bg-white rounded-xl2 shadow-sm border border-teal-900/5 p-5">

          <div className="flex items-center justify-between mb-4">

            <div>

              <h2 className="font-display font-bold text-teal-950">
                مجموعة خدمة الرياضة بمصر
              </h2>

              <p className="text-xs font-body text-ink/50">
                اكتب تأمل أو شارك صورة —
                المنشورات هنا ظاهرة لكل فرق الخدمة.
              </p>

            </div>

          </div>

          <form
            onSubmit={publishPost}
            className="space-y-2 mb-5"
          >

            <textarea
              value={postText}
              onChange={(e) =>
                setPostText(e.target.value)
              }
              rows={3}
              placeholder="اكتب تأمل أو كلمة تشجيع..."
              className="field-input resize-none"
            />

            <div className="flex gap-2 items-center">

              <input
                id="post-image-input"
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setPostImage(
                    e.target.files?.[0] || null
                  )
                }
                className="text-xs font-body flex-1"
              />

              <button
                type="submit"
                disabled={posting}
                className="bg-teal-900 text-sand-50 px-4 py-2 rounded-xl font-body font-semibold disabled:opacity-50"
              >
                {posting
                  ? "جاري النشر..."
                  : "نشر"}
              </button>

            </div>

          </form>

          <div className="space-y-4">

            {posts.map((p) => (
              <article
                key={p.id}
                className="border-t border-ink/5 pt-4"
              >

                <div className="flex items-center justify-between">

                  <p className="font-body font-bold text-teal-900">
                    {p.authorName}
                  </p>

                  {p.teamName && (
                    <span className="text-xs text-ink/40 font-body">
                      فريق {p.teamName}
                    </span>
                  )}

                </div>

                {p.text && (
                  <p className="font-body text-ink/80 whitespace-pre-wrap mt-1 leading-7">
                    {p.text}
                  </p>
                )}

                {p.imageUrl && (
                  <img
                    src={p.imageUrl}
                    alt=""
                    className="mt-3 max-h-72 w-full object-contain rounded-xl bg-sand-50"
                  />
                )}

                <p className="text-[11px] text-ink/40 font-body mt-2">
                  {p.createdAt
                    ?.toDate?.()
                    ?.toLocaleString(
                      "ar-EG"
                    )}
                </p>

              </article>
            ))}

            {!posts.length && (
              <p className="text-sm font-body text-ink/40">
                لسه مفيش منشورات في مجموعة الخدمة.
              </p>
            )}

          </div>

        </section>

        {/* =================================================
            الاعتذارات
        ================================================= */}

        <section className="bg-white rounded-xl2 shadow-sm border border-teal-900/5 p-5">

          <h2 className="font-display font-bold text-teal-950 mb-2">
            اعتذاراتي
          </h2>

          <p className="text-xs font-body text-ink/50 mb-4">
            الاعتذار خاص بك وبقادة فريقك فقط.
          </p>

          <div className="space-y-2">

            {excuses.map((x) => (
              <div
                key={x.id}
                className="bg-sand-50 rounded-xl p-3 text-sm font-body"
              >

                <b>
                  {x.meetingTitle}
                </b>

                {" — "}

                {x.reason}

                <span className="block text-xs text-ink/40 mt-1">
                  {x.status === "new"
                    ? "في انتظار رد القائد"
                    : "تم التعامل معه"}
                </span>

              </div>
            ))}

            {!excuses.length && (
              <p className="text-sm text-ink/40 font-body">
                مفيش اعتذارات حالياً.
              </p>
            )}

          </div>

        </section>

      </div>

      {/* =================================================
          نافذة إرسال الاعتذار
      ================================================= */}

      {excuseOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={() =>
            setExcuseOpen(null)
          }
        >

          <div
            className="bg-white rounded-xl2 p-6 max-w-md w-full"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <h3 className="font-display font-bold text-teal-950">
              إرسال اعتذار خاص للقائد
            </h3>

            <p className="font-body text-sm text-ink/50 mt-1">
              {excuseOpen.title}
            </p>

            <textarea
              value={excuseReason}
              onChange={(e) =>
                setExcuseReason(e.target.value)
              }
              rows={4}
              className="field-input mt-4"
              placeholder="اكتب سبب الاعتذار..."
            />

            <div className="flex gap-2 mt-4">

              <button
                type="button"
                onClick={() => se
