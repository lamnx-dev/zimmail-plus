import { Settings } from "@/types"
import { Action } from "@/utils/constants"
import { sendActionMessageAsync } from "@/utils/sendActionMessage"
import { isValidUrl, normalizeServerUrl } from "@/utils/url"
import { useEffect, useRef, useState } from "react"
import {
  DEFAULT_SETTINGS,
  getSecrets,
  getSettings,
  saveSecrets,
  saveSettings,
} from "../../storage/settings"

export type TabType = "account" | "preferences" | "ai"

function isSettingsDirty(a: Settings, b: Settings) {
  return (
    a.serverUrl.trim() !== b.serverUrl.trim() ||
    a.autoLoginEnabled !== b.autoLoginEnabled ||
    a.username.trim() !== b.username.trim() ||
    a.pollingInterval !== b.pollingInterval ||
    a.enableNotifications !== b.enableNotifications ||
    a.syncOnTabChange !== b.syncOnTabChange ||
    a.syncOnWindowFocus !== b.syncOnWindowFocus
  )
}

export function useOptions() {
  // Navigation & UI States
  const [activeTab, setActiveTab] = useState<TabType>("account")
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState(false)
  const [saved, setSaved] = useState(false)
  const [isCredentialsDialogOpen, setIsCredentialsDialogOpen] = useState(false)

  // Form Settings (Current vs Initial)
  const [initialSettings, setInitialSettings] =
    useState<Settings>(DEFAULT_SETTINGS)
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)

  // Secret Inputs (temporarily edited)
  const [password, setPassword] = useState<string | null>(null)
  const [hasSavedPassword, setHasSavedPassword] = useState(false)
  const [aiApiKey, setAiApiKey] = useState<string | null>(null)
  const [hasSavedKey, setHasSavedKey] = useState(false)
  const [savedKeyMask, setSavedKeyMask] = useState("")

  // Error States
  const [serverUrlError, setServerUrlError] = useState<string | null>(null)
  const [credentialsError, setCredentialsError] = useState<string | null>(null)
  const [aiError, setAiError] = useState<string | null>(null)

  // Refs
  const serverUrlInputRef = useRef<HTMLInputElement>(null)
  const aiApiKeyInputRef = useRef<HTMLInputElement>(null)

  // Helpers to update individual fields
  const updateSetting = <K extends keyof Settings>(
    key: K,
    value: Settings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  // --- Initial Load ---

  useEffect(() => {
    Promise.all([getSettings(), getSecrets()]).then(
      ([loadedSettings, secrets]) => {
        const formValues: Settings = {
          serverUrl: loadedSettings.serverUrl,
          autoLoginEnabled: loadedSettings.autoLoginEnabled,
          username: loadedSettings.username,
          pollingInterval: loadedSettings.pollingInterval,
          enableNotifications: loadedSettings.enableNotifications,
          syncOnTabChange: loadedSettings.syncOnTabChange,
          syncOnWindowFocus: loadedSettings.syncOnWindowFocus,
        }

        setInitialSettings(formValues)
        setSettings(formValues)
        setHasSavedPassword(!!secrets.password)

        const key = secrets.aiApiKey
        setHasSavedKey(!!key)
        if (key) {
          const prefix = key.substring(0, 4)
          const suffix = key.length > 8 ? key.substring(key.length - 4) : ""
          setSavedKeyMask(`${prefix}...${suffix}`)
        }

        setLoading(false)
      }
    )
  }, [])

  // --- Computations ---

  const isInvalidUrlFormat = !isValidUrl(settings.serverUrl)
  const isUsernameChanged =
    settings.username.trim() !== initialSettings.username
  const isPasswordMissing =
    password === null
      ? !hasSavedPassword || isUsernameChanged
      : !password.trim()

  const isDirty =
    isSettingsDirty(settings, initialSettings) ||
    password !== null ||
    aiApiKey !== null

  // --- Warn on unload if dirty ---

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [isDirty])

  // --- Event Handlers ---

  const handleDialogOpenChange = (open: boolean) => {
    setIsCredentialsDialogOpen(open)

    if (!open && (!settings.username.trim() || isPasswordMissing)) {
      updateSetting("autoLoginEnabled", false)
    }
  }

  const handleSave = async () => {
    setServerUrlError(null)
    setAiError(null)

    const isCredentialsError =
      settings.autoLoginEnabled &&
      (!settings.username.trim() || isPasswordMissing)

    if (isInvalidUrlFormat || isCredentialsError) {
      setActiveTab("account")

      if (isInvalidUrlFormat) {
        setServerUrlError("Định dạng URL không hợp lệ")
        setTimeout(() => {
          serverUrlInputRef.current?.focus()
        }, 0)
        return
      }

      if (isCredentialsError) {
        setIsCredentialsDialogOpen(true)
        return
      }

      return
    }

    setSaved(false)
    setVerifying(true)

    try {
      const formattedServerUrl = normalizeServerUrl(settings.serverUrl)
      if (formattedServerUrl !== settings.serverUrl) {
        updateSetting("serverUrl", formattedServerUrl)
      }

      // 1. Verify Server URL if changed
      if (formattedServerUrl !== initialSettings.serverUrl) {
        try {
          await sendActionMessageAsync({
            action: Action.VERIFY_SERVER_URL,
            payload: { serverUrl: formattedServerUrl },
          })
        } catch (error) {
          setActiveTab("account")
          setServerUrlError((error as Error).message)
          setTimeout(() => {
            serverUrlInputRef.current?.focus()
          }, 50)
          return
        }
      }

      const existingSecrets = await getSecrets()
      const effectivePassword =
        password !== null ? password.trim() : existingSecrets.password
      const effectiveAiApiKey =
        aiApiKey !== null ? aiApiKey.trim() : existingSecrets.aiApiKey

      // 2. Verify Credentials
      if (
        settings.autoLoginEnabled &&
        (formattedServerUrl !== initialSettings.serverUrl ||
          isUsernameChanged ||
          password?.trim())
      ) {
        try {
          await sendActionMessageAsync({
            action: Action.VERIFY_CREDENTIALS,
            payload: {
              serverUrl: formattedServerUrl,
              username: settings.username,
              password: effectivePassword,
            },
          })
        } catch (error) {
          setActiveTab("account")
          setIsCredentialsDialogOpen(true)
          setCredentialsError((error as Error).message)
          updateSetting("autoLoginEnabled", false)
          return
        }
      }

      // 3. Verify AI Key if a new key was entered
      if (aiApiKey?.trim()) {
        try {
          await sendActionMessageAsync({
            action: Action.TEST_AI_CONNECTION,
            payload: { apiKey: aiApiKey },
          })
        } catch (error) {
          setActiveTab("ai")
          setAiError((error as Error).message)
          setTimeout(() => {
            aiApiKeyInputRef.current?.select()
          }, 50)
          return
        }
      }

      const updatedSettings = {
        ...settings,
        serverUrl: formattedServerUrl,
        username: settings.username.trim(),
      }

      // Persistence
      await Promise.all([
        saveSettings(updatedSettings),
        saveSecrets({
          password: effectivePassword,
          aiApiKey: effectiveAiApiKey,
        }),
      ])

      // Set updated state
      setInitialSettings(updatedSettings)
      setSettings(updatedSettings)
      setHasSavedPassword(!!effectivePassword)
      setHasSavedKey(!!effectiveAiApiKey)

      if (effectiveAiApiKey) {
        const prefix = effectiveAiApiKey.substring(0, 4)
        const suffix =
          effectiveAiApiKey.length > 8
            ? effectiveAiApiKey.substring(effectiveAiApiKey.length - 4)
            : ""
        setSavedKeyMask(`${prefix}...${suffix}`)
      } else {
        setSavedKeyMask("")
      }

      // Reset state
      setPassword(null)
      setAiApiKey(null)

      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } finally {
      setVerifying(false)
    }
  }

  return {
    // UI State
    activeTab,
    setActiveTab,
    loading,
    verifying,
    saved,
    isCredentialsDialogOpen,
    setIsCredentialsDialogOpen,
    serverUrlInputRef,
    aiApiKeyInputRef,

    // Account State
    serverUrl: settings.serverUrl,
    setServerUrl: (val: string) => updateSetting("serverUrl", val),
    initialServerUrl: initialSettings.serverUrl,
    autoLoginEnabled: settings.autoLoginEnabled,
    setAutoLoginEnabled: (val: boolean) =>
      updateSetting("autoLoginEnabled", val),
    username: settings.username,
    setUsername: (val: string) => updateSetting("username", val),
    password,
    setPassword,
    hasSavedPassword,
    initialUsername: initialSettings.username,

    // Preferences State
    pollingInterval: settings.pollingInterval,
    setPollingInterval: (val: number) => updateSetting("pollingInterval", val),
    enableNotifications: settings.enableNotifications,
    setEnableNotifications: (val: boolean) =>
      updateSetting("enableNotifications", val),
    syncOnTabChange: settings.syncOnTabChange,
    setSyncOnTabChange: (val: boolean) => updateSetting("syncOnTabChange", val),
    syncOnWindowFocus: settings.syncOnWindowFocus,
    setSyncOnWindowFocus: (val: boolean) =>
      updateSetting("syncOnWindowFocus", val),

    // AI State
    aiApiKey,
    setAiApiKey,
    hasSavedKey,
    setHasSavedKey,
    savedKeyMask,
    setSavedKeyMask,

    // Errors
    serverUrlError,
    setServerUrlError,
    credentialsError,
    aiError,
    setAiError,

    // Status
    isDirty,

    // Handlers
    handleDialogOpenChange,
    handleSave,
  }
}
