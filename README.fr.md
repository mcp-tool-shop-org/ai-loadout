<p align="center">
  <a href="README.md">English</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a> | <a href="README.ja.md">日本語</a>
</p>

<p align="center">
  <img src="logo.png" width="400" alt="ai-loadout">
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/ai-loadout/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/ai-loadout/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://www.npmjs.com/package/@mcptoolshop/ai-loadout"><img src="https://img.shields.io/npm/v/@mcptoolshop/ai-loadout" alt="npm"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="Licence MIT"></a>
</p>

Routeur de connaissances contextuel pour agents IA.

`ai-loadout` est le format de table de dispatch et le moteur de correspondance qui permet aux agents IA de charger les bonnes connaissances pour la tache en cours. Au lieu de tout charger dans le contexte, vous gardez un petit index et chargez les contenus a la demande.

Pensez-y comme un equipement de jeu video — vous equipez l'agent avec exactement les connaissances dont il a besoin avant chaque mission.

## Installation

```bash
npm install @mcptoolshop/ai-loadout
```

## Concepts Fondamentaux

### La Table de Dispatch

Un `LoadoutIndex` est un index structure de contenus de connaissances :

```json
{
  "version": "1.0.0",
  "generated": "2026-03-06T12:00:00Z",
  "entries": [
    {
      "id": "github-actions",
      "path": ".rules/github-actions.md",
      "keywords": ["ci", "workflow", "runner"],
      "patterns": ["ci_pipeline"],
      "priority": "domain",
      "summary": "CI triggers, path gating, runner cost control",
      "triggers": { "task": true, "plan": true, "edit": false },
      "tokens_est": 680,
      "lines": 56
    }
  ],
  "budget": {
    "always_loaded_est": 320,
    "on_demand_total_est": 8100,
    "avg_task_load_est": 520,
    "avg_task_load_observed": null
  }
}
```

### Niveaux de Priorite

| Niveau | Comportement | Exemple |
|--------|-------------|---------|
| `core` | Toujours charge | "ne jamais ignorer les tests pour faire passer la CI" |
| `domain` | Charge quand les mots-cles de la tache correspondent | Regles CI lors de l'edition de workflows |
| `manual` | Jamais charge automatiquement, consultation explicite uniquement | Problemes obscurs de plateforme |

### Frontmatter du Contenu

Chaque fichier de contenu porte ses propres metadonnees de routage :

```markdown
---
id: github-actions
keywords: [ci, workflow, runner, dependabot]
patterns: [ci_pipeline]
priority: domain
triggers:
  task: true
  plan: true
  edit: false
---

# GitHub Actions Rules
CI minutes are finite...
```

Le frontmatter est la source de verite. L'index en est derive.

## API

### `matchLoadout(task, index)`

Compare une description de tache avec un index de loadout. Retourne les entrees qui doivent etre chargees, classees par force de correspondance.

```typescript
import { matchLoadout } from "@mcptoolshop/ai-loadout";

const results = matchLoadout("fix the CI workflow", index);
// [{ entry: { id: "github-actions", ... }, score: 0.67, matchedKeywords: ["ci", "workflow"] }]
```

- Les entrees core sont toujours incluses (score 1.0)
- Les entrees manual ne sont jamais incluses automatiquement
- Les entrees domain sont notees par chevauchement de mots-cles + bonus de patron
- Les resultats sont tries par score decroissant

### `lookupEntry(id, index)`

Recherche une entree specifique par ID. Pour les entrees manuelles ou l'acces explicite.

```typescript
import { lookupEntry } from "@mcptoolshop/ai-loadout";

const entry = lookupEntry("github-actions", index);
```

### `parseFrontmatter(content)`

Analyse le frontmatter de type YAML d'un fichier de contenu.

```typescript
import { parseFrontmatter } from "@mcptoolshop/ai-loadout";

const { frontmatter, body } = parseFrontmatter(fileContent);
if (frontmatter) {
  console.log(frontmatter.id, frontmatter.keywords);
}
```

### `serializeFrontmatter(fm)`

Serialise un objet `Frontmatter` en chaine de caracteres.

### `validateIndex(index)`

Valide l'integrite structurelle d'un `LoadoutIndex`. Retourne un tableau de problemes.

```typescript
import { validateIndex } from "@mcptoolshop/ai-loadout";

const issues = validateIndex(index);
const errors = issues.filter(i => i.severity === "error");
if (errors.length > 0) {
  console.error("Index has errors:", errors);
}
```

Verifie : champs requis, IDs uniques, format kebab-case, limites de resume, presence de mots-cles pour les entrees domain, priorites valides, budgets non negatifs.

### `estimateTokens(text)`

Estime le nombre de tokens d'un texte. Utilise l'heuristique caracteres/4.

```typescript
import { estimateTokens } from "@mcptoolshop/ai-loadout";

const tokens = estimateTokens(fileContent); // ~250
```

## Types

```typescript
import type {
  LoadoutEntry,
  LoadoutIndex,
  Frontmatter,
  MatchResult,
  ValidationIssue,
  Priority,       // "core" | "domain" | "manual"
  Triggers,       // { task, plan, edit }
  Budget,
} from "@mcptoolshop/ai-loadout";
```

## Consommateurs

- **[@mcptoolshop/claude-rules](https://github.com/mcp-tool-shop-org/claude-rules)** — Optimiseur de CLAUDE.md pour Claude Code. Utilise ai-loadout pour la table de dispatch et la correspondance.

## Securite

Ce paquet est une bibliotheque de donnees pure. Il n'accede pas au systeme de fichiers, ne fait pas de requetes reseau et ne collecte pas de telemetrie. Toutes les operations d'E/S sont de la responsabilite du consommateur.

### Modele de Menaces

| Menace | Attenuation |
|--------|-------------|
| Entree de frontmatter malformee | `parseFrontmatter()` retourne `null` sur une entree invalide — pas d'exceptions, pas d'eval |
| Pollution de prototype | Le parser manuel utilise des litteraux d'objet simples, pas de `JSON.parse` de structures imbriquees non fiables |
| Index avec des donnees incorrectes | `validateIndex()` detecte les problemes structurels avant qu'ils ne se propagent |
| DoS par Regex | Pas de regex fournie par l'utilisateur — les patrons sont compares comme des recherches de texte brut |

Consultez [SECURITY.md](SECURITY.md) pour la politique de securite complete.

---

Cree par [MCP Tool Shop](https://mcp-tool-shop.github.io/)
