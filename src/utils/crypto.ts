// Utility mã hóa / giải mã mật khẩu sử dụng Web Crypto API (AES-GCM)

export const ENCRYPTED_PREFIX = "enc_v1:"

async function getEncryptionKey(): Promise<CryptoKey> {
  const secret = chrome.runtime?.id
  if (!secret) {
    throw new Error(
      "[crypto] Encryption requires a valid extension runtime context. " +
        "chrome.runtime.id is unavailable."
    )
  }

  const encoder = new TextEncoder()
  const keyData = encoder.encode(secret.padEnd(32, "0").slice(0, 32))

  return crypto.subtle.importKey("raw", keyData, { name: "AES-GCM" }, false, [
    "encrypt",
    "decrypt",
  ])
}

/**
 * Mã hóa chuỗi text dạng plain-text thành chuỗi Base64 có mã hóa AES-GCM
 */
export async function encryptText(text: string): Promise<string> {
  if (!text) return ""

  try {
    const key = await getEncryptionKey()
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const encoder = new TextEncoder()
    const data = encoder.encode(text)

    const encryptedContent = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      data
    )

    const combined = new Uint8Array(iv.length + encryptedContent.byteLength)
    combined.set(iv, 0)
    combined.set(new Uint8Array(encryptedContent), iv.length)

    const base64 = btoa(
      Array.from(combined, (b) => String.fromCharCode(b)).join("")
    )
    return `${ENCRYPTED_PREFIX}${base64}`
  } catch (error) {
    console.error("Encryption error:", error)
    throw error
  }
}

/**
 * Giải mã chuỗi đã mã hóa về lại plain-text
 */
export async function decryptText(encryptedText: string): Promise<string> {
  if (!encryptedText) return ""
  if (!encryptedText.startsWith(ENCRYPTED_PREFIX)) {
    // Nếu chưa được mã hóa (dữ liệu cũ), trả về nguyên bản
    return encryptedText
  }

  try {
    const key = await getEncryptionKey()
    const base64 = encryptedText.slice(ENCRYPTED_PREFIX.length)
    const combinedStr = atob(base64)
    const combined = Uint8Array.from(combinedStr, (c) => c.charCodeAt(0))

    const iv = combined.slice(0, 12)
    const data = combined.slice(12)

    const decryptedContent = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      data
    )

    const decoder = new TextDecoder()
    return decoder.decode(decryptedContent)
  } catch (error) {
    console.error("Decryption error:", error)
    return ""
  }
}
