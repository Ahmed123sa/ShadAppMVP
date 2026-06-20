'use client';

import { useState } from 'react';
import api from '@/lib/api';
import { StatusBadge } from '@/components/ui/StatusBadge';

export default function ContractDetailModal({ contract, wsId, onClose, onAction, onUpload }: {
  contract: any;
  wsId: number;
  onClose: () => void;
  onAction: (action: string) => void;
  onUpload: () => void;
}) {
  const canAct = contract.status === 'sent';
  const [uploading, setUploading] = useState<Record<number, boolean>>({});

  const uploadDoc = async (docId: number, file: File) => {
    setUploading((prev) => ({ ...prev, [docId]: true }));
    const form = new FormData();
    form.append('file', file);
    form.append('contract_id', String(contract.id));
    form.append('contract_required_document_id', String(docId));
    const { data } = await api.post(`/workspaces/${wsId}/files`, form).catch(() => ({ data: null }));
    if (data) onUpload();
    setUploading((prev) => ({ ...prev, [docId]: false }));
  };

  const docs = contract.required_documents || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl p-6 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold">{contract.title}</h3>
            <StatusBadge status={contract.status} className="mt-1" />
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 text-xl">&times;</button>
        </div>

        {contract.value > 0 && (
          <p className="text-sm text-zinc-600 mb-1">القيمة: <span className="font-medium">{contract.value} ر.س</span></p>
        )}
        {contract.start_date && (
          <p className="text-sm text-zinc-600 mb-1">من: {contract.start_date}{contract.end_date ? ` إلى ${contract.end_date}` : ''}</p>
        )}

        {contract.clauses?.length > 0 && (
          <div className="mt-4 space-y-2">
            <h4 className="text-sm font-bold text-zinc-700 mb-2">بنود العقد</h4>
            {contract.clauses.map((cl: any) => (
              <div key={cl.id} className="text-sm text-zinc-600 pr-3 border-r-2 border-zinc-200 py-1">
                {cl.content}
                <span className="text-xs text-zinc-400 mr-2">
                  ({cl.type === 'fixed' ? 'ثابت' : cl.type === 'optional' ? 'اختياري' : 'مخصص'})
                </span>
              </div>
            ))}
          </div>
        )}

        {docs.length > 0 && (
          <div className="mt-4 space-y-2">
            <h4 className="text-sm font-bold text-zinc-700 mb-2">المستندات المطلوبة</h4>
            {docs.map((doc: any) => {
              const file = doc.files?.[0];
              return (
                <div key={doc.id} className="flex items-center justify-between text-sm border rounded-lg p-3">
                  <div>
                    <p className="font-medium">{doc.name}</p>
                    {file ? (
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          file.status === 'approved' ? 'bg-green-100 text-green-700' :
                          file.status === 'rejected' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {file.status === 'approved' ? 'مقبول' : file.status === 'rejected' ? 'مرفوض' : 'قيد المراجعة'}
                        </span>
                        <span className="text-xs text-zinc-400">{file.name}</span>
                      </div>
                    ) : (
                      <p className="text-xs text-zinc-400 mt-1">لم يتم رفع المستند بعد</p>
                    )}
                    {file?.status === 'rejected' && file.rejection_reason && (
                      <p className="text-xs text-red-500 mt-1">السبب: {file.rejection_reason}</p>
                    )}
                  </div>
                  <div>
                    {(!file || file.status === 'rejected') ? (
                      <label className={`inline-flex items-center gap-1 text-xs text-blue-600 cursor-pointer hover:text-blue-700 ${uploading[doc.id] ? 'opacity-50' : ''}`}>
                        <input type="file" className="hidden" disabled={uploading[doc.id]} onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadDoc(doc.id, f); }} />
                        {uploading[doc.id] ? 'جاري الرفع...' : file ? 'رفع مستند جديد' : 'رفع المستند'}
                      </label>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {canAct && (
          <div className="mt-6 flex gap-2">
            <button onClick={() => onAction('approved')}
              className="flex-1 bg-emerald-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-emerald-700">
              ✔ موافقة
            </button>
            <button onClick={() => onAction('edit_requested')}
              className="flex-1 bg-amber-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-amber-700">
              ✎ طلب تعديل
            </button>
            <button onClick={() => onAction('rejected')}
              className="flex-1 bg-red-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-red-700">
              ✘ رفض
            </button>
          </div>
        )}

        {!canAct && contract.status !== 'draft' && contract.status !== 'archived' && (
          <p className="mt-4 text-sm text-zinc-400 text-center">
            {contract.status === 'client_approved' ? 'تمت موافقتك على هذا العقد' :
             contract.status === 'client_rejected' ? 'قمت برفض هذا العقد' :
             contract.status === 'edit_requested' ? 'قمت بطلب تعديل العقد' :
             contract.status === 'company_approved' ? 'تم اعتماد العقد من الشركة' :
             contract.status === 'completed' ? 'العقد مكتمل' : ''}
          </p>
        )}
      </div>
    </div>
  );
}
