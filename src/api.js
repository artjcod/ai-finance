// Client API centralisé — tous les appels au backend passent ici.
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

async function req(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || `Erreur ${res.status}`);
  return data;
}

export const api = {
  // Lecture
  getSummary: (uploadId) =>
    req(`/api/summary${uploadId ? `?upload_id=${uploadId}` : ''}`),
  getTransactions: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return req(`/api/transactions${q ? `?${q}` : ''}`);
  },
  getUploads: () => req('/api/uploads'),

  // Écriture
  updateTransaction: (id, payload) =>
    req(`/api/transactions/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  reclassify: (id, category = null) =>
    req(`/api/transactions/${id}/reclassify`, {
      method: 'POST',
      body: JSON.stringify({ category }),
    }),
  deleteTransaction: (id) =>
    req(`/api/transactions/${id}`, { method: 'DELETE' }),
  deleteUpload: (id) =>
    req(`/api/uploads/${id}`, { method: 'DELETE' }),
  resetAll: () => req('/api/reset', { method: 'DELETE' }),
};

// Catégories disponibles pour l'étiquetage manuel
export const CATEGORIES = [
  'رواتب', 'موردون', 'إيجارات ومرافق', 'ضريبة ق.م وزكاة',
  'تحصيل عملاء', 'رسوم بنكية', 'تشغيل أخرى', 'غير مصنّف',
];
