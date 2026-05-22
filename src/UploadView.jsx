// ============================================================================
// UploadView connecté au backend réel.
// Remplace la version factice (mock) dans App.jsx.
// Configure l'URL du backend via la constante API_BASE.
// ============================================================================
import React, { useState, useRef } from 'react';
import { Upload, CheckCircle2, AlertCircle, FileText, Loader2 } from 'lucide-react';

// En dev local : http://localhost:8000
// En prod : l'URL de ton backend déployé (Railway, Render, etc.)
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

const fmt = (n) => new Intl.NumberFormat('ar-SA').format(Math.abs(Math.round(n)));

export default function UploadView() {
  const [state, setState] = useState('idle'); // idle | uploading | done | error
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    setState('uploading');
    setErrorMsg('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API_BASE}/api/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Échec du traitement');
      }
      setResult(data);
      setState('done');
    } catch (err) {
      setErrorMsg(err.message || 'Erreur de connexion au serveur');
      setState('error');
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    handleFile(file);
  };

  const reset = () => {
    setState('idle');
    setResult(null);
    setErrorMsg('');
  };

  return (
    <div className="fade-in">
      <div style={s.pageHead}>
        <h1 style={s.pageTitle}>رفع كشف حساب</h1>
        <p style={s.pageSub}>ادعم أي بنك سعودي — يفهم النظام البنية تلقائياً</p>
      </div>

      <div style={s.card}>
        {state === 'idle' && (
          <div
            style={{ ...s.dropZone, ...(dragOver ? s.dropZoneActive : {}) }}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.tsv,.xlsx,.xls"
              style={{ display: 'none' }}
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
            <div style={s.dropIcon}><Upload size={32} /></div>
            <div style={s.dropTitle}>اسحب ملف الكشف هنا أو انقر للرفع</div>
            <div style={s.dropSub}>يدعم CSV و Excel من الراجحي، الأهلي، الإنماء، وغيرها · تواريخ هجرية وميلادية</div>
            <button style={s.dropBtn}>اختر ملفاً</button>
          </div>
        )}

        {state === 'uploading' && (
          <div style={s.center}>
            <Loader2 size={48} className="spinner" style={{ color: '#0EA47A' }} />
            <div style={s.procText}>جارٍ المعالجة…</div>
            <div style={s.procSub}>قراءة الملف · توحيد البيانات · تصنيف المعاملات</div>
          </div>
        )}

        {state === 'done' && result && (
          <div style={s.center}>
            <CheckCircle2 size={56} style={{ color: '#0EA47A' }} />
            <div style={s.doneTitle}>تمت المعالجة بنجاح</div>
            <div style={s.detectBadge}>
              <FileText size={14} />
              {result.filename} · النمط المكتشف: <b>{modeLabel(result.detected.mode)}</b>
            </div>
            <div style={s.statsRow}>
              <Stat n={result.summary.total} l="معاملة" />
              <Stat n={result.summary.classified} l="صُنّفت تلقائياً" c="#0EA47A" />
              <Stat n={result.summary.needs_review} l="بحاجة تأكيد" c="#D97706" />
            </div>
            <div style={s.flowRow}>
              <div style={s.flowItem}>
                <span style={s.flowLabel}>إجمالي الداخل</span>
                <span style={{ ...s.flowVal, color: '#0EA47A' }}>+{fmt(result.summary.inflow)} ر.س</span>
              </div>
              <div style={s.flowItem}>
                <span style={s.flowLabel}>إجمالي الخارج</span>
                <span style={{ ...s.flowVal, color: '#EF4444' }}>−{fmt(result.summary.outflow)} ر.س</span>
              </div>
            </div>
            <button onClick={reset} style={s.dropBtn}>رفع ملف آخر</button>
          </div>
        )}

        {state === 'error' && (
          <div style={s.center}>
            <AlertCircle size={48} style={{ color: '#EF4444' }} />
            <div style={s.doneTitle}>تعذّر رفع الملف</div>
            <div style={s.errorBox}>{errorMsg}</div>
            <button onClick={reset} style={s.dropBtn}>إعادة المحاولة</button>
          </div>
        )}
      </div>
    </div>
  );
}

function modeLabel(mode) {
  return { split: 'مدين/دائن منفصل', signed: 'مبلغ موحّد', typed: 'مبلغ + نوع', unknown: 'غير معروف' }[mode] || mode;
}

function Stat({ n, l, c }) {
  return (
    <div style={s.stat}>
      <b style={{ ...s.statN, color: c || '#0F172A' }}>{n}</b>
      <span style={s.statL}>{l}</span>
    </div>
  );
}

const s = {
  pageHead: { marginBottom: 28 },
  pageTitle: { fontSize: 27, fontWeight: 800, color: '#0F172A', marginBottom: 4 },
  pageSub: { fontSize: 14.5, color: '#64748B', fontWeight: 500 },
  card: { background: '#fff', borderRadius: 18, padding: 24, border: '1px solid #EceFf3' },
  dropZone: { border: '2px dashed #CBD5E1', borderRadius: 16, padding: '56px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, cursor: 'pointer', transition: 'all 0.2s' },
  dropZoneActive: { borderColor: '#0EA47A', background: '#F0FDF9' },
  dropIcon: { width: 72, height: 72, borderRadius: 20, background: '#F0FDF9', color: '#0EA47A', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  dropTitle: { fontSize: 17, fontWeight: 800, color: '#0F172A' },
  dropSub: { fontSize: 13, color: '#94A3B8', fontWeight: 500, textAlign: 'center', maxWidth: 420, lineHeight: 1.7 },
  dropBtn: { border: 'none', background: '#0B1220', color: '#fff', fontSize: 14, fontWeight: 700, padding: '12px 28px', borderRadius: 11, marginTop: 12, cursor: 'pointer' },
  center: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '40px 24px' },
  procText: { fontSize: 18, fontWeight: 800, color: '#0F172A', marginTop: 8 },
  procSub: { fontSize: 13, color: '#94A3B8', fontWeight: 500 },
  doneTitle: { fontSize: 20, fontWeight: 800, color: '#0F172A', marginTop: 4 },
  detectBadge: { display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: '#475569', fontWeight: 600, background: '#F4F7FA', padding: '8px 14px', borderRadius: 10 },
  statsRow: { display: 'flex', gap: 32, margin: '8px 0' },
  stat: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 },
  statN: { fontSize: 26, fontWeight: 800 },
  statL: { fontSize: 12.5, color: '#94A3B8', fontWeight: 600 },
  flowRow: { display: 'flex', gap: 16, width: '100%', maxWidth: 420 },
  flowItem: { flex: 1, display: 'flex', flexDirection: 'column', gap: 4, background: '#F8FAFC', padding: '14px 16px', borderRadius: 12 },
  flowLabel: { fontSize: 12, color: '#94A3B8', fontWeight: 600 },
  flowVal: { fontSize: 16, fontWeight: 800 },
  errorBox: { fontSize: 13.5, color: '#DC2626', background: '#FEF2F2', padding: '12px 18px', borderRadius: 11, fontWeight: 600, textAlign: 'center', maxWidth: 420 },
};
