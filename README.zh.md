<p align="center">
  <a href="README.md">English</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a> | <a href="README.ja.md">日本語</a>
</p>

<p align="center">
  <img src="logo.png" width="400" alt="ai-loadout">
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/ai-loadout/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/ai-loadout/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://www.npmjs.com/package/@mcptoolshop/ai-loadout"><img src="https://img.shields.io/npm/v/@mcptoolshop/ai-loadout" alt="npm"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT 许可证"></a>
</p>

面向 AI 代理的上下文感知知识路由器。

`ai-loadout` 是一种调度表格式和匹配引擎，让 AI 代理能够为当前任务加载正确的知识。无需将所有内容都塞入上下文，你只需维护一个小型索引，按需加载有效负载。

可以把它想象成游戏装备系统 — 在每次任务前为代理装备恰好需要的知识。

## 安装

```bash
npm install @mcptoolshop/ai-loadout
```

## 核心概念

### 调度表

`LoadoutIndex` 是知识有效负载的结构化索引：

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
|------|------|------|
| `core` | 始终加载 | "绝不跳过测试来让 CI 通过" |
| `domain` | 当任务关键词匹配时加载 | 编辑 workflow 时的 CI 规则 |
| `manual` | 从不自动加载，仅限显式查找 | 罕见的平台问题 |

### 有效负载 Frontmatter

每个有效负载文件携带自己的路由元数据：

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

Frontmatter 是唯一的事实来源。索引从中派生。

## API

### `matchLoadout(task, index)`

将任务描述与 loadout 索引进行匹配。返回应加载的条目，按匹配强度排序。

```typescript
import { matchLoadout } from "@mcptoolshop/ai-loadout";

const results = matchLoadout("fix the CI workflow", index);
// [{ entry: { id: "github-actions", ... }, score: 0.67, matchedKeywords: ["ci", "workflow"] }]
```

- core 条目始终包含（得分 1.0）
- manual 条目从不自动包含
- domain 条目按关键词重叠度 + 模式加分评分
- 结果按得分降序排列

### `lookupEntry(id, index)`

通过 ID 查找特定条目。用于 manual 条目或显式访问。

```typescript
import { lookupEntry } from "@mcptoolshop/ai-loadout";

const entry = lookupEntry("github-actions", index);
```

### `parseFrontmatter(content)`

从有效负载文件中解析类 YAML 格式的 frontmatter。

```typescript
import { parseFrontmatter } from "@mcptoolshop/ai-loadout";

const { frontmatter, body } = parseFrontmatter(fileContent);
if (frontmatter) {
  console.log(frontmatter.id, frontmatter.keywords);
}
```

### `serializeFrontmatter(fm)`

将 `Frontmatter` 对象序列化回字符串。

### `validateIndex(index)`

验证 `LoadoutIndex` 的结构完整性。返回问题数组。

```typescript
import { validateIndex } from "@mcptoolshop/ai-loadout";

const issues = validateIndex(index);
const errors = issues.filter(i => i.severity === "error");
if (errors.length > 0) {
  console.error("Index has errors:", errors);
}
```

检查项：必填字段、唯一 ID、kebab-case 格式、摘要长度限制、domain 条目的关键词存在性、有效优先级、非负预算。

### `estimateTokens(text)`

估算文本的 token 数量。使用字符数/4 的启发式方法。

```typescript
import { estimateTokens } from "@mcptoolshop/ai-loadout";

const tokens = estimateTokens(fileContent); // ~250
```

## 类型定义

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

- **[@mcptoolshop/claude-rules](https://github.com/mcp-tool-shop-org/claude-rules)** — Claude Code 的 CLAUDE.md 优化器。使用 ai-loadout 作为调度表和匹配引擎。

## 安全性

此包是一个纯数据库。它不访问文件系统、不发起网络请求、不收集遥测数据。所有 I/O 由使用者负责。

### 威胁模型

| 威胁 | 缓解措施 |
|------|----------|
| 格式错误的 frontmatter 输入 | `parseFrontmatter()` 在无效输入时返回 `null` — 无异常、无 eval |
| 原型污染 | 手动解析器使用普通对象字面量，不对不可信的嵌套结构使用 `JSON.parse` |
| 包含错误数据的索引 | `validateIndex()` 在问题扩散前检测结构性问题 |
| Regex DoS | 无用户提供的正则表达式 — 模式作为纯字符串查找进行匹配 |

完整安全策略请参阅 [SECURITY.md](SECURITY.md)。

---

由 [MCP Tool Shop](https://mcp-tool-shop.github.io/) 构建
