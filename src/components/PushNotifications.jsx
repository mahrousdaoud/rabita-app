import { useEffect, useState } from "react";
import { getToken, onMessage } from "firebase/messaging";
import { doc, setDoc, Timestamp } from "firebase/firestore";
import { db, FIREBASE_VAPID_KEY, messagingPromise } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";

export default function PushNotifications() {
  const { user } = useAuth();
  const [status, setStatus] = useState("idle");

  useEffect(() => {
    if (!user || !("Notification" in window)) return;
    let stop = () => {};
    (async () => {
      const messaging = await messagingPromise;
      if (!messaging) return;
      if (Notification.permission === "denied") { setStatus("denied"); return; }
      try {
        if (Notification.permission !== "granted") {
          const permission = await Notification.requestPermission();
          if (permission !== "granted") { setStatus("denied"); return; }
        }
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
        stop = onMessage(messaging, payload => {
          const title = payload.notification?.title || payload.data?.title || "رابطة الرياضة بمصر";
          const body = payload.notification?.body || payload.data?.body || "";
          if (document.visibilityState === "visible") {
            new Notification(title, { body, icon: "/logo.png" });
          }
        });
      } catch (e) {
        console.warn("Push notifications:", e);
        setStatus("error");
      }
    })();
    return () => stop();
  }, [user?.uid]);

  return null;
}
