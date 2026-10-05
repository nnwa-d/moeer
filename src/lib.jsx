export const CATS = ['كرسي متحرك', 'سرير طبي', 'جهاز قياس ضغط', 'جهاز قياس سكر', 'عكازات ومشايات', 'جهاز أكسجين', 'جهاز بخار (نيبولايزر)', 'أخرى'];
export const CONDS = ['ممتاز', 'جيد', 'مقبول'];
export const CITIES = ['المدينة المنورة', 'مكة المكرمة', 'الرياض', 'جدة', 'الدمام', 'الخبر', 'الطائف', 'تبوك', 'بريدة', 'أبها', 'حائل', 'ينبع', 'جازان', 'نجران'];
export const STATUS = {
  pending: ['قيد الانتظار', 'st-wait'], approved: ['تمت الموافقة', 'st-ok'],
  rejected: ['مرفوض', 'st-no'], returned: ['تمت الإعادة', 'st-done']
};

export const P = {
  home: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  search: 'M21 21l-4.3-4.3M11 3.5a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15z',
  plus: 'M12 5v14M5 12h14',
  list: 'M8 2h8v4H8zM16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2M9 12h6M9 16h6',
  user: 'M12 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM4 21a8 8 0 0 1 16 0',
  out: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
  pin: 'M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0zM12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  box: 'M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16zM3.3 7l8.7 5 8.7-5M12 22V12',
  heart: 'M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7z',
  bars: 'M4 6h16M4 12h16M4 18h16',
  close: 'M18 6 6 18M6 6l12 12'
};
export const Icon = ({ d }) => <svg className="ic" viewBox="0 0 24 24"><path d={d} /></svg>;

const MAP = [
  ['auth/email-already-in-use', 'هذا البريد مسجّل مسبقًا، سجّل الدخول.'],
  ['auth/invalid-credential', 'البريد أو كلمة المرور غير صحيحة.'],
  ['auth/wrong-password', 'البريد أو كلمة المرور غير صحيحة.'],
  ['auth/user-not-found', 'لا يوجد حساب بهذا البريد.'],
  ['auth/weak-password', 'كلمة المرور يجب أن تكون 6 أحرف على الأقل.'],
  ['auth/invalid-email', 'أدخل بريدًا إلكترونيًا صحيحًا.'],
  ['auth/too-many-requests', 'محاولات كثيرة، انتظر قليلًا ثم حاول مرة أخرى.'],
  ['auth/operation-not-allowed', 'فعّل تسجيل البريد وكلمة المرور من Authentication في Firebase.'],
  ['permission-denied', 'لا يمكنك تنفيذ هذا الإجراء. تأكد من نشر قواعد Firestore.'],
  ['duplicate', 'لديك طلب قيد الانتظار على هذا المستلزم.'],
  ['image', 'تعذّر معالجة الصورة، جرّب صورة أصغر.'],
  ['network', 'تعذّر الاتصال، تحقق من الإنترنت.']
];
export function errMsg(e) {
  const m = (e?.code ? e.code + ' ' : '') + (e?.message || '');
  const hit = MAP.find(([k]) => m.includes(k));
  return hit ? hit[1] : 'حدث خطأ غير متوقع، حاول مرة أخرى.';
}

// تصغير الصورة وتحويلها إلى data URL (تُحفظ داخل مستند Firestore)
export function compressImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file), img = new Image();
    img.onload = () => {
      const s = Math.min(1, 560 / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
      const x = c.getContext('2d');
      x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      const out = c.toDataURL('image/jpeg', 0.65);
      out.length > 700000 ? reject(new Error('image')) : resolve(out);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('image')); };
    img.src = url;
  });
}
