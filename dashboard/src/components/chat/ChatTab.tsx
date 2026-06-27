'use client';

import { useEffect, useState, useRef } from 'react';
import api from '@/lib/api';
import { getUser } from '@/lib/auth';
import ChatContractCard from '@/components/chat/ChatContractCard';
import ContractBuilder from '@/components/chat/ContractBuilder';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';

const FILE_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8000';
function resolveFileUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${FILE_BASE}/storage/${url.replace(/^\/?storage\//, '')}`;
}

export default function ChatTab({ wsId, wsActive }: { wsId: number; wsActive?: boolean }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [showBuilder, setShowBuilder] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [sendError, setSendError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
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
    if (!text.trim() && !uploadFile) return;
    setSendError('');
    const form = new FormData();
    if (text.trim()) form.append('message', text);
    if (uploadFile) form.append('file', uploadFile);
    try {
      const { data } = await api.post(`/workspaces/${wsId}/chat`, form);
      if (data) { setMessages((prev) => [...prev, data.message]); setText(''); setUploadFile(null); if (fileRef.current) fileRef.current.value = ''; }
    } catch {
      setSendError('فشل الإرسال');
    }
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

  const user = getUser();
  const isSA = user?.role === 'super_admin';
  const canChat = wsActive !== false && !isSA;

  if (!canChat) {
    return (
      <div className="text-center py-10 space-y-3">
        <span className="text-4xl block">{!wsActive ? '🔒' : '👁️'}</span>
        <p className="text-zinc-500 text-sm">
          {!wsActive ? 'المحادثة غير متاحة — في انتظار اكتمال الدفع وتفعيل مساحة العمل' : 'عرض المحادثة فقط'}
        </p>
        <div className="h-72 overflow-y-auto space-y-3 border rounded-lg p-3 bg-zinc-50">
          {contracts.length > 0 && contracts.map((c) => (
            <ChatContractCard key={`contract-${c.id}`} contract={c} onAction={() => {}} />
          ))}
          {messages.map((m) => {
            const isClient = m.sender_type === 'App\\Models\\Client';
            const initial = ((m.sender?.name?.[0]) || '?').toUpperCase();
            return (
            <div key={m.id} className={`flex ${isClient ? 'justify-end' : 'justify-start'}`}>
              <div className="max-w-xs flex gap-2 items-start">
                {!isClient && (
                  <div className="w-6 h-6 rounded-full bg-blue-200 overflow-hidden flex-shrink-0 mt-1">
                    {m.sender?.avatar_url ? (
                      <img src={resolveFileUrl(m.sender.avatar_url)} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-blue-700 font-medium">{initial}</div>
                    )}
                  </div>
                )}
                <div>
                  <div className={`px-3 py-2 rounded-lg text-sm ${isClient ? 'bg-zinc-200 text-zinc-800' : 'bg-blue-100 text-blue-900'}`}>
                    <p className="text-xs text-zinc-500 mb-0.5">{isClient ? (m.sender?.name || 'العميل') : ((m.sender?.role === 'super_admin' ? 'مشرف' : 'مدير حساب') + ': ' + (m.sender?.name || ''))}</p>
                    {m.message}
                  </div>
                </div>
                {isClient && (
                  <div className="w-6 h-6 rounded-full bg-zinc-200 overflow-hidden flex-shrink-0 mt-1">
                    {m.sender?.avatar_url ? (
                      <img src={resolveFileUrl(m.sender.avatar_url)} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-zinc-600 font-medium">{initial}</div>
                    )}
                  </div>
                )}
              </div>
            </div>
            );
          })}
        </div>
      </div>
    );
  }

  const actionResultLabel: Record<string, string> = {
    approved: '✅ تمت الموافقة',
    edit_requested: '✎ طلب تعديل',
  };

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
          const approval = m.approval;
          const isPending = m.requires_action && !m.action_taken;
          const isResponded = m.action_taken;
          const initial = ((m.sender?.name?.[0]) || '?').toUpperCase();
          const senderLabel = isClient ? (m.sender?.name || 'العميل') : ((m.sender?.role === 'super_admin' ? 'مشرف' : 'مدير حساب') + ': ' + (m.sender?.name || ''));
          return (
          <div key={m.id} className={`flex ${isClient ? 'justify-end' : 'justify-start'}`}>
            <div className="max-w-xs flex gap-2 items-start">
              {!isClient && (
                <div className="w-7 h-7 rounded-full bg-blue-200 overflow-hidden flex-shrink-0 mt-1">
                  {m.sender?.avatar_url ? (
                    <img src={resolveFileUrl(m.sender.avatar_url)} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-blue-700 font-medium">{initial}</div>
                  )}
                </div>
              )}
              <div>
                <div className={`px-3 py-2 rounded-lg text-sm ${isClient ? 'bg-zinc-200 text-zinc-800' : 'bg-blue-100 text-blue-900'}`}>
                  <p className="text-xs text-zinc-500 mb-0.5">{senderLabel}</p>
                  {m.type === 'file' && m.file_url && (
                    <div className="mb-1">
                      {m.file_url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) ? (
                        <img src={m.file_url} alt="مرفق" className="max-w-full rounded-lg max-h-40" />
                      ) : (
                        <a href={m.file_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-xs">📎 عرض المرفق</a>
                      )}
                    </div>
                  )}
                  {m.message}
                  {isPending && <p className="text-xs text-red-500 mt-1 font-medium">🏷️ طلب موافقة — قيد الانتظار</p>}
                  {isResponded && <p className={`text-xs mt-1 font-medium ${m.action_result === 'approved' ? 'text-emerald-600' : m.action_result === 'rejected' ? 'text-red-600' : 'text-amber-600'}`}>{actionResultLabel[m.action_result || '']}</p>}
                  {approval?.certificate?.pdf_url && (
                    <a href={`/storage/${approval.certificate.pdf_url}`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 underline block mt-1">📄 تحميل شهادة الموافقة</a>
                  )}
                </div>
                {isClient && (
                  <div className="w-7 h-7 rounded-full bg-zinc-200 overflow-hidden flex-shrink-0 mt-1">
                    {m.sender?.avatar_url ? (
                      <img src={resolveFileUrl(m.sender.avatar_url)} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-zinc-600 font-medium">{initial}</div>
                    )}
                  </div>
                )}
                {!isClient && !m.action_taken && (
                  <button onClick={() => toggleAction(m.id)} className={`text-xs mt-0.5 ${m.requires_action ? 'text-red-500' : 'text-zinc-400'} hover:underline`}>
                    {m.requires_action ? 'إلغاء طلب الموافقة' : 'طلب موافقة العميل'}
                  </button>
                )}
              </div>
            </div>
          </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2">
        <input type="file" ref={fileRef} className="hidden" onChange={(e) => setUploadFile(e.target.files?.[0] || null)} />
        <button onClick={() => fileRef.current?.click()} className="text-zinc-500 hover:text-blue-600 text-lg px-1" title="إرفاق ملف">📎</button>
        {uploadFile && <span className="text-xs text-blue-600 self-center truncate max-w-24">{uploadFile.name}</span>}
        <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()}
          className="flex-1 border rounded-lg px-3 py-2 text-sm" placeholder="اكتب رسالة..." />
        <button onClick={send} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">إرسال</button>
      </div>
      {sendError && <p className="text-xs text-red-500">{sendError}</p>}
    </div>
  );
}
