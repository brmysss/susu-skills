#!/usr/bin/env node

import fs from "node:fs"
import path from "node:path"

const args = parseArgs(process.argv.slice(2))
if (!args.input || !args.output) {
  fail("Usage: render-mermaid-kroki.mjs --input <markdown-or-mmd> --output <svg-or-png> --allow-remote")
}
if (!args.allowRemote) {
  fail("Remote rendering sends Mermaid code to kroki.io. Re-run with --allow-remote only for public or non-sensitive content.")
}

const outputPath = path.resolve(args.output)
const outputType = path.extname(outputPath).toLowerCase()
if (![".svg", ".png"].includes(outputType)) fail("Output must end in .svg or .png")

const source = fs.readFileSync(path.resolve(args.input), "utf8")
const match = source.match(/```mermaid\s*\n([\s\S]*?)```/)
const diagram = match ? match[1].trim() : source.trim()
if (!diagram) fail("No Mermaid diagram found")

const format = outputType.slice(1)
const endpoint = `https://kroki.io/mermaid/${format}`
let response
let lastError
for (let attempt = 1; attempt <= 3; attempt += 1) {
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "text/plain; charset=utf-8" },
      body: diagram,
      signal: AbortSignal.timeout(60000),
    })
    if (response.ok) break
    lastError = new Error(`Kroki returned HTTP ${response.status}: ${await response.text()}`)
  } catch (error) {
    lastError = error
  }
}
if (!response?.ok) fail(lastError?.message || "Kroki rendering failed")

fs.mkdirSync(path.dirname(outputPath), { recursive: true })
if (outputType === ".svg") {
  let svg = await response.text()
  if (!/^<svg\b/.test(svg)) fail("Kroki did not return SVG")
  if (!args.transparent) {
    svg = svg.replace(/^(<svg\b[^>]*>)/, '$1<rect width="100%" height="100%" fill="#ffffff"/>')
  }
  fs.writeFileSync(outputPath, `${svg}\n`, "utf8")
} else {
  const data = Buffer.from(await response.arrayBuffer())
  if (data.length < 8 || data.subarray(1, 4).toString("ascii") !== "PNG") {
    fail("Kroki did not return PNG")
  }
  fs.writeFileSync(outputPath, data)
}

console.log(JSON.stringify({
  ok: true,
  output: outputPath,
  format,
  renderer: "kroki-post",
  background: outputType === ".svg" && !args.transparent ? "white" : "service-default",
}))

function parseArgs(argv) {
  const result = { allowRemote: false, transparent: false }
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--input") result.input = argv[++i]
    else if (argv[i] === "--output") result.output = argv[++i]
    else if (argv[i] === "--allow-remote") result.allowRemote = true
    else if (argv[i] === "--transparent") result.transparent = true
    else fail(`Unknown argument: ${argv[i]}`)
  }
  return result
}

function fail(message) {
  console.error(message)
  process.exit(1)
}
