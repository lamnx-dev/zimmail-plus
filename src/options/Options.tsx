import { Bell, CheckCircle2, Eye, EyeOff, KeyRound, Loader2, Network, RefreshCw, Server, Sliders } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { version } from "../../package.json"
import { Input } from "../components/ui/Input"
import { Select } from "../components/ui/Select"
import Switch from "../components/ui/Switch"
import ErrorBanner from "../popup/components/ErrorBanner"
import { getCredentials, getSettings, saveCredentials, saveSettings } from "../storage/settings"
import type { MessageResult } from "../types"
import { cn } from "../utils/cn"
import { ActionType, APP_NAME } from "../utils/constants"
import { isValidUrl, normalizeServerUrl } from "../utils/url"

type TabType = "account" | "preferences"

export default function Options() {
  const [activeTab, setActiveTab] = useState<TabType>("account")

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
  const [verifying, setVerifying] = useState(false)
  const [serverUrlError, setServerUrlError] = useState<string | null>(null)
  const [verifyError, setVerifyError] = useState<string | null>(null)
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

  const isInvalidUrlFormat = !isValidUrl(serverUrl)
  const showServerUrlFormatError = isInvalidUrlFormat && serverUrlTouched

  const isUsernameError = autoLoginEnabled && !username.trim()
  const isPasswordError = autoLoginEnabled && !password.trim()

  const showUsernameError = (isUsernameError && usernameTouched) || !!verifyError
  const showPasswordError = (isPasswordError && passwordTouched) || !!verifyError

  const handleSave = async () => {
    if (isInvalidUrlFormat || isUsernameError || isPasswordError) {
      setServerUrlTouched(true)
      setUsernameTouched(true)
      setPasswordTouched(true)

      if (isInvalidUrlFormat) {
        setActiveTab("account")
        serverUrlInputRef.current?.focus()
      } else if (isUsernameError) {
        setActiveTab("account")
        usernameInputRef.current?.focus()
      } else if (isPasswordError) {
        setActiveTab("account")
        passwordInputRef.current?.focus()
      }
      return
    }

    setSaved(false)
    setServerUrlError(null)
    setVerifyError(null)
    setServerUrlTouched(false)
    setUsernameTouched(false)
    setPasswordTouched(false)

    const formattedServerUrl = normalizeServerUrl(serverUrl)
    setServerUrl(formattedServerUrl)

    setVerifying(true)

    try {
      const serverRes: MessageResult = await chrome.runtime.sendMessage({
        action: ActionType.VERIFY_SERVER_URL,
        serverUrl: formattedServerUrl,
      })

      if (!serverRes?.success) {
        setServerUrlError(serverRes?.error || "Không thể kết nối tới máy chủ Zimbra.")
        setActiveTab("account")
        serverUrlInputRef.current?.focus()
        setVerifying(false)
        return
      }

      if (autoLoginEnabled) {
        const credRes: MessageResult = await chrome.runtime.sendMessage({
          action: ActionType.VERIFY_CREDENTIALS,
          serverUrl: formattedServerUrl,
          username: username.trim(),
          password: password.trim(),
        })

        if (!credRes?.success) {
          setVerifyError(credRes?.error || "Xác thực tài khoản thất bại. Vui lòng kiểm tra lại thông tin.")
          setActiveTab("account")
          usernameInputRef.current?.focus()
          setVerifying(false)
          return
        }
      }

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
      setTimeout(() => setSaved(false), 2500)
    } finally {
      setVerifying(false)
    }
  }

  const bannerError = serverUrlError || verifyError
  const handleClearBannerError = () => {
    setServerUrlError(null)
    setVerifyError(null)
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
    <div className="flex min-h-screen items-start justify-center bg-slate-100 px-4 py-8 font-sans antialiased">
      <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        {/* Header Compact */}
        <header className="flex items-center justify-between border-b border-slate-100 bg-linear-to-r from-slate-900 to-slate-800 px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <img src="/icon.png" alt="Logo" className="size-8" />
            <div>
              <h1 className="text-base font-bold tracking-tight text-white">{APP_NAME}</h1>
              <p className="text-xs text-slate-300">Cấu hình máy chủ & Tùy chọn hệ thống</p>
            </div>
          </div>
          <span className="rounded-full border border-blue-400/30 bg-blue-500/20 px-2.5 py-1 text-[10px] font-semibold text-blue-300">v{version}</span>
        </header>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50/80 px-6">
          <button
            onClick={() => setActiveTab("account")}
            className={cn(
              "flex cursor-pointer items-center gap-2 border-b-2 px-4 py-3 text-xs font-semibold transition-all",
              activeTab === "account"
                ? "border-blue-600 bg-white text-blue-600 shadow-xs"
                : "border-transparent text-slate-500 hover:bg-slate-100/50 hover:text-slate-700"
            )}
          >
            <Network className="h-3.5 w-3.5" />
            Kết Nối
          </button>
          <button
            onClick={() => setActiveTab("preferences")}
            className={cn(
              "flex cursor-pointer items-center gap-2 border-b-2 px-4 py-3 text-xs font-semibold transition-all",
              activeTab === "preferences"
                ? "border-blue-600 bg-white text-blue-600 shadow-xs"
                : "border-transparent text-slate-500 hover:bg-slate-100/50 hover:text-slate-700"
            )}
          >
            <Sliders className="h-3.5 w-3.5" />
            Tùy Chọn
          </button>
        </div>

        {/* Main Tab Content */}
        <main className="p-6">
          {bannerError && <ErrorBanner className="mb-4" errorMessage={bannerError} setErrorMessage={handleClearBannerError} />}

          {activeTab === "account" && (
            <div className="flex flex-col gap-4">
              {/* Server URL Config */}
              <div className="flex flex-col gap-2 rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Server className="h-4 w-4 text-blue-600" />
                    <label className="text-xs font-semibold text-slate-700">
                      Địa chỉ Zimbra Mail Server <span className="text-red-500">*</span>
                    </label>
                  </div>
                  <span className="rounded bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">Bắt buộc</span>
                </div>
                <div className="mt-1">
                  <Input
                    ref={serverUrlInputRef}
                    type="url"
                    value={serverUrl}
                    onChange={(e) => {
                      setServerUrl(e.target.value)
                      if (serverUrlError) setServerUrlError(null)
                    }}
                    onBlur={handleServerUrlBlur}
                    placeholder="https://example.com"
                    aria-invalid={showServerUrlFormatError || !!serverUrlError}
                  />
                  {showServerUrlFormatError && (
                    <p className="mt-1 text-[10px] font-medium text-red-500">
                      {!serverUrl.trim() ? "Vui lòng nhập đường dẫn Server URL" : "Định dạng URL không hợp lệ"}
                    </p>
                  )}
                </div>
              </div>

              {/* Auto Login Section */}
              <div className="flex flex-col gap-2 rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <KeyRound className="h-4 w-4 text-amber-500" />
                    <label className="text-xs font-semibold text-slate-700">Tự động đăng nhập</label>
                  </div>
                  <Switch
                    checked={autoLoginEnabled}
                    onCheckedChange={(val) => {
                      setAutoLoginEnabled(val)
                      setUsernameTouched(false)
                      setPasswordTouched(false)
                      if (verifyError) setVerifyError(null)
                    }}
                  />
                </div>

                {autoLoginEnabled && (
                  <div className="mt-2 flex flex-col gap-2">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-slate-700">Tên đăng nhập</label>
                      <Input
                        ref={usernameInputRef}
                        type="email"
                        value={username}
                        onChange={(e) => {
                          setUsername(e.target.value)
                          if (verifyError) setVerifyError(null)
                        }}
                        onBlur={() => setUsernameTouched(true)}
                        placeholder="username@example.com"
                        aria-invalid={showUsernameError && !verifyError}
                      />
                      {showUsernameError && !verifyError && <span className="text-[10px] font-medium text-red-500">Tên đăng nhập không được để trống</span>}
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-slate-700">Mật khẩu</label>
                      <div className="relative">
                        <Input
                          ref={passwordInputRef}
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value)
                            if (verifyError) setVerifyError(null)
                          }}
                          onBlur={() => setPasswordTouched(true)}
                          placeholder="••••••••"
                          className="pr-10"
                          aria-invalid={showPasswordError && !verifyError}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 flex cursor-pointer items-center pr-3 text-slate-400 hover:text-slate-600"
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                      {showPasswordError && !verifyError && <span className="text-[10px] font-medium text-red-500">Mật khẩu không được để trống</span>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "preferences" && (
            <div className="flex flex-col gap-4">
              {/* Polling Interval Selection */}
              <div className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 p-4">
                <div className="flex items-center gap-3">
                  <RefreshCw className="h-4 w-4 shrink-0 text-blue-600" />
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Tần suất kiểm tra email</label>
                    <p className="text-xs text-slate-500">Chu kỳ hệ thống tự động kiểm tra và cập nhật hòm thư ngầm.</p>
                  </div>
                </div>
                <Select value={pollingInterval} onChange={(e) => setPollingInterval(parseInt(e.target.value, 10))} className="w-auto">
                  <option value="5">5 phút</option>
                  <option value="15">15 phút</option>
                  <option value="30">30 phút</option>
                  <option value="60">1 giờ</option>
                </Select>
              </div>

              {/* Desktop Notifications Toggle */}
              <div className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 p-4">
                <div className="flex items-center gap-3">
                  <Bell className="h-4 w-4 shrink-0 text-amber-500" />
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Thông báo màn hình (Windows)</label>
                    <p className="text-xs text-slate-500">Gửi thông báo nổi ở góc màn hình ngay khi phát hiện có email mới.</p>
                  </div>
                </div>
                <Switch checked={enableNotifications} onCheckedChange={setEnableNotifications} />
              </div>

              {/* Sync On Tab Change Toggle */}
              <div className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 p-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Đồng bộ khi chuyển tab</label>
                  <p className="text-xs text-slate-500">Tự động làm mới dữ liệu khi chuyển sang tab làm việc Zimbra Mail.</p>
                </div>
                <Switch checked={syncOnTabChange} onCheckedChange={setSyncOnTabChange} />
              </div>

              {/* Sync On Window Focus Toggle */}
              <div className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 p-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Đồng bộ khi chuyển cửa sổ</label>
                  <p className="text-xs text-slate-500">Tự động làm mới dữ liệu khi quay lại cửa sổ trình duyệt chứa Zimbra Mail.</p>
                </div>
                <Switch checked={syncOnWindowFocus} onCheckedChange={setSyncOnWindowFocus} />
              </div>
            </div>
          )}

          {/* Bottom Actions Bar */}
          <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
            <div className="flex items-center gap-2">
              <button
                onClick={handleSave}
                disabled={saved || verifying}
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-xs transition-all enabled:hover:bg-blue-700 enabled:active:scale-98 disabled:opacity-50"
              >
                {verifying && <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />}
                {verifying ? "Đang kiểm tra kết nối..." : "Lưu Cài Đặt"}
              </button>

              {saved && (
                <span className="animate-in fade-in flex items-center gap-1.5 text-xs font-semibold text-emerald-600 duration-300">
                  <CheckCircle2 className="h-4 w-4" /> Đã lưu thành công!
                </span>
              )}
            </div>

            <p className="text-[10px] text-slate-400">Tất cả thay đổi sẽ có hiệu lực ngay lập tức.</p>
          </div>
        </main>
      </div>
    </div>
  )
}
