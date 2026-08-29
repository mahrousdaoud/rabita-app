import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import LanguageToggle from "../components/LanguageToggle";

const values = [
  ["المحبة", "إظهار محبة المسيح للجميع دون تمييز"],
  ["الشفافية والوضوح", "وضوح وشفافية في التواصل واتخاذ القرارات"],
  ["الاستقامة والقداسة", "التصرف بأمانة في جميع تعاملاتنا"],
  ["المحاسبة والمسؤولية", "نعمل بمصداقية ونقوم بمحاسبة بعضنا البعض لتعزيز الثقة"],
  ["الثقة", "نعتمد على الله وعلى بعض ونفي بوعودنا"],
  ["الفريق الواحد", "تعزيز روح الفريق والعمل الجماعي"],
  ["التعليم المستمر", "السعي الدائم للتعلم وتطوير الذات والآخرين"],
];

export default function Welcome() {
  const navigate = useNavigate();
  const {lang}=useLanguage();
  const enter = () => { localStorage.setItem("rabita_intro_seen", "1"); navigate("/"); };
  return (
    <div className="min-h-screen bg-sand-50 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-5 relative"><div className="absolute top-0 right-0 z-10"><LanguageToggle/></div>
        <section className="bg-white text-teal-950 rounded-xl2 p-6 md:p-9 text-center border border-teal-900/10 shadow-sm">
          <img src="/logo.png" className="w-28 h-28 mx-auto mb-4 bg-sand-50 rounded-2xl p-2 border border-teal-900/10" alt="شعار EGYPT SPORTS COALITION" />
          <p className="font-display text-gold-400 font-bold mb-2">{lang === "ar" ? "اذهبوا – تلمذوا – علموا" : "Go – Make Disciples – Teach"}</p>
          <p className="font-body text-xs md:text-sm text-teal-900/70 leading-7">اذهبوا وتلمذوا جميع الأمم، وعمدوهم باسم الآب والابن والروح القدس، وعلموهم أن يحفظوا جميع ما أوصيتكم به. وها أنا معكم كل الأيام إلى انقضاء الدهر. آمين. متى 19:28 - 20</p>
          <h1 className="font-display font-extrabold text-2xl md:text-4xl">{lang === "ar" ? "EGYPT SPORTS COALITION" : "EGYPT SPORTS COALITION"}</h1>
          <p className="font-body mt-4 leading-8 text-teal-900/75">
            {lang === "ar" ? "جيل من الشباب يعرف الرب وتلاميذ وخدام المسيح من خلال الرياضة" : "A generation of young people who know the Lord and become disciples and servants of Christ through sports"}
          </p>
        </section>

        <section className="bg-white rounded-xl2 border border-teal-900/5 shadow-sm p-6 md:p-8 space-y-6">
          <div>
            <h2 className="section-title">{lang === "ar" ? "الرؤية" : "Vision"}</h2>
            <p className="font-body text-ink/75 leading-8">{lang === "ar" ? "جيل من الشباب يعرف الرب وتلاميذ وخدام المسيح من خلال الرياضة" : "A generation of young people who know the Lord and become disciples and servants of Christ through sports"}</p>
          </div>
          <div>
            <h2 className="section-title">{lang === "ar" ? "الرسالة" : "Mission"}</h2>
            <p className="font-body text-ink/75 leading-8">
              إعداد جيل من الشباب المؤمن والمؤثر في المجتمع من خلال الكرازة والتلمذة وتدريب القادة من خلال الرياضة ليكونوا قدوة وخداما مؤثرين وفعالين في حياة الآخرين
            </p>
          </div>
          <div>
            <h2 className="section-title">{lang === "ar" ? "القيم المحورية" : "Core Values"}</h2>
            <div className="grid md:grid-cols-2 gap-3">
              {values.map(([title, text]) => (
                <div key={title} className="bg-sand-50 rounded-xl p-4">
                  <p className="font-display font-bold text-teal-900">{title}</p>
                  <p className="font-body text-sm text-ink/65 mt-1">{text}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h2 className="section-title">{lang === "ar" ? "الاستراتيجيات الرئيسية" : "Key Strategies"}</h2>
            <p className="font-body text-ink/75">كرازة - تلمذة - تعليم وتدريب - صلاة</p>
          </div>
          <div>
            <h2 className="section-title">{lang === "ar" ? "إقرار الإيمان" : "Statement of Faith"}</h2>
            <p className="font-body text-ink/75 leading-8">
              نحن خدمة (الرياضة بمصر) نؤمن بأن الكتاب المقدس هو كلمة الله المعصومة وهو المرجعية العليا لحياتنا وتعليمنا وخدمتنا. نؤمن بإله واحد في ثلاثة أقانيم (الآب والابن والروح القدس) وألوهية يسوع المسيح المولود من عذراء بلا خطية، صُلب عن خطايانا قام من الموت وصعد للسماء وسيأتي ثانيةً. نؤمن بسكنى الروح القدس في حياة المؤمن ووحدة وشركة المؤمنين في المسيح وقيامة الأموات والحياة الأبدية من خلال إيمان واحد. كما نؤمن بدور الكنيسة في التأثير الإيجابي في المجتمع ومسؤوليتنا في إدارة الموارد بأمانة. نؤمن بأن الله مالك كل شيء ونحن وكلاء مسؤولون أمامه عن استخدام الموارد بأمانة وحكمة لمجد الله.
            </p>
          </div>
        </section>
        <button onClick={enter} className="w-full bg-gold-500 hover:bg-gold-600 text-teal-950 font-body font-bold py-3.5 rounded-xl2">
          {lang === "ar" ? "دخول إلى المنصة" : "Enter Platform"}
        </button>
      </div>
    </div>
  );
}
