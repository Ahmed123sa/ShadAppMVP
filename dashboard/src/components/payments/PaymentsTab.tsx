'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { getUser } from '@/lib/auth';
import type { Client } from '@/types';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';

export default function PaymentsTab({ wsId, client, onWorkspaceUpdate }: { wsId: number; client: Client; onWorkspaceUpdate?: (ws: any) => void }) {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const user = getUser();
  const canReview = user?.role === 'super_admin' || user?.role === 'account_manager';

  useEffect(() => {
    const load = () => api.get(`/workspaces/${wsId}/payments`).then(({ data }) => {
      setPayments(data.payments || []);
    }).catch(() => {});
    load().finally(() => setLoading(false));
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [wsId]);

  const methodLabels: Record<string, string> = {
    bank_transfer: 'تحويل بنكي', swift: 'SWIFT', corporate_account: 'حساب شركة',
    instapay: 'Instapay', vodafone_cash: 'فودافون كاش', mobile_wallet: 'محفظة موبايل',
  };

  const reviewPayment = async (pid: number, action: string) => {
    const { data } = await api.post(`/payments/${pid}/review`, { action }).catch(() => ({ data: null }));
    if (data?.payment) {
      setPayments((prev) => prev.map((p) => p.id === pid ? data.payment : p));
      if (data?.workspace && onWorkspaceUpdate) onWorkspaceUpdate(data.workspace);
    }
  };

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="space-y-4">
      <p className="text-xs text-zinc-400">نسبة العميل: {client?.client_type === 'individual' ? 'فردي' : 'شركة'}</p>
      {payments.length === 0 ? <EmptyState message="لا توجد مدفوعات" /> : null}
      {payments.map((p) => (
        <div key={p.id} className="border rounded-lg p-4 flex justify-between items-center">
          <div>
            <span className="font-medium">{p.amount} ر.س</span>
            <span className="text-xs text-zinc-400 mr-3">{methodLabels[p.method_type] || p.method_type}</span>
            {p.proof_file_url && <a href={p.proof_file_url} target="_blank" className="text-xs text-blue-500 mr-2 hover:underline">📎 الإثبات</a>}
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded-full text-xs ${p.status === 'approved' ? 'bg-green-100 text-green-700' : p.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
              {p.status === 'approved' ? 'مقبول' : p.status === 'rejected' ? 'مرفوض' : 'معلق'}
            </span>
            {p.status === 'pending' && canReview && (
              <div className="flex gap-1">
                <button onClick={() => reviewPayment(p.id, 'approved')} className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700">قبول</button>
                <button onClick={() => reviewPayment(p.id, 'rejected')} className="text-xs bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700">رفض</button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
