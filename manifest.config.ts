import { defineManifest } from "@crxjs/vite-plugin"
import pkg from "./package.json"

export default defineManifest({
  manifest_version: 3,
  name: "Teca Mail Plus",
  version: pkg.version,
  description: pkg.description,
  icons: {
    48: "icon.png",
  },
  action: {
    default_popup: "src/popup/index.html",
  },
  permissions: ["storage", "alarms", "notifications", "cookies", "tabs"],
  host_permissions: ["https://mail.teca.vn/*"],
  options_ui: {
    page: "src/options/index.html",
    open_in_tab: true,
  },
  background: {
    service_worker: "src/background/index.ts",
    type: "module",
  },
})
