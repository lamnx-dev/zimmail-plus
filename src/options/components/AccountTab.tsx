import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import { Switch } from "@/components/ui/switch"
import { TabsContent } from "@/components/ui/tabs"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { normalizeServerUrl } from "@/utils/url"
import { KeyRound, Pencil, Server } from "lucide-react"
import type { ChangeEvent, FocusEvent, RefObject } from "react"

interface AccountTabProps {
  serverUrl: string
  setServerUrl: (val: string) => void
  serverUrlInputRef: RefObject<HTMLInputElement | null>
  showServerUrlError: boolean
  showServerUrlFormatError: boolean
  verifyServerUrlError: string | null
  setVerifyServerUrlError: (val: string | null) => void
  autoLoginEnabled: boolean
  setAutoLoginEnabled: (val: boolean) => void
  username: string
  onOpenCredentialsDialog: () => void
  verifyCredentialsError: string | null
  setVerifyCredentialsError: (val: string | null) => void
}

export function AccountTab({
  serverUrl,
  setServerUrl,
  serverUrlInputRef,
  showServerUrlError,
  showServerUrlFormatError,
  verifyServerUrlError,
  setVerifyServerUrlError,
  autoLoginEnabled,
  setAutoLoginEnabled,
  username,
  onOpenCredentialsDialog,
  verifyCredentialsError,
  setVerifyCredentialsError,
}: AccountTabProps) {
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
          <Field data-invalid={showServerUrlError}>
            <FieldLabel>Địa chỉ Zimbra Mail Server</FieldLabel>

            <Input
              ref={serverUrlInputRef}
              value={serverUrl}
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                setServerUrl(e.target.value)
                if (verifyServerUrlError) setVerifyServerUrlError(null)
              }}
              onBlur={(e: FocusEvent<HTMLInputElement>) => {
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
            onCheckedChange={(val: boolean) => {
              setAutoLoginEnabled(val)
              if (verifyCredentialsError) setVerifyCredentialsError(null)
              if (val && !username.trim()) {
                onOpenCredentialsDialog()
              }
            }}
          />
        </ItemActions>
      </Item>
    </TabsContent>
  )
}
