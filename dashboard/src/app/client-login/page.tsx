'use client';

import { useState } from 'react';
import { clientLogin, getClient } from '@/lib/client-auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ClientLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const existing = getClient();
  if (existing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 text-center">
          <h1 className="text-2xl font-bold mb-2">مرحباً {existing.contact_person}</h1>
          <p className="text-zinc-500 mb-4">{existing.company_name}</p>
          <div className="flex gap-2 justify-center">
            <Link href="/client-dashboard" className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-blue-700">
              الدخول إلى اللوحة
            </Link>
            <button onClick={() => { localStorage.removeItem('client_token'); localStorage.removeItem('client'); window.location.reload(); }}
              className="bg-zinc-100 px-6 py-2 rounded-lg text-sm hover:bg-zinc-200">
              خروج
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await clientLogin(email, password);
      router.push('/client-dashboard');
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.response?.data?.errors?.email?.[0] || 'بيانات الدخول غير صحيحة';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-center mb-1">ShadApp</h1>
        <p className="text-zinc-500 text-center text-sm mb-6">تسجيل دخول العميل</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">البريد الإلكتروني</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-zinc-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required dir="ltr" />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">كلمة المرور</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-zinc-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required dir="ltr" />
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
          </button>
        </form>

        <p className="text-center text-sm text-zinc-500 mt-4">
          <Link href="/login" className="text-blue-600 hover:underline">تسجيل دخول المدير</Link>
        </p>
      </div>
    </div>
  );
}
