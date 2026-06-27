'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { getUser } from '@/lib/auth';
import Link from 'next/link';

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ company_name: '', contact_person: '', email: '', phone: '', contract_value: '', notes: '', send_email: true });
  const [newCreds, setNewCreds] = useState<any>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ company_name: '', contact_person: '', phone: '', notes: '' });
  const [createError, setCreateError] = useState('');

  useEffect(() => {
    api.get('/clients').then(({ data }) => setClients(data.clients)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const createClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    try {
      const { data } = await api.post('/clients', form);
      setClients((prev) => [data.client, ...prev]);
      setNewCreds(data.credentials);
      setShowCreate(false);
      setForm({ company_name: '', contact_person: '', email: '', phone: '', contract_value: '', notes: '', send_email: true });
    } catch (err: any) {
      setCreateError(err?.response?.data?.message || 'فشل إنشاء العميل');
    }
  };

  const startEdit = (c: any) => {
    setEditingId(c.id);
    setEditForm({ company_name: c.company_name, contact_person: c.contact_person, phone: c.phone || '', notes: c.notes || '' });
  };

  const saveEdit = async (id: number) => {
    const { data } = await api.put(`/clients/${id}`, editForm).catch(() => ({ data: null }));
    if (data) { setClients((prev) => prev.map((c) => c.id === id ? data.client : c)); setEditingId(null); }
  };

  const deleteClient = async (id: number) => {
    if (!confirm('حذف العميل؟')) return;
    const { data } = await api.delete(`/clients/${id}`).catch(() => ({ data: null }));
    if (data) setClients((prev) => prev.filter((c) => c.id !== id));
  };

  if (loading) return <div className="text-center py-20 text-zinc-500">جاري التحميل...</div>;

  const isSA = getUser()?.role === 'super_admin';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">العملاء</h2>
        {!isSA && <button onClick={() => setShowCreate(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
          + عميل جديد
        </button>}
      </div>

      {newCreds && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
          <p className="text-green-800 font-medium mb-2">تم إنشاء العميل بنجاح</p>
          <p className="text-sm text-green-700">البريد: {newCreds.email}</p>
          <p className="text-sm text-green-700">كلمة المرور: {newCreds.password}</p>
        </div>
      )}

      {showCreate && (
        <form onSubmit={createClient} className="bg-white rounded-xl shadow-sm border p-6 mb-6 space-y-4">
          {createError && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{createError}</div>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input className="border rounded-lg px-4 py-2 text-sm" placeholder="اسم الشركة" value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} required />
            <input className="border rounded-lg px-4 py-2 text-sm" placeholder="الشخص المسؤول" value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} required />
            <input className="border rounded-lg px-4 py-2 text-sm" type="email" placeholder="البريد الإلكتروني" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required dir="ltr" />
            <input className="border rounded-lg px-4 py-2 text-sm" placeholder="رقم الهاتف" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
            <input className="border rounded-lg px-4 py-2 text-sm" type="number" placeholder="قيمة العقد" value={form.contract_value} onChange={(e) => setForm({ ...form, contract_value: e.target.value })} />
            <input className="border rounded-lg px-4 py-2 text-sm" placeholder="ملاحظات" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <label className="flex items-center gap-2 text-sm text-zinc-700 cursor-pointer">
            <input type="checkbox" checked={form.send_email} onChange={(e) => setForm({ ...form, send_email: e.target.checked })} className="rounded" />
            إرسال بيانات الدخول إلى البريد الإلكتروني للعميل
          </label>
          <div className="flex gap-2">
            <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-blue-700">إنشاء</button>
            <button type="button" onClick={() => setShowCreate(false)} className="bg-zinc-100 px-6 py-2 rounded-lg text-sm hover:bg-zinc-200">إلغاء</button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 border-b">
            <tr>
              <th className="text-right p-4 font-medium">Company</th>
              <th className="text-right p-4 font-medium">Contact Person</th>
              <th className="text-right p-4 font-medium">Status</th>
              <th className="text-right p-4 font-medium">Workspace</th>
              <th className="text-left p-4 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr key={client.id} className="border-b hover:bg-zinc-50">
                {editingId === client.id ? (
                  <td colSpan={5} className="p-3">
                    <div className="flex gap-2 items-center flex-wrap">
                      <input value={editForm.company_name} onChange={(e) => setEditForm({ ...editForm, company_name: e.target.value })} className="border rounded px-2 py-1 text-sm w-40" />
                      <input value={editForm.contact_person} onChange={(e) => setEditForm({ ...editForm, contact_person: e.target.value })} className="border rounded px-2 py-1 text-sm w-32" />
                      <input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} className="border rounded px-2 py-1 text-sm w-28" />
                      <input value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} className="border rounded px-2 py-1 text-sm w-40" placeholder="ملاحظات" />
                      <button onClick={() => saveEdit(client.id)} className="bg-blue-600 text-white px-3 py-1 rounded text-xs">حفظ</button>
                      <button onClick={() => setEditingId(null)} className="bg-zinc-100 px-3 py-1 rounded text-xs">إلغاء</button>
                    </div>
                  </td>
                ) : (
                  <>
                    <td className="p-4">
                      <Link href={`/dashboard/clients/${client.id}`} className="text-blue-600 hover:underline font-medium">{client.company_name}</Link>
                    </td>
                    <td className="p-4 text-zinc-600">{client.contact_person}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${client.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-zinc-100 text-zinc-600'}`}>{client.status}</span>
                    </td>
                    <td className="p-4">{client.workspace ? (client.workspace.status === 'active' ? '🟢 نشط' : '⏳ غير مفعل') : '—'}</td>
                    <td className="p-4 text-left whitespace-nowrap">
                      {!isSA && <button onClick={() => startEdit(client)} className="text-xs text-blue-600 hover:underline ml-2">تعديل</button>}
                      {!isSA && <button onClick={() => deleteClient(client.id)} className="text-xs text-red-500 hover:underline">حذف</button>}
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
