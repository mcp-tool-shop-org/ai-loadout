---
title: API Reference
description: Complete API reference for AI Loadout.
sidebar:
  order: 3
---

## matchLoadout(task, index)

Match a task description against a loadout index. Returns entries that should be loaded, ranked by match strength.

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
}
```

**Behavior:**
- Core entries always included (score 1.0)
- Manual entries never auto-included
- Domain entries scored by keyword overlap + pattern bonus
- Results sorted by score descending, then token cost ascending

---

## lookupEntry(id, index)

Look up a specific entry by ID. Use this for manual entries or explicit access.

```typescript
import { lookupEntry } from "@mcptoolshop/ai-loadout";

const entry = lookupEntry("github-actions", index);
// LoadoutEntry | undefined
```

---

## parseFrontmatter(content)

Parse YAML-like frontmatter from a payload file.

```typescript
import { parseFrontmatter } from "@mcptoolshop/ai-loadout";

const { frontmatter, body } = parseFrontmatter(fileContent);
if (frontmatter) {
  console.log(frontmatter.id, frontmatter.keywords);
}
```

**Returns:** `{ frontmatter: Frontmatter | null, body: string }`

Returns `null` for frontmatter if the content has no `---` delimiters or is missing required fields (like `id`).

---

## serializeFrontmatter(fm)

Serialize a `Frontmatter` object back to a `---` delimited string.

```typescript
import { serializeFrontmatter } from "@mcptoolshop/ai-loadout";

const text = serializeFrontmatter(frontmatter);
// ---
// id: my-rule
// keywords: [test, example]
// priority: domain
// ---
```

---

## validateIndex(index)

Validate structural integrity of a `LoadoutIndex`. Does not check the filesystem — that's the consumer's responsibility.

```typescript
import { validateIndex } from "@mcptoolshop/ai-loadout";

const issues = validateIndex(index);
const errors = issues.filter(i => i.severity === "error");
```

**Returns:** `ValidationIssue[]`

```typescript
interface ValidationIssue {
  severity: "error" | "warning";
  code: string;
  message: string;
  hint?: string;
  entryId?: string;
}
```

**Checks:** required fields, unique IDs, kebab-case format, summary bounds (<120 chars), keyword presence for domain entries, valid priorities, non-negative budgets.

---

## estimateTokens(text)

Estimate token count from text using chars/4 heuristic.

```typescript
import { estimateTokens } from "@mcptoolshop/ai-loadout";

const tokens = estimateTokens(fileContent); // ~250
```

---

## Types

```typescript
import type {
  LoadoutEntry,    // Single entry in the dispatch table
  LoadoutIndex,    // The full dispatch table (entries + budget)
  Frontmatter,     // Parsed from payload file headers
  MatchResult,     // Returned by matchLoadout()
  ValidationIssue, // Returned by validateIndex()
  Priority,        // "core" | "domain" | "manual"
  Triggers,        // { task, plan, edit }
  Budget,          // Token budget model
  IssueSeverity,   // "error" | "warning"
} from "@mcptoolshop/ai-loadout";
```

## Constants

```typescript
import { DEFAULT_TRIGGERS } from "@mcptoolshop/ai-loadout";
// { task: true, plan: true, edit: false }
```
