// ── Types ──────────────────────────────────────────────────────
export type {
  Priority,
  Triggers,
  LoadoutEntry,
  Budget,
  LoadoutIndex,
  Frontmatter,
  MatchResult,
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
