import { useLanguage } from "../context/LanguageContext";
export default function LanguageToggle() {
  const { lang, setLang, t } = useLanguage();
  return <button type="button" onClick={() => setLang(lang === "ar" ? "en" : "ar")} className="text-xs font-body border border-current/20 rounded-lg px-2.5 py-1.5 hover:bg-white/10" aria-label="Change language">{t("language")}</button>;
}
