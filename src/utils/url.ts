export function normalizeServerUrl(rawUrl: string): string {
  if (!rawUrl || !rawUrl.trim()) return ""
  let url = rawUrl.trim()

  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`
  }

  try {
    const parsed = new URL(url)
    return parsed.origin
  } catch {
    return url.split("#")[0].replace(/\/+$/, "")
  }
}
