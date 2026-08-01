import { useEffect, useRef, useState } from "react"
import {
  getCredentials,
  getSettings,
  saveCredentials,
  saveSettings,
} from "../../storage/settings"
import type { MessageResult } from "../../types"
import { ActionType } from "../../utils/constants"
import { isValidUrl, normalizeServerUrl } from "../../utils/url"

export type TabType = "account" | "preferences"

export function useOptions() {
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

  const handleDialogOpenChange = (open: boolean) => {
    setIsCredentialsDialogOpen(open)
    setIsDialogSubmitted(false)

    if (!open) {
      const hasUsername = !!username.trim()
      const hasPassword = !!password.trim()
      if (!hasUsername || !hasPassword) {
        setAutoLoginEnabled(false)
      }
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

  return {
    activeTab,
    setActiveTab,
    serverUrl,
    setServerUrl,
    pollingInterval,
    setPollingInterval,
    enableNotifications,
    setEnableNotifications,
    syncOnTabChange,
    setSyncOnTabChange,
    syncOnWindowFocus,
    setSyncOnWindowFocus,
    autoLoginEnabled,
    setAutoLoginEnabled,
    username,
    setUsername,
    password,
    setPassword,
    saved,
    loading,
    verifying,
    verifyServerUrlError,
    setVerifyServerUrlError,
    verifyCredentialsError,
    setVerifyCredentialsError,
    isCredentialsDialogOpen,
    setIsCredentialsDialogOpen,
    serverUrlInputRef,
    showServerUrlError,
    showServerUrlFormatError,
    showUsernameError,
    showUsernameRequiredError,
    showPasswordError,
    showPasswordRequiredError,
    handleCredentialsSubmit,
    handleDialogOpenChange,
    handleSave,
  }
}
