import { ChevronDown, Eye, EyeOff, Loader2, Server } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { getCredentials, getSettings, saveCredentials, saveSettings } from "../storage/settings"
import { cn } from "../utils/cn"
import { APP_NAME } from "../utils/constants"
import { normalizeServerUrl } from "../utils/url"

export default function Options() {
  const [serverUrl, setServerUrl] = useState("")
  const [pollingInterval, setPollingInterval] = useState(5)
  const [enableNotifications, setEnableNotifications] = useState(true)
  const [syncOnTabChange, setSyncOnTabChange] = useState(true)
  const [syncOnWindowFocus, setSyncOnWindowFocus] = useState(true)
  const [autoLoginEnabled, setAutoLoginEnabled] = useState(false)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [serverUrlTouched, setServerUrlTouched] = useState(false)
  const [usernameTouched, setUsernameTouched] = useState(false)
  const [passwordTouched, setPasswordTouched] = useState(false)

  const serverUrlInputRef = useRef<HTMLInputElement>(null)
  const usernameInputRef = useRef<HTMLInputElement>(null)
  const passwordInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    Promise.all([getSettings(), getCredentials()]).then(([settings, creds]) => {
      const u = creds.username || ""
      const p = creds.password || ""
      setServerUrl(settings.serverUrl || "")
      setPollingInterval(settings.pollingInterval)
      setEnableNotifications(settings.enableNotifications)
      setSyncOnTabChange(settings.syncOnTabChange)
      setSyncOnWindowFocus(settings.syncOnWindowFocus)
      setAutoLoginEnabled(creds.autoLoginEnabled)
      setUsername(u)
      setPassword(p)

      setLoading(false)
    })
  }, [])

  const handleServerUrlBlur = () => {
    setServerUrlTouched(true)
    if (serverUrl.trim()) {
      setServerUrl(normalizeServerUrl(serverUrl))
    }
  }

  const isValidUrl = (url: string) => {
    const trimmed = url.trim()
    if (!trimmed) return false
    try {
      const parsed = new URL(trimmed.startsWith("http://") || trimmed.startsWith("https://") ? trimmed : `https://${trimmed}`)
      return parsed.protocol === "http:" || parsed.protocol === "https:"
    } catch {
      return false
    }
  }

  const isServerUrlError = !isValidUrl(serverUrl)
  const showServerUrlError = isServerUrlError && serverUrlTouched

  const isUsernameError = autoLoginEnabled && !username.trim()
  const isPasswordError = autoLoginEnabled && !password.trim()

  const showUsernameError = isUsernameError && usernameTouched
  const showPasswordError = isPasswordError && passwordTouched

  const handleSave = async () => {
    if (isServerUrlError || isUsernameError || isPasswordError) {
      setServerUrlTouched(true)
      setUsernameTouched(true)
      setPasswordTouched(true)

      if (isServerUrlError) {
        serverUrlInputRef.current?.focus()
      } else if (isUsernameError) {
        usernameInputRef.current?.focus()
      } else if (isPasswordError) {
        passwordInputRef.current?.focus()
      }
      return
    }

    setSaved(false)
    setServerUrlTouched(false)
    setUsernameTouched(false)
    setPasswordTouched(false)

    const formattedServerUrl = normalizeServerUrl(serverUrl)
    setServerUrl(formattedServerUrl)

    await Promise.all([
      saveSettings({
        serverUrl: formattedServerUrl,
        pollingInterval,
        enableNotifications,
        syncOnTabChange,
        syncOnWindowFocus,
      }),
      saveCredentials({
        autoLoginEnabled,
        username: username.trim(),
        password: password.trim(),
      }),
    ])
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 font-sans">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="text-sm font-medium text-slate-500">Đang tải cấu hình...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-start justify-center bg-slate-100 px-5 py-12 font-sans">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <header className="flex items-center gap-4">
          <img src="/icon.png" alt="Logo" className="h-11 w-11 rounded-lg object-contain" />
          <div>
            <h1 className="text-lg font-bold tracking-tight">{APP_NAME}</h1>
            <p className="text-xs text-slate-500">Cấu hình hệ thống</p>
          </div>
        </header>

        <div className="my-6 h-px w-full bg-slate-200"></div>

        <main className="flex flex-col">
          {/* Server URL Config - Highlighted Card */}
          <div className="rounded-xl border border-blue-100 bg-linear-to-b from-blue-50/60 to-slate-50/40 p-4.5 shadow-xs transition-all">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white shadow-xs">
                  <Server className="h-4 w-4" />
                </div>
                <label className="text-sm font-bold text-slate-800">
                  Địa chỉ Zimbra Mail Server <span className="text-red-500">*</span>
                </label>
              </div>
              <span className="rounded-md bg-blue-100/80 px-2 py-0.5 text-[10px] font-semibold text-blue-700">Bắt buộc</span>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
              Đường dẫn trang web mail server Zimbra của bạn để ứng dụng kết nối và lấy dữ liệu email.
            </p>
            <div className="mt-3">
              <input
                ref={serverUrlInputRef}
                type="url"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                onBlur={handleServerUrlBlur}
                placeholder="https://example.com"
                className={cn(
                  "w-full rounded-lg border bg-white px-3.5 py-2.5 text-xs font-medium shadow-xs transition-all focus:ring-3 focus:outline-none",
                  showServerUrlError
                    ? "border-red-500 text-red-900 focus:ring-red-600/15"
                    : "border-slate-200 text-slate-800 hover:border-blue-300 focus:ring-blue-600/15"
                )}
                aria-invalid={showServerUrlError}
              />
              {showServerUrlError && (
                <p className="mt-1.5 text-xs font-medium text-red-500">
                  {!serverUrl.trim() ? "Vui lòng nhập đường dẫn URL của Server" : "Định dạng URL không hợp lệ (ví dụ: https://example.com)"}
                </p>
              )}
            </div>
          </div>

          <div className="my-6 h-px w-full bg-slate-200"></div>

          {/* Polling Interval Selection */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold">Tần suất kiểm tra email</label>
            <p className="max-w-sm text-xs leading-relaxed text-slate-500">Khoảng thời gian giữa các lần quét hòm thư để phát hiện thư mới.</p>
            <div className="relative mt-1 w-full">
              <select
                value={pollingInterval}
                onChange={(e) => setPollingInterval(parseInt(e.target.value, 10))}
                className="w-full cursor-pointer appearance-none rounded-lg border border-slate-200 py-2.5 pr-10 pl-3.5 text-xs font-medium transition-all hover:border-slate-300 focus:ring-3 focus:ring-blue-600/15 focus:outline-none"
              >
                <option value="5">5 phút</option>
                <option value="15">15 phút</option>
                <option value="30">30 phút</option>
                <option value="60">1 giờ</option>
              </select>
              <ChevronDown className="pointer-events-none absolute top-1/2 right-3.5 h-4 w-4 -translate-y-1/2 text-slate-500" />
            </div>
          </div>

          <div className="my-6 h-px w-full bg-slate-200"></div>

          {/* Desktop Notifications Toggle */}
          <div className="flex flex-row items-center justify-between gap-5">
            <div className="flex flex-col gap-0.5">
              <label className="text-sm font-semibold">Hiển thị thông báo màn hình</label>
              <p className="max-w-sm text-xs leading-relaxed text-slate-500">Hiện thông báo Windows khi có email mới gửi đến hòm thư.</p>
            </div>
            <button
              role="checkbox"
              aria-checked={enableNotifications}
              onClick={() => setEnableNotifications(!enableNotifications)}
              className={cn(
                "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:ring-3 focus:ring-blue-600/15 focus:outline-none",
                enableNotifications ? "bg-blue-600" : "bg-slate-300"
              )}
            >
              <span
                className={cn(
                  "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out",
                  enableNotifications ? "translate-x-5" : "translate-x-0"
                )}
              />
            </button>
          </div>

          <div className="my-6 h-px w-full bg-slate-200"></div>

          {/* Sync On Tab Change Toggle */}
          <div className="flex flex-row items-center justify-between gap-5">
            <div className="flex flex-col gap-0.5">
              <label className="text-sm font-semibold">Đồng bộ khi chuyển tab</label>
              <p className="max-w-sm text-xs leading-relaxed text-slate-500">Tự động quét hòm thư khi bạn mở/chuyển vào tab mail Zimbra.</p>
            </div>
            <button
              role="checkbox"
              aria-checked={syncOnTabChange}
              onClick={() => setSyncOnTabChange(!syncOnTabChange)}
              className={cn(
                "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:ring-3 focus:ring-blue-600/15 focus:outline-none",
                syncOnTabChange ? "bg-blue-600" : "bg-slate-300"
              )}
            >
              <span
                className={cn(
                  "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out",
                  syncOnTabChange ? "translate-x-5" : "translate-x-0"
                )}
              />
            </button>
          </div>

          <div className="my-6 h-px w-full bg-slate-200"></div>

          {/* Sync On Window Focus Toggle */}
          <div className="flex flex-row items-center justify-between gap-5">
            <div className="flex flex-col gap-0.5">
              <label className="text-sm font-semibold">Đồng bộ khi chuyển cửa sổ</label>
              <p className="max-w-sm text-xs leading-relaxed text-slate-500">Tự động quét hòm thư khi cửa sổ trình duyệt chứa tab mail được focus.</p>
            </div>
            <button
              role="checkbox"
              aria-checked={syncOnWindowFocus}
              onClick={() => setSyncOnWindowFocus(!syncOnWindowFocus)}
              className={cn(
                "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:ring-3 focus:ring-blue-600/15 focus:outline-none",
                syncOnWindowFocus ? "bg-blue-600" : "bg-slate-300"
              )}
            >
              <span
                className={cn(
                  "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out",
                  syncOnWindowFocus ? "translate-x-5" : "translate-x-0"
                )}
              />
            </button>
          </div>

          <div className="my-6 h-px w-full bg-slate-200"></div>

          {/* Auto Login Section */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-row items-center justify-between gap-5">
              <div className="flex flex-col gap-0.5">
                <label className="text-sm font-semibold">Tự động đăng nhập</label>
                <p className="max-w-sm text-xs leading-relaxed text-slate-500">Tự động đăng nhập lại khi phiên làm việc hết hạn.</p>
              </div>
              <button
                role="checkbox"
                aria-checked={autoLoginEnabled}
                onClick={() => {
                  setAutoLoginEnabled(!autoLoginEnabled)
                  setUsernameTouched(false)
                  setPasswordTouched(false)
                }}
                className={cn(
                  "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:ring-3 focus:ring-blue-600/15 focus:outline-none",
                  autoLoginEnabled ? "bg-blue-600" : "bg-slate-300"
                )}
              >
                <span
                  className={cn(
                    "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out",
                    autoLoginEnabled ? "translate-x-5" : "translate-x-0"
                  )}
                />
              </button>
            </div>

            {autoLoginEnabled && (
              <div className="flex flex-col gap-4 rounded-lg bg-slate-50 p-4 transition-all duration-300">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700">Tên đăng nhập (Email)</label>
                  <input
                    ref={usernameInputRef}
                    type="email"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onBlur={() => setUsernameTouched(true)}
                    placeholder="name@example.com"
                    className={cn(
                      "w-full rounded-lg border bg-white px-3 py-2 text-xs font-medium transition-all focus:ring-3 focus:outline-none",
                      showUsernameError ? "border-red-500 focus:ring-red-600/15" : "border-slate-200 hover:border-slate-300 focus:ring-blue-600/15"
                    )}
                    aria-invalid={showUsernameError}
                  />
                  {showUsernameError && <span className="text-[10px] font-medium text-red-500">Tên đăng nhập không được để trống</span>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700">Mật khẩu</label>
                  <div className="relative">
                    <input
                      ref={passwordInputRef}
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onBlur={() => setPasswordTouched(true)}
                      placeholder="••••••••"
                      className={cn(
                        "w-full rounded-lg border bg-white py-2 pr-10 pl-3 text-xs font-medium transition-all focus:ring-3 focus:outline-none",
                        showPasswordError ? "border-red-500 focus:ring-red-600/15" : "border-slate-200 hover:border-slate-300 focus:ring-blue-600/15"
                      )}
                      aria-invalid={showPasswordError}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 focus:outline-none"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {showPasswordError && <span className="text-[10px] font-medium text-red-500">Mật khẩu không được để trống</span>}
                </div>
                <div className="flex flex-col gap-1.5 rounded border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-800">
                  <div>
                    <strong>Cảnh báo bảo mật:</strong> Mật khẩu sẽ được lưu trên thiết bị này dưới dạng không mã hóa của trình duyệt. Chỉ bật tính năng nếu bạn
                    tin tưởng thiết bị hiện tại.
                  </div>
                  <div className="border-t border-amber-200/50 pt-1.5 font-medium text-red-800">
                    <strong>Quan trọng:</strong> Hãy kiểm tra kỹ mật khẩu trước khi lưu. Hệ thống tự động đồng bộ mỗi {pollingInterval} phút; nếu mật khẩu sai
                    liên tục, tài khoản của bạn có thể bị khóa tạm thời trên máy chủ Zimbra.
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="my-6 h-px w-full bg-slate-200"></div>

          {/* Action Save Buttons */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleSave}
              disabled={saved}
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md transition-all enabled:hover:-translate-y-0.5 enabled:hover:bg-blue-700 enabled:active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Lưu Cài Đặt
            </button>
            <span
              className={cn(
                "text-xs font-medium text-emerald-500 transition-all duration-300",
                saved ? "translate-x-0 opacity-100" : "-translate-x-2 opacity-0"
              )}
            >
              Đã lưu cấu hình!
            </span>
          </div>
        </main>
      </div>
    </div>
  )
}
