import { ThemeToggle } from "@/components/ThemeToggle"
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
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { Spinner } from "@/components/ui/spinner"
import {
  Bell,
  Check,
  Eye,
  EyeOff,
  KeyRound,
  Network,
  Pencil,
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../components/ui/tooltip"
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
  const [verifyServerUrlError, setVerifyServerUrlError] = useState<
    string | null
  >(null)
  const [verifyCredentialsError, setVerifyCredentialsError] = useState<
    string | null
  >(null)
  const [isCredentialsDialogOpen, setIsCredentialsDialogOpen] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isServerUrlSubmitted, setIsServerUrlSubmitted] = useState(false)
  const [isDialogSubmitted, setIsDialogSubmitted] = useState(false)

  const [hasSavedPassword, setHasSavedPassword] = useState(false)
  const [initialUsername, setInitialUsername] = useState("")

  const serverUrlInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    Promise.all([getSettings(), getCredentials()]).then(([settings, creds]) => {
      setServerUrl(settings.serverUrl || "")
      setPollingInterval(settings.pollingInterval)
      setEnableNotifications(settings.enableNotifications)
      setSyncOnTabChange(settings.syncOnTabChange)
      setSyncOnWindowFocus(settings.syncOnWindowFocus)
      setAutoLoginEnabled(creds.autoLoginEnabled)
      const savedUser = creds.username || ""
      setUsername(savedUser)
      setInitialUsername(savedUser)
      setPassword("")
      setHasSavedPassword(!!creds.password)

      setLoading(false)
    })
  }, [])

  const isInvalidUrlFormat = !isValidUrl(serverUrl)
  const showServerUrlFormatError = isInvalidUrlFormat && isServerUrlSubmitted
  const showServerUrlError = showServerUrlFormatError || !!verifyServerUrlError

  const isUsernameChanged = username.trim() !== initialUsername
  const isPasswordMissing =
    !password.trim() && (!hasSavedPassword || isUsernameChanged)
  const showUsernameRequiredError = !username.trim() && isDialogSubmitted
  const showPasswordRequiredError = isPasswordMissing && isDialogSubmitted

  const showUsernameError =
    showUsernameRequiredError || !!verifyCredentialsError
  const showPasswordError =
    showPasswordRequiredError || !!verifyCredentialsError

  const handleCredentialsSubmit = () => {
    setIsDialogSubmitted(true)
    if (username.trim() && !isPasswordMissing) {
      setIsCredentialsDialogOpen(false)
    }
  }

  const handleSave = async () => {
    setIsServerUrlSubmitted(true)
    if (autoLoginEnabled) {
      setIsDialogSubmitted(true)
    }

    const isCredentialsError =
      autoLoginEnabled && (!username.trim() || isPasswordMissing)

    if (isInvalidUrlFormat || isCredentialsError) {
      setActiveTab("account")

      if (isInvalidUrlFormat) {
        serverUrlInputRef.current?.focus()
      }

      if (autoLoginEnabled && (!username.trim() || isPasswordMissing)) {
        setIsCredentialsDialogOpen(true)
      }

      return
    }

    setSaved(false)
    setVerifyServerUrlError(null)
    setVerifyCredentialsError(null)

    const formattedServerUrl = normalizeServerUrl(serverUrl)
    setServerUrl(formattedServerUrl)

    setVerifying(true)

    try {
      const serverRes: MessageResult = await chrome.runtime.sendMessage({
        action: ActionType.VERIFY_SERVER_URL,
        serverUrl: formattedServerUrl,
      })

      if (!serverRes?.success) {
        setVerifyServerUrlError("Không thể kết nối tới máy chủ Zimbra.")
        setActiveTab("account")
        serverUrlInputRef.current?.focus()
        return
      }

      const isCredentialsChanged =
        username.trim() !== initialUsername ||
        password.trim() !== "" ||
        !hasSavedPassword

      const existingCreds = await getCredentials()
      const effectivePassword =
        password.trim() ||
        (isUsernameChanged ? "" : existingCreds.password || "")

      if (autoLoginEnabled && isCredentialsChanged) {
        const credRes: MessageResult = await chrome.runtime.sendMessage({
          action: ActionType.VERIFY_CREDENTIALS,
          serverUrl: formattedServerUrl,
          username: username.trim(),
          password: effectivePassword,
        })

        if (!credRes?.success) {
          setVerifyCredentialsError("Xác thực tài khoản thất bại")
          setActiveTab("account")
          setIsCredentialsDialogOpen(true)
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
          password: effectivePassword,
        }),
      ])

      setPassword("")
      setInitialUsername(username.trim())
      setHasSavedPassword(!!effectivePassword)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } finally {
      setVerifying(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted">
        <div className="flex flex-col items-center gap-2">
          <Spinner className="size-8 text-primary" />
          <span className="text-sm font-medium text-muted-foreground">
            Đang tải cấu hình...
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-start justify-center bg-muted px-4 py-8 antialiased">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleSave()
        }}
        className="w-full max-w-xl"
      >
        <Card className="w-full gap-0 shadow-xs">
          <CardHeader className="gap-0 border-b">
            <div className="flex items-center gap-3">
              <img src="/icon.png" alt="Logo" className="size-8" />
              <div>
                <CardTitle>
                  {APP_NAME}{" "}
                  <span className="text-xs text-muted-foreground">
                    v{version}
                  </span>
                </CardTitle>
                <CardDescription>
                  Cấu hình máy chủ & Tùy chọn hệ thống
                </CardDescription>
              </div>
            </div>
            <CardAction>
              <ThemeToggle />
            </CardAction>
          </CardHeader>

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

              <TabsContent value="account" className="flex flex-col gap-4">
                <Item variant="outline">
                  <ItemMedia variant="icon">
                    <Server className="text-primary" />
                  </ItemMedia>
                  <ItemContent>
                    <ItemDescription className="sr-only">
                      Địa chỉ URL hệ thống Zimbra Mail dùng để kết nối và kiểm
                      tra hòm thư
                    </ItemDescription>
                    <Field data-invalid={showServerUrlError}>
                      <FieldLabel>Địa chỉ Zimbra Mail Server</FieldLabel>

                      <Input
                        ref={serverUrlInputRef}
                        value={serverUrl}
                        onChange={(e) => {
                          setServerUrl(e.target.value)
                          if (verifyServerUrlError)
                            setVerifyServerUrlError(null)
                        }}
                        onBlur={(e) => {
                          if (e.target.value.trim()) {
                            e.target.value = normalizeServerUrl(e.target.value)
                          }
                        }}
                        placeholder="https://example.com"
                        aria-invalid={showServerUrlError}
                        autoFocus
                      />
                      {showServerUrlFormatError ? (
                        <FieldError>
                          {!serverUrl.trim()
                            ? "Vui lòng nhập đường dẫn Server URL"
                            : "Định dạng URL không hợp lệ"}
                        </FieldError>
                      ) : (
                        verifyServerUrlError && (
                          <FieldError>{verifyServerUrlError}</FieldError>
                        )
                      )}
                    </Field>
                  </ItemContent>
                </Item>

                <Item variant="outline">
                  <ItemMedia variant="icon">
                    <KeyRound className="text-amber-500" />
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle>Tự động đăng nhập</ItemTitle>
                    <ItemDescription>
                      {username ? (
                        <>
                          Tự động đăng nhập với{" "}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                type="button"
                                variant="link"
                                size="sm"
                                className="h-auto px-0 text-muted-foreground"
                                onClick={() => setIsCredentialsDialogOpen(true)}
                              >
                                <span>{username}</span>
                                <Pencil />
                                <span className="sr-only">
                                  Sửa thông tin đăng nhập
                                </span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              Sửa thông tin đăng nhập
                            </TooltipContent>
                          </Tooltip>
                        </>
                      ) : (
                        "Thông tin đăng nhập được lưu trữ cục bộ trên trình duyệt"
                      )}
                    </ItemDescription>
                  </ItemContent>
                  <ItemActions>
                    <Switch
                      checked={autoLoginEnabled}
                      onCheckedChange={(val) => {
                        setAutoLoginEnabled(val)
                        if (verifyCredentialsError)
                          setVerifyCredentialsError(null)
                        if (val && !username.trim()) {
                          setIsCredentialsDialogOpen(true)
                        }
                      }}
                    />
                  </ItemActions>
                </Item>
              </TabsContent>

              <TabsContent value="preferences" className="flex flex-col gap-4">
                <Item variant="outline">
                  <ItemMedia variant="icon">
                    <RefreshCw className="text-primary" />
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle>Tần suất kiểm tra email</ItemTitle>
                    <ItemDescription>
                      Chu kỳ hệ thống tự động kiểm tra và cập nhật hòm thư ngầm
                    </ItemDescription>
                  </ItemContent>
                  <ItemActions>
                    <Select
                      value={String(pollingInterval)}
                      onValueChange={(val) =>
                        setPollingInterval(parseInt(val, 10))
                      }
                    >
                      <SelectTrigger className="w-24">
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

                <Item variant="outline">
                  <ItemMedia variant="icon">
                    <Bell className="text-amber-500" />
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle>Thông báo màn hình (Windows)</ItemTitle>
                    <ItemDescription>
                      Gửi thông báo nổi ở góc màn hình ngay khi phát hiện có
                      email mới
                    </ItemDescription>
                  </ItemContent>
                  <ItemActions>
                    <Switch
                      checked={enableNotifications}
                      onCheckedChange={setEnableNotifications}
                    />
                  </ItemActions>
                </Item>

                <Item variant="outline">
                  <ItemContent>
                    <ItemTitle>Đồng bộ khi chuyển tab</ItemTitle>
                    <ItemDescription>
                      Tự động làm mới dữ liệu khi chuyển sang tab làm việc
                      Zimbra Mail
                    </ItemDescription>
                  </ItemContent>
                  <ItemActions>
                    <Switch
                      checked={syncOnTabChange}
                      onCheckedChange={setSyncOnTabChange}
                    />
                  </ItemActions>
                </Item>

                <Item variant="outline">
                  <ItemContent>
                    <ItemTitle>Đồng bộ khi chuyển cửa sổ</ItemTitle>
                    <ItemDescription>
                      Tự động làm mới dữ liệu khi quay lại cửa sổ trình duyệt
                      chứa Zimbra Mail
                    </ItemDescription>
                  </ItemContent>
                  <ItemActions>
                    <Switch
                      checked={syncOnWindowFocus}
                      onCheckedChange={setSyncOnWindowFocus}
                    />
                  </ItemActions>
                </Item>
              </TabsContent>
            </Tabs>
          </CardContent>

          <CardFooter className="justify-end pt-(--card-spacing)">
            <Button type="submit" disabled={verifying} size="lg">
              {verifying ? (
                <>
                  <Spinner />
                  Đang kiểm tra kết nối...
                </>
              ) : saved ? (
                <>
                  <Check />
                  Đã lưu thành công!
                </>
              ) : (
                "Lưu Cài Đặt"
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>

      <Dialog
        open={isCredentialsDialogOpen}
        onOpenChange={(open) => {
          setIsCredentialsDialogOpen(open)
          setIsDialogSubmitted(false)

          if (open) {
            setShowPassword(false)
          } else {
            const hasUsername = !!username.trim()
            const hasPassword = !!password.trim()
            if (!hasUsername || !hasPassword) {
              setAutoLoginEnabled(false)
            }
          }
        }}
      >
        <DialogContent>
          <form
            className="contents"
            onSubmit={(e) => {
              e.preventDefault()
              handleCredentialsSubmit()
            }}
          >
            <DialogHeader>
              <DialogTitle>Thông tin đăng nhập</DialogTitle>
              <DialogDescription>
                Nhập tài khoản và mật khẩu Zimbra để sử dụng tính năng tự động
                đăng nhập.
              </DialogDescription>
            </DialogHeader>

            <FieldGroup className="py-2">
              <Field data-invalid={showUsernameError}>
                <FieldLabel>Tên đăng nhập</FieldLabel>
                <Input
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value)
                    if (verifyCredentialsError) setVerifyCredentialsError(null)
                  }}
                  placeholder="username@example.com"
                  aria-invalid={showUsernameError}
                  autoFocus={showUsernameError}
                />
                {showUsernameRequiredError && (
                  <FieldError>Tên đăng nhập không được để trống</FieldError>
                )}
              </Field>

              <Field data-invalid={showPasswordError}>
                <FieldLabel>Mật khẩu</FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      if (verifyCredentialsError)
                        setVerifyCredentialsError(null)
                    }}
                    placeholder="Nhập mật khẩu"
                    aria-invalid={showPasswordError}
                    autoFocus={showPasswordError}
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
                {showPasswordRequiredError ? (
                  <FieldError>Mật khẩu không được để trống</FieldError>
                ) : (
                  verifyCredentialsError && (
                    <FieldError>{verifyCredentialsError}</FieldError>
                  )
                )}
              </Field>
            </FieldGroup>

            <DialogFooter className="gap-2">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Hủy
                </Button>
              </DialogClose>
              <Button type="submit">Xác nhận</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
