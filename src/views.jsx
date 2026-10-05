import { useEffect, useState } from 'react';
import * as api from './api';
import { Icon, P, CATS, CONDS, CITIES, STATUS, errMsg, compressImage } from './lib';

const Empty = ({ text }) => <div className="empty"><Icon d={P.box} /><span>{text}</span></div>;
const Err = ({ e }) => <div className="err">{errMsg(e)}</div>;
const Pill = ({ s }) => { const x = STATUS[s] || [s, '']; return <span className={'st ' + x[1]}>{x[0]}</span>; };
const Note = ({ msg }) => (msg ? <div className="note">{msg}</div> : null);

// يحمّل بيانات ويعرض حالة التحميل/الخطأ
function useLoad(fn, deps) {
  const [s, set] = useState({ loading: true });
  const reload = () => {
    set((p) => ({ ...p, loading: true }));
    fn().then((data) => set({ data }), (error) => set({ error }));
  };
  useEffect(reload, deps); // eslint-disable-line
  return [s, reload];
}

function ItemCard({ it, user, onRequest }) {
  const own = user && it.owner_id === user.id;
  return (
    <article className="item">
      {it.image_url && <img className="item-img" src={it.image_url} alt={it.name} loading="lazy" />}
      <div className="item-top"><span className="tag">{it.category}</span><span className="tag cond">{it.condition}</span></div>
      <h3>{it.name}</h3>
      <p className="item-desc">{it.description || 'بدون وصف'}</p>
      <div className="meta"><Icon d={P.pin} />{it.city}</div>
      {own ? <div className="own">هذا مستلزمك</div>
        : <button type="button" className="btn btn-primary btn-sm" onClick={() => onRequest(it)}>اطلب الإعارة</button>}
    </article>
  );
}
function ItemGrid({ state, user, onRequest }) {
  if (state.error) return <Err e={state.error} />;
  if (!state.data) return <div className="loading">جارٍ التحميل…</div>;
  if (!state.data.length) return <Empty text="لا توجد مستلزمات متاحة حاليًا" />;
  return <div className="grid">{state.data.map((it) => <ItemCard key={it.id} it={it} user={user} onRequest={onRequest} />)}</div>;
}

export function Home({ go, user, onRequest }) {
  const [st] = useLoad(() => api.stats().catch(() => ({ items: 0, loans: 0, users: 0 })), []);
  const [list] = useLoad(() => api.items({ limit: 6 }), []);
  const n = st.data || { items: 0, loans: 0, users: 0 };
  const steps = [
    [P.search, 'ابحث عن مستلزم', 'تصفح المستلزمات المتاحة في مدينتك واختر ما يناسب احتياجك'],
    [P.list, 'اطلب الإعارة', 'املأ نموذج طلب الإعارة وانتظر موافقة المالك'],
    [P.box, 'استلم المستلزم', 'تواصل مع المالك لاستلام المستلزم بالطريقة المناسبة']
  ];
  return (
    <main>
      <section className="hero"><div className="wrap">
        <span className="pill"><Icon d={P.heart} />منصة مجتمعية للإعارة</span>
        <h1>مستلزم تحتاجه اليوم،<em>قد يكون موجودًا لدى شخص آخر.</em></h1>
        <p className="lead">منصة مُعير تربط بين من يحتاج مستلزمًا طبيًا ومن يملكه، لنقلل التكلفة ونعزز التكافل في المجتمع.</p>
        <div className="actions">
          <button className="btn btn-primary" onClick={() => go('browse')}><Icon d={P.search} />أحتاج مستلزمًا</button>
          <button className="btn btn-ghost" onClick={() => go('add')}><Icon d={P.plus} />لدي مستلزم أريد إعارته</button>
        </div>
        <div className="stats">
          {[['blue', P.box, n.items, 'مستلزمات متاحة'], ['green', P.heart, n.loans, 'عمليات إعارة'], ['orange', P.user, n.users, 'مستفيدين']].map(([c, ic, v, l]) => (
            <div className="stat" key={l}>
              <div className={'stat-icon ' + c}><Icon d={ic} /></div>
              <div><div className="stat-num">{v}</div><div className="stat-label">{l}</div></div>
            </div>
          ))}
        </div>
      </div></section>
      <section className="block"><div className="wrap">
        <div className="sec-head">
          <div><h2>مستلزمات متاحة الآن</h2><p>تصفح المستلزمات المتاحة للإعارة في منطقتك</p></div>
          <button className="link-all" onClick={() => go('browse')}>عرض الكل</button>
        </div>
        <ItemGrid state={list} user={user} onRequest={onRequest} />
      </div></section>
      <section className="how"><div className="wrap">
        <h2>كيف تعمل المنصة؟</h2>
        <div className="steps">
          {steps.map(([ic, t, d], i) => (
            <article className="step" key={t}>
              <div className="step-num">{['١', '٢', '٣'][i]}</div><Icon d={ic} /><h3>{t}</h3><p>{d}</p>
            </article>
          ))}
        </div>
      </div></section>
    </main>
  );
}

export function Browse({ user, onRequest }) {
  const [f, setF] = useState({ q: '', category: '', city: '' });
  const [deb, setDeb] = useState(f);
  useEffect(() => { const t = setTimeout(() => setDeb(f), 250); return () => clearTimeout(t); }, [f]);
  const [list] = useLoad(() => api.items({ q: deb.q.trim(), category: deb.category, city: deb.city.trim() }), [deb]);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <main className="page"><div className="wrap">
      <div className="sec-head"><div><h1 className="page-title">المستلزمات المتاحة</h1><p>تصفح المستلزمات المتاحة للإعارة في منطقتك</p></div></div>
      <div className="filters">
        <div className="input"><Icon d={P.search} /><input type="search" placeholder="ابحث باسم المستلزم" aria-label="بحث" value={f.q} onChange={set('q')} /></div>
        <select className="ctl" aria-label="التصنيف" value={f.category} onChange={set('category')}>
          <option value="">كل التصنيفات</option>{CATS.map((c) => <option key={c}>{c}</option>)}
        </select>
        <input className="ctl" list="cities" placeholder="المدينة" aria-label="المدينة" value={f.city} onChange={set('city')} />
      </div>
      <ItemGrid state={list} user={user} onRequest={onRequest} />
    </div></main>
  );
}

export function AddItem({ done, toast }) {
  const [v, setV] = useState({ name: '', category: CATS[0], condition: CONDS[1], city: '', description: '' });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setV({ ...v, [k]: e.target.value });
  const pick = (e) => {
    const f = e.target.files[0];
    if (f && !f.type.startsWith('image/')) { setNote('اختر ملف صورة فقط.'); setFile(null); setPreview(''); return; }
    setNote(''); setFile(f || null); setPreview(f ? URL.createObjectURL(f) : '');
  };
  async function submit(e) {
    e.preventDefault();
    if (v.name.trim().length < 2) return setNote('اكتب اسم المستلزم.');
    if (!v.city.trim()) return setNote('اكتب اسم المدينة.');
    setBusy(true); setNote('');
    try {
      const image_url = file ? await compressImage(file) : null;
      await api.addItem({ ...v, name: v.name.trim(), city: v.city.trim(), description: v.description.trim(), image_url });
      toast('تمت إضافة المستلزم وأصبح متاحًا للجميع'); done();
    } catch (err) { setNote(errMsg(err)); setBusy(false); }
  }
  return (
    <main className="page"><div className="wrap">
      <h1 className="page-title" style={{ textAlign: 'center' }}>إضافة مستلزم</h1>
      <p className="sub" style={{ textAlign: 'center', color: 'var(--soft)', margin: '4px 0 0' }}>أضف مستلزمًا طبيًا تريد إعارته لمن يحتاجه</p>
      <form className="form-card" onSubmit={submit} noValidate>
        <div className="field"><label htmlFor="aName">اسم المستلزم</label>
          <input id="aName" className="ctl" maxLength={80} placeholder="مثال: كرسي متحرك" value={v.name} onChange={set('name')} /></div>
        <div className="field two">
          <div><label htmlFor="aCat">التصنيف</label>
            <select id="aCat" className="ctl" value={v.category} onChange={set('category')}>{CATS.map((c) => <option key={c}>{c}</option>)}</select></div>
          <div><label htmlFor="aCond">الحالة</label>
            <select id="aCond" className="ctl" value={v.condition} onChange={set('condition')}>{CONDS.map((c) => <option key={c}>{c}</option>)}</select></div>
        </div>
        <div className="field"><label htmlFor="aCity">المدينة</label>
          <input id="aCity" className="ctl" list="cities" placeholder="مثال: المدينة المنورة" value={v.city} onChange={set('city')} /></div>
        <div className="field"><label htmlFor="aImg">صورة المستلزم (اختياري)</label>
          <input id="aImg" className="ctl file" type="file" accept="image/*" onChange={pick} />
          {preview && <img className="preview" src={preview} alt="معاينة الصورة" />}</div>
        <div className="field"><label htmlFor="aDesc">وصف مختصر</label>
          <textarea id="aDesc" className="ctl" maxLength={400} placeholder="المقاس، مدة الاستخدام، أي ملاحظات مهمة" value={v.description} onChange={set('description')} /></div>
        <button type="submit" className="btn btn-primary" disabled={busy}><Icon d={P.plus} />إضافة المستلزم</button>
        <Note msg={note} />
      </form>
    </div></main>
  );
}

function OwnerReq({ r, reload, toast }) {
  const [contact, setContact] = useState('');
  const run = async (fn, ok) => {
    try { await fn(); toast(ok); reload(); } catch (e) { toast(errMsg(e)); }
  };
  const decide = (st) => {
    if (st === 'approved' && contact.trim().length < 3) return toast('اكتب رقمك أو طريقة الاستلام ليصل للمستفيد');
    run(() => api.decide(r, st, contact.trim()), st === 'approved' ? 'تم قبول الطلب' : 'تم رفض الطلب');
  };
  return (
    <div className="req">
      <div className="who">{r.requester_contact}</div>
      {r.message && <p>{r.message}</p>}
      <div><Pill s={r.status} /></div>
      {r.status === 'pending' && (
        <div className="decide">
          <input className="ctl" placeholder="رقمك أو طريقة الاستلام (مطلوب عند القبول)" value={contact} onChange={(e) => setContact(e.target.value)} />
          <div className="row">
            <button type="button" className="btn btn-primary btn-sm" onClick={() => decide('approved')}>قبول</button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => decide('rejected')}>رفض</button>
          </div>
        </div>
      )}
      {r.status === 'approved' && (
        <button type="button" className="btn-link" onClick={() => run(() => api.returned(r), 'تم تسجيل الاسترجاع، والمستلزم متاح من جديد')}>تم استرجاع المستلزم</button>
      )}
    </div>
  );
}

export function MyView({ tab, setTab, toast }) {
  const [s, reload] = useLoad(() => (tab === 'sent' ? api.myRequests() : api.myItems()), [tab]);
  const del = async (id) => {
    if (!window.confirm('حذف هذا المستلزم نهائيًا؟')) return;
    try { await api.deleteItem(id); toast('تم حذف المستلزم'); reload(); } catch (e) { toast(errMsg(e)); }
  };
  let body;
  if (s.error) body = <Err e={s.error} />;
  else if (!s.data) body = <div className="loading">جارٍ التحميل…</div>;
  else if (!s.data.length) body = <Empty text={tab === 'sent' ? 'لم ترسل أي طلب إعارة بعد' : 'لم تضف أي مستلزم بعد'} />;
  else if (tab === 'sent') body = (
    <div className="stack">{s.data.map((r) => (
      <article className="mine" key={r.id}>
        <div className="mine-head"><div><h3>{r.item_name || 'مستلزم محذوف'}</h3><div className="meta"><Icon d={P.pin} />{r.item_city}</div></div><Pill s={r.status} /></div>
        {r.message && <p className="item-desc">{r.message}</p>}
        {r.status === 'approved' && <div className="req"><span>تم قبول طلبك. تواصل مع المالك:</span><span className="who">{r.owner_contact}</span></div>}
      </article>
    ))}</div>
  );
  else body = (
    <div className="stack">{s.data.map((it) => (
      <article className="mine" key={it.id}>
        <div className="mine-head">
          <div><h3>{it.name}</h3><div className="meta">{it.category} · <Icon d={P.pin} />{it.city}</div></div>
          <span className={'st ' + (it.status === 'available' ? 'st-ok' : 'st-wait')}>{it.status === 'available' ? 'متاح' : 'معار حاليًا'}</span>
        </div>
        {[...it.requests].sort((a, b) => (a.created_at < b.created_at ? 1 : -1)).map((r) => <OwnerReq key={r.id} r={r} reload={reload} toast={toast} />)}
        <button type="button" className="btn-link danger" onClick={() => del(it.id)}>حذف المستلزم</button>
      </article>
    ))}</div>
  );
  return (
    <main className="page"><div className="wrap">
      <h1 className="page-title" style={{ textAlign: 'center' }}>طلباتي</h1>
      <div className="tabs top" role="tablist">
        <button className="tab" role="tab" aria-selected={tab === 'sent'} onClick={() => setTab('sent')}>طلباتي للإعارة</button>
        <button className="tab" role="tab" aria-selected={tab === 'mine'} onClick={() => setTab('mine')}>مستلزماتي</button>
      </div>
      {body}
    </div></main>
  );
}

export function Auth({ initial, onDone, go, toast }) {
  const [mode, setMode] = useState(initial);
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const signup = mode === 'signup';
  const swap = (m) => { setMode(m); setNote(''); };
  async function submit(e) {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setNote('أدخل بريدًا إلكترونيًا صحيحًا.');
    if (pw.length < 6) return setNote('كلمة المرور يجب أن تكون 6 أحرف على الأقل.');
    setBusy(true);
    try {
      await (signup ? api.signUp(email.trim(), pw) : api.signIn(email.trim(), pw));
      toast(signup ? 'تم إنشاء حسابك' : 'تم تسجيل الدخول'); onDone();
    } catch (err) { setNote(errMsg(err)); setBusy(false); }
  }
  return (
    <main className="auth"><div className="wrap">
      <div className="auth-brand"><span className="brand-mark"><Icon d={P.heart} /></span><span>مُعير</span></div>
      <h1>{signup ? 'إنشاء حساب جديد' : 'تسجيل الدخول'}</h1>
      <p className="sub">{signup ? 'أنشئ حسابًا لإضافة المستلزمات وإدارة طلباتك' : 'أدخل بياناتك للوصول إلى حسابك'}</p>
      <div className="card">
        <div className="tabs" role="tablist">
          <button className="tab" role="tab" aria-selected={signup} onClick={() => swap('signup')}>حساب جديد</button>
          <button className="tab" role="tab" aria-selected={!signup} onClick={() => swap('login')}>تسجيل الدخول</button>
        </div>
        <form onSubmit={submit} noValidate>
          <div className="field"><label htmlFor="email">البريد الإلكتروني</label>
            <div className="input"><Icon d={P.user} /><input id="email" type="email" placeholder="example@email.com" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div></div>
          <div className="field"><label htmlFor="password">كلمة المرور</label>
            <div className="input"><Icon d={P.user} /><input id="password" type="password" placeholder="6 أحرف على الأقل" autoComplete={signup ? 'new-password' : 'current-password'} value={pw} onChange={(e) => setPw(e.target.value)} /></div></div>
          <button type="submit" className="btn btn-primary" disabled={busy}>{signup ? 'إنشاء الحساب' : 'تسجيل الدخول'}</button>
          <Note msg={note} />
        </form>
        <p className="switch"><span>{signup ? 'لديك حساب بالفعل؟' : 'ليس لديك حساب؟'}</span>{' '}
          <button type="button" onClick={() => swap(signup ? 'login' : 'signup')}>{signup ? 'سجّل الدخول' : 'أنشئ حسابًا'}</button></p>
      </div>
      <button className="back" onClick={() => go('home')}>العودة للرئيسية</button>
    </div></main>
  );
}

export function RequestModal({ item, close, onSent }) {
  const [msg, setMsg] = useState('');
  const [contact, setContact] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const k = (e) => e.key === 'Escape' && close();
    document.addEventListener('keydown', k); return () => document.removeEventListener('keydown', k);
  }, [close]);
  async function submit(e) {
    e.preventDefault();
    if (contact.replace(/\D/g, '').length < 7) return setNote('اكتب رقم جوال صحيح ليتواصل معك المالك.');
    setBusy(true);
    try { await api.request({ item, message: msg.trim(), contact: contact.trim() }); onSent(); }
    catch (err) { setNote(errMsg(err)); setBusy(false); }
  }
  return (
    <div className="modal" onClick={(e) => e.target === e.currentTarget && close()}>
      <form className="modal-card" onSubmit={submit} noValidate>
        <h2>طلب إعارة</h2>
        <p className="sub">{item.name} · {item.city}</p>
        <div className="field"><label htmlFor="rMsg">رسالة للمالك</label>
          <textarea id="rMsg" className="ctl" maxLength={300} autoFocus placeholder="اذكر سبب حاجتك ومدة الاستخدام المتوقعة" value={msg} onChange={(e) => setMsg(e.target.value)} /></div>
        <div className="field"><label htmlFor="rContact">رقم جوالك للتواصل</label>
          <input id="rContact" className="ctl" type="tel" inputMode="tel" placeholder="05xxxxxxxx" style={{ direction: 'ltr' }} value={contact} onChange={(e) => setContact(e.target.value)} /></div>
        <Note msg={note} />
        <div className="modal-actions">
          <button type="submit" className="btn btn-primary btn-sm" disabled={busy}>إرسال الطلب</button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={close}>إلغاء</button>
        </div>
      </form>
    </div>
  );
}

export const Cities = () => <datalist id="cities">{CITIES.map((c) => <option key={c} value={c} />)}</datalist>;
