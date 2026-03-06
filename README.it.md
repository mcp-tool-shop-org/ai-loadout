<p align="center">
  <a href="README.md">English</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a> | <a href="README.ja.md">日本語</a>
</p>

<p align="center">
  <img src="logo.png" width="400" alt="ai-loadout">
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/ai-loadout/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/ai-loadout/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://www.npmjs.com/package/@mcptoolshop/ai-loadout"><img src="https://img.shields.io/npm/v/@mcptoolshop/ai-loadout" alt="npm"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="Licenza MIT"></a>
</p>

Router di conoscenza contestuale per agenti IA.

`ai-loadout` e il formato della tabella di dispatch e il motore di corrispondenza che permette agli agenti IA di caricare la conoscenza giusta per il compito in questione. Invece di scaricare tutto nel contesto, mantieni un piccolo indice e carichi i contenuti su richiesta.

Pensalo come un equipaggiamento da videogioco — equipaggi l'agente con esattamente la conoscenza di cui ha bisogno prima di ogni missione.

## Installazione

```bash
npm install @mcptoolshop/ai-loadout
```

## Concetti Fondamentali

### La Tabella di Dispatch

Un `LoadoutIndex` e un indice strutturato di contenuti di conoscenza:

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

### Livelli di Priorita

| Livello | Comportamento | Esempio |
|---------|--------------|---------|
| `core` | Sempre caricato | "non saltare mai i test per far passare la CI" |
| `domain` | Caricato quando le parole chiave del compito corrispondono | Regole CI durante la modifica dei workflow |
| `manual` | Mai caricato automaticamente, solo consultazione esplicita | Problemi oscuri della piattaforma |

### Frontmatter del Contenuto

Ogni file di contenuto porta i propri metadati di routing:

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

Il frontmatter e la fonte di verita. L'indice ne e derivato.

## API

### `matchLoadout(task, index)`

Confronta una descrizione del compito con un indice di loadout. Restituisce le voci che devono essere caricate, ordinate per forza di corrispondenza.

```typescript
import { matchLoadout } from "@mcptoolshop/ai-loadout";

const results = matchLoadout("fix the CI workflow", index);
// [{ entry: { id: "github-actions", ... }, score: 0.67, matchedKeywords: ["ci", "workflow"] }]
```

- Le voci core sono sempre incluse (punteggio 1.0)
- Le voci manual non sono mai incluse automaticamente
- Le voci domain sono valutate per sovrapposizione di parole chiave + bonus di pattern
- I risultati sono ordinati per punteggio decrescente

### `lookupEntry(id, index)`

Cerca una voce specifica per ID. Per voci manuali o accesso esplicito.

```typescript
import { lookupEntry } from "@mcptoolshop/ai-loadout";

const entry = lookupEntry("github-actions", index);
```

### `parseFrontmatter(content)`

Analizza il frontmatter di tipo YAML da un file di contenuto.

```typescript
import { parseFrontmatter } from "@mcptoolshop/ai-loadout";

const { frontmatter, body } = parseFrontmatter(fileContent);
if (frontmatter) {
  console.log(frontmatter.id, frontmatter.keywords);
}
```

### `serializeFrontmatter(fm)`

Serializza un oggetto `Frontmatter` di nuovo in stringa.

### `validateIndex(index)`

Valida l'integrita strutturale di un `LoadoutIndex`. Restituisce un array di problemi.

```typescript
import { validateIndex } from "@mcptoolshop/ai-loadout";

const issues = validateIndex(index);
const errors = issues.filter(i => i.severity === "error");
if (errors.length > 0) {
  console.error("Index has errors:", errors);
}
```

Verifica: campi obbligatori, ID univoci, formato kebab-case, limiti del riepilogo, presenza di parole chiave per voci domain, priorita valide, budget non negativi.

### `estimateTokens(text)`

Stima il conteggio dei token da un testo. Usa l'euristica caratteri/4.

```typescript
import { estimateTokens } from "@mcptoolshop/ai-loadout";

const tokens = estimateTokens(fileContent); // ~250
```

## Tipi

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

## Consumatori

- **[@mcptoolshop/claude-rules](https://github.com/mcp-tool-shop-org/claude-rules)** — Ottimizzatore di CLAUDE.md per Claude Code. Usa ai-loadout per la tabella di dispatch e la corrispondenza.

## Sicurezza

Questo pacchetto e una libreria di dati pura. Non accede al filesystem, non effettua richieste di rete e non raccoglie telemetria. Tutto l'I/O e responsabilita del consumatore.

### Modello di Minaccia

| Minaccia | Mitigazione |
|----------|-------------|
| Input frontmatter malformato | `parseFrontmatter()` restituisce `null` su input non valido — nessuna eccezione, nessun eval |
| Inquinamento del prototipo | Il parser manuale usa letterali di oggetto semplici, nessun `JSON.parse` di strutture annidate non fidate |
| Indice con dati errati | `validateIndex()` rileva problemi strutturali prima che si propaghino |
| DoS da Regex | Nessuna regex fornita dall'utente — i pattern vengono confrontati come ricerche di testo semplice |

Consulta [SECURITY.md](SECURITY.md) per la politica di sicurezza completa.

---

Creato da [MCP Tool Shop](https://mcp-tool-shop.github.io/)
