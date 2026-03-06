---
title: Security
description: Attack surface analysis and threat model for AI Loadout.
sidebar:
  order: 4
---

## Attack Surface

AI Loadout is a pure data library with near-zero attack surface:

- **No filesystem access** — does not read or write files
- **No network access** — makes no HTTP requests, opens no sockets
- **No code execution** — no `eval`, `Function()`, or dynamic imports
- **No telemetry** — collects and transmits nothing
- **No native dependencies** — pure TypeScript, zero production deps

All I/O is the consumer's responsibility.

## Threat Model

| Threat | Mitigation |
|--------|------------|
| Malformed frontmatter input | `parseFrontmatter()` returns `null` on invalid input — no exceptions, no eval |
| Prototype pollution | Hand-rolled parser uses plain object literals, no recursive merge |
| Index with bad data | `validateIndex()` catches structural issues with hints before they propagate |
| Regex DoS | No user-supplied regex — patterns are matched as plain string lookups |

## Reporting a Vulnerability

If you discover a security issue, please email **64996768+mcp-tool-shop@users.noreply.github.com** with:

- Description of the vulnerability
- Steps to reproduce
- Impact assessment

We will respond within 7 days and aim to release a fix within 14 days for confirmed issues.
