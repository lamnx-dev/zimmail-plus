import { Flag } from "lucide-react"
import { cn } from "../../lib/utils"

interface FlagIconProps {
  isFlagged?: boolean
  className?: string
}

export default function FlagIcon({ isFlagged, className }: FlagIconProps) {
  if (isFlagged) {
    return (
      <Flag className={cn("fill-destructive text-destructive", className)} />
    )
  }
  return <Flag className={className} />
}
