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
  if (payments.some((p: any) => p.status === 'approved')) return 5;
  const contracts = workspace.contracts || [];
  if (contracts.some((c: any) => c.status === 'company_approved' || c.status === 'completed')) return 4;
  if (contracts.some((c: any) => c.status === 'client_approved')) return 3;
  if (contracts.some((c: any) => c.status === 'sent')) return 2;
  if (client.signed_at) return 1;
  return 0;
}

const STAGE_TO_TAB: Record<number, string> = {
  1: 'العقود',
  2: 'العقود',
  3: 'العقود',
  4: 'المدفوعات',
  5: 'المدفوعات',
};

export default function StagesStepper({ client, workspace, onStageClick }: { client: any; workspace: any; onStageClick?: (tab: string) => void }) {
  const current = getCurrentStage(client, workspace);

  return (
    <div className="bg-[var(--color-card)] rounded-xl border border-[var(--color-card-border)] p-4">
      <div className="flex items-center justify-between gap-1 overflow-x-auto">
        {STAGES.map((stage, i) => {
          const done = i < current;
          const active = i === current;
          return (
              <div key={stage.key} className="flex items-center gap-1 flex-1 min-w-0">
                <button onClick={() => onStageClick?.(STAGE_TO_TAB[i] || 'العقود')}
                  className={`flex flex-col items-center gap-1 min-w-0 cursor-pointer ${active ? 'opacity-100' : done ? 'opacity-100' : 'opacity-40'} hover:opacity-80 transition-opacity`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-colors ${
                    done ? 'bg-[var(--color-primary)] text-white' :
                    active ? 'border border-[var(--color-gold)] text-[var(--color-gold)]' :
                    'bg-[var(--color-text-disabled)] text-white'
                  }`}>
                    {done ? '✓' : stage.icon}
                  </div>
                  <span className={`text-[10px] whitespace-nowrap text-center ${
                    done ? 'text-[var(--color-primary)] font-medium' :
                    active ? 'text-[var(--color-gold)] font-medium' :
                    'text-[var(--color-text-disabled)]'
                  }`}>
                    {stage.label}
                  </span>
                </button>
              {i < STAGES.length - 1 && (
                <div className={`flex-1 h-0.5 mx-1 rounded ${i < current ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-card-border)]'}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
