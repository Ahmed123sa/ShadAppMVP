'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { getUser } from '@/lib/auth';
import PasswordField from '@/components/ui/PasswordField';

export default function AccountManagersPage() {
  const [managers, setManagers] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [autoPassword, setAutoPassword] = useState(true);
  const [newCreds, setNewCreds] = useState<any>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
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

  const resetForm = () => {
    setName('');
    setEmail('');
    setPhone('');
    setPassword('');
    setAutoPassword(true);
  };

  const createManager = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload: any = { name, email, phone };
      if (autoPassword) {
        payload.password = null;
      } else {
        payload.password = password;
      }
      const { data } = await api.post('/account-managers', payload);
      setManagers((prev) => [...prev, data.manager]);
      setNewCreds(data.credentials);
      setShowCreate(false);
      resetForm();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.response?.data?.errors?.password?.[0] || 'فشل إنشاء المدير');
    } finally {
      setSaving(false);
    }
  };

  const updateManager = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId) return;
    setError('');
    setSaving(true);
    try {
      const payload: any = { name, email, phone };
      if (password) payload.password = password;
      await api.put(`/account-managers/${editId}`, payload);
      load();
      setEditId(null);
      resetForm();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'فشل تحديث المدير');
    } finally {
      setSaving(false);
    }
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
    setPhone(m.phone || '');
    setPassword('');
    setAutoPassword(true);
  };

  const openCreate = () => {
    setShowCreate(true);
    setEditId(null);
    resetForm();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">المدراء</h2>
        <button onClick={openCreate} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">+ مدير جديد</button>
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
          {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{error}</div>}
          <input className="w-full border rounded-lg px-4 py-2 text-sm" placeholder="الاسم" value={name} onChange={(e) => setName(e.target.value)} required />
          <input className="w-full border rounded-lg px-4 py-2 text-sm" type="email" placeholder="البريد الإلكتروني" value={email} onChange={(e) => setEmail(e.target.value)} required dir="ltr" />
          <input className="w-full border rounded-lg px-4 py-2 text-sm" placeholder="رقم الهاتف" value={phone} onChange={(e) => setPhone(e.target.value)} dir="ltr" />
          {!editId && (
            <div className="space-y-2">
              <label className="text-xs text-zinc-500 block">كلمة المرور</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-1 text-sm cursor-pointer">
                  <input type="radio" name="pwMode" checked={autoPassword} onChange={() => setAutoPassword(true)} />
                  تلقائي
                </label>
                <label className="flex items-center gap-1 text-sm cursor-pointer">
                  <input type="radio" name="pwMode" checked={!autoPassword} onChange={() => setAutoPassword(false)} />
                  يدوي
                </label>
              </div>
              {!autoPassword && (
                <PasswordField value={password} onChange={setPassword} placeholder="كلمة المرور" required />
              )}
            </div>
          )}
          {editId && (
            <PasswordField value={password} onChange={setPassword} label="كلمة المرور الجديدة" placeholder="اتركه فارغاً لعدم التغيير" opt />
          )}
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm disabled:opacity-50">{saving ? 'جاري الحفظ...' : (editId ? 'تحديث' : 'إنشاء')}</button>
            <button type="button" onClick={() => { setShowCreate(false); setEditId(null); resetForm(); }} className="bg-zinc-100 px-6 py-2 rounded-lg text-sm">إلغاء</button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 border-b">
            <tr>
              <th className="text-right p-4 font-medium">الاسم</th>
              <th className="text-right p-4 font-medium">البريد</th>
              <th className="text-right p-4 font-medium">الهاتف</th>
              <th className="text-right p-4 font-medium">عدد العملاء</th>
              <th className="text-center p-4 font-medium">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {managers.map((m: any) => (
              <tr key={m.id} className="border-b">
                <td className="p-4">{m.name}</td>
                <td className="p-4">{m.email}</td>
                <td className="p-4">{m.phone || '—'}</td>
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
