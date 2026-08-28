import { useLanguage } from "../context/LanguageContext";
export default function LanguageToggle(){ const {lang,toggleLanguage}=useLanguage(); return <button onClick={toggleLanguage} aria-label="language" className="text-xs font-body border border-white/20 px-3 py-1.5 rounded-lg hover:bg-white/10">{lang === "ar" ? "English" : "العربية"}</button>; }
