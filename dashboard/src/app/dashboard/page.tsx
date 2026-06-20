'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Link from 'next/link';

type Client = {
  id: number; company_name: string; contact_person: string; email: string;
  status: string; contract_value: string; payment_status: string; signed_at: string | null;
  workspace: { id: number; status: string } | null;
};

export default function DashboardHome() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.get('/clients').then(({ data }) => setClients(data.clients)).catch(() => {}).finally(() => setLoading(false)); }, []);

  if (loading) return <div className="text-center py-20 text-zinc-500">جاري التحميل...</div>;

  const total = clients.length;
  const activeWorkspaces = clients.filter((c) => c.workspace?.status === 'active').length;
  const pendingPayments = clients.filter((c) => c.payment_status === 'pending').length;
  const signed = clients.filter((c) => c.signed_at).length;

  const stats = [
    { label: 'إجمالي العملاء', value: total, color: 'bg-blue-500' },
    { label: 'مساحات عمل نشطة', value: activeWorkspaces, color: 'bg-green-500' },
    { label: 'مدفوعات معلقة', value: pendingPayments, color: 'bg-yellow-500' },
    { label: 'توقيع إلكتروني تم', value: signed, color: 'bg-purple-500' },
  ];

  return (
    <div className="space-y-8">
      {/* Client Segmentation */}
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

      {/* Clients List with Status Overview */}
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
