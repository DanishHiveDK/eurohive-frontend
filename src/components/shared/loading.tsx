export function Loading() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-honey border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-cream-200 p-5 animate-pulse">
          <div className="h-4 bg-cream-100 rounded w-3/4 mb-3" />
          <div className="h-3 bg-cream-100 rounded w-1/2 mb-2" />
          <div className="h-3 bg-cream-100 rounded w-2/3" />
        </div>
      ))}
    </div>
  );
}
