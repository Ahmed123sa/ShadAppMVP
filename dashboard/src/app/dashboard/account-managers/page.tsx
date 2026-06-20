'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { getUser } from '@/lib/auth';

export default function AccountManagersPage() {
  const [managers, setManagers] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [newCreds, setNewCreds] = useState<any>(null);
  const user = getUser();

  const load = () => {
    api.get('/account-managers').then(({ data }) => setManagers(data.managers || [])).catch(() => {});
  };

  useEffect(() => {
    if (user?.role === 'super_admin') load();
  }, [user]);

  if (user?.role !== 'super_admin') {
    return <div className="text-center py-20 text-zinc-500">غير مصرح لك بعرض هذه الصفحة</div>;
  }

  const createManager = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data } = await api.post('/account-managers', { name, email });
    setManagers((prev) => [...prev, data.manager]);
    setNewCreds(data.credentials);
    setShowCreate(false);
    setName('');
    setEmail('');
  };

  const updateManager = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId) return;
    await api.put(`/account-managers/${editId}`, { name, email });
    load();
    setEditId(null);
    setName('');
    setEmail('');
  };

  const deleteManager = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف مدير الحسابات؟')) return;
    await api.delete(`/account-managers/${id}`);
    load();
  };

  const startEdit = (m: any) => {
    setEditId(m.id);
    setName(m.name);
    setEmail(m.email);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">المدراء</h2>
        <button onClick={() => { setShowCreate(true); setEditId(null); setName(''); setEmail(''); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">+ مدير جديد</button>
      </div>

      {newCreds && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
          <p className="text-green-800 font-medium mb-2">تم إنشاء المدير بنجاح</p>
          <p className="text-sm text-green-700">البريد: {newCreds.email}</p>
          <p className="text-sm text-green-700">كلمة المرور: {newCreds.password}</p>
          <button onClick={() => setNewCreds(null)} className="text-xs text-green-600 mt-1 hover:underline">حسناً</button>
        </div>
      )}

      {(showCreate || editId) && (
        <form onSubmit={editId ? updateManager : createManager} className="bg-white rounded-xl shadow-sm border p-6 mb-6 space-y-4">
          <input className="w-full border rounded-lg px-4 py-2 text-sm" placeholder="الاسم" value={name} onChange={(e) => setName(e.target.value)} required />
          <input className="w-full border rounded-lg px-4 py-2 text-sm" type="email" placeholder="البريد الإلكتروني" value={email} onChange={(e) => setEmail(e.target.value)} required dir="ltr" />
          <div className="flex gap-2">
            <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm">{editId ? 'تحديث' : 'إنشاء'}</button>
            <button type="button" onClick={() => { setShowCreate(false); setEditId(null); setName(''); setEmail(''); }} className="bg-zinc-100 px-6 py-2 rounded-lg text-sm">إلغاء</button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 border-b">
            <tr>
              <th className="text-right p-4 font-medium">الاسم</th>
              <th className="text-right p-4 font-medium">البريد</th>
              <th className="text-right p-4 font-medium">عدد العملاء</th>
              <th className="text-center p-4 font-medium">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {managers.map((m: any) => (
              <tr key={m.id} className="border-b">
                <td className="p-4">{m.name}</td>
                <td className="p-4">{m.email}</td>
                <td className="p-4">{m.managed_clients_count || 0}</td>
                <td className="p-4 text-center">
                  <div className="flex gap-2 justify-center">
                    <button onClick={() => startEdit(m)} className="text-xs text-blue-600 hover:underline border border-blue-200 rounded px-2 py-1">تعديل</button>
                    <button onClick={() => deleteManager(m.id)} className="text-xs text-red-600 hover:underline border border-red-200 rounded px-2 py-1">حذف</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
