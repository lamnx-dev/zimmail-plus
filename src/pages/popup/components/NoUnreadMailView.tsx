import { CheckCircle } from "lucide-react"

export default function NoUnreadMailView() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-white px-6 py-9 text-center">
      <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-green-50 text-green-700">
        <CheckCircle className="h-6 w-6" />
      </div>
      <h3 className="text-base font-bold text-slate-900">Tuyệt vời!</h3>
      <p className="mb-1 text-xs leading-relaxed text-slate-500">Bạn đã đọc hết tất cả các email.</p>
    </div>
  )
}
