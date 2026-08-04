import { cn } from "@/lib/utils"
import type { EmailFilterType } from "@/types"
import type { RefObject } from "react"
import EmailDetail from "./EmailDetail"

interface PopupDetailContainerProps {
  isDetailOpen: boolean
  displayedEmailId: string | null
  filterType: EmailFilterType
  handleGoBack: () => void
  onFlagsChange: (id: string, updatedFlags: string) => void
  onToggleDetailReadRef: RefObject<(() => void) | null>
  onToggleDetailFlagRef: RefObject<(() => void) | null>
  onToggleDetailSummarizeRef?: RefObject<(() => void) | null>
}

export function PopupDetailContainer({
  isDetailOpen,
  displayedEmailId,
  filterType,
  handleGoBack,
  onFlagsChange,
  onToggleDetailReadRef,
  onToggleDetailFlagRef,
  onToggleDetailSummarizeRef,
}: PopupDetailContainerProps) {
  return (
    <div
      className={cn(
        "absolute inset-0 flex w-full flex-col transition-transform duration-200 ease-in-out will-change-transform",
        isDetailOpen
          ? "pointer-events-auto translate-x-0"
          : "pointer-events-none translate-x-full"
      )}
    >
      {displayedEmailId && (
        <EmailDetail
          emailId={displayedEmailId}
          filterType={filterType}
          handleGoBack={handleGoBack}
          onFlagsChange={onFlagsChange}
          onToggleDetailReadRef={onToggleDetailReadRef}
          onToggleDetailFlagRef={onToggleDetailFlagRef}
          onToggleDetailSummarizeRef={onToggleDetailSummarizeRef}
        />
      )}
    </div>
  )
}
