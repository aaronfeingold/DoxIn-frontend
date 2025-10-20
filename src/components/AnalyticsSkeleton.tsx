export default function AnalyticsSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Key Metrics Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-5 w-5 bg-muted rounded"></div>
              <div className="h-5 w-32 bg-muted rounded"></div>
            </div>
            <div className="h-9 w-24 bg-muted rounded mt-2"></div>
          </div>
        ))}
      </div>

      {/* Payment Status Skeleton */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="h-7 w-48 bg-muted rounded mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="h-4 w-24 bg-muted rounded"></div>
                <div className="h-3 w-12 bg-muted rounded"></div>
              </div>
              <div className="h-8 w-16 bg-muted rounded mb-1"></div>
              <div className="h-4 w-20 bg-muted rounded"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Companies Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2].map((section) => (
          <div
            key={section}
            className="bg-card border border-border rounded-lg p-6"
          >
            <div className="h-6 w-56 bg-muted rounded mb-4"></div>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 bg-background rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-muted rounded-full"></div>
                    <div>
                      <div className="h-4 w-32 bg-muted rounded mb-2"></div>
                      <div className="h-3 w-24 bg-muted rounded"></div>
                    </div>
                  </div>
                  <div className="h-4 w-20 bg-muted rounded"></div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Monthly Trends Skeleton */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="h-7 w-40 bg-muted rounded mb-4"></div>
        <div className="space-y-3">
          <div className="grid grid-cols-4 gap-3 pb-3 border-b border-border">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-4 bg-muted rounded"></div>
            ))}
          </div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="grid grid-cols-4 gap-3 py-2">
              {[1, 2, 3, 4].map((j) => (
                <div key={j} className="h-4 bg-muted rounded"></div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
