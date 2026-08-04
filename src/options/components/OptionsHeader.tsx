import { ThemeToggle } from "@/components/ThemeToggle"
import { Badge } from "@/components/ui/badge"
import {
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { APP_NAME } from "@/utils/constants"
import packageJson from "../../../package.json"

export function OptionsHeader() {
  return (
    <CardHeader className="gap-0 border-b">
      <div className="flex items-center gap-3">
        <img src="/icon.png" alt="Logo" className="size-8" />
        <div>
          <CardTitle className="flex items-center gap-1">
            {APP_NAME} <Badge variant="secondary">v{packageJson.version}</Badge>
          </CardTitle>
          <CardDescription>
            Cấu hình máy chủ & Tùy chọn hệ thống
          </CardDescription>
        </div>
      </div>
      <CardAction>
        <ThemeToggle />
      </CardAction>
    </CardHeader>
  )
}
