import axios, { type AxiosRequestConfig, type AxiosResponse } from "axios"
import { getCredentials } from "../storage/settings"
import type { EmailFilterType, MailMessage, MailMessageDetail } from "../types"
import type { ZimbraSoapResponse } from "../types/api"
import { BASE_URL, EmailFilter, ZimbraErrorCode } from "../utils/constants"
import { buildSoapEnvelope, parseMailMessage, parseMailMessageDetail } from "../utils/zimbra"

// --- Axios Client & Interceptor ---

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: false,
})

let refreshPromise: Promise<string> | null = null
let isReauthFailed = false

// Reset trạng thái reauth thất bại khi thông tin tài khoản thay đổi
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "local" && (changes.username || changes.password || changes.autoLoginEnabled)) {
    isReauthFailed = false
  }
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean }
    const faultCode = error.response?.data?.Body?.Fault?.Detail?.Error?.Code
    const isAuthFault = faultCode === ZimbraErrorCode.AUTH_EXPIRED

    if ((error.response?.status === 401 || isAuthFault) && !originalRequest._retry) {
      const creds = await getCredentials()
      if (!creds.autoLoginEnabled || isReauthFailed) {
        return Promise.reject(error)
      }

      originalRequest._retry = true
      try {
        const newToken = await handleReauth()

        if (!newToken) {
          return Promise.reject(error)
        }

        if (originalRequest.data?.Header?.context?.authToken?._content) {
          originalRequest.data.Header.context.authToken._content = newToken
        }
        return api(originalRequest)
      } catch (error) {
        return Promise.reject(error)
      }
    }
    return Promise.reject(error)
  }
)

// --- Auth & Token Management ---

async function loginAndSaveToken() {
  try {
    const creds = await getCredentials()

    if (!creds.username || !creds.password) {
      throw new Error("Thiếu thông tin tài khoản")
    }

    const payload = buildSoapEnvelope(null, {
      AuthRequest: {
        _jsns: "urn:zimbraAccount",
        account: {
          _content: creds.username,
          by: "name",
        },
        password: {
          _content: creds.password,
        },
      },
    })

    const { data } = (await axios.post(`${BASE_URL}/service/soap?AuthRequest`, payload)) as AxiosResponse<ZimbraSoapResponse>

    const authToken = data.Body?.AuthResponse?.authToken?.[0]?._content

    if (!authToken) {
      throw new Error("Không nhận được token xác thực từ máy chủ")
    }

    const domain = new URL(BASE_URL).hostname
    await chrome.cookies.set({
      url: BASE_URL,
      name: "ZM_AUTH_TOKEN",
      value: authToken,
      domain: domain,
      path: "/",
      secure: true,
    })

    isReauthFailed = false
    return authToken
  } catch (err) {
    isReauthFailed = true
    throw err
  }
}

async function handleReauth() {
  if (refreshPromise) {
    return refreshPromise
  }

  refreshPromise = loginAndSaveToken().finally(() => {
    refreshPromise = null
  })

  return refreshPromise
}

async function getAuthToken() {
  const cookie = await chrome.cookies.get({
    url: BASE_URL,
    name: "ZM_AUTH_TOKEN",
  })

  if (cookie) {
    return cookie.value
  }

  if (isReauthFailed) {
    return null
  }

  const creds = await getCredentials()
  if (creds.autoLoginEnabled) {
    const token = await handleReauth()
    return token
  }

  return null
}

async function requireAuthToken(): Promise<string> {
  const token = await getAuthToken()
  if (!token) {
    throw new Error("Không tìm thấy token xác thực")
  }
  return token
}

// --- Helper Functions ---

async function postSoapRequest(
  requestName: string,
  requestBody: Record<string, unknown>,
  extraContext: Record<string, unknown> = {}
): Promise<ZimbraSoapResponse> {
  const authToken = await requireAuthToken()
  const payload = buildSoapEnvelope(authToken, requestBody, extraContext)
  const { data } = (await api.post(`/service/soap?${requestName}`, payload)) as AxiosResponse<ZimbraSoapResponse>
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

// --- Mail Query APIs ---

export async function getUnreadEmails(): Promise<MailMessage[]> {
  const data = await postSoapRequest("SearchRequest&q=is:unread", {
    SearchRequest: {
      _jsns: "urn:zimbraMail",
      types: "message",
      limit: 100,
      query: "is:unread",
    },
  })

  const messages = data.Body?.SearchResponse?.m || []
  return messages.map(parseMailMessage)
}

export async function searchEmails(queryText: string, filterType: EmailFilterType): Promise<MailMessage[]> {
  const queryParts: string[] = []

  if (filterType === EmailFilter.UNREAD) {
    queryParts.push("is:unread")
  } else if (filterType === EmailFilter.FLAGGED) {
    queryParts.push("is:flagged")
  } else if (filterType === EmailFilter.HAS_ATTACHMENT) {
    queryParts.push("has:attachment")
  }

  if (queryText.trim()) {
    queryParts.push(queryText.trim())
  }

  const finalQuery = queryParts.join(" ")

  const data = await postSoapRequest(`SearchRequest${finalQuery ? `&q=${finalQuery}` : ""}`, {
    SearchRequest: {
      _jsns: "urn:zimbraMail",
      types: "message",
      limit: 100,
      query: finalQuery || undefined,
    },
  })

  const messages = data.Body?.SearchResponse?.m || []
  return messages.map(parseMailMessage)
}

export async function getMessageDetail(messageId: string): Promise<MailMessageDetail> {
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
    throw new Error("Không thể tìm thấy thông tin email trong phản hồi của server")
  }

  return parseMailMessageDetail(message)
}

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

export async function downloadAttachment(messageId: string, part: string, filename: string, onProgress?: (percent: number) => void): Promise<void> {
  const { data } = await api.get(`/service/home/~/?id=${messageId}&part=${part}`, {
    responseType: "blob",
    onDownloadProgress: (progressEvent) => {
      if (progressEvent.total) {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        onProgress?.(percent)
      }
    },
  })

  const blobUrl = URL.createObjectURL(data)

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
