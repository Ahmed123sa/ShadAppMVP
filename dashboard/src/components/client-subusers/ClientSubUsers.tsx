'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import PasswordField from '@/components/ui/PasswordField';

export default function ClientSubUsers({ clientId }: { clientId: number }) {
  const [subUsers, setSubUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/clients/${clientId}/sub-users`)
      .then(({ data }) => setSubUsers(data.sub_users || []))
      .catch(() => setLoadError('فشل تحميل المستخدمين'))
      .finally(() => setLoading(false));
  }, [clientId]);

  const create = async () => {
    if (!form.name || !form.email || !form.password) return;
    setError('');
    try {
      const { data } = await api.post(`/clients/${clientId}/sub-users`, form);
      setSubUsers((prev) => [...prev, data.sub_user]);
      setForm({ name: '', email: '', password: '' });
      setShowForm(false);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'فشل إنشاء المستخدم');
    }
  };

  const remove = async (id: number) => {
    try {
      await api.delete(`/sub-users/${id}`);
      setSubUsers((prev) => prev.filter((u) => u.id !== id));
    } catch { setError('فشل حذف المستخدم'); }
  };

  if (loading) return <LoadingSkeleton />;
  if (loadError) return <p className="text-sm text-red-500 text-center py-8">{loadError}</p>;

  return (
    <div className="space-y-4">
      <button onClick={() => setShowForm(!showForm)} className="text-sm text-[var(--color-gold)] hover:underline font-medium">
        + مستخدم جديد
      </button>

      {showForm && (
        <div className="space-y-2 border border-[var(--color-card-border)] rounded-lg p-4 bg-[var(--color-card-border)]">
          {error && <p className="text-xs text-red-500">{error}</p>}
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="الاسم" className="border border-[var(--color-input-border)] rounded-lg px-3 py-2 text-sm w-full bg-[var(--color-input-fill)] text-[var(--color-foreground)] placeholder-[var(--color-text-disabled)]" />
          <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
            type="email" placeholder="البريد الإلكتروني" className="border border-[var(--color-input-border)] rounded-lg px-3 py-2 text-sm w-full bg-[var(--color-input-fill)] text-[var(--color-foreground)] placeholder-[var(--color-text-disabled)]" dir="ltr" />
          <PasswordField value={form.password} onChange={(v) => setForm({ ...form, password: v })} placeholder="كلمة المرور" />
          <button onClick={create} className="bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg text-sm hover:bg-[var(--color-primary-dark)]">حفظ</button>
        </div>
      )}

      {subUsers.length === 0 ? <EmptyState message="لا يوجد مستخدمون تابعون" /> : null}
      <div className="space-y-2">
        {subUsers.map((u) => (
          <div key={u.id} className="border border-[var(--color-card-border)] rounded-lg p-3 text-sm flex items-center justify-between">
            <div>
              <p className="font-medium">{u.name}</p>
              <p className="text-xs text-[var(--color-text-disabled)]" dir="ltr">{u.email}</p>
            </div>
            <button onClick={() => remove(u.id)} className="text-xs text-red-500 hover:underline">حذف</button>
          </div>
        ))}
      </div>
    </div>
  );
}
