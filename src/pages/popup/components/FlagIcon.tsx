import { Star } from "lucide-react"
import { cn } from "../../../utils/cn"

interface FlagIconProps {
  isFlagged?: boolean
  className?: string
}

export default function FlagIcon({ isFlagged, className }: FlagIconProps) {
  if (isFlagged) {
    return <Star className={cn("fill-amber-400 text-amber-400", className)} />
  }
  return <Star className={className} />
}
