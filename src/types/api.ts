export interface ZimbraSoapResponse {
  Header: ZimbraSoapHeader
  Body: ZimbraSoapBody
  _jsns: string
}

export interface ZimbraSoapBody {
  GetMsgResponse: ZimbraGetMsgResponse
}

export interface ZimbraGetMsgResponse {
  m: ZimbraMessage[]
  _jsns: string
}

export interface ZimbraMessage {
  s: number
  d: number
  l: string
  cid: string
  f: string
  rev: number
  id: string
  fr: string
  e: ZimbraParticipant[]
  su: string
  mid: string
  sd: number
  mp: ZimbraMimePart[]
}

export interface ZimbraParticipant {
  a: string
  d: string
  p?: string
  t: ZimbraParticipantType
}

export type ZimbraParticipantType = "c" | "f" | "t"

export const ZimbraParticipantType = {
  C: "c",
  F: "f",
  T: "t",
} as const
export interface ZimbraMimePart {
  part: string
  ct: string
  mp: ZimbraMimePart2[]
}

export interface ZimbraMimePart2 {
  part: string
  ct: string
  s?: number
  body?: boolean
  content?: string
  cd?: string
  filename?: string
  mp?: ZimbraMimePart3[]
}

export interface ZimbraMimePart3 {
  part: string
  ct: string
  s?: number
  body?: boolean
  content?: string
  mp?: ZimbraMimePart4[]
  filename?: string
  ci?: string
}

export interface ZimbraMimePart4 {
  part: string
  ct: string
  s: number
  body?: boolean
  content?: string
}

export interface ZimbraSoapHeader {
  context: ZimbraSoapContext
}

export interface ZimbraSoapContext {
  change: ZimbraSoapChange
  _jsns: string
}

export interface ZimbraSoapChange {
  token: number
}
