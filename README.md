# Teca Mail Plus - Chrome Extension

Extension tự động đồng bộ và hiển thị thông báo email chưa đọc từ Zimbra Mail Server (`https://mail.teca.vn`).

## Tính năng chính

- **Đồng bộ định kỳ**: Tự động kiểm tra email mới theo chu kỳ được thiết lập.
- **Thông báo**: Hiển thị thông báo hệ thống khi phát hiện email mới.
- **Popup hiển thị nhanh**:
  - Xem danh sách và nội dung chi tiết email (render văn bản/HTML qua Shadow DOM).
  - Đọc và tải file đính kèm.
  - Đánh dấu đã đọc hoặc chưa đọc nhanh.
- **Trang cấu hình**: Tùy chỉnh chu kỳ quét (polling interval), âm thanh, và các tùy chọn thông báo.

## Tech Stack

- React 19 + TypeScript + Vite + Tailwind CSS
- Chrome Extension Manifest v3

## Hướng dẫn cài đặt

### Cách 1: Cài đặt nhanh (Release)
1. Tải và giải nén file `teca-mail-plus-vX.Y.Z.zip` từ mục [Releases](https://github.com/lamnxdev/teca-mail-plus/releases).
2. Mở [chrome://extensions/](chrome://extensions/) và bật **Developer mode** (góc trên bên phải).
3. Chọn **Load unpacked** (Tải thư mục đã giải nén) và chọn thư mục vừa giải nén.

### Cách 2: Tự build từ mã nguồn (Developer)
```bash
git clone https://github.com/lamnxdev/teca-mail-plus.git
cd teca-mail-plus
pnpm install
pnpm build
```
Sau khi build, vào [chrome://extensions/](chrome://extensions/), bật **Developer mode**, chọn **Load unpacked** và trỏ đến thư mục `/dist`.
