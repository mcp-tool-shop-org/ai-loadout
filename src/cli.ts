#!/usr/bin/env node

/**
 * ai-loadout CLI.
 *
 * Commands:
 *   usage <jsonl>             — Usage summary from event log
 *   dead <index> <jsonl>      — Find entries never loaded
 *   overlaps <index>          — Find keyword routing ambiguities
 *   budget <index> [jsonl]    — Token budget breakdown
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { LoadoutIndex } from "./types.js";
import { readUsage, summarizeUsage } from "./usage.js";
import { findDeadEntries, findKeywordOverlaps, analyzeBudget } from "./analysis.js";

// ── Colors ────────────────────────────────────────────────────
const BOLD = "\x1b[1m";
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const CYAN = "\x1b[36m";
const YELLOW = "\x1b[33m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";

function log(msg: string) { console.log(msg); }
function ok(msg: string) { log(`  ${GREEN}✓${RESET} ${msg}`); }
function warn(msg: string) { log(`  ${YELLOW}!${RESET} ${msg}`); }
function info(msg: string) { log(`  ${CYAN}i${RESET} ${msg}`); }

function fail(code: string, message: string, hint?: string): never {
  console.error(`${RED}✗ [${code}]${RESET} ${message}`);
  if (hint) console.error(`  ${DIM}${hint}${RESET}`);
  process.exit(1);
}

// ── Helpers ───────────────────────────────────────────────────
function hasFlag(args: string[], flag: string): boolean {
  return args.includes(`--${flag}`);
}

function positionalArgs(args: string[]): string[] {
  return args.filter((a) => !a.startsWith("--"));
}

function loadIndex(path: string): LoadoutIndex {
  if (!existsSync(path)) {
    fail("FILE_NOT_FOUND", `Index not found: ${path}`);
  }
  return JSON.parse(readFileSync(path, "utf-8")) as LoadoutIndex;
}

function getVersion(): string {
  try {
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const pkg = JSON.parse(readFileSync(join(__dirname, "..", "package.json"), "utf-8"));
    return pkg.version;
  } catch {
    return "unknown";
  }
}

// ── Help ──────────────────────────────────────────────────────
function printHelp() {
  log(`
${BOLD}ai-loadout${RESET} v${getVersion()} — Knowledge router for AI agents

${BOLD}Usage:${RESET}
  ai-loadout usage <jsonl>              Usage summary from event log
  ai-loadout dead <index> <jsonl>       Find entries never loaded
  ai-loadout overlaps <index>           Find keyword routing ambiguities
  ai-loadout budget <index> [jsonl]     Token budget breakdown

${BOLD}Options:${RESET}
  --json       Output as JSON
  --help       Show this help
  --version    Show version

${BOLD}Examples:${RESET}
  ai-loadout usage .claude/loadout-usage.jsonl
  ai-loadout dead .claude/rules/index.json .claude/loadout-usage.jsonl
  ai-loadout overlaps .claude/rules/index.json
  ai-loadout budget .claude/rules/index.json .claude/loadout-usage.jsonl
`);
}

// ── Commands ──────────────────────────────────────────────────

function cmdUsage(args: string[]) {
  const positional = positionalArgs(args);
  if (positional.length < 1) {
    fail("MISSING_ARG", "Usage: ai-loadout usage <jsonl>");
  }

  const jsonlPath = resolve(positional[0]);
  const events = readUsage(jsonlPath);
  const json = hasFlag(args, "json");

  if (events.length === 0) {
    if (json) { log("[]"); return; }
    info("No usage events found");
    return;
  }

  const summary = summarizeUsage(events);

  if (json) {
    log(JSON.stringify(summary, null, 2));
    return;
  }

  log(`\n${BOLD}Usage Summary${RESET} (${events.length} events)\n`);
  log(`  ${"Entry".padEnd(30)} ${"Loads".padStart(6)} ${"Tokens".padStart(8)}  Last Loaded`);
  log(`  ${"─".repeat(30)} ${"─".repeat(6)} ${"─".repeat(8)}  ${"─".repeat(20)}`);

  for (const s of summary) {
    const date = s.lastLoaded.slice(0, 10);
    log(`  ${s.entryId.padEnd(30)} ${String(s.loadCount).padStart(6)} ${String(s.totalTokens).padStart(8)}  ${date}`);
  }

  log(`\n  Total: ${events.length} loads, ${summary.reduce((s, u) => s + u.totalTokens, 0).toLocaleString()} tokens\n`);
}

function cmdDead(args: string[]) {
  const positional = positionalArgs(args);
  if (positional.length < 2) {
    fail("MISSING_ARG", "Usage: ai-loadout dead <index> <jsonl>");
  }

  const index = loadIndex(resolve(positional[0]));
  const events = readUsage(resolve(positional[1]));
  const dead = findDeadEntries(index, events);
  const json = hasFlag(args, "json");

  if (json) {
    log(JSON.stringify(dead.map((d) => ({
      id: d.entry.id,
      tokens: d.entry.tokens_est,
      reason: d.reason,
    })), null, 2));
    return;
  }

  if (dead.length === 0) {
    ok("No dead entries — all entries have been loaded at least once");
    return;
  }

  log(`\n${BOLD}Dead Entries${RESET} (${dead.length} never loaded)\n`);

  let wastedTokens = 0;
  for (const d of dead) {
    warn(`${d.entry.id} (${d.entry.tokens_est} tokens) — ${d.entry.summary}`);
    wastedTokens += d.entry.tokens_est;
  }

  log(`\n  ${RED}${wastedTokens.toLocaleString()} tokens${RESET} in entries never loaded`);
  log(`  Consider demoting to ${DIM}manual${RESET} priority or removing\n`);
}

function cmdOverlaps(args: string[]) {
  const positional = positionalArgs(args);
  if (positional.length < 1) {
    fail("MISSING_ARG", "Usage: ai-loadout overlaps <index>");
  }

  const index = loadIndex(resolve(positional[0]));
  const overlaps = findKeywordOverlaps(index);
  const json = hasFlag(args, "json");

  if (json) {
    log(JSON.stringify(overlaps, null, 2));
    return;
  }

  if (overlaps.length === 0) {
    ok("No keyword overlaps — routing is unambiguous");
    return;
  }

  log(`\n${BOLD}Keyword Overlaps${RESET} (${overlaps.length} shared keywords)\n`);

  for (const o of overlaps) {
    log(`  ${YELLOW}${o.keyword}${RESET} → ${o.entries.join(", ")}`);
  }

  log(`\n  ${DIM}Shared keywords may cause multiple entries to match the same task.${RESET}`);
  log(`  ${DIM}Consider narrowing keywords or adjusting priorities.${RESET}\n`);
}

function cmdBudget(args: string[]) {
  const positional = positionalArgs(args);
  if (positional.length < 1) {
    fail("MISSING_ARG", "Usage: ai-loadout budget <index> [jsonl]");
  }

  const index = loadIndex(resolve(positional[0]));
  const usage = positional.length >= 2
    ? summarizeUsage(readUsage(resolve(positional[1])))
    : undefined;
  const breakdown = analyzeBudget(index, usage);
  const json = hasFlag(args, "json");

  if (json) {
    log(JSON.stringify(breakdown, null, 2));
    return;
  }

  log(`\n${BOLD}Token Budget Breakdown${RESET}\n`);
  log("  ╭──────────────────────────────────────╮");
  log(`  │  Total:    ${String(breakdown.totalTokens.toLocaleString()).padStart(10)} tokens       │`);
  log("  ├──────────────────────────────────────┤");
  log(`  │  Core:     ${String(breakdown.coreTokens.toLocaleString()).padStart(10)} tokens  (${String(breakdown.coreEntries).padStart(2)} entries) │`);
  log(`  │  Domain:   ${String(breakdown.domainTokens.toLocaleString()).padStart(10)} tokens  (${String(breakdown.domainEntries).padStart(2)} entries) │`);
  log(`  │  Manual:   ${String(breakdown.manualTokens.toLocaleString()).padStart(10)} tokens  (${String(breakdown.manualEntries).padStart(2)} entries) │`);
  log("  ╰──────────────────────────────────────╯");

  if (breakdown.domainEntries > 0) {
    log(`\n  Avg domain entry:  ${breakdown.avgDomainSize.toLocaleString()} tokens`);
  }
  if (breakdown.largestEntry) {
    log(`  Largest entry:     ${breakdown.largestEntry.id} (${breakdown.largestEntry.tokens.toLocaleString()} tokens)`);
  }
  if (breakdown.smallestEntry) {
    log(`  Smallest entry:    ${breakdown.smallestEntry.id} (${breakdown.smallestEntry.tokens.toLocaleString()} tokens)`);
  }
  if (breakdown.observedAvg !== null) {
    log(`\n  ${GREEN}Observed avg load:${RESET}  ${breakdown.observedAvg.toLocaleString()} tokens/load`);
    log(`  ${DIM}(from usage telemetry)${RESET}`);
  }
  log("");
}

// ── Main ──────────────────────────────────────────────────────
const args = process.argv.slice(2);

if (hasFlag(args, "version")) {
  log(getVersion());
  process.exit(0);
}

if (hasFlag(args, "help") || args.length === 0) {
  printHelp();
  process.exit(0);
}

const cmd = args[0];
const cmdArgs = args.slice(1);

switch (cmd) {
  case "usage":
    cmdUsage(cmdArgs);
    break;
  case "dead":
    cmdDead(cmdArgs);
    break;
  case "overlaps":
    cmdOverlaps(cmdArgs);
    break;
  case "budget":
    cmdBudget(cmdArgs);
    break;
  default:
    fail("UNKNOWN_COMMAND", `Unknown command: ${cmd}`, "Run ai-loadout --help for usage");
}
