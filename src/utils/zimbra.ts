import type { AttachmentInfo } from "../types"
import type {
  ZimbraMessage,
  ZimbraMimePart,
  ZimbraMimePart2,
  ZimbraMimePart3,
  ZimbraMimePart4,
  ZimbraParticipant,
} from "../types/api"
import { ZimbraParticipantType } from "./constants"

export function formatSenderName(sender: ZimbraParticipant | undefined): string {
  const defaultName = "(Không rõ người gửi)"
  if (!sender) return defaultName
  return sender.p ? `${sender.p} <${sender.a}>` : sender.a
}

export function parseEmailItem(m: ZimbraMessage) {
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
