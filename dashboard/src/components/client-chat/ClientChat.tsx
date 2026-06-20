'use client';

import { useEffect, useState, useRef } from 'react';
import api from '@/lib/api';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';

export default function ClientChat({ wsId }: { wsId: number }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sendError, setSendError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = () => {
    api.get(`/workspaces/${wsId}/chat`)
      .then(({ data }) => { setMessages(data.messages || []); setError(''); })
      .catch(() => setError('فشل تحميل المحادثة'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); const iv = setInterval(load, 5000); return () => clearInterval(iv); }, [wsId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async () => {
    if (!text.trim()) return;
    setSendError('');
    try {
      const { data } = await api.post(`/workspaces/${wsId}/chat`, { message: text });
      if (data?.message) { setMessages((prev) => [...prev, data.message]); setText(''); }
    } catch (err: any) {
      if (err?.response?.status === 401) {
        setSendError('انتهت الجلسة — يرجى تسجيل الدخول مرة أخرى');
      } else {
        setSendError('فشل إرسال الرسالة');
      }
    }
  };

  if (loading) return <LoadingSkeleton message="جاري تحميل المحادثة..." />;
  if (error) return <p className="text-sm text-red-500 text-center py-8">{error}</p>;

  return (
    <div className="space-y-4">
      <div className="h-72 overflow-y-auto space-y-3 border rounded-lg p-3 bg-zinc-50">
        {messages.length === 0 ? <EmptyState message="لا توجد رسائل بعد" /> : null}
        {messages.map((m) => {
          const sentByClient = m.sender_type === 'App\\Models\\Client';
          return (
            <div key={m.id} className={`flex ${sentByClient ? 'justify-end' : 'justify-start'}`}>
              <div className="max-w-xs">
                <div className={`px-3 py-2 rounded-lg text-sm ${sentByClient ? 'bg-blue-600 text-white' : 'bg-zinc-200 text-zinc-800'}`}>
                  <p className={`text-xs mb-0.5 ${sentByClient ? 'text-blue-200' : 'text-zinc-500'}`}>
                    {sentByClient ? 'أنت' : (m.sender?.name || 'المدير')}
                  </p>
                  {m.message}
                </div>
                {m.requires_action && (
                  <p className="text-xs text-red-500 mt-1 font-medium">يتطلب منك إجراء</p>
                )}
                {m.contract_id && (
                  <p className="text-xs text-blue-600 mt-1">📄 عقد مرفق</p>
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {sendError && <p className="text-xs text-red-500">{sendError}</p>}
      <div className="flex gap-2">
        <input value={text} onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          className="flex-1 border rounded-lg px-3 py-2 text-sm" placeholder="اكتب رسالة..." />
        <button onClick={send} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">إرسال</button>
      </div>
    </div>
  );
}
