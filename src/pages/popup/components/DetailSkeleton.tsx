import { ArrowLeft } from "lucide-react"
import { Skeleton } from "../../../components/ui/skeleton"

interface DetailSkeletonProps {
  handleGoBack?: () => void
}

export default function DetailSkeleton({ handleGoBack }: DetailSkeletonProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white">
      {/* Detail Header Skeleton */}
      <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-3 py-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {handleGoBack && (
            <button
              onClick={handleGoBack}
              className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-900 active:scale-95"
              title="Quay lại"
            >
              <ArrowLeft className="size-4" />
            </button>
          )}
          <Skeleton className="h-4 w-48" />
        </div>
      </div>

      {/* Detail Body Scrollable Skeleton */}
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
        {/* Sender Container Skeleton */}
        <div className="flex items-center gap-3 border-b border-slate-200 pb-3.5">
          <Skeleton className="size-9 shrink-0 rounded-full" />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-4 w-40" />
          </div>
        </div>

        {/* Email Content Frame Skeleton */}
        <div className="flex flex-col gap-3">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="mt-2 h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      </div>
    </div>
  )
}
