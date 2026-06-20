'use client';

const statusColors: Record<string, string> = {
  draft: 'bg-zinc-100 text-zinc-600',
  sent: 'bg-blue-100 text-blue-700',
  client_approved: 'bg-green-100 text-green-700',
  client_rejected: 'bg-red-100 text-red-700',
  edit_requested: 'bg-amber-100 text-amber-700',
  company_approved: 'bg-purple-100 text-purple-700',
  completed: 'bg-emerald-100 text-emerald-700',
  archived: 'bg-zinc-200 text-zinc-500',
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-zinc-100 text-zinc-500',
  scheduled: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-red-100 text-red-700',
};

const statusLabels: Record<string, string> = {
  draft: 'مسودة', sent: 'مرسل',
  client_approved: 'موافقة العميل', client_rejected: 'رفض العميل',
  edit_requested: 'طلب تعديل',
  company_approved: 'موافقة الشركة', completed: 'مكتمل',
  archived: 'مؤرشف', pending: 'معلق',
  approved: 'مقبول', rejected: 'مرفوض',
  active: 'نشط', inactive: 'غير نشط',
  scheduled: 'مجدول', cancelled: 'ملغي',
};

export function StatusBadge({ status, className = '' }: { status: string; className?: string }) {
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[status] || 'bg-zinc-100 text-zinc-600'} ${className}`}>
      {statusLabels[status] || status}
    </span>
  );
}
