import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Check, Network, Sliders, Sparkles } from "lucide-react"
import { AccountTab } from "./components/AccountTab"
import { AiTab } from "./components/AiTab"
import { CredentialsDialog } from "./components/CredentialsDialog"
import { OptionsHeader } from "./components/OptionsHeader"
import { PreferencesTab } from "./components/PreferencesTab"
import { useOptions, type TabType } from "./hooks/useOptions"

export default function Options() {
  const form = useOptions()

  if (form.loading) {
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
          form.handleSave()
        }}
        className="w-full max-w-xl"
      >
        <Card className="w-full gap-0 shadow-xs">
          <OptionsHeader />

          <CardContent>
            <Tabs
              value={form.activeTab}
              onValueChange={(val) => form.setActiveTab(val as TabType)}
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
                  <TabsTrigger value="ai">
                    <Sparkles />
                    AI
                  </TabsTrigger>
                </TabsList>
              </div>

              <AccountTab
                serverUrl={form.serverUrl}
                setServerUrl={form.setServerUrl}
                serverUrlInputRef={form.serverUrlInputRef}
                serverUrlError={form.serverUrlError}
                setServerUrlError={form.setServerUrlError}
                autoLoginEnabled={form.autoLoginEnabled}
                setAutoLoginEnabled={form.setAutoLoginEnabled}
                username={form.username}
                hasSavedPassword={form.hasSavedPassword}
                onOpenCredentialsDialog={() =>
                  form.setIsCredentialsDialogOpen(true)
                }
              />

              <PreferencesTab
                pollingInterval={form.pollingInterval}
                setPollingInterval={form.setPollingInterval}
                enableNotifications={form.enableNotifications}
                setEnableNotifications={form.setEnableNotifications}
                syncOnTabChange={form.syncOnTabChange}
                setSyncOnTabChange={form.setSyncOnTabChange}
                syncOnWindowFocus={form.syncOnWindowFocus}
                setSyncOnWindowFocus={form.setSyncOnWindowFocus}
              />

              <AiTab
                aiApiKey={form.aiApiKey}
                setAiApiKey={form.setAiApiKey}
                aiApiKeyInputRef={form.aiApiKeyInputRef}
                hasSavedKey={form.hasSavedKey}
                setHasSavedKey={form.setHasSavedKey}
                maskedKeyPlaceholder={form.savedKeyMask}
                setSavedKeyMask={form.setSavedKeyMask}
                aiError={form.aiError}
                setAiError={form.setAiError}
              />
            </Tabs>
          </CardContent>

          <CardFooter className="justify-end pt-(--card-spacing)">
            <Button
              type="submit"
              disabled={form.verifying || (!form.isDirty && !form.saved)}
              size="lg"
            >
              {form.verifying ? <Spinner /> : form.saved ? <Check /> : null}
              Lưu Cài Đặt
            </Button>
          </CardFooter>
        </Card>
      </form>

      <CredentialsDialog
        open={form.isCredentialsDialogOpen}
        onOpenChange={form.handleDialogOpenChange}
        serverUrl={form.serverUrl}
        initialServerUrl={form.initialServerUrl}
        hasSavedPassword={form.hasSavedPassword}
        initialUsername={form.initialUsername}
        onConfirmedSuccess={(payload) => {
          form.setUsername(payload.username)
          form.setPassword(payload.password)
          form.setIsCredentialsDialogOpen(false)
        }}
        onInvalidServerUrl={(error) => {
          form.setActiveTab("account")
          form.setAutoLoginEnabled(false)
          if (error) {
            form.setServerUrlError(error)
          }
          form.setIsCredentialsDialogOpen(false)
          setTimeout(() => {
            form.serverUrlInputRef.current?.focus()
          }, 0)
        }}
      />
    </div>
  )
}
