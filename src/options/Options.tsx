import { useTheme } from "@/components/theme-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Bell,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Moon,
  Network,
  RefreshCw,
  Server,
  Sliders,
} from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { version } from "../../package.json"
import { Input } from "../components/ui/input"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemHeader,
  ItemMedia,
  ItemTitle,
} from "../components/ui/item"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select"
import { Switch } from "../components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { cn } from "../lib/utils"
import ErrorBanner from "../popup/components/ErrorBanner"
import {
  getCredentials,
  getSettings,
  saveCredentials,
  saveSettings,
} from "../storage/settings"
import type { MessageResult } from "../types"
import { ActionType, APP_NAME } from "../utils/constants"
import { isValidUrl, normalizeServerUrl } from "../utils/url"

type TabType = "account" | "preferences"

export default function Options() {
  const { theme, setTheme } = useTheme()
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

  const showUsernameError =
    (isUsernameError && usernameTouched) || !!verifyError
  const showPasswordError =
    (isPasswordError && passwordTouched) || !!verifyError

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
        setServerUrlError(
          serverRes?.error || "Không thể kết nối tới máy chủ Zimbra."
        )
        setActiveTab("account")
        serverUrlInputRef.current?.focus()
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
          setVerifyError(
            credRes?.error ||
              "Xác thực tài khoản thất bại. Vui lòng kiểm tra lại thông tin."
          )
          setActiveTab("account")
          usernameInputRef.current?.focus()
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

  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    handleSave()
  }

  const bannerError = serverUrlError || verifyError
  const handleClearBannerError = () => {
    setServerUrlError(null)
    setVerifyError(null)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-sm font-medium text-muted-foreground">
            Đang tải cấu hình...
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-start justify-center bg-muted px-4 py-8 antialiased">
      <form onSubmit={handleSubmit} className="w-full max-w-xl">
        <Card className="w-full gap-0 pt-0 shadow-xs">
          {/* Header Compact */}
          <CardHeader className="border-b bg-linear-to-r from-slate-900 to-slate-800 px-6 py-4">
            <div className="flex items-center gap-3">
              <img src="/icon.png" alt="Logo" className="size-8" />
              <div>
                <CardTitle className="text-white/80">{APP_NAME}</CardTitle>
                <CardDescription className="text-white/60">
                  Cấu hình máy chủ & Tùy chọn hệ thống
                </CardDescription>
              </div>
            </div>
            <CardAction>
              <Badge>v{version}</Badge>
            </CardAction>
          </CardHeader>

          {/* Navigation & Content Tabs */}
          <CardContent>
            <Tabs
              value={activeTab}
              onValueChange={(val) => setActiveTab(val as TabType)}
              className="gap-4"
            >
              <div className="w-full border-b">
                <TabsList variant="line">
                  <TabsTrigger value="account">
                    <Network />
                    Kết Nối
                  </TabsTrigger>
                  <TabsTrigger value="preferences">
                    <Sliders />
                    Tùy Chọn
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Main Tab Content */}
              {bannerError && (
                <ErrorBanner
                  errorMessage={bannerError}
                  setErrorMessage={handleClearBannerError}
                />
              )}

              <TabsContent value="account">
                <div className="flex flex-col gap-4">
                  {/* Server URL Config */}
                  <Item variant="outline">
                    <ItemHeader>
                      <div className="flex items-center gap-2.5">
                        <Server className="size-4 text-primary" />
                        <ItemTitle>Địa chỉ Zimbra Mail Server</ItemTitle>
                      </div>
                      <Badge>Bắt buộc</Badge>
                    </ItemHeader>
                    <ItemContent>
                      <Field
                        data-invalid={
                          showServerUrlFormatError || !!serverUrlError
                        }
                      >
                        <Input
                          ref={serverUrlInputRef}
                          value={serverUrl}
                          onChange={(e) => {
                            setServerUrl(e.target.value)
                            if (serverUrlError) setServerUrlError(null)
                          }}
                          onBlur={handleServerUrlBlur}
                          placeholder="https://example.com"
                          aria-invalid={
                            showServerUrlFormatError || !!serverUrlError
                          }
                        />
                        {showServerUrlFormatError && (
                          <FieldError>
                            {!serverUrl.trim()
                              ? "Vui lòng nhập đường dẫn Server URL"
                              : "Định dạng URL không hợp lệ"}
                          </FieldError>
                        )}
                      </Field>
                    </ItemContent>
                  </Item>

                  {/* Auto Login Section */}
                  <Item variant="outline">
                    <ItemHeader>
                      <div className="flex items-center gap-2.5">
                        <KeyRound className="size-4 text-amber-500" />
                        <ItemTitle>Tự động đăng nhập</ItemTitle>
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
                    </ItemHeader>

                    {autoLoginEnabled && (
                      <ItemContent>
                        <FieldGroup>
                          <Field
                            data-invalid={showUsernameError && !verifyError}
                          >
                            <FieldLabel>Tên đăng nhập</FieldLabel>
                            <Input
                              ref={usernameInputRef}
                              value={username}
                              onChange={(e) => {
                                setUsername(e.target.value)
                                if (verifyError) setVerifyError(null)
                              }}
                              onBlur={() => setUsernameTouched(true)}
                              placeholder="username@example.com"
                              aria-invalid={showUsernameError && !verifyError}
                            />
                            {showUsernameError && !verifyError && (
                              <FieldError>
                                Tên đăng nhập không được để trống
                              </FieldError>
                            )}
                          </Field>

                          <Field
                            data-invalid={showPasswordError && !verifyError}
                          >
                            <FieldLabel>Mật khẩu</FieldLabel>
                            <InputGroup>
                              <InputGroupInput
                                ref={passwordInputRef}
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => {
                                  setPassword(e.target.value)
                                  if (verifyError) setVerifyError(null)
                                }}
                                onBlur={() => setPasswordTouched(true)}
                                placeholder="••••••••"
                                aria-invalid={showPasswordError && !verifyError}
                              />
                              <InputGroupAddon align="inline-end">
                                <InputGroupButton
                                  type="button"
                                  size="icon-xs"
                                  onClick={() => setShowPassword(!showPassword)}
                                  tabIndex={-1}
                                >
                                  {showPassword ? <EyeOff /> : <Eye />}
                                </InputGroupButton>
                              </InputGroupAddon>
                            </InputGroup>
                            {showPasswordError && !verifyError && (
                              <FieldError>
                                Mật khẩu không được để trống
                              </FieldError>
                            )}
                          </Field>
                        </FieldGroup>
                      </ItemContent>
                    )}
                  </Item>
                </div>
              </TabsContent>

              <TabsContent value="preferences">
                <div className="flex flex-col gap-4">
                  {/* Theme Selection */}
                  <Item variant="outline">
                    <ItemMedia variant="icon">
                      <Moon className="text-indigo-500" />
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle>Giao diện</ItemTitle>
                      <ItemDescription>
                        Tùy chỉnh chế độ hiển thị giao diện sáng, tối hoặc theo
                        hệ thống.
                      </ItemDescription>
                    </ItemContent>
                    <ItemActions>
                      <Select
                        value={theme}
                        onValueChange={(val) =>
                          setTheme(val as "light" | "dark" | "system")
                        }
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Chọn giao diện" />
                        </SelectTrigger>
                        <SelectContent position="popper">
                          <SelectItem value="light">Sáng</SelectItem>
                          <SelectItem value="dark">Tối</SelectItem>
                          <SelectItem value="system">Hệ thống</SelectItem>
                        </SelectContent>
                      </Select>
                    </ItemActions>
                  </Item>

                  {/* Polling Interval Selection */}
                  <Item variant="outline">
                    <ItemMedia variant="icon">
                      <RefreshCw className="text-amber-500" />
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle>Tần suất kiểm tra email</ItemTitle>
                      <ItemDescription>
                        Chu kỳ hệ thống tự động kiểm tra và cập nhật hòm thư
                        ngầm.
                      </ItemDescription>
                    </ItemContent>
                    <ItemActions>
                      <Select
                        value={String(pollingInterval)}
                        onValueChange={(val) =>
                          setPollingInterval(parseInt(val, 10))
                        }
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Chọn tần suất" />
                        </SelectTrigger>
                        <SelectContent position="popper">
                          <SelectItem value="5">5 phút</SelectItem>
                          <SelectItem value="15">15 phút</SelectItem>
                          <SelectItem value="30">30 phút</SelectItem>
                          <SelectItem value="60">1 giờ</SelectItem>
                        </SelectContent>
                      </Select>
                    </ItemActions>
                  </Item>

                  {/* Desktop Notifications Toggle */}
                  <Item variant="outline">
                    <ItemMedia variant="icon">
                      <Bell className="text-primary" />
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle>Thông báo màn hình (Windows)</ItemTitle>
                      <ItemDescription>
                        Gửi thông báo nổi ở góc màn hình ngay khi phát hiện có
                        email mới.
                      </ItemDescription>
                    </ItemContent>
                    <ItemActions>
                      <Switch
                        checked={enableNotifications}
                        onCheckedChange={setEnableNotifications}
                      />
                    </ItemActions>
                  </Item>

                  {/* Sync On Tab Change Toggle */}
                  <Item variant="outline">
                    <ItemContent>
                      <ItemTitle>Đồng bộ khi chuyển tab</ItemTitle>
                      <ItemDescription>
                        Tự động làm mới dữ liệu khi chuyển sang tab làm việc
                        Zimbra Mail.
                      </ItemDescription>
                    </ItemContent>
                    <ItemActions>
                      <Switch
                        checked={syncOnTabChange}
                        onCheckedChange={setSyncOnTabChange}
                      />
                    </ItemActions>
                  </Item>

                  {/* Sync On Window Focus Toggle */}
                  <Item variant="outline">
                    <ItemContent>
                      <ItemTitle>Đồng bộ khi chuyển cửa sổ</ItemTitle>
                      <ItemDescription>
                        Tự động làm mới dữ liệu khi quay lại cửa sổ trình duyệt
                        chứa Zimbra Mail.
                      </ItemDescription>
                    </ItemContent>
                    <ItemActions>
                      <Switch
                        checked={syncOnWindowFocus}
                        onCheckedChange={setSyncOnWindowFocus}
                      />
                    </ItemActions>
                  </Item>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>

          {/* Bottom Actions Bar */}
          <CardFooter className="mt-4 justify-between">
            <div className="flex items-center gap-2">
              <Button type="submit" disabled={verifying} size="lg">
                {verifying && <Loader2 className="animate-spin" />}
                {verifying ? "Đang kiểm tra kết nối..." : "Lưu Cài Đặt"}
              </Button>

              <span
                className={cn(
                  "text-xs font-semibold text-emerald-600 transition-opacity duration-300",
                  !saved && "opacity-0"
                )}
              >
                Đã lưu thành công!
              </span>
            </div>

            <p className="text-[10px] text-muted-foreground">
              Tất cả thay đổi sẽ có hiệu lực ngay lập tức.
            </p>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
