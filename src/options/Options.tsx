import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Check, Network, Sliders } from "lucide-react"
import { AccountTab } from "./components/AccountTab"
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
                </TabsList>
              </div>

              <AccountTab
                serverUrl={form.serverUrl}
                setServerUrl={form.setServerUrl}
                serverUrlInputRef={form.serverUrlInputRef}
                showServerUrlError={form.showServerUrlError}
                showServerUrlFormatError={form.showServerUrlFormatError}
                verifyServerUrlError={form.verifyServerUrlError}
                setVerifyServerUrlError={form.setVerifyServerUrlError}
                autoLoginEnabled={form.autoLoginEnabled}
                setAutoLoginEnabled={form.setAutoLoginEnabled}
                username={form.username}
                onOpenCredentialsDialog={() =>
                  form.setIsCredentialsDialogOpen(true)
                }
                verifyCredentialsError={form.verifyCredentialsError}
                setVerifyCredentialsError={form.setVerifyCredentialsError}
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
            </Tabs>
          </CardContent>

          <CardFooter className="justify-end pt-(--card-spacing)">
            <Button type="submit" disabled={form.verifying} size="lg">
              {form.verifying ? (
                <>
                  <Spinner />
                  Đang kiểm tra kết nối...
                </>
              ) : form.saved ? (
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

      <CredentialsDialog
        open={form.isCredentialsDialogOpen}
        onOpenChange={form.handleDialogOpenChange}
        username={form.username}
        setUsername={form.setUsername}
        password={form.password}
        setPassword={form.setPassword}
        showUsernameError={form.showUsernameError}
        showUsernameRequiredError={form.showUsernameRequiredError}
        showPasswordError={form.showPasswordError}
        showPasswordRequiredError={form.showPasswordRequiredError}
        verifyCredentialsError={form.verifyCredentialsError}
        setVerifyCredentialsError={form.setVerifyCredentialsError}
        onSubmit={form.handleCredentialsSubmit}
      />
    </div>
  )
}
