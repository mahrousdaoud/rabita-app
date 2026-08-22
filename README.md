# الرابطة الإنجيلية لفريق الخدمة بالرياضة

أبليكيشن ويب لإدارة تسجيل الطلاب، مواعيد اللقاءات، الحضور والغياب، وحساب العشور.

## اللي متعمل فعليًا

- تسجيل دخول حقيقي بجوجل (Google Sign-In)
- استمارة تسجيل أول دخول: الاسم، الموبايل، المنطقة، الفريق، السن، ومدرسة جديدة/قديمة
- لوحة الطالب: اللقاءات الجاية، عدد مرات الحضور والغياب، حساب العشور (كام شهر اتدفع وكام باقي)
- لوحة الأدمن (صلاحيتها متحددة من الكود نفسه في `src/lib/firebase.js`):
  - عرض كل الطلاب وبياناتهم
  - إضافة/حذف اللقاءات
  - تسجيل الحضور والغياب لكل لقاء
  - تسجيل الشهور المدفوعة لكل طالب
- الشعار/الأيقونة الخاصة بالرابطة (`public/rabita-icon.svg`)

---

## خطوات التشغيل (اتبعها بالترتيب)

### 1) اعمل مشروع Firebase مجاني

1. روح على https://console.firebase.google.com
2. اضغط **Add project** واكتب اسم زي `rabita-app`
3. تقدر تسيب Google Analytics مقفول (مش لازم)

### 2) فعّل تسجيل الدخول بجوجل

1. من القائمة الجانبية: **Build > Authentication**
2. اضغط **Get started**
3. من تبويب **Sign-in method** فعّل **Google**
4. اختار إيميل دعم واحفظ

### 3) اعمل قاعدة البيانات Firestore

1. من القائمة الجانبية: **Build > Firestore Database**
2. اضغط **Create database**
3. اختار **Start in production mode**
4. اختار أقرب منطقة (Region) — أي منطقة في أوروبا كويسة لمصر

### 4) اضبط قواعد الأمان (مهم جدًا)

1. من نفس صفحة Firestore، روح تبويب **Rules**
2. امسح اللي موجود واستبدله بمحتوى ملف `firestore.rules` الموجود في المشروع ده
3. اضغط **Publish**

هذا يضمن إن الأدمن بس هو اللي يقدر يضيف لقاءات أو يسجل حضور أو يعدل العشور.

### 5) اربط الأبليكيشن بمشروعك

1. من **Project Settings** (أيقونة الترس بجوار Project Overview) روح لتبويب **General**
2. انزل لحد **Your apps** واضغط أيقونة الويب `</>`
3. سمّي الأبليكيشن (مثلاً `rabita-web`) واضغط **Register app**
4. هيديك object فيه apiKey, authDomain, projectId... الخ
5. افتح ملف `src/lib/firebase.js` في المشروع وحط القيم دي مكان الـ placeholders

### 6) حدد إيميلات الأدمن

في نفس ملف `src/lib/firebase.js`، غيّر السطر:

```js
export const ADMIN_EMAILS = [
  "your-admin-email@gmail.com",
];
```

وحط إيميل الجيميل اللي عايز يبقى أدمن (تقدر تضيف أكتر من واحد). أي حد يسجل بالإيميل ده هيبقى معاه زرار "لوحة الأدمن" أوتوماتيك.

> ملحوظة: لازم الإيميل يكون بحروف صغيرة (lowercase) في القائمة عشان المطابقة تظبط.

### 7) شغّل المشروع على جهازك للتجربة

محتاج يكون عندك Node.js متثبت (nodejs.org)، بعدين من داخل فولدر المشروع:

```bash
npm install
npm run dev
```

هيديك رابط زي http://localhost:5173 افتحه في المتصفح وجرب.

### 8) انشر الأبليكيشن على رابط حقيقي (Firebase Hosting)

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
```

وقت الأسئلة اختار:
- Use an existing project → اختار المشروع اللي عملته
- Public directory → اكتب dist
- Configure as single-page app → Yes
- ماتكتبش overwrite لملف index.html لو سأل

بعدين:

```bash
npm run build
firebase deploy --only hosting
```

هيديك رابط زي https://rabita-app.web.app — ده الرابط اللي تبعته للطلاب.

---

## هيكل قاعدة البيانات (Firestore)

- **students/{uid}** → بيانات الطالب (name, email, phone, region, team, age, memberType, isAdmin, paidMonths[], createdAt)
- **meetings/{id}** → title, date, notes
- **attendanceRecords/{meetingId_studentId}** → meetingId, studentId, present

## لو عايز تضيف حاجات كمان

- تنبيهات واتساب/إيميل قبل اللقاء
- تصدير تقرير Excel للحضور والعشور
- ربط أكتر من فريق/خدمة في نفس الأبليكيشن

قولّي وهساعدك تضيفها.
