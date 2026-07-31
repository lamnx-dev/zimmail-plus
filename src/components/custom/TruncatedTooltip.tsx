import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import * as React from "react"

interface TruncatedTooltipProps {
  children: React.ReactNode
  content?: React.ReactNode
  className?: string
  delayDuration?: number
  side?: "top" | "right" | "bottom" | "left"
}

export function TruncatedTooltip({
  children,
  content,
  className,
  delayDuration,
  side,
}: TruncatedTooltipProps) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [isTruncated, setIsTruncated] = React.useState(false)

  const checkTruncated = () => {
    if (ref.current) {
      setIsTruncated(ref.current.scrollWidth > ref.current.clientWidth)
    }
  }

  const tooltipText = content ?? children

  return (
    <Tooltip delayDuration={delayDuration}>
      <TooltipTrigger asChild>
        <div ref={ref} onMouseEnter={checkTruncated} className={className}>
          {children}
        </div>
      </TooltipTrigger>
      {isTruncated && (
        <TooltipContent side={side}>{tooltipText}</TooltipContent>
      )}
    </Tooltip>
  )
}
