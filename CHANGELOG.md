# Changelog

## 1.4.2 — 2026-03-06

- **README overhaul**: Document full API surface — agent runtime (`planLoad`, `recordLoad`, `manualLookup`), resolver, observability, merge, CLI commands
- Add claude-memories to consumers list

## 1.4.1 — 2026-03-06

- **Fix tokenizer**: hyphens now split into separate tokens (`claude-memories` → `claude` + `memories`), fixing keyword matching for hyphenated task descriptions
- Dogfooded end-to-end: install → index → resolve → planLoad against a real 32-entry workspace

## 1.4.0 — 2026-03-06

- **Agent runtime contract**: `planLoad()`, `recordLoad()`, `manualLookup()` — the canonical agent integration API
- **LoadPlan**: stable output shape with preload/onDemand/manual separation, provenance, budget, token costs
- **AGENT_CONTRACT.md**: portable integration guide for Claude agents, MCP servers, CLIs, and editor extensions
- SPEC.md updated with runtime section and LoadPlan schema
- 13 new tests (runtime), 93 total

## 1.3.0 — 2026-03-06

- **Hierarchical resolver**: `discoverLayers()`, `resolveLoadout()` for layered indexes (global → org → project → session)
- **Entry explanation**: `explainEntry()` traces an entry's decision path across layers ("why did this rule win?")
- **CLI**: `ai-loadout resolve` and `ai-loadout explain <id>` commands
- **CLI options**: `--project`, `--global`, `--org`, `--session` for resolver configuration
- **Environment variables**: `$AI_LOADOUT_ORG`, `$AI_LOADOUT_SESSION` for layer discovery
- SPEC.md updated with resolver semantics and CLI reference
- 17 new tests (resolver), 80 total

## 1.2.0 — 2026-03-06

- **Usage tracking**: `recordUsage()`, `readUsage()`, `summarizeUsage()` for append-only JSONL logs
- **Dead entry detection**: `findDeadEntries()` finds entries never loaded
- **Keyword overlap analysis**: `findKeywordOverlaps()` finds routing ambiguities
- **Budget breakdown**: `analyzeBudget()` with observed-vs-estimated comparison
- **CLI**: `ai-loadout` command with `usage`, `dead`, `overlaps`, `budget` subcommands
- All commands support `--json` output for scripting
- 23 new tests (usage + analysis), 63 total

## 1.1.0 — 2026-03-06

- **MatchResult enrichment**: `reason` (human-readable explanation) and `mode` (eager/lazy/manual)
- **Merge semantics**: `mergeIndexes()` for hierarchical loadouts (global → org → project → task)
- **MergedIndex** with provenance tracking and conflict reporting
- **UsageEvent** schema for local-only observability
- **lazyLoad** flag on `LoadoutIndex` for demand-paged context
- **LoadMode** type (`eager | lazy | manual`)
- **SPEC.md**: Full specification document
- 8 new tests (merge), 40 total

## 1.0.3 — 2026-03-06

- Brand logo URL (mcp-tool-shop-org/brand)
- Code coverage via c8 + Codecov badge
- Translations re-done via polyglot-mcp (TranslateGemma 12B)
- SHIP_GATE.md and SCORECARD.md (shipcheck audit: 100% pass)
- dependabot.yml (monthly, grouped)
- .gitignore: site/.astro/, site/dist/, .polyglot-cache.json

## 1.0.2 — 2026-03-06

- Shipcheck gates added (SHIP_GATE.md, SCORECARD.md)
- dependabot.yml

## 1.0.1 — 2026-03-06

- Add `hint` field to `ValidationIssue` (Tier 1 error shape compliance)
- Add hints to key validation issues (MISSING_ID, MISSING_PATH, EMPTY_KEYWORDS)
- Add SECURITY.md with threat model
- Expand README security section with threat model table
- Add logo
- Include SECURITY.md and logo.png in npm package

## 1.0.0 — 2026-03-06

Initial release.

- `LoadoutIndex` schema — dispatch table for agent knowledge
- `parseFrontmatter()` / `serializeFrontmatter()` — payload file metadata
- `matchLoadout()` — deterministic keyword + pattern matcher
- `lookupEntry()` — explicit entry lookup by ID
- `validateIndex()` — structural linter for index integrity
- `estimateTokens()` — chars/4 heuristic for budget dashboards
- Three priority tiers: core / domain / manual
- Trigger phases: task / plan / edit
- Zero production dependencies
