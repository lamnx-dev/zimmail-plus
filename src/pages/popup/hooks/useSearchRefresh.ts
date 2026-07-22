import { useRef, useState } from "react"

/**
 * Quản lý refresh key cho search useEffect.
 * - `refresh()`: hiện loading khi load lại
 * - `silentRefresh()`: load lại trong nền, không hiện loading
 */
export function useSearchRefresh() {
  const [refreshKey, setRefreshKey] = useState(0)
  const [silentKey, setSilentKey] = useState(0)
  const isSilentRef = useRef(false)

  const refresh = () => setRefreshKey((k) => k + 1)

  const silentRefresh = () => {
    isSilentRef.current = true
    setSilentKey((k) => k + 1)
  }

  /** Gọi ở đầu useEffect để lấy và reset cờ silent */
  const consumeSilent = () => {
    const val = isSilentRef.current
    isSilentRef.current = false
    return val
  }

  return { refreshKey, silentKey, refresh, silentRefresh, consumeSilent }
}
