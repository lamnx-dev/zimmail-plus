import { Keyboard, X } from "lucide-react"

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
      { keys: ["↓"], description: "Chọn email tiếp theo" },
      { keys: ["↑"], description: "Chọn email trước đó" },
      { keys: ["Enter", "→"], description: "Mở email đang chọn" },
      { keys: ["←"], description: "Quay lại danh sách email" },
    ],
  },
  {
    category: "Thao tác email",
    items: [
      { keys: ["m"], description: "Đánh dấu đã đọc / chưa đọc" },
      { keys: ["f"], description: "Gắn cờ / Bỏ gắn cờ" },
      { keys: [["Shift", "a"]], description: "Đánh dấu tất cả là đã đọc" },
      { keys: ["r"], description: "Làm mới danh sách" },
    ],
  },
  {
    category: "Tìm kiếm & Lọc",
    items: [
      { keys: ["/"], description: "Mở / đóng ô tìm kiếm" },
      { keys: ["1"], description: "Lọc tất cả" },
      { keys: ["2"], description: "Lọc email chưa đọc" },
      { keys: ["3"], description: "Lọc email đã gắn cờ" },
      { keys: ["4"], description: "Lọc email có tệp đính kèm" },
    ],
  },
  {
    category: "Mở Webmail & Hệ thống",
    items: [
      { keys: ["o"], description: "Mở Web Mail Zimbra Inbox" },
      { keys: [["Shift", "o"]], description: "Mở email đang chọn trên Web Mail Zimbra" },
      { keys: [["Shift", "s"]], description: "Mở trang Cài đặt (Options)" },
      { keys: [["Ctrl", "Shift", "z"]], description: "Mở Extension Popup (Toàn cục)" },
      { keys: ["?"], description: "Mở / đóng danh sách phím tắt" },
    ],
  },
]

export default function ShortcutHelpModal({ isOpen, onClose }: ShortcutHelpModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs duration-150">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Keyboard className="h-4 w-4" />
            </div>
            <h3 className="text-xs font-semibold text-slate-800">Danh sách Phím tắt</h3>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-slate-400 transition-colors outline-none hover:bg-slate-200/60 hover:text-slate-600 focus-visible:ring-3 focus-visible:ring-blue-600/20"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* List of shortcuts grouped by category */}
        <div className="max-h-96 scrollbar-thin space-y-3.5 overflow-y-auto p-4 outline-none">
          {SHORTCUT_GROUPS.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-1.5">
              <h4 className="text-xs font-semibold tracking-wider text-slate-400 uppercase">{group.category}</h4>
              <div className="space-y-1 rounded-xl border border-slate-200/80 bg-slate-50 p-2">
                {group.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-2 px-1 py-1">
                    <span className="text-xs text-slate-700">{item.description}</span>
                    <div className="flex flex-wrap items-center justify-end gap-1.5">
                      {item.keys.map((keyChoice, choiceIdx) => {
                        const isCombo = Array.isArray(keyChoice)
                        const comboKeys = isCombo ? keyChoice : [keyChoice]

                        return (
                          <div key={choiceIdx} className="flex items-center gap-1">
                            {choiceIdx > 0 && <span className="text-[10px] text-slate-400">hoặc</span>}
                            <div className="flex items-center gap-0.5">
                              {comboKeys.map((k, kIdx) => (
                                <kbd
                                  key={kIdx}
                                  className="inline-flex min-w-5 items-center justify-center rounded border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-xs font-semibold text-slate-700 shadow-2xs"
                                >
                                  {k}
                                </kbd>
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

        {/* Footer */}
        <div className="h-2"></div>
      </div>
    </div>
  )
}
