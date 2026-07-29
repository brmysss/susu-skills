# 输出契约

## A. 严格命题清单

```markdown
---
title: {标题}｜严格概念图命题清单
tags: [概念图, 命题清单, 审计]
source: "[[{源笔记}]]"
---

# 焦点问题
> {一个能统领全图的问题}

# 重要节点
- {概念}

# 次要节点
- {概念}

# 外部／证据节点
- {证据概念}

# 可朗读命题
1. {概念 A} → {关系短语} → {概念 B}。

# 概念笔记下钻
- [[已有概念笔记]]

> [!note] 边界
> {哪些信息不进入主图、保留在哪里}
```

## B. 中密度 Mermaid 主图

```markdown
---
title: {标题}｜中密度推荐版概念图
tags: [概念图, Mermaid, 中密度, 推荐版]
source: "[[{源笔记}]]"
---

# {用问题或核心结论命名}

> [!question] 焦点问题
> {焦点问题}

```mermaid
%%{init: {"flowchart": {"curve": "basis", "nodeSpacing": 36, "rankSpacing": 54}}}%%
flowchart TB
    a["概念 A"] -->|具体关系| b["概念 B"]
    b -.->|辅助／跨链关系| c["概念 C"]

    classDef core fill:#fff1f1,stroke:#8f2f2f,color:#5f1717,stroke-width:2.5px;
    classDef context fill:#f5f0ff,stroke:#75529a,color:#452660,stroke-width:1.8px;
    classDef social fill:#eef9f2,stroke:#2d7655,color:#17452f,stroke-width:1.8px;
    classDef bridge fill:#edf5fc,stroke:#356aa0,color:#214b73,stroke-width:1.8px;
    classDef action fill:#fff7d8,stroke:#b98816,color:#6e4e05,stroke-width:1.8px;
    classDef evidence fill:#f5f2eb,stroke:#8d8578,color:#5d574e,stroke-dasharray:5 4;
```

## 概念笔记下钻
- [[已有概念笔记]]

> [!note] 图外解压缩
> {从主图移出的案例、数据和解释仍保留在哪里，以及主图保留了它们证明的什么机制}
```

## 质量计数

- 节点数按 Mermaid 中不同 node ID 计算，同一节点多次出现在边中只计一次。
- 命题数按有语义标签的边计算；纯布局边不得混入语义计数。
- 证据节点必须指向它支持、反驳或界定的概念，不能漂浮。
- 高密度不是“所有细节都放进图”；所有信息由“命题清单 + 主图 + 概念笔记／原文”三层共同保留。

