import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useLanguage } from "../context/LanguageContext";

function tomorrowMonthDay() {
  const d = new Date(); d.setDate(d.getDate() + 1);
  return { month: d.getMonth() + 1, day: d.getDate() };
}

export default function BirthdayNotifications() {
  const { lang, t } = useLanguage();
  const [birthdays, setBirthdays] = useState([]);
  useEffect(() => {
    const { month, day } = tomorrowMonthDay();
    const unsub = onSnapshot(query(collection(db, "publicMembers"), where("birthMonth", "==", month), where("birthDay", "==", day)), snap => setBirthdays(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return unsub;
  }, []);
  if (!birthdays.length) return null;
  return <div className="bg-gold-500/15 border border-gold-500/40 rounded-xl2 p-4">
    <p className="font-display font-bold text-teal-950">🎂 {t("birthday")}</p>
    <div className="mt-2 space-y-1">{birthdays.map(b => <p key={b.id} className="font-body text-sm">{lang === "ar" ? `بكرا عيد ميلاد ${b.name} 🎉` : `Tomorrow is ${b.name}'s birthday 🎉`}</p>)}</div>
  </div>;
}
