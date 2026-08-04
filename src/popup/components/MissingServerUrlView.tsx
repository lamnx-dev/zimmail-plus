import { Button } from "@/components/ui/button"
import { Settings } from "lucide-react"
import EmptyState from "./EmptyState"

export default function MissingServerUrlView() {
  return (
    <EmptyState
      icon={<Settings className="size-6" />}
      iconClassName="bg-warning/10 text-warning"
      title="Chưa cấu hình Server"
      description="Vui lòng nhập địa chỉ Zimbra Mail Server trong trang Cài đặt để ứng dụng hoạt động."
      action={
        <Button
          onClick={() => chrome.runtime.openOptionsPage()}
          className="mt-2"
        >
          Mở Cài đặt
        </Button>
      }
    />
  )
}
