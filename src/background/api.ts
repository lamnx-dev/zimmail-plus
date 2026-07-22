import axios, { type AxiosRequestConfig, type AxiosResponse } from "axios"
import { getCredentials } from "../storage/settings"
import type { AttachmentInfo, EmailFilterType, MailMessageDetail } from "../types"
import type {
  ZimbraGetMsgResponse,
  ZimbraMimePart,
  ZimbraMimePart2,
  ZimbraMimePart3,
  ZimbraMimePart4,
  ZimbraParticipant,
  ZimbraSoapResponse,
} from "../types/api"
import { BASE_URL, EmailFilter, ZimbraErrorCode, ZimbraParticipantType } from "../utils/constants"

export const api = axios.create({
  baseURL: BASE_URL,
})

let refreshPromise: Promise<string> | null = null
let isReauthFailed = false

function formatSenderName(sender: ZimbraParticipant | undefined): string {
  const defaultName = "(Không rõ người gửi)"
  if (!sender) return defaultName
  return sender.p ? `${sender.p} <${sender.a}>` : sender.a
}

// Reset trạng thái reauth thất bại khi thông tin tài khoản thay đổi
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "local" && (changes.username || changes.password || changes.autoLoginEnabled)) {
    isReauthFailed = false
  }
})

export async function loginAndSaveToken() {
  try {
    const creds = await getCredentials()

    if (!creds.username || !creds.password) {
      throw new Error("Thiếu thông tin tài khoản")
    }

    const payload = {
      Header: { context: { _jsns: "urn:zimbra" } },
      Body: {
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
      },
      _jsns: "urn:zimbraSoap",
    }

    const { data } = (await axios.post(`${BASE_URL}/service/soap?AuthRequest`, payload, {
      withCredentials: false,
    })) as AxiosResponse<ZimbraSoapResponse>

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

export async function getAuthToken() {
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
  if (creds.autoLoginEnabled && creds.username && creds.password) {
    const token = await handleReauth()
    return token
  }

  return null
}

export async function getUnreadEmails() {
  const { data } = (await api.get("/home/~/inbox.json", {
    params: {
      query: "is:unread",
      limit: 100,
    },
  })) as AxiosResponse<ZimbraGetMsgResponse>

  const rawMessages = data.m || []
  const unreadCount = rawMessages.length

  const unreadEmails = rawMessages.map((m) => {
    const senders = m.e ? (Array.isArray(m.e) ? m.e : [m.e]) : []
    const fromSender = senders.find((e) => e.t === ZimbraParticipantType.FROM) || senders[0]

    const senderName = formatSenderName(fromSender)

    return {
      id: m.id.toString(),
      subject: m.su || "(Không có chủ đề)",
      sender: senderName,
      date: new Date(m.d).toISOString(),
      fragment: m.fr || "(Không có nội dung preview)",
      flags: m.f || "",
    }
  })

  return {
    unreadCount,
    unreadEmails,
  }
}

export async function searchEmails(queryText: string, filterType: EmailFilterType) {
  const queryParts: string[] = []

  if (filterType === EmailFilter.UNREAD) {
    queryParts.push("is:unread")
  } else if (filterType === EmailFilter.READ) {
    queryParts.push("is:read")
  }

  if (queryText.trim()) {
    queryParts.push(queryText.trim())
  }

  const finalQuery = queryParts.join(" ")

  const { data } = (await api.get("/home/~/inbox.json", {
    params: {
      query: finalQuery || undefined,
      limit: 100,
    },
  })) as AxiosResponse<ZimbraGetMsgResponse>

  const rawMessages = data.m || []

  const emails = rawMessages.map((m) => {
    const senders = m.e ? (Array.isArray(m.e) ? m.e : [m.e]) : []
    const fromSender = senders.find((e) => e.t === ZimbraParticipantType.FROM) || senders[0]

    const senderName = formatSenderName(fromSender)

    return {
      id: m.id.toString(),
      subject: m.su || "(Không có chủ đề)",
      sender: senderName,
      date: new Date(m.d).toISOString(),
      fragment: m.fr || "(Không có nội dung preview)",
      flags: m.f || "",
    }
  })

  return emails
}

export async function markAsRead(messageId: string): Promise<void> {
  const authToken = await getAuthToken()
  if (!authToken) {
    throw new Error("Không tìm thấy token xác thực")
  }

  const payload = {
    Header: {
      context: {
        _jsns: "urn:zimbra",
        authToken: {
          _content: authToken,
        },
      },
    },
    Body: {
      MsgActionRequest: {
        _jsns: "urn:zimbraMail",
        action: {
          id: messageId,
          op: "read",
        },
      },
    },
    _jsns: "urn:zimbraSoap",
  }

  return api.post("/service/soap?MsgActionRequest-read", payload, {
    withCredentials: false,
  })
}

export async function markAsUnread(messageId: string): Promise<void> {
  const authToken = await getAuthToken()
  if (!authToken) {
    throw new Error("Không tìm thấy token xác thực")
  }

  const payload = {
    Header: {
      context: {
        _jsns: "urn:zimbra",
        authToken: {
          _content: authToken,
        },
      },
    },
    Body: {
      MsgActionRequest: {
        _jsns: "urn:zimbraMail",
        action: {
          id: messageId,
          op: "!read",
        },
      },
    },
    _jsns: "urn:zimbraSoap",
  }

  return api.post("/service/soap?MsgActionRequest-unread", payload, {
    withCredentials: false,
  })
}

function parseMimeParts(
  mp:
    | ZimbraMimePart[]
    | ZimbraMimePart2[]
    | ZimbraMimePart3[]
    | ZimbraMimePart4[]
    | ZimbraMimePart
    | ZimbraMimePart2
    | ZimbraMimePart3
    | ZimbraMimePart4
    | undefined,
  attachments: AttachmentInfo[],
  bodyState: { html?: string; text?: string },
  inlineImages: { cid: string; part: string }[]
) {
  if (!mp) return

  if (Array.isArray(mp)) {
    for (const part of mp) {
      parseMimeParts(part, attachments, bodyState, inlineImages)
    }
    return
  }

  const ct = mp.ct || ""
  const filename = "filename" in mp ? mp.filename || "" : ""
  const part = mp.part || ""
  const cd = "cd" in mp ? mp.cd || "" : ""
  const ci = "ci" in mp ? mp.ci || "" : ""

  if (ci) {
    const cleanCid = ci.replace(/[<>]/g, "")
    inlineImages.push({
      cid: cleanCid,
      part,
    })
  } else if (filename || cd === "attachment") {
    const s = "s" in mp ? mp.s : undefined
    attachments.push({
      part,
      filename: filename || `file_${part}`,
      contentType: ct,
      size: s || 0,
    })
  } else {
    let text = ""
    const content = "content" in mp ? mp.content : undefined
    if (content) {
      text = content
    }

    if (ct === "text/html" && text) {
      bodyState.html = text
    } else if (ct === "text/plain" && text) {
      bodyState.text = text
    }
  }

  if ("mp" in mp && mp.mp) {
    parseMimeParts(mp.mp, attachments, bodyState, inlineImages)
  }
}

export async function getMessageDetail(messageId: string): Promise<MailMessageDetail> {
  const authToken = await getAuthToken()

  const payload = {
    Header: {
      context: {
        _jsns: "urn:zimbra",
        authToken: {
          _content: authToken,
        },
        format: {
          type: "js",
        },
      },
    },
    Body: {
      GetMsgRequest: {
        _jsns: "urn:zimbraMail",
        m: {
          id: messageId,
          html: 1,
          wantContent: "full",
        },
      },
    },
  }

  const { data } = (await api.post("/service/soap?GetMsgRequest", payload, {
    withCredentials: false,
  })) as AxiosResponse<ZimbraSoapResponse>

  const rawMsgOrArray = data.Body?.GetMsgResponse?.m
  const rawMsg = Array.isArray(rawMsgOrArray) ? rawMsgOrArray[0] : rawMsgOrArray
  if (!rawMsg) {
    throw new Error("Không thể tìm thấy thông tin email trong phản hồi của server")
  }

  const senders = rawMsg.e ? (Array.isArray(rawMsg.e) ? rawMsg.e : [rawMsg.e]) : []
  const fromSender = senders.find((e) => e.t === ZimbraParticipantType.FROM) || senders[0]
  const senderName = formatSenderName(fromSender)

  const toList: string[] = senders.filter((e) => e.t === ZimbraParticipantType.TO).map((e) => (e.p ? `${e.p} <${e.a}>` : e.a))

  const ccList: string[] = senders.filter((e) => e.t === ZimbraParticipantType.CC).map((e) => (e.p ? `${e.p} <${e.a}>` : e.a))

  const attachments: AttachmentInfo[] = []
  const bodyState: { html?: string; text?: string } = {}
  const inlineImages: { cid: string; part: string }[] = []

  if (rawMsg.mp) {
    parseMimeParts(rawMsg.mp, attachments, bodyState, inlineImages)
  }

  let bodyHtml = bodyState.html || ""

  if (bodyHtml) {
    bodyHtml = bodyHtml.replace(/&#64;/gi, "@")
    if (inlineImages.length > 0) {
      for (const img of inlineImages) {
        const escapedCid = img.cid.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")
        const regex = new RegExp(`cid:${escapedCid}`, "g")
        const realUrl = `${BASE_URL}/service/home/~/?id=${rawMsg.id}&part=${img.part}`

        bodyHtml = bodyHtml.replace(regex, realUrl)
      }
    }
  }

  return {
    id: rawMsg.id ? rawMsg.id.toString() : "",
    subject: rawMsg.su || "(Không có chủ đề)",
    sender: senderName,
    date: rawMsg.d ? new Date(rawMsg.d).toISOString() : new Date().toISOString(),
    fragment: rawMsg.fr || "(Không có nội dung preview)",
    flags: rawMsg.f || "",
    bodyHtml: bodyHtml,
    bodyText: bodyState.text,
    attachments,
    to: toList,
    cc: ccList,
  }
}

export async function getUserEmailFromToken(): Promise<string> {
  const authToken = await getAuthToken()
  if (!authToken) {
    throw new Error("Không tìm thấy token xác thực")
  }

  const payload = {
    Header: {
      context: {
        _jsns: "urn:zimbra",
        authToken: {
          _content: authToken,
        },
        format: {
          type: "js",
        },
      },
    },
    Body: {
      GetInfoRequest: {
        _jsns: "urn:zimbraAccount",
      },
    },
  }

  const { data } = (await api.post("/service/soap?GetInfoRequest", payload, {
    withCredentials: false,
  })) as AxiosResponse<ZimbraSoapResponse>

  const email = data?.Body?.GetInfoResponse?.name
  if (!email) {
    throw new Error("Không thể lấy địa chỉ email từ thông tin tài khoản")
  }

  return email
}

export async function downloadAttachment(messageId: string, part: string, filename: string): Promise<void> {
  const { data } = await api.get(`/service/home/~/?id=${messageId}&part=${part}`, {
    responseType: "blob",
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
