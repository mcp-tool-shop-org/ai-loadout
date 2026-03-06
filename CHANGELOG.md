# Changelog

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
