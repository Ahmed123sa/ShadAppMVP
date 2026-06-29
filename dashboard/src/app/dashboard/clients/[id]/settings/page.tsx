'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import PasswordField from '@/components/ui/PasswordField';

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
  const avatarInputRef = useRef<HTMLInputElement>(null);

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
  if (!client) return <div className="py-20 text-center text-[var(--color-text-secondary)]">العميل غير موجود</div>;

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-[var(--color-text-secondary)] hover:text-[var(--color-foreground)]">&larr; رجوع</button>
        <h1 className="text-xl font-bold">إعدادات: {client.company_name}</h1>
      </div>

      {success && (
        <div className="bg-emerald-900/30 border border-emerald-800/30 rounded-xl p-4 text-emerald-400 text-sm">تم حفظ الإعدادات بنجاح</div>
      )}

      <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-card-border)] p-6 space-y-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-24 h-24 rounded-full bg-[var(--color-input-fill)] overflow-hidden border-2 border-[var(--color-card-border)]">
            {avatarPreview ? (
              <img src={avatarPreview} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl text-[var(--color-text-disabled)]">
                {client.company_name?.[0] || '?'}
              </div>
            )}
          </div>
          <button onClick={() => avatarInputRef.current?.click()} type="button"
            className="bg-[var(--color-input-fill)] hover:bg-[var(--color-card-border)] px-4 py-2 rounded-lg text-sm transition-colors">
            تغيير الصورة
          </button>
          <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-[var(--color-text-secondary)]">اسم الشركة</label>
          <input value={client.company_name} disabled className="border border-[var(--color-card-border)] rounded-lg px-4 py-2 text-sm w-full bg-[var(--color-card-border)] text-[var(--color-text-disabled)]" />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-[var(--color-text-secondary)]">الشخص المسؤول</label>
          <input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)}
            className="bg-[var(--color-input-fill)] border-[var(--color-input-border)] text-[var(--color-foreground)] rounded-lg px-4 py-2 text-sm w-full" />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-[var(--color-text-secondary)]">البريد الإلكتروني</label>
          <input value={client.email} disabled className="border border-[var(--color-card-border)] rounded-lg px-4 py-2 text-sm w-full bg-[var(--color-card-border)] text-[var(--color-text-disabled)]" dir="ltr" />
        </div>

        <PasswordField value={password} onChange={setPassword} label="تغيير كلمة المرور" placeholder="اتركه فارغاً إذا لا تريد التغيير" opt />

        <button onClick={saveProfile} disabled={saving}
          className="bg-[var(--color-primary)] text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-[var(--color-primary-dark)] disabled:opacity-50 w-full">
          {saving ? '...' : 'حفظ الإعدادات'}
        </button>
      </div>
    </div>
  );
}
