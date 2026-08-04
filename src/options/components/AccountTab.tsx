import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import { TabsContent } from "@/components/ui/tabs"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Action } from "@/utils/constants"
import { sendActionMessage } from "@/utils/sendActionMessage"
import { isValidUrl, normalizeServerUrl } from "@/utils/url"
import { Check, Lock, Pencil, Server } from "lucide-react"
import {
  useState,
  type ChangeEvent,
  type FocusEvent,
  type RefObject,
} from "react"

interface AccountTabProps {
  serverUrl: string
  setServerUrl: (val: string) => void
  serverUrlInputRef: RefObject<HTMLInputElement | null>
  serverUrlError: string | null
  setServerUrlError: (val: string | null) => void
  autoLoginEnabled: boolean
  setAutoLoginEnabled: (val: boolean) => void
  username: string
  hasSavedPassword: boolean
  onOpenCredentialsDialog: () => void
}

export function AccountTab({
  serverUrl,
  setServerUrl,
  serverUrlInputRef,
  serverUrlError,
  setServerUrlError,
  autoLoginEnabled,
  setAutoLoginEnabled,
  username,
  hasSavedPassword,
  onOpenCredentialsDialog,
}: AccountTabProps) {
  const [serverUrlTestStatus, setServerUrlTestStatus] = useState<
    "idle" | "loading" | "success"
  >("idle")

  function handleServerUrlChange(e: ChangeEvent<HTMLInputElement>) {
    setServerUrl(e.target.value)
    setServerUrlError(null)
    setServerUrlTestStatus("idle")
  }

  function handleServerUrlBlur(e: FocusEvent<HTMLInputElement>) {
    const value = e.target.value.trim()
    if (value) {
      setServerUrl(normalizeServerUrl(value))
    }
  }

  async function handleTestServerUrl() {
    if (!isValidUrl(serverUrl)) {
      setServerUrlError("Định dạng URL không hợp lệ")
      serverUrlInputRef.current?.focus()
      return
    }

    setServerUrlTestStatus("loading")
    setServerUrlError(null)

    sendActionMessage({
      action: Action.VERIFY_SERVER_URL,
      payload: {
        serverUrl: normalizeServerUrl(serverUrl),
      },
      onSuccess: () => {
        setServerUrlTestStatus("success")
        setTimeout(() => setServerUrlTestStatus("idle"), 2500)
      },
      onError: (error) => {
        setServerUrlError(error)
        serverUrlInputRef.current?.focus()
        setServerUrlTestStatus("idle")
      },
    })
  }

  function handleAutoLoginChange(val: boolean) {
    setAutoLoginEnabled(val)
    if (val && (!username.trim() || !hasSavedPassword)) {
      onOpenCredentialsDialog()
    }
  }

  return (
    <TabsContent value="account" className="flex flex-col gap-4">
      <Item variant="outline">
        <ItemMedia variant="icon">
          <Server className="text-primary" />
        </ItemMedia>
        <ItemContent>
          <ItemDescription className="sr-only">
            Địa chỉ URL hệ thống Zimbra Mail dùng để kết nối và kiểm tra hòm thư
          </ItemDescription>
          <Field data-invalid={!!serverUrlError}>
            <FieldLabel>Địa chỉ Zimbra Mail Server</FieldLabel>

            <InputGroup>
              <InputGroupAddon>
                {serverUrlTestStatus === "loading" ? (
                  <Spinner />
                ) : serverUrlTestStatus === "success" ? (
                  <Check className="text-success" />
                ) : null}
              </InputGroupAddon>
              <InputGroupInput
                ref={serverUrlInputRef}
                value={serverUrl}
                onChange={handleServerUrlChange}
                onBlur={handleServerUrlBlur}
                placeholder="https://example.com"
                aria-invalid={!!serverUrlError}
              />
              <InputGroupAddon align="inline-end">
                <InputGroupButton
                  variant="secondary"
                  size="xs"
                  disabled={
                    serverUrlTestStatus === "loading" || !serverUrl.trim()
                  }
                  onClick={handleTestServerUrl}
                >
                  Kiểm tra
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>

            {serverUrlError && <FieldError>{serverUrlError}</FieldError>}
          </Field>
        </ItemContent>
      </Item>

      <Item variant="outline">
        <ItemMedia variant="icon">
          <Lock className="text-warning" />
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
                      variant="link"
                      size="sm"
                      className="h-auto px-0 text-muted-foreground"
                      onClick={onOpenCredentialsDialog}
                    >
                      <span>{username}</span>
                      <Pencil />
                      <span className="sr-only">Sửa thông tin đăng nhập</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Sửa thông tin đăng nhập</TooltipContent>
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
            onCheckedChange={handleAutoLoginChange}
          />
        </ItemActions>
      </Item>
    </TabsContent>
  )
}
