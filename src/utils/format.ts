/**
 * Định dạng dung lượng file từ Bytes sang định dạng dễ đọc (B, KB, MB, GB)
 * @param bytes Số bytes cần format
 * @param decimals Số chữ số thập phân (mặc định là 1)
 */
export function formatFileSize(bytes: number, decimals: number = 1): string {
  if (bytes <= 0 || isNaN(bytes)) return "0 B"

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ["B", "KB", "MB", "GB", "TB"]

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}
