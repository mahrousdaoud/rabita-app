import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Welcome from "./pages/Welcome";
import StudentDashboard from "./pages/StudentDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Regulations from "./pages/Regulations";
import Blocked from "./pages/Blocked";
import { LanguageProvider } from "./context/LanguageContext";

function Gate() {
  const { user, profile, loading, isAnyAdmin, isBlacklisted } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-sand-50 font-body text-ink/50">جاري التحميل...</div>;
  }
  if (!user) return <Login />;
  if (!profile) return <Register />;
  if (isBlacklisted) return <Blocked />;

  return (
    <Routes>
      <Route path="/about" element={<Welcome />} />
      <Route path="/regulations" element={<Regulations />} />
      <Route path="/" element={<StudentDashboard />} />
      <Route path="/admin" element={isAnyAdmin ? <AdminDashboard /> : <Navigate to="/" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return <BrowserRouter><LanguageProvider><AuthProvider><Gate /></AuthProvider></LanguageProvider></BrowserRouter>;
}
