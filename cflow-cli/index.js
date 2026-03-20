#!/usr/bin/env node

const http = require("http");
const https = require("https");
const url = require("url");

// Configuration
const CFLOW_URL = process.env.CFLOW_URL || "http://localhost:5230";
const CFLOW_TOKEN = process.env.CFLOW_TOKEN || "";
const CFLOW_CREATOR_ID = process.env.CFLOW_CREATOR_ID || "1";

// ── HTTP helper ──────────────────────────────────────────────

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(path, CFLOW_URL);
    const isHttps = parsed.protocol === "https:";
    const lib = isHttps ? https : http;

    // Add creatorId for GET requests when no token (fallback auth)
    if (method === "GET" && !CFLOW_TOKEN && !parsed.searchParams.has("creatorId")) {
      parsed.searchParams.set("creatorId", CFLOW_CREATOR_ID);
    }

    const headers = { "Content-Type": "application/json" };
    if (CFLOW_TOKEN) headers["Authorization"] = `Bearer ${CFLOW_TOKEN}`;

    const fullPath = parsed.pathname + (parsed.search || "");
    const options = {
      hostname: parsed.hostname,
      port: parsed.port || (isHttps ? 443 : 80),
      path: fullPath,
      method,
      headers,
      timeout: 30000,
    };

    const req = lib.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    req.on("error", reject);
    req.on("timeout", () => { req.destroy(); reject(new Error("Request timeout")); });
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// ── Output formatters ────────────────────────────────────────

function formatJson(data) {
  console.log(JSON.stringify(data, null, 2));
}

function formatTable(memos) {
  if (!Array.isArray(memos) || memos.length === 0) {
    console.log("No results found.");
    return;
  }
  // Header
  console.log("| # | ID | Time | Tags | Content (preview) |");
  console.log("|---|-----|------|------|-------------------|");
  memos.forEach((m, i) => {
    const id = m.id || m.name?.split("/").pop() || "?";
    const time = m.createdTs
      ? new Date(m.createdTs * 1000).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })
      : m.createTime
        ? m.createTime.replace("T", " ").slice(0, 19)
        : "?";
    const content = (m.content || "").replace(/\n/g, " ").slice(0, 80);
    // Extract tags from content
    const tags = (m.content || "").match(/#[\w\u4e00-\u9fff]+/g) || [];
    console.log(`| ${i + 1} | ${id} | ${time} | ${tags.join(", ")} | ${content} |`);
  });
}

// ── Commands ─────────────────────────────────────────────────

async function cmdList(args) {
  const limit = getFlag(args, "--limit") || 20;
  const format = getFlag(args, "-f") || "table";
  const date = getFlag(args, "--date");
  const today = args.includes("--today");

  if (date || today) {
    // Date-based filtering: fetch all, filter by date
    const res = await request("GET", `/api/v1/memo?limit=9999`);
    let memos = extractMemos(res);
    const { start, end, label } = parseDateRange(date, today);
    memos = memos.filter((m) => {
      const ts = (m.createdTs || 0) * 1000;
      return ts >= start && ts < end;
    });
    console.error(`Found ${memos.length} memos for ${label}`);
    if (format === "json") formatJson(memos);
    else formatTable(memos);
  } else {
    const res = await request("GET", `/api/v1/memo?limit=${limit}`);
    const memos = extractMemos(res);
    if (format === "json") formatJson(memos);
    else formatTable(memos);
  }
}

async function cmdSearch(args) {
  const keyword = getFlag(args, "--keyword") || args[0];
  const tag = getFlag(args, "--tag");
  if (!keyword && !tag) { console.error("Error: --keyword or --tag is required"); process.exit(1); }

  const limit = getFlag(args, "--limit") || 0;
  const format = getFlag(args, "-f") || "table";

  // Fetch all memos and filter client-side (Memos API has no server-side search)
  const res = await request("GET", `/api/v1/memo?limit=9999`);
  const allMemos = extractMemos(res);

  let filtered;
  let label;
  if (tag) {
    // Exact tag match: #tag followed by sub-tag(/), space, newline, or end of string
    // e.g. --tag "信息源" matches #信息源, #信息源/github, #信息源/博客
    const tagPattern = new RegExp(`#${tag.replace(/^#/, "")}(?=[/\\s\\n,;]|$)`, "i");
    filtered = allMemos.filter((m) => tagPattern.test(m.content || ""));
    label = `#${tag.replace(/^#/, "")}`;
  } else {
    const kw = keyword.toLowerCase();
    filtered = allMemos.filter((m) => (m.content || "").toLowerCase().includes(kw));
    label = keyword;
  }
  if (Number(limit) > 0) filtered = filtered.slice(0, Number(limit));

  console.error(`Found ${filtered.length} results for "${label}"`);
  if (format === "json") formatJson(filtered);
  else formatTable(filtered);
}

async function cmdGet(args) {
  const id = getFlag(args, "--id") || args[0];
  if (!id) { console.error("Error: memo ID is required"); process.exit(1); }

  const format = getFlag(args, "-f") || "json";
  const res = await request("GET", `/api/v1/memo/${id}`);

  if (res.status !== 200) {
    console.error(`Error: failed to get memo ${id} (status ${res.status})`);
    process.exit(1);
  }

  if (format === "json") formatJson(res.data);
  else {
    const m = res.data;
    console.log(`ID: ${m.id || m.name}`);
    console.log(`Created: ${m.createdTs ? new Date(m.createdTs * 1000).toLocaleString("zh-CN") : m.createTime}`);
    console.log(`Visibility: ${m.visibility || "PRIVATE"}`);
    console.log(`---`);
    console.log(m.content);
  }
}

async function cmdCreate(args) {
  const content = getFlag(args, "--content") || args.join(" ");
  if (!content) { console.error("Error: --content is required"); process.exit(1); }

  const visibility = getFlag(args, "--visibility") || "PRIVATE";
  const format = getFlag(args, "-f") || "json";

  const res = await request("POST", "/api/v1/memo", { content, visibility });

  if (res.status !== 200 && res.status !== 201) {
    console.error(`Error: failed to create memo (status ${res.status})`);
    formatJson(res.data);
    process.exit(1);
  }

  console.error("Memo created successfully");
  if (format === "json") formatJson(res.data);
  else console.log(`ID: ${res.data.id || res.data.name}`);
}

async function cmdUpdate(args) {
  const id = getFlag(args, "--id") || args[0];
  if (!id) { console.error("Error: --id is required"); process.exit(1); }

  // Remove id from args if it was positional
  const restArgs = args.filter((a, i) => i !== args.indexOf(id) || getFlag(args, "--id"));
  const content = getFlag(args, "--content") || restArgs.slice(1).join(" ");
  if (!content) { console.error("Error: --content is required"); process.exit(1); }

  const format = getFlag(args, "-f") || "json";
  const res = await request("PATCH", `/api/v1/memo/${id}`, { content });

  if (res.status !== 200) {
    console.error(`Error: failed to update memo ${id} (status ${res.status})`);
    formatJson(res.data);
    process.exit(1);
  }

  console.error("Memo updated successfully");
  if (format === "json") formatJson(res.data);
}

async function cmdTags(args) {
  const format = getFlag(args, "-f") || "json";
  const res = await request("GET", "/api/v1/tag");

  if (res.status !== 200) {
    console.error(`Error: failed to get tags (status ${res.status})`);
    process.exit(1);
  }

  const tags = res.data?.data || res.data || [];
  if (format === "json") formatJson(tags);
  else {
    console.log("Tags:");
    (Array.isArray(tags) ? tags : []).forEach((t) => {
      const name = typeof t === "string" ? t : t.name || t;
      console.log(`  #${name}`);
    });
  }
}

async function cmdCount() {
  const res = await request("GET", "/api/v1/memo?limit=9999");
  const memos = extractMemos(res);
  console.log(JSON.stringify({ total: memos.length }));
}

async function cmdStats(args) {
  const format = getFlag(args, "-f") || "table";
  const res = await request("GET", "/api/v1/memo?limit=9999");
  const memos = extractMemos(res);

  // Tag statistics
  const tagCount = {};
  memos.forEach((m) => {
    const tags = (m.content || "").match(/#[\w\u4e00-\u9fff]+/g) || [];
    tags.forEach((t) => { tagCount[t] = (tagCount[t] || 0) + 1; });
  });

  const sorted = Object.entries(tagCount).sort((a, b) => b[1] - a[1]);

  if (format === "json") {
    formatJson({ total: memos.length, tags: Object.fromEntries(sorted) });
  } else {
    console.log(`Total memos: ${memos.length}`);
    console.log(`\nTop tags:`);
    sorted.slice(0, 20).forEach(([tag, count]) => {
      console.log(`  ${tag}: ${count}`);
    });
  }
}

// ── Helpers ──────────────────────────────────────────────────

function extractMemos(res) {
  if (res.status !== 200) return [];
  const data = res.data;
  if (Array.isArray(data)) return data;
  if (data?.data && Array.isArray(data.data)) return data.data;
  if (data?.memos && Array.isArray(data.memos)) return data.memos;
  return [];
}

function getFlag(args, flag) {
  const idx = args.indexOf(flag);
  if (idx === -1) return null;
  return args[idx + 1] || null;
}

function parseDateRange(date, today) {
  const now = new Date();
  // Force Asia/Shanghai timezone (UTC+8)
  const offset = 8 * 60 * 60 * 1000;
  if (today || !date) {
    const localNow = new Date(now.getTime() + offset);
    const y = localNow.getUTCFullYear(), mo = localNow.getUTCMonth(), d = localNow.getUTCDate();
    const start = new Date(Date.UTC(y, mo, d) - offset).getTime();
    const end = start + 24 * 60 * 60 * 1000;
    return { start, end, label: `${y}-${String(mo+1).padStart(2,"0")}-${String(d).padStart(2,"0")}` };
  }
  // Parse YYYY-MM-DD
  const [y, mo, d] = date.split("-").map(Number);
  const start = new Date(Date.UTC(y, mo - 1, d) - offset).getTime();
  const end = start + 24 * 60 * 60 * 1000;
  return { start, end, label: date };
}

// ── Main ─────────────────────────────────────────────────────

const HELP = `
cflow-cli - CLI for CFlow (Memos)

Usage: cflow <command> [options]

Commands:
  list                    List recent memos
  list --today            List today's memos
  list --date YYYY-MM-DD  List memos for a specific date
  search --keyword <kw>   Search memos by keyword (substring match)
  search --tag <tag>      Search memos by exact tag match
  get <id>                Get memo by ID
  create --content <text> Create a new memo
  update --id <id> --content <text>  Update a memo
  tags                    List all tags
  count                   Get total memo count
  stats                   Show statistics

Common flags:
  -f json|table           Output format (default: table for list/search, json for get/create)
  --limit N               Number of results

Environment:
  CFLOW_URL               CFlow server URL (default: http://localhost:5230)
  CFLOW_TOKEN             API token (JWT, recommended)
  CFLOW_CREATOR_ID        Creator ID for unauthenticated access (default: 1)

Examples:
  cflow list --limit 10
  cflow search --keyword "AI" -f json
  cflow search --tag "AI" -f table        # exact tag match (#AI only, not #AI工具)
  cflow get 123
  cflow create --content "A new idea #tag1 #tag2"
  cflow update --id 123 --content "Updated content"
  cflow tags
  cflow stats
`;

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const cmdArgs = args.slice(1);

  try {
    switch (command) {
      case "list":    await cmdList(cmdArgs); break;
      case "search":  await cmdSearch(cmdArgs); break;
      case "get":     await cmdGet(cmdArgs); break;
      case "create":  await cmdCreate(cmdArgs); break;
      case "update":  await cmdUpdate(cmdArgs); break;
      case "tags":    await cmdTags(cmdArgs); break;
      case "count":   await cmdCount(); break;
      case "stats":   await cmdStats(cmdArgs); break;
      case "help": case "--help": case "-h": case undefined:
        console.log(HELP); break;
      default:
        console.error(`Unknown command: ${command}`);
        console.log(HELP);
        process.exit(1);
    }
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

main();
