#!/usr/bin/env node

import fs from "node:fs"
import path from "node:path"
import { createRequire } from "node:module"

const args = parseArgs(process.argv.slice(2))
if (!args.input || !args.output) {
  fail("Usage: render-mermaid.mjs --input <markdown-or-mmd> --output <png-or-svg> [--scale 2]")
}

const outputPath = path.resolve(args.output)
const outputType = path.extname(outputPath).toLowerCase()
if (![".png", ".svg"].includes(outputType)) fail("Output must end in .png or .svg")
const scale = Number(args.scale || 4)
if (!Number.isFinite(scale) || scale < 1 || scale > 4) fail("--scale must be between 1 and 4")

const source = fs.readFileSync(path.resolve(args.input), "utf8")
const match = source.match(/```mermaid\s*\n([\s\S]*?)```/)
const diagram = match ? match[1].trim() : source.trim()
if (!diagram) fail("No Mermaid diagram found")

const require = createRequire(import.meta.url)
let chromium
try {
  ;({ chromium } = require("playwright"))
} catch {
  fail("Playwright is unavailable. Load workspace dependencies and set NODE_PATH to their node_modules directory.")
}

const browserCandidates = [
  process.env.MERMAID_BROWSER_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
].filter(Boolean)
const executablePath = browserCandidates.find((candidate) => fs.existsSync(candidate))
const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) })
try {
  const page = await browser.newPage({ viewport: { width: 1800, height: 1400 }, deviceScaleFactor: scale })
  await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>
    html,body{margin:0;background:#fff}#mount{display:inline-block;padding:48px;min-width:1200px}
  </style></head><body><main id="mount"></main>
  <script type="module">
    import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs";
    mermaid.initialize({startOnLoad:false,securityLevel:"loose",theme:"base"});
    const code = ${JSON.stringify(diagram)};
    const {svg} = await mermaid.render("concept-map", code);
    document.querySelector("#mount").innerHTML = svg;
    window.__MERMAID_DONE__ = true;
  </script></body></html>`, { waitUntil: "networkidle" })
  await page.waitForFunction(() => window.__MERMAID_DONE__ === true, null, { timeout: 30000 })
  const error = await page.locator("body").getAttribute("data-mermaid-error")
  if (error) fail(error)
  const mount = page.locator("#mount")
  if (outputType === ".svg") {
    const svg = await mount.locator("svg").evaluate((element) => element.outerHTML)
    fs.writeFileSync(outputPath, `${svg}\n`, "utf8")
  } else {
    await mount.screenshot({ path: outputPath })
  }
  console.log(JSON.stringify({ ok: true, output: outputPath, type: outputType.slice(1), scale }))
} finally {
  await browser.close()
}

function parseArgs(argv) {
  const result = {}
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--input") result.input = argv[++i]
    else if (argv[i] === "--output") result.output = argv[++i]
    else if (argv[i] === "--scale") result.scale = argv[++i]
    else fail(`Unknown argument: ${argv[i]}`)
  }
  return result
}

function fail(message) {
  console.error(message)
  process.exit(1)
}
