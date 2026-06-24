'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { getUser } from '@/lib/auth';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';

export default function FilesTab({ wsId }: { wsId: number }) {
  const isSA = getUser()?.role === 'super_admin';
  const [files, setFiles] = useState<any[]>([]);
  const [definitions, setDefinitions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDefForm, setShowDefForm] = useState(false);
  const [defName, setDefName] = useState('');
  const [uploadDef, setUploadDef] = useState('');

  const load = () => api.get(`/workspaces/${wsId}/files`).then(({ data }) => { setFiles(data.files || []); setDefinitions(data.definitions || []); }).catch(() => {}).finally(() => setLoading(false));
  useEffect(() => { load(); }, [wsId]);

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const form = new FormData(); form.append('file', file);
    if (uploadDef) form.append('document_definition_id', uploadDef);
    const { data } = await api.post(`/workspaces/${wsId}/files`, form).catch(() => ({ data: null }));
    if (data) { setFiles((prev) => [...prev, data.file]); setUploadDef(''); }
  };

  const addDef = async () => {
    if (!defName) return;
    const { data } = await api.post(`/workspaces/${wsId}/document-definitions`, { name: defName }).catch(() => ({ data: null }));
    if (data) { setDefinitions((prev) => [...prev, data.definition]); setDefName(''); setShowDefForm(false); }
  };

  const reviewFile = async (fid: number, action: string, rejection_reason?: string) => {
    const body: any = { action };
    if (rejection_reason) body.rejection_reason = rejection_reason;
    const { data } = await api.post(`/files/${fid}/review`, body).catch(() => ({ data: null }));
    if (data) setFiles((prev) => prev.map((f) => f.id === fid ? data.file : f));
  };

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        {definitions.map((d) => <span key={d.id} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs">{d.name} {d.is_required ? '*' : ''}</span>)}
        <button onClick={() => setShowDefForm(!showDefForm)} className="text-xs text-blue-600 hover:underline">+ تعريف مستند</button>
      </div>
      {showDefForm && (
        <div className="flex gap-2">
          <input value={defName} onChange={(e) => setDefName(e.target.value)} placeholder="اسم المستند المطلوب" className="border rounded-lg px-3 py-2 text-sm flex-1" />
          <button onClick={addDef} className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm">حفظ</button>
        </div>
      )}

      {!isSA && (
        <div className="flex gap-2 items-center">
          <select value={uploadDef} onChange={(e) => setUploadDef(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
            <option value="">بدون تصنيف</option>
            {definitions.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <label className="inline-flex items-center gap-1.5 text-sm text-blue-600 cursor-pointer hover:text-blue-700">
            <input type="file" className="hidden" onChange={upload} />+ رفع ملف
          </label>
        </div>
      )}

      {files.length === 0 ? <EmptyState message="لا توجد ملفات" /> : null}
      <div className="space-y-2">
        {files.map((f) => (
          <div key={f.id} className="border rounded-lg p-3 text-sm flex items-center justify-between">
            <div>
              <p className="font-medium">{f.name}</p>
              <p className="text-xs text-zinc-400">
                {f.document_definition?.name ? `${f.document_definition.name} • ` : ''}
                {f.size ? `${(f.size / 1024).toFixed(0)} KB` : ''}
                {f.reviewed_by ? ` • تمت المراجعة` : ''}
              </p>
              {f.rejection_reason && <p className="text-xs text-red-500 mt-1">السبب: {f.rejection_reason}</p>}
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-full text-xs ${f.status === 'approved' ? 'bg-green-100 text-green-700' : f.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                {f.status === 'approved' ? 'مقبول' : f.status === 'rejected' ? 'مرفوض' : 'قيد المراجعة'}
              </span>
              {!isSA && f.status === 'pending' && (
                <>
                  <button onClick={() => reviewFile(f.id, 'approved')} className="text-xs text-green-600 hover:underline">قبول</button>
                  <button onClick={() => { const r = prompt('سبب الرفض:'); if (r) reviewFile(f.id, 'rejected', r); }} className="text-xs text-red-600 hover:underline">رفض</button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
