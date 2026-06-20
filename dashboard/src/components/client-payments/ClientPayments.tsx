'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';

export default function ClientPayments({ wsId }: { wsId: number }) {
  const [payments, setPayments] = useState<any[]>([]);
  const [methods, setMethods] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [amount, setAmount] = useState('');
  const [methodType, setMethodType] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = () => api.get(`/workspaces/${wsId}/payments`).then(({ data }) => {
      setPayments(data.payments || []);
      setMethods(data.available_methods || []);
    }).catch(() => setError('فشل تحميل المدفوعات'));
    load().finally(() => setLoading(false));
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [wsId]);

  const methodLabels: Record<string, string> = {
    bank_transfer: 'تحويل بنكي', swift: 'SWIFT', corporate_account: 'حساب شركة',
    instapay: 'Instapay', vodafone_cash: 'فودافون كاش', mobile_wallet: 'محفظة موبايل',
  };

  const submit = async () => {
    if (!amount || !methodType) return;
    setSaving(true);
    const form = new FormData();
    form.append('amount', amount);
    form.append('method_type', methodType);
    if (proofFile) form.append('proof_file', proofFile);
    const { data } = await api.post(`/workspaces/${wsId}/payments`, form).catch(() => ({ data: null }));
    if (data) {
      setPayments((prev) => [...prev, data.payment]);
      setAmount('');
      setMethodType('');
      setProofFile(null);
    }
    setSaving(false);
  };

  if (loading) return <LoadingSkeleton />;
  if (error) return <p className="text-sm text-red-500 text-center py-8">{error}</p>;

  const pendingPayment = payments.find((p) => p.status === 'pending');

  return (
    <div className="space-y-3">
      {pendingPayment && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 space-y-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">💳</span>
            <div>
              <p className="font-medium text-blue-800">مطلوب دفع مبلغ {pendingPayment.amount} ر.س</p>
              <p className="text-xs text-blue-600 mt-0.5">يرجى رفع إثبات الدفع بعد تحويل المبلغ</p>
            </div>
          </div>
          <div className="space-y-3">
            <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" placeholder="المبلغ"
              className="border rounded-lg px-4 py-2 text-sm w-full bg-white" />
            <select value={methodType} onChange={(e) => setMethodType(e.target.value)}
              className="border rounded-lg px-4 py-2 text-sm w-full bg-white">
              <option value="">طريقة الدفع</option>
              {methods.map((m) => <option key={m} value={m}>{methodLabels[m] || m}</option>)}
            </select>
            <label className="flex items-center gap-2 text-sm text-blue-600 cursor-pointer hover:text-blue-700">
              <input type="file" accept="image/*,.pdf" className="hidden"
                onChange={(e) => setProofFile(e.target.files?.[0] || null)} />
              <span className="border border-blue-200 rounded-lg px-4 py-2 bg-white">
                {proofFile ? proofFile.name : '+ اختيار ملف الإثبات'}
              </span>
            </label>
            <button onClick={submit} disabled={saving || !amount || !methodType}
              className="w-full bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'جاري الحفظ...' : 'إرسال إثبات الدفع'}
            </button>
          </div>
        </div>
      )}

      {payments.length === 0 && !pendingPayment ? <EmptyState message="لا توجد مدفوعات" /> : null}
      {payments.map((p) => (
        <div key={p.id} className="border rounded-lg p-4 flex justify-between items-center">
          <div>
            <p className="font-medium">{p.amount} ر.س</p>
            <p className="text-xs text-zinc-400">{methodLabels[p.method_type] || p.method_type}</p>
            {p.proof_file_url && (
              <a href={p.proof_file_url} target="_blank" rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline">📎 عرض الإثبات</a>
            )}
          </div>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
            p.status === 'approved' ? 'bg-green-100 text-green-700' :
            p.status === 'rejected' ? 'bg-red-100 text-red-700' :
            'bg-yellow-100 text-yellow-700'
          }`}>
            {p.status === 'approved' ? 'مقبول' : p.status === 'rejected' ? 'مرفوض' : 'قيد المراجعة'}
          </span>
        </div>
      ))}
    </div>
  );
}
