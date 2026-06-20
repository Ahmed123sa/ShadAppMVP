'use client';

import { useState } from 'react';
import api from '@/lib/api';

export default function UploadFileModal({ wsId, definitions, onClose, onCreated }: {
  wsId: number;
  definitions: any[];
  onClose: () => void;
  onCreated: (file: any) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [definitionId, setDefinitionId] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!file) return;
    setSaving(true);
    const form = new FormData();
    form.append('file', file);
    if (definitionId) form.append('document_definition_id', definitionId);
    const { data } = await api.post(`/workspaces/${wsId}/files`, form).catch(() => ({ data: null }));
    if (data) onCreated(data.file);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-bold">رفع مستند</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 text-xl">&times;</button>
        </div>

        <select value={definitionId} onChange={(e) => setDefinitionId(e.target.value)} className="border rounded-lg px-4 py-2 text-sm w-full">
          <option value="">بدون تصنيف</option>
          {definitions.map((d) => <option key={d.id} value={d.id}>{d.name}{d.is_required ? ' *' : ''}</option>)}
        </select>

        <label className="flex items-center gap-2 text-sm text-blue-600 cursor-pointer hover:text-blue-700">
          <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          <span className="border border-blue-200 rounded-lg px-4 py-2">{file ? file.name : '+ اختيار ملف'}</span>
        </label>

        <button onClick={submit} disabled={saving || !file}
          className="w-full bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
          {saving ? 'جاري الرفع...' : 'رفع'}
        </button>
      </div>
    </div>
  );
}
