'use client';

const STAGES = [
  { key: 'signed', icon: '🔏', label: 'التوقيع الإلكتروني' },
  { key: 'sent', icon: '📄', label: 'استلام العقد' },
  { key: 'client_approved', icon: '✅', label: 'موافقتك' },
  { key: 'company_approved', icon: '🏢', label: 'اعتماد الشركة' },
  { key: 'payment', icon: '💳', label: 'إثبات الدفع' },
  { key: 'active', icon: '🚀', label: 'تفعيل المساحة' },
];

function getCurrentStage(client: any, workspace: any): number {
  if (!client || !workspace) return 0;
  if (workspace.status === 'active') return 6;
  const payments = workspace.payments || [];
  if (payments.some((p: any) => p.status === 'approved' || p.proof_file_url)) return 5;
  const contracts = workspace.contracts || [];
  if (contracts.some((c: any) => c.status === 'company_approved' || c.status === 'completed')) return 4;
  if (contracts.some((c: any) => c.status === 'client_approved')) return 3;
  if (contracts.some((c: any) => c.status === 'sent')) return 2;
  if (client.signed_at) return 1;
  return 0;
}

export default function StagesStepper({ client, workspace }: { client: any; workspace: any }) {
  const current = getCurrentStage(client, workspace);

  return (
    <div className="bg-white rounded-xl shadow-sm border p-4">
      <div className="flex items-center justify-between gap-1 overflow-x-auto">
        {STAGES.map((stage, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <div key={stage.key} className="flex items-center gap-1 flex-1 min-w-0">
              <div className={`flex flex-col items-center gap-1 min-w-0 ${active ? 'opacity-100' : done ? 'opacity-100' : 'opacity-40'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-colors ${
                  done ? 'bg-emerald-100 text-emerald-600' :
                  active ? 'bg-blue-100 text-blue-600 ring-2 ring-blue-300' :
                  'bg-zinc-100 text-zinc-400'
                }`}>
                  {done ? '✓' : stage.icon}
                </div>
                <span className={`text-[10px] whitespace-nowrap text-center ${
                  done ? 'text-emerald-600 font-medium' :
                  active ? 'text-blue-600 font-medium' :
                  'text-zinc-400'
                }`}>
                  {stage.label}
                </span>
              </div>
              {i < STAGES.length - 1 && (
                <div className={`flex-1 h-0.5 mx-1 rounded ${i < current ? 'bg-emerald-400' : 'bg-zinc-200'}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
