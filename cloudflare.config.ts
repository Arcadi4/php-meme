import { defineConfig } from "cf/config"

export default defineConfig({
  accountId: "f4e323f273bab9cb104cbe7b945c58d3",
  worker: {
    name: "php-meme",
    compatibilityDate: "2026-11-20",
    domains: ["php.arcadia.moe"],
  },
})
