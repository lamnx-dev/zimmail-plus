import type { ReactNode } from "react"
import { cn } from "../../utils/cn"

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
  iconClassName = "bg-slate-50 text-slate-400",
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-9 text-center">
      <div className={cn("mb-1 flex h-12 w-12 items-center justify-center rounded-full", iconClassName)}>{icon}</div>
      <h3 className="text-sm font-bold text-slate-700">{title}</h3>
      {description && <p className="text-xs leading-relaxed text-slate-500">{description}</p>}
      {action}
    </div>
  )
}
