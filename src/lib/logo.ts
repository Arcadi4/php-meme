// Official PHP logo, public-domain artwork from Wikimedia Commons.
import newtownItalicFont from "@/assets/fonts/NEWTOWN-ITALIC.woff2?inline"
import officialMarkup from "@/assets/php-official.svg?raw"

export const BASE_LOGO_WIDTH = 711.20123
export const BASE_LOGO_HEIGHT = 383.5975

export type LogoOptions = {
  text: string
}

export const DEFAULT_OPTIONS: LogoOptions = {
  text: "php",
}

const FONT_STACK = "Newtown, Arial, sans-serif"
const FONT_FACE = `<style>@font-face{font-family:'Newtown';src:url('${newtownItalicFont}') format('woff2');font-weight:400;font-style:italic}</style>`
const GLYPH_HEIGHT_RATIO = 311 / 518
const SIDE_MARGIN = BASE_LOGO_WIDTH * (161 / 960)
const OUTLINE_WIDTH = 14.5
const TEXT_CENTER_OFFSET = -10
const DESCENDER_THRESHOLD = 8
const OUTER_CX = 355.600625
const OUTER_CY = 191.79875
const OUTER_RX = 345.600625
const OUTER_RY = 181.79875
const RIM_OFFSET = (OUTER_RX - 332.1 + (OUTER_RY - 168.30125)) / 2
const GRAD_SCALE = 453.822362
const GRAD_TX = 217.500025
const GRAD_TY = 73.914838
const XML_ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&apos;",
}

function escapeXml(value: string) {
  return value.replace(/[&<>"']/g, (char) => XML_ENTITIES[char])
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

type TextMetrics = {
  width: number
  ascent: number
  descent: number
  inkLeft: number
  inkRight: number
}

function measureAt100px(text: string): TextMetrics {
  const fallback = {
    width: Math.max(100, text.length * 78),
    ascent: 72,
    descent: 20,
    inkLeft: 0,
    inkRight: Math.max(100, text.length * 78),
  }
  if (typeof document === "undefined") return fallback

  const context = document.createElement("canvas").getContext("2d")
  if (!context) return fallback

  context.font = `italic 400 100px ${FONT_STACK}`
  context.fontKerning = "none"
  context.letterSpacing = "0px"
  const metrics = context.measureText(text)
  return {
    width: Math.max(1, metrics.width),
    ascent: Number.isFinite(metrics.actualBoundingBoxAscent)
      ? metrics.actualBoundingBoxAscent
      : fallback.ascent,
    descent: Number.isFinite(metrics.actualBoundingBoxDescent)
      ? metrics.actualBoundingBoxDescent
      : fallback.descent,
    inkLeft: Number.isFinite(metrics.actualBoundingBoxLeft)
      ? -metrics.actualBoundingBoxLeft
      : fallback.inkLeft,
    inkRight: Number.isFinite(metrics.actualBoundingBoxRight)
      ? metrics.actualBoundingBoxRight
      : fallback.inkRight,
  }
}

type Layout = {
  width: number
  height: number
  fontSize: number
  baseline: number
}

function computeLayout(text: string): Layout {
  const metrics = measureAt100px(text)
  const reference = measureAt100px(DEFAULT_OPTIONS.text)
  const height = BASE_LOGO_HEIGHT
  const fontSize = clamp(
    (height * GLYPH_HEIGHT_RATIO * 100) / (reference.ascent + reference.descent),
    40,
    400,
  )
  const scale = fontSize / 100
  const advanceWidth = Array.from(text).reduce(
    (total, character) => total + measureAt100px(character).width * scale,
    0,
  )
  const width = clamp(Math.round(advanceWidth + 2 * SIDE_MARGIN), BASE_LOGO_WIDTH, 8000)
  const centerShift = metrics.descent > DESCENDER_THRESHOLD ? TEXT_CENTER_OFFSET : 0
  const baseline = height / 2 + centerShift + ((metrics.ascent - metrics.descent) * scale) / 2

  return { width, height, fontSize, baseline }
}

export function logoDimensions(text: string) {
  const { width, height } = computeLayout(text)
  return { width, height }
}

function buildEditableWordmark(text: string, layout: Layout) {
  const scale = layout.fontSize / 100
  const glyphs = Array.from(text).map((character) => ({
    character,
    metrics: measureAt100px(character),
  }))
  const advances = glyphs.map(({ metrics }) => metrics.width * scale)
  const totalAdvance = advances.reduce((total, advance) => total + advance, 0)
  let cursor = (layout.width - totalAdvance) / 2

  const spans = glyphs.map(({ character }, index) => {
    const x = cursor
    cursor += advances[index]
    return `<tspan x="${x.toFixed(2)}" y="${layout.baseline.toFixed(2)}">${escapeXml(character)}</tspan>`
  })

  return `<text x="0" y="0" font-family="${FONT_STACK}" font-style="italic" font-weight="400" font-kerning="none" letter-spacing="0" font-size="${layout.fontSize.toFixed(1)}" fill="#000000" stroke="#ffffff" stroke-width="${OUTLINE_WIDTH}" stroke-linejoin="round" stroke-linecap="round" paint-order="stroke">${spans.join("")}</text>`
}

function buildOfficialMarkup(wordmark: string) {
  return officialMarkup
    .replace(/<\?xml[^>]*\?>\s*/, "")
    .replace(/<title[^>]*>[^<]*<\/title>/, `<title>${escapeXml(wordmark)} logo</title>`)
    .replace("<svg ", `<svg role="img" aria-label="${escapeXml(wordmark)} logo" `)
}

function buildInnerBadgePath(cx: number, cy: number, radiusX: number, radiusY: number) {
  const points: string[] = []
  const segments = 3600
  for (let index = 0; index < segments; index += 1) {
    const angle = (index / segments) * Math.PI * 2
    const cosine = Math.cos(angle)
    const sine = Math.sin(angle)
    const normalX = radiusY * cosine
    const normalY = radiusX * sine
    const normalLength = Math.hypot(normalX, normalY)
    points.push(
      `${(cx + radiusX * cosine - (RIM_OFFSET * normalX) / normalLength).toFixed(3)},${(cy + radiusY * sine - (RIM_OFFSET * normalY) / normalLength).toFixed(3)}`,
    )
  }
  return `M ${points.join(" L ")} Z`
}
function buildStretchedMarkup(wordmark: string, layout: Layout) {
  const stretch = layout.width / BASE_LOGO_WIDTH
  const gradientTransform = `matrix(${(GRAD_SCALE * stretch).toFixed(6)},0,0,${GRAD_SCALE.toFixed(6)},${(GRAD_TX * stretch).toFixed(6)},${GRAD_TY.toFixed(6)})`

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${layout.width}" height="${layout.height}" viewBox="0 0 ${layout.width} ${layout.height}" role="img" aria-label="${escapeXml(wordmark)} logo">
  <title>${escapeXml(wordmark)} logo</title>
  ${FONT_FACE}
  <defs>
    <radialGradient id="rim" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="${gradientTransform}">
      <stop offset="0" stop-color="#aeb2d5"/>
      <stop offset="0.3" stop-color="#aeb2d5"/>
      <stop offset="0.75" stop-color="#484c89"/>
      <stop offset="1" stop-color="#484c89"/>
    </radialGradient>
  </defs>
  <ellipse cx="${(OUTER_CX * stretch).toFixed(6)}" cy="${OUTER_CY.toFixed(6)}" rx="${(OUTER_RX * stretch).toFixed(6)}" ry="${OUTER_RY.toFixed(6)}" fill="url(#rim)"/>
  <path d="${buildInnerBadgePath(OUTER_CX * stretch, OUTER_CY, OUTER_RX * stretch, OUTER_RY)}" fill="#777bb3"/>
  ${buildEditableWordmark(wordmark, layout)}
</svg>`
}

export function buildLogoMarkup(options: LogoOptions) {
  const wordmark = options.text.trim() || "php"
  if (wordmark.toLowerCase() === "php") return buildOfficialMarkup(wordmark)
  return buildStretchedMarkup(wordmark, computeLayout(wordmark))
}

export const phpLogoSvg = buildLogoMarkup(DEFAULT_OPTIONS)
