'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const PIE_COLORS = ['#22C55E', '#EF4444', '#EAB308'];
const STATUS_LABELS: Record<string, string> = {
  draft: 'مسودة', sent: 'مرسل', client_approved: 'موافقة عميل', client_rejected: 'رفض عميل',
  company_approved: 'موافقة شركة', completed: 'مكتمل', archived: 'مؤرشف',
};

export default function ReportsPage() {
  const [reports, setReports] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const load = () => {
    api.get('/reports').then(({ data }) => setReports(data)).catch(() => {});
    api.get('/audit-logs').then(({ data }) => setLogs(data.logs || [])).catch(() => {});
  };

  useEffect(() => { load(); }, []);

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
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="border rounded-lg px-3 py-2 text-sm" />
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="border rounded-lg px-3 py-2 text-sm" />
        <button onClick={load} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">تحديث</button>
      </div>

      {/* Summary Cards */}
      {reports && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {summaryCards.map(([key, val]) => (
            <div key={key} className="bg-white rounded-xl shadow-sm border p-4">
              <p className="text-sm text-zinc-500">{key}</p>
              <p className="text-2xl font-bold mt-1">{val as number}</p>
            </div>
          ))}
        </div>
      )}

      {/* Chart 1: Contracts by Status (Bar) */}
      {contractsData.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-5">
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
        <div className="bg-white rounded-xl shadow-sm border p-5">
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
        <div className="bg-white rounded-xl shadow-sm border p-5">
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
      <div className="bg-white rounded-xl shadow-sm border p-5">
        <h3 className="font-semibold mb-3">سجل التدقيق</h3>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {logs.length === 0 && <p className="text-zinc-400 text-sm">لا توجد سجلات</p>}
          {logs.map((log: any) => (
            <div key={log.id} className="flex items-center justify-between text-sm py-1 border-b last:border-0">
              <span>{log.action}</span>
              <span className="text-zinc-400 text-xs">{log.created_at ? new Date(log.created_at).toLocaleString('ar-SA') : '—'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
