# business-model-deep-analysis

一个面向公司、品牌、景区、平台、产品、门店和个人 IP 的商业模式深度分析 Skill。

它不只套用商业模式画布，还会还原发展时间线、识别阶段性破局点、构建增长飞轮，并用证据分级、风险搜索和反事实检验避免把成功案例写成宣传故事。

## Install

```bash
npx skills add brmysss/susu-skills --subdir business-model-deep-analysis
```

也可以直接复制目录到 Claude Code、Codex 或其他本地 Agent 的 skills 目录。

## Example prompts

```text
胖东来为什么能成为全国性零售 IP？请从发展历程、组织、用户价值、流量、收入和壁垒详细分析。
```

```text
分析这个知识博主的个人 IP 商业模式，重点研究他如何获客、设计产品、交付、复购和形成口碑。
```

```text
这个景区最近因短视频爆红。请判断它只是短期网红，还是已经形成可持续商业模式。
```

## Structure

```text
business-model-deep-analysis/
├── SKILL.md
├── README.md
├── references/
│   ├── analysis-framework.md
│   ├── research-and-sources.md
│   ├── evidence-quality.md
│   └── report-template.md
└── evals/
    └── evals.json
```

## Core principles

- 区分长期积累、增长拐点和短期触发器。
- 区分事实、推断和待验证假设。
- 区分营收、利润、GMV、估值、客流和曝光。
- 同时分析用户价值、商业化、组织交付、竞争壁垒与风险。
- 只有形成真实反馈回路时才将增长机制称为飞轮。
- 将成功经验迁移为可小规模验证的行动，而不是照搬表面形式。
