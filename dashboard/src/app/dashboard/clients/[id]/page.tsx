'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import type { Client } from '@/types';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import ChatTab from '@/components/chat/ChatTab';
import FilesTab from '@/components/files/FilesTab';
import ContractsTab from '@/components/contracts/ContractsTab';
import PaymentsTab from '@/components/payments/PaymentsTab';
import ApprovalsTab from '@/components/approvals/ApprovalsTab';
import MeetingsTab from '@/components/meetings/MeetingsTab';
import CalendarTab from '@/components/calendar/CalendarTab';
import NoWorkspace from '@/components/workspace/NoWorkspace';

const FILE_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8000';

function resolveFileUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${FILE_BASE}/storage/${url.replace(/^\/?storage\//, '')}`;
}

const TABS = ['المحادثة', 'الملفات', 'العقود', 'المدفوعات', 'الموافقات', 'الاجتماعات', 'التقويم'] as const;
type Tab = (typeof TABS)[number];

export default function ClientWorkspace() {
  const { id } = useParams();
  const router = useRouter();
  const [client, setClient] = useState<Client | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('المحادثة');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [editForm, setEditForm] = useState({ company_name: '', contact_person: '', phone: '', country: '', industry: '', notes: '' });

  const load = () => api.get(`/clients/${id}`).then(({ data }) => { setClient(data.client); setEditForm({ company_name: data.client.company_name, contact_person: data.client.contact_person, phone: data.client.phone || '', country: data.client.country || '', industry: data.client.industry || '', notes: data.client.notes || '' }); }).catch(() => {}).finally(() => setLoading(false));
  useEffect(() => { load(); }, [id]);

  const saveEdit = async () => {
    const { data } = await api.put(`/clients/${id}`, editForm).catch(() => ({ data: null }));
    if (data) { setClient(data.client); setEditing(false); }
  };

  const deleteClient = async () => {
    await api.delete(`/clients/${id}`).catch(() => {});
    window.location.href = '/dashboard/clients';
  };

  if (loading) return <div className="py-20"><LoadingSkeleton message="جاري تحميل مساحة العمل..." /></div>;
  if (!client) return <EmptyState message="العميل غير موجود" />;

  const wsId = client.workspace?.id;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border p-5">
        {editing ? (
          <div className="space-y-2">
            <div className="flex gap-2 flex-wrap">
              <input value={editForm.company_name} onChange={(e) => setEditForm({ ...editForm, company_name: e.target.value })} className="border rounded px-3 py-1 text-sm w-48" placeholder="اسم الشركة" />
              <input value={editForm.contact_person} onChange={(e) => setEditForm({ ...editForm, contact_person: e.target.value })} className="border rounded px-3 py-1 text-sm w-36" placeholder="الشخص المسؤول" />
              <input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} className="border rounded px-3 py-1 text-sm w-28" placeholder="الهاتف" />
              <input value={editForm.country} onChange={(e) => setEditForm({ ...editForm, country: e.target.value })} className="border rounded px-3 py-1 text-sm w-28" placeholder="البلد" />
              <input value={editForm.industry} onChange={(e) => setEditForm({ ...editForm, industry: e.target.value })} className="border rounded px-3 py-1 text-sm w-28" placeholder="المجال" />
              <button onClick={saveEdit} className="bg-blue-600 text-white px-3 py-1 rounded text-xs">حفظ</button>
              <button onClick={() => setEditing(false)} className="bg-zinc-100 px-3 py-1 rounded text-xs">إلغاء</button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-zinc-100 overflow-hidden border-2 border-zinc-200 flex-shrink-0">
                {client.avatar_url ? (
                  <img src={resolveFileUrl(client.avatar_url)} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-lg text-zinc-400">
                    {client.company_name?.[0] || '?'}
                  </div>
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold">{client.company_name}</h2>
                <p className="text-sm text-zinc-500">{client.contact_person} • {client.email}{client.country ? ` • ${client.country}` : ''}{client.industry ? ` • ${client.industry}` : ''}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => router.push(`/dashboard/clients/${id}/settings`)} className="text-xs bg-zinc-100 hover:bg-zinc-200 px-3 py-1.5 rounded-lg transition-colors">⚙️</button>
              <button onClick={() => setEditing(true)} className="text-xs text-blue-600 hover:underline">تعديل</button>
              <button onClick={() => setDeleteConfirm(true)} className="text-xs text-red-500 hover:underline">حذف</button>
              <span className={`px-2.5 py-1 rounded-full text-xs ${client.workspace?.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-zinc-100 text-zinc-600'}`}>
                {client.workspace?.status === 'active' ? 'مساحة عمل نشطة' : 'غير مفعلة'}
              </span>
              <span className={`px-2.5 py-1 rounded-full text-xs ${client.signed_at ? 'bg-purple-100 text-purple-700' : 'bg-zinc-100 text-zinc-600'}`}>
                {client.signed_at ? 'تم التوقيع ✅' : 'لم يتم التوقيع'}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="flex border-b overflow-x-auto">
          {TABS.map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-5 py-3 text-sm whitespace-nowrap border-b-2 transition ${activeTab === tab ? 'border-blue-600 text-blue-600 font-medium' : 'border-transparent text-zinc-500 hover:text-zinc-800'}`}>
              {tab}
            </button>
          ))}
        </div>
        <div className="p-5">
          {wsId ? <TabContent tab={activeTab} wsId={wsId} client={client} onClientRefresh={load} /> :
            <NoWorkspace client={client} />}
        </div>
      </div>

      <ConfirmDialog
        open={deleteConfirm}
        title="حذف العميل"
        message="حذف العميل نهائياً؟ لا يمكن التراجع عن هذا الإجراء."
        confirmLabel="حذف"
        cancelLabel="إلغاء"
        variant="danger"
        onConfirm={deleteClient}
        onCancel={() => setDeleteConfirm(false)}
      />
    </div>
  );
}

function TabContent({ tab, wsId, client, onClientRefresh }: { tab: Tab; wsId: number; client: Client; onClientRefresh?: () => void }) {
  const wsActive = client.workspace?.status === 'active';
  switch (tab) {
    case 'المحادثة': return <ChatTab wsId={wsId} wsActive={wsActive} />;
    case 'الملفات': return <FilesTab wsId={wsId} />;
    case 'العقود': return <ContractsTab wsId={wsId} />;
    case 'المدفوعات': return <PaymentsTab wsId={wsId} client={client} onWorkspaceUpdate={onClientRefresh} />;
    case 'الموافقات': return <ApprovalsTab wsId={wsId} />;
    case 'الاجتماعات': return <MeetingsTab wsId={wsId} />;
    case 'التقويم': return <CalendarTab wsId={wsId} />;
  }
}
