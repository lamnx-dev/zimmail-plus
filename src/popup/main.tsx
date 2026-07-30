import { ThemeProvider } from "@/components/theme-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "../assets/styles/index.css"
import Popup from "./Popup"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <TooltipProvider>
        <Popup />
      </TooltipProvider>
    </ThemeProvider>
  </StrictMode>
)
