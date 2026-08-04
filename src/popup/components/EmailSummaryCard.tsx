import { Alert, AlertAction, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  AlertTriangleIcon,
  Check,
  Copy,
  RotateCcw,
  Sparkles,
} from "lucide-react"
import { useState } from "react"
interface EmailSummaryCardProps {
  data: string | null
  loading: boolean
  error: string | null
  onRegenerate: () => void
}

export function EmailSummaryCard({
  data,
  loading,
  error,
  onRegenerate,
}: EmailSummaryCardProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    if (!data) return
    navigator.clipboard.writeText(data)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleOpenOptions = () => {
    chrome.runtime.openOptionsPage()
  }

  if (loading && !data) {
    return (
      <Card
        size="sm"
        className="gap-2 overflow-visible border-indigo-200 bg-indigo-100/80 text-indigo-600 dark:border-indigo-900 dark:bg-indigo-950 dark:text-indigo-50"
      >
        <CardHeader>
          <CardTitle className="flex h-7 items-center gap-1.5">
            <Spinner className="size-3.5 animate-spin" />
            <span>AI đang tóm tắt nội dung email...</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1.5">
          <Skeleton className="h-4.5 w-full" />
          <Skeleton className="h-4.5 w-3/4" />
        </CardContent>
      </Card>
    )
  }

  if (error && !data) {
    const isMissingKey = error.includes("[MISSING_API_KEY]")

    return (
      <Alert className="border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-50">
        <AlertTriangleIcon />
        <AlertTitle>{error.replace("[MISSING_API_KEY]", "").trim()}</AlertTitle>

        <AlertAction>
          {isMissingKey ? (
            <Button
              size="xs"
              variant="link"
              className="text-amber-900 dark:text-amber-50"
              onClick={handleOpenOptions}
            >
              Cài đặt
            </Button>
          ) : (
            <Button
              size="xs"
              variant="link"
              className="text-amber-900 dark:text-amber-50"
              onClick={onRegenerate}
            >
              Thử lại
            </Button>
          )}
        </AlertAction>
      </Alert>
    )
  }

  if (!data) return null

  return (
    <Card
      size="sm"
      className="gap-2 overflow-visible border-indigo-200 bg-indigo-100/80 text-indigo-600 dark:border-indigo-900 dark:bg-indigo-950 dark:text-indigo-50"
    >
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="flex flex-1 items-center gap-1.5">
          <Sparkles className="size-3.5" />
          <span>Tóm tắt từ AI</span>
        </CardTitle>

        <CardAction className="space-x-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCopy}
                disabled={loading}
                className="text-muted-foreground hover:text-foreground"
              >
                {copied ? <Check className="text-success" /> : <Copy />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {copied ? "Đã sao chép" : "Sao chép tóm tắt"}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onRegenerate}
                disabled={loading}
                className="text-muted-foreground hover:text-foreground"
              >
                <RotateCcw />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Tóm tắt lại</TooltipContent>
          </Tooltip>
        </CardAction>
      </CardHeader>

      <CardContent>
        <div className="text-sm leading-relaxed font-normal wrap-break-word whitespace-pre-wrap text-foreground">
          {data}
          {loading && (
            <span className="ml-1 inline-block size-2.5 animate-pulse rounded-full bg-info align-middle" />
          )}
        </div>
      </CardContent>
    </Card>
  )
}
