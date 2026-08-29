import { useEffect,useState } from "react";
import { collection,onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useLanguage } from "../context/LanguageContext";

function daysUntil(month,day){const now=new Date();const target=new Date(now.getFullYear(),Number(month)-1,Number(day));if(target<new Date(now.getFullYear(),now.getMonth(),now.getDate()))target.setFullYear(now.getFullYear()+1);return Math.round((target-new Date(now.getFullYear(),now.getMonth(),now.getDate()))/86400000);}
export default function BirthdayNotifications({compact=false}){
 const {t,lang}=useLanguage();const [people,setPeople]=useState([]);
 useEffect(()=>onSnapshot(collection(db,"publicBirthdays"),s=>setPeople(s.docs.map(d=>d.data())),()=>setPeople([])),[]);
 const matches=people.filter(p=>p.active!==false).map(p=>({...p,days:daysUntil(p.month,p.day)})).filter(p=>p.days<=7).sort((a,b)=>a.days-b.days);
 if(compact)return <div title={matches.length?`${t("birthdays")}: ${matches.map(x=>x.name).join(", ")}`:t("noBirthdays")} className="relative text-sm px-2 py-1 rounded-lg bg-white/10">🎂{matches.length>0&&<span className="absolute -top-1 -right-1 min-w-4 h-4 rounded-full bg-gold-500 text-teal-950 text-[9px] font-bold flex items-center justify-center">{matches.length}</span>}</div>;
 return <section className="card p-5"><h2 className="font-display font-bold text-teal-950 mb-3">🎂 أعياد الميلاد القادمة</h2>{matches.length?<div className="space-y-2">{matches.map((p,i)=><div key={i} className="bg-gold-500/10 rounded-xl p-3 font-body text-sm">{p.days===0?"🎉 النهارده عيد ميلاد":p.days===1?"🎉 بكرا عيد ميلاد":`🎉 عيد ميلاد ${p.name} خلال ${p.days} أيام`} {p.days===0||p.days===1?<b>{p.name}</b>:""}</div>)}</div>:<p className="text-sm text-ink/40 font-body">{t("noBirthdays")}</p>}</section>
}
