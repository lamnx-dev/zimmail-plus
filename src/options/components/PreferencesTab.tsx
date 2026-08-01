import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { TabsContent } from "@/components/ui/tabs"
import { Bell, RefreshCw } from "lucide-react"

interface PreferencesTabProps {
  pollingInterval: number
  setPollingInterval: (val: number) => void
  enableNotifications: boolean
  setEnableNotifications: (val: boolean) => void
  syncOnTabChange: boolean
  setSyncOnTabChange: (val: boolean) => void
  syncOnWindowFocus: boolean
  setSyncOnWindowFocus: (val: boolean) => void
}

export function PreferencesTab({
  pollingInterval,
  setPollingInterval,
  enableNotifications,
  setEnableNotifications,
  syncOnTabChange,
  setSyncOnTabChange,
  syncOnWindowFocus,
  setSyncOnWindowFocus,
}: PreferencesTabProps) {
  return (
    <TabsContent value="preferences" className="flex flex-col gap-4">
      <Item variant="outline">
        <ItemMedia variant="icon">
          <RefreshCw className="text-primary" />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Tần suất kiểm tra email</ItemTitle>
          <ItemDescription>
            Chu kỳ hệ thống tự động kiểm tra và cập nhật hòm thư ngầm
          </ItemDescription>
        </ItemContent>
        <ItemActions>
          <Select
            value={String(pollingInterval)}
            onValueChange={(val: string) =>
              setPollingInterval(parseInt(val, 10))
            }
          >
            <SelectTrigger className="w-24">
              <SelectValue placeholder="Chọn tần suất" />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectItem value="5">5 phút</SelectItem>
              <SelectItem value="15">15 phút</SelectItem>
              <SelectItem value="30">30 phút</SelectItem>
              <SelectItem value="60">1 giờ</SelectItem>
            </SelectContent>
          </Select>
        </ItemActions>
      </Item>

      <Item variant="outline">
        <ItemMedia variant="icon">
          <Bell className="text-amber-500" />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Thông báo màn hình (Windows)</ItemTitle>
          <ItemDescription>
            Gửi thông báo nổi ở góc màn hình ngay khi phát hiện có email mới
          </ItemDescription>
        </ItemContent>
        <ItemActions>
          <Switch
            checked={enableNotifications}
            onCheckedChange={setEnableNotifications}
          />
        </ItemActions>
      </Item>

      <Item variant="outline">
        <ItemContent>
          <ItemTitle>Đồng bộ khi chuyển tab</ItemTitle>
          <ItemDescription>
            Tự động làm mới dữ liệu khi chuyển sang tab làm việc Zimbra Mail
          </ItemDescription>
        </ItemContent>
        <ItemActions>
          <Switch
            checked={syncOnTabChange}
            onCheckedChange={setSyncOnTabChange}
          />
        </ItemActions>
      </Item>

      <Item variant="outline">
        <ItemContent>
          <ItemTitle>Đồng bộ khi chuyển cửa sổ</ItemTitle>
          <ItemDescription>
            Tự động làm mới dữ liệu khi quay lại cửa sổ trình duyệt chứa Zimbra
            Mail
          </ItemDescription>
        </ItemContent>
        <ItemActions>
          <Switch
            checked={syncOnWindowFocus}
            onCheckedChange={setSyncOnWindowFocus}
          />
        </ItemActions>
      </Item>
    </TabsContent>
  )
}
