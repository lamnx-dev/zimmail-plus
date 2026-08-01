# ZimMail Plus

Extension tự động đồng bộ và hiển thị thông báo email chưa đọc từ bất kỳ Zimbra Mail Server nào do người dùng cấu hình.

---

## Tính năng chính

- **Cấu hình tùy biến Server**: Nhập Zimbra Mail Server URL của bạn (ví dụ: `https://mail.company.com`).
- **Đồng bộ định kỳ & thông minh**: Kiểm tra email theo chu kỳ; tự động đồng bộ khi chuyển tab hoặc focus cửa sổ.
- **Thông báo**: Hiển thị thông báo hệ thống khi có email mới.
- **Tự động đăng nhập**: Lưu cục bộ thông tin tài khoản để tự động kết nối và làm mới phiên làm việc.
- **Popup xem nhanh**: Xem danh sách, tìm kiếm/lọc email và tải file đính kèm trực tiếp.
- **Trang cấu hình**: Tùy chỉnh server URL, chu kỳ quét, bật/tắt thông báo, đồng bộ tab/cửa sổ và cấu hình tài khoản.

---

## Tech Stack

- React 19, TypeScript, Tailwind CSS v4, Shadcn UI
- Vite 8 + crxjs, Manifest V3

---

## Hướng dẫn cài đặt

### Cách 1: Cài đặt từ bản build sẵn (Release)

1. Tải và giải nén file `zimmail-plus-vX.Y.Z.zip` từ mục [Releases](https://github.com/lamnx-dev/zimmail-plus/releases).
2. Mở [chrome://extensions/](chrome://extensions/), bật **Developer mode**.
3. Chọn **Load unpacked** và chọn thư mục vừa giải nén.

### Cách 2: Tự build từ mã nguồn (Developer)

Yêu cầu cài đặt Node.js và pnpm.

```bash
git clone https://github.com/lamnx-dev/zimmail-plus.git
cd zimmail-plus
pnpm install
pnpm build
```

Sau khi build, vào [chrome://extensions/](chrome://extensions/), bật **Developer mode**, chọn **Load unpacked** và trỏ đến thư mục `/dist`.

---

## Bảo mật

Thông tin tài khoản được lưu trữ cục bộ trên máy cá nhân qua API `chrome.storage.local`. Extension chỉ kết nối trực tiếp đến máy chủ Zimbra Mail đã cấu hình, không qua máy chủ trung gian.
