<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.md">English</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/ai-loadout/readme.png" width="400" alt="ai-loadout">
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/ai-loadout/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/ai-loadout/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://codecov.io/gh/mcp-tool-shop-org/ai-loadout"><img src="https://codecov.io/gh/mcp-tool-shop-org/ai-loadout/graph/badge.svg" alt="Coverage"></a>
  <a href="https://www.npmjs.com/package/@mcptoolshop/ai-loadout"><img src="https://img.shields.io/npm/v/@mcptoolshop/ai-loadout" alt="npm"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/ai-loadout/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

Routeur de connaissances contextuel pour les agents d'IA.

`ai-loadout` est le format de table de répartition et le moteur de correspondance qui permet aux agents d'IA de charger les connaissances appropriées pour la tâche en cours. Au lieu de tout inclure dans le contexte, vous conservez un index minimal et chargez les données à la demande.

Considérez cela comme une configuration de jeu : vous équipez l'agent des connaissances dont il a strictement besoin avant chaque mission.

## Installation

```bash
npm install @mcptoolshop/ai-loadout
```

## Concepts clés

### La table de répartition

Un `LoadoutIndex` est un index structuré des données de connaissances :

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

### Niveaux de priorité

| Niveau | Comportement | Exemple |
|------|----------|---------|
| `core` | Toujours chargé | "Ne jamais ignorer les tests pour que l'intégration continue soit réussie" |
| `domain` | Chargé lorsque les mots-clés de la tâche correspondent | Règles d'intégration continue lors de la modification des flux de travail |
| `manual` | Jamais chargé automatiquement, recherche explicite uniquement | Détails spécifiques à certaines plateformes |

### Métadonnées du fichier de données

Chaque fichier de données contient ses propres métadonnées de routage :

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

Les métadonnées sont la source de vérité. L'index est dérivé de celles-ci.

## API

### `matchLoadout(tâche, index)`

Fait correspondre une description de tâche à un index de configuration. Renvoie les entrées qui doivent être chargées, classées par force de correspondance.

```typescript
import { matchLoadout } from "@mcptoolshop/ai-loadout";

const results = matchLoadout("fix the CI workflow", index);
// [{ entry: { id: "github-actions", ... }, score: 0.67, matchedKeywords: ["ci", "workflow"] }]
```

- Les entrées principales sont toujours incluses (score de 1,0)
- Les entrées manuelles ne sont jamais incluses automatiquement
- Les entrées spécifiques à un domaine sont notées en fonction du chevauchement des mots-clés et d'un bonus de motif
- Les résultats sont triés par score décroissant

### `lookupEntry(id, index)`

Recherche une entrée spécifique par ID. Pour les entrées manuelles ou l'accès explicite.

```typescript
import { lookupEntry } from "@mcptoolshop/ai-loadout";

const entry = lookupEntry("github-actions", index);
```

### `parseFrontmatter(contenu)`

Analyse les métadonnées au format YAML d'un fichier de données.

```typescript
import { parseFrontmatter } from "@mcptoolshop/ai-loadout";

const { frontmatter, body } = parseFrontmatter(fileContent);
if (frontmatter) {
  console.log(frontmatter.id, frontmatter.keywords);
}
```

### `serializeFrontmatter(fm)`

Série les métadonnées d'un objet `Frontmatter` en une chaîne de caractères.

### `validateIndex(index)`

Valide l'intégrité structurelle d'un `LoadoutIndex`. Renvoie un tableau de problèmes.

```typescript
import { validateIndex } from "@mcptoolshop/ai-loadout";

const issues = validateIndex(index);
const errors = issues.filter(i => i.severity === "error");
if (errors.length > 0) {
  console.error("Index has errors:", errors);
}
```

Vérifications : champs obligatoires, ID uniques, format kebab-case, limites du résumé, présence de mots-clés pour les entrées de domaine, priorités valides, budgets non négatifs.

### `estimateTokens(texte)`

Estime le nombre de jetons à partir d'un texte. Utilise l'heuristique chars/4.

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

- **[@mcptoolshop/claude-rules](https://github.com/mcp-tool-shop-org/claude-rules)** — Optimiseur CLAUDE.md pour Claude Code. Utilise ai-loadout pour la table de répartition et la correspondance.

## Sécurité

Ce paquet est une bibliothèque de données pure. Il n'accède pas au système de fichiers, ne fait pas de requêtes réseau ni ne collecte de données télémétriques. Toutes les opérations d'entrée/sortie sont de la responsabilité du consommateur.

### Modèle de menace

| Menace | Atténuation |
|--------|------------|
| Métadonnées corrompues | `parseFrontmatter()` renvoie `null` en cas d'entrée invalide, sans exceptions ni évaluation de code. |
| Pollution de prototype | L'analyseur personnalisé utilise des littéraux d'objets simples, sans `JSON.parse` de structures imbriquées non fiables. |
| Index avec des données incorrectes | `validateIndex()` détecte les problèmes structurels avant qu'ils ne se propagent. |
| Attaque par regex DoS | Aucune expression régulière fournie par l'utilisateur, les motifs sont correspondés comme des recherches de chaînes simples. |

Consultez [SECURITY.md](SECURITY.md) pour la politique de sécurité complète.

---

Développé par [MCP Tool Shop](https://mcp-tool-shop.github.io/)
