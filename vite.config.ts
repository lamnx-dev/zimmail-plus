import { crx } from "@crxjs/vite-plugin"
import babel from "@rolldown/plugin-babel"
import tailwindcss from "@tailwindcss/vite"
import react, { reactCompilerPreset } from "@vitejs/plugin-react"
import path from "path"
import { defineConfig } from "vite"
import zip from "vite-plugin-zip-pack"
import manifest from "./manifest.config.ts"
import { name, version } from "./package.json" with { type: "json" }

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
    crx({ manifest }),
    zip({ outDir: "release", outFileName: `${name}-v${version}.zip` }),
  ],
  server: {
    cors: {
      origin: [/chrome-extension:\/\//],
    },
  },
})
