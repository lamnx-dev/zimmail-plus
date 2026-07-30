import { Button } from "@/components/ui/button"
import { Kbd } from "@/components/ui/kbd"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ArrowLeft } from "lucide-react"

interface DetailSkeletonProps {
  handleGoBack?: () => void
}

export default function DetailSkeleton({ handleGoBack }: DetailSkeletonProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {/* Detail Header Skeleton */}
      <div className="flex shrink-0 items-center justify-between border-b bg-background px-3.5 py-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {handleGoBack && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleGoBack}
                  className="rounded-full"
                >
                  <ArrowLeft className="size-4" />
                  <span className="sr-only">Quay lại</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <span>Quay lại</span>
                <Kbd>←</Kbd>
              </TooltipContent>
            </Tooltip>
          )}
          <Skeleton className="h-4 w-48" />
        </div>
      </div>

      {/* Detail Body Scrollable Skeleton */}
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
        {/* Sender Container Skeleton */}
        <div className="flex items-center gap-3 border-b pb-3.5">
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
