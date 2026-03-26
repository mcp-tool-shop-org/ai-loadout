---
title: API Reference
description: Complete API reference for AI Loadout.
sidebar:
  order: 3
---

## Agent Runtime

### planLoad(task, opts?)

Plan what to load for a given task. This is the primary agent-facing API.

```typescript
import { planLoad } from "@mcptoolshop/ai-loadout";

const plan = planLoad("fix the CI workflow");
```

**Returns:** `LoadPlan`

```typescript
interface LoadPlan {
  preload: MatchResult[];              // eager entries — load immediately
  onDemand: MatchResult[];             // lazy entries — load when needed
  manual: LoadoutEntry[];              // never auto-loaded
  provenance: Record<string, string>;  // entryId → source layer
  budget: Budget;
  conflicts: MergeConflict[];
  layerNames: string[];
  preloadTokens: number;
  onDemandTokens: number;
}
```

Resolves all layers (global → org → project → session), matches the task, and separates entries by load mode.

---

### recordLoad(entryId, trigger, mode, tokensEst, opts?)

Record that an agent loaded an entry. Appends to a JSONL usage log when `usagePath` is set in options. Enables dead entry detection, budget drift analysis, and frequency tracking.

---

### manualLookup(id, opts?)

Look up a manual entry by ID from the resolved index.

```typescript
import { manualLookup } from "@mcptoolshop/ai-loadout";

const entry = manualLookup("platform-gotchas");
// LoadoutEntry | undefined
```

---

## Resolver

### resolveLoadout(opts?)

Resolve the full loadout by discovering layers and merging them.

```typescript
import { resolveLoadout } from "@mcptoolshop/ai-loadout";

const { merged, layers, searched } = resolveLoadout();
```

**Returns:** `ResolvedLoadout` — merged index, discovered layers, and all searched locations.

---

### discoverLayers(opts?)

Discover canonical layer locations and load any that exist. Lower-level than `resolveLoadout`.

---

### explainEntry(entryId, layers)

Explain how a specific entry was resolved across layers. Shows every layer that defined it, the override chain, and the winning version.

```typescript
import { resolveLoadout, explainEntry } from "@mcptoolshop/ai-loadout";

const { layers } = resolveLoadout();
const why = explainEntry("github-actions", layers);
// why.finalLayer, why.overrideChain, why.definitions
```

---

## Matching

### matchLoadout(task, index)

Match a task description against a loadout index. Returns entries ranked by match strength.

```typescript
import { matchLoadout } from "@mcptoolshop/ai-loadout";

const results = matchLoadout("fix the CI workflow", index);
```

**Returns:** `MatchResult[]`

```typescript
interface MatchResult {
  entry: LoadoutEntry;
  score: number;           // 0-1
  matchedKeywords: string[];
  matchedPatterns: string[];
  reason: string;          // human-readable explanation
  mode: LoadMode;          // "eager" | "lazy" | "manual"
}
```

**Behavior:**
- Core entries always included (score 1.0)
- Manual entries never auto-included
- Domain entries scored by keyword overlap + pattern bonus
- Results sorted by score descending, then token cost ascending

---

### lookupEntry(id, index)

Look up a specific entry by ID. Use this for manual entries or explicit access.

```typescript
import { lookupEntry } from "@mcptoolshop/ai-loadout";

const entry = lookupEntry("github-actions", index);
// LoadoutEntry | undefined
```

---

## Observability

### recordUsage(event, path) / readUsage(path) / summarizeUsage(events)

Append-only JSONL usage log. `recordUsage` appends, `readUsage` loads, `summarizeUsage` groups by entry.

### findDeadEntries(index, events)

Find entries that have never been loaded. Returns entries sorted by token cost (biggest waste first).

### findKeywordOverlaps(index)

Find keywords shared between entries — routing ambiguities.

### analyzeBudget(index, usage?)

Token budget breakdown by priority tier, with observed-vs-estimated comparison when usage data is available.

---

## Merge

### mergeIndexes(layers)

Deterministic merge for hierarchical loadouts. Later layers override earlier ones for the same entry ID.

**Returns:** `MergedIndex` — extends `LoadoutIndex` with `provenance` (entryId → source layer) and `conflicts`.

---

## Utilities

### parseFrontmatter(content)

Parse YAML-like frontmatter from a payload file.

```typescript
import { parseFrontmatter } from "@mcptoolshop/ai-loadout";

const { frontmatter, body } = parseFrontmatter(fileContent);
```

**Returns:** `{ frontmatter: Frontmatter | null, body: string }`

### serializeFrontmatter(fm)

Serialize a `Frontmatter` object back to a `---` delimited string.

### validateIndex(index)

Validate structural integrity of a `LoadoutIndex`.

**Checks:** required fields, unique IDs, kebab-case format, summary bounds (<120 chars), keyword presence for domain entries, valid priorities, non-negative budgets.

### estimateTokens(text)

Estimate token count from text using chars/4 heuristic.

---

## CLI

```
ai-loadout resolve                    Resolve layered loadouts
ai-loadout explain <entry-id>         Explain an entry's resolution path
ai-loadout validate <index>           Validate index structure
ai-loadout usage <jsonl>              Usage summary from event log
ai-loadout dead <index> <jsonl>       Find entries never loaded
ai-loadout overlaps <index>           Find keyword routing ambiguities
ai-loadout budget <index> [jsonl]     Token budget breakdown
```

All commands support `--json` for scripting. Resolver commands accept `--project`, `--global`, `--org`, `--session`.

---

## Types

```typescript
import type {
  LoadoutEntry,      // Single entry in the dispatch table
  LoadoutIndex,      // The full dispatch table (entries + budget)
  Frontmatter,       // Parsed from payload file headers
  MatchResult,       // Returned by matchLoadout()
  ValidationIssue,   // Returned by validateIndex()
  Priority,          // "core" | "domain" | "manual"
  Triggers,          // { task, plan, edit }
  LoadMode,          // "eager" | "lazy" | "manual"
  Budget,            // Token budget model
  UsageEvent,        // Append-only usage log entry
  MergeConflict,     // Entry defined in multiple layers
  MergedIndex,       // LoadoutIndex + provenance + conflicts
  LoadPlan,          // Returned by planLoad()
  ResolvedLoadout,   // Returned by resolveLoadout()
  EntryExplanation,  // Returned by explainEntry()
  IssueSeverity,     // "error" | "warning"
} from "@mcptoolshop/ai-loadout";
```

## Constants

```typescript
import { DEFAULT_TRIGGERS } from "@mcptoolshop/ai-loadout";
// { task: true, plan: true, edit: false }
```
