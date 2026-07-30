import type { ReactNode } from "react"
import { cn } from "../../lib/utils"

interface EmptyStateProps {
  icon: ReactNode
  title: string
  description?: string
  iconClassName?: string
  action?: ReactNode
}

export default function EmptyState({
  icon,
  title,
  description,
  iconClassName = "bg-muted text-muted-foreground",
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-1 px-6 py-9 text-center">
      <div
        className={cn(
          "mb-1 flex size-12 items-center justify-center rounded-full",
          iconClassName
        )}
      >
        {icon}
      </div>
      <h3 className="text-sm font-bold">{title}</h3>
      {description && (
        <p className="text-xs leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
      {action}
    </div>
  )
}
