# Changelog

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
