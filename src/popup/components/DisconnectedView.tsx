import { ShieldAlert } from "lucide-react"
import { openZimbraInbox } from "../../utils/navigation"
import EmptyState from "./EmptyState"

export default function DisconnectedView() {
  return (
    <EmptyState
      icon={<ShieldAlert className="h-6 w-6" />}
      iconClassName="bg-red-50 text-red-700"
      title="Mất kết nối"
      description="Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn."
      action={
        <button
          onClick={openZimbraInbox}
          className="mt-2 inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border-none bg-blue-600 px-4 py-2.5 font-sans text-xs font-semibold text-white shadow-md transition-all outline-none hover:-translate-y-0.5 hover:bg-blue-700 focus-visible:ring-3 focus-visible:ring-blue-600/20 active:translate-y-0"
        >
          Đăng nhập
        </button>
      }
    />
  )
}
