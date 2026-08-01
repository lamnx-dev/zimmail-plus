import { Badge } from "@/components/ui/badge"

interface PopupToastProps {
  message: string | null
}

export function PopupToast({ message }: PopupToastProps) {
  if (!message) return null

  return (
    <Badge className="pointer-events-none absolute top-14 left-1/2 z-50 -translate-x-1/2 transition-all duration-200">
      {message}
    </Badge>
  )
}
