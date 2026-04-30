function SkeletonLine({ width = 'w-full', height = 'h-4' }: { width?: string; height?: string }) {
  return (
    <div
      className={`${width} ${height} rounded bg-surface-overlay animate-pulse`}
    />
  );
}

export function ProjectCardSkeleton() {
  return (
    <div className="bg-surface-raised border border-surface-border rounded-[10px] p-5 space-y-4">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <SkeletonLine width="w-2/5" height="h-5" />
          <SkeletonLine width="w-3/4" height="h-4" />
        </div>
        <SkeletonLine width="w-16" height="h-6" />
      </div>
      <div className="space-y-2">
        <SkeletonLine width="w-full" />
        <SkeletonLine width="w-5/6" />
      </div>
      <div className="flex gap-2">
        <SkeletonLine width="w-20" height="h-6" />
        <SkeletonLine width="w-20" height="h-6" />
        <SkeletonLine width="w-20" height="h-6" />
      </div>
      <div className="flex gap-3">
        <SkeletonLine width="flex-1 h-10" height="h-10" />
        <SkeletonLine width="flex-1 h-10" height="h-10" />
      </div>
    </div>
  );
}

export function IssueCardSkeleton() {
  return (
    <div className="bg-surface-raised border border-surface-border rounded-[10px] p-5 space-y-3">
      <SkeletonLine width="w-3/4" height="h-5" />
      <div className="space-y-2">
        <SkeletonLine />
        <SkeletonLine width="w-4/5" />
      </div>
      <div className="flex gap-2">
        <SkeletonLine width="w-16" height="h-6" />
        <SkeletonLine width="w-20" height="h-6" />
      </div>
    </div>
  );
}

export function IdeaCardSkeleton() {
  return (
    <div className="bg-surface-raised border border-surface-border rounded-[10px] p-6 space-y-4">
      <SkeletonLine width="w-2/3" height="h-6" />
      <div className="space-y-2">
        <SkeletonLine />
        <SkeletonLine width="w-5/6" />
        <SkeletonLine width="w-4/5" />
      </div>
      <div className="flex gap-2">
        <SkeletonLine width="w-14" height="h-6" />
        <SkeletonLine width="w-18" height="h-6" />
      </div>
      <SkeletonLine width="w-full" height="h-10" />
    </div>
  );
}

export default function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <ProjectCardSkeleton key={i} />
      ))}
    </div>
  );
}
