import { Flag } from "lucide-react"
import { cn } from "../../lib/utils"

interface FlagIconProps {
  isFlagged?: boolean
  className?: string
}

export default function FlagIcon({ isFlagged, className }: FlagIconProps) {
  if (isFlagged) {
    return <Flag className={cn("fill-red-500 text-red-500", className)} />
  }
  return <Flag className={className} />
}
