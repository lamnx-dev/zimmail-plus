import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Kbd } from "@/components/ui/kbd"

interface ShortcutHelpModalProps {
  isOpen: boolean
  onClose: () => void
}

interface ShortcutItem {
  keys: (string | string[])[]
  description: string
}

interface ShortcutGroup {
  category: string
  items: ShortcutItem[]
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    category: "Điều hướng & Xem thư",
    items: [
      { keys: ["↓"], description: "Chọn / Chuyển sang email tiếp theo" },
      { keys: ["↑"], description: "Chọn / Chuyển về email trước đó" },
      { keys: ["Enter", "→"], description: "Mở email đang chọn" },
      { keys: ["←"], description: "Quay lại danh sách email" },
    ],
  },
  {
    category: "Thao tác email",
    items: [
      { keys: ["M"], description: "Đánh dấu đã đọc / chưa đọc" },
      { keys: ["F"], description: "Gắn cờ / Bỏ gắn cờ" },
      { keys: [["Shift", "A"]], description: "Đánh dấu tất cả là đã đọc" },
      { keys: ["R"], description: "Làm mới danh sách" },
    ],
  },
  {
    category: "Tìm kiếm & Lọc",
    items: [
      { keys: ["/"], description: "Mở ô tìm kiếm" },
      { keys: ["1"], description: "Lọc tất cả" },
      { keys: ["2"], description: "Lọc email chưa đọc" },
      { keys: ["3"], description: "Lọc email đã gắn cờ" },
      { keys: ["4"], description: "Lọc email có tệp đính kèm" },
    ],
  },
  {
    category: "Mở Webmail & Hệ thống",
    items: [
      { keys: ["O"], description: "Mở Web Mail Zimbra Inbox" },
      {
        keys: [["Shift", "O"]],
        description: "Mở email đang chọn trên Web Mail Zimbra",
      },
      { keys: [["Shift", "S"]], description: "Mở trang Cài đặt (Options)" },
      {
        keys: [["Ctrl", "Shift", "Z"]],
        description: "Mở Extension Popup (Toàn cục)",
      },
      { keys: ["?"], description: "Mở / Đóng danh sách phím tắt" },
    ],
  },
]

export default function ShortcutHelpModal({
  isOpen,
  onClose,
}: ShortcutHelpModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Danh sách Phím tắt</DialogTitle>
        </DialogHeader>

        <div className="-mx-4 no-scrollbar max-h-96 space-y-3.5 overflow-y-auto px-4">
          {SHORTCUT_GROUPS.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-1.5">
              <h4 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                {group.category}
              </h4>
              <div className="space-y-1 rounded-xl border p-2">
                {group.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-2 px-1 py-1"
                  >
                    <span className="text-xs text-foreground">
                      {item.description}
                    </span>
                    <div className="flex flex-wrap items-center justify-end gap-1.5">
                      {item.keys.map((keyChoice, choiceIdx) => {
                        const isCombo = Array.isArray(keyChoice)
                        const comboKeys = isCombo ? keyChoice : [keyChoice]

                        return (
                          <div
                            key={choiceIdx}
                            className="flex items-center gap-1"
                          >
                            {choiceIdx > 0 && (
                              <span className="text-[10px] text-muted-foreground">
                                hoặc
                              </span>
                            )}
                            <div className="flex items-center gap-0.5">
                              {comboKeys.map((k, kIdx) => (
                                <Kbd key={kIdx}>{k}</Kbd>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
