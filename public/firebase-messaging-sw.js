/* Firebase Cloud Messaging service worker.
   VAPID is configured in the web app; this worker only displays background messages. */
importScripts("https://www.gstatic.com/firebasejs/12.18.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.18.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyAwCWdn3CheiEhMxxfuxiJTTZfvJsIZWqE",
  authDomain: "rabita-app-6e398.firebaseapp.com",
  projectId: "rabita-app-6e398",
  storageBucket: "rabita-app-6e398.firebasestorage.app",
  messagingSenderId: "37908301221",
  appId: "1:37908301221:web:4eace787560845ea28d44c"
});

const messaging = firebase.messaging();
messaging.onBackgroundMessage(payload => {
  const title = payload.notification?.title || payload.data?.title || "رابطة الرياضة بمصر";
  const options = {
    body: payload.notification?.body || payload.data?.body || "",
    icon: "/logo.png",
    badge: "/logo.png",
    data: { url: payload.data?.url || "/" }
  };
  self.registration.showNotification(title, options);
});
self.addEventListener("notificationclick", event => {
  event.notification.close();
  event.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then(list => {
    const url = event.notification.data?.url || "/";
    for (const client of list) if ("focus" in client) { client.navigate(url); return client.focus(); }
    return clients.openWindow(url);
  }));
});
