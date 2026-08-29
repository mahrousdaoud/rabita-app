const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();
const messaging = admin.messaging();

async function allTokens() {
  const snap = await db.collection("notificationTokens").get();
  return [...new Set(snap.docs.map(d => d.data().token).filter(Boolean))];
}
async function sendToEveryone(title, body, url="/") {
  const tokens = await allTokens();
  if (!tokens.length) return;
  for (let i=0;i<tokens.length;i+=500) {
    const batch=tokens.slice(i,i+500);
    await messaging.sendEachForMulticast({
      tokens: batch,
      notification: { title, body },
      data: { title, body, url },
      webpush: { fcmOptions: { link: url } }
    });
  }
}
function nameOf(data){ return data?.authorName || data?.studentName || data?.name || "أحد أعضاء المنصة"; }

exports.notifyNewPost = onDocumentCreated("teamPosts/{postId}", async event => {
  const d=event.data?.data(); if(!d) return;
  await sendToEveryone("رسالة جديدة في المنصة", `${nameOf(d)} نشر: ${(d.text||"صورة جديدة").slice(0,120)}`);
});
exports.notifyNewComment = onDocumentCreated("teamPostComments/{commentId}", async event => {
  const d=event.data?.data(); if(!d) return;
  await sendToEveryone("رد جديد", `${nameOf(d)} أضاف ردًا جديدًا في الجروب`);
});
exports.notifyNewMeeting = onDocumentCreated("meetings/{meetingId}", async event => {
  const d=event.data?.data(); if(!d) return;
  await sendToEveryone("موعد جديد", `${d.title || "تمت إضافة لقاء جديد"}${d.location ? ` — ${d.location}` : ""}`);
});
exports.notifyNewEvent = onDocumentCreated("customEvents/{eventId}", async event => {
  const d=event.data?.data(); if(!d) return;
  await sendToEveryone("حدث جديد", d.title || "تمت إضافة حدث جديد");
});
exports.notifyNewExcuse = onDocumentCreated("excuses/{excuseId}", async event => {
  const d=event.data?.data(); if(!d) return;
  await sendToEveryone("اعتذار جديد", `${d.studentName || "عضو"} أرسل اعتذارًا عن ${d.meetingTitle || "لقاء"}`);
});
exports.notifyNewLeader = onDocumentCreated("leaders/{leaderId}", async event => {
  const d=event.data?.data(); if(!d) return;
  await sendToEveryone("قائد جديد", `تمت إضافة القائد ${d.name || ""} لفريق ${d.teamName || ""}`);
});

exports.birthdayNotification = onSchedule(
  { schedule: "0 9 * * *", timeZone: "Africa/Cairo", region: "europe-west1" },
  async () => {
    const now = new Date();
    const month=now.getMonth()+1, day=now.getDate();
    const snap=await db.collection("publicBirthdays").where("active","==",true).get();
    const names=snap.docs.map(d=>d.data()).filter(p=>Number(p.month)===month && Number(p.day)===day).map(p=>p.name).filter(Boolean);
    if(names.length) await sendToEveryone("🎂 أعياد الميلاد اليوم", `النهارده عيد ميلاد ${names.join("، ")} 🎉`);
  }
);
