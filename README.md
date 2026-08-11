# susu-skills

A collection of AI agent skills for personal productivity and knowledge workflows.

These skills are designed for Claude Code, Codex, OpenClaw, and other local-agent tools
that can read files, run commands, and follow skill-style instructions.

## Skills

| Skill | Description | Install |
|-------|-------------|---------|
| [cflow-cli](./cflow-cli/) | CLI tool for CFlow (Memos) - search, browse, create, and update memos | `npx skills add brmysss/susu-skills --subdir cflow-cli` |
| [bilibili-video-note](./bilibili-video-note/) | Turn Bilibili or other video links into structured notes, offline HTML visual notes, and long-image slices | `npx skills add brmysss/susu-skills --subdir bilibili-video-note` |
| [苏苏商业模式分析](./苏苏商业模式分析/) | Research business models through timelines, stage breakthroughs, growth flywheels, evidence grading, risks, and transfer analysis | `npx skills add brmysss/susu-skills --subdir 苏苏商业模式分析` |
| [苏苏概念图笔记](./苏苏概念图笔记/) | Turn articles, courses, transcripts, and long notes into auditable proposition inventories and medium-density Mermaid concept maps | `npx skills add brmysss/susu-skills --subdir 苏苏概念图笔记` |

## Prompts

| Prompt | Description |
|--------|-------------|
| [structured-video-note.prompt.md](./prompts/structured-video-note.prompt.md) | Reusable prompt for summary-first, source-grounded video/course transcript notes |

## About

These skills are built for personal knowledge management workflows with Obsidian,
CFlow (Memos), Bilibili/video learning materials, and other local-first tools.

For Bilibili downloads, `bilibili-video-note` defaults to Edge cookies via
`yt-dlp --cookies-from-browser edge`, because the author uses Edge as the logged-in
browser. If you use another browser, change `edge` to your browser name.

## License

MIT
