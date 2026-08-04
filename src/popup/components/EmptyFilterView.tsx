import { CheckCircle, Inbox, Paperclip, Search } from "lucide-react"
import type { EmailFilterType } from "../../types"
import { EmailFilter } from "../../utils/constants"
import EmptyState from "./EmptyState"
import FlagIcon from "./FlagIcon"

interface EmptyFilterViewProps {
  searchQuery: string
  filterType: EmailFilterType
}

export default function EmptyFilterView({
  searchQuery,
  filterType,
}: EmptyFilterViewProps) {
  if (searchQuery.trim() !== "") {
    return (
      <EmptyState
        icon={<Search className="size-6" />}
        title="Không tìm thấy thư phù hợp"
        description="Hãy thử lại bằng từ khóa khác."
      />
    )
  }

  if (filterType === EmailFilter.UNREAD) {
    return (
      <EmptyState
        icon={<CheckCircle className="size-6" />}
        iconClassName="bg-success/10 text-success"
        title="Tuyệt vời!"
        description="Bạn đã đọc hết tất cả các email."
      />
    )
  }

  if (filterType === EmailFilter.FLAGGED) {
    return (
      <EmptyState
        icon={<FlagIcon className="size-6" />}
        iconClassName="bg-destructive/10 text-destructive"
        title="Không có thư được gắn cờ"
        description="Bạn chưa gắn cờ email nào."
      />
    )
  }

  if (filterType === EmailFilter.HAS_ATTACHMENT) {
    return (
      <EmptyState
        icon={<Paperclip className="size-6" />}
        iconClassName="bg-warning/10 text-warning"
        title="Không có thư có tệp"
        description="Không tìm thấy email nào có tệp đính kèm."
      />
    )
  }

  return (
    <EmptyState
      icon={<Inbox className="size-6" />}
      iconClassName="bg-primary/10 text-primary"
      title="Hộp thư trống"
      description="Không có email nào trong hộp thư của bạn."
    />
  )
}
