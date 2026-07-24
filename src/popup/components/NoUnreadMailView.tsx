import { CheckCircle } from "lucide-react"
import EmptyState from "./EmptyState"

export default function NoUnreadMailView() {
  return (
    <EmptyState
      icon={<CheckCircle className="h-6 w-6" />}
      iconClassName="bg-green-50 text-green-700"
      title="Tuyệt vời!"
      description="Bạn đã đọc hết tất cả các email."
    />
  )
}
