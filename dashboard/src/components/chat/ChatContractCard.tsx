'use client';

type Clause = { id: number; content: string; type: string; sort_order: number };
type Contract = {
  id: number; title: string; value: string | null; start_date: string | null; end_date: string | null;
  status: string; clauses: Clause[];
};

export default function ChatContractCard({ contract, onAction }: { contract: Contract; onAction?: (id: number, action: string) => void }) {
  const statusBadge = (s: string) => {
    const m: Record<string, string> = {
      draft: 'bg-zinc-100 text-zinc-600', sent: 'bg-blue-100 text-blue-700',
      client_approved: 'bg-green-100 text-green-700', client_rejected: 'bg-red-100 text-red-700',
      company_approved: 'bg-purple-100 text-purple-700', completed: 'bg-emerald-100 text-emerald-700',
      archived: 'bg-zinc-200 text-zinc-500',
    };
    const l: Record<string, string> = {
      draft: 'مسودة', sent: 'مرسل', client_approved: 'تمت موافقة العميل',
      client_rejected: 'رفض العميل', company_approved: 'تمت موافقة الشركة',
      completed: 'مكتمل', archived: 'مؤرشف',
    };
    return <span className={`px-2 py-0.5 rounded-full text-xs ${m[s] || 'bg-zinc-100 text-zinc-600'}`}>{l[s] || s}</span>;
  };

  return (
    <div className="border border-blue-200 rounded-xl bg-white shadow-sm overflow-hidden">
      <div className="bg-blue-50 px-4 py-2 border-b border-blue-100 flex items-center justify-between">
        <span className="text-xs font-bold text-blue-700">عقد خدمة</span>
        {statusBadge(contract.status)}
      </div>
      <div className="p-4 space-y-2">
        <h4 className="font-bold text-zinc-800">{contract.title}</h4>
        {contract.value && <p className="text-sm text-zinc-600">{contract.value} SAR</p>}
        {(contract.start_date || contract.end_date) && (
          <p className="text-xs text-zinc-400">
            {contract.start_date && contract.end_date
              ? `من ${contract.start_date} إلى ${contract.end_date}`
              : contract.start_date
              ? `يبدأ من ${contract.start_date}`
              : `ينتهي في ${contract.end_date}`}
          </p>
        )}
        {contract.clauses?.length > 0 && (
          <div className="mt-2 space-y-1 border-t pt-2">
            {contract.clauses.map((cl) => (
              <p key={cl.id} className="text-xs text-zinc-500 pr-2 border-r-2 border-zinc-200">{cl.content}</p>
            ))}
          </div>
        )}
      </div>
      {onAction && contract.status === 'draft' && (
        <div className="px-4 pb-3 flex gap-2 flex-wrap">
          <button onClick={() => onAction(contract.id, 'send')} className="text-xs bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700">إرسال للعميل</button>
        </div>
      )}
      {onAction && contract.status === 'company_approved' && (
        <div className="px-4 pb-3 flex gap-2 flex-wrap">
          <button onClick={() => onAction(contract.id, 'archive')} className="text-xs bg-zinc-500 text-white px-3 py-1 rounded-lg hover:bg-zinc-600">أرشفة</button>
        </div>
      )}
    </div>
  );
}
