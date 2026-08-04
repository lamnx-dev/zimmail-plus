import { DEFAULT_AI_MODEL, GROQ_API_BASE_URL } from "@/utils/constants"
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
  const aiApiKey = secrets.aiApiKey

  if (!aiApiKey) {
    throw new Error(
      "[MISSING_API_KEY] Chưa nhập Groq API Key. Vui lòng vào Cài đặt → AI để cấu hình."
    )
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30000)

  try {
    const response = await fetch(`${GROQ_API_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${aiApiKey}`,
      },
      body: JSON.stringify({
        model: DEFAULT_AI_MODEL,
        messages: [{ role: "user", content: buildPrompt(email) }],
        temperature: 0.2,
        max_tokens: 1024,
        stream: true,
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const msg =
        errorData?.error?.message || `Lỗi Groq API (${response.status})`
      throw new Error(msg)
    }

    if (!response.body) {
      throw new Error("Không nhận được luồng dữ liệu từ Groq API.")
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder("utf-8")
    let fullSummary = ""
    let buffer = ""

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split("\n")
      buffer = lines.pop() || ""

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith(":")) continue
        if (trimmed === "data: [DONE]") continue

        if (trimmed.startsWith("data: ")) {
          try {
            const jsonStr = trimmed.slice(6)
            const parsed = JSON.parse(jsonStr)
            const content = parsed.choices?.[0]?.delta?.content
            if (content) {
              fullSummary += content
              onChunk(content)
            }
          } catch {
            // Bỏ qua nếu dòng JSON không hợp lệ
          }
        }
      }
    }

    if (buffer.trim().startsWith("data: ")) {
      try {
        const jsonStr = buffer.trim().slice(6)
        if (jsonStr !== "[DONE]") {
          const parsed = JSON.parse(jsonStr)
          const content = parsed.choices?.[0]?.delta?.content
          if (content) {
            fullSummary += content
            onChunk(content)
          }
        }
      } catch {
        // Ignore trailing invalid json
      }
    }

    return fullSummary.trim()
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(
        "Quá thời gian kết nối AI (Timeout 30s). Vui lòng thử lại.",
        { cause: error }
      )
    }
    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}

export async function testAiConnection(apiKey: string): Promise<boolean> {
  if (!apiKey) throw new Error("Chưa nhập API Key")
  const response = await fetch(`${GROQ_API_BASE_URL}/models`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  })
  if (!response.ok) {
    throw new Error("API Key không hợp lệ")
  }
  return true
}
