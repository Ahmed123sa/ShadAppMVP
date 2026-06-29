'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { getUser } from '@/lib/auth';
import Link from 'next/link';
import { StatusBadge } from '@/components/ui/StatusBadge';

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
      api.get('/payments/pending?per_page=30').then(({ data }) => setPendingPaymentsList(data.payments?.data || data.payments || [])).catch(() => {});
      api.get('/all-contracts?per_page=30').then(({ data }) => setAllContractsList(data.contracts?.data || data.contracts || [])).catch(() => {});
      api.get('/all-meetings?per_page=30').then(({ data }) => setAllMeetingsList(data.meetings?.data || data.meetings || [])).catch(() => {});
    } else {
      api.get('/clients').then(({ data }) => setClients(data.clients?.data || data.clients || [])).catch((err) => { console.error('DashboardHome: GET /clients failed', err); }).finally(() => setLoading(false));
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

  if (loading) return <div className="text-center py-20 text-[var(--color-text-secondary)]">جاري التحميل...</div>;

  if (isSA) {
    const totalClients = managers.reduce((sum, m) => sum + m.managed_clients_count, 0);
    const allClients = managers.flatMap((m) => m.clients || []);
    const activeWorkspaces = allClients.filter((c) => c.workspace?.status === 'active').length;
    const pendingPayments = allClients.filter((c) => c.payment_status === 'pending').length;

    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard label="إجمالي المديرين" value={managers.length} color="bg-[var(--color-primary)]" />
          <StatCard label="إجمالي العملاء" value={totalClients} color="bg-[var(--color-purple)]" />
          <StatCard label="مساحات عمل نشطة" value={activeWorkspaces} color="bg-[var(--color-success)]" />
          <StatCard label="مدفوعات معلقة" value={pendingPayments} color="bg-[var(--color-warning)]" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {managers.map((m) => (
            <div key={m.id} className="bg-[var(--color-card)] rounded-xl border border-[var(--color-card-border)] p-5 hover:border-[var(--color-primary)]/50 transition-colors cursor-pointer" onClick={() => loadManagerClients(m)}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-[var(--color-input-fill)] overflow-hidden flex-shrink-0">
                  {m.avatar_url ? (
                    <img src={resolveFileUrl(m.avatar_url)} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-sm text-[var(--color-text-secondary)]">{m.name?.[0] || '?'}</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm text-[var(--color-foreground)] truncate">{m.name}</h3>
                  <p className="text-xs text-[var(--color-text-disabled)] truncate">{m.email}</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-[var(--color-foreground)]">{m.managed_clients_count}</p>
                  <p className="text-xs text-[var(--color-text-disabled)]">عملاء</p>
                </div>
              </div>
              {selectedManager?.id === m.id && (
                <div className="border-t border-[var(--color-card-border)] pt-3 mt-1">
                  {loadingClients ? (
                    <p className="text-xs text-[var(--color-text-secondary)] text-center py-4">جاري التحميل...</p>
                  ) : (m.clients?.length ?? 0) > 0 ? (
                    <div className="space-y-1 max-h-60 overflow-y-auto">
                      {m.clients!.map((c) => (
                        <Link key={c.id} href={`/dashboard/clients/${c.id}`}
                          className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-[var(--color-card-border)] text-xs">
                          <span className="font-medium text-[var(--color-foreground)]">{c.company_name}</span>
                          <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${c.workspace?.status === 'active' ? 'bg-green-900/30 text-green-400' : 'bg-zinc-700/30 text-zinc-400'}`}>
                            {c.workspace?.status === 'active' ? 'نشط' : 'غير مفعل'}
                          </span>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[var(--color-text-secondary)] text-center py-4">لا يوجد عملاء</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        <CollapsibleSection
          title="مدفوعات معلقة"
          count={pendingPaymentsList.length}
          dotColor="bg-[var(--color-warning)]"
          open={showPendingPayments}
          onToggle={() => { setShowPendingPayments(!showPendingPayments); if (!showPendingPayments && pendingPaymentsList.length === 0) { api.get('/payments/pending?per_page=30').then(({ data }) => setPendingPaymentsList(data.payments?.data || data.payments || [])).catch(() => {}); } }}
        >
          {pendingPaymentsList.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-[var(--color-text-disabled)] border-b border-[var(--color-card-border)]">
                    <th className="text-right py-2 pr-2">العميل</th>
                    <th className="text-right py-2 pr-2">المبلغ</th>
                    <th className="text-right py-2 pr-2">العملة</th>
                    <th className="text-right py-2 pr-2">طريقة الدفع</th>
                    <th className="text-right py-2 pr-2">التاريخ</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingPaymentsList.map((p) => (
                    <tr key={p.id} className="border-b border-[var(--color-card-border)] last:border-0 hover:bg-[var(--color-card-border)]">
                      <td className="py-3 pr-2 font-medium text-[var(--color-foreground)]">{p.workspace?.client?.company_name || p.client_id}</td>
                      <td className="py-3 pr-2 text-[var(--color-text-secondary)]">{Number(p.amount).toLocaleString()}</td>
                      <td className="py-3 pr-2 text-[var(--color-text-disabled)]">{p.currency}</td>
                      <td className="py-3 pr-2">
                        <span className="bg-blue-900/30 text-blue-400 px-2 py-0.5 rounded text-xs">{p.method_type}</span>
                      </td>
                      <td className="py-3 pr-2 text-[var(--color-text-disabled)] whitespace-nowrap">{new Date(p.created_at).toLocaleDateString('ar-SA')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-[var(--color-text-secondary)] text-center py-4">لا توجد مدفوعات معلقة</p>
          )}
        </CollapsibleSection>

        <CollapsibleSection
          title="كل العقود"
          count={allContractsList.length}
          dotColor="bg-[var(--color-primary)]"
          open={showAllContracts}
          onToggle={() => setShowAllContracts(!showAllContracts)}
        >
          {allContractsList.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-[var(--color-text-disabled)] border-b border-[var(--color-card-border)]">
                    <th className="text-right py-2 pr-2">العميل</th>
                    <th className="text-right py-2 pr-2">العنوان</th>
                    <th className="text-right py-2 pr-2">القيمة</th>
                    <th className="text-right py-2 pr-2">الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {allContractsList.map((c) => (
                    <tr key={c.id} className="border-b border-[var(--color-card-border)] last:border-0 hover:bg-[var(--color-card-border)]">
                      <td className="py-3 pr-2 font-medium text-[var(--color-foreground)]">{c.workspace?.client?.company_name || '—'}</td>
                      <td className="py-3 pr-2 text-[var(--color-text-secondary)]">{c.title}</td>
                      <td className="py-3 pr-2 text-[var(--color-text-disabled)]">{Number(c.value).toLocaleString()} {c.currency}</td>
                      <td className="py-3 pr-2"><StatusBadge status={c.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-[var(--color-text-secondary)] text-center py-4">لا توجد عقود</p>
          )}
        </CollapsibleSection>

        <CollapsibleSection
          title="كل الاجتماعات"
          count={allMeetingsList.length}
          dotColor="bg-[var(--color-purple)]"
          open={showAllMeetings}
          onToggle={() => setShowAllMeetings(!showAllMeetings)}
        >
          {allMeetingsList.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-[var(--color-text-disabled)] border-b border-[var(--color-card-border)]">
                    <th className="text-right py-2 pr-2">العميل</th>
                    <th className="text-right py-2 pr-2">العنوان</th>
                    <th className="text-right py-2 pr-2">التاريخ</th>
                    <th className="text-right py-2 pr-2">الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {allMeetingsList.map((m) => (
                    <tr key={m.id} className="border-b border-[var(--color-card-border)] last:border-0 hover:bg-[var(--color-card-border)]">
                      <td className="py-3 pr-2 font-medium text-[var(--color-foreground)]">{m.workspace?.client?.company_name || '—'}</td>
                      <td className="py-3 pr-2 text-[var(--color-text-secondary)]">{m.title}</td>
                      <td className="py-3 pr-2 text-[var(--color-text-disabled)] whitespace-nowrap">{m.scheduled_at ? new Date(m.scheduled_at).toLocaleDateString('ar-SA') : '—'}</td>
                      <td className="py-3 pr-2"><StatusBadge status={m.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-[var(--color-text-secondary)] text-center py-4">لا توجد اجتماعات</p>
          )}
        </CollapsibleSection>
      </div>
    );
  }

  const stats = [
    { label: 'إجمالي العملاء', value: clients.length, color: 'bg-[var(--color-primary)]' },
    { label: 'مساحات عمل نشطة', value: clients.filter((c) => c.workspace?.status === 'active').length, color: 'bg-[var(--color-success)]' },
    { label: 'مدفوعات معلقة', value: clients.filter((c) => c.payment_status === 'pending').length, color: 'bg-[var(--color-warning)]' },
    { label: 'توقيع إلكتروني تم', value: clients.filter((c) => c.signed_at).length, color: 'bg-[var(--color-purple)]' },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <StatCard key={s.label} label={s.label} value={s.value} color={s.color} />
        ))}
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4 text-[var(--color-foreground)]">قائمة العملاء</h2>
        <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-card-border)] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-card-border)] border-b border-[var(--color-card-border)]">
              <tr>
                <th className="text-right p-4 font-medium text-[var(--color-text-secondary)]">الشركة</th>
                <th className="text-right p-4 font-medium text-[var(--color-text-secondary)]">الشخص المسؤول</th>
                <th className="text-right p-4 font-medium text-[var(--color-text-secondary)]">حالة التعاقد</th>
                <th className="text-right p-4 font-medium text-[var(--color-text-secondary)]">حالة الدفع</th>
                <th className="text-right p-4 font-medium text-[var(--color-text-secondary)]">التوقيع</th>
                <th className="text-right p-4 font-medium text-[var(--color-text-secondary)]">مساحة العمل</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id} className="border-b border-[var(--color-card-border)] hover:bg-[var(--color-card-border)]">
                  <td className="p-4">
                    <Link href={`/dashboard/clients/${c.id}`} className="text-[var(--color-gold)] hover:underline font-medium">{c.company_name}</Link>
                  </td>
                  <td className="p-4 text-[var(--color-text-secondary)]">{c.contact_person}</td>
                  <td className="p-4"><StatusBadge status={c.workspace ? 'active' : 'inactive'} /></td>
                  <td className="p-4"><StatusBadge status={c.payment_status || 'inactive'} /></td>
                  <td className="p-4 text-[var(--color-foreground)]">{c.signed_at ? '✅ تم' : '⏳ لم يتم'}</td>
                  <td className="p-4"><StatusBadge status={c.workspace?.status || 'inactive'} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-card-border)] p-5">
      <div className="flex items-center gap-2 mb-1">
        <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
        <span className="text-sm text-[var(--color-text-secondary)]">{label}</span>
      </div>
      <p className="text-3xl font-bold text-[var(--color-foreground)]">{value}</p>
    </div>
  );
}

function CollapsibleSection({ title, count, dotColor, open, onToggle, children }: {
  title: string; count: number; dotColor: string; open: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-card-border)]">
      <button onClick={onToggle} className="w-full flex items-center justify-between p-5 hover:bg-[var(--color-card-border)] transition-colors rounded-xl">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />
          <span className="font-medium text-[var(--color-foreground)]">{title}</span>
          <span className="text-xs bg-[var(--color-card-border)] text-[var(--color-text-secondary)] px-2 py-0.5 rounded-full">{count}</span>
        </div>
        <svg className={`w-5 h-5 text-[var(--color-text-disabled)] transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </button>
      {open && <div className="border-t border-[var(--color-card-border)] px-5 pb-5 pt-3">{children}</div>}
    </div>
  );
}
