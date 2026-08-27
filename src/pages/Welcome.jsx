import { useNavigate } from "react-router-dom";

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
  const enter = () => { localStorage.setItem("rabita_intro_seen", "1"); navigate("/"); };
  return (
    <div className="min-h-screen bg-sand-50 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-5">
        <section className="bg-teal-950 text-sand-50 rounded-xl2 p-6 md:p-9 text-center">
          <img src="/logo.png" className="w-28 h-28 mx-auto mb-4" alt="شعار خدمة الرياضة بمصر" />
          <p className="font-display text-gold-400 font-bold mb-2">اذهبوا – تلمذوا – علموا</p>
          <p className="font-body text-xs md:text-sm text-teal-100/80 leading-7">اذهبوا وتلمذوا جميع الأمم، وعمدوهم باسم الآب والابن والروح القدس، وعلموهم أن يحفظوا جميع ما أوصيتكم به. وها أنا معكم كل الأيام إلى انقضاء الدهر. آمين. متى 19:28 - 20</p>
          <h1 className="font-display font-extrabold text-2xl md:text-4xl">خدمة الرياضة بمصر</h1>
          <p className="font-body mt-4 leading-8 text-teal-100/85">
            جيل من الشباب يعرف الرب وتلاميذ وخدام المسيح من خلال الرياضة
          </p>
        </section>

        <section className="bg-white rounded-xl2 border border-teal-900/5 shadow-sm p-6 md:p-8 space-y-6">
          <div>
            <h2 className="section-title">الرؤية</h2>
            <p className="font-body text-ink/75 leading-8">جيل من الشباب يعرف الرب وتلاميذ وخدام المسيح من خلال الرياضة</p>
          </div>
          <div>
            <h2 className="section-title">الرسالة</h2>
            <p className="font-body text-ink/75 leading-8">
              إعداد جيل من الشباب المؤمن والمؤثر في المجتمع من خلال الكرازة والتلمذة وتدريب القادة من خلال الرياضة ليكونوا قدوة وخداما مؤثرين وفعالين في حياة الآخرين
            </p>
          </div>
          <div>
            <h2 className="section-title">القيم المحورية</h2>
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
            <h2 className="section-title">الاستراتيجيات الرئيسية</h2>
            <p className="font-body text-ink/75">كرازة - تلمذة - تعليم وتدريب - صلاة</p>
          </div>
          <div>
            <h2 className="section-title">إقرار الإيمان</h2>
            <p className="font-body text-ink/75 leading-8">
              نحن خدمة (الرياضة بمصر) نؤمن بأن الكتاب المقدس هو كلمة الله المعصومة وهو المرجعية العليا لحياتنا وتعليمنا وخدمتنا. نؤمن بإله واحد في ثلاثة أقانيم (الآب والابن والروح القدس) وألوهية يسوع المسيح المولود من عذراء بلا خطية، صُلب عن خطايانا قام من الموت وصعد للسماء وسيأتي ثانيةً. نؤمن بسكنى الروح القدس في حياة المؤمن ووحدة وشركة المؤمنين في المسيح وقيامة الأموات والحياة الأبدية من خلال إيمان واحد. كما نؤمن بدور الكنيسة في التأثير الإيجابي في المجتمع ومسؤوليتنا في إدارة الموارد بأمانة. نؤمن بأن الله مالك كل شيء ونحن وكلاء مسؤولون أمامه عن استخدام الموارد بأمانة وحكمة لمجد الله.
            </p>
          </div>
        </section>
        <button onClick={enter} className="w-full bg-gold-500 hover:bg-gold-600 text-teal-950 font-body font-bold py-3.5 rounded-xl2">
          دخول إلى المنصة
        </button>
      </div>
    </div>
  );
}
