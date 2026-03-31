export function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div>
        <div className="h-8 w-48 bg-gray-200 rounded" />
        <div className="h-4 w-64 bg-gray-100 rounded mt-2" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border rounded-xl p-5 space-y-3">
            <div className="h-3 w-20 bg-gray-200 rounded" />
            <div className="h-8 w-16 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border rounded-xl h-64 bg-gray-50" />
        <div className="border rounded-xl h-64 bg-gray-50" />
      </div>
      <div className="border rounded-xl p-5 space-y-3">
        <div className="h-4 w-24 bg-gray-200 rounded" />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex gap-3 py-2">
            <div className="h-5 w-14 bg-gray-200 rounded-full" />
            <div className="flex-1 space-y-1">
              <div className="h-4 w-3/4 bg-gray-100 rounded" />
              <div className="h-3 w-1/3 bg-gray-50 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function NewsListSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="border rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-5 w-14 bg-gray-200 rounded-full" />
            <div className="h-3 w-32 bg-gray-100 rounded" />
          </div>
          <div className="h-4 w-3/4 bg-gray-200 rounded" />
          <div className="h-3 w-full bg-gray-50 rounded" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2 animate-pulse">
      <div className="h-10 bg-gray-100 rounded" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 bg-gray-50 rounded" />
      ))}
    </div>
  );
}
