---
name: cflow-cli
description: |
  CFlow (Memos) CLI tool for managing personal micro-notes. Search, browse, create, and update memos on a self-hosted CFlow/Memos instance. Triggers: user asks to check CFlow, search memos, create a memo, browse notes, view tags, or asks about CFlow content; check CFlow, search CFlow, write a memo, browse notes, view tags, create a note etc.
---

# cflow-cli

CLI tool for CFlow (Memos) — a self-hosted micro-note service. Search, browse, create, and update memos directly from the command line.

**Rule: use cflow-cli for all CFlow/Memos operations. No browser or API calls needed.**

## Setup

**1. Set environment variables:**

```bash
export CFLOW_URL="http://your-memos-server:5236"
export CFLOW_TOKEN="your-jwt-token"           # recommended, get from Memos settings
export CFLOW_CREATOR_ID="1"                    # fallback if no token, default: 1
```

**2. Run the CLI:**

```bash
node cflow-cli/index.js <command> [options]
```

Or create an alias:
```bash
alias cflow="CFLOW_URL='http://your-server:5236' CFLOW_TOKEN='your-token' node /path/to/cflow-cli/index.js"
```

## Syntax

```bash
cflow <command> [--option value] [-f json|table]
```

**Common flags:**
- `-f json` — machine-readable JSON output (preferred for parsing)
- `-f table` — human-readable table output
- `--limit N` — number of results (default: 20 for list)

## Commands Reference

### Browse & Read

```bash
# List recent memos (default 20)
cflow list --limit 20 -f json

# List more memos
cflow list --limit 50 -f table

# Get a specific memo by ID
cflow get 123 -f json
cflow get --id 123
```

### Search

```bash
# Search by keyword - substring match (returns all matches by default)
cflow search --keyword "AI" -f json

# Search by exact tag - matches #AI but not #AI-tools
cflow search --tag "AI" -f table

# Tag search includes sub-tags: --tag "source" matches #source, #source/github, #source/blog
cflow search --tag "source" -f table

# Search with limit
cflow search --keyword "Python" --limit 10 -f table

# Search Chinese content
cflow search --keyword "project" -f json
```

### Create

```bash
# Create a new memo (private by default)
cflow create --content "A new idea about AI workflows #AI #idea"

# Create with visibility
cflow create --content "Public thought" --visibility PUBLIC

# Visibility options: PRIVATE (default), PROTECTED, PUBLIC
```

### Update

```bash
# Update memo content by ID
cflow update --id 123 --content "Updated content with new insights #updated"
```

### Tags & Stats

```bash
# List all tags
cflow tags -f json

# Get total memo count
cflow count

# Show statistics (total count + top tags)
cflow stats -f json
cflow stats -f table
```

## Output Formatting Rules

When displaying results to the user:
1. **Always use table format** for list/search results shown to user
2. **Use JSON** when piping data or doing further processing
3. **Translate key info** — show time in readable format, preview content
4. For search results, always show the match count

Example output:
```
Found 5 results for "AI"

| # | ID | Time | Tags | Content (preview) |
|---|-----|------|------|-------------------|
| 1 | 456 | 2026/3/20 14:30 | #AI, #tools | Found a great AI tool today... |
| 2 | 432 | 2026/3/19 09:15 | #AI, #idea | Thoughts on AI-assisted writing... |
```

## Common Use Cases

| User says | Command |
|-----------|---------|
| Check CFlow | `cflow list --limit 20` |
| Search CFlow for XX | `cflow search --keyword "XX"` |
| Search by tag XX | `cflow search --tag "XX"` |
| Browse recent notes | `cflow list --limit 10 -f table` |
| Write a note | `cflow create --content "content"` |
| Create a memo | `cflow create --content "content #tag"` |
| Edit that memo | `cflow update --id 123 --content "new content"` |
| How many memos | `cflow count` |
| Show tags | `cflow tags` |
| CFlow stats | `cflow stats` |

## Error Handling

| Problem | Fix |
|---------|-----|
| Connection refused | Check CFLOW_URL is correct and Memos server is running |
| Request timeout | Server may be slow; retry or check network |
| Empty results | Try broader keywords or check if memos exist |
| Auth error (400) | Set CFLOW_TOKEN (JWT) from Memos settings, or set CFLOW_CREATOR_ID |

## Notes

- Compatible with [Memos](https://github.com/usememos/memos) v0.18.x API
- Search fetches all memos then filters client-side — works well for <10k memos
- All timestamps displayed in Asia/Shanghai timezone
- Tags are extracted from memo content (inline `#tag` format)
- Hierarchical tags supported: `#parent/child`
- No delete operation by design — memos are preserved

## License

MIT
