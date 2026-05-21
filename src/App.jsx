import React, { useState, useMemo, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, ReferenceLine } from 'recharts';
import { TrendingUp, TrendingDown, AlertTriangle, Bell, Upload, MessageSquare, LayoutDashboard, Wallet, Send, Sparkles, ArrowUpRight, ArrowDownRight, Calendar, ChevronLeft } from 'lucide-react';

// hook لكشف حجم الشاشة
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 820 : false);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 820);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return isMobile;
}

// ============ بيانات تجريبية واقعية لشركة سعودية متوسطة ============
const accounts = [
  { id: 1, bank: 'مصرف الراجحي', balance: 1240500, type: 'جاري', last4: '4471' },
  { id: 2, bank: 'البنك الأهلي SNB', balance: 685200, type: 'جاري', last4: '8830' },
  { id: 3, bank: 'بنك الإنماء', balance: 312800, type: 'تشغيلي', last4: '2095' },
];

const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);

// توقع 8 أسابيع - يظهر عجز متوقع في الأسبوع 4
const forecastData = [
  { week: 'الحالي', balance: 2238500, projected: null, lower: null, upper: null },
  { week: 'أسبوع 1', balance: null, projected: 2410000, lower: 2350000, upper: 2470000 },
  { week: 'أسبوع 2', balance: null, projected: 1980000, lower: 1880000, upper: 2080000 },
  { week: 'أسبوع 3', balance: null, projected: 1420000, lower: 1280000, upper: 1560000 },
  { week: 'أسبوع 4', balance: null, projected: 680000, lower: 480000, upper: 880000 },
  { week: 'أسبوع 5', balance: null, projected: 1150000, lower: 900000, upper: 1400000 },
  { week: 'أسبوع 6', balance: null, projected: 1780000, lower: 1450000, upper: 2110000 },
  { week: 'أسبوع 7', balance: null, projected: 2050000, lower: 1650000, upper: 2450000 },
  { week: 'أسبوع 8', balance: null, projected: 2420000, lower: 1950000, upper: 2890000 },
];

const categories = [
  { name: 'رواتب', amount: 485000, pct: 38, color: '#0EA47A', trend: 'flat' },
  { name: 'موردون', amount: 312000, pct: 24, color: '#2563EB', trend: 'up' },
  { name: 'إيجارات ومرافق', amount: 178000, pct: 14, color: '#7C3AED', trend: 'flat' },
  { name: 'ضريبة ق.م وزكاة', amount: 156000, pct: 12, color: '#D97706', trend: 'up' },
  { name: 'تشغيل أخرى', amount: 102000, pct: 8, color: '#64748B', trend: 'down' },
  { name: 'رسوم بنكية', amount: 51000, pct: 4, color: '#94A3B8', trend: 'flat' },
];

const alerts = [
  { id: 1, severity: 'high', icon: AlertTriangle, title: 'عجز سيولة متوقع', body: 'بناءً على التوقعات، سينخفض رصيدك إلى 680 ألف ريال في الأسبوع الرابع. ننصح بتدبير 500 ألف ريال أو تأجيل دفعة موردين قبل يوم 23.', time: 'منذ ساعتين' },
  { id: 2, severity: 'medium', icon: Calendar, title: 'عميل تأخر عن نمطه المعتاد', body: 'شركة الفجر للمقاولات تدفع عادةً يوم 5 من الشهر. لم تُسجَّل دفعتها (148 ألف ريال) حتى الآن — متأخرة 6 أيام.', time: 'منذ 5 ساعات' },
  { id: 3, severity: 'low', icon: Wallet, title: 'سيولة فائضة نائمة', body: 'لديك 685 ألف ريال في حساب الأهلي دون عائد لأكثر من 30 يوماً. يمكن تحويلها لحساب مرابحة بعائد تقديري 4.8% سنوياً.', time: 'أمس' },
];

const recentTx = [
  { desc: 'تحويل وارد - شركة الفجر للمقاولات', cat: 'تحصيل عملاء', amount: 0, pending: true, conf: null },
  { desc: 'ZATCA - ضريبة القيمة المضافة', cat: 'ضريبة ق.م وزكاة', amount: -89400, pending: false, conf: 0.99 },
  { desc: 'رواتب الموظفين - مسير أبريل', cat: 'رواتب', amount: -485000, pending: false, conf: 0.98 },
  { desc: 'SADAD - فاتورة الاتصالات السعودية', cat: 'إيجارات ومرافق', amount: -12300, pending: false, conf: 0.95 },
  { desc: 'مدفوعات مورد - مؤسسة التقنية الحديثة', cat: 'موردون', amount: -67800, pending: false, conf: 0.72 },
  { desc: 'تحويل وارد - مبيعات نقطة بيع', cat: 'تحصيل عملاء', amount: 234000, pending: false, conf: 0.91 },
];

const fmt = (n) => new Intl.NumberFormat('ar-SA').format(Math.abs(n));

const chatSeed = [
  { role: 'assistant', text: 'مرحباً 👋 أنا مساعدك المالي. اسألني عن سيولتك، مصروفاتك، أو توقعاتك.' },
];

export default function TreasuryPrototype() {
  const [view, setView] = useState('dashboard');
  const [chatMessages, setChatMessages] = useState(chatSeed);
  const [chatInput, setChatInput] = useState('');
  const [uploadState, setUploadState] = useState('idle');

  const sendMessage = (text) => {
    if (!text.trim()) return;
    const userMsg = { role: 'user', text };
    let reply = 'دعني أحلل بياناتك… بشكل عام وضعك المالي مستقر مع تنبيه واحد مهم حول الأسبوع الرابع.';
    const t = text.toLowerCase();
    if (t.includes('رواتب') || t.includes('راتب')) {
      reply = 'إجمالي الرواتب آخر 3 أشهر: 1,455,000 ريال (بمتوسط 485 ألف شهرياً). ثابتة تقريباً، لا تغير يُذكر. تمثل 38% من مصروفاتك التشغيلية — وهي أكبر بند.';
    } else if (t.includes('عجز') || t.includes('سيولة') || t.includes('رصيد')) {
      reply = 'رصيدك المجمّع الحالي 2,238,500 ريال عبر 3 حسابات. لكن انتبه: التوقعات تشير لانخفاضه إلى 680 ألف في الأسبوع الرابع بسبب تزامن الرواتب وضريبة القيمة المضافة وعدة دفعات موردين. أنصحك بتدبير 500 ألف قبل يوم 23.';
    } else if (t.includes('عملاء') || t.includes('متأخر')) {
      reply = 'لديك عميل واحد متأخر: شركة الفجر للمقاولات (148 ألف ريال، متأخرة 6 أيام عن نمطها المعتاد يوم 5). باقي العملاء ضمن أنماطهم الطبيعية. أرسل تذكيراً؟';
    } else if (t.includes('استثمار') || t.includes('فائض')) {
      reply = 'لديك 685 ألف ريال نائمة في حساب الأهلي منذ 30+ يوماً. تحويلها لحساب مرابحة متوافق مع الشريعة يولّد ~32,880 ريال سنوياً بعائد 4.8%. السيولة تبقى متاحة خلال 24 ساعة عند الحاجة.';
    }
    setChatMessages((m) => [...m, userMsg, { role: 'assistant', text: reply }]);
    setChatInput('');
  };

  const runUpload = () => {
    setUploadState('processing');
    setTimeout(() => setUploadState('done'), 2200);
  };

  const isMobile = useIsMobile();

  const navItems = [
    { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
    { id: 'forecast', label: 'التوقعات', icon: TrendingUp },
    { id: 'alerts', label: 'التنبيهات', icon: Bell, badge: 3 },
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
          <div style={styles.companyAvatar}>ن</div>
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
                  {item.badge && <span style={styles.navBadge}>{item.badge}</span>}
                </button>
              );
            })}
          </nav>

          <div style={styles.sidebarFoot}>
            <div style={styles.companyCard}>
              <div style={styles.companyAvatar}>ن</div>
              <div>
                <div style={styles.companyName}>شركة نخبة التجارة</div>
                <div style={styles.companyMeta}>متصل بـ 3 حسابات</div>
              </div>
            </div>
          </div>
        </aside>
      )}

      <main style={{ ...styles.main, ...(isMobile ? styles.mainMobile : {}) }}>
        {view === 'dashboard' && <Dashboard setView={setView} isMobile={isMobile} />}
        {view === 'forecast' && <Forecast isMobile={isMobile} />}
        {view === 'alerts' && <Alerts />}
        {view === 'chat' && (
          <Chat messages={chatMessages} input={chatInput} setInput={setChatInput} onSend={sendMessage} isMobile={isMobile} />
        )}
        {view === 'upload' && <UploadView state={uploadState} run={runUpload} reset={() => setUploadState('idle')} />}
      </main>

      {isMobile && (
        <nav style={styles.bottomNav}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = view === item.id;
            return (
              <button key={item.id} onClick={() => setView(item.id)}
                style={{ ...styles.bottomNavItem, color: active ? '#0EA47A' : '#94A3B8' }}>
                <div style={{ position: 'relative' }}>
                  <Icon size={22} strokeWidth={2} />
                  {item.badge && <span style={styles.bottomBadge}>{item.badge}</span>}
                </div>
                <span style={styles.bottomNavLabel}>{item.label}</span>
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
}

// ============ Dashboard ============
function Dashboard({ setView, isMobile }) {
  const statGrid = { ...styles.statRow, gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)' };
  const grid2 = { ...styles.grid2, gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' };
  return (
    <div className="fade-in">
      <Header title="لوحة التحكم" subtitle="نظرة شاملة على وضعك المالي اليوم" />

      <div style={statGrid}>
        <StatCard label="الرصيد المجمّع" value={`${fmt(totalBalance)}`} unit="ريال" delta="+8.2%" up icon={Wallet} primary />
        <StatCard label="التدفق الداخل (الشهر)" value={`${fmt(892000)}`} unit="ريال" delta="+12%" up icon={ArrowUpRight} />
        <StatCard label="التدفق الخارج (الشهر)" value={`${fmt(1284000)}`} unit="ريال" delta="+3%" up={false} icon={ArrowDownRight} />
        <StatCard label="صافي التدفق" value={`${fmt(392000)}-`} unit="ريال" delta="تحذير" up={false} icon={TrendingDown} warn />
      </div>

      <div style={grid2}>
        {/* Forecast preview */}
        <div style={styles.card}>
          <div style={styles.cardHead}>
            <div>
              <div style={styles.cardTitle}>توقع التدفق النقدي · 8 أسابيع</div>
              <div style={styles.cardSub}>التوقعات تشير إلى انخفاض حاد في الأسبوع الرابع</div>
            </div>
            <button onClick={() => setView('forecast')} style={styles.linkBtn}>
              التفاصيل <ChevronLeft size={15} />
            </button>
          </div>
          <ForecastChart compact />
          <div style={styles.warnStrip}>
            <AlertTriangle size={16} />
            <span>نقطة الخطر: الأسبوع الرابع — الرصيد المتوقع 680 ألف ريال</span>
          </div>
        </div>

        {/* Accounts */}
        <div style={styles.card}>
          <div style={styles.cardHead}>
            <div style={styles.cardTitle}>الحسابات المتصلة</div>
          </div>
          <div style={styles.accountList}>
            {accounts.map((a) => (
              <div key={a.id} style={styles.accountRow}>
                <div style={styles.accountBank}>
                  <div style={styles.bankDot}>{a.bank.charAt(0)}</div>
                  <div>
                    <div style={styles.accountName}>{a.bank}</div>
                    <div style={styles.accountType}>{a.type} · ****{a.last4}</div>
                  </div>
                </div>
                <div style={styles.accountBal}>{fmt(a.balance)} <span style={styles.riyal}>ر.س</span></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={grid2}>
        {/* Categories */}
        <div style={styles.card}>
          <div style={styles.cardHead}>
            <div style={styles.cardTitle}>المصروفات حسب الفئة</div>
            <div style={styles.cardSub}>هذا الشهر</div>
          </div>
          <div style={styles.catList}>
            {categories.map((c) => (
              <div key={c.name} style={styles.catRow}>
                <div style={styles.catLabel}>
                  <span style={{ ...styles.catDot, background: c.color }} />
                  {c.name}
                </div>
                <div style={styles.catBarWrap}>
                  <div style={{ ...styles.catBar, width: `${c.pct * 2.2}%`, background: c.color }} />
                </div>
                <div style={styles.catAmount}>{fmt(c.amount)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent transactions */}
        <div style={styles.card}>
          <div style={styles.cardHead}>
            <div style={styles.cardTitle}>أحدث المعاملات</div>
            <div style={styles.cardSub}>مصنّفة تلقائياً بالذكاء الاصطناعي</div>
          </div>
          <div style={styles.txList}>
            {recentTx.map((t, i) => (
              <div key={i} style={styles.txRow}>
                <div style={styles.txLeft}>
                  <div style={{ ...styles.txIcon, background: t.amount >= 0 ? '#0EA47A18' : '#EF444418', color: t.amount >= 0 ? '#0EA47A' : '#EF4444' }}>
                    {t.amount >= 0 ? <ArrowDownRight size={16} /> : <ArrowUpRight size={16} />}
                  </div>
                  <div>
                    <div style={styles.txDesc}>{t.desc}</div>
                    <div style={styles.txCat}>
                      {t.cat}
                      {t.conf !== null && t.conf < 0.8 && <span style={styles.lowConf}>بحاجة تأكيد</span>}
                    </div>
                  </div>
                </div>
                <div style={{ ...styles.txAmount, color: t.pending ? '#94A3B8' : t.amount >= 0 ? '#0EA47A' : '#0F172A' }}>
                  {t.pending ? 'قيد الانتظار' : `${t.amount >= 0 ? '+' : '−'}${fmt(t.amount)}`}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ Forecast View ============
function Forecast({ isMobile }) {
  const statGrid = { ...styles.statRow, gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)' };
  return (
    <div className="fade-in">
      <Header title="توقع التدفق النقدي" subtitle="نموذج تنبؤي يدمج أنماطك التاريخية والتقويم السعودي" />
      <div style={styles.card}>
        <div style={styles.cardHead}>
          <div>
            <div style={styles.cardTitle}>الرصيد المتوقع · الأسابيع الثمانية القادمة</div>
            <div style={styles.cardSub}>المنطقة المظللة تمثل نطاق الثقة (الأدنى والأعلى)</div>
          </div>
        </div>
        <ForecastChart />
      </div>
      <div style={statGrid}>
        <StatCard label="أدنى رصيد متوقع" value={`${fmt(680000)}`} unit="ريال · أسبوع 4" warn icon={TrendingDown} up={false} />
        <StatCard label="رصيد نهاية الفترة" value={`${fmt(2420000)}`} unit="ريال · أسبوع 8" up icon={TrendingUp} delta="تعافٍ" />
        <StatCard label="دقة النموذج" value="91" unit="٪ تاريخياً" icon={Sparkles} />
      </div>
      <div style={styles.card}>
        <div style={styles.cardTitle}>كيف يعمل التوقع</div>
        <p style={styles.explainText}>
          يفصل النموذج معاملاتك إلى <b>متكررة</b> (رواتب، إيجارات، ضرائب دورية) و<b>متغيرة</b> (تحصيلات العملاء، مصروفات تشغيلية).
          يكتشف الأنماط المتكررة ويُسقطها على المستقبل، ويستخدم نموذج سلاسل زمنية للمتغيرة مع مراعاة المواسم —
          بما في ذلك <b>رمضان والأعياد والإجازات الرسمية السعودية</b> التي تؤثر على دورات الدفع والتحصيل.
        </p>
      </div>
    </div>
  );
}

function ForecastChart({ compact }) {
  return (
    <ResponsiveContainer width="100%" height={compact ? 220 : 340}>
      <AreaChart data={forecastData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
        <defs>
          <linearGradient id="confidence" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0EA47A" stopOpacity={0.18} />
            <stop offset="100%" stopColor="#0EA47A" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#E8EDF2" vertical={false} />
        <XAxis dataKey="week" tick={{ fontSize: 12, fill: '#64748B', fontFamily: 'Tajawal' }} axisLine={false} tickLine={false} reversed />
        <YAxis tick={{ fontSize: 11, fill: '#94A3B8', fontFamily: 'Tajawal' }} axisLine={false} tickLine={false}
          tickFormatter={(v) => `${(v / 1000000).toFixed(1)}م`} orientation="right" width={45} />
        <Tooltip content={<ChartTip />} />
        <ReferenceLine y={800000} stroke="#EF4444" strokeDasharray="5 4" strokeWidth={1.5}
          label={{ value: 'حد الأمان', position: 'insideTopLeft', fontSize: 11, fill: '#EF4444', fontFamily: 'Tajawal' }} />
        <Area type="monotone" dataKey="upper" stroke="none" fill="url(#confidence)" />
        <Area type="monotone" dataKey="lower" stroke="none" fill="#ffffff" />
        <Line type="monotone" dataKey="balance" stroke="#0F172A" strokeWidth={3} dot={{ r: 5, fill: '#0F172A' }} connectNulls />
        <Line type="monotone" dataKey="projected" stroke="#0EA47A" strokeWidth={3} strokeDasharray="6 4"
          dot={{ r: 4, fill: '#0EA47A' }} connectNulls />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function ChartTip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  const val = payload.find((p) => p.dataKey === 'projected' || p.dataKey === 'balance');
  if (!val || val.value == null) return null;
  return (
    <div style={styles.tooltip}>
      <div style={styles.tooltipLabel}>{label}</div>
      <div style={styles.tooltipVal}>{fmt(val.value)} ريال</div>
    </div>
  );
}

// ============ Alerts View ============
function Alerts() {
  const colors = {
    high: { bg: '#FEF2F2', bd: '#FECACA', ic: '#EF4444' },
    medium: { bg: '#FFFBEB', bd: '#FDE68A', ic: '#D97706' },
    low: { bg: '#F0FDF9', bd: '#A7F3D0', ic: '#0EA47A' },
  };
  return (
    <div className="fade-in">
      <Header title="التنبيهات الاستباقية" subtitle="ينبّهك النظام قبل وقوع المشكلة، لا بعدها" />
      <div style={styles.alertList}>
        {alerts.map((a) => {
          const Icon = a.icon;
          const c = colors[a.severity];
          return (
            <div key={a.id} style={{ ...styles.alertCard, background: c.bg, borderColor: c.bd }}>
              <div style={{ ...styles.alertIcon, background: '#fff', color: c.ic }}>
                <Icon size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={styles.alertHead}>
                  <span style={styles.alertTitle}>{a.title}</span>
                  <span style={styles.alertTime}>{a.time}</span>
                </div>
                <p style={styles.alertBody}>{a.body}</p>
                <div style={styles.alertActions}>
                  <button style={{ ...styles.alertBtn, background: c.ic }}>اتخاذ إجراء</button>
                  <button style={styles.alertBtnGhost}>تجاهل</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============ Chat View ============
function Chat({ messages, input, setInput, onSend, isMobile }) {
  const suggestions = ['كم صرفت على الرواتب؟', 'هل لدي عجز سيولة متوقع؟', 'أي عميل متأخر في الدفع؟', 'كيف أستثمر السيولة الفائضة؟'];
  const wrap = { ...styles.chatWrap, height: isMobile ? 'calc(100vh - 200px)' : 'calc(100vh - 64px)' };
  return (
    <div className="fade-in" style={wrap}>
      <Header title="المساعد المالي" subtitle="اسأل بالعربية الطبيعية — الإجابات مبنية على بياناتك الفعلية" />
      <div style={styles.chatBox}>
        <div style={styles.chatMessages}>
          {messages.map((m, i) => (
            <div key={i} style={{ ...styles.msgRow, justifyContent: m.role === 'user' ? 'flex-start' : 'flex-end' }}>
              {m.role === 'assistant' && <div style={styles.botAvatar}><Sparkles size={15} /></div>}
              <div style={{ ...styles.msgBubble, ...(m.role === 'user' ? styles.msgUser : styles.msgBot) }}>
                {m.text}
              </div>
            </div>
          ))}
        </div>
        <div style={styles.suggestions}>
          {suggestions.map((s) => (
            <button key={s} onClick={() => onSend(s)} style={styles.suggestChip}>{s}</button>
          ))}
        </div>
        <div style={styles.chatInputRow}>
          <input value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSend(input)}
            placeholder="اكتب سؤالك المالي هنا…" style={styles.chatInput} />
          <button onClick={() => onSend(input)} style={styles.sendBtn}><Send size={18} /></button>
        </div>
      </div>
    </div>
  );
}

// ============ Upload View ============
function UploadView({ state, run, reset }) {
  return (
    <div className="fade-in">
      <Header title="رفع كشف حساب" subtitle="ادعم أي بنك سعودي — يفهم النظام البنية تلقائياً" />
      <div style={styles.card}>
        {state === 'idle' && (
          <div style={styles.dropZone} onClick={run}>
            <div style={styles.dropIcon}><Upload size={32} /></div>
            <div style={styles.dropTitle}>اسحب ملف الكشف هنا أو انقر للرفع</div>
            <div style={styles.dropSub}>يدعم CSV و Excel من الراجحي، الأهلي، الإنماء، وغيرها · تواريخ هجرية وميلادية</div>
            <button style={styles.dropBtn}>اختر ملفاً (تجريبي)</button>
          </div>
        )}
        {state === 'processing' && (
          <div style={styles.processing}>
            <div className="spinner" style={styles.spinner} />
            <div style={styles.procSteps}>
              <div style={styles.procStep}>✓ قراءة الملف وتحديد بنيته تلقائياً</div>
              <div style={styles.procStep}>✓ توحيد التواريخ والمبالغ</div>
              <div style={{ ...styles.procStep, opacity: 0.6 }}>⟳ تصنيف 247 معاملة بالذكاء الاصطناعي…</div>
            </div>
          </div>
        )}
        {state === 'done' && (
          <div style={styles.doneBox}>
            <div style={styles.doneCheck}>✓</div>
            <div style={styles.doneTitle}>تمت المعالجة بنجاح</div>
            <div style={styles.doneStats}>
              <div style={styles.doneStat}><b>247</b><span>معاملة</span></div>
              <div style={styles.doneStat}><b>231</b><span>صُنّفت تلقائياً</span></div>
              <div style={styles.doneStat}><b>16</b><span>بحاجة تأكيد</span></div>
            </div>
            <button onClick={reset} style={styles.dropBtn}>رفع ملف آخر</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ============ Shared Components ============
function Header({ title, subtitle }) {
  return (
    <div style={styles.pageHead}>
      <h1 style={styles.pageTitle}>{title}</h1>
      <p style={styles.pageSub}>{subtitle}</p>
    </div>
  );
}

function StatCard({ label, value, unit, delta, up, icon: Icon, primary, warn }) {
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
      {delta && (
        <div style={{ ...styles.statDelta, color: warn ? '#EF4444' : up ? (primary ? '#A7F3D0' : '#0EA47A') : '#EF4444' }}>
          {warn ? <AlertTriangle size={13} /> : up ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
          {delta}
        </div>
      )}
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
  @media (max-width: 820px) {
    .page-title-resp { font-size: 21px !important; }
  }
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
  navBadge: { background: '#EF4444', color: '#fff', fontSize: 11, fontWeight: 700, minWidth: 20, height: 20, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 6px' },
  sidebarFoot: { paddingTop: 16, borderTop: '1px solid #1E293B' },
  companyCard: { display: 'flex', alignItems: 'center', gap: 11, padding: '10px 8px' },
  companyAvatar: { width: 38, height: 38, borderRadius: 10, background: '#1E293B', color: '#34D9A8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 17 },
  companyName: { fontSize: 13.5, fontWeight: 700, color: '#E2E8F0' },
  companyMeta: { fontSize: 11.5, color: '#64748B' },

  main: { flex: 1, padding: '32px 40px', overflowY: 'auto', maxHeight: '100vh' },
  mainMobile: { padding: '20px 16px 90px', maxHeight: 'none' },
  mobileBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: '#0B1220', flexShrink: 0 },
  mobileLogo: { display: 'flex', alignItems: 'center', gap: 11 },
  bottomNav: { position: 'fixed', bottom: 0, right: 0, left: 0, background: '#fff', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '8px 4px 10px', zIndex: 100, boxShadow: '0 -2px 12px rgba(0,0,0,0.04)' },
  bottomNavItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, border: 'none', background: 'transparent', padding: '4px 8px', flex: 1 },
  bottomNavLabel: { fontSize: 10.5, fontWeight: 600 },
  bottomBadge: { position: 'absolute', top: -5, left: -8, background: '#EF4444', color: '#fff', fontSize: 9, fontWeight: 700, minWidth: 15, height: 15, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' },
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
  statDelta: { display: 'flex', alignItems: 'center', gap: 4, fontSize: 12.5, fontWeight: 700, marginTop: 8 },

  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 },
  card: { background: '#fff', borderRadius: 18, padding: 24, border: '1px solid #EceFf3' },
  cardHead: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 },
  cardTitle: { fontSize: 16.5, fontWeight: 800, color: '#0F172A' },
  cardSub: { fontSize: 12.5, color: '#94A3B8', fontWeight: 500, marginTop: 3 },
  linkBtn: { display: 'flex', alignItems: 'center', gap: 2, border: 'none', background: '#F0FDF9', color: '#0EA47A', fontSize: 13, fontWeight: 700, padding: '7px 12px', borderRadius: 9 },

  warnStrip: { display: 'flex', alignItems: 'center', gap: 9, marginTop: 14, padding: '11px 14px', background: '#FEF2F2', color: '#DC2626', borderRadius: 11, fontSize: 13, fontWeight: 600 },

  accountList: { display: 'flex', flexDirection: 'column', gap: 4 },
  accountRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 6px', borderBottom: '1px solid #F4F7FA' },
  accountBank: { display: 'flex', alignItems: 'center', gap: 12 },
  bankDot: { width: 38, height: 38, borderRadius: 10, background: '#F0FDF9', color: '#0EA47A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16 },
  accountName: { fontSize: 14, fontWeight: 700, color: '#0F172A' },
  accountType: { fontSize: 12, color: '#94A3B8', fontWeight: 500, marginTop: 2 },
  accountBal: { fontSize: 15.5, fontWeight: 800, color: '#0F172A' },
  riyal: { fontSize: 12, color: '#94A3B8', fontWeight: 600 },

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
  txAmount: { fontSize: 14, fontWeight: 800 },

  explainText: { fontSize: 14, lineHeight: 1.9, color: '#475569', marginTop: 8, fontWeight: 500 },

  alertList: { display: 'flex', flexDirection: 'column', gap: 14 },
  alertCard: { display: 'flex', gap: 16, padding: 20, borderRadius: 16, border: '1px solid' },
  alertIcon: { width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  alertHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  alertTitle: { fontSize: 15.5, fontWeight: 800, color: '#0F172A' },
  alertTime: { fontSize: 12, color: '#94A3B8', fontWeight: 500 },
  alertBody: { fontSize: 13.5, lineHeight: 1.8, color: '#475569', fontWeight: 500, marginBottom: 14 },
  alertActions: { display: 'flex', gap: 10 },
  alertBtn: { border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, padding: '8px 18px', borderRadius: 9 },
  alertBtnGhost: { border: 'none', background: '#ffffff', color: '#64748B', fontSize: 13, fontWeight: 700, padding: '8px 16px', borderRadius: 9 },

  chatWrap: { display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)' },
  chatBox: { background: '#fff', borderRadius: 18, border: '1px solid #EceFf3', display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' },
  chatMessages: { flex: 1, padding: 24, display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto' },
  msgRow: { display: 'flex', gap: 10, alignItems: 'flex-end' },
  botAvatar: { width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg, #0EA47A, #0891B2)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  msgBubble: { maxWidth: '70%', padding: '13px 17px', borderRadius: 15, fontSize: 14, lineHeight: 1.7, fontWeight: 500 },
  msgUser: { background: '#0B1220', color: '#fff', borderBottomRightRadius: 4 },
  msgBot: { background: '#F4F7FA', color: '#0F172A', borderBottomLeftRadius: 4 },
  suggestions: { display: 'flex', gap: 8, padding: '0 24px 14px', flexWrap: 'wrap' },
  suggestChip: { border: '1px solid #E2E8F0', background: '#fff', color: '#475569', fontSize: 12.5, fontWeight: 600, padding: '8px 14px', borderRadius: 20, transition: 'all 0.15s' },
  chatInputRow: { display: 'flex', gap: 10, padding: 16, borderTop: '1px solid #F1F5F9' },
  chatInput: { flex: 1, border: '1px solid #E2E8F0', borderRadius: 12, padding: '13px 16px', fontSize: 14, outline: 'none', background: '#F8FAFC' },
  sendBtn: { width: 48, border: 'none', background: '#0EA47A', color: '#fff', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' },

  dropZone: { border: '2px dashed #CBD5E1', borderRadius: 16, padding: '56px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, cursor: 'pointer', transition: 'all 0.2s' },
  dropIcon: { width: 72, height: 72, borderRadius: 20, background: '#F0FDF9', color: '#0EA47A', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  dropTitle: { fontSize: 17, fontWeight: 800, color: '#0F172A' },
  dropSub: { fontSize: 13, color: '#94A3B8', fontWeight: 500, textAlign: 'center', maxWidth: 420, lineHeight: 1.7 },
  dropBtn: { border: 'none', background: '#0B1220', color: '#fff', fontSize: 14, fontWeight: 700, padding: '12px 28px', borderRadius: 11, marginTop: 12 },
  processing: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, padding: '48px 24px' },
  spinner: { width: 48, height: 48, border: '4px solid #F0FDF9', borderTopColor: '#0EA47A', borderRadius: '50%' },
  procSteps: { display: 'flex', flexDirection: 'column', gap: 12 },
  procStep: { fontSize: 14, fontWeight: 600, color: '#0EA47A' },
  doneBox: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '40px 24px' },
  doneCheck: { width: 64, height: 64, borderRadius: '50%', background: '#0EA47A', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 800 },
  doneTitle: { fontSize: 19, fontWeight: 800, color: '#0F172A' },
  doneStats: { display: 'flex', gap: 32, margin: '12px 0' },
  doneStat: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 },

  tooltip: { background: '#0B1220', padding: '10px 14px', borderRadius: 10, border: 'none' },
  tooltipLabel: { fontSize: 11, color: '#94A3B8', fontWeight: 500, fontFamily: 'Tajawal', marginBottom: 3 },
  tooltipVal: { fontSize: 14, color: '#fff', fontWeight: 700, fontFamily: 'Tajawal' },
};
