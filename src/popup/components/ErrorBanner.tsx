import { AlertTriangle, X } from "lucide-react"

interface ErrorBannerProps {
  errorMessage: string | null
  setErrorMessage: (msg: string | null) => void
}

export default function ErrorBanner({ errorMessage, setErrorMessage }: ErrorBannerProps) {
  if (!errorMessage) return null

  return (
    <div className="mx-2 my-2 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-800 transition-all">
      <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
      <span className="flex-1 leading-relaxed">{errorMessage}</span>
      <button
        onClick={() => setErrorMessage(null)}
        className="flex cursor-pointer items-center justify-center border-none bg-transparent p-0 text-red-500 hover:text-red-800"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
