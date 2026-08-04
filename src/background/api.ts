import axios, {
  isAxiosError,
  type AxiosRequestConfig,
  type AxiosResponse,
} from "axios"
import { getSecrets, getSettings } from "../storage/settings"
import type { EmailFilterType, MailMessage, MailMessageDetail } from "../types"
import type { ZimbraMessage, ZimbraSoapResponse } from "../types/api"
import {
  AUTH_TOKEN_COOKIE_NAME,
  EmailFilter,
  ZimbraErrorCode,
} from "../utils/constants"
import { isZimbraError } from "../utils/error"
import {
  buildSoapEnvelope,
  parseMailMessage,
  parseMailMessageDetail,
} from "../utils/zimbra"

// --- State & Client Configuration ---

let refreshPromise: Promise<string> | null = null
let isReauthFailed = false

export function resetReauthStatus(): void {
  isReauthFailed = false
}

axios.defaults.timeout = 15000
axios.defaults.withCredentials = false

const apiClient = axios.create()

// --- Axios Interceptors ---

apiClient.interceptors.request.use(async (config) => {
  const baseURL = await requireServerUrl()
  config.baseURL = baseURL
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean
    }
    const faultCode = error.response?.data?.Body?.Fault?.Detail?.Error?.Code
    const isAuthFault =
      faultCode === ZimbraErrorCode.SERVICE_AUTH_REQUIRED ||
      faultCode === ZimbraErrorCode.SERVICE_AUTH_EXPIRED

    if (
      (error.response?.status === 401 || isAuthFault) &&
      !originalRequest._retry
    ) {
      const settings = await getSettings()
      if (!settings.autoLoginEnabled || isReauthFailed) {
        return Promise.reject(error)
      }

      originalRequest._retry = true
      try {
        const newToken = await handleReauth()

        if (originalRequest.data) {
          if (typeof originalRequest.data === "string") {
            try {
              const parsed = JSON.parse(originalRequest.data)
              if (parsed?.Header?.context?.authToken?._content) {
                parsed.Header.context.authToken._content = newToken
                originalRequest.data = JSON.stringify(parsed)
              }
            } catch {
              originalRequest.data = originalRequest.data.replace(
                /("authToken"\s*:\s*\{\s*"_content"\s*:\s*")[^"]+(")/,
                `$1${newToken}$2`
              )
            }
          } else if (
            originalRequest.data?.Header?.context?.authToken?._content
          ) {
            originalRequest.data.Header.context.authToken._content = newToken
          }
        }
        return apiClient(originalRequest)
      } catch (error) {
        return Promise.reject(error)
      }
    }
    return Promise.reject(error)
  }
)

// --- Helper Functions ---

async function requireServerUrl(): Promise<string> {
  const settings = await getSettings()

  const url = settings.serverUrl
  if (!url) {
    throw new Error(
      "Chưa cấu hình Mail Server URL. Vui lòng cài đặt trong trang Options."
    )
  }
  return url
}

async function postSoapRequest(
  requestName: string,
  requestBody: Record<string, unknown>
): Promise<ZimbraSoapResponse> {
  const authToken = await getAuthTokenFromCookie()
  const payload = buildSoapEnvelope(authToken, requestBody)
  const { data } = (await apiClient.post(
    `/service/soap?${requestName}`,
    payload
  )) as AxiosResponse<ZimbraSoapResponse>
  return data
}

async function executeMsgAction(messageId: string, op: string): Promise<void> {
  await postSoapRequest(`MsgActionRequest&id=${messageId}&op=${op}`, {
    MsgActionRequest: {
      _jsns: "urn:zimbraMail",
      action: {
        id: messageId,
        op,
      },
    },
  })
}

// --- Auth & Token Management ---

export async function verifyServerUrl(serverUrl: string) {
  await axios.get(`${serverUrl}/res/I18nMsg.js`, {
    params: { _: Date.now() },
  })

  return true
}

export async function loginWithCredentials(
  serverUrl: string,
  username: string,
  password: string
): Promise<string> {
  if (!username.trim() || !password.trim()) {
    throw new Error("Thiếu thông tin tài khoản")
  }

  const payload = buildSoapEnvelope(null, {
    AuthRequest: {
      _jsns: "urn:zimbraAccount",
      account: {
        _content: username.trim(),
        by: "name",
      },
      password: {
        _content: password.trim(),
      },
    },
  })

  const { data } = (await axios.post(
    `${serverUrl}/service/soap?AuthRequest`,
    payload
  )) as AxiosResponse<ZimbraSoapResponse>

  const authToken = data.Body?.AuthResponse?.authToken?.[0]?._content
  if (!authToken) {
    throw new Error("Không nhận được token xác thực từ máy chủ")
  }

  return authToken
}

export async function loginAndSaveToken(
  serverUrl: string,
  username: string,
  password: string
): Promise<string> {
  const authToken = await loginWithCredentials(serverUrl, username, password)

  const domain = new URL(serverUrl).hostname
  await chrome.cookies.set({
    url: serverUrl,
    name: AUTH_TOKEN_COOKIE_NAME,
    value: authToken,
    domain: domain,
    path: "/",
    secure: true,
  })

  return authToken
}

async function handleReauth(): Promise<string> {
  if (refreshPromise) {
    return refreshPromise
  }

  refreshPromise = (async () => {
    let baseUrl = ""
    try {
      const [url, settings, secrets] = await Promise.all([
        requireServerUrl(),
        getSettings(),
        getSecrets(),
      ])
      baseUrl = url
      const token = await loginAndSaveToken(
        baseUrl,
        settings.username || "",
        secrets.password || ""
      )
      isReauthFailed = false
      return token
    } catch (error) {
      if (isAxiosError(error) && isZimbraError(error.response?.data)) {
        const faultCode = error.response?.data?.Body?.Fault?.Detail?.Error?.Code

        const isFatalAuthError =
          faultCode === ZimbraErrorCode.ACCOUNT_AUTH_FAILED

        if (isFatalAuthError) {
          isReauthFailed = true
          if (baseUrl) {
            await chrome.cookies
              .remove({
                url: baseUrl,
                name: AUTH_TOKEN_COOKIE_NAME,
              })
              .catch(() => {})
          }
        }
      }

      throw error
    } finally {
      refreshPromise = null
    }
  })()

  return refreshPromise
}

async function getAuthTokenFromCookie(): Promise<string | null> {
  const baseUrl = await requireServerUrl()
  const cookie = await chrome.cookies.get({
    url: baseUrl,
    name: AUTH_TOKEN_COOKIE_NAME,
  })

  return cookie?.value ? cookie.value : null
}

// --- Mail Query APIs ---

export async function getUserEmailFromToken(): Promise<string> {
  const data = await postSoapRequest("GetInfoRequest", {
    GetInfoRequest: {
      _jsns: "urn:zimbraAccount",
    },
  })

  const email = data?.Body?.GetInfoResponse?.name
  if (!email) {
    throw new Error("Không thể lấy địa chỉ email từ thông tin tài khoản")
  }

  return email
}

export async function getUnreadRawMessages(): Promise<ZimbraMessage[]> {
  const data = await postSoapRequest("SearchRequest&q=is:unread", {
    SearchRequest: {
      _jsns: "urn:zimbraMail",
      types: "message",
      limit: 100,
      query: "is:unread",
    },
  })

  return data.Body?.SearchResponse?.m || []
}

export async function getLatestEmailDate(): Promise<number | null> {
  const data = await postSoapRequest("SearchRequest&limit=1", {
    SearchRequest: {
      _jsns: "urn:zimbraMail",
      types: "message",
      limit: 1,
    },
  })

  const messages = data.Body?.SearchResponse?.m || []
  return messages.length > 0 && messages[0].d ? messages[0].d : null
}

export async function searchEmails(
  queryText?: string,
  filterType?: EmailFilterType
): Promise<MailMessage[]> {
  const queryParts: string[] = []

  if (filterType === EmailFilter.UNREAD) {
    queryParts.push("is:unread")
  } else if (filterType === EmailFilter.FLAGGED) {
    queryParts.push("is:flagged")
  } else if (filterType === EmailFilter.HAS_ATTACHMENT) {
    queryParts.push("has:attachment")
  }

  if (queryText?.trim()) {
    queryParts.push(queryText.trim())
  }

  const finalQuery = queryParts.join(" ")

  const data = await postSoapRequest(
    `SearchRequest${finalQuery ? `&q=${finalQuery}` : ""}`,
    {
      SearchRequest: {
        _jsns: "urn:zimbraMail",
        types: "message",
        limit: 100,
        query: finalQuery || undefined,
      },
    }
  )

  const messages = data.Body?.SearchResponse?.m || []
  return messages.map(parseMailMessage)
}

export async function getMessageDetail(
  messageId: string
): Promise<MailMessageDetail> {
  const data = await postSoapRequest(`GetMsgRequest&id=${messageId}`, {
    GetMsgRequest: {
      _jsns: "urn:zimbraMail",
      m: {
        id: messageId,
        html: 1,
      },
    },
  })

  const message = data.Body?.GetMsgResponse?.m?.[0]
  if (!message) {
    throw new Error(
      "Không thể tìm thấy thông tin email trong phản hồi của server"
    )
  }

  const serverUrl = await requireServerUrl()
  return parseMailMessageDetail(message, serverUrl)
}

export async function downloadAttachment(
  messageId: string,
  part: string,
  filename: string,
  onProgress?: (percent: number) => void
): Promise<void> {
  const { data } = await apiClient.get("/service/home/~", {
    responseType: "arraybuffer",
    timeout: 60000,
    params: {
      id: messageId,
      part,
    },
    onDownloadProgress: (progressEvent) => {
      if (progressEvent.total) {
        const percent = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        )
        onProgress?.(percent)
      }
    },
  })

  const blob = new Blob([data])
  const blobUrl = URL.createObjectURL(blob)

  const a = document.createElement("a")
  a.href = blobUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(blobUrl)
}

// --- Mail Mutation APIs ---

export async function markAsRead(messageId: string): Promise<void> {
  return executeMsgAction(messageId, "read")
}

export async function markAsUnread(messageId: string): Promise<void> {
  return executeMsgAction(messageId, "!read")
}

export async function flagEmail(messageId: string): Promise<void> {
  return executeMsgAction(messageId, "flag")
}

export async function unflagEmail(messageId: string): Promise<void> {
  return executeMsgAction(messageId, "!flag")
}
