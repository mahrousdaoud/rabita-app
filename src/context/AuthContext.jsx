import { createContext, useContext, useEffect, useState } from "react";
import { signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged } from "firebase/auth";
import { collection, doc, getDoc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, googleProvider, db, isAdminEmail } from "../lib/firebase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [teams, setTeams] = useState([]);
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [excuseAdminIds, setExcuseAdminIds] = useState([]);

  useEffect(() => {
    if (!user) return;
    const unsubTeams = onSnapshot(collection(db, "teams"), (snap) => setTeams(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
    const unsubSchools = onSnapshot(collection(db, "schools"), (snap) => setSchools(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
    const unsubSettings = onSnapshot(doc(db, "settings", "global"), (snap) => setExcuseAdminIds(snap.exists() ? (snap.data().excuseAdminIds || []) : []));
    return () => { unsubTeams(); unsubSchools(); unsubSettings(); };
  }, [user]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      setUser(fbUser);
      if (!fbUser) { setProfile(null); setLoading(false); return; }
      try {
        const snap = await getDoc(doc(db, "students", fbUser.uid));
        setProfile(snap.exists() ? { id: snap.id, ...snap.data() } : null);
      } catch (e) {
        console.error("Profile load failed", e);
        setProfile(null);
      } finally { setLoading(false); }
    });
    return unsub;
  }, []);

  const refreshProfile = async () => {
    if (!user) return;
    const snap = await getDoc(doc(db, "students", user.uid));
    setProfile(snap.exists() ? { id: snap.id, ...snap.data() } : null);
  };

  const signInWithGoogle = async () => signInWithPopup(auth, googleProvider);
  const signOut = async () => firebaseSignOut(auth);

  const completeRegistration = async (formData) => {
    if (!user) return;
    const team = teams.find((t) => t.id === formData.teamId);
    const memberTypeLabels = {
      leader: "قائد",
      batch1: "مدرسة الدفعة الأولى",
      batch2: "مدرسة الدفعة الثانية",
      batch3: "مدرسة الدفعة الثالثة",
    };
    const data = {
      name: formData.name.trim(), email: user.email, photoURL: user.photoURL || "",
      phone: formData.phone.trim(), region: formData.region.trim(), teamId: formData.teamId,
      teamName: team?.name || "", schoolId: null, schoolName: "",
      birthDate: formData.birthDate, birthMonth: Number(formData.birthDate?.split("-")[1] || 0),
      birthDay: Number(formData.birthDate?.split("-")[2] || 0),
      age: Number(formData.age || 0), gender: formData.gender,
      contribution: formData.contribution || "", memberType: formData.memberType,
      memberTypeLabel: memberTypeLabels[formData.memberType] || formData.memberType,
      isAdmin: isAdminEmail(user.email), adminTeamIds: [], adminSchoolIds: [], paidMonths: [],
      isBlacklisted: false, createdAt: serverTimestamp(),
    };
    await setDoc(doc(db, "students", user.uid), data);
    await setDoc(doc(db, "publicMembers", user.uid), {
      name: data.name, birthDate: data.birthDate, birthMonth: data.birthMonth, birthDay: data.birthDay,
      photoURL: data.photoURL, updatedAt: serverTimestamp(),
    }, { merge: true });
    setProfile({ id: user.uid, ...data });
  };

  const isSuperAdmin = !!user && (isAdminEmail(user.email) || !!profile?.isAdmin);
  const adminTeamIds = Array.from(new Set([...(profile?.adminTeamIds || []), ...(profile?.adminTeamId ? [profile.adminTeamId] : [])]));
  const adminSchoolIds = profile?.adminSchoolIds || [];
  const isTeamAdmin = adminTeamIds.length > 0;
  const isSchoolAdmin = adminSchoolIds.length > 0;
  const isExcuseAdmin = !!user && excuseAdminIds.includes(user.uid);
  const isAnyAdmin = isSuperAdmin || isTeamAdmin || isSchoolAdmin || isExcuseAdmin;

  return <AuthContext.Provider value={{
    user, profile, loading, teams, schools,
    isBlacklisted: !!profile?.isBlacklisted,
    isSuperAdmin, isTeamAdmin, isSchoolAdmin, isExcuseAdmin, isAnyAdmin,
    adminTeamIds, adminSchoolIds, adminTeamId: adminTeamIds[0] || null,
    signInWithGoogle, signOut, completeRegistration, refreshProfile,
  }}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
