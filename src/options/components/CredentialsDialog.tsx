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
import { Eye, EyeOff } from "lucide-react"
import { useState, type ChangeEvent } from "react"

interface CredentialsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  username: string
  setUsername: (val: string) => void
  password: string
  setPassword: (val: string) => void
  showUsernameError: boolean
  showUsernameRequiredError: boolean
  showPasswordError: boolean
  showPasswordRequiredError: boolean
  verifyCredentialsError: string | null
  setVerifyCredentialsError: (val: string | null) => void
  onSubmit: () => void
}

export function CredentialsDialog({
  open,
  onOpenChange,
  username,
  setUsername,
  password,
  setPassword,
  showUsernameError,
  showUsernameRequiredError,
  showPasswordError,
  showPasswordRequiredError,
  verifyCredentialsError,
  setVerifyCredentialsError,
  onSubmit,
}: CredentialsDialogProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [prevOpen, setPrevOpen] = useState(open)

  if (prevOpen !== open) {
    setPrevOpen(open)
    if (open) {
      setShowPassword(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form
          className="contents"
          onSubmit={(e) => {
            e.preventDefault()
            onSubmit()
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
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
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
                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    setPassword(e.target.value)
                    if (verifyCredentialsError) setVerifyCredentialsError(null)
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
  )
}
