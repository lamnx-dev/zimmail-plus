import { CheckCircle, Inbox, Paperclip, Search } from "lucide-react"
import type { EmailFilterType } from "../../types"
import { EmailFilter } from "../../utils/constants"
import EmptyState from "./EmptyState"
import FlagIcon from "./FlagIcon"

interface EmptyFilterViewProps {
  searchQuery: string
  filterType: EmailFilterType
}

export default function EmptyFilterView({ searchQuery, filterType }: EmptyFilterViewProps) {
  if (searchQuery.trim() !== "") {
    return <EmptyState icon={<Search className="h-6 w-6" />} title="Không tìm thấy thư phù hợp" description="Hãy thử lại bằng từ khóa khác." />
  }

  if (filterType === EmailFilter.UNREAD) {
    return (
      <EmptyState
        icon={<CheckCircle className="h-6 w-6" />}
        iconClassName="bg-green-50 text-green-700"
        title="Tuyệt vời!"
        description="Bạn đã đọc hết tất cả các email."
      />
    )
  }

  if (filterType === EmailFilter.FLAGGED) {
    return (
      <EmptyState
        icon={<FlagIcon className="h-6 w-6" />}
        iconClassName="bg-red-50 text-red-600"
        title="Không có thư được gắn cờ"
        description="Bạn chưa gắn cờ email nào."
      />
    )
  }

  if (filterType === EmailFilter.HAS_ATTACHMENT) {
    return (
      <EmptyState
        icon={<Paperclip className="h-6 w-6" />}
        iconClassName="bg-amber-50 text-amber-500"
        title="Không có thư có tệp"
        description="Không tìm thấy email nào có tệp đính kèm."
      />
    )
  }

  return (
    <EmptyState
      icon={<Inbox className="h-6 w-6" />}
      iconClassName="bg-blue-50 text-blue-600"
      title="Hộp thư trống"
      description="Không có email nào trong hộp thư của bạn."
    />
  )
}
