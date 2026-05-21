# رصيد · ذكاء الخزينة — نموذج الواجهة

نموذج تفاعلي لمنصة Embedded Treasury Intelligence موجّه للسوق الخليجي.

## التشغيل محلياً

```bash
npm install
npm run dev
```

ثم افتح الرابط الذي يظهر (عادةً http://localhost:5173).

## البناء للنشر

```bash
npm run build
```

ينتج مجلد `dist` جاهز للنشر.

---

## النشر على Netlify

### الطريقة الأولى — عبر GitHub (موصى بها)

1. ارفع المشروع على مستودع GitHub.
2. في Netlify اضغط **Add new site → Import an existing project**.
3. اربط المستودع.
4. الإعدادات تُقرأ تلقائياً من `netlify.toml`:
   - Build command: `npm run build`
   - Publish directory: `dist`
5. اضغط **Deploy**. أي تحديث على المستودع يُنشر تلقائياً.

### الطريقة الثانية — رفع يدوي (الأسرع)

1. شغّل `npm run build` محلياً.
2. اذهب إلى Netlify → **Sites** → اسحب مجلد `dist` إلى منطقة **"Drag and drop your site output folder here"**.
3. يُنشر خلال ثوانٍ.

---

## التقنيات

- React 18
- Vite (build tool)
- Recharts (الرسوم البيانية)
- Lucide React (الأيقونات)
- خط Tajawal العربي
- دعم RTL كامل

## ملاحظة

البيانات في النموذج ثابتة (mock data) لغرض العرض فقط. عند البناء الفعلي تُربط الواجهة بالـ backend.
