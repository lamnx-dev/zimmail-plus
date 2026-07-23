export function formatEmailDate(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    const now = new Date()

    // Today
    if (date.toDateString() === now.toDateString()) {
      const pad = (n: number) => n.toString().padStart(2, "0")
      return `${pad(date.getHours())}:${pad(date.getMinutes())}`
    }

    // Yesterday
    const yesterday = new Date(now)
    yesterday.setDate(now.getDate() - 1)
    if (date.toDateString() === yesterday.toDateString()) {
      return "Hôm qua"
    }

    // Same year
    if (date.getFullYear() === now.getFullYear()) {
      const pad = (n: number) => n.toString().padStart(2, "0")
      return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}`
    }

    // Other years
    return date.getFullYear().toString()
  } catch {
    return "--:--"
  }
}

export function formatEmailFullDate(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    const pad = (n: number) => n.toString().padStart(2, "0")
    const hours = pad(date.getHours())
    const minutes = pad(date.getMinutes())
    const seconds = pad(date.getSeconds())
    const day = pad(date.getDate())
    const month = pad(date.getMonth() + 1)
    const year = date.getFullYear()
    return `${hours}:${minutes}:${seconds} ${day}/${month}/${year}`
  } catch {
    return dateStr
  }
}

export function getAvatarLetter(sender: string): string {
  const name = sender.split("<")[0].trim()
  if (!name) return "U"

  const words = name.split(/\s+/)
  const targetWord = words[words.length - 1]
  const char = targetWord ? targetWord.charAt(0) : name.charAt(0)
  return char.toUpperCase()
}

export function getAvatarColor(sender: string): string {
  const colors = [
    "#3b82f6", // blue
    "#10b981", // green
    "#f59e0b", // amber
    "#ef4444", // red
    "#8b5cf6", // purple
    "#ec4899", // pink
    "#06b6d4", // cyan
    "#14b8a6", // teal
    "#f97316", // orange
    "#6366f1", // indigo
  ]

  const name = sender.split("<")[0].trim() || sender
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }

  const index = Math.abs(hash) % colors.length
  return colors[index]
}

export function getCleanSenderName(sender: string): string {
  const name = sender.split("<")[0].trim()
  return name || sender
}
