'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { getUser } from '@/lib/auth';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';

export default function MeetingsTab({ wsId }: { wsId: number }) {
  const [meetings, setMeetings] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [form, setForm] = useState({ title: '', date: '', time: '', duration: 30, notes: '', contract_id: '', approval_id: '' });
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/workspaces/${wsId}/meetings`).then(({ data }) => setMeetings(data.meetings?.data || data.meetings || [])).catch(() => {});
    api.get(`/workspaces/${wsId}/contracts`).then(({ data }) => setContracts(data.contracts?.data || data.contracts || [])).catch(() => {}).finally(() => setLoading(false));
  }, [wsId]);

  const create = async () => {
    if (!form.title || !form.date) return;
    const payload: any = { title: form.title, scheduled_at: `${form.date} ${form.time}`, duration_minutes: form.duration, notes: form.notes };
    if (form.contract_id) payload.contract_id = form.contract_id;
    if (form.approval_id) payload.approval_id = form.approval_id;
    const { data } = await api.post(`/workspaces/${wsId}/meetings`, payload).catch(() => ({ data: null }));
    if (data) { setMeetings((prev) => [...prev, data.meeting]); setShowForm(false); setForm({ title: '', date: '', time: '', duration: 30, notes: '', contract_id: '', approval_id: '' }); }
  };

  if (loading) return <LoadingSkeleton />;

  const isSA = getUser()?.role === 'super_admin';

  return (
    <div className="space-y-3">
      {!isSA && <button onClick={() => setShowForm(!showForm)} className="text-sm text-blue-600 hover:underline">+ اجتماع جديد</button>}
      {!isSA && showForm && (
        <div className="space-y-2 border rounded-lg p-4 bg-zinc-50">
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="عنوان الاجتماع" className="border rounded-lg px-3 py-2 text-sm w-full" />
          <div className="flex gap-2">
            <input value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} type="date" className="border rounded-lg px-3 py-2 text-sm flex-1" />
            <input value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} type="time" className="border rounded-lg px-3 py-2 text-sm flex-1" />
          </div>
          <select value={form.contract_id} onChange={(e) => setForm({ ...form, contract_id: e.target.value })} className="border rounded-lg px-3 py-2 text-sm w-full">
            <option value="">العقد المرتبط (اختياري)</option>
            {contracts.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
          <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="ملاحظات" className="border rounded-lg px-3 py-2 text-sm w-full" rows={2} />
          <button onClick={create} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">حفظ</button>
        </div>
      )}
      {meetings.length === 0 ? <EmptyState message="لا توجد اجتماعات" /> : null}
      {meetings.map((m) => (
        <div key={m.id} className="border rounded-lg p-4 flex justify-between items-center">
          <div>
            <h4 className="font-medium">{m.title}</h4>
            <p className="text-xs text-zinc-400">{m.scheduled_at ? new Date(m.scheduled_at).toLocaleDateString('ar-SA') : ''} {m.duration_minutes}د{m.contract ? ` • ${m.contract.title}` : ''}{m.notes ? ` • ${m.notes}` : ''}</p>
          </div>
          <StatusBadge status={m.status} />
        </div>
      ))}
    </div>
  );
}
