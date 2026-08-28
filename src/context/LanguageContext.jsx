import { createContext, useContext, useEffect, useState } from "react";

const LanguageContext = createContext(null);
const dict = {
  ar: {
    about: "من نحن", regulations: "اللائحة", admin: "لوحة الأدمن", logout: "خروج",
    dashboard: "الرئيسية", meetings: "اللقاءات", events: "أحداثنا", group: "مجموعة الخدمة",
    birthday: "أعياد الميلاد", tomorrowBirthday: "بكرا عيد ميلاد", noBirthdays: "مفيش أعياد ميلاد بكرا",
    blockedTitle: "تم حجب حسابك", blockedText: "حسابك موجود في القائمة السوداء، لذلك لا يمكنك الوصول إلى محتوى المنصة.",
    close: "إغلاق", language: "English", welcome: "خدمة الرياضة بمصر",
  },
  en: {
    about: "About us", regulations: "Regulations", admin: "Admin panel", logout: "Log out",
    dashboard: "Home", meetings: "Meetings", events: "Our Events", group: "Service Group",
    birthday: "Birthdays", tomorrowBirthday: "Tomorrow is", noBirthdays: "No birthdays tomorrow",
    blockedTitle: "Account blocked", blockedText: "Your account is on the blacklist, so access to the platform is blocked.",
    close: "Close", language: "العربية", welcome: "Sports Ministry Egypt",
  }
};

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem("rabita_lang") || "ar");
  useEffect(() => { localStorage.setItem("rabita_lang", lang); document.documentElement.lang = lang; document.documentElement.dir = lang === "ar" ? "rtl" : "ltr"; }, [lang]);
  const t = (key) => dict[lang]?.[key] ?? dict.ar[key] ?? key;
  return <LanguageContext.Provider value={{ lang, setLang, t }}>{children}</LanguageContext.Provider>;
}
export const useLanguage = () => useContext(LanguageContext);
