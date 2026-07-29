import { ThemeProvider } from "@/components/theme-provider"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "../assets/styles/index.css"
import Popup from "./Popup"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <Popup />
    </ThemeProvider>
  </StrictMode>
)
