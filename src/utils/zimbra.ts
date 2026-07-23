import type { AttachmentInfo, MailMessage, MailMessageDetail } from "../types"
import type { ZimbraMessage, ZimbraMimePart, ZimbraMimePart2, ZimbraMimePart3, ZimbraMimePart4, ZimbraParticipant } from "../types/api"
import { BASE_URL, ZimbraParticipantType } from "./constants"

export function formatSenderName(sender: ZimbraParticipant | undefined): string {
  const defaultName = "(Không rõ người gửi)"
  if (!sender) return defaultName
  if (sender.p && sender.a) return `${sender.p} <${sender.a}>`
  return sender.a || sender.p || defaultName
}

export function parseMailMessage(m: ZimbraMessage): MailMessage {
  const senders = m.e ? (Array.isArray(m.e) ? m.e : [m.e]) : []
  const fromSender = senders.find((e) => e.t === ZimbraParticipantType.FROM) || senders[0]
  const senderName = formatSenderName(fromSender)

  return {
    id: m.id ?? "",
    subject: m.su || "(Không có chủ đề)",
    sender: senderName,
    date: m.d ? new Date(m.d).toISOString() : new Date().toISOString(),
    fragment: m.fr || "(Không có nội dung preview)",
    flags: m.f || "",
  }
}

export function parseMailMessageDetail(message: ZimbraMessage): MailMessageDetail {
  const baseEmail = parseMailMessage(message)
  const senders = message.e || []
  const toList: string[] = senders.filter((e) => e.t === ZimbraParticipantType.TO && !!e.a).map((e) => (e.p ? `${e.p} <${e.a}>` : (e.a as string)))
  const ccList: string[] = senders.filter((e) => e.t === ZimbraParticipantType.CC && !!e.a).map((e) => (e.p ? `${e.p} <${e.a}>` : (e.a as string)))

  const attachments: AttachmentInfo[] = []
  const bodyState: { html?: string; text?: string } = {}
  const inlineImages: { cid: string; part: string }[] = []

  if (message.mp) {
    parseMimeParts(message.mp, attachments, bodyState, inlineImages)
  }

  let bodyHtml = bodyState.html || ""

  if (bodyHtml) {
    bodyHtml = bodyHtml.replace(/&#64;/gi, "@")
    if (inlineImages.length > 0) {
      for (const img of inlineImages) {
        const escapedCid = img.cid.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")
        const regex = new RegExp(`cid:${escapedCid}`, "g")
        const realUrl = `${BASE_URL}/service/home/~/?id=${message.id}&part=${img.part}`

        bodyHtml = bodyHtml.replace(regex, realUrl)
      }
    }
  }

  return {
    ...baseEmail,
    bodyHtml,
    bodyText: bodyState.text,
    attachments,
    to: toList,
    cc: ccList,
  }
}

export function buildSoapEnvelope(authToken: string | null, body: Record<string, unknown>, extraContext: Record<string, unknown> = {}) {
  return {
    Header: {
      context: {
        _jsns: "urn:zimbra",
        ...(authToken ? { authToken: { _content: authToken } } : {}),
        ...extraContext,
      },
    },
    Body: body,
    _jsns: "urn:zimbraSoap",
  }
}

export function parseMimeParts(
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
