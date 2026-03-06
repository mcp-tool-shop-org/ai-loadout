# Changelog

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
