'use client';

import { useEffect, useState, useRef } from 'react';
import api from '@/lib/api';
import ChatContractCard from '@/components/chat/ChatContractCard';
import ContractBuilder from '@/components/chat/ContractBuilder';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';

export default function ChatTab({ wsId }: { wsId: number }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [showBuilder, setShowBuilder] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = () => {
    Promise.all([
      api.get(`/workspaces/${wsId}/chat`).then(({ data }) => setMessages(data.messages || [])),
      api.get(`/workspaces/${wsId}/contracts`).then(({ data }) => setContracts(data.contracts || [])),
    ]).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); const iv = setInterval(load, 5000); return () => clearInterval(iv); }, [wsId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async () => {
    if (!text.trim()) return;
    const { data } = await api.post(`/workspaces/${wsId}/chat`, { message: text }).catch(() => ({ data: null }));
    if (data) { setMessages((prev) => [...prev, data.message]); setText(''); }
  };

  const toggleAction = async (id: number) => {
    const { data } = await api.patch(`/chat/${id}/require-action`).catch(() => ({ data: null }));
    if (data) setMessages((prev) => prev.map((m) => m.id === id ? data.message : m));
  };

  const doContractAction = async (id: number, action: string) => {
    const { data } = await api.post(`/contracts/${id}/${action}`).catch(() => ({ data: null }));
    if (data) setContracts((prev) => prev.map((c) => c.id === id ? data.contract : c));
  };

  const onContractCreated = (contract: any) => {
    setContracts((prev) => [contract, ...prev]);
    setShowBuilder(false);
  };

  if (loading) return <LoadingSkeleton message="جاري تحميل المحادثة..." />;

  return (
    <div className="space-y-4">
      {!showBuilder ? (
        <button onClick={() => setShowBuilder(true)} className="text-sm text-blue-600 hover:underline font-medium">
          + إرسال عقد خدمة إضافية
        </button>
      ) : (
        <ContractBuilder wsId={wsId} onCreated={onContractCreated} onCancel={() => setShowBuilder(false)} />
      )}

      <div className="h-72 overflow-y-auto space-y-3 border rounded-lg p-3 bg-zinc-50">
        {contracts.length > 0 && contracts.map((c) => (
          <ChatContractCard key={`contract-${c.id}`} contract={c} onAction={doContractAction} />
        ))}
        {messages.length === 0 && contracts.length === 0 ? <EmptyState message="لا توجد رسائل بعد" /> : null}
        {messages.map((m) => {
          const isClient = m.sender_type === 'App\\Models\\Client';
          return (
          <div key={m.id} className={`flex ${isClient ? 'justify-end' : 'justify-start'}`}>
            <div className="max-w-xs">
              <div className={`px-3 py-2 rounded-lg text-sm ${isClient ? 'bg-zinc-200 text-zinc-800' : 'bg-blue-100 text-blue-900'}`}>
                <p className="text-xs text-zinc-500 mb-0.5">{isClient ? (m.sender?.name || 'العميل') : (m.sender?.name || 'المدير')}</p>
                {m.message}
                {m.requires_action && <p className="text-xs text-red-500 mt-1 font-medium">يتطلب موافقة العميل</p>}
              </div>
              <button onClick={() => toggleAction(m.id)} className={`text-xs mt-0.5 ${m.requires_action ? 'text-red-500' : 'text-zinc-400'} hover:underline`}>
                {m.requires_action ? 'إلغاء طلب الموافقة' : 'طلب موافقة العميل'}
              </button>
            </div>
          </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2">
        <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()}
          className="flex-1 border rounded-lg px-3 py-2 text-sm" placeholder="اكتب رسالة..." />
        <button onClick={send} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">إرسال</button>
      </div>
    </div>
  );
}
