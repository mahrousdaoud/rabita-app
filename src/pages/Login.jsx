import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { signInWithGoogle } = useAuth();
  return (
    <div className="min-h-screen bg-teal-950 flex items-center justify-center px-6">
      <div className="w-full max-w-md text-center">
        <img src="/logo.png" alt="شعار خدمة الرياضة بمصر" className="w-32 h-32 mx-auto mb-5 drop-shadow-lg" />
        <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-sand-50 leading-snug">
          خدمة الرياضة بمصر
        </h1>
        <p className="font-body text-teal-100/70 mt-3 mb-10 text-sm">
          سجّل دخولك بحساب الجيميل عشان تشوف فريقك، اللقاءات والأحداث، الحضور، التعهدات، والمجموعة الخاصة بفريقك.
        </p>
        <button onClick={signInWithGoogle}
          className="w-full flex items-center justify-center gap-3 bg-sand-50 hover:bg-white transition text-ink font-body font-semibold py-3.5 rounded-xl2 shadow-lg">
          <svg width="22" height="22" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.6 20.5H42V20.4H24v7.2h11.3c-1.6 4.6-6 7.9-11.3 7.9-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.1-5.1C33.5 6.1 29 4.4 24 4.4 13.2 4.4 4.4 13.2 4.4 24S13.2 43.6 24 43.6 43.6 34.8 43.6 24c0-1.2-.1-2.4-.4-3.5z"/>
            <path fill="#FF3D00" d="M6.3 14.7l5.9 4.3c1.6-4 5.5-6.8 10.1-6.8 3 0 5.8 1.1 7.9 3l5.1-5.1C33.5 6.1 29 4.4 24 4.4c-7.4 0-13.8 4.2-17 10.3z"/>
            <path fill="#4CAF50" d="M24 43.6c4.9 0 9.4-1.9 12.7-4.9l-5.9-5c-1.9 1.4-4.4 2.3-6.8 2.3-5.3 0-9.6-3.3-11.3-7.9l-5.9 4.6c3.1 6.2 9.5 10.9 17.2 10.9z"/>
            <path fill="#1976D2" d="M43.6 20.5H42V20.4H24v7.2h11.3c-.8 2.3-2.3 4.3-4.3 5.7l5.9 5c-.4.4 6.7-4.9 6.7-14.4 0-1.2-.1-2.4-.4-3.5z"/>
          </svg>
          الدخول بحساب جوجل
        </button>
        <p className="text-teal-100/40 text-xs font-body mt-6">أول ما تدخل هنطلب منك تكمل بياناتك الأساسية مرة واحدة بس</p>
      </div>
    </div>
  );
}
