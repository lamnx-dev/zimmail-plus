export function formatTime(value?: string | number | Date | null): string {
  if (!value) return "--:--:--"
  const date = value instanceof Date ? value : new Date(value)
  if (isNaN(date.getTime())) return "--:--:--"
  const pad = (n: number) => n.toString().padStart(2, "0")
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}
