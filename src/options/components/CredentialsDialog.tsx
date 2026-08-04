import { Button } from "@/components/ui/button"
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
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Spinner } from "@/components/ui/spinner"
import { getSecrets } from "@/storage/settings"
import { Action } from "@/utils/constants"
import {
  sendActionMessage,
  sendActionMessageAsync,
} from "@/utils/sendActionMessage"
import { isValidUrl, normalizeServerUrl } from "@/utils/url"
import { Eye, EyeOff } from "lucide-react"
import { useRef, useState, type ChangeEvent } from "react"

interface CredentialsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  serverUrl: string
  initialServerUrl?: string
  hasSavedPassword: boolean
  initialUsername: string
  onConfirmedSuccess: (payload: { username: string; password: string }) => void
  onInvalidServerUrl: (error?: string) => void
}

export function CredentialsDialog({
  open,
  onOpenChange,
  serverUrl,
  initialServerUrl,
  hasSavedPassword,
  initialUsername,
  onConfirmedSuccess,
  onInvalidServerUrl,
}: CredentialsDialogProps) {
  const [username, setUsername] = useState(initialUsername)
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [prevOpen, setPrevOpen] = useState(open)

  const [verifying, setVerifying] = useState(false)
  const [verifyError, setVerifyError] = useState<string | null>(null)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const usernameInputRef = useRef<HTMLInputElement>(null)
  const passwordInputRef = useRef<HTMLInputElement>(null)

  if (prevOpen !== open) {
    setPrevOpen(open)
    if (open) {
      setUsername(initialUsername)
      setPassword("")
      setShowPassword(false)
      setIsSubmitted(false)
      setVerifyError(null)
    }
  }

  const isUsernameChanged = username.trim() !== initialUsername
  const isPasswordMissing =
    !password.trim() && (!hasSavedPassword || isUsernameChanged)
  const showUsernameRequiredError = !username.trim() && isSubmitted
  const showPasswordRequiredError = isPasswordMissing && isSubmitted

  const showUsernameError = showUsernameRequiredError || !!verifyError
  const showPasswordError = showPasswordRequiredError || !!verifyError

  const handleSubmit = async () => {
    setIsSubmitted(true)
    if (!username.trim()) {
      usernameInputRef.current?.focus()
      return
    }
    if (isPasswordMissing) {
      passwordInputRef.current?.focus()
      return
    }

    if (!isValidUrl(serverUrl)) {
      onInvalidServerUrl("Định dạng URL không hợp lệ")
      return
    }

    setVerifying(true)
    setVerifyError(null)

    const formattedServerUrl = normalizeServerUrl(serverUrl)

    if (initialServerUrl && formattedServerUrl !== initialServerUrl) {
      try {
        await sendActionMessageAsync({
          action: Action.VERIFY_SERVER_URL,
          payload: { serverUrl: formattedServerUrl },
        })
      } catch (error) {
        onInvalidServerUrl((error as Error).message)
        setVerifying(false)
        return
      }
    }

    const existingSecrets = await getSecrets()
    const effectivePassword = password.trim() || existingSecrets.password

    sendActionMessage({
      action: Action.VERIFY_CREDENTIALS,
      payload: {
        serverUrl: formattedServerUrl,
        username: username.trim(),
        password: effectivePassword,
      },
      onSuccess: () => {
        onConfirmedSuccess({
          username: username.trim(),
          password: effectivePassword,
        })
      },
      onError: (error) => {
        setVerifyError(error)
        setTimeout(() => {
          if (isPasswordMissing) {
            passwordInputRef.current?.focus()
          } else {
            usernameInputRef.current?.focus()
          }
        }, 0)
      },
      onSettled: () => {
        setVerifying(false)
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form
          className="contents"
          onSubmit={(e) => {
            e.preventDefault()
            handleSubmit()
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
                ref={usernameInputRef}
                value={username}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  setUsername(e.target.value)
                  setVerifyError(null)
                }}
                placeholder="username@example.com"
                aria-invalid={showUsernameError}
              />
              {showUsernameRequiredError && (
                <FieldError>Tên đăng nhập không được để trống</FieldError>
              )}
            </Field>

            <Field data-invalid={showPasswordError}>
              <FieldLabel>Mật khẩu</FieldLabel>
              <InputGroup>
                <InputGroupInput
                  ref={passwordInputRef}
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    setPassword(e.target.value)
                    setVerifyError(null)
                  }}
                  placeholder="Nhập mật khẩu"
                  aria-invalid={showPasswordError}
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
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
                verifyError && <FieldError>{verifyError}</FieldError>
              )}
            </Field>
          </FieldGroup>

          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="outline" disabled={verifying}>
                Hủy
              </Button>
            </DialogClose>
            <Button type="submit" disabled={verifying}>
              {verifying && <Spinner />}
              Xác nhận
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
