---
title: Concepts
description: Dispatch tables, priority tiers, trigger phases, and the budget model.
sidebar:
  order: 2
---

## The Dispatch Table

A `LoadoutIndex` is the central data structure. It contains:

- **entries** — an array of `LoadoutEntry` objects, each describing one knowledge payload
- **budget** — token estimates for context planning

The index is designed to be always-loaded alongside a lean instruction file. Payloads are loaded on demand when the matcher finds a hit.

## Priority Tiers

Every entry has a `priority` that controls how it's matched:

| Tier | Behavior | Score | Use for |
|------|----------|-------|---------|
| `core` | Always included in results | 1.0 | Non-negotiable rules |
| `domain` | Included when keywords match | 0-1 | Topic-specific knowledge |
| `manual` | Never auto-included | N/A | Obscure or dangerous knowledge |

Manual entries are only accessible via `lookupEntry(id, index)` — they never appear in `matchLoadout()` results.

## Trigger Phases

Each entry specifies when it should be loaded relative to the agent loop:

```typescript
interface Triggers {
  task: boolean;   // load during task interpretation
  plan: boolean;   // load during plan formation
  edit: boolean;   // load before file edits
}
```

The default is `{ task: true, plan: true, edit: false }`. These are advisory — the consumer decides how to interpret them.

## Keyword Matching

The matcher tokenizes the task description into lowercase words, then compares against each entry's `keywords` array:

1. Calculate **overlap proportion** = matched keywords / total entry keywords
2. Add **pattern bonus** (+0.2) if any entry pattern appears in the task
3. Cap the score at 1.0
4. Sort results by score descending, then by token cost ascending (lighter payloads first on ties)

## The Budget Model

```typescript
interface Budget {
  always_loaded_est: number;        // tokens always in context
  on_demand_total_est: number;      // sum of all payload tokens
  avg_task_load_est: number;        // estimated average per session
  avg_task_load_observed: number | null;  // from usage telemetry
}
```

The budget helps tooling answer: "How much context am I saving by routing instead of dumping?"

## Frontmatter

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
Content here...
```

**Frontmatter is the source of truth.** The index is derived from it, not the other way around. If they drift, validation catches it.

The frontmatter parser is hand-rolled — no YAML library, no `eval`, no prototype pollution vectors. It handles strings, inline arrays `[a, b]`, booleans, and one-level nested objects.
