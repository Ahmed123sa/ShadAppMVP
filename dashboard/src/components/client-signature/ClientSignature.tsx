'use client';

import { useState, useRef } from 'react';
import api from '@/lib/api';

const SIG_W = 500;
const SIG_H = 200;

function isImageUrl(val: string | null | undefined) {
  return !!val && (val.startsWith('/storage/') || val.startsWith('http'));
}

export default function ClientSignature({ clientId, clientData, onSigned }: { clientId: number; clientData: any; onSigned?: () => void }) {
  const sigData = clientData?.signature_data;
  const [mode, setMode] = useState<'text' | 'image'>(sigData && !isImageUrl(sigData) ? 'text' : 'image');
  const [signature, setSignature] = useState(!sigData || isImageUrl(sigData) ? '' : sigData);
  const [preview, setPreview] = useState<string | null>(isImageUrl(sigData) ? sigData : null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [done, setDone] = useState(!!clientData?.signed_at);
  const [error, setError] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');

    if (file.type !== 'image/png') { setError('يُرجى رفع ملف PNG فقط'); return; }

    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = SIG_W;
      canvas.height = SIG_H;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, SIG_W, SIG_H);
      const sx = Math.min(SIG_W / img.width, SIG_H / img.height);
      const dx = (SIG_W - img.width * sx) / 2;
      const dy = (SIG_H - img.height * sx) / 2;
      ctx.drawImage(img, dx, dy, img.width * sx, img.height * sx);
      setPreview(canvas.toDataURL('image/png'));
    };
    img.src = URL.createObjectURL(file);
  };

  const save = async () => {
    if (mode === 'text') {
      if (!signature.trim()) return;
      setSaving(true);
      const { data } = await api.post(`/clients/${clientId}/sign`, { signature: signature.trim() }).catch(() => ({ data: null }));
      if (data) { setDone(true); onSigned?.(); }
      setSaving(false);
    } else {
      if (!preview) return;
      setSaving(true);
      const blob = await (await fetch(preview)).blob();
      const fd = new FormData();
      fd.append('signature_image', blob, 'signature.png');
      const { data } = await api.post(`/clients/${clientId}/sign`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }).catch(() => ({ data: null }));
      if (data) { setDone(true); onSigned?.(); }
      setSaving(false);
    }
  };

  const deleteSignature = async () => {
    if (!confirm('هل أنت متأكد من حذف التوقيع؟')) return;
    setDeleting(true);
    try {
      await api.delete(`/clients/${clientId}/sign`);
      setDone(false);
      setSignature('');
      setPreview(null);
      onSigned?.();
    } catch {
      // ignore
    } finally {
      setDeleting(false);
    }
  };

  const existingImage = isImageUrl(sigData) ? sigData : null;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="font-bold mb-2">التوقيع الإلكتروني</h3>

        {done ? (
          <div className="text-center py-8">
            <p className="text-2xl mb-2">✅</p>
            <p className="text-emerald-600 font-medium">تم تسجيل توقيعك</p>
            {existingImage ? (
              <div className="mt-4 border-t pt-4 flex justify-center">
                <img src={existingImage} alt="التوقيع" className="max-w-full h-20 object-contain" />
              </div>
            ) : sigData && !isImageUrl(sigData) ? (
              <p className="text-lg font-handwriting mt-4 text-zinc-600 border-t pt-4">{sigData}</p>
            ) : null}
            <div className="flex justify-center gap-3 mt-4">
              <button onClick={() => setDone(false)}
                className="text-sm text-blue-600 hover:underline">تعديل التوقيع</button>
              <button onClick={deleteSignature} disabled={deleting}
                className="text-sm text-red-600 hover:underline disabled:opacity-50">
                {deleting ? '...' : 'حذف التوقيع'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {!preview && (
              <div className="flex gap-2 mb-3">
                <button onClick={() => { setMode('text'); setPreview(null); }}
                  className={`px-4 py-1.5 text-sm rounded-lg border ${mode === 'text' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-zinc-600'}`}>نص</button>
                <button onClick={() => { setMode('image'); setSignature(''); }}
                  className={`px-4 py-1.5 text-sm rounded-lg border ${mode === 'image' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-zinc-600'}`}>صورة PNG</button>
              </div>
            )}

            {mode === 'text' && !preview && (
              <>
                <p className="text-sm text-zinc-500">اكتب اسمك كاملاً للتوقيع الإلكتروني</p>
                <textarea value={signature} onChange={(e) => setSignature(e.target.value)}
                  className="border rounded-lg px-4 py-3 text-lg font-medium w-full h-24 text-center"
                  placeholder="اكتب اسمك هنا..." />
              </>
            )}

            {mode === 'image' && (
              <>
                <p className="text-sm text-zinc-500">ارفع صورة توقيعك بصيغة PNG {SIG_W}×{SIG_H} بكسل</p>
                <input ref={fileRef} type="file" accept=".png" onChange={handleFile} className="hidden" />
                <div onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:bg-zinc-50 transition">
                  {preview ? (
                    <img src={preview} alt="التوقيع" className="mx-auto max-h-32 object-contain" />
                  ) : existingImage ? (
                    <img src={existingImage} alt="التوقيع" className="mx-auto max-h-32 object-contain" />
                  ) : (
                    <p className="text-zinc-400 text-sm">انقر لاختيار ملف PNG</p>
                  )}
                </div>
                <p className="text-xs text-zinc-400">سيتم تحجيم الصورة تلقائياً إلى {SIG_W}×{SIG_H} بكسل</p>
              </>
            )}

            {error && <p className="text-sm text-red-500">{error}</p>}

            <canvas ref={canvasRef} className="hidden" />

            <button onClick={save} disabled={saving || (mode === 'text' && !signature.trim()) || (mode === 'image' && !preview)}
              className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'جاري الحفظ...' : 'حفظ التوقيع'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
