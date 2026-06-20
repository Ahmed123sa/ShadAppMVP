'use client';

export function ConfirmDialog({ open, title, message, confirmLabel, cancelLabel, onConfirm, onCancel, variant = 'default' }: {
  open: boolean; title: string; message: string; confirmLabel: string; cancelLabel: string;
  onConfirm: () => void; onCancel: () => void; variant?: 'default' | 'danger';
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onCancel}>
      <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4 space-y-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-bold text-lg">{title}</h3>
        <p className="text-sm text-zinc-500">{message}</p>
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} className="bg-zinc-100 text-zinc-600 px-4 py-2 rounded-lg text-sm hover:bg-zinc-200">{cancelLabel}</button>
          <button onClick={onConfirm} className={`px-4 py-2 rounded-lg text-sm text-white ${variant === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
