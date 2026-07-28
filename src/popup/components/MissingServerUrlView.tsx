import { Settings } from "lucide-react"
import EmptyState from "./EmptyState"

export default function MissingServerUrlView() {
  return (
    <EmptyState
      icon={<Settings className="h-6 w-6" />}
      iconClassName="bg-amber-50 text-amber-600"
      title="Chưa cấu hình Server"
      description="Vui lòng nhập địa chỉ Zimbra Mail Server trong trang Cài đặt để ứng dụng hoạt động."
      action={
        <button
          onClick={() => chrome.runtime.openOptionsPage()}
          className="mt-2 inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border-none bg-blue-600 px-4 py-2.5 font-sans text-xs font-semibold text-white shadow-md transition-all outline-none hover:-translate-y-0.5 hover:bg-blue-700 focus-visible:ring-3 focus-visible:ring-blue-600/20 active:translate-y-0"
        >
          Mở Cài đặt
        </button>
      }
    />
  )
}
