import { ChevronDown, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { getSettings, saveSettings } from "../../storage/settings"

export default function Options() {
  const [pollingInterval, setPollingInterval] = useState(1)
  const [enableNotifications, setEnableNotifications] = useState(true)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getSettings().then((settings) => {
      setPollingInterval(settings.pollingInterval)
      setEnableNotifications(settings.enableNotifications)
      setLoading(false)
    })
  }, [])

  const handleSave = async () => {
    setSaved(false)
    await saveSettings({
      pollingInterval,
      enableNotifications,
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 font-sans text-slate-900">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="text-sm font-medium text-slate-500">Đang tải cấu hình...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-start justify-center bg-slate-100 px-5 py-12 font-sans text-slate-900">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <header className="mb-6 flex items-center gap-4 border-b border-slate-200 pb-5">
          <img src="/assets/icon.png" alt="Logo" className="h-11 w-11 rounded-lg object-contain" />
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900">Teca Mail Plus</h1>
            <p className="text-xs text-slate-500">Cấu hình hệ thống</p>
          </div>
        </header>

        <main className="flex flex-col gap-6">
          {/* Polling Interval Selection */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-slate-900">Tần suất kiểm tra email</label>
            <p className="max-w-sm text-xs leading-relaxed text-slate-500">Khoảng thời gian giữa các lần quét hòm thư để phát hiện thư mới.</p>
            <div className="relative mt-1 w-full">
              <select
                id="polling-interval"
                value={pollingInterval}
                onChange={(e) => setPollingInterval(parseInt(e.target.value, 10))}
                className="w-full cursor-pointer appearance-none rounded-lg border border-slate-200 bg-white py-2.5 pr-10 pl-3.5 text-xs font-medium text-slate-900 transition-all hover:border-slate-300 focus:ring-3 focus:ring-blue-600/15 focus:outline-none"
              >
                <option value="1">1 phút</option>
                <option value="2">2 phút</option>
                <option value="5">5 phút</option>
                <option value="10">10 phút</option>
              </select>
              <ChevronDown className="pointer-events-none absolute top-1/2 right-3.5 h-4 w-4 -translate-y-1/2 text-slate-500" />
            </div>
          </div>

          {/* Desktop Notifications Toggle */}
          <div className="flex flex-row items-center justify-between gap-5">
            <div className="flex flex-col gap-0.5">
              <label className="text-sm font-semibold text-slate-900">Hiển thị thông báo màn hình</label>
              <p className="max-w-sm text-xs leading-relaxed text-slate-500">Hiện thông báo Windows khi có email mới gửi đến hòm thư.</p>
            </div>
            <button
              role="checkbox"
              aria-checked={enableNotifications}
              onClick={() => setEnableNotifications(!enableNotifications)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:ring-3 focus:ring-blue-600/15 focus:outline-none ${
                enableNotifications ? "bg-blue-600" : "bg-slate-300"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  enableNotifications ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Action Save Buttons */}
          <div className="mt-3 flex items-center gap-4 border-t border-slate-200 pt-5">
            <button
              id="btn-save"
              onClick={handleSave}
              disabled={saved}
              className="inline-flex cursor-pointer items-center justify-center rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-blue-700 active:translate-y-0 disabled:opacity-80"
            >
              Lưu Cài Đặt
            </button>
            <span
              id="save-status"
              className={`text-xs font-medium text-emerald-500 transition-all duration-300 ${saved ? "translate-x-0 opacity-100" : "-translate-x-2 opacity-0"}`}
            >
              Đã lưu cấu hình!
            </span>
          </div>
        </main>
      </div>
    </div>
  )
}
