import { ThemeProvider } from "@/components/theme-provider"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "../assets/styles/index.css"
import Options from "./Options"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <Options />
    </ThemeProvider>
  </StrictMode>
)
