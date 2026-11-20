import { useEffect, useMemo, useState } from "react"
import {
  Check,
  Copy,
  Download,
  Image as ImageIcon,
  ImageDown,
  Moon,
  ExternalLink,
  Sun,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { buildLogoMarkup, DEFAULT_OPTIONS, logoDimensions } from "@/lib/logo"

const MAX_TEXT_LENGTH = 24

function textFromHash() {
  const hash = window.location.hash.slice(1)
  if (!hash) return DEFAULT_OPTIONS.text

  try {
    return decodeURIComponent(hash).slice(0, MAX_TEXT_LENGTH)
  } catch {
    return hash.slice(0, MAX_TEXT_LENGTH)
  }
}

function linkForText(text: string) {
  const url = new URL(window.location.href)
  url.hash = encodeURIComponent(text)
  return url.toString()
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function renderPng(markup: string, width: number, height: number) {
  const { promise, resolve, reject } = Promise.withResolvers<Blob>()
  const url = URL.createObjectURL(new Blob([markup], { type: "image/svg+xml;charset=utf-8" }))
  const image = new Image()

  image.onload = () => {
    const scale = 2
    const canvas = document.createElement("canvas")
    canvas.width = width * scale
    canvas.height = height * scale
    const context = canvas.getContext("2d")
    if (!context) {
      URL.revokeObjectURL(url)
      reject(new Error("Canvas unavailable"))
      return
    }

    context.scale(scale, scale)
    context.drawImage(image, 0, 0, width, height)
    canvas.toBlob((blob) => {
      URL.revokeObjectURL(url)
      if (blob) resolve(blob)
      else reject(new Error("PNG encoding failed"))
    }, "image/png")
  }

  image.onerror = () => {
    URL.revokeObjectURL(url)
    reject(new Error("SVG render failed"))
  }
  image.src = url
  return promise
}

function App() {
  const [text, setText] = useState(textFromHash)
  const [copied, setCopied] = useState<"png" | "svg" | "link" | null>(null)
  const [dark, setDark] = useState(() => {
    try {
      return localStorage.getItem("phplogo-theme") === "dark"
    } catch {
      return false
    }
  })
  const [fontReady, setFontReady] = useState(false)

  const svg = useMemo(() => {
    void fontReady
    return buildLogoMarkup({ text })
  }, [text, fontReady])
  const { width, height } = useMemo(() => logoDimensions(text), [text])
  const filename = (text.trim() || "php").toLowerCase().replace(/[^a-z0-9]+/g, "-")

  useEffect(() => {
    const syncTextFromHash = () => setText(textFromHash())
    window.addEventListener("hashchange", syncTextFromHash)
    return () => window.removeEventListener("hashchange", syncTextFromHash)
  }, [])
  useEffect(() => {
    document.fonts
      .load("italic 400 100px Newtown", "php")
      .then(() => setFontReady(true))
      .catch(() => setFontReady(true))
  }, [])
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark)
    try {
      localStorage.setItem("phplogo-theme", dark ? "dark" : "light")
    } catch {
      // Storage is optional; the switch still works for this session.
    }
  }, [dark])

  useEffect(() => {
    if (!copied) return
    const timer = window.setTimeout(() => setCopied(null), 1800)
    return () => window.clearTimeout(timer)
  }, [copied])

  function downloadSvg() {
    downloadBlob(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }), `${filename}-logo.svg`)
  }

  async function downloadPng() {
    downloadBlob(await renderPng(svg, width, height), `${filename}-logo.png`)
  }

  async function copySvg() {
    await navigator.clipboard.writeText(svg)
    setCopied("svg")
  }

  async function copyPng() {
    const blob = await renderPng(svg, width, height)
    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })])
    setCopied("png")
  }

  async function copyLink() {
    await navigator.clipboard.writeText(linkForText(text))
    setCopied("link")
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-[#fafaf9] p-5 sm:p-8 dark:bg-neutral-950">
      <h1 className="sr-only">PHP logo</h1>

      <Button
        variant="ghost"
        size="icon-sm"
        className="absolute right-5 top-5"
        onClick={() => setDark((current) => !current)}
        aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      >
        {dark ? <Sun /> : <Moon />}
      </Button>

      <Card className="w-full max-w-4xl gap-0 py-0 shadow-sm">
        <CardContent className="p-0">
          <div className="rounded-t-xl bg-white p-6 dark:bg-neutral-900 sm:p-10">
            <div
              className="[&>svg]:h-auto [&>svg]:w-full"
              dangerouslySetInnerHTML={{ __html: svg }}
            />
          </div>
        </CardContent>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-b-xl bg-muted/30 px-4 py-4">
          <Input
            aria-label="Wordmark"
            value={text}
            maxLength={MAX_TEXT_LENGTH}
            placeholder="php"
            onChange={(event) => setText(event.target.value)}
            className="h-9 w-44 text-center text-sm font-semibold text-foreground"
          />

          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={copyPng}>
              {copied === "png" ? <Check /> : <ImageIcon />}
              {copied === "png" ? "Copied PNG" : "Copy PNG"}
            </Button>
            <Button size="sm" variant="outline" onClick={copySvg}>
              {copied === "svg" ? <Check /> : <Copy />}
              {copied === "svg" ? "Copied SVG" : "Copy SVG"}
            </Button>
            <Button size="sm" variant="outline" onClick={downloadPng}>
              <ImageDown />
              Download PNG
            </Button>
            <Button size="sm" variant="outline" onClick={downloadSvg}>
              <Download />
              Download SVG
            </Button>
            <Button size="sm" variant="outline" onClick={copyLink}>
              {copied === "link" ? <Check /> : <ExternalLink />}
              {copied === "link" ? "Copied link" : "Share"}
            </Button>
          </div>
        </div>
      </Card>
    </main>
  )
}

export default App
