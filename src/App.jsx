import { useEffect, useRef, useState } from 'react';
import * as api from './api';
import { Icon, P } from './lib';
import { Home, Browse, AddItem, MyView, Auth, RequestModal, Cities } from './views';

export default function App() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(!api.configured);
  const [view, setView] = useState('home');
  const [myTab, setMyTab] = useState('sent');
  const [menu, setMenu] = useState(false);
  const [modalItem, setModalItem] = useState(null);
  const [toastMsg, setToastMsg] = useState('');
  const pending = useRef(null);
  const timer = useRef();

  const toast = (m) => { setToastMsg(m); clearTimeout(timer.current); timer.current = setTimeout(() => setToastMsg(''), 3200); };
  useEffect(() => api.configured ? api.onUser((u) => { setUser(u); setReady(true); }) : undefined, []);

  const go = (v) => {
    if ((v === 'add' || v === 'my') && !user) { pending.current = v; toast('سجّل الدخول أولًا للمتابعة'); v = 'login'; }
    setView(v); setMenu(false); window.scrollTo(0, 0);
  };
  const afterAuth = () => { const t = pending.current || 'home'; pending.current = null; setView(t); window.scrollTo(0, 0); };
  const requestItem = (it) => {
    if (!user) { pending.current = 'browse'; toast('سجّل الدخول أولًا لطلب الإعارة'); return go('login'); }
    setModalItem(it);
  };
  const logout = async () => { await api.signOut(); toast('تم تسجيل الخروج'); setView('home'); setMenu(false); };

  const link = (v, label, p) => (
    <a href="#" key={v} className={view === v ? 'active' : ''} onClick={(e) => { e.preventDefault(); go(v); }}><Icon d={p} />{label}</a>
  );

  if (!api.configured) return (
    <div className="app"><div className="demo-bar">لم يتم ضبط Firebase. انسخ ‎.env.example‎ إلى ‎.env‎ وضع قيم firebaseConfig ثم أعد تشغيل المشروع.</div></div>
  );
  if (!ready) return <div className="app"><div className="loading">جارٍ التحميل…</div></div>;

  return (
    <div className="app" dir="rtl" lang="ar">
      <header className="header">
        <div className="wrap"><div className="header-row">
          <button className="brand" onClick={() => go('home')} aria-label="مُعير، الصفحة الرئيسية">
            <span className="brand-mark"><Icon d={P.heart} /></span>
            <span className="brand-text"><span className="brand-name">مُعير</span><span className="brand-sub">منصة الإعارة المجتمعية</span></span>
          </button>
          <button className="menu-btn" aria-expanded={menu} aria-controls="nav" aria-label="القائمة" onClick={() => setMenu(!menu)}>
            <Icon d={menu ? P.close : P.bars} />
          </button>
        </div></div>
        <nav className={'nav' + (menu ? ' open' : '')} id="nav" aria-label="القائمة الرئيسية">
          <div className="wrap"><div className="nav-inner">
            {link('home', 'الرئيسية', P.home)}
            {link('browse', 'المستلزمات المتاحة', P.search)}
            {user && link('add', 'إضافة مستلزم', P.plus)}
            {user && link('my', 'طلباتي', P.list)}
            <hr />
            {user
              ? <button type="button" onClick={logout}><Icon d={P.out} />تسجيل الخروج</button>
              : <button type="button" className="cta" onClick={() => go('login')}><Icon d={P.user} />تسجيل الدخول</button>}
          </div></div>
        </nav>
      </header>

      {view === 'home' && <Home go={go} user={user} onRequest={requestItem} />}
      {view === 'browse' && <Browse user={user} onRequest={requestItem} />}
      {view === 'add' && <AddItem toast={toast} done={() => { setMyTab('mine'); setView('my'); window.scrollTo(0, 0); }} />}
      {view === 'my' && <MyView tab={myTab} setTab={setMyTab} toast={toast} />}
      {(view === 'login' || view === 'signup') && <Auth key={view} initial={view} go={go} toast={toast} onDone={afterAuth} />}

      <footer className="footer"><div className="wrap">
        <div className="footer-grid">
          <div>
            <div className="brand" style={{ cursor: 'default' }}><span className="brand-mark"><Icon d={P.heart} /></span><span className="brand-name">مُعير</span></div>
            <p>منصة مجتمعية تربط بين من يحتاج مستلزمًا طبيًا ومن يملكه، لتعزيز التعاون والتكافل بين أفراد المجتمع.</p>
          </div>
          <div><h4>روابط سريعة</h4><ul>
            <li><button onClick={() => go('home')}>الرئيسية</button></li>
            <li><button onClick={() => go('browse')}>المستلزمات المتاحة</button></li>
            <li><button onClick={() => go('add')}>إضافة مستلزم</button></li>
            <li><button onClick={() => go('my')}>طلباتي</button></li>
          </ul></div>
          <div><h4>عن المنصة</h4><p style={{ marginTop: 0 }}>نسعى لتقليل التكلفة على الأفراد عبر إعادة استخدام المستلزمات الطبية وإعارتها بدل شرائها، مع الحفاظ على جودة وسلامة الأجهزة.</p></div>
        </div>
        <div className="footer-bottom">© 2026 مُعير – جميع الحقوق محفوظة</div>
      </div></footer>

      {modalItem && <RequestModal item={modalItem} close={() => setModalItem(null)}
        onSent={() => { setModalItem(null); toast('تم إرسال طلبك للمالك'); setMyTab('sent'); setView('my'); window.scrollTo(0, 0); }} />}
      <Cities />
      {toastMsg && <div className="toast" role="status">{toastMsg}</div>}
    </div>
  );
}
