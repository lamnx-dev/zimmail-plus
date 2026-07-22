import { ZimbraMessageFlag as ZimbraMessageFlagConst, ZimbraParticipantType as ZimbraParticipantTypeConst } from "../utils/constants"

/**
 * Response tổng quan từ API SOAP của Zimbra.
 */
export interface ZimbraSoapResponse {
  Header: ZimbraSoapHeader
  Body: ZimbraSoapBody
  _jsns: string
}

/**
 * Thân (Body) phản hồi SOAP từ Zimbra.
 */
export interface ZimbraSoapBody {
  GetMsgResponse?: ZimbraGetMsgResponse
  GetInfoResponse?: ZimbraGetInfoResponse
  AuthResponse?: ZimbraAuthResponse
  Fault?: ZimbraSoapFault
}

/**
 * Phản hồi xác thực (AuthResponse) từ Zimbra Server.
 */
export interface ZimbraAuthResponse {
  authToken: Array<{
    _content: string
    [key: string]: unknown
  }>
  [key: string]: unknown
}

/**
 * Phản hồi thông tin người dùng (GetInfoResponse).
 */
export interface ZimbraGetInfoResponse {
  name: string
  [key: string]: unknown
}

/**
 * Cấu trúc lỗi SOAP (SoapFault).
 */
export interface ZimbraSoapFault {
  Code: {
    Value: string
  }
  Reason: {
    Text: string
  }
  Detail: {
    Error: {
      Code: string
      Trace: string
      _jsns: string
    }
  }
}

/**
 * Phản hồi lấy danh sách/nội dung email (GetMsgResponse).
 */
export interface ZimbraGetMsgResponse {
  /** `m`: Messages - Mảng danh sách thông tin các email trả về */
  m: ZimbraMessage[]
  _jsns: string
}

/**
 * Thông tin chi tiết một Email (`ZimbraMessage`) từ Zimbra SOAP API.
 */
export interface ZimbraMessage {
  /** `s` (Size): Kích thước của email tính bằng byte */
  s: number
  /** `d` (Date): Thời gian nhận email (Unix timestamp tính bằng milisecond) */
  d: number
  /** `l` (Location / Folder ID): ID của thư mục chứa email (ví dụ: "2" là Inbox) */
  l: string
  /** `cid` (Conversation ID): ID của chuỗi hội thoại chứa email này */
  cid: string
  /**
   * `f` (Flags): Chuỗi chứa các cờ trạng thái của email. Mỗi ký tự đại diện cho 1 trạng thái:
   * - `u`: (u)nread (Chưa đọc)
   * - `f`: (f)lagged (Đã gắn cờ/đánh dấu)
   * - `a`: has (a)ttachment (Có tệp đính kèm)
   * - `r`: (r)eplied (Đã trả lời)
   * - `s`: (s)ent by me (Email do chính tôi gửi)
   * - `w`: for(w)arded (Đã chuyển tiếp)
   * - `v`: calendar in(v)ite (Lời mời lịch/cuộc họp)
   * - `d`: (d)raft (Bản nháp)
   * - `x`: IMAP-\Deleted (x) (Đã xóa)
   * - `n`: (n)otification sent (Đã gửi thông báo)
   * - `!`: urgent (Khẩn cấp)
   * - `?`: low priority (Ưu tiên thấp)
   * - `+`: priority (Ưu tiên)
   */
  f: string
  /** `rev` (Revision): Phiên bản cập nhật của thông tin email */
  rev: number
  /** `id` (ID): ID duy nhất của email trong hệ thống Zimbra */
  id: string
  /** `fr` (Fragment): Đoạn văn bản trích dẫn ngắn (preview) nội dung email */
  fr: string
  /** `e` (Email Participants): Danh sách những người tham gia email (người gửi, người nhận, CC...) */
  e: ZimbraParticipant[]
  /** `su` (Subject): Tiêu đề / Chủ đề của email */
  su: string
  /** `mid` (Message-ID): Chuỗi RFC 822 Message-ID duy nhất đại diện cho email */
  mid: string
  /** `sd` (Sent Date): Thời gian gửi email (Unix timestamp tính bằng milisecond) */
  sd: number
  /** `mp` (MIME Parts): Danh sách các phần cấu trúc nội dung MIME (Text, HTML, Đính kèm) */
  mp: ZimbraMimePart[]
}

/**
 * Thông tin đối tượng tham gia email (Người gửi, Người nhận, CC, BCC).
 */
export interface ZimbraParticipant {
  /** `a` (Address): Địa chỉ email của người tham gia */
  a: string
  /** `d` (Display Name): Tên hiển thị */
  d: string
  /** `p` (Personal Name): Tên cá nhân hiển thị (nếu có) */
  p?: string
  /** `t` (Type): Vai trò tham gia ("f" = From/Người gửi, "t" = To/Người nhận, "c" = CC, "b" = BCC) */
  t: ZimbraParticipantType
}

/**
 * Type đại diện cho các loại người tham gia email.
 */
export type ZimbraParticipantType = (typeof ZimbraParticipantTypeConst)[keyof typeof ZimbraParticipantTypeConst]

/**
 * Type đại diện cho các cờ trạng thái email.
 */
export type ZimbraMessageFlag = (typeof ZimbraMessageFlagConst)[keyof typeof ZimbraMessageFlagConst]

/**
 * Phần MIME gốc trong cấu trúc nội dung email.
 */
export interface ZimbraMimePart {
  /** `part`: Chỉ mục phần MIME (ví dụ: "1", "1.1", "2") */
  part: string
  /** `ct` (Content-Type): Loại nội dung MIME (ví dụ: "text/plain", "text/html", "multipart/alternative") */
  ct: string
  /** `mp` (MIME Parts): Danh sách các phần MIME con cấp 2 */
  mp: ZimbraMimePart2[]
}

/**
 * Phần MIME con cấp 2.
 */
export interface ZimbraMimePart2 {
  /** `part`: Chỉ mục phần MIME (ví dụ: "1.1") */
  part: string
  /** `ct` (Content-Type): Loại nội dung MIME */
  ct: string
  /** `s` (Size): Kích thước phần MIME (byte) */
  s?: number
  /** `body`: Đánh dấu `true` nếu đây là phần thân hiển thị chính */
  body?: boolean
  /** `content`: Nội dung văn bản/HTML trực tiếp của phần MIME này */
  content?: string
  /** `cd` (Content-Disposition): Cách thức xử lý nội dung (ví dụ: "attachment", "inline") */
  cd?: string
  /** `filename`: Tên tệp đính kèm (nếu có) */
  filename?: string
  /** `mp` (MIME Parts): Danh sách các phần MIME con cấp 3 */
  mp?: ZimbraMimePart3[]
}

/**
 * Phần MIME con cấp 3.
 */
export interface ZimbraMimePart3 {
  /** `part`: Chỉ mục phần MIME */
  part: string
  /** `ct` (Content-Type): Loại nội dung MIME */
  ct: string
  /** `s` (Size): Kích thước phần MIME (byte) */
  s?: number
  /** `body`: Đánh dấu `true` nếu đây là phần thân hiển thị chính */
  body?: boolean
  /** `content`: Nội dung văn bản/HTML */
  content?: string
  /** `mp` (MIME Parts): Danh sách các phần MIME con cấp 4 */
  mp?: ZimbraMimePart4[]
  /** `filename`: Tên tệp đính kèm */
  filename?: string
  /** `ci` (Content-ID): ID của hình ảnh/nội dung nhúng trực tiếp (inline image `cid:...`) */
  ci?: string
}

/**
 * Phần MIME con cấp 4.
 */
export interface ZimbraMimePart4 {
  /** `part`: Chỉ mục phần MIME */
  part: string
  /** `ct` (Content-Type): Loại nội dung MIME */
  ct: string
  /** `s` (Size): Kích thước phần MIME (byte) */
  s: number
  /** `body`: Đánh dấu `true` nếu đây là phần thân hiển thị chính */
  body?: boolean
  /** `content`: Nội dung văn bản/HTML */
  content?: string
}

/**
 * Header của request/response SOAP Zimbra.
 */
export interface ZimbraSoapHeader {
  context: ZimbraSoapContext
}

/**
 * Context trong Header SOAP.
 */
export interface ZimbraSoapContext {
  change?: ZimbraSoapChange
  _jsns: string
}

/**
 * Thông tin token thay đổi/đồng bộ.
 */
export interface ZimbraSoapChange {
  token: number
}
