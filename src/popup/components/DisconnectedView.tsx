import { ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { openZimbraInbox } from "../../utils/navigation"
import EmptyState from "./EmptyState"

export default function DisconnectedView() {
  return (
    <EmptyState
      icon={<ShieldAlert className="size-6" />}
      iconClassName="bg-destructive/10 text-destructive"
      title="Mất kết nối"
      description="Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn."
      action={
        <Button onClick={openZimbraInbox} className="mt-2">
          Đăng nhập
        </Button>
      }
    />
  )
}
