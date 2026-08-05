import { DEFAULT_AI_MODEL } from "@/utils/constants"
import Groq from "groq-sdk"
import { getSecrets } from "../storage/settings"
import type { MailMessageDetail } from "../types"

function cleanEmailBody(htmlOrText?: string): string {
  if (!htmlOrText) return ""

  // Loại bỏ script và style tags
  let cleaned = htmlOrText.replace(
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    ""
  )
  cleaned = cleaned.replace(
    /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi,
    ""
  )

  // Loại bỏ các thẻ HTML
  cleaned = cleaned.replace(/<[^>]+>/g, "\n")

  // Giải mã entity HTML cơ bản
  cleaned = cleaned
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")

  // Xóa các chuỗi reply quote cũ (> ...) và khoảng trắng thừa
  const lines = cleaned.split("\n").map((line) => line.trim())
  const filteredLines = lines.filter(
    (line) => line.length > 0 && !line.startsWith(">")
  )

  return filteredLines.join("\n").replace(/\s+/g, " ").trim().substring(0, 6000)
}

function buildPrompt(email: MailMessageDetail): string {
  const cleanBody = cleanEmailBody(
    email.bodyText || email.bodyHtml || email.fragment || ""
  )

  const truncatedBody =
    cleanBody.length > 6000 ? cleanBody.substring(0, 6000) + "..." : cleanBody

  return `Bạn là trợ lý AI chuyên tóm tắt email một cách súc tích, ngắn gọn và chính xác.
Hãy tóm tắt nội dung chính của email dưới đây bằng Tiếng Việt trong 2-3 câu ngắn gọn. Chỉ trả về trực tiếp đoạn văn tóm tắt, không thêm tiêu đề hay định dạng danh sách.

--- NỘI DUNG EMAIL ---
Tiêu đề: ${email.subject || "(Không có tiêu đề)"}
Người gửi: ${email.sender || "(Không rõ)"}
Ngày gửi: ${email.date || ""}
Nội dung:
${truncatedBody}`
}

export async function summarizeEmailStream(
  email: MailMessageDetail,
  onChunk: (chunk: string) => void
): Promise<string> {
  const secrets = await getSecrets()

  const groq = new Groq({
    apiKey: secrets.aiApiKey,
    dangerouslyAllowBrowser: true,
  })

  let fullSummary = ""

  const stream = await groq.chat.completions.create({
    messages: [{ role: "user", content: buildPrompt(email) }],
    model: DEFAULT_AI_MODEL,
    temperature: 0.2,
    stream: true,
  })

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || ""
    if (content) {
      fullSummary += content
      onChunk(content)
    }
  }

  const finalSummary = fullSummary.trim()
  if (!finalSummary) {
    throw new Error("Không nhận được nội dung tóm tắt từ AI.")
  }

  return finalSummary
}

export async function testAiConnection(apiKey: string): Promise<boolean> {
  const groq = new Groq({
    apiKey,
    dangerouslyAllowBrowser: true,
  })

  await groq.models.list()

  return true
}
