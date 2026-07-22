import { ShieldAlert } from "lucide-react"
import { openZimbraInbox } from "../../../utils/navigation"

export default function DisconnectedView() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-white px-6 py-9 text-center">
      <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-700">
        <ShieldAlert className="h-6 w-6" />
      </div>
      <h3 className="text-base font-bold text-slate-900">Mất kết nối</h3>
      <p className="text-xs leading-relaxed text-slate-500">Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn.</p>
      <button
        onClick={openZimbraInbox}
        className="mt-2 inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border-none bg-blue-600 px-4 py-2.5 font-sans text-xs font-semibold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-blue-700 active:translate-y-0"
      >
        Đăng nhập
      </button>
    </div>
  )
}
