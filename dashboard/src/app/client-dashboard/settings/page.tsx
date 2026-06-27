'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { isClientAuthenticated, getClient, clientLogout } from '@/lib/client-auth';

const FILE_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8000';

function resolveFileUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${FILE_BASE}/storage/${url.replace(/^\/?storage\//, '')}`;
}

export default function ClientSettingsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const session = getClient();
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined' && !isClientAuthenticated()) {
      router.push('/client-login');
    }
  }, [router]);

  useEffect(() => {
    if (!session?.id) return;
    api.get(`/clients/${session.id}`).then(({ data }) => {
      const c = data.client;
      setDisplayName(c.contact_person || '');
      if (c.avatar_url) setAvatarPreview(resolveFileUrl(c.avatar_url));
    }).catch(() => {});
  }, [session?.id]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatar(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const save = async () => {
    setSaving(true);
    setSuccess(false);
    try {
      const form = new FormData();
      if (avatar) form.append('avatar', avatar);
      form.append('contact_person', displayName);
      await api.post(`/clients/${session!.id}/profile`, form);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-bold">ShadApp</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-zinc-500">{session?.company_name}</span>
          <button onClick={clientLogout} className="text-xs bg-zinc-100 hover:bg-zinc-200 px-3 py-1.5 rounded-lg">تسجيل خروج</button>
        </div>
      </header>

      <main className="max-w-lg mx-auto p-6 space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/client-dashboard')} className="text-zinc-500 hover:text-zinc-800">&larr; رجوع</button>
          <h2 className="text-xl font-bold">الإعدادات</h2>
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
                  {displayName?.[0] || '?'}
                </div>
              )}
            </div>
            <button onClick={() => avatarInputRef.current?.click()} type="button"
              className="bg-zinc-100 hover:bg-zinc-200 px-4 py-2 rounded-lg text-sm transition-colors">
              تغيير الصورة
            </button>
            <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-zinc-500">الاسم الظاهر</label>
            <input value={displayName} onChange={(e) => setDisplayName(e.target.value)}
              className="border rounded-lg px-4 py-2 text-sm w-full" />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-zinc-500">البريد الإلكتروني</label>
            <input value={session?.email || ''} disabled
              className="border rounded-lg px-4 py-2 text-sm w-full bg-zinc-50 text-zinc-400" dir="ltr" />
          </div>

          <button onClick={save} disabled={saving}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 w-full">
            {saving ? '...' : 'حفظ الإعدادات'}
          </button>
        </div>
      </main>
    </div>
  );
}