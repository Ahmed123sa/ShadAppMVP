'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';

export default function ApprovalsTab({ wsId }: { wsId: number }) {
  const [approvals, setApprovals] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/workspaces/${wsId}/approvals`).then(({ data }) => setApprovals(data.approvals || [])).catch(() => {}).finally(() => setLoading(false));
  }, [wsId]);

  const sendApproval = async () => {
    if (!title) return;
    const { data } = await api.post(`/workspaces/${wsId}/approvals`, { title, description }).catch(() => ({ data: null }));
    if (data) { setApprovals((prev) => [...prev, data.approval]); setTitle(''); setDescription(''); }
  };

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="عنوان طلب الموافقة" className="border rounded-lg px-3 py-2 text-sm w-full" />
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="الوصف (اختياري)" className="border rounded-lg px-3 py-2 text-sm w-full" rows={2} />
        <button onClick={sendApproval} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">إرسال طلب موافقة</button>
      </div>
      {approvals.length === 0 ? <EmptyState message="لا توجد طلبات موافقة" /> : null}
      {approvals.map((a) => (
        <div key={a.id} className="border rounded-lg p-4">
          <div className="flex justify-between items-start">
            <div><h4 className="font-medium">{a.title}</h4>{a.description && <p className="text-xs text-zinc-400">{a.description}</p>}</div>
            <span className={`px-2 py-0.5 rounded-full text-xs ${a.status === 'approved' ? 'bg-green-100 text-green-700' : a.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : a.status === 'rejected' ? 'bg-red-100 text-red-700' : ''}`}>
              {a.status === 'approved' ? 'تمت الموافقة' : a.status === 'pending' ? 'قيد الانتظار' : a.status === 'rejected' ? 'مرفوض' : a.status}
            </span>
          </div>
          {a.certificate && <div className="mt-2 text-xs text-blue-600"><a href={a.certificate.certificate_url} target="_blank">📄 شهادة الموافقة</a></div>}
        </div>
      ))}
    </div>
  );
}
