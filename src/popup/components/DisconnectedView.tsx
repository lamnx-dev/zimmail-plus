import { Settings, ShieldAlert } from "lucide-react"
import { openZimbraInbox } from "../../utils/navigation"
import EmptyState from "./EmptyState"

interface DisconnectedViewProps {
  isMissingServerUrl?: boolean
}

export default function DisconnectedView({ isMissingServerUrl }: DisconnectedViewProps) {
  if (isMissingServerUrl) {
    return (
      <EmptyState
        icon={<Settings className="h-6 w-6" />}
        iconClassName="bg-amber-50 text-amber-600"
        title="Chưa cấu hình Server"
        description="Vui lòng nhập địa chỉ Zimbra Mail Server trong trang Cài đặt để ứng dụng hoạt động."
        action={
          <button
            onClick={() => chrome.runtime.openOptionsPage()}
            className="mt-2 inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border-none bg-blue-600 px-4 py-2.5 font-sans text-xs font-semibold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-blue-700 active:translate-y-0"
          >
            Mở Cài đặt
          </button>
        }
      />
    )
  }

  return (
    <EmptyState
      icon={<ShieldAlert className="h-6 w-6" />}
      iconClassName="bg-red-50 text-red-700"
      title="Mất kết nối"
      description="Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn."
      action={
        <button
          onClick={openZimbraInbox}
          className="mt-2 inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border-none bg-blue-600 px-4 py-2.5 font-sans text-xs font-semibold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-blue-700 active:translate-y-0"
        >
          Đăng nhập
        </button>
      }
    />
  )
}
