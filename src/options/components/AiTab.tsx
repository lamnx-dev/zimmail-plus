import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
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
import { TabsContent } from "@/components/ui/tabs"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { clearAllSummaryCache, getSecrets } from "@/storage/settings"
import { Action } from "@/utils/constants"
import { sendActionMessage } from "@/utils/sendActionMessage"
import { Check, Database, KeyRound, Pencil, Sparkles } from "lucide-react"
import { type RefObject, useState } from "react"

interface AiTabProps {
  aiApiKey: string | null
  setAiApiKey: (val: string | null) => void
  aiApiKeyInputRef: RefObject<HTMLInputElement | null>
  hasSavedKey: boolean
  setHasSavedKey: (val: boolean) => void
  maskedKeyPlaceholder: string
  setSavedKeyMask: (val: string) => void
  aiError: string | null
  setAiError: (val: string | null) => void
}

export function AiTab({
  aiApiKey,
  setAiApiKey,
  aiApiKeyInputRef,
  hasSavedKey,
  setHasSavedKey,
  maskedKeyPlaceholder,
  setSavedKeyMask,
  aiError,
  setAiError,
}: AiTabProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [testStatus, setTestStatus] = useState<"idle" | "loading" | "success">(
    "idle"
  )
  const [isAiEmptyWarningOpen, setIsAiEmptyWarningOpen] = useState(false)
  const [clearCacheStatus, setClearCacheStatus] = useState<
    "idle" | "loading" | "success"
  >("idle")

  const showInput = !hasSavedKey || isEditing

  async function handleTestConnection() {
    setTestStatus("loading")
    setAiError(null)

    const apiKeyToTest = showInput ? aiApiKey : (await getSecrets()).aiApiKey

    if (!apiKeyToTest?.trim()) {
      setAiError("Vui lòng nhập API Key")
      setIsEditing(true)
      setTestStatus("idle")
      aiApiKeyInputRef.current?.select()
      return
    }

    sendActionMessage({
      action: Action.TEST_AI_CONNECTION,
      payload: {
        apiKey: apiKeyToTest,
      },
      onSuccess: () => {
        setTestStatus("success")
        setTimeout(() => setTestStatus("idle"), 2500)
      },
      onError: (error) => {
        setAiError(error)
        setIsEditing(true)
        setTestStatus("idle")
        aiApiKeyInputRef.current?.select()
      },
    })
  }

  function handleStartEdit() {
    setIsEditing(true)
    aiApiKeyInputRef.current?.select()
  }

  function handleCancel() {
    setIsEditing(false)
    setAiApiKey(null)
    setTestStatus("idle")
    setAiError(null)
  }

  function handleKeyChange(e: React.ChangeEvent<HTMLInputElement>) {
    setAiApiKey(e.target.value)
    setTestStatus("idle")
    setAiError(null)
  }

  async function handleConfirmDelete() {
    setAiApiKey("")
    setHasSavedKey(false)
    setSavedKeyMask("")
    setIsEditing(false)
    setIsAiEmptyWarningOpen(false)
    setTestStatus("idle")
    setAiError(null)
  }

  async function handleClearCache() {
    setClearCacheStatus("loading")
    try {
      await clearAllSummaryCache()
      setClearCacheStatus("success")
      setTimeout(() => setClearCacheStatus("idle"), 2500)
    } catch {
      setClearCacheStatus("idle")
    }
  }

  return (
    <>
      <TabsContent value="ai" className="flex flex-col gap-4">
        <Alert className="border-indigo-200 bg-indigo-50 text-indigo-600 dark:border-indigo-900 dark:bg-indigo-950 dark:text-indigo-50">
          <Sparkles />
          <AlertTitle>Groq API (Miễn phí 100%)</AlertTitle>
          <AlertDescription>
            Đăng ký tài khoản tại{" "}
            <a href="https://console.groq.com" target="_blank" rel="noreferrer">
              console.groq.com
            </a>
            .
          </AlertDescription>
          <AlertAction>
            <Button
              variant="link"
              className="text-indigo-600 dark:text-indigo-50"
              asChild
            >
              <a
                href="https://console.groq.com/keys"
                target="_blank"
                rel="noreferrer"
              >
                Lấy API Key
              </a>
            </Button>
          </AlertAction>
        </Alert>

        <Item variant="outline">
          <ItemMedia variant="icon">
            <KeyRound className="text-warning" />
          </ItemMedia>
          <ItemContent>
            <ItemTitle className={cn(showInput && "sr-only")}>
              Groq API Key
            </ItemTitle>

            <ItemDescription className={cn(showInput && "sr-only")}>
              Key đã lưu{" "}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto px-0 font-mono text-muted-foreground"
                    onClick={handleStartEdit}
                  >
                    <span>{maskedKeyPlaceholder}</span>
                    <Pencil />
                    <span className="sr-only">Sửa API Key</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Sửa API Key</TooltipContent>
              </Tooltip>
            </ItemDescription>

            {showInput && (
              <Field data-invalid={!!aiError}>
                <FieldLabel>Groq API Key</FieldLabel>

                <InputGroup>
                  <InputGroupAddon>
                    {testStatus === "loading" ? (
                      <Spinner />
                    ) : testStatus === "success" ? (
                      <Check className="text-success" />
                    ) : null}
                  </InputGroupAddon>
                  <InputGroupInput
                    ref={aiApiKeyInputRef}
                    type="password"
                    placeholder={
                      isEditing ? "gsk_..." : maskedKeyPlaceholder || "gsk_..."
                    }
                    value={aiApiKey ?? ""}
                    onChange={handleKeyChange}
                    className="font-mono"
                    aria-invalid={!!aiError}
                  />
                  <InputGroupAddon align="inline-end">
                    <InputGroupButton
                      variant="secondary"
                      size="xs"
                      disabled={testStatus === "loading" || !aiApiKey?.trim()}
                      onClick={handleTestConnection}
                    >
                      Kiểm tra
                    </InputGroupButton>
                  </InputGroupAddon>
                </InputGroup>

                {aiError && <FieldError>{aiError}</FieldError>}

                {hasSavedKey && isEditing && (
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleCancel}
                    >
                      Hủy
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setIsAiEmptyWarningOpen(true)}
                    >
                      Xóa
                    </Button>
                  </div>
                )}
              </Field>
            )}
          </ItemContent>
          {hasSavedKey && !isEditing && (
            <ItemActions>
              <Button
                variant="outline"
                size="sm"
                disabled={testStatus === "loading"}
                onClick={handleTestConnection}
              >
                {testStatus === "loading" ? (
                  <Spinner />
                ) : testStatus === "success" ? (
                  <Check className="text-success" />
                ) : null}
                Kiểm tra
              </Button>
            </ItemActions>
          )}
        </Item>

        <Item variant="outline">
          <ItemMedia variant="icon">
            <Database className="text-muted-foreground" />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>Bộ nhớ đệm tóm tắt AI</ItemTitle>
            <ItemDescription>
              Xóa các tóm tắt email đã lưu trong bộ nhớ đệm.
            </ItemDescription>
          </ItemContent>
          <ItemActions>
            <Button
              variant="outline"
              size="sm"
              disabled={clearCacheStatus === "loading"}
              onClick={handleClearCache}
            >
              {clearCacheStatus === "loading" ? (
                <Spinner />
              ) : clearCacheStatus === "success" ? (
                <Check className="text-success" />
              ) : null}
              Xóa cache
            </Button>
          </ItemActions>
        </Item>
      </TabsContent>

      <AlertDialog
        open={isAiEmptyWarningOpen}
        onOpenChange={setIsAiEmptyWarningOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa Groq API Key?</AlertDialogTitle>
            <AlertDialogDescription>
              Các tính năng AI sẽ không thể sử dụng. Bạn có chắc muốn xóa không?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                aiApiKeyInputRef.current?.focus()
              }}
            >
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              variant="destructive"
            >
              Xác nhận
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
