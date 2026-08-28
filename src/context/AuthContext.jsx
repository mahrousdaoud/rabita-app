import { createContext, useContext, useEffect, useState } from "react";
import { signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged } from "firebase/auth";
import { collection, doc, getDoc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, googleProvider, db, isAdminEmail } from "../lib/firebase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,setUser]=useState(null),[profile,setProfile]=useState(null),[teams,setTeams]=useState([]),[schools,setSchools]=useState([]),[blacklisted,setBlacklisted]=useState(false),[loading,setLoading]=useState(true),[excuseAdminIds,setExcuseAdminIds]=useState([]);

  useEffect(()=>{
    if(!user){ setTeams([]); setSchools([]); setExcuseAdminIds([]); return; }
    const unsubs=[];
    unsubs.push(onSnapshot(collection(db,"teams"),s=>setTeams(s.docs.map(d=>({id:d.id,...d.data()}))),()=>setTeams([])));
    unsubs.push(onSnapshot(collection(db,"schools"),s=>setSchools(s.docs.map(d=>({id:d.id,...d.data()}))),()=>setSchools([])));
    unsubs.push(onSnapshot(doc(db,"appSettings","general"),s=>setExcuseAdminIds(s.exists() ? (s.data().excuseAdminIds || []) : []),()=>setExcuseAdminIds([])));
    return ()=>unsubs.forEach(u=>u());
  },[user?.uid]);

  useEffect(()=>{
    if(!user){setBlacklisted(false);return;}
    return onSnapshot(doc(db,"blacklist",user.uid),s=>setBlacklisted(s.exists() && s.data().active !== false),()=>setBlacklisted(false));
  },[user?.uid]);

  useEffect(()=>onAuthStateChanged(auth,async fbUser=>{
    setUser(fbUser); setProfile(null); setBlacklisted(false);
    if(!fbUser){setLoading(false);return;}
    try{
      const [profileSnap,blockedSnap]=await Promise.all([getDoc(doc(db,"students",fbUser.uid)),getDoc(doc(db,"blacklist",fbUser.uid))]);
      setBlacklisted(blockedSnap.exists() && blockedSnap.data().active !== false);
      setProfile(profileSnap.exists()?{id:profileSnap.id,...profileSnap.data()}:null);
    }catch(e){ console.error(e); }
    setLoading(false);
  }),[]);

  const refreshProfile=async()=>{if(!user)return;const [snap,blocked]=await Promise.all([getDoc(doc(db,"students",user.uid)),getDoc(doc(db,"blacklist",user.uid))]);setProfile(snap.exists()?{id:snap.id,...snap.data()}:null);setBlacklisted(blocked.exists()&&blocked.data().active!==false);};
  const signInWithGoogle=async()=>signInWithPopup(auth,googleProvider);
  const signOut=async()=>firebaseSignOut(auth);

  const completeRegistration=async(formData)=>{
    if(!user)return;
    const team=teams.find(t=>t.id===formData.teamId), school=schools.find(s=>s.id===formData.schoolId);
    const data={name:formData.name,email:user.email,photoURL:user.photoURL||"",phone:formData.phone,region:formData.region,teamId:formData.teamId,teamName:team?.name||"",schoolId:formData.schoolId||null,schoolName:school?.name||"",birthDate:formData.birthDate||"",age:formData.birthDate ? new Date().getFullYear()-new Date(formData.birthDate).getFullYear() : Number(formData.age)||null,gender:formData.gender,contribution:formData.contribution||"",memberType:formData.memberType,isAdmin:isAdminEmail(user.email),adminTeamIds:[],adminSchoolIds:[],paidMonths:[],createdAt:serverTimestamp()};
    await setDoc(doc(db,"students",user.uid),data);
    if(formData.birthDate) await setDoc(doc(db,"publicBirthdays",user.uid),{name:formData.name,birthDate:formData.birthDate,month:Number(formData.birthDate.slice(5,7)),day:Number(formData.birthDate.slice(8,10)),active:true,updatedAt:serverTimestamp()},{merge:true});
    setProfile({id:user.uid,...data});
  };

  const isSuperAdmin=!!user&&(isAdminEmail(user.email)||!!profile?.isAdmin);
  const adminTeamIds=Array.from(new Set([...(profile?.adminTeamIds||[]),...(profile?.adminTeamId?[profile.adminTeamId]:[])]));
  const adminSchoolIds=profile?.adminSchoolIds||[];
  const isTeamAdmin=adminTeamIds.length>0,isSchoolAdmin=adminSchoolIds.length>0;
  const isExcuseAdmin=!!user && (isSuperAdmin || excuseAdminIds.includes(user.uid));
  const isAnyAdmin=isSuperAdmin||isTeamAdmin||isSchoolAdmin||isExcuseAdmin;
  return <AuthContext.Provider value={{user,profile,loading,teams,schools,blacklisted,isSuperAdmin,isTeamAdmin,isSchoolAdmin,isExcuseAdmin,isAnyAdmin,adminTeamIds,adminSchoolIds,adminTeamId:adminTeamIds[0]||null,excuseAdminIds,signInWithGoogle,signOut,completeRegistration,refreshProfile}}>{children}</AuthContext.Provider>;
}
export const useAuth=()=>useContext(AuthContext);
