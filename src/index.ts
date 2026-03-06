// ── Types ──────────────────────────────────────────────────────
export type {
  Priority,
  Triggers,
  LoadMode,
  LoadoutEntry,
  Budget,
  LoadoutIndex,
  Frontmatter,
  MatchResult,
  UsageEvent,
  MergeConflict,
  MergedIndex,
  IssueSeverity,
  ValidationIssue,
} from "./types.js";

export { DEFAULT_TRIGGERS } from "./types.js";

// ── Frontmatter ────────────────────────────────────────────────
export { parseFrontmatter, serializeFrontmatter } from "./frontmatter.js";

// ── Tokens ─────────────────────────────────────────────────────
export { estimateTokens } from "./tokens.js";

// ── Matcher ────────────────────────────────────────────────────
export { matchLoadout, lookupEntry } from "./match.js";

// ── Validator ──────────────────────────────────────────────────
export { validateIndex } from "./validate.js";

// ── Merge ─────────────────────────────────────────────────────
export { mergeIndexes } from "./merge.js";
