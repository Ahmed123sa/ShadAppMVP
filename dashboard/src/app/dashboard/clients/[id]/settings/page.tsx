'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';

const FILE_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8000';

function resolveFileUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${FILE_BASE}/storage/${url.replace(/^\/?storage\//, '')}`;
}

export default function ClientSettingsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    api.get(`/clients/${id}`).then(({ data }) => {
      const c = data.client;
      setClient(c);
      setContactPerson(c.contact_person || '');
      if (c.avatar_url) setAvatarPreview(resolveFileUrl(c.avatar_url));
    }).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatar(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    setSuccess(false);
    try {
      const form = new FormData();
      if (avatar) form.append('avatar', avatar);
      form.append('contact_person', contactPerson);
      await api.post(`/clients/${id}/profile`, form);
      if (password) {
        await api.put(`/clients/${id}`, { password });
      }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="py-20"><LoadingSkeleton message="جاري تحميل..." /></div>;
  if (!client) return <div className="py-20 text-center text-zinc-500">العميل غير موجود</div>;

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-zinc-500 hover:text-zinc-800">&larr; رجوع</button>
        <h1 className="text-xl font-bold">إعدادات: {client.company_name}</h1>
      </div>

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-emerald-700 text-sm">تم حفظ الإعدادات بنجاح</div>
      )}

      <div className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-24 h-24 rounded-full bg-zinc-100 overflow-hidden border-2 border-zinc-200">
            {avatarPreview ? (
              <img src={avatarPreview} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl text-zinc-400">
                {client.company_name?.[0] || '?'}
              </div>
            )}
          </div>
          <label className="cursor-pointer bg-zinc-100 hover:bg-zinc-200 px-4 py-2 rounded-lg text-sm transition-colors">
            تغيير الصورة
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </label>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-zinc-500">اسم الشركة</label>
          <input value={client.company_name} disabled className="border rounded-lg px-4 py-2 text-sm w-full bg-zinc-50 text-zinc-400" />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-zinc-500">الشخص المسؤول</label>
          <input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)}
            className="border rounded-lg px-4 py-2 text-sm w-full" />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-zinc-500">البريد الإلكتروني</label>
          <input value={client.email} disabled className="border rounded-lg px-4 py-2 text-sm w-full bg-zinc-50 text-zinc-400" dir="ltr" />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-zinc-500">تغيير كلمة المرور</label>
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="text"
            className="border rounded-lg px-4 py-2 text-sm w-full" placeholder="اتركه فارغاً إذا لا تريد التغيير" dir="ltr" />
        </div>

        <button onClick={saveProfile} disabled={saving}
          className="bg-blue-600 text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 w-full">
          {saving ? '...' : 'حفظ الإعدادات'}
        </button>
      </div>
    </div>
  );
}