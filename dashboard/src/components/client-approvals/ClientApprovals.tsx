'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

export default function ClientApprovals({ wsId, clientId }: { wsId: number; clientId: number }) {
  const [approvals, setApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [respondData, setRespondData] = useState<{ id: number; action: string } | null>(null);
  const [signature, setSignature] = useState('');

  useEffect(() => {
    api.get(`/workspaces/${wsId}/approvals`)
      .then(({ data }) => setApprovals(data.approvals || []))
      .catch(() => setError('فشل تحميل طلبات الموافقة'))
      .finally(() => setLoading(false));
  }, [wsId]);

  const respond = async () => {
    if (!respondData) return;
    const body: any = { action: respondData.action };
    if (respondData.action === 'approved' && signature.trim()) body.signature = signature.trim();
    const { data } = await api.post(`/approvals/${respondData.id}/respond`, body).catch(() => ({ data: null }));
    if (data) {
      setApprovals((prev) => prev.map((a) => a.id === respondData.id ? data.approval : a));
    }
    setRespondData(null);
    setSignature('');
  };

  if (loading) return <LoadingSkeleton />;
  if (error) return <p className="text-sm text-red-500 text-center py-8">{error}</p>;

  return (
    <div className="space-y-3">
      {approvals.length === 0 ? <EmptyState message="لا توجد طلبات موافقة" /> : null}
      {approvals.map((a) => (
        <div key={a.id} className="border rounded-lg p-4">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-medium">{a.title}</h4>
              {a.description && <p className="text-xs text-zinc-400 mt-0.5">{a.description}</p>}
              <p className="text-xs text-zinc-400 mt-0.5">المرجع: {a.reference_no}</p>
            </div>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
              a.status === 'approved' ? 'bg-green-100 text-green-700' :
              a.status === 'rejected' ? 'bg-red-100 text-red-700' :
              a.status === 'edit_requested' ? 'bg-amber-100 text-amber-700' :
              'bg-yellow-100 text-yellow-700'
            }`}>
              {a.status === 'approved' ? 'تمت الموافقة' :
               a.status === 'rejected' ? 'مرفوض' :
               a.status === 'edit_requested' ? 'طلب تعديل' : 'قيد الانتظار'}
            </span>
          </div>

          {a.certificate && (
            <div className="mt-2 text-xs text-blue-600">
              📄 <a href={a.certificate.pdf_url || a.certificate.certificate_url} target="_blank" rel="noopener noreferrer" className="hover:underline">شهادة الموافقة</a>
            </div>
          )}

          {a.status === 'pending' && (
            <div className="mt-3 flex gap-2">
              <button onClick={() => setRespondData({ id: a.id, action: 'approved' })}
                className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700">✔ موافقة</button>
              <button onClick={() => setRespondData({ id: a.id, action: 'rejected' })}
                className="text-xs bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700">✘ رفض</button>
              <button onClick={() => setRespondData({ id: a.id, action: 'edit_requested' })}
                className="text-xs bg-amber-600 text-white px-3 py-1.5 rounded-lg hover:bg-amber-700">طلب تعديل</button>
            </div>
          )}
        </div>
      ))}

      <ConfirmDialog
        open={!!respondData}
        title={respondData?.action === 'approved' ? 'موافقة' : respondData?.action === 'rejected' ? 'رفض' : 'طلب تعديل'}
        message={
          respondData?.action === 'approved'
            ? 'تأكيد الموافقة على هذا الطلب؟'
            : respondData?.action === 'rejected'
            ? 'تأكيد رفض هذا الطلب؟'
            : 'تأكيد طلب تعديل هذا الطلب؟'
        }
        confirmLabel="تأكيد"
        cancelLabel="إلغاء"
        variant={respondData?.action === 'rejected' ? 'danger' : 'default'}
        onConfirm={() => {
          if (respondData?.action === 'approved') {
            setRespondData(null); setSignature('');
          } else {
            respond();
          }
        }}
        onCancel={() => { setRespondData(null); setSignature(''); }}
      />

      {respondData?.action === 'approved' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => { setRespondData(null); setSignature(''); }}>
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold">التوقيع على الموافقة</h3>
            <p className="text-xs text-zinc-500">اكتب اسمك كاملاً للتوقيع على الموافقة</p>
            <textarea value={signature} onChange={(e) => setSignature(e.target.value)}
              className="border rounded-lg px-4 py-3 text-lg font-medium w-full h-20 text-center"
              placeholder="اكتب اسمك هنا..." />
            <button onClick={respond} disabled={!signature.trim()}
              className="w-full bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              تأكيد التوقيع والموافقة
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
