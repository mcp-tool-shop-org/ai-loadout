<p align="center">
  <a href="README.md">English</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a> | <a href="README.ja.md">日本語</a>
</p>

<p align="center">
  <img src="logo.png" width="400" alt="ai-loadout">
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/ai-loadout/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/ai-loadout/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://www.npmjs.com/package/@mcptoolshop/ai-loadout"><img src="https://img.shields.io/npm/v/@mcptoolshop/ai-loadout" alt="npm"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/ai-loadout/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

Context-aware knowledge router for AI agents.

`ai-loadout` is the dispatch table format and matching engine that lets AI agents load the right knowledge for the task at hand. Instead of dumping everything into context, you keep a tiny index and load payloads on demand.

Think of it like a game loadout — you equip the agent with exactly the knowledge it needs before each mission.

## Install

```bash
npm install @mcptoolshop/ai-loadout
```

## Core Concepts

### The Dispatch Table

A `LoadoutIndex` is a structured index of knowledge payloads:

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

### Priority Tiers

| Tier | Behavior | Example |
|------|----------|---------|
| `core` | Always loaded | "never skip tests to make CI green" |
| `domain` | Loaded when task keywords match | CI rules when editing workflows |
| `manual` | Never auto-loaded, explicit lookup only | Obscure platform gotchas |

### Payload Frontmatter

Each payload file carries its own routing metadata:

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

Frontmatter is the source of truth. The index is derived from it.

## API

### `matchLoadout(task, index)`

Match a task description against a loadout index. Returns entries that should be loaded, ranked by match strength.

```typescript
import { matchLoadout } from "@mcptoolshop/ai-loadout";

const results = matchLoadout("fix the CI workflow", index);
// [{ entry: { id: "github-actions", ... }, score: 0.67, matchedKeywords: ["ci", "workflow"] }]
```

- Core entries always included (score 1.0)
- Manual entries never auto-included
- Domain entries scored by keyword overlap + pattern bonus
- Results sorted by score descending

### `lookupEntry(id, index)`

Look up a specific entry by ID. For manual entries or explicit access.

```typescript
import { lookupEntry } from "@mcptoolshop/ai-loadout";

const entry = lookupEntry("github-actions", index);
```

### `parseFrontmatter(content)`

Parse YAML-like frontmatter from a payload file.

```typescript
import { parseFrontmatter } from "@mcptoolshop/ai-loadout";

const { frontmatter, body } = parseFrontmatter(fileContent);
if (frontmatter) {
  console.log(frontmatter.id, frontmatter.keywords);
}
```

### `serializeFrontmatter(fm)`

Serialize a `Frontmatter` object back to a string.

### `validateIndex(index)`

Validate structural integrity of a `LoadoutIndex`. Returns an array of issues.

```typescript
import { validateIndex } from "@mcptoolshop/ai-loadout";

const issues = validateIndex(index);
const errors = issues.filter(i => i.severity === "error");
if (errors.length > 0) {
  console.error("Index has errors:", errors);
}
```

Checks: required fields, unique IDs, kebab-case format, summary bounds, keyword presence for domain entries, valid priorities, non-negative budgets.

### `estimateTokens(text)`

Estimate token count from text. Uses chars/4 heuristic.

```typescript
import { estimateTokens } from "@mcptoolshop/ai-loadout";

const tokens = estimateTokens(fileContent); // ~250
```

## Types

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

## Consumers

- **[@mcptoolshop/claude-rules](https://github.com/mcp-tool-shop-org/claude-rules)** — CLAUDE.md optimizer for Claude Code. Uses ai-loadout for the dispatch table and matching.

## Security

This package is a pure data library. It does not access the filesystem, make network requests, or collect telemetry. All I/O is the consumer's responsibility.

### Threat Model

| Threat | Mitigation |
|--------|------------|
| Malformed frontmatter input | `parseFrontmatter()` returns `null` on invalid input — no exceptions, no eval |
| Prototype pollution | Hand-rolled parser uses plain object literals, no `JSON.parse` of untrusted nested structures |
| Index with bad data | `validateIndex()` catches structural issues before they propagate |
| Regex DoS | No user-supplied regex — patterns are matched as plain string lookups |

See [SECURITY.md](SECURITY.md) for the full security policy.

---

Built by [MCP Tool Shop](https://mcp-tool-shop.github.io/)
