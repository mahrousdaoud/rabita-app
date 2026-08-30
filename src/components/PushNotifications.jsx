import { useEffect, useState } from "react";
import { getToken, onMessage } from "firebase/messaging";
import { doc, setDoc, Timestamp } from "firebase/firestore";
import { db, FIREBASE_VAPID_KEY, messagingPromise } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";

export default function PushNotifications() {
  const { user } = useAuth();
  const [status, setStatus] = useState("idle");

  const registerToken = async () => {
    const messaging = await messagingPromise;
    if (!messaging) return;
    if (!FIREBASE_VAPID_KEY) { setStatus("missing-key"); return; }
    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    const token = await getToken(messaging, { vapidKey: FIREBASE_VAPID_KEY, serviceWorkerRegistration: registration });
    if (token) {
      await setDoc(doc(db, "notificationTokens", token), {
        uid: user.uid,
        token,
        updatedAt: Timestamp.now(),
        platform: /android|iphone|ipad|mobile/i.test(navigator.userAgent) ? "mobile" : "desktop"
      }, { merge: true });
      setStatus("enabled");
    }
    onMessage(messaging, payload => {
      const title = payload.notification?.title || payload.data?.title || "رابطة الرياضة بمصر";
      const body = payload.notification?.body || payload.data?.body || "";
      if (document.visibilityState === "visible") {
        new Notification(title, { body, icon: "/logo.png" });
      }
    });
  };

  // يُطلب الإذن فقط بضغطة مستخدم حقيقية (user gesture)، وهو ما تشترطه المتصفحات
  // (خصوصًا Safari/iOS) — طلبه تلقائيًا عند تحميل الصفحة كان بيتجاهله أو يترفض المتصفح.
  const enable = async () => {
    if (!user || !("Notification" in window)) return;
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") { setStatus("denied"); return; }
      await registerToken();
    } catch (e) {
      console.warn("Push notifications:", e);
      setStatus("error");
    }
  };

  useEffect(() => {
    if (!user || !("Notification" in window)) { setStatus("unsupported"); return; }
    if (Notification.permission === "granted") {
      // الإذن ممنوح بالفعل من قبل، فتحديث التوكن هنا آمن ولا يفتح أي نافذة طلب إذن
      registerToken().catch(() => setStatus("error"));
    } else if (Notification.permission === "denied") {
      setStatus("denied");
    } else {
      setStatus("prompt");
    }
  }, [user?.uid]);

  if (status !== "prompt") return null;

  return (
    <div className="fixed bottom-4 inset-x-4 md:inset-x-auto md:right-4 md:max-w-sm z-40 bg-teal-900 text-white rounded-xl2 p-4 flex items-center justify-between gap-3 shadow-lg font-body">
      <p className="text-sm">فعّل الإشعارات عشان توصلك تحديثات الفريق أول بأول</p>
      <button onClick={enable} className="bg-white text-teal-900 px-3 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap">تفعيل</button>
    </div>
  );
}
