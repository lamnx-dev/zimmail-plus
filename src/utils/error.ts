import { isAxiosError } from "axios"
import Groq from "groq-sdk"
import type { ZimbraSoapFault } from "../types/api"

export function isZimbraError(
  error: unknown
): error is { Body: { Fault: ZimbraSoapFault } } {
  if (error && typeof error === "object" && "Body" in error) {
    const body = error.Body
    if (body && typeof body === "object" && "Fault" in body) {
      const fault = body.Fault
      return !!fault && typeof fault === "object"
    }
  }
  return false
}

export function getErrorMessage(error: unknown): string {
  if (isZimbraError(error)) {
    return error.Body.Fault.Reason?.Text || "Zimbra error"
  }

  if (error instanceof Groq.APIError) {
    return error?.error?.error?.message || "Groq API error"
  }

  if (isAxiosError(error) && error.response?.data) {
    let data = error.response.data

    if (data instanceof ArrayBuffer) {
      try {
        const text = new TextDecoder().decode(data)
        data = JSON.parse(text)
      } catch {
        // không phải JSON string
      }
    }

    if (isZimbraError(data)) {
      return getErrorMessage(data)
    }
    if (
      data &&
      typeof data === "object" &&
      "message" in data &&
      typeof data.message === "string"
    ) {
      return data.message
    }
  }

  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === "string") {
    return error
  }

  return "Unknown error"
}
