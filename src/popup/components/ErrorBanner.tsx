import { Alert, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertTriangle, X } from "lucide-react"
import { cn } from "../../lib/utils"

interface ErrorBannerProps {
  errorMessage: string | null
  setErrorMessage: (msg: string | null) => void
  className?: string
}

export default function ErrorBanner({
  errorMessage,
  setErrorMessage,
  className,
}: ErrorBannerProps) {
  if (!errorMessage) return null

  return (
    <Alert
      variant="destructive"
      className={cn("relative flex items-center justify-between", className)}
    >
      <AlertTriangle className="size-4" />
      <AlertTitle className="flex-1">{errorMessage}</AlertTitle>
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={() => setErrorMessage(null)}
        className="hover:bg-destructive/5 hover:text-destructive"
      >
        <X className="size-3.5" />
        <span className="sr-only">Đóng</span>
      </Button>
    </Alert>
  )
}
