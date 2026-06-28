'use client';

const STATUS_STEPS = [
  { key: 'draft', label: 'مسودة' },
  { key: 'sent', label: 'تم الإرسال' },
  { key: 'client_approved', label: 'موافقة العميل' },
  { key: 'company_approved', label: 'موافقة الشركة' },
  { key: 'completed', label: 'مكتمل' },
];

export default function ContractStatusStepper({ status, compact = false }: { status: string; compact?: boolean }) {
  const activeIndex = STATUS_STEPS.findIndex(s => s.key === status);
  const current = activeIndex >= 0 ? activeIndex : 0;

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 mt-2">
        {STATUS_STEPS.map((step, i) => (
          <div key={step.key} className="flex items-center">
            <div className={`
              w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium
              ${i < current ? 'bg-green-500 text-white' : ''}
              ${i === current ? 'bg-blue-500 text-white' : ''}
              ${i > current ? 'bg-gray-200 text-gray-400' : ''}
            `}>
              {i < current ? '✓' : i + 1}
            </div>
            {i < STATUS_STEPS.length - 1 && (
              <div className={`w-5 h-0.5 mx-0.5 ${i < current ? 'bg-green-500' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 my-4">
      {STATUS_STEPS.map((step, i) => (
        <div key={step.key} className="flex items-center">
          <div className={`
            w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
            ${i < current ? 'bg-green-500 text-white' : ''}
            ${i === current ? 'bg-blue-500 text-white' : ''}
            ${i > current ? 'bg-gray-200 text-gray-400' : ''}
          `}>
            {i < current ? '✓' : i + 1}
          </div>
          {i < STATUS_STEPS.length - 1 && (
            <div className={`w-8 h-0.5 mx-1 ${i < current ? 'bg-green-500' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
      <span className="text-sm text-gray-500 mr-2">
        {STATUS_STEPS.find(s => s.key === status)?.label || status}
      </span>
    </div>
  );
}
