import React, { useState, useEffect, useMemo, useCallback, createContext, useContext } from 'react';
import UploadViewConnected from './UploadView.jsx';
import { Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendingUp, TrendingDown, AlertTriangle, Bell, Upload, LayoutDashboard, Wallet, Send, Sparkles, ArrowUpRight, ArrowDownRight, Inbox, Trash2, Tag, RefreshCw, Loader2 } from 'lucide-react';
import { api, CATEGORIES } from './api.js';

const fmt = (n) => new Intl.NumberFormat('en-US').format(Math.abs(Math.round(n || 0)));

// ============ État partagé (Context) ============
const DataContext = createContext(null);
const useData = () => useContext(DataContext);

// Couleurs par catégorie (stable)
const CATEGORY_COLORS = {
  'رواتب': '#0EA47A',
  'موردون': '#2563EB',
  'إيجارات ومرافق': '#7C3AED',
  'ضريبة ق.م وزكاة': '#D97706',
  'تحصيل عملاء': '#0891B2',
  'رسوم بنكية': '#94A3B8',
  'تشغيل أخرى': '#64748B',
  'غير مصنّف': '#CBD5E1',
};

// Palettes de couleurs distinctives pour chaque compte bancaire
const ACCOUNT_PALETTES = [
  { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' }, // bleu
  { bg: '#F0FDF9', color: '#0EA47A', border: '#A7F3D0' }, // vert
  { bg: '#FDF4FF', color: '#7C3AED', border: '#E9D5FF' }, // violet
  { bg: '#FFFBEB', color: '#D97706', border: '#FDE68A' }, // orange
  { bg: '#FFF1F2', color: '#E11D48', border: '#FECDD3' }, // rose
];
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 820 : false);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 820);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return isMobile;
}

export default function App() {
  const [summary, setSummary] = useState(null);    // agrégats depuis /api/summary
  const [transactions, setTransactions] = useState([]); // liste depuis /api/transactions
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // charge tout depuis la base
  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, txs] = await Promise.all([api.getSummary(), api.getTransactions()]);
      setSummary(s.empty ? null : s);
      setTransactions(txs || []);
    } catch (e) {
      setError(e.message || 'Erreur de connexion au serveur');
      setSummary(null);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // derived = summary enrichi des couleurs de catégories
  const derived = useMemo(() => {
    if (!summary) return null;
    return {
      currentBalance: summary.current_balance,
      inflow: summary.inflow,
      outflow: summary.outflow,
      net: summary.net,
      count: summary.count,
      needsReview: summary.needs_review,
      categories: (summary.categories || []).map((c) => ({ ...c, color: CATEGORY_COLORS[c.name] || '#64748B' })),
      recent: summary.recent || [],
      series: summary.series || [],
      accounts: summary.accounts || [],
    };
  }, [summary]);

  return (
    <DataContext.Provider value={{ derived, transactions, loading, error, refresh }}>
      <Shell />
    </DataContext.Provider>
  );
}

function Shell() {
  const [view, setView] = useState('dashboard');
  const isMobile = useIsMobile();

  const navItems = [
    { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
    { id: 'forecast', label: 'التوقعات', icon: TrendingUp },
    { id: 'transactions', label: 'المعاملات', icon: Tag },
    { id: 'alerts', label: 'التنبيهات', icon: Bell },
    { id: 'chat', label: 'المساعد', icon: Sparkles },
    { id: 'upload', label: 'رفع كشف', icon: Upload },
  ];

  return (
    <div dir="rtl" style={{ ...styles.root, flexDirection: isMobile ? 'column' : 'row' }}>
      <style>{css}</style>

      {isMobile ? (
        <header style={styles.mobileBar}>
          <div style={styles.mobileLogo}>
            <div style={styles.logoMark}>ر</div>
            <div>
              <div style={styles.logoName}>رصيد</div>
              <div style={styles.logoTag}>ذكاء الخزينة</div>
            </div>
          </div>
        </header>
      ) : (
        <aside style={styles.sidebar}>
          <div style={styles.logo}>
            <div style={styles.logoMark}>ر</div>
            <div>
              <div style={styles.logoName}>رصيد</div>
              <div style={styles.logoTag}>ذكاء الخزينة</div>
            </div>
          </div>
          <nav style={styles.nav}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = view === item.id;
              return (
                <button key={item.id} onClick={() => setView(item.id)}
                  style={{ ...styles.navItem, ...(active ? styles.navItemActive : {}) }}>
                  <Icon size={19} strokeWidth={2} />
                  <span style={{ flex: 1, textAlign: 'right' }}>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>
      )}

      <main style={{ ...styles.main, ...(isMobile ? styles.mainMobile : {}) }}>
        {view === 'dashboard' && <Dashboard setView={setView} isMobile={isMobile} />}
        {view === 'forecast' && <Forecast isMobile={isMobile} setView={setView} />}
        {view === 'transactions' && <Transactions setView={setView} />}
        {view === 'alerts' && <Alerts setView={setView} />}
        {view === 'chat' && <Chat isMobile={isMobile} />}
        {view === 'upload' && <UploadConnector setView={setView} />}
      </main>

      {isMobile && (
        <nav style={styles.bottomNav}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = view === item.id;
            return (
              <button key={item.id} onClick={() => setView(item.id)}
                style={{ ...styles.bottomNavItem, color: active ? '#0EA47A' : '#94A3B8' }}>
                <Icon size={22} strokeWidth={2} />
                <span style={styles.bottomNavLabel}>{item.label}</span>
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
}

// Connecte l'upload au Context : recharge les données depuis la base après import
function UploadConnector({ setView }) {
  const { refresh } = useData();
  return <UploadViewConnected onSuccess={async () => { await refresh(); setView('dashboard'); }} />;
}

// ============ État vide réutilisable ============
function EmptyState({ setView, title, sub }) {
  return (
    <div style={styles.empty}>
      <div style={styles.emptyIcon}><Inbox size={40} /></div>
      <div style={styles.emptyTitle}>{title}</div>
      <div style={styles.emptySub}>{sub}</div>
      {setView && (
        <button onClick={() => setView('upload')} style={styles.emptyBtn}>
          <Upload size={17} /> رفع كشف حساب
        </button>
      )}
    </div>
  );
}

// ============ Dashboard ============
function Dashboard({ setView, isMobile }) {
  const { derived, loading, error, refresh } = useData();
  const statGrid = { ...styles.statRow, gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)' };
  const grid2 = { ...styles.grid2, gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' };

  if (loading) {
    return (
      <div className="fade-in">
        <Header title="لوحة التحكم" subtitle="جارٍ تحميل بياناتك…" />
        <div style={styles.loadingBox}>
          <Loader2 size={36} className="spinner" style={{ color: '#0EA47A' }} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fade-in">
        <Header title="لوحة التحكم" subtitle="تعذّر الاتصال بالخادم" />
        <div style={styles.errorState}>
          <AlertTriangle size={36} style={{ color: '#EF4444' }} />
          <div style={styles.errorStateText}>{error}</div>
          <div style={styles.errorStateHint}>تأكد من تشغيل الخادم على المنفذ 8000، ثم أعد المحاولة.</div>
          <button onClick={refresh} style={styles.emptyBtn}><RefreshCw size={16} /> إعادة المحاولة</button>
        </div>
      </div>
    );
  }

  if (!derived) {
    return (
      <div className="fade-in">
        <Header title="لوحة التحكم" subtitle="نظرة شاملة على وضعك المالي" />
        <EmptyState setView={setView}
          title="لا توجد بيانات بعد"
          sub="ابدأ برفع كشف حساب بنكي وسيقوم النظام بتحليله وتصنيف معاملاتك تلقائياً." />
      </div>
    );
  }

  return (
    <div className="fade-in">
      <Header title="لوحة التحكم" subtitle="محسوبة من كشفك المرفوع" />

      <div style={statGrid}>
        <StatCard label="الرصيد الحالي" value={fmt(derived.currentBalance)} unit="ريال" icon={Wallet} primary />
        <StatCard label="إجمالي الداخل" value={fmt(derived.inflow)} unit="ريال" icon={ArrowUpRight} up />
        <StatCard label="إجمالي الخارج" value={fmt(derived.outflow)} unit="ريال" icon={ArrowDownRight} up={false} warn />
        <StatCard label="صافي التدفق" value={`${derived.net < 0 ? '−' : ''}${fmt(derived.net)}`} unit="ريال"
          icon={derived.net < 0 ? TrendingDown : TrendingUp} up={derived.net >= 0} warn={derived.net < 0} />
      </div>

      {derived.accounts && derived.accounts.length > 0 && (
        <div style={styles.card}>
          <div style={styles.cardHead}>
            <div style={styles.cardTitle}>الحسابات المتصلة</div>
            <div style={styles.cardSub}>{derived.accounts.length} حساب</div>
          </div>
          <div style={styles.accountsGrid}>
            {derived.accounts.map((a, i) => {
              const palette = ACCOUNT_PALETTES[i % ACCOUNT_PALETTES.length];
              return (
                <div key={i} style={{ ...styles.accountCard, borderColor: palette.border }}>
                  <div style={styles.accountBankRow}>
                    <div style={{ ...styles.bankDot, background: palette.bg, color: palette.color }}>
                      {(a.bank_name || '?').charAt(0)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ ...styles.accountBank, color: palette.color }}>{a.bank_name || 'بنك غير معروف'}</div>
                      <div style={styles.accountNum}>{a.account_number || '—'}</div>
                    </div>
                    {a.currency && <span style={{ ...styles.currencyTag, background: palette.bg, color: palette.color }}>{a.currency}</span>}
                  </div>
                  {a.customer_name && <div style={styles.accountCustomer}>{a.customer_name}</div>}
                  {a.period && <div style={styles.accountPeriod}>الفترة: {a.period}</div>}
                  <button
                    onClick={async () => {
                      if (window.confirm(`حذف حساب ${a.bank_name} وجميع معاملاته؟`)) {
                        await api.deleteUpload(a.upload_id);
                        await refresh();
                      }
                    }}
                    style={styles.accountDeleteBtn}
                  >
                    <Trash2 size={13} /> حذف الحساب
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={grid2}>
        <div style={styles.card}>
          <div style={styles.cardHead}>
            <div style={styles.cardTitle}>المصروفات حسب الفئة</div>
            <div style={styles.cardSub}>{derived.count} معاملة محلَّلة</div>
          </div>
          {derived.categories.length === 0 ? (
            <div style={styles.miniEmpty}>لا توجد مصروفات في هذا الكشف</div>
          ) : (
            <div style={styles.catList}>
              {derived.categories.map((c) => (
                <div key={c.name} style={styles.catRow}>
                  <div style={styles.catLabel}>
                    <span style={{ ...styles.catDot, background: c.color }} />
                    {c.name}
                  </div>
                  <div style={styles.catBarWrap}>
                    <div style={{ ...styles.catBar, width: `${Math.max(c.pct * 2.2, 4)}%`, background: c.color }} />
                  </div>
                  <div style={styles.catAmount}>{fmt(c.amount)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={styles.card}>
          <div style={styles.cardHead}>
            <div style={styles.cardTitle}>أحدث المعاملات</div>
            <div style={styles.cardSub}>مصنّفة تلقائياً</div>
          </div>
          <div style={styles.txList}>
            {derived.recent.map((t, i) => (
              <div key={i} style={styles.txRow}>
                <div style={styles.txLeft}>
                  <div style={{ ...styles.txIcon, background: t.amount >= 0 ? '#0EA47A18' : '#EF444418', color: t.amount >= 0 ? '#0EA47A' : '#EF4444' }}>
                    {t.amount >= 0 ? <ArrowDownRight size={16} /> : <ArrowUpRight size={16} />}
                  </div>
                  <div>
                    <div style={styles.txDesc}>{t.description || '—'}</div>
                    <div style={styles.txCat}>
                      {t.category}
                      {t.needs_review && <span style={styles.lowConf}>بحاجة تأكيد</span>}
                    </div>
                  </div>
                </div>
                <div style={{ ...styles.txAmount, color: t.amount >= 0 ? '#0EA47A' : '#0F172A' }}>
                  {t.amount >= 0 ? '+' : '−'}{fmt(t.amount)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ Forecast ============
function Forecast({ isMobile, setView }) {
  const { derived } = useData();

  // série temporelle des soldes (vient déjà du backend)
  const series = useMemo(() => {
    if (!derived || !derived.series) return [];
    return derived.series
      .filter((s) => s.balance != null)
      .sort((a, b) => (a.date < b.date ? -1 : 1))
      .map((s) => ({ date: s.date.slice(5), balance: s.balance }));
  }, [derived]);

  if (!derived) {
    return (
      <div className="fade-in">
        <Header title="توقع التدفق النقدي" subtitle="يحتاج بيانات لتوليد التوقعات" />
        <EmptyState setView={setView}
          title="لا يمكن توليد توقعات بعد"
          sub="التوقعات تُبنى على تاريخ معاملاتك. ارفع كشف حساب أولاً لرؤية التوقعات." />
      </div>
    );
  }

  const statGrid = { ...styles.statRow, gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)' };
  const balances = series.map((s) => s.balance);
  const minBal = balances.length ? Math.min(...balances) : 0;
  const maxBal = balances.length ? Math.max(...balances) : 0;

  return (
    <div className="fade-in">
      <Header title="رصيد الحساب عبر الزمن" subtitle="مبني على الأرصدة الفعلية في كشفك" />
      <div style={styles.card}>
        <div style={styles.cardHead}>
          <div>
            <div style={styles.cardTitle}>تطوّر الرصيد</div>
            <div style={styles.cardSub}>{series.length} نقطة زمنية من الكشف</div>
          </div>
        </div>
        {series.length < 2 ? (
          <div style={styles.miniEmpty}>لا توجد بيانات رصيد كافية في هذا الكشف لرسم منحنى.</div>
        ) : (
          <ResponsiveContainer width="100%" height={isMobile ? 240 : 340}>
            <AreaChart data={series} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="balGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0EA47A" stopOpacity={0.18} />
                  <stop offset="100%" stopColor="#0EA47A" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8EDF2" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#64748B', fontFamily: 'Tajawal' }} axisLine={false} tickLine={false} reversed />
              <YAxis tick={{ fontSize: 11, fill: '#94A3B8', fontFamily: 'Tajawal' }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}ك`} orientation="right" width={48} />
              <Tooltip content={<ChartTip />} />
              <Area type="monotone" dataKey="balance" stroke="#0EA47A" strokeWidth={3} fill="url(#balGrad)" dot={{ r: 3, fill: '#0EA47A' }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
      <div style={statGrid}>
        <StatCard label="أدنى رصيد" value={fmt(minBal)} unit="ريال" icon={TrendingDown} up={false} />
        <StatCard label="أعلى رصيد" value={fmt(maxBal)} unit="ريال" icon={TrendingUp} up />
        <StatCard label="الرصيد الحالي" value={fmt(derived.currentBalance)} unit="ريال" icon={Wallet} />
      </div>
      <div style={styles.card}>
        <div style={styles.cardTitle}>ملاحظة حول التوقعات المستقبلية</div>
        <p style={styles.explainText}>
          هذا الرسم يعرض الأرصدة الفعلية من كشفك. توقع المستقبل (8 أسابيع قادمة) يتطلب نموذج
          السلاسل الزمنية في الخادم — وهو الخطوة التقنية التالية التي ستُبنى على تاريخ معاملاتك المتراكم.
        </p>
      </div>
    </div>
  );
}

function ChartTip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  const v = payload[0];
  if (!v || v.value == null) return null;
  return (
    <div style={styles.tooltip}>
      <div style={styles.tooltipLabel}>{label}</div>
      <div style={styles.tooltipVal}>{fmt(v.value)} ريال</div>
    </div>
  );
}

// ============ Alerts (générées à partir des vraies données) ============
function Alerts({ setView }) {
  const { derived, transactions } = useData();

  if (!derived) {
    return (
      <div className="fade-in">
        <Header title="التنبيهات" subtitle="تُولّد من تحليل معاملاتك" />
        <EmptyState setView={setView}
          title="لا توجد تنبيهات"
          sub="بعد رفع كشف حساب، سينبّهك النظام إلى المعاملات غير المصنّفة، صافي التدفق السالب، وغيرها." />
      </div>
    );
  }

  // Générer des alertes RÉELLES à partir des données
  const generated = [];
  const needsReview = transactions.filter((t) => t.needs_review);
  if (needsReview.length > 0) {
    generated.push({
      severity: 'medium',
      icon: AlertTriangle,
      title: `${needsReview.length} معاملة بحاجة لتأكيد التصنيف`,
      body: `صنّف النظام هذه المعاملات بثقة منخفضة. راجعها لتحسين دقة التحليل. أمثلة: ${needsReview.slice(0, 2).map((t) => t.description).join('، ')}.`,
    });
  }
  if (derived.net < 0) {
    generated.push({
      severity: 'high',
      icon: TrendingDown,
      title: 'صافي تدفق سالب في هذه الفترة',
      body: `إجمالي مصروفاتك (${fmt(derived.outflow)} ريال) تجاوز إيراداتك (${fmt(derived.inflow)} ريال) بمقدار ${fmt(Math.abs(derived.net))} ريال خلال الفترة المرفوعة.`,
    });
  }
  const topCat = derived.categories[0];
  if (topCat && topCat.pct >= 35) {
    generated.push({
      severity: 'low',
      icon: Wallet,
      title: `تركّز المصروفات في «${topCat.name}»`,
      body: `تمثل فئة «${topCat.name}» نحو ${topCat.pct}% من إجمالي مصروفاتك (${fmt(topCat.amount)} ريال). راقب هذا البند عن كثب.`,
    });
  }

  if (generated.length === 0) {
    return (
      <div className="fade-in">
        <Header title="التنبيهات" subtitle="تُولّد من تحليل معاملاتك" />
        <EmptyState
          title="كل شيء يبدو سليماً"
          sub="لا توجد تنبيهات في الكشف الحالي: التدفق موجب، وكل المعاملات مصنّفة بثقة." />
      </div>
    );
  }

  const colors = {
    high: { bg: '#FEF2F2', bd: '#FECACA', ic: '#EF4444' },
    medium: { bg: '#FFFBEB', bd: '#FDE68A', ic: '#D97706' },
    low: { bg: '#F0FDF9', bd: '#A7F3D0', ic: '#0EA47A' },
  };

  return (
    <div className="fade-in">
      <Header title="التنبيهات" subtitle="مولّدة آلياً من كشفك المرفوع" />
      <div style={styles.alertList}>
        {generated.map((a, i) => {
          const Icon = a.icon;
          const c = colors[a.severity];
          return (
            <div key={i} style={{ ...styles.alertCard, background: c.bg, borderColor: c.bd }}>
              <div style={{ ...styles.alertIcon, background: '#fff', color: c.ic }}>
                <Icon size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={styles.alertTitle}>{a.title}</div>
                <p style={styles.alertBody}>{a.body}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============ Chat (répond à partir des vraies données) ============
function Chat({ isMobile }) {
  const { derived } = useData();
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'مرحباً 👋 أنا مساعدك المالي. ارفع كشف حساب ثم اسألني عن أرصدتك ومصروفاتك.' },
  ]);
  const [input, setInput] = useState('');

  const answer = (text) => {
    const t = text.toLowerCase();
    if (!derived) return 'لم أتلقَّ أي بيانات بعد. رجاءً ارفع كشف حساب أولاً من شاشة «رفع كشف».';
    if (t.includes('رصيد') || t.includes('سيولة')) {
      return `رصيدك الحالي ${fmt(derived.currentBalance)} ريال. إجمالي الداخل ${fmt(derived.inflow)} والخارج ${fmt(derived.outflow)}، أي صافي ${derived.net < 0 ? 'سالب ' : ''}${fmt(derived.net)} ريال.`;
    }
    if (t.includes('مصروف') || t.includes('فئة') || t.includes('صرف')) {
      const top = derived.categories.slice(0, 3).map((c) => `${c.name} (${fmt(c.amount)})`).join('، ');
      return `أكبر بنود مصروفاتك: ${top || 'لا توجد مصروفات'}.`;
    }
    if (t.includes('معامل') || t.includes('كم')) {
      return `يحتوي كشفك على ${derived.count} معاملة، منها ${derived.needsReview} بحاجة لتأكيد التصنيف.`;
    }
    return 'يمكنني الإجابة عن أسئلة حول رصيدك، مصروفاتك حسب الفئة، أو عدد معاملاتك بناءً على الكشف المرفوع.';
  };

  const send = (text) => {
    if (!text.trim()) return;
    setMessages((m) => [...m, { role: 'user', text }, { role: 'assistant', text: answer(text) }]);
    setInput('');
  };

  const suggestions = ['كم رصيدي الحالي؟', 'ما أكبر مصروفاتي؟', 'كم عدد معاملاتي؟'];
  const wrap = { ...styles.chatWrap, height: isMobile ? 'calc(100vh - 200px)' : 'calc(100vh - 64px)' };

  return (
    <div className="fade-in" style={wrap}>
      <Header title="المساعد المالي" subtitle="إجابات مبنية على كشفك المرفوع" />
      <div style={styles.chatBox}>
        <div style={styles.chatMessages}>
          {messages.map((m, i) => (
            <div key={i} style={{ ...styles.msgRow, justifyContent: m.role === 'user' ? 'flex-start' : 'flex-end' }}>
              {m.role === 'assistant' && <div style={styles.botAvatar}><Sparkles size={15} /></div>}
              <div style={{ ...styles.msgBubble, ...(m.role === 'user' ? styles.msgUser : styles.msgBot) }}>{m.text}</div>
            </div>
          ))}
        </div>
        <div style={styles.suggestions}>
          {suggestions.map((sg) => (
            <button key={sg} onClick={() => send(sg)} style={styles.suggestChip}>{sg}</button>
          ))}
        </div>
        <div style={styles.chatInputRow}>
          <input value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send(input)}
            placeholder="اكتب سؤالك المالي هنا…" style={styles.chatInput} />
          <button onClick={() => send(input)} style={styles.sendBtn}><Send size={18} /></button>
        </div>
      </div>
    </div>
  );
}

// Traduit la raison de revue (renvoyée par le backend) en arabe pour l'UI
function translateReason(reason) {
  if (!reason) return '';
  if (reason.includes('entrée mais montant négatif'))
    return 'الوصف يشير إلى مبلغ وارد لكن القيمة سالبة (صادرة) — يرجى التحقق';
  if (reason.includes('sortie mais montant positif'))
    return 'الوصف يشير إلى مبلغ صادر لكن القيمة موجبة (واردة) — يرجى التحقق';
  return reason;
}

// ============ Vue Transactions (liste + actions CRUD) ============
function Transactions({ setView }) {
  const { transactions, refresh, derived } = useData();
  const [busyId, setBusyId] = useState(null);
  const [editId, setEditId] = useState(null);
  const [filter, setFilter] = useState('all'); // all | review

  if (!derived) {
    return (
      <div className="fade-in">
        <Header title="المعاملات" subtitle="إدارة وتصنيف معاملاتك" />
        <EmptyState setView={setView}
          title="لا توجد معاملات"
          sub="ارفع كشف حساب لعرض معاملاتك هنا وإدارتها." />
      </div>
    );
  }

  const shown = filter === 'review'
    ? transactions.filter((t) => t.needs_review)
    : transactions;

  const doDelete = async (id) => {
    setBusyId(id);
    try {
      await api.deleteTransaction(id);
      await refresh();
    } catch (e) { alert('خطأ في الحذف: ' + e.message); }
    setBusyId(null);
  };

  const doRelabel = async (id, category) => {
    setBusyId(id);
    try {
      await api.updateTransaction(id, { category });
      await refresh();
      setEditId(null);
    } catch (e) { alert('خطأ في التحديث: ' + e.message); }
    setBusyId(null);
  };

  const doReclassify = async (id) => {
    setBusyId(id);
    try {
      await api.reclassify(id); // sans catégorie = auto
      await refresh();
    } catch (e) { alert('خطأ في إعادة التصنيف: ' + e.message); }
    setBusyId(null);
  };

  return (
    <div className="fade-in">
      <Header title="المعاملات" subtitle={`${transactions.length} معاملة · ${derived.needsReview} بحاجة لمراجعة`} />

      <div style={styles.filterRow}>
        <button onClick={() => setFilter('all')}
          style={{ ...styles.filterBtn, ...(filter === 'all' ? styles.filterActive : {}) }}>
          الكل ({transactions.length})
        </button>
        <button onClick={() => setFilter('review')}
          style={{ ...styles.filterBtn, ...(filter === 'review' ? styles.filterActive : {}) }}>
          بحاجة لمراجعة ({derived.needsReview})
        </button>
        <button
          onClick={async () => {
            if (window.confirm('حذف كل البيانات نهائياً؟ لا يمكن التراجع.')) {
              await api.resetAll();
              await refresh();
            }
          }}
          style={styles.resetBtn}
          title="حذف كل البيانات (مفيد لإعادة الرفع)"
        >
          <Trash2 size={14} /> تفريغ القاعدة
        </button>
      </div>

      <div style={styles.card}>
        {shown.length === 0 ? (
          <div style={styles.miniEmpty}>لا توجد معاملات في هذا التصنيف.</div>
        ) : (
          <div style={styles.txTable}>
            {shown.map((t) => (
              <div key={t.id} style={styles.txTableRowWrap}>
                <div style={styles.txTableRow}>
                  <div style={styles.txTableMain}>
                  <div style={{ ...styles.txIcon, background: t.amount >= 0 ? '#0EA47A18' : '#EF444418', color: t.amount >= 0 ? '#0EA47A' : '#EF4444' }}>
                    {t.amount >= 0 ? <ArrowDownRight size={16} /> : <ArrowUpRight size={16} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={styles.txDesc}>{t.description || '—'}</div>
                    <div style={styles.txMeta}>
                      <span>{t.date}</span>
                      {t.reference && <span style={styles.refTag}>#{t.reference}</span>}
                      {editId === t.id ? (
                        <select
                          autoFocus
                          defaultValue={t.category}
                          onChange={(e) => doRelabel(t.id, e.target.value)}
                          style={styles.catSelect}
                        >
                          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                      ) : (
                        <button onClick={() => setEditId(t.id)} style={styles.catChip}>
                          <Tag size={11} /> {t.category}
                          {t.manually_labeled && <span style={styles.manualDot} title="مُصنّف يدوياً" />}
                        </button>
                      )}
                      {t.needs_review && <span style={styles.lowConf}>بحاجة تأكيد</span>}
                    </div>
                  </div>
                  <div style={{ ...styles.txAmount, color: t.amount >= 0 ? '#0EA47A' : '#0F172A' }}>
                    {t.amount >= 0 ? '+' : '−'}{fmt(t.amount)}
                  </div>
                </div>
                  <div style={styles.txActions}>
                    {busyId === t.id ? (
                      <Loader2 size={16} className="spinner" style={{ color: '#94A3B8' }} />
                    ) : (
                      <>
                        <button onClick={() => doReclassify(t.id)} style={styles.actionBtn} title="إعادة التصنيف تلقائياً">
                          <RefreshCw size={15} />
                        </button>
                        <button onClick={() => doDelete(t.id)} style={{ ...styles.actionBtn, color: '#EF4444' }} title="حذف">
                          <Trash2 size={15} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                {t.review_reason && (
                  <div style={styles.reviewReason}>
                    <AlertTriangle size={13} />
                    <span>{translateReason(t.review_reason)}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============ Composants partagés ============
function Header({ title, subtitle }) {
  return (
    <div style={styles.pageHead}>
      <h1 style={styles.pageTitle}>{title}</h1>
      <p style={styles.pageSub}>{subtitle}</p>
    </div>
  );
}

function StatCard({ label, value, unit, icon: Icon, primary, warn, up }) {
  return (
    <div style={{ ...styles.statCard, ...(primary ? styles.statPrimary : {}) }}>
      <div style={styles.statTop}>
        <span style={{ ...styles.statLabel, color: primary ? '#A7F3D0' : '#64748B' }}>{label}</span>
        <div style={{ ...styles.statIcon, background: primary ? '#ffffff20' : warn ? '#FEF2F2' : '#F0FDF9', color: primary ? '#fff' : warn ? '#EF4444' : '#0EA47A' }}>
          <Icon size={16} />
        </div>
      </div>
      <div style={{ ...styles.statValue, color: primary ? '#fff' : '#0F172A' }}>
        {value} <span style={{ ...styles.statUnit, color: primary ? '#A7F3D0' : '#94A3B8' }}>{unit}</span>
      </div>
    </div>
  );
}

// ============ Styles ============
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  .fade-in { animation: fadeIn 0.4s ease; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  .spinner { animation: spin 0.8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  button { cursor: pointer; font-family: 'Tajawal', sans-serif; }
  input { font-family: 'Tajawal', sans-serif; }
  ::-webkit-scrollbar { width: 8px; }
  ::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 4px; }
`;

const styles = {
  root: { display: 'flex', minHeight: '100vh', maxHeight: '100vh', fontFamily: "'Tajawal', sans-serif", background: '#F4F7FA', color: '#0F172A', overflow: 'hidden' },
  sidebar: { width: 264, background: '#0B1220', display: 'flex', flexDirection: 'column', padding: '24px 16px', flexShrink: 0 },
  logo: { display: 'flex', alignItems: 'center', gap: 12, padding: '4px 8px 28px' },
  logoMark: { width: 44, height: 44, borderRadius: 13, background: 'linear-gradient(135deg, #0EA47A, #0891B2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 800, color: '#fff' },
  logoName: { fontSize: 19, fontWeight: 800, color: '#fff' },
  logoTag: { fontSize: 12, color: '#64748B', fontWeight: 500 },
  nav: { display: 'flex', flexDirection: 'column', gap: 4, flex: 1 },
  navItem: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 11, border: 'none', background: 'transparent', color: '#94A3B8', fontSize: 14.5, fontWeight: 600, transition: 'all 0.18s', width: '100%' },
  navItemActive: { background: '#0EA47A15', color: '#34D9A8' },
  main: { flex: 1, padding: '32px 40px', overflowY: 'auto', maxHeight: '100vh' },
  mainMobile: { padding: '20px 16px 90px', maxHeight: 'none' },
  mobileBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: '#0B1220', flexShrink: 0 },
  mobileLogo: { display: 'flex', alignItems: 'center', gap: 11 },
  bottomNav: { position: 'fixed', bottom: 0, right: 0, left: 0, background: '#fff', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '8px 4px 10px', zIndex: 100, boxShadow: '0 -2px 12px rgba(0,0,0,0.04)' },
  bottomNavItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, border: 'none', background: 'transparent', padding: '4px 8px', flex: 1 },
  bottomNavLabel: { fontSize: 10.5, fontWeight: 600 },
  pageHead: { marginBottom: 28 },
  pageTitle: { fontSize: 27, fontWeight: 800, color: '#0F172A', marginBottom: 4 },
  pageSub: { fontSize: 14.5, color: '#64748B', fontWeight: 500 },
  statRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 },
  statCard: { background: '#fff', borderRadius: 16, padding: '18px 20px', border: '1px solid #EceFf3' },
  statPrimary: { background: 'linear-gradient(135deg, #0B1220, #14532D)', border: 'none' },
  statTop: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  statLabel: { fontSize: 13, fontWeight: 600 },
  statIcon: { width: 30, height: 30, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 23, fontWeight: 800, letterSpacing: '-0.5px' },
  statUnit: { fontSize: 13, fontWeight: 600 },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 },
  card: { background: '#fff', borderRadius: 18, padding: 24, border: '1px solid #EceFf3', marginBottom: 20 },
  cardHead: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 },
  cardTitle: { fontSize: 16.5, fontWeight: 800, color: '#0F172A' },
  cardSub: { fontSize: 12.5, color: '#94A3B8', fontWeight: 500, marginTop: 3 },
  catList: { display: 'flex', flexDirection: 'column', gap: 14 },
  catRow: { display: 'flex', alignItems: 'center', gap: 12 },
  catLabel: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, fontWeight: 600, width: 130, flexShrink: 0 },
  catDot: { width: 10, height: 10, borderRadius: 3, flexShrink: 0 },
  catBarWrap: { flex: 1, height: 8, background: '#F1F5F9', borderRadius: 4, overflow: 'hidden' },
  catBar: { height: '100%', borderRadius: 4, transition: 'width 0.6s ease' },
  catAmount: { fontSize: 13, fontWeight: 700, color: '#475569', width: 64, textAlign: 'left' },
  txList: { display: 'flex', flexDirection: 'column' },
  txRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 4px', borderBottom: '1px solid #F4F7FA' },
  txLeft: { display: 'flex', alignItems: 'center', gap: 12 },
  txIcon: { width: 34, height: 34, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  txDesc: { fontSize: 13.5, fontWeight: 600, color: '#0F172A' },
  txCat: { fontSize: 11.5, color: '#94A3B8', fontWeight: 500, marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 },
  lowConf: { background: '#FFFBEB', color: '#D97706', fontSize: 10.5, fontWeight: 700, padding: '1px 7px', borderRadius: 6 },
  reviewReason: { display: 'flex', alignItems: 'center', gap: 7, margin: '0 4px 10px', padding: '8px 12px', background: '#FEF2F2', color: '#DC2626', fontSize: 12, fontWeight: 600, borderRadius: 9, borderRight: '3px solid #EF4444' },
  txAmount: { fontSize: 14, fontWeight: 800 },
  explainText: { fontSize: 14, lineHeight: 1.9, color: '#475569', marginTop: 8, fontWeight: 500 },
  alertList: { display: 'flex', flexDirection: 'column', gap: 14 },
  alertCard: { display: 'flex', gap: 16, padding: 20, borderRadius: 16, border: '1px solid' },
  alertIcon: { width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  alertTitle: { fontSize: 15.5, fontWeight: 800, color: '#0F172A', marginBottom: 6 },
  alertBody: { fontSize: 13.5, lineHeight: 1.8, color: '#475569', fontWeight: 500 },
  chatWrap: { display: 'flex', flexDirection: 'column' },
  chatBox: { background: '#fff', borderRadius: 18, border: '1px solid #EceFf3', display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' },
  chatMessages: { flex: 1, padding: 24, display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto' },
  msgRow: { display: 'flex', gap: 10, alignItems: 'flex-end' },
  botAvatar: { width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg, #0EA47A, #0891B2)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  msgBubble: { maxWidth: '70%', padding: '13px 17px', borderRadius: 15, fontSize: 14, lineHeight: 1.7, fontWeight: 500 },
  msgUser: { background: '#0B1220', color: '#fff', borderBottomRightRadius: 4 },
  msgBot: { background: '#F4F7FA', color: '#0F172A', borderBottomLeftRadius: 4 },
  suggestions: { display: 'flex', gap: 8, padding: '0 24px 14px', flexWrap: 'wrap' },
  suggestChip: { border: '1px solid #E2E8F0', background: '#fff', color: '#475569', fontSize: 12.5, fontWeight: 600, padding: '8px 14px', borderRadius: 20 },
  chatInputRow: { display: 'flex', gap: 10, padding: 16, borderTop: '1px solid #F1F5F9' },
  chatInput: { flex: 1, border: '1px solid #E2E8F0', borderRadius: 12, padding: '13px 16px', fontSize: 14, outline: 'none', background: '#F8FAFC' },
  sendBtn: { width: 48, border: 'none', background: '#0EA47A', color: '#fff', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  tooltip: { background: '#0B1220', padding: '10px 14px', borderRadius: 10 },
  tooltipLabel: { fontSize: 11, color: '#94A3B8', fontWeight: 500, fontFamily: 'Tajawal', marginBottom: 3 },
  tooltipVal: { fontSize: 14, color: '#fff', fontWeight: 700, fontFamily: 'Tajawal' },
  empty: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 24px', textAlign: 'center', background: '#fff', borderRadius: 18, border: '1px dashed #CBD5E1' },
  emptyIcon: { width: 80, height: 80, borderRadius: 22, background: '#F4F7FA', color: '#94A3B8', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  emptyTitle: { fontSize: 19, fontWeight: 800, color: '#0F172A', marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#64748B', fontWeight: 500, maxWidth: 420, lineHeight: 1.8, marginBottom: 22 },
  emptyBtn: { display: 'flex', alignItems: 'center', gap: 8, border: 'none', background: '#0B1220', color: '#fff', fontSize: 14.5, fontWeight: 700, padding: '12px 24px', borderRadius: 12 },
  miniEmpty: { padding: '30px 16px', textAlign: 'center', color: '#94A3B8', fontSize: 13.5, fontWeight: 500 },
  accountsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 },
  accountCard: { borderRadius: 14, padding: '16px', border: '1.5px solid', display: 'flex', flexDirection: 'column', gap: 8 },
  accountBankRow: { display: 'flex', alignItems: 'center', gap: 11 },
  bankDot: { width: 40, height: 40, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 18, flexShrink: 0 },
  accountBank: { fontSize: 13.5, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  accountNum: { fontSize: 12, color: '#94A3B8', fontWeight: 600, marginTop: 2, direction: 'ltr', textAlign: 'right' },
  accountCustomer: { fontSize: 12.5, color: '#475569', fontWeight: 600 },
  currencyTag: { fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 7, flexShrink: 0 },
  accountPeriod: { fontSize: 11.5, color: '#64748B', fontWeight: 500, paddingTop: 6, borderTop: '1px solid #F1F5F9' },
  accountDeleteBtn: { display: 'flex', alignItems: 'center', gap: 6, border: 'none', background: 'transparent', color: '#EF4444', fontSize: 12, fontWeight: 700, padding: '6px 0 0', cursor: 'pointer', marginTop: 2 },
  refTag: { fontSize: 10.5, fontWeight: 600, color: '#94A3B8', background: '#F1F5F9', padding: '1px 7px', borderRadius: 6, direction: 'ltr' },
  filterRow: { display: 'flex', gap: 10, marginBottom: 16 },
  resetBtn: { marginInlineStart: 'auto', display: 'flex', alignItems: 'center', gap: 6, border: '1px solid #FECACA', background: '#fff', color: '#DC2626', fontSize: 12.5, fontWeight: 700, padding: '9px 14px', borderRadius: 10 },
  filterBtn: { border: '1px solid #E2E8F0', background: '#fff', color: '#64748B', fontSize: 13, fontWeight: 700, padding: '9px 16px', borderRadius: 10 },
  filterActive: { background: '#0B1220', color: '#fff', borderColor: '#0B1220' },
  txTable: { display: 'flex', flexDirection: 'column' },
  txTableRowWrap: { borderBottom: '1px solid #F4F7FA' },
  txTableRow: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 4px' },
  txTableMain: { display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 },
  txMeta: { display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, fontSize: 11.5, color: '#94A3B8', fontWeight: 500, flexWrap: 'wrap' },
  catChip: { display: 'inline-flex', alignItems: 'center', gap: 5, border: '1px solid #E2E8F0', background: '#F8FAFC', color: '#475569', fontSize: 11.5, fontWeight: 700, padding: '3px 9px', borderRadius: 8, position: 'relative' },
  catSelect: { border: '1px solid #0EA47A', borderRadius: 8, padding: '4px 8px', fontSize: 12, fontWeight: 600, color: '#0F172A', fontFamily: "'Tajawal', sans-serif", outline: 'none' },
  manualDot: { width: 6, height: 6, borderRadius: '50%', background: '#0EA47A', marginInlineStart: 3 },
  txActions: { display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 },
  actionBtn: { width: 32, height: 32, border: '1px solid #E2E8F0', background: '#fff', color: '#64748B', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  loadingBox: { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', background: '#fff', borderRadius: 18, border: '1px solid #EceFf3' },
  errorState: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: '60px 24px', textAlign: 'center', background: '#fff', borderRadius: 18, border: '1px solid #FECACA' },
  errorStateText: { fontSize: 16, fontWeight: 800, color: '#0F172A' },
  errorStateHint: { fontSize: 13.5, color: '#64748B', fontWeight: 500, maxWidth: 360, lineHeight: 1.7, marginBottom: 8 },
};
