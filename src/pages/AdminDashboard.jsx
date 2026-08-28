import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import TopBar from "../components/TopBar";
import AdminTeamDashboard from "../components/admin/AdminTeamDashboard";
import AdminStudents from "../components/admin/AdminStudents";
import AdminMeetings from "../components/admin/AdminMeetings";
import AdminAttendance from "../components/admin/AdminAttendance";
import AdminPayments from "../components/admin/AdminPayments";
import AdminTeams from "../components/admin/AdminTeams";
import AdminSchools from "../components/admin/AdminSchools";
import AdminExcuses from "../components/admin/AdminExcuses";
import AdminAvailability from "../components/admin/AdminAvailability";
import AdminSettings from "../components/admin/AdminSettings";

export default function AdminDashboard(){
 const {isSuperAdmin,isTeamAdmin,isSchoolAdmin,isExcuseAdmin}=useAuth();
 const TABS=[
  ["dashboard","الداشبورد",<AdminTeamDashboard/>],["students","الطلاب",<AdminStudents/>],
  ["meetings","اللقاءات",<AdminMeetings type="meeting"/>],["events","الأحداث",<AdminMeetings type="event"/>],
  ["attendance","الحضور والغياب",<AdminAttendance/>],["availability","تأكيد الحضور (فوت)",<AdminAvailability/>],
  ["payments","التعهد",<AdminPayments/>],
  ...((isTeamAdmin||isSchoolAdmin||isExcuseAdmin||isSuperAdmin)?[["excuses","الاعتذارات",<AdminExcuses/>]]:[]),
  ...(isSuperAdmin?[["teams","الفرق",<AdminTeams/>],["schools","المدارس",<AdminSchools/>],["settings","الإعدادات والبلاك ليست",<AdminSettings/>]]:[])
 ];
 const[tab,setTab]=useState("dashboard");const active=TABS.find(x=>x[0]===tab)?.[2]||TABS[0][2];
 return <div className="min-h-screen bg-sand-50"><TopBar title="لوحة الأدمن — خدمة الرياضة بمصر"/><div className="max-w-6xl mx-auto px-4 py-6"><div className="flex gap-2 mb-6 overflow-x-auto pb-1">{TABS.map(([k,l])=><button key={k} onClick={()=>setTab(k)} className={`px-4 py-2 rounded-xl font-body font-semibold text-sm whitespace-nowrap ${tab===k?"bg-teal-900 text-sand-50":"bg-white text-ink/60 border"}`}>{l}</button>)}</div>{active}</div></div>;
}
