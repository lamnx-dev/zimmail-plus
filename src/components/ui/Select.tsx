import * as React from "react"
import { cn } from "../../utils/cn"

function Select({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      data-slot="select"
      className={cn(
        "w-full cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-all outline-none hover:border-slate-300",
        "focus-visible:border-blue-500 focus-visible:ring-3 focus-visible:ring-blue-600/20",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-red-500 aria-invalid:ring-red-600/15",
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
}

export { Select }
