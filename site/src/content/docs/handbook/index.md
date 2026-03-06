---
title: Handbook
description: Everything you need to know about AI Loadout.
sidebar:
  order: 0
---

Welcome to the AI Loadout handbook. This is the complete guide to using the dispatch table format, matching engine, and frontmatter spec.

## What's inside

- **[Getting Started](/ai-loadout/handbook/getting-started/)** — Install and first use
- **[Concepts](/ai-loadout/handbook/concepts/)** — Dispatch tables, priorities, triggers, and budgets
- **[API Reference](/ai-loadout/handbook/reference/)** — Every export documented
- **[Security](/ai-loadout/handbook/security/)** — Attack surface and threat model

## What is AI Loadout?

AI Loadout is a context-aware knowledge router for AI agents. Instead of dumping entire instruction files into context every session, you keep a tiny dispatch table (always loaded) and route to topic-specific payloads on demand.

Think of it like a game loadout — you equip the agent with exactly the knowledge it needs before each mission.

The library provides:
- A **dispatch table format** (`LoadoutIndex`) for structuring knowledge
- A **keyword + pattern matcher** for routing tasks to payloads
- A **frontmatter spec** for embedding routing metadata in payload files
- A **structural validator** for catching broken indexes early
- A **token estimator** for budget dashboards

Zero dependencies. Pure TypeScript. Works anywhere Node 20+ runs.

[Back to landing page](/ai-loadout/)
