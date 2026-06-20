'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import UploadFileModal from './UploadFileModal';

export default function ClientFiles({ wsId }: { wsId: number }) {
  const [files, setFiles] = useState<any[]>([]);
  const [definitions, setDefinitions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showUpload, setShowUpload] = useState(false);

  const load = () => api.get(`/workspaces/${wsId}/files`)
    .then(({ data }) => { setFiles(data.files || []); setDefinitions(data.definitions || []); })
    .catch(() => setError('فشل تحميل الملفات'))
    .finally(() => setLoading(false));
  useEffect(() => { load(); }, [wsId]);

  if (loading) return <LoadingSkeleton />;
  if (error) return <p className="text-sm text-red-500 text-center py-8">{error}</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        {definitions.map((d) => (
          <span key={d.id} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs">
            {d.name} {d.is_required ? '*' : ''}
          </span>
        ))}
      </div>

      <button onClick={() => setShowUpload(true)} className="text-sm text-blue-600 hover:underline font-medium">
        + رفع مستند
      </button>

      {files.length === 0 ? <EmptyState message="لا توجد ملفات" /> : null}
      <div className="space-y-2">
        {files.map((f) => (
          <div key={f.id} className="border rounded-lg p-3 text-sm flex items-center justify-between">
            <div>
              <p className="font-medium">{f.name}</p>
              <p className="text-xs text-zinc-400">
                {f.document_definition?.name ? `${f.document_definition.name} • ` : ''}
                {f.size ? `${(f.size / 1024).toFixed(0)} KB` : ''}
              </p>
              {f.rejection_reason && <p className="text-xs text-red-500 mt-1">سبب الرفض: {f.rejection_reason}</p>}
            </div>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
              f.status === 'approved' ? 'bg-green-100 text-green-700' :
              f.status === 'rejected' ? 'bg-red-100 text-red-700' :
              'bg-yellow-100 text-yellow-700'
            }`}>
              {f.status === 'approved' ? 'مقبول' : f.status === 'rejected' ? 'مرفوض' : 'قيد المراجعة'}
            </span>
          </div>
        ))}
      </div>

      {showUpload && (
        <UploadFileModal
          wsId={wsId}
          definitions={definitions}
          onClose={() => setShowUpload(false)}
          onCreated={(file) => { setFiles((prev) => [...prev, file]); setShowUpload(false); }}
        />
      )}
    </div>
  );
}
