<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.md">English</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/ai-loadout/readme.png" width="400" alt="ai-loadout">
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/ai-loadout/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/ai-loadout/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://codecov.io/gh/mcp-tool-shop-org/ai-loadout"><img src="https://codecov.io/gh/mcp-tool-shop-org/ai-loadout/graph/badge.svg" alt="Coverage"></a>
  <a href="https://www.npmjs.com/package/@mcptoolshop/ai-loadout"><img src="https://img.shields.io/npm/v/@mcptoolshop/ai-loadout" alt="npm"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/ai-loadout/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

用于 AI 代理的上下文感知知识路由器。

`ai-loadout` 是一个分派表格式和匹配引擎，它允许 AI 代理加载完成特定任务所需的知识。 与将所有内容都放入上下文中不同，它维护一个小型索引，并在需要时加载数据。

可以将其想象成游戏中的装备配置——在每次任务开始前，为代理配备它所需的精确知识。

## 安装

```bash
npm install @mcptoolshop/ai-loadout
```

## 核心概念

### 分派表

`LoadoutIndex` 是一个结构化的知识数据索引：

```json
{
  "version": "1.0.0",
  "generated": "2026-03-06T12:00:00Z",
  "entries": [
    {
      "id": "github-actions",
      "path": ".rules/github-actions.md",
      "keywords": ["ci", "workflow", "runner"],
      "patterns": ["ci_pipeline"],
      "priority": "domain",
      "summary": "CI triggers, path gating, runner cost control",
      "triggers": { "task": true, "plan": true, "edit": false },
      "tokens_est": 680,
      "lines": 56
    }
  ],
  "budget": {
    "always_loaded_est": 320,
    "on_demand_total_est": 8100,
    "avg_task_load_est": 520,
    "avg_task_load_observed": null
  }
}
```

### 优先级层级

| 层级 | 行为 | 示例 |
|------|----------|---------|
| `core` | 始终加载 | "永远不要跳过测试以使 CI 流程通过" |
| `domain` | 当任务关键词匹配时加载 | 编辑工作流时的 CI 规则 |
| `manual` | 从不自动加载，仅进行显式查找 | 一些不为人知的平台问题 |

### 数据前缀

每个数据文件都包含自己的路由元数据：

```markdown
---
id: github-actions
keywords: [ci, workflow, runner, dependabot]
patterns: [ci_pipeline]
priority: domain
triggers:
  task: true
  plan: true
  edit: false
---

# GitHub Actions Rules
CI minutes are finite...
```

数据前缀是权威来源。索引是从其派生的。

## API

### `matchLoadout(task, index)`

将任务描述与 `LoadoutIndex` 进行匹配。返回应加载的条目，并按匹配强度排序。

```typescript
import { matchLoadout } from "@mcptoolshop/ai-loadout";

const results = matchLoadout("fix the CI workflow", index);
// [{ entry: { id: "github-actions", ... }, score: 0.67, matchedKeywords: ["ci", "workflow"] }]
```

- 核心条目始终包含（得分 1.0）
- 手动添加的条目从不自动包含
- 领域条目的得分基于关键词重叠 + 模式加分
- 结果按得分降序排序

### `lookupEntry(id, index)`

通过 ID 查找特定条目。用于手动添加的条目或显式访问。

```typescript
import { lookupEntry } from "@mcptoolshop/ai-loadout";

const entry = lookupEntry("github-actions", index);
```

### `parseFrontmatter(content)`

解析数据文件中的 YAML 格式的数据前缀。

```typescript
import { parseFrontmatter } from "@mcptoolshop/ai-loadout";

const { frontmatter, body } = parseFrontmatter(fileContent);
if (frontmatter) {
  console.log(frontmatter.id, frontmatter.keywords);
}
```

### `serializeFrontmatter(fm)`

将 `Frontmatter` 对象序列化为字符串。

### `validateIndex(index)`

验证 `LoadoutIndex` 的结构完整性。返回一个包含问题的数组。

```typescript
import { validateIndex } from "@mcptoolshop/ai-loadout";

const issues = validateIndex(index);
const errors = issues.filter(i => i.severity === "error");
if (errors.length > 0) {
  console.error("Index has errors:", errors);
}
```

检查内容：必需字段、唯一 ID、kebab-case 格式、摘要范围、领域条目的关键词是否存在、有效的优先级、非负预算。

### `estimateTokens(text)`

根据文本估算令牌数量。使用字符/4 的启发式方法。

```typescript
import { estimateTokens } from "@mcptoolshop/ai-loadout";

const tokens = estimateTokens(fileContent); // ~250
```

## 类型

```typescript
import type {
  LoadoutEntry,
  LoadoutIndex,
  Frontmatter,
  MatchResult,
  ValidationIssue,
  Priority,       // "core" | "domain" | "manual"
  Triggers,       // { task, plan, edit }
  Budget,
} from "@mcptoolshop/ai-loadout";
```

## 使用者

- **[@mcptoolshop/claude-rules](https://github.com/mcp-tool-shop-org/claude-rules)** — 用于 Claude Code 的 CLAUDE.md 优化器。使用 `ai-loadout` 作为分派表和匹配引擎。

## 安全性

此软件包是一个纯数据库。它不访问文件系统，不进行网络请求，也不收集遥测数据。所有 I/O 由使用者负责。

### 安全模型

| 威胁 | 缓解措施 |
|--------|------------|
| 格式错误的元数据输入 | `parseFrontmatter()` 在无效输入时返回 `null`，不抛出异常，也不使用 `eval` |
| 原型污染 | 手动编写的解析器使用纯对象字面量，不使用 `JSON.parse` 解析不可信任的嵌套结构 |
| 包含不良数据的索引 | `validateIndex()` 在问题传播之前捕获结构性问题 |
| 正则表达式拒绝服务 (DoS) | 不使用用户提供的正则表达式——模式作为纯字符串查找进行匹配 |

有关完整的安全策略，请参阅 [SECURITY.md](SECURITY.md)。

---

由 [MCP Tool Shop](https://mcp-tool-shop.github.io/) 构建。
