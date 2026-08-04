import type { ActionType, MessageResult } from "../types"

interface SendActionMessageOptions<T> {
  action: ActionType
  payload?: Record<string, unknown>
  onSuccess?: (data: T) => void
  onError?: (error: string) => void
  onSettled?: () => void
}

export function sendActionMessage<T = void>({
  action,
  payload = {},
  onSuccess,
  onError,
  onSettled,
}: SendActionMessageOptions<T>): void {
  chrome.runtime.sendMessage(
    { action, ...payload },
    (response: MessageResult<T>) => {
      try {
        if (response?.success) {
          onSuccess?.(response.data as T)
        } else {
          const errorMsg = response?.error ?? "Lỗi không xác định"
          onError?.(errorMsg)
        }
      } finally {
        onSettled?.()
      }
    }
  )
}

interface SendActionMessageAsyncOptions {
  action: ActionType
  payload?: Record<string, unknown>
}

export function sendActionMessageAsync<T = void>({
  action,
  payload = {},
}: SendActionMessageAsyncOptions): Promise<T> {
  return new Promise((resolve, reject) => {
    sendActionMessage<T>({
      action,
      payload,
      onSuccess: resolve,
      onError: (error) => reject(new Error(error)),
    })
  })
}
