import { AlertTriangle, X } from "lucide-react"
import { cn } from "../../utils/cn"

interface ErrorBannerProps {
  errorMessage: string | null
  setErrorMessage: (msg: string | null) => void
  className?: string
}

export default function ErrorBanner({ errorMessage, setErrorMessage, className }: ErrorBannerProps) {
  if (!errorMessage) return null

  return (
    <div className={cn("flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-800 transition-all", className)}>
      <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
      <span className="flex-1 leading-relaxed">{errorMessage}</span>
      <button
        onClick={() => setErrorMessage(null)}
        className="flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-full text-red-400 hover:bg-red-100 hover:text-red-700 active:scale-95"
        title="Đóng"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
