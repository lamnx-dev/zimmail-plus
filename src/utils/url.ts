function parseUrl(rawUrl: string): URL | null {
  const value = rawUrl.trim()
  if (!value) return null

  const normalized = /^https?:\/\//i.test(value) ? value : `https://${value}`

  try {
    const url = new URL(normalized)

    return url.protocol === "http:" || url.protocol === "https:" ? url : null
  } catch {
    return null
  }
}

export function isValidUrl(rawUrl: string): boolean {
  return parseUrl(rawUrl) !== null
}

export function normalizeServerUrl(rawUrl: string): string {
  return parseUrl(rawUrl)?.origin ?? rawUrl.trim()
}
