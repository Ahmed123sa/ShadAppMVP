export function LoadingSkeleton({ message = 'جاري التحميل...' }: { message?: string }) {
  return (
    <div className="text-center py-8 text-zinc-400">{message}</div>
  );
}
