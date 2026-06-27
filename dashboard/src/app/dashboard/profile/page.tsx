'use client';

import { useEffect, useState, useRef } from 'react';
import api from '@/lib/api';
import { getUser } from '@/lib/auth';
import { useTranslations } from 'next-intl';

const FILE_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8000';

function resolveFileUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${FILE_BASE}/storage/${url.replace(/^\/?storage\//, '')}`;
}

export default function ProfilePage() {
  const t = useTranslations('settings');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const u = getUser();
    if (u) {
      setDisplayName(u.name || '');
      setEmail(u.email || '');
      if (u.avatar_url) setAvatarPreview(resolveFileUrl(u.avatar_url));
    }
    api.get('/auth/me').then(({ data }) => {
      const u = data.user;
      setDisplayName(u.name || '');
      setEmail(u.email || '');
      if (u.avatar_url) setAvatarPreview(resolveFileUrl(u.avatar_url));
      localStorage.setItem('user', JSON.stringify(u));
    }).catch(() => {});
  }, []);

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
      form.append('name', displayName);
      const { data } = await api.post('/auth/me', form);
      if (data.user?.avatar_url) setAvatarPreview(resolveFileUrl(data.user.avatar_url));
      localStorage.setItem('user', JSON.stringify(data.user));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold">{t('title')}</h1>

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-emerald-700 text-sm">{t('profile_saved')}</div>
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
            {t('change_avatar')}
          </button>
          <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-zinc-500">{t('name')}</label>
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)}
            className="border rounded-lg px-4 py-2 text-sm w-full" />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-zinc-500">{t('email_info')}</label>
          <input value={email} disabled
            className="border rounded-lg px-4 py-2 text-sm w-full bg-zinc-50 text-zinc-400" dir="ltr" />
        </div>

        <button onClick={save} disabled={saving}
          className="bg-blue-600 text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 w-full">
          {saving ? '...' : t('save')}
        </button>
      </div>
    </div>
  );
}