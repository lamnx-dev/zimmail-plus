import { Skeleton } from "../../../components/ui/skeleton"

export default function ListSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="divide-y divide-slate-200">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="flex items-start gap-3 px-4 py-3">
            <Skeleton className="mt-0.5 size-9 shrink-0 rounded-full" />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="flex items-center justify-between gap-2">
                <Skeleton className="h-[18px] w-28" />
                <Skeleton className="h-4 w-12" />
              </div>
              <Skeleton className="h-4 w-2/4" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
