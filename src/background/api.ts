import type { AttachmentInfo, MailMessage, MailMessageDetail } from "../types"
import type { ZimbraGetMsgResponse, ZimbraMessage, ZimbraMimePart, ZimbraMimePart2, ZimbraMimePart3, ZimbraMimePart4, ZimbraSoapResponse } from "../types/api"
import { ZimbraParticipantType } from "../types/api"
import { BASE_URL } from "../utils/constants"

interface ZimbraMailboxInfo {
  unreadCount: number
  emailAddress: string | null
  unreadEmails?: MailMessage[]
}

const ZIMBRA_REST_INBOX_URL = `${BASE_URL}/home/~/inbox.json`

export async function getAuthToken(): Promise<string | null> {
  try {
    const cookie = await chrome.cookies.get({
      url: BASE_URL,
      name: "ZM_AUTH_TOKEN",
    })
    if (cookie) {
      return cookie.value
    } else {
      console.warn("Không tìm thấy cookie ZM_AUTH_TOKEN")
      return null
    }
  } catch (err) {
    console.error("Lỗi khi lấy cookie ZM_AUTH_TOKEN:", err)
    return null
  }
}

async function fetchZimbraRest(url: string): Promise<ZimbraGetMsgResponse> {
  const response = await fetch(url, {
    method: "GET",
    credentials: "include",
    headers: {
      Accept: "application/json",
      "Cache-Control": "no-cache",
    },
  })

  if (!response.ok) {
    throw new Error(`HTTP Error: ${response.status} ${response.statusText}`)
  }

  const text = await response.text()

  // If the response is HTML, it means we got redirected to the login page (session expired)
  if (text.trim().startsWith("<") || text.trim().startsWith("<!")) {
    throw new Error("AUTH_REQUIRED")
  }

  try {
    return JSON.parse(text) as ZimbraGetMsgResponse
  } catch (err) {
    console.error("Lỗi parse JSON REST response:", err)
    throw new Error("Invalid JSON response from server", { cause: err })
  }
}

export async function getMailboxInfo(): Promise<ZimbraMailboxInfo> {
  const url = `${ZIMBRA_REST_INBOX_URL}?query=is:unread&limit=100`
  const data = await fetchZimbraRest(url)
  const rawMessages = data.m || []
  const unreadCount = rawMessages.length

  const unreadEmails = rawMessages.map((m) => {
    const senders = m.e ? (Array.isArray(m.e) ? m.e : [m.e]) : []
    const fromSender = senders.find((e) => e.t === ZimbraParticipantType.F) || senders[0]

    let senderName = "Không rõ người gửi"
    if (fromSender) {
      senderName = fromSender.p ? `${fromSender.p} <${fromSender.a}>` : fromSender.a
    }

    return {
      id: m.id.toString(),
      subject: m.su || "(Không có chủ đề)",
      sender: senderName,
      date: new Date(m.d).toISOString(),
      fragment: m.fr || "",
    }
  })

  let emailAddress: string | null = null

  try {
    const recentUrl = `${ZIMBRA_REST_INBOX_URL}?limit=1`
    const recentData = await fetchZimbraRest(recentUrl)
    const messages = recentData?.m || []
    if (messages.length > 0) {
      const msg = messages[0]
      if (msg.e) {
        const participants = Array.isArray(msg.e) ? msg.e : [msg.e]
        // Find the 'to' recipient that is an email at @teca.vn
        const toMe = participants.find((e) => e.t === ZimbraParticipantType.T && e.a && e.a.includes("@teca.vn"))
        if (toMe) {
          emailAddress = toMe.a
        } else {
          const anyTo = participants.find((e) => e.t === ZimbraParticipantType.T)
          if (anyTo) emailAddress = anyTo.a
        }
      }
    }
  } catch (err) {
    console.warn("Không thể lấy email từ thư gần đây:", err)
  }

  return {
    unreadCount,
    emailAddress: emailAddress || "Tài khoản Zimbra",
    unreadEmails,
  }
}

export async function getRecentMessages(limit: number = 10): Promise<MailMessage[]> {
  const url = `${ZIMBRA_REST_INBOX_URL}?limit=${limit}`
  const data = await fetchZimbraRest(url)

  const messages = data.m || []

  return messages.map((m) => {
    const senders = m.e ? (Array.isArray(m.e) ? m.e : [m.e]) : []
    const fromSender = senders.find((e) => e.t === ZimbraParticipantType.F) || senders[0]

    let senderName = "Không rõ người gửi"
    if (fromSender) {
      senderName = fromSender.p ? `${fromSender.p} <${fromSender.a}>` : fromSender.a
    }

    return {
      id: m.id.toString(),
      subject: m.su || "(Không có chủ đề)",
      sender: senderName,
      date: new Date(m.d).toISOString(),
      fragment: m.fr || "",
    }
  })
}

export async function markAsRead(messageId: string): Promise<void> {
  const authToken = await getAuthToken()
  if (!authToken) {
    throw new Error("AUTH_REQUIRED")
  }

  const url = `${BASE_URL}/service/soap`
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

  const response = await fetch(url, {
    method: "POST",
    credentials: "omit",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(`HTTP Error: ${response.status} ${response.statusText}`)
  }

  const text = await response.text()
  // Check if response is HTML (e.g. redirected to login page)
  if (text.trim().startsWith("<") || text.trim().startsWith("<!")) {
    throw new Error("AUTH_REQUIRED")
  }

  let result
  try {
    result = JSON.parse(text)
  } catch (err) {
    console.error("Lỗi parse JSON SOAP response:", err)
    throw new Error("Invalid JSON response from server", { cause: err })
  }

  if (result.Body && result.Body.Fault) {
    const faultReason = result.Body.Fault.Reason?.Text || "Unknown SOAP Fault"
    throw new Error(`Zimbra SOAP Fault: ${faultReason}`)
  }
}

export async function markAsUnread(messageId: string): Promise<void> {
  const authToken = await getAuthToken()
  if (!authToken) {
    throw new Error("AUTH_REQUIRED")
  }

  const url = `${BASE_URL}/service/soap`
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

  const response = await fetch(url, {
    method: "POST",
    credentials: "omit",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(`HTTP Error: ${response.status} ${response.statusText}`)
  }

  const text = await response.text()
  // Check if response is HTML (e.g. redirected to login page)
  if (text.trim().startsWith("<") || text.trim().startsWith("<!")) {
    throw new Error("AUTH_REQUIRED")
  }

  let result
  try {
    result = JSON.parse(text)
  } catch (err) {
    console.error("Lỗi parse JSON SOAP response:", err)
    throw new Error("Invalid JSON response from server", { cause: err })
  }

  if (result.Body && result.Body.Fault) {
    const faultReason = result.Body.Fault.Reason?.Text || "Unknown SOAP Fault"
    throw new Error(`Zimbra SOAP Fault: ${faultReason}`)
  }
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

  // Handle arrays at the very beginning of traversal
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

  // Check if it's an inline resource (like images referenced via cid)
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

async function fetchImageAsBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      method: "GET",
      credentials: "include",
      headers: {
        "Cache-Control": "no-cache",
      },
    })
    if (!response.ok) {
      console.warn(`Không thể fetch ảnh inline. HTTP Status: ${response.status}`)
      return null
    }
    const blob = await response.blob()
    const buffer = await blob.arrayBuffer()
    let binary = ""
    const bytes = new Uint8Array(buffer)
    const len = bytes.byteLength
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    const base64 = btoa(binary)
    return `data:${blob.type};base64,${base64}`
  } catch (err) {
    console.error("Lỗi khi fetch ảnh inline:", err)
    return null
  }
}

export async function getMessageDetail(messageId: string): Promise<MailMessageDetail> {
  const authToken = await getAuthToken()
  if (!authToken) {
    throw new Error("AUTH_REQUIRED")
  }

  const url = `${BASE_URL}/service/soap`
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
          max: 500000,
          wantContent: "full",
        },
      },
    },
  }

  const response = await fetch(url, {
    method: "POST",
    credentials: "omit",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(`HTTP Error: ${response.status} ${response.statusText}`)
  }

  const text = await response.text()
  if (text.trim().startsWith("<") || text.trim().startsWith("<!")) {
    throw new Error("AUTH_REQUIRED")
  }

  let result: ZimbraSoapResponse
  try {
    result = JSON.parse(text)
  } catch (err) {
    console.error("Lỗi parse JSON SOAP response:", err)
    throw new Error("Invalid JSON response from server", { cause: err })
  }

  const soapBody = result.Body as unknown as Record<string, unknown>
  if (soapBody && soapBody.Fault) {
    const fault = soapBody.Fault as Record<string, unknown>
    const reason = fault.Reason as Record<string, unknown>
    const faultReason = (reason?.Text as string) || "Unknown SOAP Fault"
    throw new Error(`Zimbra SOAP Fault: ${faultReason}`)
  }

  const rawMsgOrArray = result.Body?.GetMsgResponse?.m
  const rawMsg = (Array.isArray(rawMsgOrArray) ? rawMsgOrArray[0] : rawMsgOrArray) as ZimbraMessage | undefined
  if (!rawMsg) {
    throw new Error("Không thể tìm thấy thông tin email trong phản hồi của server")
  }

  const senders = rawMsg.e ? (Array.isArray(rawMsg.e) ? rawMsg.e : [rawMsg.e]) : []
  const fromSender = senders.find((e) => e.t === ZimbraParticipantType.F) || senders[0]
  let senderName = "Không rõ người gửi"
  if (fromSender) {
    senderName = fromSender.p ? `${fromSender.p} <${fromSender.a}>` : fromSender.a
  }

  const toList: string[] = senders.filter((e) => e.t === ZimbraParticipantType.T).map((e) => (e.p ? `${e.p} <${e.a}>` : e.a))

  const ccList: string[] = senders.filter((e) => e.t === ZimbraParticipantType.C).map((e) => (e.p ? `${e.p} <${e.a}>` : e.a))

  const attachments: AttachmentInfo[] = []
  const bodyState: { html?: string; text?: string } = {}
  const inlineImages: { cid: string; part: string }[] = []

  // Root mp could be a single mp or undefined
  if (rawMsg.mp) {
    parseMimeParts(rawMsg.mp, attachments, bodyState, inlineImages)
  }

  // Replace cid: image sources with base64 data URLs to prevent SameSite cookie issues in sandboxed iframe
  let bodyHtml = bodyState.html || ""
  if (bodyHtml) {
    // Normalize HTML entities for '@' (like &#64;) commonly used in email CIDs
    bodyHtml = bodyHtml.replace(/&#64;/gi, "@")

    if (inlineImages.length > 0) {
      for (const img of inlineImages) {
        const escapedCid = img.cid.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")
        const regex = new RegExp(`cid:${escapedCid}`, "g")
        const realUrl = `${BASE_URL}/service/home/~/?id=${rawMsg.id}&part=${img.part}`

        const base64Data = await fetchImageAsBase64(realUrl)
        if (base64Data) {
          bodyHtml = bodyHtml.replace(regex, base64Data)
        } else {
          // Fallback to real URL if fetch fails
          bodyHtml = bodyHtml.replace(regex, realUrl)
        }
      }
    }
  }

  return {
    id: rawMsg.id ? rawMsg.id.toString() : "",
    subject: rawMsg.su || "(Không có chủ đề)",
    sender: senderName,
    date: rawMsg.d ? new Date(rawMsg.d).toISOString() : new Date().toISOString(),
    fragment: rawMsg.fr || "",
    bodyHtml: bodyHtml,
    bodyText: bodyState.text,
    attachments,
    to: toList,
    cc: ccList,
  }
}
