'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { getUser } from '@/lib/auth';
import Link from 'next/link';

type Client = {
  id: number; company_name: string; contact_person: string; email: string;
  status: string; contract_value: string; payment_status: string; signed_at: string | null;
  workspace: { id: number; status: string } | null;
};

type Manager = {
  id: number; name: string; email: string; avatar_url: string | null;
  managed_clients_count: number;
  clients?: Client[];
};

const FILE_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8000';

function resolveFileUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${FILE_BASE}/storage/${url.replace(/^\/?storage\//, '')}`;
}

export default function DashboardHome() {
  const isSA = getUser()?.role === 'super_admin';
  const [clients, setClients] = useState<Client[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [selectedManager, setSelectedManager] = useState<Manager | null>(null);
  const [pendingPaymentsList, setPendingPaymentsList] = useState<any[]>([]);
  const [allContractsList, setAllContractsList] = useState<any[]>([]);
  const [allMeetingsList, setAllMeetingsList] = useState<any[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [showPendingPayments, setShowPendingPayments] = useState(false);
  const [showAllContracts, setShowAllContracts] = useState(false);
  const [showAllMeetings, setShowAllMeetings] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingClients, setLoadingClients] = useState(false);

  useEffect(() => {
    if (isSA) {
      api.get('/account-managers').then(({ data }) => setManagers(data.managers)).catch(() => {}).finally(() => setLoading(false));
      api.get('/payments/pending').then(({ data }) => setPendingPaymentsList(data.payments)).catch(() => {});
      api.get('/all-contracts').then(({ data }) => setAllContractsList(data.contracts)).catch(() => {});
      api.get('/all-meetings').then(({ data }) => setAllMeetingsList(data.meetings)).catch(() => {});
    } else {
      api.get('/clients').then(({ data }) => setClients(data.clients)).catch(() => {}).finally(() => setLoading(false));
    }
  }, [isSA]);

  const loadManagerClients = async (m: Manager) => {
    setLoadingClients(true);
    setSelectedManager(m);
    try {
      const { data } = await api.get(`/account-managers/${m.id}`);
      setManagers((prev) => prev.map((am) => am.id === m.id ? { ...am, clients: data.clients } : am));
    } catch {}
    setLoadingClients(false);
  };

  if (loading) return <div className="text-center py-20 text-zinc-500">جاري التحميل...</div>;

  if (isSA) {
    const totalClients = managers.reduce((sum, m) => sum + m.managed_clients_count, 0);
    const allClients = managers.flatMap((m) => m.clients || []);
    const activeWorkspaces = allClients.filter((c) => c.workspace?.status === 'active').length;
    const pendingPayments = allClients.filter((c) => c.payment_status === 'pending').length;

    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <div className="flex items-center gap-2 mb-1"><div className="w-2.5 h-2.5 rounded-full bg-blue-500" /><span className="text-sm text-zinc-500">إجمالي المديرين</span></div>
            <p className="text-3xl font-bold">{managers.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <div className="flex items-center gap-2 mb-1"><div className="w-2.5 h-2.5 rounded-full bg-indigo-500" /><span className="text-sm text-zinc-500">إجمالي العملاء</span></div>
            <p className="text-3xl font-bold">{totalClients}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <div className="flex items-center gap-2 mb-1"><div className="w-2.5 h-2.5 rounded-full bg-green-500" /><span className="text-sm text-zinc-500">مساحات عمل نشطة</span></div>
            <p className="text-3xl font-bold">{activeWorkspaces}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <div className="flex items-center gap-2 mb-1"><div className="w-2.5 h-2.5 rounded-full bg-yellow-500" /><span className="text-sm text-zinc-500">مدفوعات معلقة</span></div>
            <p className="text-3xl font-bold">{pendingPayments}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {managers.map((m) => (
            <div key={m.id} className="bg-white rounded-xl shadow-sm border p-5 hover:shadow-md transition-shadow cursor-pointer" onClick={() => loadManagerClients(m)}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-zinc-100 overflow-hidden flex-shrink-0">
                  {m.avatar_url ? (
                    <img src={resolveFileUrl(m.avatar_url)} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-sm text-zinc-400">{m.name?.[0] || '?'}</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm truncate">{m.name}</h3>
                  <p className="text-xs text-zinc-400 truncate">{m.email}</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold">{m.managed_clients_count}</p>
                  <p className="text-xs text-zinc-400">عملاء</p>
                </div>
              </div>
              {selectedManager?.id === m.id && (
                <div className="border-t pt-3 mt-1">
                  {loadingClients ? (
                    <p className="text-xs text-zinc-400 text-center py-4">جاري التحميل...</p>
                  ) : (m.clients?.length ?? 0) > 0 ? (
                    <div className="space-y-1 max-h-60 overflow-y-auto">
                      {m.clients!.map((c) => (
                        <Link key={c.id} href={`/dashboard/clients/${c.id}`}
                          className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-zinc-50 text-xs">
                          <span className="font-medium text-zinc-700">{c.company_name}</span>
                          <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${c.workspace?.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-zinc-100 text-zinc-500'}`}>
                            {c.workspace?.status === 'active' ? 'نشط' : 'غير مفعل'}
                          </span>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-400 text-center py-4">لا يوجد عملاء</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm border">
          <button
            onClick={() => { setShowPendingPayments(!showPendingPayments); if (!showPendingPayments && pendingPaymentsList.length === 0) { api.get('/payments/pending').then(({ data }) => setPendingPaymentsList(data.payments)).catch(() => {}); } }}
            className="w-full flex items-center justify-between p-5 hover:bg-zinc-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
              <span className="font-medium">مدفوعات معلقة</span>
              <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">{pendingPaymentsList.length}</span>
            </div>
            <svg className={`w-5 h-5 text-zinc-400 transition-transform ${showPendingPayments ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </button>
          {showPendingPayments && (
            <div className="border-t px-5 pb-5 pt-3">
              {loadingPayments ? (
                <p className="text-xs text-zinc-400 text-center py-4">جاري التحميل...</p>
              ) : pendingPaymentsList.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-zinc-400 border-b">
                        <th className="text-right py-2 pr-2">العميل</th>
                        <th className="text-right py-2 pr-2">المبلغ</th>
                        <th className="text-right py-2 pr-2">العملة</th>
                        <th className="text-right py-2 pr-2">طريقة الدفع</th>
                        <th className="text-right py-2 pr-2">التاريخ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingPaymentsList.map((p) => (
                        <tr key={p.id} className="border-b last:border-0 hover:bg-zinc-50">
                          <td className="py-3 pr-2 font-medium text-zinc-700">{p.workspace?.client?.company_name || p.client_id}</td>
                          <td className="py-3 pr-2 text-zinc-600">{Number(p.amount).toLocaleString()}</td>
                          <td className="py-3 pr-2 text-zinc-500">{p.currency}</td>
                          <td className="py-3 pr-2 text-zinc-500">
                            <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-xs">{p.method_type}</span>
                          </td>
                          <td className="py-3 pr-2 text-zinc-500 whitespace-nowrap">{new Date(p.created_at).toLocaleDateString('ar-SA')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-zinc-400 text-center py-4">لا توجد مدفوعات معلقة</p>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border">
          <button
            onClick={() => setShowAllContracts(!showAllContracts)}
            className="w-full flex items-center justify-between p-5 hover:bg-zinc-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span className="font-medium">كل العقود</span>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{allContractsList.length}</span>
            </div>
            <svg className={`w-5 h-5 text-zinc-400 transition-transform ${showAllContracts ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </button>
          {showAllContracts && (
            <div className="border-t px-5 pb-5 pt-3">
              {allContractsList.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-zinc-400 border-b">
                        <th className="text-right py-2 pr-2">العميل</th>
                        <th className="text-right py-2 pr-2">العنوان</th>
                        <th className="text-right py-2 pr-2">القيمة</th>
                        <th className="text-right py-2 pr-2">الحالة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allContractsList.map((c) => (
                        <tr key={c.id} className="border-b last:border-0 hover:bg-zinc-50">
                          <td className="py-3 pr-2 font-medium text-zinc-700">{c.workspace?.client?.company_name || '—'}</td>
                          <td className="py-3 pr-2 text-zinc-600">{c.title}</td>
                          <td className="py-3 pr-2 text-zinc-500">{Number(c.value).toLocaleString()} {c.currency}</td>
                          <td className="py-3 pr-2">
                            <span className={`px-2 py-0.5 rounded-full text-xs ${c.status === 'completed' ? 'bg-green-100 text-green-700' : c.status === 'sent' ? 'bg-yellow-100 text-yellow-700' : 'bg-zinc-100 text-zinc-600'}`}>
                              {c.status === 'draft' ? 'مسودة' : c.status === 'sent' ? 'مرسل' : c.status === 'client_approved' ? 'موافقة العميل' : c.status === 'company_approved' ? 'اعتماد الشركة' : c.status === 'completed' ? 'مكتمل' : c.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-zinc-400 text-center py-4">لا توجد عقود</p>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border">
          <button
            onClick={() => setShowAllMeetings(!showAllMeetings)}
            className="w-full flex items-center justify-between p-5 hover:bg-zinc-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
              <span className="font-medium">كل الاجتماعات</span>
              <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">{allMeetingsList.length}</span>
            </div>
            <svg className={`w-5 h-5 text-zinc-400 transition-transform ${showAllMeetings ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </button>
          {showAllMeetings && (
            <div className="border-t px-5 pb-5 pt-3">
              {allMeetingsList.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-zinc-400 border-b">
                        <th className="text-right py-2 pr-2">العميل</th>
                        <th className="text-right py-2 pr-2">العنوان</th>
                        <th className="text-right py-2 pr-2">التاريخ</th>
                        <th className="text-right py-2 pr-2">الحالة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allMeetingsList.map((m) => (
                        <tr key={m.id} className="border-b last:border-0 hover:bg-zinc-50">
                          <td className="py-3 pr-2 font-medium text-zinc-700">{m.workspace?.client?.company_name || '—'}</td>
                          <td className="py-3 pr-2 text-zinc-600">{m.title}</td>
                          <td className="py-3 pr-2 text-zinc-500 whitespace-nowrap">{m.scheduled_at ? new Date(m.scheduled_at).toLocaleDateString('ar-SA') : '—'}</td>
                          <td className="py-3 pr-2">
                            <span className={`px-2 py-0.5 rounded-full text-xs ${m.status === 'completed' ? 'bg-green-100 text-green-700' : m.status === 'scheduled' ? 'bg-blue-100 text-blue-700' : 'bg-zinc-100 text-zinc-600'}`}>
                              {m.status === 'scheduled' ? 'مجدول' : m.status === 'completed' ? 'مكتمل' : m.status === 'cancelled' ? 'ملغي' : m.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-zinc-400 text-center py-4">لا توجد اجتماعات</p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  const stats = [
    { label: 'إجمالي العملاء', value: clients.length, color: 'bg-blue-500' },
    { label: 'مساحات عمل نشطة', value: clients.filter((c) => c.workspace?.status === 'active').length, color: 'bg-green-500' },
    { label: 'مدفوعات معلقة', value: clients.filter((c) => c.payment_status === 'pending').length, color: 'bg-yellow-500' },
    { label: 'توقيع إلكتروني تم', value: clients.filter((c) => c.signed_at).length, color: 'bg-purple-500' },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl shadow-sm border p-5">
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-2.5 h-2.5 rounded-full ${s.color}`} />
              <span className="text-sm text-zinc-500">{s.label}</span>
            </div>
            <p className="text-3xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">قائمة العملاء</h2>
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 border-b">
              <tr>
                <th className="text-right p-4 font-medium">الشركة</th>
                <th className="text-right p-4 font-medium">الشخص المسؤول</th>
                <th className="text-right p-4 font-medium">حالة التعاقد</th>
                <th className="text-right p-4 font-medium">حالة الدفع</th>
                <th className="text-right p-4 font-medium">التوقيع</th>
                <th className="text-right p-4 font-medium">مساحة العمل</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id} className="border-b hover:bg-zinc-50">
                  <td className="p-4">
                    <Link href={`/dashboard/clients/${c.id}`} className="text-blue-600 hover:underline font-medium">{c.company_name}</Link>
                  </td>
                  <td className="p-4 text-zinc-600">{c.contact_person}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${c.workspace ? 'bg-green-100 text-green-700' : 'bg-zinc-100 text-zinc-600'}`}>
                      {c.workspace ? 'متعاقد' : 'غير متعاقد'}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${c.payment_status === 'approved' ? 'bg-green-100 text-green-700' : c.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-zinc-100 text-zinc-600'}`}>
                      {c.payment_status === 'approved' ? 'مدفوع' : c.payment_status === 'pending' ? 'معلق' : '—'}
                    </span>
                  </td>
                  <td className="p-4">{c.signed_at ? '✅ تم' : '⏳ لم يتم'}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${c.workspace?.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-zinc-100 text-zinc-600'}`}>
                      {c.workspace?.status === 'active' ? 'نشط' : 'غير مفعل'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
