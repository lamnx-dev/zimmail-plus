import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { Laptop, Moon, Sun } from "lucide-react"

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme()

  return (
    <div
      className={cn(
        "flex items-center gap-0.5 rounded-md border bg-muted/80",
        className
      )}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setTheme("light")}
            className={cn(
              "text-muted-foreground",
              theme === "light" && "bg-background text-amber-500! shadow-xs"
            )}
          >
            <Sun />
            <span className="sr-only">Giao diện sáng</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          Giao diện sáng
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setTheme("dark")}
            className={cn(
              "text-muted-foreground",
              theme === "dark" && "bg-background text-indigo-500! shadow-xs"
            )}
          >
            <Moon />
            <span className="sr-only">Giao diện tối</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          Giao diện tối
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setTheme("system")}
            className={cn(
              "text-muted-foreground",
              theme === "system" && "bg-background text-sky-500! shadow-xs"
            )}
          >
            <Laptop />
            <span className="sr-only">Theo hệ thống</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          Theo hệ thống
        </TooltipContent>
      </Tooltip>
    </div>
  )
}
