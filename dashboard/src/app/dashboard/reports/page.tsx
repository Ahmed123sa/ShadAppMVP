'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const PIE_COLORS = ['#22C55E', '#EF4444', '#EAB308'];
const STATUS_LABELS: Record<string, string> = {
  draft: 'مسودة', sent: 'مرسل', client_approved: 'موافقة عميل', client_rejected: 'رفض عميل',
  company_approved: 'موافقة شركة', completed: 'مكتمل', archived: 'مؤرشف',
};
const ACTION_LABELS: Record<string, string> = {
  'contract.created': 'إنشاء عقد',
  'contract.sent': 'إرسال عقد',
  'contract.client_approved': 'اعتماد العميل للعقد',
  'contract.client_rejected': 'رفض العميل للعقد',
  'contract.edit_requested': 'طلب تعديل العقد',
  'contract.company_approved': 'اعتماد الشركة للعقد',
  'contract.completed': 'إكمال العقد',
  'contract.archived': 'أرشفة العقد',
  'workspace.created': 'إنشاء مساحة عمل',
  'workspace.activated': 'تفعيل مساحة العمل',
  'payment.submitted': 'تقديم دفعة',
  'payment.approved': 'اعتماد دفعة',
  'payment.rejected': 'رفض دفعة',
  'approval.created': 'إنشاء طلب موافقة',
  'approval.approved': 'الموافقة على الطلب',
  'approval.rejected': 'رفض الطلب',
  'approval.edit_requested': 'طلب تعديل الموافقة',
  'file.uploaded': 'رفع ملف',
  'file.approved': 'الموافقة على الملف',
  'file.rejected': 'رفض الملف',
  'login': 'تسجيل دخول',
  'meeting.created': 'إنشاء اجتماع',
  'client.created': 'إنشاء عميل',
  'client.deleted': 'حذف عميل',
};

export default function ReportsPage() {
  const [reports, setReports] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [filters, setFilters] = useState({ action: '', user_id: '', date_from: '', date_to: '' });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadLogs = (p: number) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => { if (value) params.set(key, value); });
    params.set('page', String(p));
    api.get(`/audit-logs?${params.toString()}`).then((res) => {
      setLogs(res.data?.logs?.data || []);
      const pagination = res.data?.logs;
      setTotalPages(pagination?.last_page || 1);
    }).catch(() => {});
  };

  const load = () => {
    api.get('/reports').then(({ data }) => setReports(data)).catch(() => {});
    loadLogs(1);
    api.get('/users').then(({ data }) => setUsers(Array.isArray(data) ? data : data.users || [])).catch(() => {});
  };

  useEffect(() => { load(); }, []);

  const applyFilters = () => { setPage(1); loadLogs(1); };

  const contractsData = reports?.contracts_by_status
    ? Object.entries(reports.contracts_by_status).map(([status, count]) => ({ status: STATUS_LABELS[status] || status, count }))
    : [];

  const paymentsData = reports?.payments_by_month
    ? Object.entries(reports.payments_by_month).map(([month, amount]) => ({ month, amount }))
    : [];

  const approvalsData = reports?.approval_stats
    ? Object.entries(reports.approval_stats).map(([name, value]) => ({ name: name === 'approved' ? 'مقبول' : name === 'rejected' ? 'مرفوض' : 'معلق', value }))
    : [];

  const summaryCards = reports ? Object.entries(reports).filter(([k]) => !['contracts_by_status', 'payments_by_month', 'approval_stats'].includes(k)) : [];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">التقارير وسجل التدقيق</h2>

      {/* Filters */}
      <div className="flex gap-2 items-center flex-wrap">
        <select value={filters.action} onChange={(e) => setFilters({ ...filters, action: e.target.value })}
          className="border border-[var(--color-card-border)] rounded-lg px-3 py-2 text-sm">
          <option value="">كل الأحداث</option>
          {Object.entries(ACTION_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <select value={filters.user_id} onChange={(e) => setFilters({ ...filters, user_id: e.target.value })}
          className="border border-[var(--color-card-border)] rounded-lg px-3 py-2 text-sm">
          <option value="">كل المستخدمين</option>
          {users.map((u: any) => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>
        <input type="date" value={filters.date_from} onChange={(e) => setFilters({ ...filters, date_from: e.target.value })} className="border border-[var(--color-card-border)] rounded-lg px-3 py-2 text-sm" />
        <input type="date" value={filters.date_to} onChange={(e) => setFilters({ ...filters, date_to: e.target.value })} className="border border-[var(--color-card-border)] rounded-lg px-3 py-2 text-sm" />
        <button onClick={applyFilters} className="bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg text-sm hover:bg-[var(--color-primary-dark)]">تطبيق</button>
      </div>

      {/* Summary Cards */}
      {reports && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {summaryCards.map(([key, val]) => (
              <div key={key} className="bg-[var(--color-card)] rounded-xl border border-[var(--color-card-border)] p-4">
              <p className="text-sm text-[var(--color-text-secondary)]">{key}</p>
              <p className="text-2xl font-bold mt-1">{val as number}</p>
            </div>
          ))}
        </div>
      )}

      {/* Chart 1: Contracts by Status (Bar) */}
      {contractsData.length > 0 && (
        <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-card-border)] p-5">
          <h3 className="font-semibold mb-3">العقود حسب الحالة</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={contractsData}>
              <XAxis dataKey="status" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#2563EB" radius={[4, 4, 0, 0]} name="عدد" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Chart 2: Payments Over Time (Line) */}
      {paymentsData.length > 0 && (
        <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-card-border)] p-5">
          <h3 className="font-semibold mb-3">المدفوعات حسب الشهر</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={paymentsData}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => `${Number(value).toLocaleString()} ر.س` as any} />
              <Line type="monotone" dataKey="amount" stroke="#2563EB" strokeWidth={2} dot={{ r: 4 }} name="المبلغ" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Chart 3: Approval Stats (Pie) */}
      {approvalsData.length > 0 && (
        <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-card-border)] p-5">
          <h3 className="font-semibold mb-3">إحصائيات الموافقات</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={approvalsData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                {approvalsData.map((_, idx) => <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Audit Log */}
      <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-card-border)] p-5">
        <h3 className="font-semibold mb-3">سجل التدقيق</h3>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {logs.length === 0 && <p className="text-[var(--color-text-disabled)] text-sm">لا توجد سجلات</p>}
          {logs.map((log: any) => (
            <div key={log.id} className="flex items-center justify-between text-sm py-1 border-b border-[var(--color-card-border)] last:border-0">
              <span><span className="font-medium">{ACTION_LABELS[log.action] || log.action}</span>{log.user?.name ? <span className="text-[var(--color-text-disabled)] mr-2">بواسطة {log.user.name}</span> : null}</span>
              <span className="text-[var(--color-text-disabled)] text-xs whitespace-nowrap">{log.created_at ? new Date(log.created_at).toLocaleString('ar-SA') : '—'}</span>
            </div>
          ))}
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-4 pt-3 border-t border-[var(--color-card-border)]">
            <button onClick={() => { const p = page - 1; setPage(p); loadLogs(p); }} disabled={page <= 1}
              className="px-3 py-1.5 text-sm rounded border border-[var(--color-card-border)] hover:bg-[var(--color-card-border)] disabled:opacity-40">السابق</button>
            <span className="text-sm text-[var(--color-text-secondary)]">الصفحة {page} من {totalPages}</span>
            <button onClick={() => { const p = page + 1; setPage(p); loadLogs(p); }} disabled={page >= totalPages}
              className="px-3 py-1.5 text-sm rounded border border-[var(--color-card-border)] hover:bg-[var(--color-card-border)] disabled:opacity-40">التالي</button>
          </div>
        )}
      </div>
    </div>
  );
}
