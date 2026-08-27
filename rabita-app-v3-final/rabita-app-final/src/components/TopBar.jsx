import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

export default function TopBar({ title = "خدمة الرياضة بمصر" }) {
  const { user, isAnyAdmin, signOut } = useAuth();
  return (
    <div className="bg-teal-950 text-sand-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <img src="/logo.png" className="w-11 h-11 object-contain" alt="" />
          <div><p className="font-display font-bold text-sm leading-tight">{title}</p><p className="font-body text-[11px] text-teal-100/50">{user?.email}</p></div>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/regulations" className="text-xs font-body text-teal-100/80 hover:text-white">اللائحة</Link>
          {isAnyAdmin && <Link to="/admin" className="text-xs font-body bg-gold-500 text-teal-950 font-semibold px-3 py-1.5 rounded-lg">لوحة الأدمن</Link>}
          <button onClick={signOut} className="text-xs font-body text-teal-100/70 hover:text-sand-50">خروج</button>
        </div>
      </div>
    </div>
  );
}
